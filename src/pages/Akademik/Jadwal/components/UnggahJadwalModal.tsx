import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadCloud, AlertCircle, Loader2 } from "lucide-react";

interface UnggahJadwalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isUploading: boolean;
  unuploadedCount: number;
  unggahProgress?: number;
  unggahStats?: { current: number; total: number };
}

export const UnggahJadwalModal: React.FC<UnggahJadwalModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isUploading,
  unuploadedCount,
  unggahProgress = 0,
  unggahStats = { current: 0, total: 0 },
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <UploadCloud className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">
            Unggah Jadwal ke Lesson Plan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs leading-relaxed text-slate-600">
          <p>
            Sistem mendeteksi <strong className="text-indigo-600">{unuploadedCount} mata pelajaran</strong> yang terdata di jadwal pelajaran belum dibuatkan Lesson Plan-nya.
          </p>

          <div className="p-3.5 bg-amber-50/80 border border-amber-200/60 rounded-xl flex items-start gap-2.5 text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11.5px]">
              <p className="font-semibold">Informasi Pengunggahan:</p>
              <ul className="list-disc pl-4 space-y-1 text-amber-700">
                <li>Judul RPP akan otomatis berformat: <strong className="underline">"Nama Mata Pelajaran – Nama Kelas"</strong>.</li>
                <li>Setiap RPP yang diunggah akan otomatis memiliki <strong className="font-bold text-indigo-700">16 Pertemuan</strong> siap isi.</li>
                <li>Guru pengajar dan alokasi waktu jam pelajaran akan disinkronkan langsung.</li>
              </ul>
            </div>
          </div>

          <p className="text-slate-500 italic">
            Apakah Anda yakin ingin mengunggah seluruh jadwal pelajaran ini ke Lesson Plan?
          </p>
          
          {/* Progress Bar */}
          {isUploading && unggahStats.total > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-700">
                  Membuat RPP {unggahStats.current} dari {unggahStats.total}
                </span>
                <span className="text-xs font-bold text-indigo-600">{Math.min(100, unggahProgress)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${Math.min(100, unggahProgress)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            className="rounded-xl font-medium border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Batal
          </Button>
          <Button
            className="rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            onClick={onConfirm}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengunggah...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 mr-2" /> Unggah Sekarang
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
