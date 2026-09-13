import { PenTool, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonPlanHeaderProps {
  finalCanCreate?: boolean;
  onOpenTemplateConfig?: () => void;
}

export function LessonPlanHeader({
  onOpenTemplateConfig,
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
  );
}
