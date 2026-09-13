import { Eye } from "lucide-react";

interface WaliKelasHeaderProps {
  activeClassName: string;
  activeTeacher: string;
}

export function WaliKelasHeader({ activeClassName, activeTeacher }: WaliKelasHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm border border-blue-100 shrink-0">
          <Eye className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase">Pantau KBM Wali Kelas</h1>
          <p className="text-slate-500 text-sm mt-1">
            Wali Kelas: <span className="font-semibold text-slate-700">{activeTeacher}</span> · Kelas Asuhan: <span className="font-bold text-blue-600">{activeClassName}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
