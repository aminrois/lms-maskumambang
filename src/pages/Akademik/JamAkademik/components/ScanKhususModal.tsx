import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Loader2, CheckCircle2, Sparkles, Building2, Calendar, Clock, RefreshCw } from "lucide-react";
import type { JamKhususConfig } from "../hooks/useJamKhusus";

interface ScanKhususModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isScanning: boolean;
  progress: number;
  stats: { current: number; total: number };
  isCompleted: boolean;
  foundItems: JamKhususConfig[];
  dataLembagaList: any[];
  onStartScan: () => void;
}

export const ScanKhususModal: React.FC<ScanKhususModalProps> = ({
  open,
  onOpenChange,
  isScanning,
  progress,
  stats,
  isCompleted,
  foundItems,
  dataLembagaList,
  onStartScan
}) => {
  return (
    <Dialog open={open} onOpenChange={(val) => { if (!isScanning) onOpenChange(val); }}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-6 rounded-2xl overflow-hidden">
        <DialogHeader className="shrink-0 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-800">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <RefreshCw className={`w-5 h-5 ${isScanning ? "animate-spin text-indigo-600" : ""}`} />
            </div>
            <span>Pindai &amp; Sinkronkan Jam Khusus</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {!isScanning && !isCompleted && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-blue-100">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">Mulai Pemindaian Jadwal Kelas</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Sistem akan memindai seluruh kelas di database untuk mendeteksi entri <strong>Jam Khusus (override)</strong> yang tersimpan pada kolom <strong>ruangan</strong> (ber-prefix <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono text-[11px]">OVERRIDE_TIPE:</code>) dan menyinkronkannya secara otomatis.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-left text-xs text-amber-800 space-y-1">
                <span className="font-semibold flex items-center gap-1.5 text-amber-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Informasi Sinkronisasi:
                </span>
                <p className="text-[11.5px] leading-relaxed">
                  Proses ini memungkinkan jam khusus yang telah diterapkan oleh admin lain di perangkat/browser berbeda langsung terdeteksi dan ditampilkan pada daftar Jam Khusus Anda.
                </p>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="space-y-5 py-4">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
                <h4 className="font-bold text-sm text-slate-800">Sedang Memindai Kolom Ruangan Jadwal Kelas...</h4>
                <p className="text-xs text-slate-500">
                  Memproses kelas <strong>{stats.current}</strong> dari <strong>{stats.total}</strong>
                </p>
              </div>

              {/* PROGRESS BAR */}
              <div className="space-y-2 px-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Progres Pemindaian</span>
                  <span className="text-indigo-600 font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="bg-linear-to-r from-indigo-500 to-blue-600 h-full rounded-full transition-all duration-300 shadow-xs"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">Pemindaian Selesai!</h4>
                  <p className="text-xs text-emerald-700">
                    Berhasil menemukan <strong>{foundItems.length} jam khusus</strong> dari seluruh jadwal kelas di database.
                  </p>
                </div>
              </div>

              {foundItems.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Daftar Jam Khusus Terdeteksi:</span>
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 border rounded-xl bg-slate-50/50 p-2">
                    {foundItems.map((item) => {
                      const namaLembaga = dataLembagaList.find((l: any) => l.lembaga_id === item.lembaga_id)?.singkatan || `Lembaga ${item.lembaga_id}`;
                      return (
                        <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs p-2 bg-white rounded-lg border border-slate-100 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold rounded text-[11px] border border-indigo-100 flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {namaLembaga}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded text-[11px] flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {item.hari}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded text-[11px] flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Jam Ke-{item.urutan_jam}
                            </span>
                          </div>
                          <span className="font-bold text-indigo-900 bg-indigo-50/80 px-2.5 py-1 rounded-md text-[11.5px]">
                            {item.tipe}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Tidak ada jam khusus (override ruangan) yang terdeteksi di jadwal kelas saat ini.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-3 border-t flex justify-between gap-2">
          {!isScanning && !isCompleted && (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onStartScan}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs flex items-center gap-2"
              >
                <Search className="w-3.5 h-3.5" />
                Mulai Pemindaian Now
              </button>
            </>
          )}

          {isCompleted && (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
            >
              Selesai &amp; Tampilkan Data
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
