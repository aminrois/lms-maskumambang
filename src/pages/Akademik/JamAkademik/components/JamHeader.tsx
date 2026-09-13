import React from "react";
import { Plus, Clock, RefreshCw, Loader2 } from "lucide-react";

interface JamHeaderProps {
  canCreate: boolean;
  totalJam: number;
  onAddClick: () => void;
  title: string;
  showTerapkanButton?: boolean;
  onTerapkanClick?: () => void;
  isTerapkanPending?: boolean;
  showScanKhususButton?: boolean;
  onScanKhususClick?: () => void;
}

export const JamHeader: React.FC<JamHeaderProps> = ({
  canCreate,
  totalJam,
  onAddClick,
  title,
  showTerapkanButton = false,
  onTerapkanClick,
  isTerapkanPending = false,
  showScanKhususButton = false,
  onScanKhususClick,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
          <Clock className="w-6 h-6 text-[#243B7A]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674] uppercase">{title}</h1>
          <p className="text-[#A3AED0] text-sm mt-1">{totalJam} jam akademik tercatat</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Tombol Pindai Jam Khusus dari Jadwal */}
        {showScanKhususButton && onScanKhususClick && (
          <button
            onClick={onScanKhususClick}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-bold shadow-2xs transition-all hover:scale-[1.01]"
          >
            <RefreshCw className="w-4 h-4 text-indigo-600" />
            <span>Pindai Jam Khusus</span>
          </button>
        )}

        {/* Tombol Terapkan ke Jadwal Kelas — hanya muncul jika ada perbedaan */}
        {showTerapkanButton && (
          <button
            onClick={onTerapkanClick}
            disabled={isTerapkanPending}
            className="relative flex items-center justify-center space-x-2 px-4 py-2.5 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-400 disabled:to-orange-400 text-white rounded-xl text-sm font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-0.5 transition-all duration-300 group border border-amber-400/50"
          >
            {isTerapkanPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" />
            )}
            <span>Terapkan ke Jadwal Kelas</span>
            {!isTerapkanPending && (
              <span className="relative flex h-2.5 w-2.5 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
            )}
          </button>
        )}

        {canCreate && (
          <button
            onClick={onAddClick}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jam</span>
          </button>
        )}
      </div>
    </div>
  );
};
