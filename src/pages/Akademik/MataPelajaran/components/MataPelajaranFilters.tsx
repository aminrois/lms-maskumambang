import React from "react";
import { Button } from "@/components/ui/button";

interface MataPelajaranFiltersProps {
  filterLembaga: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const MataPelajaranFilters: React.FC<MataPelajaranFiltersProps> = ({
  filterLembaga,
  activeFilter,
  onFilterChange,
}) => {
  if (filterLembaga.length === 0) return null;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex gap-2 w-full overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
        {filterLembaga.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <Button
              key={filter}
              variant={isActive ? "default" : "outline"}
              className={`rounded-full px-5 h-10 font-medium transition-all duration-300 ${isActive
                  ? "bg-[#243B7A] text-white hover:bg-[#1C2D5C] shadow-md"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                }`}
              onClick={() => onFilterChange(filter)}
            >
              {filter}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
