import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Calendar, Users, Clock } from "lucide-react";

interface TerapkanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terapkanInfo: {
    kelasCount: number;
    hariCount: number;
    jamCount: number;
    lembagaNama?: string;
  };
  onConfirm: () => void;
  isPending: boolean;
  terapkanProgress?: number;
  terapkanStats?: { current: number; total: number };
  terapkanTahap?: 0 | 1 | 2;
}

export const TerapkanModal: React.FC<TerapkanModalProps> = ({
  open,
  onOpenChange,
  terapkanInfo,
  onConfirm,
  isPending,
  terapkanProgress = 0,
  terapkanStats = { current: 0, total: 0 },
  terapkanTahap = 1,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <DialogTitle className="text-lg font-bold text-gray-800">
              Terapkan ke Jadwal Kelas?
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600 leading-relaxed">
            Jam akademik di{" "}
            <span className="font-semibold text-[#243B7A]">
              {terapkanInfo.lembagaNama || "lembaga ini"}
            </span>{" "}
            akan diterapkan ke seluruh kelas dan hari yang terhubung. Jadwal yang
            sudah memiliki mata pelajaran tidak akan terpengaruh.
          </p>

          {/* Info stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1.5 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-xl font-bold text-blue-700">{terapkanInfo.jamCount}</span>
              <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide text-center">
                Slot Jam
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="text-xl font-bold text-indigo-700">{terapkanInfo.kelasCount}</span>
              <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wide text-center">
                Kelas
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 bg-violet-50 rounded-xl border border-violet-100">
              <Calendar className="w-5 h-5 text-violet-600" />
              <span className="text-xl font-bold text-violet-700">{terapkanInfo.hariCount}</span>
              <span className="text-[10px] font-semibold text-violet-500 uppercase tracking-wide text-center">
                Hari
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-700 leading-relaxed">
              <span className="font-bold">Catatan:</span> Slot waktu baru akan ditambahkan untuk setiap kelas pada semua hari (Ahad–Sabtu). Khusus hari <span className="font-bold">Kamis</span>, slot hanya akan dibuat sampai jam ke-5. Slot yang sudah ada dengan mata pelajaran tidak akan dihapus.
            </p>
          </div>

          {/* Progress Bar (Hanya tampil saat proses berjalan) */}
          {isPending && terapkanStats.total > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-700">
                  {terapkanTahap === 0
                    ? `Menyimpan Perubahan Jam Akademik ke Database...`
                    : terapkanTahap === 1
                      ? `Menyusun Jam Umum: ${terapkanStats.current} dari ${terapkanStats.total} slot`
                      : `Menyelipkan Jam Khusus: ${terapkanStats.current} dari ${terapkanStats.total} slot`}
                </span>
                <span className="text-xs font-bold text-amber-600">{Math.min(100, terapkanProgress)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${Math.min(100, terapkanProgress)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isPending}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors shadow-sm disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menerapkan...
              </>
            ) : (
              "Ya, Terapkan"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
