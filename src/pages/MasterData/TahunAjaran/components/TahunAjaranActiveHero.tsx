import { Sparkles, Pencil, Trash2, Clock, AlertTriangle } from "lucide-react";
import type { GlobalTahunAjaranUI } from "../hooks/useTahunAjaranData";
import { calcProgress, durationDays } from "../hooks/useTahunAjaranUtils";
import StaticIslamicPattern from "@/components/ui/StaticIslamicPattern";

interface TahunAjaranActiveHeroProps {
  activeTahun: GlobalTahunAjaranUI | null;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (tahun: GlobalTahunAjaranUI) => void;
  onDelete: (tahun: GlobalTahunAjaranUI) => void;
}

export default function TahunAjaranActiveHero({
  activeTahun,
  canUpdate,
  canDelete,
  onEdit,
  onDelete
}: TahunAjaranActiveHeroProps) {
  if (!activeTahun) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-3">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>
        <p className="font-bold text-slate-700 text-lg">Tidak ada tahun ajaran aktif</p>
        <p className="text-slate-500 text-sm mt-1">
          Aktifkan salah satu tahun ajaran di bawah agar sistem KBM dapat berjalan.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#1e2f65] via-[#243B7A] to-[#1a5cb0] text-white shadow-xl">
      <StaticIslamicPattern className="opacity-100" opacity={0.06} />
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-12 -left-8 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative p-6 sm:p-8">
        {/* Badge + Actions */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/20 border border-yellow-300/30 text-yellow-300 text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-sm">
            <Sparkles className="w-3 h-3" />
            Tahun Ajaran Aktif
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {canUpdate && (
              <button
                onClick={() => onEdit(activeTahun)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/40 border border-blue-400/50 hover:bg-blue-500/60 text-white backdrop-blur-md text-xs font-semibold transition-all cursor-pointer shadow-md"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5 shrink-0" />
                <span>Edit</span>
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(activeTahun)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/60 border border-red-400/50 hover:bg-red-500/80 text-white backdrop-blur-md text-xs font-semibold transition-all cursor-pointer shadow-md"
                title="Hapus"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Hapus</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Info */}
        <div className="mb-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1">
            {activeTahun.namaTahun}
          </h2>
          <p className="text-blue-100 font-medium text-lg">
            Semester {activeTahun.semester}
          </p>
          <p className="text-blue-200 text-sm mt-1">
            <span className="font-semibold">Berlaku untuk:</span> {activeTahun.lembagaSingkatans?.join(', ')}
          </p>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Mulai</p>
            <p className="text-white font-bold text-base">
              {activeTahun.tanggalMulai
                ? new Date(activeTahun.tanggalMulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Selesai</p>
            <p className="text-white font-bold text-base">
              {activeTahun.tanggalAkhir
                ? new Date(activeTahun.tanggalAkhir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {activeTahun.tanggalMulai && activeTahun.tanggalAkhir && (() => {
          const prog = calcProgress(activeTahun.tanggalMulai, activeTahun.tanggalAkhir);
          const dur = durationDays(activeTahun.tanggalMulai, activeTahun.tanggalAkhir);
          const elapsed = Math.round(dur * prog / 100);
          return (
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5 text-blue-200 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Progres Tahun Ajaran</span>
                </div>
                <span className="text-yellow-300 font-bold text-sm">{prog}%</span>
              </div>
              <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-yellow-300 to-yellow-400 rounded-full transition-all duration-700"
                  style={{ width: `${prog}%` }}
                />
              </div>
              <p className="text-blue-300 text-xs mt-2">
                {elapsed} dari {dur} hari telah berlalu
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
