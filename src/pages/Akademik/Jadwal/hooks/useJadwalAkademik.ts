import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getJadwalPelajarans, deleteJadwalPelajaran } from "@/lib/api/services/akademikService";
import { getLessonPlans } from "@/lib/api/services/kbmService";
import { restClient } from "@/lib/api/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useFeatureRealtimeSync } from "@/hooks/useRealtimeSync";

export type JadwalRow = {
  jadwal_id: number;
  hari: string;
  ruangan?: string | null;
  kelas_id?: number;
  mapel_id?: number | null;
  pegawai_id?: number | null;
  kelas?: { nama_kelas: string; lembaga_id: number; lembaga?: { singkatan: string; nama_lembaga: string } };
  mapel?: { nama_mapel: string };
  pegawai?: { nama: string };
  jam_mulai?: { urutan_jam: number; jam_mulai: string; tipe: string; isKhusus?: boolean };
  jam_selesai?: { jam_selesai: string };
};

const ROMAN_NUMERALS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export const useJadwalAkademik = () => {
  const queryClient = useQueryClient();
  const role = useAuthStore(state => state.role);
  const userLembagaId = useAuthStore(state => state.lembaga_id);
  const isDirector = role === "Direktur";

  useFeatureRealtimeSync("AKADEMIK_JADWAL");

  const [activeLembagaId, setActiveLembagaId] = useState<number | null>(null);
  const [activeKelasId, setActiveKelasId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jadwalToDelete, setJadwalToDelete] = useState<JadwalRow | null>(null);

  const { data: lembagaList = [], isLoading: isLembagaLoading } = useQuery({
    queryKey: ['master-data', 'lembaga-options'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const response = await restClient.get('/lembaga', {
        params: { select: 'lembaga_id,nama_lembaga,singkatan' }
      });
      return response.data || [];
    }
  });

  useEffect(() => {
    if (userLembagaId) {
      setActiveLembagaId(userLembagaId);
    } else if (lembagaList.length > 0 && !activeLembagaId) {
      setActiveLembagaId(lembagaList[0].lembaga_id);
    }
  }, [lembagaList, activeLembagaId, userLembagaId]);

  const { data: kelasList = [], isLoading: isKelasLoading } = useQuery({
    queryKey: ['master-data', 'kelas-options'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const response = await restClient.get('/kelas', {
        params: { select: 'kelas_id,nama_kelas,lembaga_id,wali_kelas:wali_kelas_id(nama),lembaga(singkatan,nama_lembaga)', order: 'nama_kelas.asc' }
      });
      return response.data || [];
    }
  });

  const filteredKelas = useMemo(() => {
    return kelasList.filter((k: any) => k.lembaga_id === activeLembagaId);
  }, [kelasList, activeLembagaId]);

  useEffect(() => {
    if (filteredKelas.length > 0) {
      if (!activeKelasId || !filteredKelas.find((k: any) => k.kelas_id === activeKelasId)) {
        setActiveKelasId(filteredKelas[0].kelas_id);
      }
    } else {
      setActiveKelasId(null);
    }
  }, [filteredKelas, activeKelasId]);

  const { data: jadwalData = [], isLoading: isJadwalLoading } = useQuery({
    queryKey: ['akademik', 'jadwal-pelajaran', activeKelasId],
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!activeKelasId) return [];

      const rows = await getJadwalPelajarans({
        select:
          "jadwal_id,hari,ruangan,kelas_id,mapel_id,pegawai_id,kelas(nama_kelas,lembaga_id,lembaga(singkatan,nama_lembaga)),mapel:mata_pelajaran(nama_mapel),pegawai(nama),jam_mulai:jam_akademik!jam_mulai_id(jam_mulai,urutan_jam,tipe),jam_selesai:jam_akademik!jam_selesai_id(jam_selesai)",
        order: "hari.asc,jam_mulai_id.asc",
        kelas_id: `eq.${activeKelasId}`
      });
      const processedRows = rows.map((row: any) => {
        if (row.ruangan && row.ruangan.startsWith("OVERRIDE_TIPE:")) {
          const overrideTipe = row.ruangan.replace("OVERRIDE_TIPE:", "");
          return {
            ...row,
            ruangan: null,
            jam_mulai: row.jam_mulai ? { ...row.jam_mulai, tipe: overrideTipe, isKhusus: true } : row.jam_mulai,
          };
        }
        return row;
      });
      return processedRows as unknown as JadwalRow[];
    },
    enabled: !!activeKelasId
  });

  const { data: lessonPlanList = [] } = useQuery({
    queryKey: ['kbm', 'lesson-plans', activeKelasId],
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    queryFn: async () => {
      const jadwalIds = jadwalData.map(j => j.jadwal_id).filter(id => id);
      if (jadwalIds.length === 0) return [];
      
      // Filter RPP hanya berdasarkan jadwal_id dari kelas yang sedang aktif
      return await getLessonPlans({
        select: 'lesson_plan_id,pegawai_id,judul_rpp,jadwal_id,status_verifikasi_kepsek,status_verifikasi_direktur',
        jadwal_id: `in.(${jadwalIds.join(',')})`
      });
    },
    enabled: jadwalData.length > 0
  });

  // Map jadwal_id → status verifikasi lesson plan
  const lessonPlanVerifikasiMap = useMemo(() => {
    const lpStatusByJadwalId = new Map<number, { kepsek: string; direktur: string; isVerified: boolean }>();
    lessonPlanList.forEach((lp: any) => {
      if (!lp.jadwal_id) return;
      const kepsek = lp.status_verifikasi_kepsek || "Menunggu Verifikasi";
      const direktur = lp.status_verifikasi_direktur || "Menunggu Verifikasi";
      const isVerified = kepsek === "Disetujui" && direktur === "Disetujui";
      lpStatusByJadwalId.set(lp.jadwal_id, { kepsek, direktur, isVerified });
    });

    const finalMap = new Map<number, { kepsek: string; direktur: string; isVerified: boolean }>();
    const groupedRows = new Map<string, JadwalRow[]>();
    
    jadwalData.forEach(row => {
      if (!row.mapel_id || !row.kelas_id) return;
      const key = `${row.hari}_${row.mapel_id}_${row.kelas_id}`;
      if (!groupedRows.has(key)) groupedRows.set(key, []);
      groupedRows.get(key)!.push(row);
    });

    groupedRows.forEach(rows => {
      let groupStatus = null;
      for (const row of rows) {
        if (row.jadwal_id && lpStatusByJadwalId.has(row.jadwal_id)) {
          groupStatus = lpStatusByJadwalId.get(row.jadwal_id);
          break;
        }
      }
      if (groupStatus) {
        for (const row of rows) {
          if (row.jadwal_id) {
            finalMap.set(row.jadwal_id, groupStatus);
          }
        }
      }
    });

    return finalMap;
  }, [lessonPlanList, jadwalData]);

  // Hitung jumlah mata pelajaran yang RPP-nya belum diverifikasi penuh pada data jadwal saat ini
  const unverifiedCount = useMemo(() => {
    let count = 0;
    const seenJadwalIds = new Set<number>();
    jadwalData.forEach(row => {
      if (row.jadwal_id && !seenJadwalIds.has(row.jadwal_id)) {
        seenJadwalIds.add(row.jadwal_id);
        const verif = lessonPlanVerifikasiMap.get(row.jadwal_id);
        if (verif && !verif.isVerified) {
          count++;
        }
      }
    });
    return count;
  }, [jadwalData, lessonPlanVerifikasiMap]);

  const [isUnggahModalOpen, setIsUnggahModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Progress state untuk Unggah Jadwal (pembuatan RPP)
  const [unggahProgress, setUnggahProgress] = useState(0);
  const [unggahStats, setUnggahStats] = useState({ current: 0, total: 0 });

  const validSchedules = useMemo(() => {
    return jadwalData.filter(j => j.kelas_id && j.mapel_id && j.pegawai_id && j.mapel?.nama_mapel && j.kelas?.nama_kelas);
  }, [jadwalData]);

  const uploadActions = useMemo(() => {
    const existingTitles = new Set(
      lessonPlanList.map((lp: any) => lp.judul_rpp ? lp.judul_rpp.trim().toLowerCase() : "")
    );
    
    // Map existing LP by jadwal_id
    const lpByJadwalId = new Map<number, any>(lessonPlanList.filter((lp: any) => lp.jadwal_id).map((lp: any) => [lp.jadwal_id, lp]));

    const groupedBySubject = validSchedules.reduce((acc, j) => {
      if (activeLembagaId && j.kelas?.lembaga_id !== activeLembagaId) return acc;
      const key = `${j.mapel_id}_${j.kelas_id}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(j);
      return acc;
    }, {} as Record<string, JadwalRow[]>);

    const toCreate: (JadwalRow & { expectedTitle: string })[] = [];
    const toRename: { lesson_plan_id: number; newTitle: string }[] = [];
    
    Object.values(groupedBySubject).forEach(group => {
      const namaMapel = group[0].mapel?.nama_mapel || "Mata Pelajaran";
      const namaKelas = group[0].kelas?.nama_kelas || "Kelas";
      
      const hariOrder = ["Sabtu", "Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
      const uniqueDays = Array.from(new Set(group.map(j => j.hari)))
                              .sort((a, b) => hariOrder.indexOf(a) - hariOrder.indexOf(b));
      
      uniqueDays.forEach((hari, index) => {
        const roman = uniqueDays.length > 1 ? ` ${ROMAN_NUMERALS[index + 1]}` : "";
        const expectedTitle = `${namaMapel}${roman} - ${namaKelas}`;
        
        const anchorJadwal = group.find(j => j.hari === hari);
        if (!anchorJadwal) return;

        // Check if this jadwal_id is already uploaded
        const existingLp = lpByJadwalId.get(anchorJadwal.jadwal_id);

        if (existingLp) {
          // If uploaded, check if title needs renaming (e.g. from "Matematika" to "Matematika I")
          if (existingLp.judul_rpp !== expectedTitle) {
            toRename.push({ lesson_plan_id: existingLp.lesson_plan_id, newTitle: expectedTitle });
          }
        } else {
          // Not uploaded yet based on jadwal_id. 
          // Also check by title fallback (in case old data doesn't have jadwal_id)
          const expectedTitleLower = expectedTitle.trim().toLowerCase();
          const expectedTitleAlt = expectedTitleLower.replace('-', '–');
          const isAlreadyUploaded = existingTitles.has(expectedTitleLower) || existingTitles.has(expectedTitleAlt);
          
          if (!isAlreadyUploaded) {
            toCreate.push({ ...anchorJadwal, expectedTitle });
          }
        }
      });
    });

    return { toCreate, toRename };
  }, [validSchedules, lessonPlanList, activeLembagaId]);

  const hasUnuploadedSchedules = uploadActions.toCreate.length > 0 || uploadActions.toRename.length > 0;

  const executeUnggahJadwal = async () => {
    if (uploadActions.toCreate.length === 0 && uploadActions.toRename.length === 0) return;
    setIsUploading(true);
    try {
      // 1. Rename existing lesson plans if necessary
      for (const rename of uploadActions.toRename) {
        await restClient.patch(`/lesson_plan?lesson_plan_id=eq.${rename.lesson_plan_id}`, {
          judul_rpp: rename.newTitle
        });
      }

      // 2. Create new lesson plans
      let createdCount = 0;
      const totalCreate = uploadActions.toCreate.length;
      setUnggahProgress(0);
      setUnggahStats({ current: 0, total: totalCreate });

      for (const item of uploadActions.toCreate) {
        createdCount++;
        const lpRes = await restClient.post('/lesson_plan', {
          pegawai_id: item.pegawai_id,
          jadwal_id: item.jadwal_id,
          judul_rpp: item.expectedTitle,
          status_verifikasi_kepsek: "Menunggu Verifikasi",
          status_verifikasi_direktur: "Menunggu Verifikasi",
        }, {
          headers: { Prefer: "return=representation" }
        });

        const createdLp = lpRes.data?.[0];
        if (createdLp?.lesson_plan_id) {
          createdCount++;

          const detailsPayload = Array.from({ length: 16 }, (_, idx) => ({
            lesson_plan_id: createdLp.lesson_plan_id,
            pertemuan_ke: idx + 1,
            materi: `Materi Pertemuan Ke-${idx + 1}`,
            topik_materi: "-",
            isi: null,
          }));

          await restClient.post('/lesson_plan_detail', detailsPayload);
        }
        
        setUnggahStats({ current: createdCount, total: totalCreate });
        setUnggahProgress(Math.round((createdCount / totalCreate) * 100));
      }

      toast.success(`Berhasil memproses pembaruan: ${createdCount} baru, ${uploadActions.toRename.length} diubah.`);
      queryClient.invalidateQueries({ queryKey: ['kbm', 'lesson-plans'] });
      queryClient.invalidateQueries({ queryKey: ['akademik', 'jadwal-pelajaran'] });
      setIsUnggahModalOpen(false);
    } catch (error: any) {
      console.error("Gagal mengunggah jadwal:", error);
      toast.error("Gagal mengunggah jadwal ke Lesson Plan. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = isLembagaLoading || isKelasLoading || isJadwalLoading;



  const executeDelete = async (id: number) => {
    try {
      await deleteJadwalPelajaran(id);
      toast.success("Jadwal berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ['akademik', 'jadwal-pelajaran'] });
    } catch (error: any) {
      if (error?.response?.status === 409 || error?.message?.includes("foreign key")) {
        toast.error("Jadwal ini tidak bisa dihapus karena sudah pernah digunakan untuk absensi. Hapus riwayat absensinya terlebih dahulu.");
      } else {
        toast.error("Jadwal gagal dihapus. Silakan coba lagi.");
      }
    }
  };

  const filteredData = useMemo(() => {
    return jadwalData.filter(row => row.kelas_id === activeKelasId);
  }, [jadwalData, activeKelasId]);

  const groupedData = useMemo(() => {
    return filteredData.reduce((acc, row) => {
      if (!acc[row.hari]) acc[row.hari] = [];
      acc[row.hari].push(row);
      return acc;
    }, {} as Record<string, JadwalRow[]>);
  }, [filteredData]);

  const hariOrder = ["Sabtu", "Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  const sortedHari = useMemo(() => {
    return Object.keys(groupedData).sort((a, b) => hariOrder.indexOf(a) - hariOrder.indexOf(b));
  }, [groupedData]);

  return {
    isLoading,
    lembagaList,
    filteredKelas,
    activeLembagaId,
    setActiveLembagaId,
    activeKelasId,
    setActiveKelasId,
    allJadwalData: jadwalData,
    groupedData,
    sortedHari,
    userLembagaId,
    isDirector,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    jadwalToDelete,
    setJadwalToDelete,
    executeDelete,
    hasUnuploadedSchedules,
    unuploadedCount: uploadActions.toCreate.length,
    isUnggahModalOpen,
    setIsUnggahModalOpen,
    isUploading,
    executeUnggahJadwal,
    unggahProgress,
    unggahStats,
    lessonPlanVerifikasiMap,
    unverifiedCount,
  };
};
