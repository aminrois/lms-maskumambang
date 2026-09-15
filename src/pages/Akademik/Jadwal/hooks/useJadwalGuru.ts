import { useEffect, useState, useMemo } from "react";
import { getJadwalPelajarans } from "@/lib/api/services/akademikService";
import { getPegawaiByUserId } from "@/lib/api/services/masterService";
import { getLessonPlans } from "@/lib/api/services/kbmService";
import { useAuthStore } from "@/store/useAuthStore";

export type JadwalGuruResponse = {
  jadwal_id: number;
  hari: string;
  ruangan?: string | null;
  kelas?: { nama_kelas: string };
  mapel?: { nama_mapel: string };
  jam_mulai?: { urutan_jam: number; jam_mulai: string; tipe: string; isKhusus?: boolean };
  jam_selesai?: { jam_selesai: string };
};

export type MergedJadwalGuru = {
  key: string;
  jadwal_id: number;
  jadwal_ids: number[];
  jam_mulai_display: string;
  jam_selesai_display: string;
  kelas_nama: string;
  mapel_nama: string;
  ruangan?: string | null;
  tipe?: string;
  urutan_jam: number;
  start_jam: number | null;
  end_jam: number | null;
  jumlah_jam: number;
};

export const useJadwalGuru = () => {
  const [jadwalGuru, setJadwalGuru] = useState<JadwalGuruResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pegawaiNama, setPegawaiNama] = useState("Guru aktif tidak ditemukan");
  const [pegawaiId, setPegawaiId] = useState<number | null>(null);
  const [lessonPlanList, setLessonPlanList] = useState<any[]>([]);
  const userId = useAuthStore((state) => state.user?.user_id);

  useEffect(() => {
    const resolvePegawaiAktif = async () => {
      if (!userId) {
        setPegawaiNama("Guru aktif tidak ditemukan");
        setPegawaiId(null);
        return;
      }

      try {
        const pegawai = await getPegawaiByUserId(userId);
        setPegawaiNama(pegawai?.nama || "Guru aktif tidak ditemukan");
        setPegawaiId(pegawai?.pegawai_id || null);
      } catch (error) {
        console.error("Gagal mengambil profil pegawai aktif:", error);
        setPegawaiNama("Guru aktif tidak ditemukan");
        setPegawaiId(null);
      }
    };

    resolvePegawaiAktif();
  }, [userId]);

  useEffect(() => {
    const fetchJadwalGuru = async () => {
      if (pegawaiId === null) {
        setIsLoading(false);
        setJadwalGuru([]);
        return;
      }
      setIsLoading(true);
      try {
        const rows = await getJadwalPelajarans({
          pegawai_id: `eq.${pegawaiId}`,
          select:
            "jadwal_id,hari,ruangan,kelas(nama_kelas),mapel:mata_pelajaran(nama_mapel),pegawai(nama),jam_mulai:jam_akademik!jam_mulai_id(jam_mulai,urutan_jam),jam_selesai:jam_akademik!jam_selesai_id(jam_selesai)",
          order: "hari.asc,jam_mulai_id.asc",
        });

        setJadwalGuru(rows.map((row: any) => {
          if (row.ruangan && row.ruangan.startsWith("OVERRIDE_TIPE:")) {
            const overrideTipe = row.ruangan.replace("OVERRIDE_TIPE:", "");
            return {
              ...row,
              ruangan: null,
              jam_mulai: row.jam_mulai ? { ...row.jam_mulai, tipe: overrideTipe, isKhusus: true } : row.jam_mulai,
            };
          }
          return row;
        }) as unknown as JadwalGuruResponse[]);
      } catch (error) {
        console.error("Gagal mengambil data jadwal guru:", error);
        setJadwalGuru([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJadwalGuru();
  }, [pegawaiId]);

  // Fetch lesson plan verification status
  useEffect(() => {
    const fetchLessonPlans = async () => {
      const jadwalIds = jadwalGuru.map(j => j.jadwal_id).filter(id => id);
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
  }, [jadwalGuru]);

  // Helper to check if category is counted as academic lesson
  const isCountedCategory = (tipe?: string): boolean => {
    if (!tipe) return true;
    return tipe.trim().toLowerCase() === "belajar";
  };

  // Group by hari, merge parallel classes, and merge consecutive periods
  const groupedData = useMemo(() => {
    const acc: Record<string, MergedJadwalGuru[]> = {};

    // First group by hari
    const rawGrouped: Record<string, JadwalGuruResponse[]> = {};
    jadwalGuru.forEach((row) => {
      if (!rawGrouped[row.hari]) rawGrouped[row.hari] = [];
      rawGrouped[row.hari].push(row);
    });

    // For each hari, first merge parallel slots, then merge consecutive slots
    Object.keys(rawGrouped).forEach((hari) => {
      const rows = rawGrouped[hari];
      const slotMap = new Map<string, {
        jadwal_id: number;
        jadwal_ids: number[];
        jam_mulai_display: string;
        jam_selesai_display: string;
        mapel_nama: string;
        ruangan?: string | null;
        tipe?: string;
        urutan_jam: number;
        kelases: Set<string>;
      }>();

      rows.forEach((row) => {
        const jamMulai = row.jam_mulai?.jam_mulai?.substring(0, 5) || "—";
        const jamSelesai = row.jam_selesai?.jam_selesai?.substring(0, 5) || "—";
        const mapelNama = row.mapel?.nama_mapel || "—";
        const ruangan = row.ruangan || null;
        const tipe = row.jam_mulai?.tipe || "";
        const urutanJam = row.jam_mulai?.urutan_jam || 0;
        const slotKey = `${jamMulai}_${jamSelesai}_${mapelNama}_${ruangan || ''}`;

        if (!slotMap.has(slotKey)) {
          slotMap.set(slotKey, {
            jadwal_id: row.jadwal_id,
            jadwal_ids: [row.jadwal_id],
            jam_mulai_display: jamMulai,
            jam_selesai_display: jamSelesai,
            mapel_nama: mapelNama,
            ruangan,
            tipe,
            urutan_jam: urutanJam,
            kelases: new Set<string>()
          });
        } else {
          slotMap.get(slotKey)!.jadwal_ids.push(row.jadwal_id);
        }

        const slot = slotMap.get(slotKey)!;
        if (row.kelas?.nama_kelas) {
          slot.kelases.add(row.kelas.nama_kelas);
        }
      });

      // Sort individual slots chronologically
      const sortedSlots = Array.from(slotMap.values()).sort((a, b) => {
        if (a.urutan_jam !== b.urutan_jam) return a.urutan_jam - b.urutan_jam;
        return a.jam_mulai_display.localeCompare(b.jam_mulai_display);
      });

      // Assign sequential jam numbers to individual slots (1, 2, 3...)
      let jamCounter = 0;
      const slotsWithJamNum = sortedSlots.map((slot) => {
        const sortedKelas = Array.from(slot.kelases).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        const isBelajar = isCountedCategory(slot.tipe);
        if (isBelajar) {
          jamCounter += 1;
        }
        return {
          ...slot,
          kelas_nama: sortedKelas.join(", ") || "—",
          jamNum: isBelajar ? jamCounter : null,
        };
      });

      // Merge consecutive periods with the same class, mapel, and ruangan
      const mergedList: MergedJadwalGuru[] = [];
      let currentGroup: any = null;

      for (const slot of slotsWithJamNum) {
        const canMergeWithCurrent =
          currentGroup &&
          currentGroup.mapel_nama === slot.mapel_nama &&
          currentGroup.kelas_nama === slot.kelas_nama &&
          currentGroup.ruangan === slot.ruangan &&
          (
            currentGroup.jam_selesai_display === slot.jam_mulai_display ||
            (currentGroup.last_urutan !== undefined && currentGroup.last_urutan + 1 === slot.urutan_jam) ||
            (currentGroup.last_jamNum !== null && slot.jamNum !== null && currentGroup.last_jamNum + 1 === slot.jamNum)
          );

        if (canMergeWithCurrent) {
          currentGroup.jam_selesai_display = slot.jam_selesai_display;
          currentGroup.last_urutan = slot.urutan_jam;
          if (slot.jamNum !== null) {
            currentGroup.last_jamNum = slot.jamNum;
            currentGroup.end_jam = slot.jamNum;
          }
          currentGroup.jumlah_jam += 1;
          currentGroup.jadwal_ids.push(...slot.jadwal_ids);
        } else {
          if (currentGroup) {
            mergedList.push({
              key: `${currentGroup.jadwal_id}_${currentGroup.jam_mulai_display}`,
              jadwal_id: currentGroup.jadwal_id,
              jadwal_ids: currentGroup.jadwal_ids,
              jam_mulai_display: currentGroup.jam_mulai_display,
              jam_selesai_display: currentGroup.jam_selesai_display,
              kelas_nama: currentGroup.kelas_nama,
              mapel_nama: currentGroup.mapel_nama,
              ruangan: currentGroup.ruangan,
              tipe: currentGroup.tipe,
              urutan_jam: currentGroup.urutan_jam,
              start_jam: currentGroup.start_jam,
              end_jam: currentGroup.end_jam,
              jumlah_jam: currentGroup.jumlah_jam,
            });
          }

          currentGroup = {
            jadwal_id: slot.jadwal_id,
            jadwal_ids: [...slot.jadwal_ids],
            jam_mulai_display: slot.jam_mulai_display,
            jam_selesai_display: slot.jam_selesai_display,
            kelas_nama: slot.kelas_nama,
            mapel_nama: slot.mapel_nama,
            ruangan: slot.ruangan,
            tipe: slot.tipe,
            urutan_jam: slot.urutan_jam,
            last_urutan: slot.urutan_jam,
            start_jam: slot.jamNum,
            end_jam: slot.jamNum,
            last_jamNum: slot.jamNum,
            jumlah_jam: 1,
          };
        }
      }

      if (currentGroup) {
        mergedList.push({
          key: `${currentGroup.jadwal_id}_${currentGroup.jam_mulai_display}`,
          jadwal_id: currentGroup.jadwal_id,
          jadwal_ids: currentGroup.jadwal_ids,
          jam_mulai_display: currentGroup.jam_mulai_display,
          jam_selesai_display: currentGroup.jam_selesai_display,
          kelas_nama: currentGroup.kelas_nama,
          mapel_nama: currentGroup.mapel_nama,
          ruangan: currentGroup.ruangan,
          tipe: currentGroup.tipe,
          urutan_jam: currentGroup.urutan_jam,
          start_jam: currentGroup.start_jam,
          end_jam: currentGroup.end_jam,
          jumlah_jam: currentGroup.jumlah_jam,
        });
      }

      acc[hari] = mergedList;
    });

    return acc;
  }, [jadwalGuru]);

  // Define hari order for sorting
  const hariOrder = ["Sabtu", "Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  const sortedHari = useMemo(() => {
    return Object.keys(groupedData).sort((a, b) => hariOrder.indexOf(a) - hariOrder.indexOf(b));
  }, [groupedData]);

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
    const groupedRows = new Map<string, typeof jadwalGuru[0][]>();
    
    jadwalGuru.forEach(row => {
      const mapelKey = row.mapel?.nama_mapel;
      const kelasKey = row.kelas?.nama_kelas;
      if (!mapelKey || !kelasKey) return;
      const key = `${row.hari}_${mapelKey}_${kelasKey}`;
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
  }, [lessonPlanList, jadwalGuru]);

  // Hitung jumlah jadwal belum verifikasi
  const unverifiedCount = useMemo(() => {
    let count = 0;
    const seenJadwalIds = new Set<number>();
    jadwalGuru.forEach(row => {
      if (row.jadwal_id && !seenJadwalIds.has(row.jadwal_id)) {
        seenJadwalIds.add(row.jadwal_id);
        const verif = lessonPlanVerifikasiMap.get(row.jadwal_id);
        if (verif && !verif.isVerified) {
          count++;
        }
      }
    });
    return count;
  }, [jadwalGuru, lessonPlanVerifikasiMap]);

  return {
    isLoading,
    pegawaiNama,
    groupedData,
    sortedHari,
    lessonPlanVerifikasiMap,
    unverifiedCount,
  };
};
