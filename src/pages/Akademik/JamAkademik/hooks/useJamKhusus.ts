import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { restClient } from "@/lib/api/axios";
import { toast } from "sonner";

export interface JamKhususConfig {
  id: string; // unique id (e.g. uuid or timestamp)
  lembaga_id: number;
  hari: string; // 'Senin', 'Selasa', dll
  urutan_jam: number;
  tipe: 'Belajar' | 'Istirahat' | 'Sholat Dhuha & Halaqoh' | 'Apel' | 'Mapel Pilihan / Bimbingan TKA' | 'Bonding / Life Skill';
}

const STORAGE_KEY = "MLMS_JAM_KHUSUS_CONFIG";

const filterKamisMax5 = (items: JamKhususConfig[]) =>
  items.filter(item => !(item.hari === "Kamis" && Number(item.urutan_jam) > 5));

export const useJamKhusus = (activeLembagaId: number | null, userLembagaId?: number | null, isDirector?: boolean) => {
  const queryClient = useQueryClient();
  const [dataJamKhusus, setDataJamKhusus] = useState<JamKhususConfig[]>([]);
  const [hasKhususChanges, setHasKhususChanges] = useState(false);

  // States untuk Modal Pemindaian Progress
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStats, setScanStats] = useState({ current: 0, total: 0 });
  const [isScanCompleted, setIsScanCompleted] = useState(false);
  const [scanFoundItems, setScanFoundItems] = useState<JamKhususConfig[]>([]);

  // 1. Fetch Jam Khusus yang tersimpan di kolom ruangan pada database (OVERRIDE_TIPE:...)
  const { data: dbJamKhusus = [] } = useQuery({
    queryKey: ['akademik', 'jam-khusus-db'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        const response = await restClient.get('/jadwal_pelajaran', {
          params: {
            select: 'ruangan,hari,kelas(lembaga_id),jam_mulai:jam_akademik!jam_mulai_id(urutan_jam)',
            ruangan: 'ilike.OVERRIDE_TIPE:*'
          }
        });
        const raw = response.data || [];
        const map = new Map<string, JamKhususConfig>();

        for (const item of raw) {
          if (!item.ruangan || !item.ruangan.startsWith('OVERRIDE_TIPE:')) continue;
          const tipe = item.ruangan.replace('OVERRIDE_TIPE:', '') as any;
          const kelasObj = Array.isArray(item.kelas) ? item.kelas[0] : item.kelas;
          const jamMulaiObj = Array.isArray(item.jam_mulai) ? item.jam_mulai[0] : item.jam_mulai;
          const lembagaId = kelasObj?.lembaga_id;
          const hari = item.hari;
          const urutanJam = jamMulaiObj?.urutan_jam;

          if (lembagaId && hari && urutanJam) {
            if (hari === "Kamis" && Number(urutanJam) > 5) continue;
            const key = `${lembagaId}_${hari}_${urutanJam}`;
            if (!map.has(key)) {
              map.set(key, {
                id: key,
                lembaga_id: Number(lembagaId),
                hari,
                urutan_jam: Number(urutanJam),
                tipe
              });
            }
          }
        }
        return Array.from(map.values());
      } catch (e) {
        console.error("Gagal sinkronisasi Jam Khusus dari database:", e);
        return [];
      }
    }
  });

  // 2. Sinkronkan data database ke local state dan localStorage jika tidak sedang ada draft uncommitted
  useEffect(() => {
    if (!hasKhususChanges) {
      if (dbJamKhusus.length > 0) {
        const cleaned = filterKamisMax5(dbJamKhusus);
        setDataJamKhusus(cleaned);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        } catch (e) {
          console.error("Gagal simpan sync Jam Khusus ke localStorage", e);
        }
      } else {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            const cleaned = filterKamisMax5(parsed);
            setDataJamKhusus(cleaned);
          }
        } catch (e) {
          console.error("Gagal membaca Jam Khusus dari localStorage", e);
        }
      }
    }
  }, [dbJamKhusus, hasKhususChanges]);

  const saveToStorage = (newData: JamKhususConfig[], markChanged = true) => {
    const cleaned = filterKamisMax5(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    setDataJamKhusus(cleaned);
    if (markChanged) setHasKhususChanges(true);
  };

  const resetKhususChanges = useCallback(() => {
    setHasKhususChanges(false);
  }, []);

  const getForLembaga = (lembagaId: number) => {
    return dataJamKhusus.filter(item => Number(item.lembaga_id) === Number(lembagaId));
  };

  const currentLembagaData = activeLembagaId ? getForLembaga(activeLembagaId) : dataJamKhusus;

  const addJamKhusus = (payload: Omit<JamKhususConfig, "id">) => {
    if (payload.hari === "Kamis" && payload.urutan_jam > 5) {
      toast.error("Gagal: Hari Kamis maksimal hanya sampai jam ke-5.");
      return false;
    }

    // Validasi duplikasi (tidak boleh ada 2 jam khusus untuk hari & urutan yang sama di lembaga yang sama)
    const isDuplicate = dataJamKhusus.some(
      item => 
        Number(item.lembaga_id) === Number(payload.lembaga_id) && 
        item.hari === payload.hari && 
        item.urutan_jam === payload.urutan_jam
    );
    
    if (isDuplicate) {
      toast.error(`Gagal: Jam khusus untuk hari ${payload.hari} pada urutan jam ke-${payload.urutan_jam} sudah ada.`);
      return false;
    }

    const newConfig: JamKhususConfig = {
      ...payload,
      id: `${payload.lembaga_id}_${payload.hari}_${payload.urutan_jam}`
    };
    saveToStorage([...dataJamKhusus, newConfig]);
    toast.success("Jam khusus berhasil ditambahkan (Tersimpan sementara di browser)");
    return true;
  };

  const updateJamKhusus = (id: string, payload: Omit<JamKhususConfig, "id">) => {
    if (payload.hari === "Kamis" && payload.urutan_jam > 5) {
      toast.error("Gagal: Hari Kamis maksimal hanya sampai jam ke-5.");
      return false;
    }

    const isDuplicate = dataJamKhusus.some(
      item => 
        item.id !== id &&
        Number(item.lembaga_id) === Number(payload.lembaga_id) && 
        item.hari === payload.hari && 
        item.urutan_jam === payload.urutan_jam
    );
    
    if (isDuplicate) {
      toast.error(`Gagal: Jam khusus untuk hari ${payload.hari} pada urutan jam ke-${payload.urutan_jam} sudah ada.`);
      return false;
    }

    const updated = dataJamKhusus.map(item => item.id === id ? { ...payload, id } : item);
    saveToStorage(updated);
    toast.success("Jam khusus berhasil diperbarui");
    return true;
  };

  const deleteJamKhusus = (id: string) => {
    const updated = dataJamKhusus.filter(item => item.id !== id);
    saveToStorage(updated);
    toast.success("Jam khusus berhasil dihapus");
    return true;
  };

  // Fungsi pemindaian menyeluruh ke database per kelas dengan progress bar
  const startScanFromDatabase = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setIsScanCompleted(false);
    setScanFoundItems([]);

    try {
      setScanStats({ current: 0, total: 1 });
      setScanProgress(20);

      // Satu request langsung — filter jadwal_pelajaran dengan ruangan OVERRIDE_TIPE
      // dan batasi by lembaga (via kelas embed) untuk non-Direktur
      const params: any = {
        select: 'ruangan,hari,kelas_id,kelas(lembaga_id),jam_mulai:jam_akademik!jam_mulai_id(urutan_jam)',
        ruangan: 'ilike.OVERRIDE_TIPE:*',
      };
      if (!isDirector && userLembagaId) {
        params['kelas.lembaga_id'] = `eq.${userLembagaId}`;
      }

      const response = await restClient.get('/jadwal_pelajaran', { params });
      setScanProgress(80);

      const rows = response.data || [];
      const map = new Map<string, JamKhususConfig>();

      for (const item of rows) {
        if (!item.ruangan || !item.ruangan.startsWith('OVERRIDE_TIPE:')) continue;
        const tipe = item.ruangan.replace('OVERRIDE_TIPE:', '') as any;
        const kelasObj = Array.isArray(item.kelas) ? item.kelas[0] : item.kelas;
        const jamMulaiObj = Array.isArray(item.jam_mulai) ? item.jam_mulai[0] : item.jam_mulai;
        const lembagaId = kelasObj?.lembaga_id;
        const hari = item.hari;
        const urutanJam = jamMulaiObj?.urutan_jam;

        if (lembagaId && hari && urutanJam) {
          if (hari === "Kamis" && Number(urutanJam) > 5) continue;
          const key = `${lembagaId}_${hari}_${urutanJam}`;
          if (!map.has(key)) {
            map.set(key, {
              id: key,
              lembaga_id: Number(lembagaId),
              hari,
              urutan_jam: Number(urutanJam),
              tipe
            });
          }
        }
      }

      const found = Array.from(map.values());
      setScanFoundItems(found);
      setScanStats({ current: 1, total: 1 });

      if (found.length > 0) {
        saveToStorage(found, false);
      }
      queryClient.invalidateQueries({ queryKey: ['akademik', 'jam-khusus-db'] });

      setScanProgress(100);
      setIsScanCompleted(true);
    } catch (err) {
      console.error("Gagal melakukan pemindaian jam khusus dari database:", err);
      toast.error("Gagal memindai jam khusus dari database");
    } finally {
      setIsScanning(false);
    }
  };

  // Fungsi helper yang akan dipanggil di useJamAkademik saat Terapkan ke Jadwal
  const getOverrideForDayAndHour = (lembagaId: number, hari: string, urutanJam: number) => {
    return dataJamKhusus.find(
      item => Number(item.lembaga_id) === Number(lembagaId) && item.hari === hari && Number(item.urutan_jam) === Number(urutanJam)
    );
  };

  return {
    dataJamKhusus,
    currentLembagaData,
    hasKhususChanges,
    resetKhususChanges,
    addJamKhusus,
    updateJamKhusus,
    deleteJamKhusus,
    getOverrideForDayAndHour,
    // Pemindaian & Progress Modal
    isScanModalOpen,
    setIsScanModalOpen,
    isScanning,
    scanProgress,
    scanStats,
    isScanCompleted,
    scanFoundItems,
    startScanFromDatabase
  };
};
