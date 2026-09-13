import { ChevronLeft, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KELAS } from "@/types/database";

interface UniversalKelasStepProps {
  isGlobalRole: boolean;
  selectedLembaga: any;
  kelases: KELAS[];
  onSelectKelas: (id: string) => void;
  setStep: (step: 'select_lembaga' | 'select_kelas' | 'display_results') => void;
}

export function UniversalKelasStep({
  isGlobalRole,
  selectedLembaga,
  kelases,
  onSelectKelas,
  setStep
}: UniversalKelasStepProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pt-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-800">Pilih Kelas</h2>
          {selectedLembaga ? (
            <p className="text-slate-500 text-sm">Menampilkan kelas di Lembaga <span className="font-semibold text-blue-600">{selectedLembaga.nama_lembaga}</span></p>
          ) : (
            <p className="text-slate-500 text-sm">Silakan pilih kelas untuk memonitor progres KBM.</p>
          )}
        </div>
        {isGlobalRole && (
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-600 self-center sm:self-auto"
            onClick={() => setStep('select_lembaga')}
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" /> Kembali ke Lembaga
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* Pilihan Semua Kelas */}
        <button
          onClick={() => {
            onSelectKelas("Semua");
            setStep('display_results');
          }}
          className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-xl shadow-xs hover:shadow-md hover:scale-[1.02] hover:border-blue-500/50 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-800 text-[15px] group-hover:text-blue-600 transition-colors">
            Semua Kelas
          </span>
        </button>

        {kelases.map((k) => (
          <button
            key={k.kelas_id}
            onClick={() => {
              onSelectKelas(String(k.kelas_id));
              setStep('display_results');
            }}
            className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-xl shadow-xs hover:shadow-md hover:scale-[1.02] hover:border-indigo-500/50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-800 text-[15px] group-hover:text-indigo-600 transition-colors">
              {k.nama_kelas}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
