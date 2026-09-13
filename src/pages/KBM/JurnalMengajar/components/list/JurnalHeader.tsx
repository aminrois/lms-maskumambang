import { BookMarked } from "lucide-react";

export function JurnalHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
          <BookMarked className="w-6 h-6 text-[#243B7A]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674] uppercase">JURNAL MENGAJAR</h1>
          <p className="text-[#A3AED0] text-sm mt-1">Catatan KBM dan absensi per pertemuan</p>
        </div>
      </div>
    </div>
  );
}
