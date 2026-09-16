import { PenTool, FileCode, RotateCcw, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonPlanHeaderProps {
  finalCanCreate?: boolean;
  onOpenTemplateConfig?: () => void;
  onOpenResetVerifikasi?: () => void;
  canVerify?: boolean;
  onSetujuiSemua?: () => void;
  eligibleApproveCount?: number;
  isApprovingAll?: boolean;
}

export function LessonPlanHeader({
  onOpenTemplateConfig,
  onOpenResetVerifikasi,
  canVerify,
  onSetujuiSemua,
  eligibleApproveCount = 0,
  isApprovingAll = false,
}: LessonPlanHeaderProps) {
  return (
    <div className="flex justify-between items-center flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
          <PenTool className="w-6 h-6 text-[#243B7A]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674] uppercase">LESSON PLAN (RPP)</h1>
          <p className="text-[#A3AED0] text-sm mt-1">Kelola Rencana Pelaksanaan Pembelajaran (RPP) dan pantau status persetujuannya</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Tombol Verifikasi Semua (Tampil jika role berwenang & ada yang butuh diverifikasi) */}
        {canVerify && eligibleApproveCount > 0 && onSetujuiSemua && (
          <Button
            onClick={onSetujuiSemua}
            disabled={isApprovingAll}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-4 py-2.5 flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            {isApprovingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Verifikasi Semua ({eligibleApproveCount})</span>
          </Button>
        )}

        {/* Tombol Reset Verifikasi (Khusus Direktur & Super Admin) */}
        {onOpenResetVerifikasi && (
          <Button
            onClick={onOpenResetVerifikasi}
            variant="outline"
            className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 rounded-xl text-xs font-semibold px-4 py-2.5 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            Reset Verifikasi RPP
          </Button>
        )}

        {onOpenTemplateConfig && (
          <Button
            onClick={onOpenTemplateConfig}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-4 py-2.5 flex items-center gap-2 shadow-xs transition-all"
          >
            <FileCode className="w-4 h-4" />
            Atur Template RPP
          </Button>
        )}
      </div>
    </div>
  );
}
