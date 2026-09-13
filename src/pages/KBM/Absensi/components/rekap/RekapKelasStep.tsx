import { ChevronLeft, Loader2, BookOpen, Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RekapKelasStepProps {
  isGuru: boolean;
  isGlobalRole: boolean;
  isKelasGuruLoading: boolean;
  kelases: any[];
  selectedLembaga: any;
  onBack: () => void;
  onSelectKelas: (id: number) => void;
}

export function RekapKelasStep({
  isGuru,
  isGlobalRole,
  isKelasGuruLoading,
  kelases,
  selectedLembaga,
  onBack,
  onSelectKelas
}: RekapKelasStepProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pt-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-800">Pilih Kelas</h2>
          {isGuru ? (
            <p className="text-slate-500 text-sm">Menampilkan kelas yang Anda ajar berdasarkan jadwal pelajaran.</p>
          ) : selectedLembaga ? (
            <p className="text-slate-500 text-sm">Menampilkan kelas di Lembaga <span className="font-semibold text-blue-600">{selectedLembaga.nama_lembaga}</span></p>
          ) : null}
        </div>
        {isGlobalRole && (
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-600 self-center sm:self-auto"
            onClick={onBack}
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" /> Kembali ke Lembaga
          </Button>
        )}
      </div>

      {isGuru && isKelasGuruLoading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-slate-500 text-sm font-medium">Memuat kelas yang Anda ajar...</p>
        </div>
      ) : kelases.length === 0 ? (
        isGuru ? (
          <Card className="text-center p-10 rounded-2xl border-dashed border-2 border-slate-200 bg-slate-50">
            <CardContent className="space-y-4 pt-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-lg">Tidak ada kelas yang diajar</p>
                <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                  Anda belum memiliki jadwal mengajar yang terdaftar. Hubungi Admin atau WaKa Kurikulum untuk mengatur jadwal pelajaran Anda.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center p-8 rounded-2xl border-dashed">
            <CardContent className="space-y-4 pt-4">
              <Users className="w-12 h-12 mx-auto text-slate-350" />
              <div>
                <p className="font-semibold text-slate-700">Tidak ada kelas ditemukan</p>
                <p className="text-sm text-slate-450 mt-1">Lembaga ini belum memiliki kelas terdaftar.</p>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {kelases.map((k: any) => (
            <button
              key={k.kelas_id}
              onClick={() => onSelectKelas(k.kelas_id)}
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
      )}
    </div>
  );
}
