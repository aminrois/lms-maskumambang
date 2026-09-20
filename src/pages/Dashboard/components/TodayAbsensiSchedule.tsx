import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  ArrowRight,
  Sparkles,
  School,
  Check,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface TodayAbsensiScheduleProps {
  jadwalData: any[];
  lessonPlans: any[];
  jurnalMengajar: any[];
  isLoadingJadwal: boolean;
  pegawaiNama?: string;
}

const INDONESIAN_DAYS = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/['’`]/g, "'")
    .replace(/&/g, "dan")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanRomanNumeral(str: string): string {
  return str.replace(/\b(iv|iii|ii|i)\b/gi, "").replace(/\s+/g, " ").trim();
}

function isLPForSubjectAndClass(lpTitleRaw: string, mapelNamaRaw: string, kelasNamaRaw: string): boolean {
  if (!lpTitleRaw || !mapelNamaRaw || !kelasNamaRaw) return false;

  const lpTitle = normalizeText(lpTitleRaw);
  const mapelNama = normalizeText(mapelNamaRaw);
  const kelasNama = normalizeText(kelasNamaRaw);

  const baseLPTitle = cleanRomanNumeral(lpTitle);
  const baseMapelNama = cleanRomanNumeral(mapelNama);

  const matchMapel =
    lpTitle.includes(mapelNama) ||
    baseLPTitle.includes(baseMapelNama) ||
    baseMapelNama.includes(baseLPTitle);
  if (!matchMapel) return false;

  const dashParts = lpTitleRaw.split(/[-–]/);
  if (dashParts.length > 1) {
    const classPart = normalizeText(dashParts.slice(1).join(" "));
    if (!classPart) return true;
    const specifiedClasses = classPart.split(/[,/]/).map((c) => c.trim());
    return specifiedClasses.some(
      (c) => c === kelasNama || c.includes(kelasNama) || kelasNama.includes(c)
    );
  }

  return true;
}

export default function TodayAbsensiSchedule({
  jadwalData,
  lessonPlans,
  jurnalMengajar,
  isLoadingJadwal,
}: TodayAbsensiScheduleProps) {
  const navigate = useNavigate();

  // Tanggal & Hari saat ini
  const todayDate = useMemo(() => new Date(), []);
  const todayDayIndex = todayDate.getDay();
  const realTodayName = INDONESIAN_DAYS[todayDayIndex];
  const todayDateFormatted = `${todayDate.getDate()} ${MONTH_NAMES[todayDate.getMonth()]} ${todayDate.getFullYear()}`;
  const todayISODate = todayDate.toISOString().slice(0, 10);

  // Filter Hari Aktif (Default: Hari ini)
  const [selectedDay, setSelectedDay] = useState<string>(realTodayName);

  // Format pengelompokan jadwal per hari yang dipilih
  const groupedSesiToday = useMemo(() => {
    if (!jadwalData || jadwalData.length === 0) return [];

    // Filter berdasarkan hari yang dipilih
    const filteredByDay = jadwalData.filter((j: any) => j.hari === selectedDay && j.mapel);

    // Urutkan berdasarkan urutan jam paling awal
    const sorted = [...filteredByDay].sort((a: any, b: any) => {
      const urutanA = a.jam_mulai?.urutan_jam || 0;
      const urutanB = b.jam_mulai?.urutan_jam || 0;
      return urutanA - urutanB;
    });

    // Kelompokkan sesi berderet untuk kelas & mapel yang sama
    const groups = new Map<string, any[]>();
    sorted.forEach((j: any) => {
      const key = `${j.kelas?.kelas_id || j.kelas_id}_${j.mapel?.mapel_id || j.mapel_id}_${j.hari}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(j);
    });

    const result: any[] = [];
    groups.forEach((groupJadwals, key) => {
      if (groupJadwals.length === 0) return;

      const first = groupJadwals[0];
      const urutanList = groupJadwals
        .map((s: any) => s.jam_mulai?.urutan_jam)
        .filter((u: any) => typeof u === "number")
        .sort((a: number, b: number) => a - b);

      const urutanFirst = urutanList[0] || 1;
      const urutanLast = urutanList[urutanList.length - 1] || 1;
      const isContiguous = urutanList.length > 1 && urutanLast - urutanFirst === urutanList.length - 1;

      let labelJam = "";
      if (urutanList.length === 1) {
        labelJam = `Jam ke-${urutanFirst}`;
      } else if (isContiguous) {
        labelJam = `Jam ke-${urutanFirst} – ${urutanLast}`;
      } else {
        labelJam = `Jam ${urutanList.join(", ")}`;
      }

      const jamMulaiStr = first.jam_mulai?.jam_mulai ? first.jam_mulai.jam_mulai.substring(0, 5) : "";
      const lastJadwal = groupJadwals[groupJadwals.length - 1];
      const jamSelesaiStr = lastJadwal.jam_selesai?.jam_selesai
        ? lastJadwal.jam_selesai.jam_selesai.substring(0, 5)
        : "";

      const timeRangeStr = jamMulaiStr && jamSelesaiStr ? `${jamMulaiStr} – ${jamSelesaiStr}` : jamMulaiStr || "";

      // Cari LP yang cocok dan terverifikasi
      const groupJadwalIds = groupJadwals.map((s: any) => Number(s.jadwal_id));
      const matchedLPs = (lessonPlans || []).filter((lp: any) => {
        const isDisetujui =
          lp.status_verifikasi_kepsek === "Disetujui" &&
          lp.status_verifikasi_direktur === "Disetujui";
        if (!isDisetujui) return false;

        if (lp.jadwal_id && groupJadwalIds.includes(Number(lp.jadwal_id))) {
          return true;
        }

        const mapelNama = first.mapel?.nama_mapel || "";
        const kelasNama = first.kelas?.nama_kelas || "";
        return isLPForSubjectAndClass(lp.judul_rpp, mapelNama, kelasNama);
      });

      const isLPReady = matchedLPs.length > 0;
      const defaultLP = matchedLPs[0] || null;

      // Cek apakah jadwal ini sudah memiliki jurnal mengajar pada tanggal hari ini
      const todayJurnals = (jurnalMengajar || []).filter(
        (jm: any) =>
          groupJadwalIds.includes(Number(jm.jadwal_id)) &&
          (jm.tanggal === todayISODate || jm.tanggal?.startsWith(todayISODate))
      );

      const isCompletedToday = todayJurnals.length > 0;
      const completedMeetingNo = isCompletedToday ? todayJurnals[0].pertemuan_ke : null;

      // Total pertemuan yang sudah diselesaikan secara keseluruhan
      const allCompletedForThisGroup = (jurnalMengajar || []).filter((jm: any) =>
        groupJadwalIds.includes(Number(jm.jadwal_id))
      );

      result.push({
        sesiKey: key,
        jadwalIds: groupJadwalIds,
        kelasId: first.kelas?.kelas_id || first.kelas_id,
        mapelId: first.mapel?.mapel_id || first.mapel_id,
        namaKelas: first.kelas?.nama_kelas || "Kelas",
        namaMapel: first.mapel?.nama_mapel || "Mata Pelajaran",
        hari: first.hari,
        labelJam,
        timeRangeStr,
        jumlahJam: groupJadwals.length,
        isLPReady,
        defaultLP,
        isCompletedToday,
        completedMeetingNo,
        totalCompletedCount: allCompletedForThisGroup.length,
        firstJadwal: first,
      });
    });

    return result;
  }, [jadwalData, selectedDay, lessonPlans, jurnalMengajar, todayISODate]);

  const handleStartAbsensi = (sesi: any) => {
    if (!sesi.isLPReady) {
      toast.error(
        `Lesson Plan (RPP) untuk "${sesi.namaMapel} - ${sesi.namaKelas}" belum disetujui oleh Kepala Sekolah & Direktur. Pastikan RPP telah disetujui sebelum melakukan absensi.`
      );
      return;
    }

    // Navigasi ke halaman Absensi Mapel dengan data sesi yang sudah terisi otomatis (langsung ke Step 2)
    navigate("/kbm/absensi/mata-pelajaran", {
      state: {
        preselected: {
          jadwal_ids: sesi.jadwalIds,
          kelas_id: sesi.kelasId,
          mapel_id: sesi.mapelId,
          kelas_nama: sesi.namaKelas,
          mapel_nama: sesi.namaMapel,
          lesson_plan_detail_id: sesi.defaultLP ? sesi.defaultLP.lesson_plan_id : null,
          pertemuan: null,
          step: 2, // langsung ke step pilih pertemuan
        },
      },
    });
  };

  const handleViewJurnal = () => {
    navigate("/kbm/jurnal-mengajar");
  };

  return (
    <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden bg-white">
      {/* HEADER SECTION */}
      <CardHeader className="p-5 md:p-6 bg-linear-to-r from-[#1E3A8A]/5 via-indigo-50/40 to-blue-50/20 border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#1E3A8A] text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
                  Daftar Absensi Mengajar Siap Pakai
                </CardTitle>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Presensi Cepat
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Hari ini: <strong className="text-slate-700 font-semibold">{realTodayName}, {todayDateFormatted}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Klik kartu untuk langsung mengisi presensi siswa</span>
              </p>
            </div>
          </div>

          {/* FILTER HARI (PILLS) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {INDONESIAN_DAYS.map((dayName) => {
              const isCurrentSelected = selectedDay === dayName;
              const isToday = realTodayName === dayName;
              return (
                <button
                  key={dayName}
                  type="button"
                  onClick={() => setSelectedDay(dayName)}
                  className={`h-8 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 flex items-center gap-1 ${
                    isCurrentSelected
                      ? "bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-2xs scale-102"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span>{dayName}</span>
                  {isToday && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCurrentSelected ? "bg-emerald-400" : "bg-emerald-500"
                      }`}
                      title="Hari Ini"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      {/* BODY CONTENT (GRID OF SCHEDULES) */}
      <CardContent className="p-5 md:p-6">
        {isLoadingJadwal ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Memuat jadwal mengajar...</span>
          </div>
        ) : groupedSesiToday.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 mb-1">
              Tidak Ada Jadwal Mengajar pada Hari {selectedDay}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mb-4">
              Anda tidak memiliki jadwal mata pelajaran yang terjadwal di hari {selectedDay}.
              Silakan pilih hari lain pada tab di atas untuk melihat jadwal lainnya.
            </p>
            {selectedDay !== realTodayName && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDay(realTodayName)}
                className="rounded-xl text-xs font-semibold text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
              >
                Kembali ke Hari Ini ({realTodayName})
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedSesiToday.map((sesi: any) => {
              const isToday = selectedDay === realTodayName;

              return (
                <div
                  key={sesi.sesiKey}
                  className={`group rounded-2xl border transition-all duration-300 relative flex flex-col justify-between overflow-hidden ${
                    sesi.isCompletedToday
                      ? "bg-emerald-50/20 border-emerald-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300"
                      : !sesi.isLPReady
                      ? "bg-amber-50/15 border-amber-200/80 shadow-2xs opacity-90"
                      : "bg-white border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 hover:ring-2 hover:ring-indigo-500/10"
                  }`}
                >
                  {/* Top Header Bar inside Card */}
                  <div className="p-5 pb-4 space-y-3.5">
                    {/* Baris Atas: Jam & Kelas */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/70 rounded-lg">
                          <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                          {sesi.labelJam}
                        </span>
                        {sesi.timeRangeStr && (
                          <span className="text-[11px] font-semibold text-slate-500">
                            ({sesi.timeRangeStr})
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
                        <School className="w-3.5 h-3.5 text-slate-500" />
                        Kelas {sesi.namaKelas}
                      </span>
                    </div>

                    {/* Judul Mata Pelajaran */}
                    <div>
                      <h4 className="text-base font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                        {sesi.namaMapel}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {sesi.jumlahJam} Jam Pelajaran ({sesi.hari})
                      </p>
                    </div>

                    {/* Status Badges */}
                    <div className="pt-2 border-t border-slate-100/80 flex flex-wrap items-center gap-1.5">
                      {/* Status RPP */}
                      {sesi.isLPReady ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          RPP Siap (16 Pertemuan)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          RPP Belum Disetujui
                        </span>
                      )}

                      {/* Status Pengisian Hari Ini */}
                      {isToday && (
                        sesi.isCompletedToday ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Sudah Absensi (Pertemuan {sesi.completedMeetingNo})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                            <Clock className="w-3 h-3 text-blue-600" />
                            Belum Absensi Hari Ini
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* BOTTOM ACTION BUTTON */}
                  <div className="p-4 pt-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-500">
                      Selesai: <strong className="text-slate-700 font-bold">{sesi.totalCompletedCount} sesi</strong>
                    </span>

                    {sesi.isCompletedToday ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleViewJurnal}
                        className="h-8 px-3 rounded-xl text-xs font-bold text-emerald-700 border-emerald-300 bg-white hover:bg-emerald-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <span>Lihat Jurnal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleStartAbsensi(sesi)}
                        disabled={!sesi.isLPReady}
                        className={`h-8.5 px-3.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                          sesi.isLPReady
                            ? "bg-[#1E3A8A] hover:bg-blue-800 text-white shadow-blue-900/10 group-hover:scale-102"
                            : "bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed"
                        }`}
                        title={
                          sesi.isLPReady
                            ? "Mulai isi presensi siswa untuk kelas ini"
                            : "RPP belum disetujui"
                        }
                      >
                        <span>Isi Absensi</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
