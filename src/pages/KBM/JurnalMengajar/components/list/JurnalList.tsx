import { 
  BookOpen, Trash2, User, Clock, ChevronRight, Loader2, 
  CheckCircle2, TrendingDown, TrendingUp, AlertTriangle 
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { JurnalUI } from "../../hooks/useJurnalMengajarList";

interface JurnalListProps {
  isLoading: boolean;
  filteredData: JurnalUI[];
  paginatedData: JurnalUI[];
  canDelete: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  itemsPerPage: number;
  onConfirmDelete: (e: React.MouseEvent, jurnal: JurnalUI) => void;
  onViewDetail: (id: number) => void;
}

export function getStatusBadge(status: string) {
  switch (status) {
    case "Sesuai":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider rounded-md border border-green-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Sesuai
        </span>
      );
    case "Tertinggal":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider rounded-md border border-red-200">
          <TrendingDown className="w-3.5 h-3.5" /> Tertinggal
        </span>
      );
    case "Terlalu Cepat":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-md border border-amber-200">
          <TrendingUp className="w-3.5 h-3.5" /> Terlalu Cepat
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-md border border-gray-200">
          <AlertTriangle className="w-3.5 h-3.5" /> Unknown
        </span>
      );
  }
}

export function JurnalList({
  isLoading,
  filteredData,
  paginatedData,
  canDelete,
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  onConfirmDelete,
  onViewDetail
}: JurnalListProps) {
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-500 font-semibold">Memuat daftar jurnal...</span>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="p-16 text-center text-slate-500 italic bg-white border border-slate-100 rounded-2xl shadow-sm">
          Tidak ada jurnal mengajar yang ditemukan.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedData.map((jurnal) => (
              <div
                key={jurnal.jurnal_id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 group flex flex-col h-full cursor-pointer hover:border-blue-300 relative overflow-hidden"
                onClick={() => onViewDetail(jurnal.jurnal_id)}
              >
                <div className="flex justify-between items-start gap-2.5 mb-4">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base border border-blue-100/50 shrink-0">
                      <BookOpen className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-gray-800 truncate" title={jurnal.mapel}>
                        {jurnal.mapel}
                      </h3>
                      <p className="text-xs font-semibold text-blue-600 truncate">
                        Kelas {jurnal.kelas}
                      </p>
                    </div>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-2xs cursor-pointer shrink-0"
                      onClick={(e) => onConfirmDelete(e, jurnal)}
                      title="Hapus Jurnal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 flex-1 text-xs text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="line-clamp-1 font-medium" title={jurnal.guru}>{jurnal.guru}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-medium">
                      {jurnal.tanggal ? format(new Date(jurnal.tanggal), 'dd MMMM yyyy', { locale: idLocale }) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-1 flex-wrap">
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                      Pert. {jurnal.pertemuan_ke}
                    </span>
                    {getStatusBadge(jurnal.status)}
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:text-blue-800 transition-colors"
                  >
                    Lihat Detail & Absensi <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs gap-4 mt-6">
              <div className="text-xs text-slate-500 font-semibold">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} jurnal
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors bg-white text-slate-655"
                >
                  Sebelumnya
                </button>
                <div className="flex items-center px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors bg-white text-slate-655"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
