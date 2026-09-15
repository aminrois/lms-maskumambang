import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useJamKhusus } from "./useJamKhusus";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restClient } from "@/lib/api/axios";
import { createJamAkademik, updateJamAkademik, deleteJamAkademik, createJadwalPelajaran, deleteJadwalPelajaran, updateJadwalPelajaran } from "@/lib/api/services/akademikService";
import { useAuthStore } from "@/store/useAuthStore";
import type { JAM_AKADEMIK_CREATE } from "@/types/database";
import { toast } from "sonner";
import { useFeatureRealtimeSync } from "@/hooks/useRealtimeSync";

export type DraftStatus = "UNCHANGED" | "NEW" | "EDITED" | "DELETED";

export interface JamAkademikUI {
  draftStatus?: DraftStatus;
  draftId?: string;
  id: number;
  lembaga: string;
  lembagaSingkatan?: string;
  urutanJam: number;
  jamMulai: string;
  jamSelesai: string;
  tipe: string;
  raw: any;
}

const HARI_LIST = ["Sabtu", "Ahad", "Senin", "Selasa", "Rabu", "Kamis"] as const;

export const useJamAkademik = () => {
  const [activeTab, setActiveTab] = useState("Semua");
  const queryClient = useQueryClient();

  useFeatureRealtimeSync("AKADEMIK_JAM");

  const role = useAuthStore(state => state.role);
  const userLembagaId = useAuthStore(state => state.lembaga_id);
  const isWakaKurikulum = role === "WaKa Kurikulum";
  const isDirector = role === "Direktur";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTerapkanModalOpen, setIsTerapkanModalOpen] = useState(false);
  const [isUnsavedWarningModalOpen, setIsUnsavedWarningModalOpen] = useState(false);
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null);
  const [jamToDelete, setJamToDelete] = useState<JamAkademikUI | null>(null);
  const [selectedData, setSelectedData] = useState<JamAkademikUI | null>(null);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState<JAM_AKADEMIK_CREATE>({
    lembaga_id: 0,
    urutan_jam: 1,
    jam_mulai: "07:00",
    jam_selesai: "07:45",
    tipe: "Belajar"
  });

  const [localDrafts, setLocalDrafts] = useState<JamAkademikUI[]>([]);

  const hasUnsavedChanges = useMemo(() => {
    return localDrafts.some(draft => draft.draftStatus && draft.draftStatus !== "UNCHANGED");
  }, [localDrafts]);

  const activeLocalDrafts = useMemo(() => localDrafts.filter(j => j.draftStatus !== "DELETED"), [localDrafts]);

  const [terapkanTahap, setTerapkanTahap] = useState<0 | 1 | 2>(1);
  const [terapkanProgressUmum, setTerapkanProgressUmum] = useState<number>(0);
  const [terapkanStatsUmum, setTerapkanStatsUmum] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [terapkanProgressKhusus, setTerapkanProgressKhusus] = useState<number>(0);
  const [terapkanStatsKhusus, setTerapkanStatsKhusus] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  const { data: dataJam = [], isLoading } = useQuery({
    queryKey: ['akademik', 'jam-akademik'],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      const response = await restClient.get('/jam_akademik', {
        params: {
          select: 'jam_id,lembaga_id,urutan_jam,jam_mulai,jam_selesai,tipe,lembaga(nama_lembaga,singkatan)',
          order: 'lembaga_id.asc,urutan_jam.asc'
        }
      });
      const data = response.data || [];
      return data.map((item: any) => ({
        id: item.jam_id,
        lembaga: item.lembaga?.nama_lembaga || "—",
        lembagaSingkatan: item.lembaga?.singkatan || item.lembaga?.nama_lembaga || "—",
        urutanJam: item.urutan_jam,
        jamMulai: item.jam_mulai.substring(0, 5), // Format HH:mm
        jamSelesai: item.jam_selesai.substring(0, 5),
        tipe: item.tipe,
        raw: item
      })) as JamAkademikUI[];
    }
  });

  // Sync dataJam to localDrafts when there are no unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setLocalDrafts(
        dataJam.map(jam => ({ ...jam, draftStatus: "UNCHANGED" }))
      );
    }
  }, [dataJam, hasUnsavedChanges]);

  // 1. Native beforeunload untuk menahan refresh browser / tutup tab jika ada draft belum tersimpan
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);



  // 2. Intercept navigasi internal (klik menu/sidebar) jika ada draft belum tersimpan
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a, button[data-navigate]');
      if (target) {
        const href = target.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript') && !href.includes('/akademik/jam-akademik')) {
          e.preventDefault();
          e.stopPropagation();
          setPendingNavigationUrl(href);
          setIsUnsavedWarningModalOpen(true);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, [hasUnsavedChanges]);

  const handleConfirmLeave = () => {
    setIsUnsavedWarningModalOpen(false);
    setLocalDrafts(dataJam.map(jam => ({ ...jam, draftStatus: "UNCHANGED" })));
    if (pendingNavigationUrl) {
      navigate(pendingNavigationUrl);
      setPendingNavigationUrl(null);
    }
  };

  const handleTerapkanNowFromWarning = () => {
    setIsUnsavedWarningModalOpen(false);
    setIsTerapkanModalOpen(true);
  };

  const { data: dataLembagaList = [] } = useQuery({
    queryKey: ['master-data', 'lembaga-options'],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      const response = await restClient.get('/lembaga', {
        params: { select: 'lembaga_id,nama_lembaga,singkatan' }
      });
      return response.data || [];
    }
  });

  const jamKhususLembagaId = (() => {
    if (isDirector) {
      if (activeTab === "Semua") return null;
      return dataLembagaList.find((l: any) => l.singkatan === activeTab || l.nama_lembaga === activeTab)?.lembaga_id || null;
    }
    return userLembagaId || (dataLembagaList.length > 0 ? dataLembagaList[0].lembaga_id : null);
  })();
  const jamKhusus = useJamKhusus(jamKhususLembagaId, userLembagaId, isDirector);
  const { hasKhususChanges, resetKhususChanges } = jamKhusus;

  // Query kelas untuk operasi "Terapkan ke Jadwal Kelas"
  const { data: kelasData = [] } = useQuery({
    queryKey: ['master-data', 'kelas-options'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const response = await restClient.get('/kelas', {
        params: { select: 'kelas_id,nama_kelas,lembaga_id', order: 'nama_kelas.asc' }
      });
      return response.data || [];
    }
  });

  // --- Logika perbandingan: apakah jam_akademik berbeda dari jadwal? ---
  const activeLembagaObj = useMemo(() => {
    // Untuk Direktur: gunakan activeTab untuk menentukan lembaga aktif
    if (isDirector) {
      if (activeTab === "Semua") return null;
      return dataLembagaList.find((l: any) =>
        l.singkatan === activeTab || l.nama_lembaga === activeTab
      ) || null;
    }
    // Untuk non-Direktur: gunakan lembaga_id user langsung (tab tidak ditampilkan)
    if (userLembagaId) {
      return dataLembagaList.find((l: any) => l.lembaga_id === userLembagaId) || null;
    }
    // Fallback jika userLembagaId tidak ditemukan di token/store
    if (dataLembagaList.length > 0) {
      return dataLembagaList[0];
    }
    return null;
  }, [activeTab, dataLembagaList, isDirector, userLembagaId]);

  // Query jadwal_pelajaran dengan pagination untuk menghindari limit 1000 baris Supabase
  const { data: jadwalTemplate = [] } = useQuery({
    queryKey: ['akademik', 'jadwal-template', activeLembagaObj?.lembaga_id],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      if (!activeLembagaObj) return [];

      const lembagaId = activeLembagaObj.lembaga_id;
      const kelasForLembaga = kelasData.filter((k: any) => k.lembaga_id === lembagaId);
      if (kelasForLembaga.length === 0) return [];

      const kelasIds = kelasForLembaga.map((k: any) => k.kelas_id);

      const PAGE_SIZE = 1000;
      let allData: any[] = [];
      let page = 0;

      while (true) {
        const response = await restClient.get('/jadwal_pelajaran', {
          params: {
            select: 'jadwal_id,kelas_id,hari,jam_mulai_id,mapel_id',
            kelas_id: `in.(${kelasIds.join(',')})`,
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE,
          }
        });
        const data = response.data || [];
        allData = [...allData, ...data];
        if (data.length < PAGE_SIZE) break;
        page++;
      }

      return allData;
    },
    enabled: !!activeLembagaObj && kelasData.length > 0
  });

  const hasJadwalChanges = useMemo(() => {
    // Jika ada perubahan jam khusus, tombol Terapkan langsung muncul
    if (hasKhususChanges) return true;

    if (hasUnsavedChanges) return true;

    if (!activeLembagaObj) return false;

    const lembagaId = activeLembagaObj.lembaga_id;

    // Set jam_id dari jam_akademik lembaga ini
    const jamForLembaga = activeLocalDrafts.filter(j => j.raw.lembaga_id === lembagaId);
    if (jamForLembaga.length === 0) return false;

    const kelasForLembaga = kelasData.filter((k: any) => k.lembaga_id === lembagaId);
    if (kelasForLembaga.length === 0) return false;

    const jamIds = jamForLembaga.map(j => j.id).sort();
    const jamIdsKamis = jamForLembaga.filter(j => j.urutanJam <= 5).map(j => j.id).sort();

    // Periksa seluruh kelas pada lembaga ini, jika ada 1 kelas saja yang jam-nya belum sesuai/lengkap, kembalikan true
    for (const kelas of kelasForLembaga) {
      // 1. Cek Hari Biasa (Senin)
      const sampleJadwal = jadwalTemplate.filter(
        (j: any) => j.kelas_id === kelas.kelas_id && j.hari === "Senin"
      );
      const jadwalJamIds = sampleJadwal.map((j: any) => j.jam_mulai_id).sort();

      if (jamIds.length !== jadwalJamIds.length) return true;
      for (let i = 0; i < jamIds.length; i++) {
        if (jamIds[i] !== jadwalJamIds[i]) return true;
      }

      // 2. Cek Hari Kamis (maksimal jam ke-5)
      const sampleJadwalKamis = jadwalTemplate.filter(
        (j: any) => j.kelas_id === kelas.kelas_id && j.hari === "Kamis"
      );
      const jadwalJamIdsKamis = sampleJadwalKamis.map((j: any) => j.jam_mulai_id).sort();

      if (jamIdsKamis.length !== jadwalJamIdsKamis.length) return true;
      for (let i = 0; i < jamIdsKamis.length; i++) {
        if (jamIdsKamis[i] !== jadwalJamIdsKamis[i]) return true;
      }
    }

    return false;
  }, [activeLembagaObj, activeLocalDrafts, kelasData, jadwalTemplate, hasUnsavedChanges, hasKhususChanges]);

  // Jumlah kelas dan hari yang akan terdampak (untuk info modal)
  const terapkanInfo = useMemo(() => {
    if (!activeLembagaObj) return { kelasCount: 0, hariCount: HARI_LIST.length, jamCount: 0 };
    const lembagaId = activeLembagaObj.lembaga_id;
    const kelasForLembaga = kelasData.filter((k: any) => k.lembaga_id === lembagaId);
    const jamForLembaga = activeLocalDrafts.filter(j => j.raw.lembaga_id === lembagaId);
    return {
      kelasCount: kelasForLembaga.length,
      hariCount: HARI_LIST.length,
      jamCount: jamForLembaga.length,
      lembagaNama: activeLembagaObj.nama_lembaga || activeLembagaObj.singkatan
    };
  }, [activeLembagaObj, kelasData, activeLocalDrafts]);

  // Mutation untuk "Terapkan ke Jadwal Kelas"
  const terapkanMutation = useMutation({
    meta: { hideGlobalLoader: true },
    mutationFn: async () => {
      if (!activeLembagaObj) throw new Error("Tidak ada lembaga aktif");

      const lembagaId = activeLembagaObj.lembaga_id;
      
      let finalActiveJam = [...activeLocalDrafts];
      
      if (hasUnsavedChanges) {
        setTerapkanTahap(0);
        
        const toDelete = localDrafts.filter(d => d.draftStatus === "DELETED");
        for (const jam of toDelete) {
           await deleteJamAkademik(jam.id);
        }
        
        const toUpdate = localDrafts.filter(d => d.draftStatus === "EDITED");
        for (const jam of toUpdate) {
           const { lembaga, jam_id, draftStatus, draftId, ...cleanPayload } = jam.raw;
           await updateJamAkademik(jam.id, cleanPayload);
        }
        
        const toCreate = localDrafts.filter(d => d.draftStatus === "NEW");
        for (const jam of toCreate) {
           const { lembaga, jam_id, draftStatus, draftId, ...cleanPayload } = jam.raw;
           await createJamAkademik(cleanPayload);
        }

        const freshResponse = await restClient.get('/jam_akademik', {
           params: {
              select: 'jam_id,lembaga_id,urutan_jam,jam_mulai,jam_selesai,tipe,lembaga(nama_lembaga,singkatan)',
              order: 'lembaga_id.asc,urutan_jam.asc'
           }
        });
        const freshData = freshResponse.data || [];
        finalActiveJam = freshData.map((item: any) => ({
           id: item.jam_id,
           lembaga: item.lembaga?.nama_lembaga || "—",
           urutanJam: item.urutan_jam,
           jamMulai: item.jam_mulai.substring(0, 5),
           jamSelesai: item.jam_selesai.substring(0, 5),
           tipe: item.tipe,
           raw: item,
           draftStatus: "UNCHANGED"
        })) as JamAkademikUI[];
      }

      const jamForLembaga = finalActiveJam.filter(j => j.raw.lembaga_id === lembagaId)
        .sort((a, b) => a.urutanJam - b.urutanJam);
      const kelasForLembaga = kelasData.filter((k: any) => k.lembaga_id === lembagaId);

      if (kelasForLembaga.length === 0) throw new Error("Tidak ada kelas untuk lembaga ini");

      const kelasIds = kelasForLembaga.map((k: any) => k.kelas_id);
      const PAGE_SIZE = 1000;
      let freshJadwal: any[] = [];
      let page = 0;

      while (true) {
        const response = await restClient.get('/jadwal_pelajaran', {
          params: {
            select: 'jadwal_id,kelas_id,hari,jam_mulai_id,mapel_id,ruangan',
            kelas_id: `in.(${kelasIds.join(',')})`,
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE,
          }
        });
        const data = response.data || [];
        freshJadwal = [...freshJadwal, ...data];
        if (data.length < PAGE_SIZE) break;
        page++;
      }

      let processedUmum = 0;
      const totalKelasHari = HARI_LIST.length * kelasForLembaga.length;
      setTerapkanTahap(1);
      setTerapkanProgressUmum(0);
      setTerapkanStatsUmum({ current: 0, total: totalKelasHari });
      setTerapkanProgressKhusus(0);
      setTerapkanStatsKhusus({ current: 0, total: 0 });

      // TAHAP 1: Menerapkan Kerangka Jam Umum
      for (const hari of HARI_LIST) {
        for (const kelas of kelasForLembaga) {
          processedUmum++;
          setTerapkanProgressUmum(Math.round((processedUmum / totalKelasHari) * 100));
          setTerapkanStatsUmum({ current: processedUmum, total: totalKelasHari });

          const jamUntukHari = hari === "Kamis"
            ? jamForLembaga.filter(j => j.urutanJam <= 5)
            : jamForLembaga;
          const jamIdsUntukHari = new Set(jamUntukHari.map(j => j.id));

          const existingJadwal = freshJadwal.filter(
            (j: any) => j.kelas_id === kelas.kelas_id && j.hari === hari
          );
          const existingJamIds = new Set(existingJadwal.map((j: any) => j.jam_mulai_id));

          // 1. Hapus jadwal usang (termasuk jam di atas 5 khusus hari Kamis)
          for (const jadwal of existingJadwal) {
            const isInvalidForDay = !jamIdsUntukHari.has(jadwal.jam_mulai_id);
            if (isInvalidForDay && (hari === "Kamis" || !jadwal.mapel_id)) {
              await deleteJadwalPelajaran(jadwal.jadwal_id);
            }
          }

          // 2. Buat jadwal baru atau bersihkan override yang sudah dihapus
          for (const jam of jamUntukHari) {
            const existing = existingJadwal.find((j: any) => j.jam_mulai_id === jam.id);
            const overrideConfig = jamKhusus.getOverrideForDayAndHour(lembagaId, hari, jam.urutanJam);

            if (!existingJamIds.has(jam.id)) {
              try {
                await createJadwalPelajaran({
                  kelas_id: kelas.kelas_id,
                  hari: hari as any,
                  jam_mulai_id: jam.id,
                  jam_selesai_id: jam.id,
                  ruangan: null
                });
              } catch (err: any) {
                const isDuplicate = err?.response?.status === 409 ||
                  err?.response?.data?.code === "23505" ||
                  err?.response?.data?.code === "P2002" ||
                  err?.message?.includes("Unique constraint") ||
                  err?.response?.data?.message?.includes("Unique constraint");
                if (isDuplicate) {
                  console.warn(`Race condition: jadwal sudah ada`);
                } else {
                  throw err;
                }
              }
            } else if (existing && existing.ruangan?.startsWith('OVERRIDE_TIPE:') && !overrideConfig) {
              await updateJadwalPelajaran(existing.jadwal_id, { ruangan: null });
            }
          }
        }
      }

      // TAHAP 2: Menyelipkan Jam Khusus
      setTerapkanTahap(2);
      let processedKhusus = 0;
      const totalKhusus = jamKhusus.currentLembagaData.length * kelasForLembaga.length;
      setTerapkanStatsKhusus({ current: 0, total: totalKhusus });

      if (totalKhusus > 0) {
        page = 0;
        let finalJadwal: any[] = [];
        while (true) {
          const response = await restClient.get('/jadwal_pelajaran', {
            params: {
              select: 'jadwal_id,kelas_id,hari,jam_mulai_id,mapel_id,ruangan',
              kelas_id: `in.(${kelasIds.join(',')})`,
              limit: PAGE_SIZE,
              offset: page * PAGE_SIZE,
            }
          });
          const data = response.data || [];
          finalJadwal = [...finalJadwal, ...data];
          if (data.length < PAGE_SIZE) break;
          page++;
        }

        for (const khusus of jamKhusus.currentLembagaData) {
          const jamUmumReference = jamForLembaga.find(j => j.urutanJam === khusus.urutan_jam);
          if (!jamUmumReference) continue;

          const overrideRuangan = `OVERRIDE_TIPE:${khusus.tipe}`;

          for (const kelas of kelasForLembaga) {
            processedKhusus++;
            setTerapkanProgressKhusus(Math.round((processedKhusus / totalKhusus) * 100));
            setTerapkanStatsKhusus({ current: processedKhusus, total: totalKhusus });

            const targetJadwal = finalJadwal.find(
              (j: any) => j.kelas_id === kelas.kelas_id && j.hari === khusus.hari && j.jam_mulai_id === jamUmumReference.id
            );

            if (targetJadwal && targetJadwal.ruangan !== overrideRuangan) {
              await updateJadwalPelajaran(targetJadwal.jadwal_id, { ruangan: overrideRuangan });
            }
          }
        }
      }
    },
    onSuccess: async () => {
      toast.success("Jam akademik berhasil diterapkan ke seluruh jadwal kelas!");
      await queryClient.invalidateQueries({ queryKey: ['akademik', 'jam-akademik'] });
      queryClient.invalidateQueries({ queryKey: ['akademik', 'jadwal-pelajaran'] });
      queryClient.invalidateQueries({ queryKey: ['akademik', 'jadwal-template'] });
      queryClient.invalidateQueries({ queryKey: ['akademik', 'jam-khusus-db'] });
      setLocalDrafts(dataJam.map(jam => ({ ...jam, draftStatus: "UNCHANGED" })));
      resetKhususChanges();
      setIsTerapkanModalOpen(false);
    },
    onError: (error: any) => {
      console.error("Terapkan error:", error);
      toast.error("Gagal menerapkan jam akademik ke jadwal kelas. Silakan coba lagi.");
    }
  });

  const createMutation = useMutation({
    mutationFn: createJamAkademik,
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['akademik', 'jam-akademik'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      if (error?.response?.status === 409 || error?.message?.includes("duplicate") || error?.response?.data?.message?.includes("jam_akademik_lembaga_id_urutan_jam_key")) {
        toast.error("Gagal: Urutan jam tersebut sudah terpakai di lembaga ini.");
      } else {
        toast.error("Jam akademik gagal disimpan. Periksa kembali isian dan coba lagi.");
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number, payload: any }) => updateJamAkademik(data.id, data.payload),
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['akademik', 'jam-akademik'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      if (error?.response?.status === 409 || error?.message?.includes("duplicate") || error?.response?.data?.message?.includes("jam_akademik_lembaga_id_urutan_jam_key")) {
        toast.error("Gagal: Urutan jam tersebut sudah terpakai di lembaga ini.");
      } else {
        toast.error("Perubahan jam akademik gagal disimpan. Silakan coba lagi.");
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJamAkademik,
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['akademik', 'jam-akademik'] });
    },
    onError: () => {
      toast.error("Jam akademik gagal dihapus. Mungkin sudah digunakan di jadwal pelajaran.");
    }
  });

  // Untuk Direktur: tampilkan semua tab termasuk "Semua"
  // Untuk role lain: hanya tampilkan tab lembaga mereka sendiri (tanpa "Semua")
  const tabs = isDirector
    ? ["Semua", ...dataLembagaList.map((l: any) => l.singkatan || l.nama_lembaga)]
    : dataLembagaList
      .filter((l: any) => !userLembagaId || l.lembaga_id === userLembagaId)
      .map((l: any) => l.singkatan || l.nama_lembaga);

  const filteredData = useMemo(() => {
    if (!isDirector) {
      return userLembagaId
        ? activeLocalDrafts.filter(j => j.raw.lembaga_id === userLembagaId)
        : activeLocalDrafts;
    }

    if (activeTab === "Semua") {
      return activeLocalDrafts;
    }

    const targetLembaga = dataLembagaList.find((l: any) =>
      l.singkatan === activeTab || l.nama_lembaga === activeTab
    );

    if (targetLembaga) {
      return activeLocalDrafts.filter(j => j.raw.lembaga_id === targetLembaga.lembaga_id);
    }

    return activeLocalDrafts.filter(j => j.lembaga === activeTab || j.lembaga.includes(activeTab));
  }, [isDirector, activeTab, activeLocalDrafts, userLembagaId, dataLembagaList]);


  const getNextJamInfo = (lembagaId: number) => {
    const jamsForLembaga = activeLocalDrafts
      .filter(j => j.raw.lembaga_id === lembagaId)
      .sort((a, b) => a.urutanJam - b.urutanJam);

    if (jamsForLembaga.length === 0) {
      return {
        urutan_jam: 1,
        jam_mulai: "07:00",
        jam_selesai: "07:45",
      };
    }

    const lastJam = jamsForLembaga[jamsForLembaga.length - 1];
    const nextUrutan = lastJam.urutanJam + 1;
    const nextJamMulai = lastJam.jamSelesai;

    const [h, m] = nextJamMulai.split(":").map(Number);
    let totalMinutes = h * 60 + m + 45;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    const nextJamSelesai = `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;

    return {
      urutan_jam: nextUrutan,
      jam_mulai: nextJamMulai,
      jam_selesai: nextJamSelesai,
    };
  };

  useEffect(() => {
    if (!selectedData && formData.lembaga_id) {
      const nextInfo = getNextJamInfo(formData.lembaga_id);
      setFormData(prev => ({
        ...prev,
        urutan_jam: nextInfo.urutan_jam,
        jam_mulai: nextInfo.jam_mulai,
        jam_selesai: nextInfo.jam_selesai,
      }));
    }
  }, [formData.lembaga_id, selectedData, activeLocalDrafts]);

  const handleOpenAddModal = () => {
    setSelectedData(null);
    const initialLembagaId = isWakaKurikulum && userLembagaId ? userLembagaId : 0;
    const nextInfo = getNextJamInfo(initialLembagaId);

    setFormData({
      lembaga_id: initialLembagaId,
      urutan_jam: nextInfo.urutan_jam,
      jam_mulai: nextInfo.jam_mulai,
      jam_selesai: nextInfo.jam_selesai,
      tipe: "Belajar"
    });
    setIsModalOpen(true);
  };

  const handleEdit = (data: JamAkademikUI) => {
    setSelectedData(data);
    setFormData({
      lembaga_id: data.raw.lembaga_id,
      urutan_jam: data.raw.urutan_jam,
      jam_mulai: data.raw.jam_mulai.substring(0, 5),
      jam_selesai: data.raw.jam_selesai.substring(0, 5),
      tipe: data.raw.tipe || "Belajar"
    });
    setIsModalOpen(true);
  };

  const isSameJam = (a: JamAkademikUI, b: JamAkademikUI) => {
    if (a.draftId && b.draftId) {
      return a.draftId === b.draftId;
    }
    return a.id === b.id;
  };

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };

    const isUrutanDuplicate = activeLocalDrafts.some(
      jam => jam.raw.lembaga_id === payload.lembaga_id &&
        jam.urutanJam === payload.urutan_jam &&
        (!selectedData || !isSameJam(jam, selectedData))
    );

    if (isUrutanDuplicate) {
      toast.error(`Gagal: Urutan jam ke-${payload.urutan_jam} sudah terdaftar di lembaga ini.`);
      return;
    }

    const timeToMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const startPayload = timeToMin(payload.jam_mulai);
    const endPayload = timeToMin(payload.jam_selesai);

    if (startPayload >= endPayload) {
      toast.error("Gagal: Jam Selesai harus lebih lambat dari Jam Mulai.");
      return;
    }

    const overlappingJam = activeLocalDrafts.find(jam => {
      if (jam.raw.lembaga_id !== payload.lembaga_id) return false;
      if (selectedData && isSameJam(jam, selectedData)) return false;

      const startExisting = timeToMin(jam.jamMulai);
      const endExisting = timeToMin(jam.jamSelesai);

      return (startPayload < endExisting && endPayload > startExisting);
    });

    if (overlappingJam) {
      toast.error(`Gagal: Waktu bertabrakan dengan Jam ke-${overlappingJam.urutanJam} (${overlappingJam.jamMulai} - ${overlappingJam.jamSelesai}).`);
      return;
    }

    if (selectedData) {
      setLocalDrafts(prev => prev.map(draft => {
        if (isSameJam(draft, selectedData)) {
          return {
            ...draft,
            jamMulai: payload.jam_mulai,
            jamSelesai: payload.jam_selesai,
            tipe: payload.tipe,
            raw: { ...draft.raw, ...payload },
            draftStatus: draft.draftStatus === "NEW" ? "NEW" : "EDITED"
          };
        }
        return draft;
      }));
      toast.success("Perubahan tersimpan sementara (draft). Tekan 'Terapkan' untuk menyimpan.");
    } else {
      const newDraft: JamAkademikUI = {
        id: -Date.now(),
        draftId: `new-${Date.now()}`,
        lembaga: dataLembagaList.find((l: any) => l.lembaga_id === payload.lembaga_id)?.nama_lembaga || "—",
        urutanJam: payload.urutan_jam,
        jamMulai: payload.jam_mulai,
        jamSelesai: payload.jam_selesai,
        tipe: payload.tipe,
        raw: { ...payload },
        draftStatus: "NEW"
      };
      setLocalDrafts(prev => [...prev, newDraft]);
      toast.success("Jam baru ditambahkan ke draft. Tekan 'Terapkan' untuk menyimpan.");
    }
    setIsModalOpen(false);
  };

  const handleHapus = (jam: JamAkademikUI) => {
    const jamsForLembaga = activeLocalDrafts.filter(j => j.raw.lembaga_id === jam.raw.lembaga_id);
    const maxUrutan = Math.max(...jamsForLembaga.map(j => j.urutanJam), 0);

    if (jam.urutanJam < maxUrutan) {
      toast.error(`Gagal: Jam ke-${jam.urutanJam} tidak bisa dihapus. Hanya jam terakhir (Jam ke-${maxUrutan}) yang bisa dihapus.`);
      return;
    }

    setJamToDelete(jam);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmHapus = () => {
    if (jamToDelete) {
      setLocalDrafts(prev => {
        if (jamToDelete.draftStatus === "NEW") {
          return prev.filter(d => !isSameJam(d, jamToDelete));
        }
        return prev.map(d => {
          if (isSameJam(d, jamToDelete)) {
            return { ...d, draftStatus: "DELETED" };
          }
          return d;
        });
      });
      toast.success("Jam ditandai untuk dihapus. Tekan 'Terapkan' untuk mengeksekusi.");
    }
    setIsDeleteModalOpen(false);
    setJamToDelete(null);
  };

  const handleTerapkanKeJadwalKelas = () => {
    setIsTerapkanModalOpen(true);
  };

  const handleConfirmTerapkan = () => {
    terapkanMutation.mutate();
  };

  return {
    activeTab,
    setActiveTab,
    isWakaKurikulum,
    isDirector,
    isModalOpen,
    setIsModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isTerapkanModalOpen,
    setIsTerapkanModalOpen,
    isUnsavedWarningModalOpen,
    setIsUnsavedWarningModalOpen,
    handleConfirmLeave,
    handleTerapkanNowFromWarning,
    jamToDelete,
    selectedData,
    formData,
    setFormData,
    dataJam,
    activeLocalDrafts,
    isLoading,
    dataLembagaList,
    createMutation,
    updateMutation,
    deleteMutation,
    terapkanMutation,
    tabs,
    filteredData,
    hasJadwalChanges,
    terapkanInfo,
    terapkanProgressUmum,
    terapkanStatsUmum,
    terapkanProgressKhusus,
    terapkanStatsKhusus,
    terapkanTahap,
    handleOpenAddModal,
    handleEdit,
    handleSimpan,
    handleHapus,
    handleConfirmHapus,
    handleTerapkanKeJadwalKelas,
    handleConfirmTerapkan,
    jamKhusus
  };
};
