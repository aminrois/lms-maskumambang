// mobile/src/utils/jadwalHelper.ts
import { JadwalItem, GroupedJadwalSesi } from "../api/jadwalService";
import { LessonPlanItem } from "../api/absensiService";

/**
 * Checks if a lesson plan is fully approved by both Kepsek and Direktur
 */
export const isLessonPlanApproved = (lp: LessonPlanItem | any): boolean => {
  if (!lp) return false;
  return (
    lp.status_verifikasi_kepsek === "Disetujui" &&
    lp.status_verifikasi_direktur === "Disetujui"
  );
};

/**
 * Checks if a lesson plan matches subject and class by title e.g. "Fiqih - Kelas 7A"
 */
export const isLPForSubjectAndClass = (
  judulRpp: string | undefined,
  mapelNama: string,
  kelasNama: string
): boolean => {
  if (!judulRpp) return false;
  const cleanTitle = judulRpp.toLowerCase().trim();
  const cleanMapel = mapelNama.toLowerCase().trim();
  const cleanKelas = kelasNama.toLowerCase().trim();

  if (cleanMapel && cleanKelas) {
    return cleanTitle.includes(cleanMapel) && cleanTitle.includes(cleanKelas);
  }
  if (cleanMapel) {
    return cleanTitle.includes(cleanMapel);
  }
  return false;
};

/**
 * Groups consecutive / identical class & subject jadwal slots into unified sessions
 */
export const groupJadwalSessions = (
  jadwals: JadwalItem[],
  lessonPlans: LessonPlanItem[] = []
): GroupedJadwalSesi[] => {
  if (!jadwals || jadwals.length === 0) return [];

  // Group by composite key: hari-kelasId-mapelId
  const groupsMap = new Map<string, JadwalItem[]>();

  jadwals.forEach((j) => {
    const key = `${j.hari || "Unknown"}-${j.kelas_id || j.kelas?.kelas_id}-${j.mapel_id || j.mapel?.mapel_id}`;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(j);
  });

  const result: GroupedJadwalSesi[] = [];

  groupsMap.forEach((groupJadwals, key) => {
    // Sort by urutan_jam
    groupJadwals.sort((a, b) => {
      const aUrutan = a.jam_mulai?.urutan_jam ?? a.jam_ke ?? 0;
      const bUrutan = b.jam_mulai?.urutan_jam ?? b.jam_ke ?? 0;
      return aUrutan - bUrutan;
    });

    const first = groupJadwals[0];
    const last = groupJadwals[groupJadwals.length - 1];

    const urutanMulai = first.jam_mulai?.urutan_jam ?? first.jam_ke ?? 1;
    const urutanSelesai = last.jam_selesai?.urutan_jam ?? last.jam_mulai?.urutan_jam ?? last.jam_ke ?? urutanMulai;

    const labelJam =
      urutanMulai !== urutanSelesai
        ? `Jam Ke ${urutanMulai} – ${urutanSelesai}`
        : `Jam Ke ${urutanMulai}`;

    const jamMulaiStr = first.jam_mulai?.jam_mulai
      ? first.jam_mulai.jam_mulai.substring(0, 5)
      : "";
    const jamSelesaiStr = (last.jam_selesai?.jam_selesai || last.jam_mulai?.jam_selesai)
      ? (last.jam_selesai?.jam_selesai || last.jam_mulai?.jam_selesai)!.substring(0, 5)
      : "";

    const timeRangeStr =
      jamMulaiStr && jamSelesaiStr
        ? `${jamMulaiStr} – ${jamSelesaiStr}`
        : jamMulaiStr || "Waktu Sesi";

    const groupJadwalIds = groupJadwals.map((j) => j.jadwal_id);

    // Match lesson plan
    const mapelNama = first.mapel?.nama_mapel || "Mata Pelajaran";
    const kelasNama = first.kelas?.nama_kelas || "Kelas";

    const matchedLP = lessonPlans.find((lp) => {
      if (lp.jadwal_id && groupJadwalIds.includes(Number(lp.jadwal_id))) {
        return true;
      }
      return isLPForSubjectAndClass(lp.judul_rpp, mapelNama, kelasNama);
    });

    const isLPReady = matchedLP ? isLessonPlanApproved(matchedLP) : false;

    result.push({
      sesiKey: key,
      jadwalIds: groupJadwalIds,
      kelasId: first.kelas_id || first.kelas?.kelas_id || 0,
      mapelId: first.mapel_id || first.mapel?.mapel_id || 0,
      namaKelas: kelasNama,
      namaMapel: mapelNama,
      hari: first.hari,
      labelJam,
      timeRangeStr,
      jumlahJam: groupJadwals.length,
      urutanMulai,
      urutanSelesai,
      firstJadwal: first,
      isLPReady,
      lessonPlanDetailId: matchedLP?.lesson_plan_id || null,
      statusVerifikasiKepsek: matchedLP?.status_verifikasi_kepsek || "Belum Ada",
      statusVerifikasiDirektur: matchedLP?.status_verifikasi_direktur || "Belum Ada",
    });
  });

  return result.sort((a, b) => a.urutanMulai - b.urutanMulai);
};
