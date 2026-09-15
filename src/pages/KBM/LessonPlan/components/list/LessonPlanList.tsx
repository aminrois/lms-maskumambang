import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, Download, CheckCircle2, XCircle, ChevronUp, ChevronDown, Pencil, Send, Upload, Eye, Clock, Calendar
} from "lucide-react";
import { resolveStatus, type LessonPlanSummary } from "../../hooks/useLessonPlanList";
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
  onOpenPertemuan: (plan: LessonPlanSummary, detail: LESSON_PLAN_DETAIL) => void;
  onKirimVerifikasi?: (plan: LessonPlanSummary) => void;
  isSendingVerification?: boolean;
  getJadwalInfo?: (plan: LessonPlanSummary) => { hari: string; jam_mulai: string; jam_selesai: string; nama_kelas: string; ruangan: string } | null;
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
  onOpenPertemuan,
  onKirimVerifikasi,
  isSendingVerification,
  getJadwalInfo,
}: LessonPlanListProps) {
  const pegawaiId = useAuthStore((state) => state.user?.pegawai_id);
  const isReadOnlyRole = role === "Direktur" || role === "Kepala Sekolah" || role === "WaKa Kurikulum";

  return (
    <div className="space-y-4">
      {isLoading ? (
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6 flex items-center justify-center text-gray-500">
            <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" /> Memuat lesson plan...
          </CardContent>
        </Card>
      ) : filteredLessonPlans.length === 0 ? (
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6 text-center text-gray-500">Belum ada lesson plan untuk filter ini.</CardContent>
        </Card>
      ) : (
        filteredLessonPlans.map((plan) => {
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

          const all32Details: LESSON_PLAN_DETAIL[] = Array.from({ length: 16 }, (_, idx) => {
            const pKe = idx + 1;
            return detailsMap.get(pKe) || {
              detail_id: 0,
              lesson_plan_id: plan.lesson_plan_id,
              pertemuan_ke: pKe,
              materi: "",
              topik_materi: "",
            };
          });


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
                    <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center font-bold text-xs ${statusRingkas === "Disetujui"
                      ? "bg-green-100 text-green-700"
                      : statusRingkas.includes("Revisi")
                        ? "bg-red-100 text-red-700"
                        : statusRingkas === "Menunggu Verifikasi Direktur"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                      16/16
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
                      {plan.status_verifikasi_kepsek === "Revisi" && plan.catatan_revisi_kepsek && (
                        <div className="text-xs text-red-700 mt-2 bg-red-50/80 px-2.5 py-1.5 rounded-lg border border-red-100 flex flex-wrap gap-1 items-center">
                          <span className="font-bold shrink-0">Kepala Sekolah:</span>
                          <span className="italic">"{plan.catatan_revisi_kepsek}"</span>
                        </div>
                      )}
                      {plan.status_verifikasi_direktur === "Revisi" && plan.catatan_revisi_direktur && (
                        <div className="text-xs text-red-700 mt-2 bg-red-50/80 px-2.5 py-1.5 rounded-lg border border-red-100 flex flex-wrap gap-1 items-center">
                          <span className="font-bold shrink-0">Direktur:</span>
                          <span className="italic">"{plan.catatan_revisi_direktur}"</span>
                        </div>
                      )}
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

                    {/* ALUR VERIFIKASI SEKUENSIAL: Kepala Sekolah -> Direktur */}
                    {canVerify && (
                      (role === "Kepala Sekolah" && plan.status_verifikasi_kepsek !== "Disetujui" && plan.status_verifikasi_kepsek !== "Revisi") ||
                      (role === "Direktur" && plan.status_verifikasi_kepsek === "Disetujui" && plan.status_verifikasi_direktur !== "Disetujui" && plan.status_verifikasi_direktur !== "Revisi") ||
                      (role === "Super Admin" && (plan.status_verifikasi_kepsek !== "Disetujui" || plan.status_verifikasi_direktur !== "Disetujui"))
                    ) && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); onVerifyAction(plan, "Disetujui"); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                            title="Setuju"
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span>Setujui</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onVerifyAction(plan, "Revisi"); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                            title="Tolak / Revisi"
                          >
                            <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                            <span>Revisi</span>
                          </button>
                        </>
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
                        {isReadOnlyRole ? "Klik tombol Lihat Pertemuan pada card di bawah untuk membuka detail" : "Klik tombol Edit Pertemuan pada card di bawah untuk membuka halaman edit"}
                      </span>
                    </div>

                    {/* CARD BESAR PERTEMUAN GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {all32Details.map((dt) => {
                        return (
                          <div
                            key={dt.pertemuan_ke}
                            className="p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 bg-white shadow-2xs border-slate-200/80 hover:border-indigo-300 hover:shadow-xs"
                          >
                            <div className="space-y-2">
                              {/* Header Card Pertemuan */}
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {dt.pertemuan_ke}
                                  </div>
                                  <span className="font-bold text-xs text-slate-800">
                                    Pertemuan Ke-{dt.pertemuan_ke}
                                  </span>
                                </div>
                              </div>

                              {/* Info Content Card */}
                              <div className="space-y-1.5 pt-1 text-xs">
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
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">
                                    {dt.pelaksanaan_kbm || "Senin"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Tombol Lihat / Edit Pertemuan */}
                            <Button
                              type="button"
                              onClick={() => onOpenPertemuan(plan, dt)}
                              className={`w-full rounded-xl font-bold h-9 text-xs transition-all shadow-2xs cursor-pointer border ${isReadOnlyRole
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
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
