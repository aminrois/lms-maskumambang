import { FileText } from "lucide-react";

interface RekapLembagaStepProps {
  lembagas: any[];
  onSelectLembaga: (id: number) => void;
}

export function RekapLembagaStep({ lembagas, onSelectLembaga }: RekapLembagaStepProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pt-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-extrabold text-slate-800">Pilih Lembaga</h2>
        <p className="text-slate-500 text-sm">Pilih lembaga pendidikan untuk memulai rekapitulasi.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {lembagas.map((l: any) => (
          <button
            key={l.lembaga_id}
            onClick={() => onSelectLembaga(l.lembaga_id)}
            className="flex flex-col items-center justify-center p-8 bg-white border border-slate-100 rounded-2xl shadow-xs hover:shadow-lg hover:scale-102 hover:border-blue-500/50 transition-all text-center group"
          >
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <FileText className="w-8 h-8" />
            </div>
            <span className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
              {l.nama_lembaga}
            </span>
            <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
              {l.singkatan}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
