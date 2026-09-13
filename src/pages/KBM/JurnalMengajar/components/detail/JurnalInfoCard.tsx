import { BookMarked } from "lucide-react";
import { getStatusBadge } from "../list/JurnalList";

interface JurnalInfoCardProps {
  pertemuanKe: number;
  status: string;
  materi: string;
  catatanTambahan: string | null;
}

export function JurnalInfoCard({
  pertemuanKe,
  status,
  materi,
  catatanTambahan
}: JurnalInfoCardProps) {
  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 space-y-5">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
        <BookMarked className="w-5 h-5 text-blue-600" />
        Detail Pertemuan Ke-{pertemuanKe}
      </h3>

      <div className="space-y-4 text-xs font-semibold">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Status KBM</span>
          {getStatusBadge(status)}
        </div>

        <div className="bg-slate-50 p-4 rounded-xl">
          <p className="text-xs text-slate-500 mb-1">Materi / Topik (RPP)</p>
          <p className="text-sm text-slate-800 font-bold leading-snug">{materi || "Tidak terhubung ke RPP"}</p>
        </div>

        {catatanTambahan && (
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Catatan Tambahan</span>
            <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-3 text-xs text-amber-900 leading-relaxed font-medium">
              {catatanTambahan}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
