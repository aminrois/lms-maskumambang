import { BarChart } from "lucide-react";

export function UniversalHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm border border-blue-100 shrink-0">
          <BarChart className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase">MONITORING AKADEMIK</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau perkembangan kelas dan aktivitas belajar mengajar</p>
        </div>
      </div>
    </div>
  );
}
