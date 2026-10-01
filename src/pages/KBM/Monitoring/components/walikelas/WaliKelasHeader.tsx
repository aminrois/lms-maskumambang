import { Eye, GraduationCap } from "lucide-react";

interface WaliKelasHeaderProps {
  activeClassName: string;
  activeTeacher: string;
  waliKelasList?: any[];
  waliKelasKelasId?: number | null;
  onSelectKelas?: (kelasId: number | string) => void;
}

export function WaliKelasHeader({ 
  activeClassName, 
  activeTeacher, 
  waliKelasList = [], 
  waliKelasKelasId, 
  onSelectKelas 
}: WaliKelasHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm border border-blue-100 shrink-0">
          <Eye className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase">Pantau KBM Wali Kelas</h1>
          <p className="text-slate-500 text-sm mt-1 flex flex-wrap items-center gap-1.5">
            <span>Wali Kelas: <strong className="text-slate-700">{activeTeacher}</strong></span>
            <span>·</span>
            <span>Kelas Aktif: <strong className="text-blue-600">{activeClassName}</strong></span>
          </p>
        </div>
      </div>

      {waliKelasList.length > 1 && onSelectKelas && (
        <div className="flex items-center gap-2 bg-blue-50/70 p-1.5 rounded-xl border border-blue-100 shrink-0">
          <GraduationCap className="w-4 h-4 text-blue-600 ml-2" />
          <span className="text-xs font-bold text-blue-900">Ganti Kelas:</span>
          <div className="flex flex-wrap gap-1">
            {waliKelasList.map((k: any) => {
              const isSelected = k.kelas_id === waliKelasKelasId;
              return (
                <button
                  key={k.kelas_id}
                  onClick={() => onSelectKelas(k.kelas_id)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-blue-100 border border-slate-200'
                  }`}
                >
                  {k.nama_kelas}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
