import React from "react";
import { Card } from "@/components/ui/card";
import { School, GraduationCap, Building2, ChevronDown } from "lucide-react";

interface JadwalFiltersProps {
  lembagaList: any[];
  filteredKelas: any[];
  activeLembagaId: number | null;
  setActiveLembagaId: (id: number) => void;
  activeKelasId: number | null;
  setActiveKelasId: (id: number | null) => void;
  isDirector: boolean;
}

export const JadwalFilters: React.FC<JadwalFiltersProps> = ({
  lembagaList,
  filteredKelas,
  activeLembagaId,
  setActiveLembagaId,
  activeKelasId,
  setActiveKelasId,
  isDirector,
}) => {
  const selectedKelasObj = filteredKelas.find((k: any) => k.kelas_id === activeKelasId);

  return (
    <Card className="p-5 rounded-2xl border border-slate-200/80 shadow-sm bg-white space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Section: Dropdown Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
          
          {/* Lembaga Select (Khusus Direktur / Admin Global) */}
          {isDirector && (
            <div className="flex flex-col gap-1.5 min-w-50">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Lembaga</span>
              </label>
              <div className="relative">
                <select
                  value={activeLembagaId || ""}
                  onChange={(e) => setActiveLembagaId(Number(e.target.value))}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-indigo-300 text-slate-800 font-semibold text-sm rounded-xl px-3.5 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                >
                  {lembagaList.map((l: any) => (
                    <option key={l.lembaga_id} value={l.lembaga_id}>
                      {l.nama_lembaga} {l.singkatan ? `(${l.singkatan})` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Kelas Select (Main Filter Dropdown) */}
          <div className="flex flex-col gap-1.5 flex-1 max-w-md">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-amber-500" />
              <span>Pilih Kelas</span>
            </label>
            <div className="relative">
              <select
                value={activeKelasId || ""}
                onChange={(e) => setActiveKelasId(e.target.value ? Number(e.target.value) : null)}
                disabled={filteredKelas.length === 0}
                className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-amber-400 text-slate-800 font-bold text-sm rounded-xl px-3.5 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {filteredKelas.length === 0 ? (
                  <option value="">Tidak ada kelas di lembaga ini</option>
                ) : (
                  filteredKelas.map((k: any) => {
                    const waliText = k.wali_kelas?.nama ? ` — Wali: ${k.wali_kelas.nama}` : "";
                    return (
                      <option key={k.kelas_id} value={k.kelas_id}>
                        {k.nama_kelas} {waliText}
                      </option>
                    );
                  })
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Right Section: Active Selection Info Badge */}
        {selectedKelasObj && (
          <div className="flex items-center gap-3 bg-linear-to-r from-indigo-50/80 to-blue-50/50 border border-indigo-100 px-4 py-2.5 rounded-xl text-xs shrink-0 shadow-2xs">
            <div className="p-2 bg-[#243B7A] text-white rounded-lg shadow-2xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-indigo-950 text-sm">
                Kelas {selectedKelasObj.nama_kelas}
              </div>
              {selectedKelasObj.wali_kelas?.nama ? (
                <div className="text-indigo-600/90 font-medium text-[11px]">
                  Wali Kelas: <span className="font-semibold">{selectedKelasObj.wali_kelas.nama}</span>
                </div>
              ) : (
                <div className="text-slate-400 font-medium text-[11px]">
                  Belum ada Wali Kelas
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </Card>
  );
};

