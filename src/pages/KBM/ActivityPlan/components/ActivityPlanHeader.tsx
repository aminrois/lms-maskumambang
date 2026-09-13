import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface ActivityPlanHeaderProps {
  canCreate: boolean;
  onOpenAdd: () => void;
}

export function ActivityPlanHeader({ canCreate, onOpenAdd }: ActivityPlanHeaderProps) {
  return (
    <div className="flex justify-between items-center flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
          <FileText className="w-6 h-6 text-[#243B7A]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674] uppercase">ACTIVITY PLAN</h1>
          <p className="text-[#A3AED0] text-sm mt-1">Kelola dan pantau seluruh rencana kegiatan lembaga</p>
        </div>
      </div>
      <div className="flex gap-2">
        {canCreate && (
          <Button
            onClick={onOpenAdd}
            className="bg-[#1E3A8A] hover:bg-[#152A66] text-white rounded-xl shadow-sm px-4 py-2 text-sm font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Activity Plan
          </Button>
        )}
      </div>
    </div>
  );
}
