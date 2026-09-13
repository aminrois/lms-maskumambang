import { CalendarDays, Plus } from "lucide-react";

interface TahunAjaranHeaderProps {
  judulOtomatis: string;
  dataCount: number;
  canCreate: boolean;
  onOpenAddModal: () => void;
}

export default function TahunAjaranHeader({
  judulOtomatis,
  dataCount,
  canCreate,
  onOpenAddModal
}: TahunAjaranHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
          <CalendarDays className="w-6 h-6 text-[#243B7A]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674] uppercase">DATA {judulOtomatis}</h1>
          <p className="text-[#A3AED0] text-sm mt-1">{dataCount} data tahun ajaran tercatat</p>
        </div>
      </div>

      {canCreate && (
        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tahun</span>
        </button>
      )}
    </div>
  );
}
