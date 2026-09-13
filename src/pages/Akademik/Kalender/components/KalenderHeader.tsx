import React from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KalenderHeaderProps {
  canCreate: boolean;
  onAddClick: () => void;
}

export const KalenderHeader: React.FC<KalenderHeaderProps> = ({
  canCreate,
  onAddClick,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
          <Calendar className="w-6 h-6 text-[#243B7A]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674] uppercase">Kalender Akademik</h1>
          <p className="text-[#A3AED0] text-sm mt-1">Kelola agenda dan hari libur sekolah.</p>
        </div>
      </div>
      {canCreate && (
        <Button
          onClick={onAddClick}
          className="mt-4 md:mt-0 bg-[#243B7A] hover:bg-[#1C2D5C] text-white rounded-xl shadow-sm px-5 h-10 font-medium"
        >
          Tambah Event
        </Button>
      )}
    </div>
  );
};
