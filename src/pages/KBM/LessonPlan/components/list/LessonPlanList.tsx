import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, Download, CheckCircle2, XCircle, ChevronUp, ChevronDown, Pencil, Send, Upload, Eye, Clock, Calendar, Check, AlertCircle
} from "lucide-react";
import { resolveStatus, resolveDetailStatus, type LessonPlanSummary } from "../../hooks/useLessonPlanList";
import type { LESSON_PLAN_DETAIL } from "@/types/database";
import { useAuthStore } from "@/store/useAuthStore";

interface LessonPlanListProps {
  isLoading: boolean;
  filteredLessonPlans: LessonPlanSummary[];
  expandedPlans: number[];
  onToggleExpand: (id: number) => void;
  onExport: (plan: LessonPlanSummary) => void;
  onImport?: (plan: LessonPlanSummary) => void;
  canVerify: boolean;
  role: string | null;
  onVerifyAction: (plan: LessonPlanSummary, action: "Disetujui" | "Revisi") => void;
  onVerifyDetailAction?: (plan: LessonPlanSummary, detail: LESSON_PLAN_DETAIL, action: "Disetujui" | "Revisi") => void;
  onOpenPertemuan: (plan: LessonPlanSummary, detail: LESSON_PLAN_DETAIL) => void;
  onKirimVerifikasi?: (plan: LessonPlanSummary) => void;
  isSendingVerification?: boolean;
  getJadwalInfo?: (plan: LessonPlanSummary) => { hari: string; jam_mulai: string; jam_selesai: string; jumlah_jam: number; nama_kelas: string; ruangan: string } | null;
  pertemuanFilter?: number | null;
}

export function LessonPlanList({
  isLoading,
  filteredLessonPlans,
  expandedPlans,
  onToggleExpand,
  onExport,
  onImport,
  canVerify,
  role,
  onVerifyAction,
  onVerifyDetailAction,
  onOpenPertemuan,
  onKirimVerifikasi,
  isSendingVerification,
  getJadwalInfo,
  pertemuanFilter = null,
}: LessonPlanListProps) {
  const pegawaiId = useAuthStore((state) => state.user?.pegawai_id);
  const isReadOnlyRole = role === "Direktur" || role === "Kepala Sekolah" || role === "WaKa Kurikulum";

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardContent className="p-6 flex items-center justify-center text-gray-500">
          <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" /> Memuat lesson plan...
        </CardContent>
      </Card>
    );
  }

  if (filteredLessonPlans.length === 0) {
    return (
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardContent className="p-6 text-center text-gray-500">
          {pertemuanFilter !== null
            ? `Belum ada data Pertemuan Ke-${pertemuanFilter} untuk filter ini.`
            : "Belum ada lesson plan untuk filter ini."}
        </CardContent>
      </Card>
    );
  }

  // TAMPILAN KHUSUS FILTER PER PERTEMUAN ([1] [2] [3] ... [16])
  // Menampilkan kartu pertemuan terpilih dari semua guru dan mata pelajaran
  if (pertemuanFilter !== null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-indigo-50/80 border border-indigo-200 px-4 py-3 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
              {pertemuanFilter}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                Menampilkan Pertemuan Ke-{pertemuanFilter}
              </h3>
              <p className="text-[11px] text-slate-500">
                Daftar materi dan status verifikasi Pertemuan {pertemuanFilter} dari semua guru & mata pelajaran
              </p>
            </div>
          </div>
        </div>

        {filteredLessonPlans.map((plan) => {
          const dt: LESSON_PLAN_DETAIL = (plan.details || []).find((d) => d.pertemuan_ke === pertemuanFilter) || {
            detail_id: 0,
            lesson_plan_id: plan.lesson_plan_id,
            pertemuan_ke: pertemuanFilter,
            materi: "",
            topik_materi: "",
            status_verifikasi_kepsek: "Menunggu Verifikasi",
            status_verifikasi_direktur: "Menunggu Verifikasi",
          };

          const dtStatus = resolveDetailStatus(dt);
          const dtBadgeClass =
            dtStatus === "Disetujui"
              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
              : dtStatus.includes("Revisi")
                ? "bg-rose-100 text-rose-800 border-rose-200"
                : dtStatus === "Menunggu Verifikasi Direktur"
                  ? "bg-purple-100 text-purple-800 border-purple-200"
                  : "bg-amber-100 text-amber-800 border-amber-200";

          const isKepsekCanVerify =
            canVerify &&
            role === "Kepala Sekolah" &&
            dt.status_verifikasi_kepsek !== "Disetujui" &&
            dt.status_verifikasi_kepsek !== "Revisi";

          const isDirekturCanVerify =
            canVerify &&
            role === "Direktur" &&
            dt.status_verifikasi_kepsek === "Disetujui" &&
            dt.status_verifikasi_direktur !== "Disetujui" &&
            dt.status_verifikasi_direktur !== "Revisi";

          const isSuperAdminCanVerify =
            canVerify &&
            role === "Super Admin" &&
            (dt.status_verifikasi_kepsek !== "Disetujui" || dt.status_verifikasi_direktur !== "Disetujui");

          const jadwalInfo = getJadwalInfo ? getJadwalInfo(plan) : null;

          return (
            <Card
              key={plan.lesson_plan_id}
              className={`border-l-4 overflow-hidden rounded-2xl border-y-slate-100 border-r-slate-100 shadow-sm transition-all bg-white ${
                dtStatus === "Disetujui"
                  ? "border-l-green-500 hover:border-emerald-300"
                  : dtStatus.includes("Revisi")
                    ? "border-l-red-500 hover:border-rose-300"
                    : dtStatus === "Menunggu Verifikasi Direktur"
                      ? "border-l-purple-500 hover:border-purple-300"
                      : "border-l-amber-500 hover:border-amber-300"
              }`}
            >
              <CardContent className="p-5 space-y-4">
                {/* HEADER: Pertemuan Ke, Info RPP, Mapel, Guru, Jadwal & Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 shrink-0 rounded-2xl flex flex-col items-center justify-center font-bold border ${
                        dtStatus === "Disetujui"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : dtStatus.includes("Revisi")
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                      }`}
                    >
                      <span className="text-sm">{dt.pertemuan_ke}</span>
                      <span className="text-[8px] font-medium leading-none">Pertemuan</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-800 text-sm">{plan.judul_rpp}</h3>
                        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0">
                          {plan.nama_mapel || "Mata Pelajaran"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">
                        {plan.nama_guru || "Guru Pengampu"}
                      </p>
                      {/* Jadwal Info tags */}
                      {jadwalInfo && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {jadwalInfo.hari && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                              <Calendar className="w-3 h-3 shrink-0" />
                              {jadwalInfo.hari}
                            </span>
                          )}
                          {jadwalInfo.jam_mulai && jadwalInfo.jam_selesai && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3 shrink-0" />
                              {jadwalInfo.jam_mulai} – {jadwalInfo.jam_selesai}
                              {jadwalInfo.jumlah_jam > 1 && (
                                <span className="ml-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                                  ({jadwalInfo.jumlah_jam} jam pelajaran)
                                </span>
                              )}
                            </span>
                          )}
                          {jadwalInfo.nama_kelas && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
                              {jadwalInfo.nama_kelas}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${dtBadgeClass}`}>
                      {dtStatus}
                    </span>
                  </div>
                </div>

                {/* BODY: Materi & Subtopik & Pelaksanaan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                      Materi Pembelajaran
                    </span>
                    <p className="font-semibold text-slate-800">
                      {dt.materi || <span className="text-slate-400 italic font-normal">Belum ditentukan</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                      Sub-Topik / Pokok Bahasan
                    </span>
                    <p className="text-slate-600 font-medium">
                      {dt.topik_materi || <span className="text-slate-400 italic font-normal">-</span>}
                    </p>
                  </div>
                </div>

                {/* Catatan Revisi Kepsek */}
                {dt.status_verifikasi_kepsek === "Revisi" && dt.catatan_revisi_kepsek && (
                  <div className="text-xs text-rose-700 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 flex flex-col gap-0.5">
                    <span className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Catatan Revisi Kepala Sekolah:
                    </span>
                    <span className="italic pl-5">"{dt.catatan_revisi_kepsek}"</span>
                  </div>
                )}

                {/* Catatan Revisi Direktur */}
                {dt.status_verifikasi_direktur === "Revisi" && dt.catatan_revisi_direktur && (
                  <div className="text-xs text-rose-700 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 flex flex-col gap-0.5">
                    <span className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Catatan Revisi Direktur:
                    </span>
                    <span className="italic pl-5">"{dt.catatan_revisi_direktur}"</span>
                  </div>
                )}

                {/* Notice for Direktur if Kepsek hasn't approved */}
                {role === "Direktur" && dt.status_verifikasi_kepsek !== "Disetujui" && (
                  <div className="text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                    ⏳ Menunggu persetujuan Kepala Sekolah terlebih dahulu sebelum dapat disetujui Direktur.
                  </div>
                )}

                {/* FOOTER ACTIONS */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Button Setujui / Revisi for this meeting */}
                    {onVerifyDetailAction && (isKepsekCanVerify || isDirekturCanVerify || isSuperAdminCanVerify) && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onVerifyDetailAction(plan, dt, "Disetujui")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3.5 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                          title={`Setujui Pertemuan Ke-${dt.pertemuan_ke}`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui Pertemuan {dt.pertemuan_ke}</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onVerifyDetailAction(plan, dt, "Revisi")}
                          className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-bold text-xs h-8 px-3.5 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                          title={`Minta Revisi Pertemuan Ke-${dt.pertemuan_ke}`}
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Minta Revisi</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => onOpenPertemuan(plan, dt)}
                      className={`rounded-xl font-bold h-8 px-3.5 text-xs transition-all shadow-2xs cursor-pointer border ${
                        isReadOnlyRole
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                          : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                      }`}
                    >
                      {isReadOnlyRole ? (
                        <>
                          <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-600" /> Lihat Pertemuan Ke-{dt.pertemuan_ke}
                        </>
                      ) : (
                        <>
                          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit Pertemuan Ke-{dt.pertemuan_ke}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredLessonPlans.map((plan) => {
        const statusRingkas = plan.status_ringkas || resolveStatus(plan);
          const badgeClass =
            statusRingkas === "Disetujui"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold"
              : statusRingkas.includes("Revisi")
                ? "bg-rose-100 text-rose-800 border border-rose-200 font-bold"
                : statusRingkas.includes("Menunggu")
                  ? "bg-purple-100 text-purple-800 border border-purple-200 font-bold"
                  : "bg-amber-100 text-amber-800 border border-amber-200 font-bold";

          const isExpanded = expandedPlans.includes(plan.lesson_plan_id);

          // Pastikan ada 16 pertemuan
          const detailsMap = new Map<number, LESSON_PLAN_DETAIL>();
          (plan.details || []).forEach(d => detailsMap.set(d.pertemuan_ke, d));

          const all16Details: LESSON_PLAN_DETAIL[] = Array.from({ length: 16 }, (_, idx) => {
            const pKe = idx + 1;
            return detailsMap.get(pKe) || {
              detail_id: 0,
              lesson_plan_id: plan.lesson_plan_id,
              pertemuan_ke: pKe,
              materi: "",
              topik_materi: "",
              status_verifikasi_kepsek: "Menunggu Verifikasi",
              status_verifikasi_direktur: "Menunggu Verifikasi",
            };
          });

          const approvedMeetingsCount = (plan.details || []).filter(
            d => d.status_verifikasi_kepsek === "Disetujui" && d.status_verifikasi_direktur === "Disetujui"
          ).length;

          return (
            <Card
              key={plan.lesson_plan_id}
              className={`border-l-4 overflow-hidden rounded-2xl border-y-slate-100 border-r-slate-100 shadow-sm transition-all ${statusRingkas === "Disetujui"
                ? "border-l-green-500 bg-green-50/5"
                : statusRingkas.includes("Revisi")
                  ? "border-l-red-500 bg-red-50/5"
                  : statusRingkas === "Menunggu Verifikasi Direktur"
                    ? "border-l-purple-500 bg-purple-50/5"
                    : "border-l-amber-500 bg-amber-50/5"
                }`}
            >
              <CardContent className="p-0">
                <div
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => onToggleExpand(plan.lesson_plan_id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-10 shrink-0 rounded-2xl flex flex-col items-center justify-center font-bold text-xs ${statusRingkas === "Disetujui"
                      ? "bg-green-100 text-green-700"
                      : statusRingkas.includes("Revisi")
                        ? "bg-red-100 text-red-700"
                        : statusRingkas === "Menunggu Verifikasi Direktur"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                      <span>{approvedMeetingsCount}/16</span>
                      <span className="text-[9px] font-medium leading-none">Disetujui</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h3 className="font-bold text-gray-800 text-sm">{plan.judul_rpp}</h3>
                        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0">
                          {plan.nama_mapel || "Mata Pelajaran"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {plan.nama_guru || "Guru Pengampu"} · 16 Pertemuan Tersedia
                      </p>
                      {/* Hari & Jam Akademik */}
                      {(() => {
                        const info = getJadwalInfo ? getJadwalInfo(plan) : null;
                        if (!info) return null;
                        return (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {info.hari && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                                <Calendar className="w-3 h-3 shrink-0" />
                                {info.hari}
                              </span>
                            )}
                            {info.jam_mulai && info.jam_selesai && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3 shrink-0" />
                                {info.jam_mulai} – {info.jam_selesai}
                                {info.jumlah_jam > 1 && (
                                  <span className="ml-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                                    ({info.jumlah_jam} jam pelajaran)
                                  </span>
                                )}
                              </span>
                            )}
                            {info.nama_kelas && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
                                {info.nama_kelas}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 flex-wrap justify-end sm:justify-start">
                    {statusRingkas !== "Disetujui" && !isReadOnlyRole && (plan.pegawai_id === pegawaiId || role === "Guru" || role === "Wali Kelas") && (
                      <Button
                        variant="ghost"
                        className="hover:text-gray-700 h-8 px-2.5 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 rounded-lg cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onImport) onImport(plan);
                        }}
                        title="Impor Lesson Plan"
                      >
                        <Upload className="w-4 h-4 mr-1.5" />
                        Impor
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="hover:text-gray-700 h-8 px-2.5 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 rounded-lg cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); onExport(plan); }}
                      title="Ekspor Lesson Plan"
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      Ekspor
                    </Button>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 ${badgeClass}`}>{statusRingkas}</span>

                    {/* TOMBOL KIRIM VERIFIKASI (MUNCUL JIKA BELUM MENUNGGU/DISETUJUI DAN DIBUAT OLEH GURU) */}
                    {onKirimVerifikasi && !isReadOnlyRole && statusRingkas !== "Disetujui" && !statusRingkas.startsWith("Menunggu") && (
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onKirimVerifikasi(plan);
                        }}
                        disabled={isSendingVerification}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 px-3 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="Kirim RPP ini untuk diverifikasi Kepala Sekolah & Direktur"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Verifikasi</span>
                      </Button>
                    )}

                    {/* OPSI SETUJUI SEMUA PERTEMUAN (KEPSEK / DIREKTUR) */}
                    {canVerify && (
                      (role === "Kepala Sekolah" && plan.status_verifikasi_kepsek !== "Disetujui" && plan.status_verifikasi_kepsek !== "Revisi") ||
                      (role === "Direktur" && plan.status_verifikasi_kepsek === "Disetujui" && plan.status_verifikasi_direktur !== "Disetujui" && plan.status_verifikasi_direktur !== "Revisi") ||
                      (role === "Super Admin" && (plan.status_verifikasi_kepsek !== "Disetujui" || plan.status_verifikasi_direktur !== "Disetujui"))
                    ) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onVerifyAction(plan, "Disetujui"); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          title="Setujui Semua Pertemuan RPP Ini Sekaligus"
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>Setujui Semua (16)</span>
                        </button>
                      )}
                    <div className="pl-2 border-l border-slate-200 shrink-0">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <span>Daftar Pertemuan (16 Pertemuan)</span>
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {isReadOnlyRole ? "Verifikasi dapat dilakukan per pertemuan pada setiap card di bawah" : "Status verifikasi ditampilkan pada setiap card pertemuan"}
                      </span>
                    </div>

                    {/* CARD PERTEMUAN GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {all16Details.map((dt) => {
                        const dtStatus = resolveDetailStatus(dt);
                        const dtBadgeClass =
                          dtStatus === "Disetujui"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : dtStatus.includes("Revisi")
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : dtStatus === "Menunggu Verifikasi Direktur"
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : "bg-amber-100 text-amber-800 border-amber-200";

                        const isKepsekCanVerify =
                          canVerify &&
                          role === "Kepala Sekolah" &&
                          dt.status_verifikasi_kepsek !== "Disetujui" &&
                          dt.status_verifikasi_kepsek !== "Revisi";

                        const isDirekturCanVerify =
                          canVerify &&
                          role === "Direktur" &&
                          dt.status_verifikasi_kepsek === "Disetujui" &&
                          dt.status_verifikasi_direktur !== "Disetujui" &&
                          dt.status_verifikasi_direktur !== "Revisi";

                        const isSuperAdminCanVerify =
                          canVerify &&
                          role === "Super Admin" &&
                          (dt.status_verifikasi_kepsek !== "Disetujui" || dt.status_verifikasi_direktur !== "Disetujui");

                        return (
                          <div
                            key={dt.pertemuan_ke}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 bg-white shadow-2xs ${
                              dtStatus === "Disetujui"
                                ? "border-emerald-200 hover:border-emerald-300"
                                : dtStatus.includes("Revisi")
                                  ? "border-rose-200 hover:border-rose-300"
                                  : "border-slate-200/80 hover:border-indigo-300 hover:shadow-xs"
                            }`}
                          >
                            <div className="space-y-2.5">
                              {/* Header Card Pertemuan: Pertemuan Ke-X + Badge Status Pertemuan */}
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center border ${
                                    dtStatus === "Disetujui"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : dtStatus.includes("Revisi")
                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  }`}>
                                    {dt.pertemuan_ke}
                                  </div>
                                  <span className="font-bold text-xs text-slate-800">
                                    Pertemuan Ke-{dt.pertemuan_ke}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${dtBadgeClass}`}>
                                  {dtStatus}
                                </span>
                              </div>

                              {/* Info Content Card */}
                              <div className="space-y-1.5 pt-0.5 text-xs">
                                <div>
                                  <span className="text-[10px] font-semibold uppercase text-slate-400 block">Materi Pembelajaran</span>
                                  <p className="font-semibold text-slate-700 line-clamp-1">
                                    {dt.materi || <span className="text-slate-400 italic font-normal">Belum ditentukan</span>}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] font-semibold uppercase text-slate-400 block">Sub-Topik / Pokok Bahasan</span>
                                  <p className="text-slate-600 line-clamp-1 font-medium">
                                    {dt.topik_materi || <span className="text-slate-400 italic font-normal">-</span>}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">
                                    {dt.pelaksanaan_kbm || "Senin"}
                                  </span>
                                </div>

                                {/* Catatan Revisi Kepsek */}
                                {dt.status_verifikasi_kepsek === "Revisi" && dt.catatan_revisi_kepsek && (
                                  <div className="text-[11px] text-rose-700 mt-2 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 flex flex-col gap-0.5">
                                    <span className="font-bold flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3 shrink-0" />
                                      Revisi Kepala Sekolah:
                                    </span>
                                    <span className="italic">"{dt.catatan_revisi_kepsek}"</span>
                                  </div>
                                )}

                                {/* Catatan Revisi Direktur */}
                                {dt.status_verifikasi_direktur === "Revisi" && dt.catatan_revisi_direktur && (
                                  <div className="text-[11px] text-rose-700 mt-2 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 flex flex-col gap-0.5">
                                    <span className="font-bold flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3 shrink-0" />
                                      Revisi Direktur:
                                    </span>
                                    <span className="italic">"{dt.catatan_revisi_direktur}"</span>
                                  </div>
                                )}

                                {/* Keterangan untuk Direktur jika Kepsek belum verifikasi */}
                                {role === "Direktur" && dt.status_verifikasi_kepsek !== "Disetujui" && (
                                  <div className="text-[10px] text-amber-700 bg-amber-50/80 px-2 py-1 rounded-md border border-amber-200">
                                    ⏳ Menunggu persetujuan Kepala Sekolah terlebih dahulu
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Tombol Aksi: Lihat/Edit Pertemuan + Tombol Verifikasi Per Pertemuan */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              {/* Tombol Verifikasi Per-Pertemuan (Kepsek / Direktur / Super Admin) */}
                              {onVerifyDetailAction && (isKepsekCanVerify || isDirekturCanVerify || isSuperAdminCanVerify) && (
                                <div className="grid grid-cols-2 gap-1.5">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => onVerifyDetailAction(plan, dt, "Disetujui")}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] h-8 rounded-lg shadow-2xs cursor-pointer flex items-center justify-center gap-1"
                                    title="Setujui Pertemuan Ini"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Setujui</span>
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onVerifyDetailAction(plan, dt, "Revisi")}
                                    className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-bold text-[11px] h-8 rounded-lg shadow-2xs cursor-pointer flex items-center justify-center gap-1"
                                    title="Tolak / Minta Revisi Pertemuan Ini"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Revisi</span>
                                  </Button>
                                </div>
                              )}

                              {/* Tombol Lihat / Edit Pertemuan */}
                              <Button
                                type="button"
                                onClick={() => onOpenPertemuan(plan, dt)}
                                className={`w-full rounded-xl font-bold h-8 text-xs transition-all shadow-2xs cursor-pointer border ${isReadOnlyRole
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                                }`}
                              >
                                {isReadOnlyRole ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-600" /> Lihat Pertemuan Ke-{dt.pertemuan_ke}
                                  </>
                                ) : (
                                  <>
                                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit Pertemuan Ke-{dt.pertemuan_ke}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}
