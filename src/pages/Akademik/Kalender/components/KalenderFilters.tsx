import React from "react";
import { eventTypes } from "../hooks/useKalender";
import type { EventTypeKey } from "../hooks/useKalender";

interface KalenderFiltersProps {
  filterKategori: EventTypeKey | "Semua";
  setFilterKategori: (kategori: EventTypeKey | "Semua") => void;
  filterBulan: string;
  setFilterBulan: (bulan: string) => void;
  setCurrentMonthDate: (date: Date) => void;
}

export const KalenderFilters: React.FC<KalenderFiltersProps> = ({
  filterKategori,
  setFilterKategori,
  filterBulan,
  setFilterBulan,
  setCurrentMonthDate,
}) => {
  const currentYear = new Date().getFullYear();
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Filter Kategori */}
      <div className="flex-1 min-w-0">
        <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
          Kategori
        </label>
        <select
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value as EventTypeKey | "Semua")}
          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
        >
          <option value="Semua">Semua Kategori</option>
          {Object.entries(eventTypes).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Filter Bulan */}
      <div className="flex-1 min-w-0">
        <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
          Bulan
        </label>
        <select
          value={filterBulan}
          onChange={(e) => {
            setFilterBulan(e.target.value);
            if (e.target.value !== "Semua") {
              setCurrentMonthDate(new Date(currentYear, parseInt(e.target.value), 1));
            }
          }}
          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
        >
          <option value="Semua">Semua Bulan</option>
          {months.map((name, idx) => (
            <option key={idx} value={String(idx)}>{name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
