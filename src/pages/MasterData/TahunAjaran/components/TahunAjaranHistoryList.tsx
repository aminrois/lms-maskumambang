import { CalendarDays, XCircle, Pencil, Trash2 } from "lucide-react";
import type { GlobalTahunAjaranUI } from "../hooks/useTahunAjaranData";

interface TahunAjaranHistoryListProps {
  inactiveTahun: GlobalTahunAjaranUI[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (tahun: GlobalTahunAjaranUI) => void;
  onDelete: (tahun: GlobalTahunAjaranUI) => void;
  onActivate?: (tahun: GlobalTahunAjaranUI) => void;
}

export default function TahunAjaranHistoryList({
  inactiveTahun,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onActivate
}: TahunAjaranHistoryListProps) {
  if (inactiveTahun.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
        Riwayat Tahun Ajaran
      </h3>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
        {inactiveTahun.map((tahun) => (
          <div
            key={tahun.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 sm:py-4 hover:bg-slate-50/70 transition-colors group gap-3"
          >
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <CalendarDays className="w-4 h-4 text-slate-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-base">{tahun.namaTahun}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Semester {tahun.semester}
                  {tahun.tanggalMulai && tahun.tanggalAkhir
                    ? ` · ${new Date(tahun.tanggalMulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} s/d ${new Date(tahun.tanggalAkhir).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`
                    : ''}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  <span className="font-medium text-slate-500">Lembaga:</span> {tahun.lembagaSingkatans?.join(', ')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
              <button
                onClick={() => onActivate?.(tahun)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors shadow-xs cursor-pointer"
                title="Jadikan Tahun Ajaran Aktif"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Tidak Aktif</span>
              </button>
              <div className="flex items-center gap-1.5 shrink-0">
                {canUpdate && (
                  <button
                    onClick={() => onEdit(tahun)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => onDelete(tahun)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
