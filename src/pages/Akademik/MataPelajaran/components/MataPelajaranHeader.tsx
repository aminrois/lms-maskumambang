import React from "react";
import { LibraryBig, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MataPelajaranHeaderProps {
  canCreate: boolean;
  onAddClick: () => void;
}

export const MataPelajaranHeader: React.FC<MataPelajaranHeaderProps> = ({
  canCreate,
  onAddClick,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
          <LibraryBig className="w-6 h-6 text-[#243B7A]" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold text-[#2B3674] tracking-tight uppercase">Mata Pelajaran</h1>
          <p className="text-[#A3AED0] text-[13px] font-medium mt-1">Daftar mata pelajaran yang diajarkan di seluruh lembaga.</p>
        </div>
      </div>

      {canCreate && (
        <Button
          onClick={onAddClick}
          className="bg-[#243B7A] hover:bg-[#1C2D5C] text-white rounded-xl shadow-sm px-5 h-10 font-medium"
        >
          <Plus size={16} className="mr-1.5" />
          Tambah Mapel
        </Button>
      )}
    </div>
  );
};
