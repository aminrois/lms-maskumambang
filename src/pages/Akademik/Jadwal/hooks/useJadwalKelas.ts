import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getKelass, getJadwalPelajarans } from "@/lib/api/services/akademikService";
import { getLessonPlans } from "@/lib/api/services/kbmService";
import type { JadwalRow } from "./useJadwalAkademik";

export interface WaliKelasInfo {
  kelas_id: number;
  nama_kelas: string;
  lembaga_id: number;
  lembaga_nama?: string;
  wali_kelas_nama?: string;
}

export function useJadwalKelas() {
  const user = useAuthStore((state) => state.user);
  const pegawaiId = user?.pegawai_id;

  const [assignedClasses, setAssignedClasses] = useState<WaliKelasInfo[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null);
  const [jadwalData, setJadwalData] = useState<JadwalRow[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingJadwal, setIsLoadingJadwal] = useState(false);
  const [lessonPlanList, setLessonPlanList] = useState<any[]>([]);

  // 1. Fetch class(es) managed by Wali Kelas
  useEffect(() => {
    const fetchClassInfo = async () => {
      if (!pegawaiId) {
        setIsLoadingClasses(false);
        setAssignedClasses([]);
        return;
      }

      setIsLoadingClasses(true);
      try {
        const classes = await getKelass({
          wali_kelas_id: `eq.${pegawaiId}`,
          select: "kelas_id,nama_kelas,lembaga_id,lembaga(singkatan,nama_lembaga),wali_kelas:wali_kelas_id(nama)",
          order: "nama_kelas.asc",
        });

        if (classes && classes.length > 0) {
          const mappedClasses: WaliKelasInfo[] = classes.map((c: any) => ({
            kelas_id: c.kelas_id,
            nama_kelas: c.nama_kelas,
            lembaga_id: c.lembaga_id,
            lembaga_nama: c.lembaga?.singkatan || c.lembaga?.nama_lembaga || "",
            wali_kelas_nama: c.wali_kelas?.nama || "",
          }));

          setAssignedClasses(mappedClasses);
          setSelectedKelasId(mappedClasses[0].kelas_id);
        } else {
          setAssignedClasses([]);
          setSelectedKelasId(null);
        }
      } catch (error) {
        console.error("Gagal mengambil data kelas wali kelas:", error);
        setAssignedClasses([]);
        setSelectedKelasId(null);
      } finally {
        setIsLoadingClasses(false);
      }
    };

    fetchClassInfo();
  }, [pegawaiId]);

  // 2. Fetch schedule items for the selected class
  useEffect(() => {
    const fetchScheduleForClass = async () => {
      if (!selectedKelasId) {
        setJadwalData([]);
        setIsLoadingJadwal(false);
        return;
      }

      setIsLoadingJadwal(true);
      try {
        const rows = await getJadwalPelajarans({
          kelas_id: `eq.${selectedKelasId}`,
          select:
            "jadwal_id,hari,ruangan,kelas_id,mapel_id,pegawai_id,kelas(nama_kelas,lembaga_id,lembaga(singkatan,nama_lembaga)),mapel:mata_pelajaran(nama_mapel),pegawai(nama),jam_mulai:jam_akademik!jam_mulai_id(jam_mulai,urutan_jam,tipe),jam_selesai:jam_akademik!jam_selesai_id(jam_selesai)",
          order: "hari.asc,jam_mulai_id.asc",
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

        setJadwalData(processedRows as unknown as JadwalRow[]);
      } catch (error) {
        console.error("Gagal mengambil jadwal kelas:", error);
        setJadwalData([]);
      } finally {
        setIsLoadingJadwal(false);
      }
    };

    fetchScheduleForClass();
  }, [selectedKelasId]);

  // 3. Fetch lesson plan verification status
  useEffect(() => {
    const fetchLessonPlans = async () => {
      const jadwalIds = jadwalData.map(j => j.jadwal_id).filter(id => id);
      if (jadwalIds.length === 0) {
        setLessonPlanList([]);
        return;
      }
      try {
        const plans = await getLessonPlans({
          select: 'lesson_plan_id,jadwal_id,status_verifikasi_kepsek,status_verifikasi_direktur',
          jadwal_id: `in.(${jadwalIds.join(',')})`
        });
        setLessonPlanList(plans);
      } catch (error) {
        console.error("Gagal mengambil status verifikasi lesson plan:", error);
      }
    };
    fetchLessonPlans();
  }, [jadwalData]);

  // Map jadwal_id → status verifikasi lesson plan
  const lessonPlanVerifikasiMap = useMemo(() => {
    const lpStatusByJadwalId = new Map<number, { kepsek: string; direktur: string; isVerified: boolean }>();
    lessonPlanList.forEach((lp: any) => {
      if (!lp.jadwal_id) return;
      const kepsek = lp.status_verifikasi_kepsek || "Menunggu Verifikasi";
      const direktur = lp.status_verifikasi_direktur || "Menunggu Verifikasi";
      lpStatusByJadwalId.set(lp.jadwal_id, { kepsek, direktur, isVerified: kepsek === "Disetujui" && direktur === "Disetujui" });
    });

    const finalMap = new Map<number, { kepsek: string; direktur: string; isVerified: boolean }>();
    const groupedRows = new Map<string, typeof jadwalData[0][]>();
    
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

  // Hitung jumlah jadwal belum verifikasi
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

  // Selected class details
  const activeClass = useMemo(() => {
    return assignedClasses.find((c) => c.kelas_id === selectedKelasId) || null;
  }, [assignedClasses, selectedKelasId]);

  // Group schedule items by day
  const groupedData = useMemo(() => {
    const acc: Record<string, JadwalRow[]> = {};
    jadwalData.forEach((row) => {
      if (!acc[row.hari]) acc[row.hari] = [];
      acc[row.hari].push(row);
    });

    // Sort sessions in each day by urutan_jam
    Object.keys(acc).forEach((hari) => {
      acc[hari].sort((a, b) => (a.jam_mulai?.urutan_jam || 0) - (b.jam_mulai?.urutan_jam || 0));
    });

    return acc;
  }, [jadwalData]);

  // Day order sorting
  const hariOrder = ["Sabtu", "Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  const sortedHari = useMemo(() => {
    return Object.keys(groupedData).sort((a, b) => hariOrder.indexOf(a) - hariOrder.indexOf(b));
  }, [groupedData]);

  return {
    assignedClasses,
    selectedKelasId,
    setSelectedKelasId,
    activeClass,
    groupedData,
    sortedHari,
    isLoading: isLoadingClasses || isLoadingJadwal,
    lessonPlanVerifikasiMap,
    unverifiedCount,
  };
}
