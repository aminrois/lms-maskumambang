import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, Calendar, CalendarCheck, CalendarPlus, CheckCircle2, 
  Edit2, Loader2, Trash2, XCircle 
} from "lucide-react";
import type { ActivityPlanWithLembaga } from "../hooks/useActivityPlan";

interface ActivityPlanListProps {
  isLoading: boolean;
  filteredActivity: ActivityPlanWithLembaga[];
  kalenderEvents: any[];
  canVerify: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isAdakanPending: boolean;
  onAdakan: (item: ActivityPlanWithLembaga) => void;
  onVerifyAction: (item: ActivityPlanWithLembaga, action: "Disetujui" | "Revisi") => void;
  onOpenEdit: (item: ActivityPlanWithLembaga) => void;
  onOpenDelete: (item: ActivityPlanWithLembaga) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
}

export function ActivityPlanList({
  isLoading,
  filteredActivity,
  kalenderEvents,
  canVerify,
  canUpdate,
  canDelete,
  isAdakanPending,
  onAdakan,
  onVerifyAction,
  onOpenEdit,
  onOpenDelete,
  currentPage,
  setCurrentPage,
  totalPages
}: ActivityPlanListProps) {
  return (
    <div className="space-y-4">
      {isLoading ? (
        <Card>
          <CardContent className="p-6 flex items-center justify-center text-gray-500">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat activity plan...
          </CardContent>
        </Card>
      ) : filteredActivity.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            Tidak ada activity plan.
          </CardContent>
        </Card>
      ) : (
        filteredActivity.map((item) => (
          <Card
            key={item.activity_id}
            className={`border-l-4 ${
              item.status_verifikasi === "Disetujui"
                ? "border-l-green-500 bg-green-50/10"
                : item.status_verifikasi === "Revisi"
                ? "border-l-red-500 bg-red-50/10"
                : "border-l-amber-500 bg-amber-50/10"
            }`}
          >
            <CardContent className="p-5 flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                  <h3 className="font-bold text-gray-900 text-base">{item.nama_kegiatan}</h3>
                  <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0">
                    {item.kategori}
                  </span>
                  {item.lembaga && (
                    <span className="text-xs font-semibold text-gray-500 flex items-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 mr-1" />
                      {item.lembaga.singkatan || item.lembaga.nama_lembaga}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{item.deskripsi || "Tidak ada deskripsi."}</p>
                <div className="flex items-center space-x-4 text-xs font-medium text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {item.tanggal_mulai} s/d {item.tanggal_berakhir}
                  </div>
                </div>
                {item.catatan_revisi && (
                  <div className="mt-2 pt-2 border-t text-xs text-red-600 bg-red-50/50 p-2 rounded-lg border-red-100 border">
                    <strong>Catatan Revisi:</strong> {item.catatan_revisi}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-col justify-between items-start sm:items-end gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    item.status_verifikasi === "Disetujui"
                      ? "bg-green-100 text-green-700"
                      : item.status_verifikasi === "Revisi"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.status_verifikasi ?? "Menunggu Verifikasi"}
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {canVerify && item.status_verifikasi === "Disetujui" && (() => {
                    const isAlreadyInCalendar = kalenderEvents.some((evt: any) => 
                      evt.nama_kegiatan === item.nama_kegiatan &&
                      evt.kategori === item.kategori &&
                      evt.tanggal_mulai === item.tanggal_mulai &&
                      evt.tanggal_berakhir === item.tanggal_berakhir
                    );
                    return isAlreadyInCalendar ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled
                        className="h-8 w-8 text-gray-400 bg-gray-50 rounded-lg cursor-not-allowed"
                        title="Sudah ditambahkan ke Kalender Akademik"
                      >
                        <CalendarCheck className="w-4 h-4 text-emerald-500" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAdakan(item)}
                        disabled={isAdakanPending}
                        className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg cursor-pointer"
                        title="Tambahkan ke Kalender Akademik"
                      >
                        {isAdakanPending
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <CalendarPlus className="w-4 h-4" />}
                      </Button>
                    );
                  })()}
                  {canVerify && item.status_verifikasi !== "Disetujui" && (
                    <>
                      <button
                        onClick={() => onVerifyAction(item, "Disetujui")}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                        title="Setuju"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>Setujui</span>
                      </button>
                      <button
                        onClick={() => onVerifyAction(item, "Revisi")}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                        title="Tolak / Revisi"
                      >
                        <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>Revisi</span>
                      </button>
                    </>
                  )}
                  {canUpdate && (
                    <button
                      onClick={() => onOpenEdit(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Edit</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onOpenDelete(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || isLoading}
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-gray-600 font-medium px-4">
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || isLoading}
          >
            Selanjutnya
          </Button>
        </div>
      )}
    </div>
  );
}
