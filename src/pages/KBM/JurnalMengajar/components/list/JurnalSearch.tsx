import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface JurnalSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tanggalMulai: string;
  setTanggalMulai: (date: string) => void;
  tanggalAkhir: string;
  setTanggalAkhir: (date: string) => void;
  isDirector?: boolean;
  lembagaList?: any[];
  selectedLembagaId?: string;
  setSelectedLembagaId?: (id: string) => void;
  filteredKelasList?: any[];
  selectedKelasId?: string;
  setSelectedKelasId?: (id: string) => void;
}

export function JurnalSearch({ 
  searchQuery, 
  setSearchQuery,
  tanggalMulai,
  setTanggalMulai,
  tanggalAkhir,
  setTanggalAkhir,
  isDirector = false,
  lembagaList = [],
  selectedLembagaId = "Semua",
  setSelectedLembagaId,
  filteredKelasList = [],
  selectedKelasId = "Semua",
  setSelectedKelasId,
}: JurnalSearchProps) {
  return (
    <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-3 w-full md:w-auto">
      {/* Search Input */}
      <div className="relative w-full md:w-56">
        <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
        <Input
          placeholder="Cari kelas atau guru..."
          className="pl-10 rounded-xl border-slate-200 h-10 text-sm font-medium focus-visible:ring-1 focus-visible:ring-blue-600 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Lembaga & Kelas (Khusus Role Direktur) */}
      {isDirector && (
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          {/* Dropdown Lembaga */}
          <div className="relative w-full sm:w-44">
            <select
              value={selectedLembagaId}
              onChange={(e) => setSelectedLembagaId && setSelectedLembagaId(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-semibold text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs transition-all"
            >
              <option value="Semua">Semua Lembaga</option>
              {lembagaList.map((l: any) => (
                <option key={l.lembaga_id} value={String(l.lembaga_id)}>
                  {l.singkatan || l.nama_lembaga}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Kelas */}
          <div className="relative w-full sm:w-40">
            <select
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId && setSelectedKelasId(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-amber-300 text-slate-700 font-semibold text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer shadow-2xs transition-all"
            >
              <option value="Semua">Semua Kelas</option>
              {filteredKelasList.map((k: any) => (
                <option key={k.kelas_id} value={String(k.kelas_id)}>
                  {k.nama_kelas}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Date Filter */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Input 
          type="date"
          value={tanggalMulai}
          onChange={(e) => setTanggalMulai(e.target.value)}
          className="h-10 text-xs border-slate-200 rounded-xl w-full sm:w-34 bg-white"
        />
        <span className="text-xs text-gray-500 font-medium whitespace-nowrap shrink-0">s/d</span>
        <Input 
          type="date"
          value={tanggalAkhir}
          onChange={(e) => setTanggalAkhir(e.target.value)}
          className="h-10 text-xs border-slate-200 rounded-xl w-full sm:w-34 bg-white"
        />
      </div>
    </div>
  );
}
