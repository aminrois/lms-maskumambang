import { 
  BookOpen, Trash2, User, Clock, ChevronRight, Loader2, 
  CheckCircle2, AlertTriangle, AlertCircle, XCircle
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

export function getStatusBadge(input: JurnalUI | string) {
  if (typeof input === 'string') {
    if (input === 'Belum Absensi' || input.includes('Belum')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-100 text-rose-700 text-[11px] font-bold uppercase tracking-wider rounded-md border border-rose-300">
          <XCircle className="w-3.5 h-3.5" /> {input}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider rounded-md border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" /> {input || "Terlaksana"}
      </span>
    );
  }

  if (!input.is_completed || input.is_danger) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-100 text-rose-700 text-[11px] font-bold uppercase tracking-wider rounded-md border border-rose-300">
        <XCircle className="w-3.5 h-3.5" /> Belum Mengajar & Absensi
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider rounded-md border border-emerald-200">
      <CheckCircle2 className="w-3.5 h-3.5" /> Terlaksana
    </span>
  );
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
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-gray-500 font-semibold text-sm">Memuat data sesi & jurnal mengajar...</span>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="p-16 text-center text-slate-500 italic bg-white border border-slate-100 rounded-2xl shadow-sm">
          Tidak ada sesi jurnal mengajar yang ditemukan untuk filter ini.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedData.map((jurnal, idx) => {
              const isDanger = !jurnal.is_completed || jurnal.is_danger;

              return (
                <div
                  key={jurnal.jurnal_id ? `jurnal_${jurnal.jurnal_id}` : `jadwal_${jurnal.jadwal_id}_${jurnal.tanggal}_${idx}`}
                  className={`rounded-2xl p-4 sm:p-5 transition-all duration-200 group flex flex-col h-full relative overflow-hidden ${
                    isDanger
                      ? "bg-linear-to-br from-rose-50/90 via-red-50/40 to-white border-2 border-rose-300 hover:border-rose-400 shadow-xs hover:shadow-md ring-2 ring-rose-500/10"
                      : "bg-white border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-md cursor-pointer"
                  }`}
                  onClick={() => {
                    if (jurnal.jurnal_id) {
                      onViewDetail(jurnal.jurnal_id);
                    }
                  }}
                >
                  {/* Top Bar */}
                  <div className="flex justify-between items-start gap-2.5 mb-3.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base border shrink-0 ${
                        isDanger 
                          ? "bg-rose-100 text-rose-700 border-rose-200" 
                          : "bg-indigo-50 text-indigo-700 border-indigo-100/50"
                      }`}>
                        {isDanger ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <BookOpen className="w-4.5 h-4.5 text-indigo-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-sm font-bold truncate ${isDanger ? 'text-rose-950' : 'text-gray-800'}`} title={jurnal.mapel}>
                          {jurnal.mapel}
                        </h3>
                        <p className={`text-xs font-semibold truncate ${isDanger ? 'text-rose-700' : 'text-indigo-600'}`}>
                          Kelas {jurnal.kelas}
                        </p>
                      </div>
                    </div>

                    {canDelete && jurnal.jurnal_id && (
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

                  {/* Body Info */}
                  <div className="space-y-2 flex-1 text-xs mb-4">
                    <div className="flex items-center gap-2">
                      <User className={`w-4 h-4 shrink-0 ${isDanger ? 'text-rose-500' : 'text-gray-400'}`} />
                      <span className={`line-clamp-1 font-semibold ${isDanger ? 'text-rose-900' : 'text-gray-700'}`} title={jurnal.guru}>
                        {jurnal.guru}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 shrink-0 ${isDanger ? 'text-rose-500' : 'text-gray-400'}`} />
                      <span className={`font-medium ${isDanger ? 'text-rose-800' : 'text-gray-600'}`}>
                        {jurnal.hari ? `${jurnal.hari}, ` : ''}
                        {jurnal.tanggal ? format(new Date(jurnal.tanggal), 'dd MMMM yyyy', { locale: idLocale }) : "-"}
                        {jurnal.jam_label ? ` • ${jurnal.jam_label}` : ''}
                      </span>
                    </div>

                    {/* Badge Status */}
                    <div className="pt-2 flex items-center gap-2 flex-wrap">
                      {jurnal.pertemuan_ke ? (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold">
                          Pert. {jurnal.pertemuan_ke}
                        </span>
                      ) : null}
                      {getStatusBadge(jurnal)}
                    </div>

                    {isDanger && (
                      <p className="text-[11px] text-rose-700 font-medium leading-relaxed bg-rose-100/60 p-2 rounded-xl border border-rose-200/60 mt-1">
                        ⚠️ Belum mengisi absensi & jurnal mengajar.
                      </p>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className={`mt-auto pt-3 border-t flex justify-end ${isDanger ? 'border-rose-200/60' : 'border-slate-100'}`}>
                    {jurnal.jurnal_id ? (
                      <button
                        className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-800 transition-colors cursor-pointer"
                      >
                        Lihat Detail & Absensi <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Perlu Perhatian
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs gap-4 mt-6">
              <div className="text-xs text-slate-500 font-semibold">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} sesi
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors bg-white text-slate-700 cursor-pointer"
                >
                  Sebelumnya
                </button>
                <div className="flex items-center px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors bg-white text-slate-700 cursor-pointer"
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

