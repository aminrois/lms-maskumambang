import { Search, ChevronDown, ArrowDownAZ, ArrowUpZA } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

interface SiswaFilterProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterLembaga: string;
  setFilterLembaga: (val: string) => void;
  filterKelas: string;
  setFilterKelas: (val: string) => void;
  daftarLembaga: string[];
  dataKelasList: { kelas_id: number | string; nama_kelas: string; lembaga_id?: number | string }[];
  dataLembagaList: { lembaga_id: number | string; nama_lembaga?: string; singkatan?: string }[];
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
}

export default function SiswaFilter({
  searchQuery,
  setSearchQuery,
  filterLembaga,
  setFilterLembaga,
  filterKelas,
  setFilterKelas,
  daftarLembaga,
  dataKelasList,
  dataLembagaList,
  sortOrder,
  onToggleSort
}: SiswaFilterProps) {
  const role = useAuthStore((state) => state.role);
  const isGlobalRole = role === "Super Admin" || role === "Direktur";
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isKelasDropdownOpen, setIsKelasDropdownOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsKelasDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-3 bg-white border p-3 sm:p-4 rounded-xl shadow-sm relative z-30">
      {/* Search Row */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Cari nama, NIS, atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-700"
          />
        </div>
        <button
          onClick={onToggleSort}
          className="p-2 border rounded-lg text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
          title={sortOrder === "asc" ? "Urutkan Z-A" : "Urutkan A-Z"}
        >
          {sortOrder === "asc" ? <ArrowDownAZ className="w-5 h-5" /> : <ArrowUpZA className="w-5 h-5" />}
        </button>
      </div>

      {/* Filters Row */}
      <div ref={filterRef} className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full items-center">

        {/* Lembaga Dropdown (Hanya untuk Super Admin & Direktur) */}
        {isGlobalRole && (
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => {
                const nextState = !isDropdownOpen;
                setIsDropdownOpen(nextState);
                if (nextState) setIsKelasDropdownOpen(false);
              }}
              className="flex items-center justify-between w-full sm:w-44 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <span className="truncate">{filterLembaga}</span>
              <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-full sm:w-44 bg-white border rounded-lg shadow-xl z-30 overflow-hidden">
                {daftarLembaga.map((lembaga) => (
                  <button
                    key={lembaga}
                    onClick={() => {
                      setFilterLembaga(lembaga);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    {lembaga}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Kelas Dropdown */}
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => {
              const nextState = !isKelasDropdownOpen;
              setIsKelasDropdownOpen(nextState);
              if (nextState) setIsDropdownOpen(false);
            }}
            className="flex items-center justify-between w-full sm:w-40 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <span className="truncate">{filterKelas}</span>
            <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />
          </button>

          {isKelasDropdownOpen && (
            <div className="absolute left-0 mt-2 w-full sm:w-40 bg-white border rounded-lg shadow-xl z-30 overflow-hidden max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  setFilterKelas("Semua Kelas");
                  setIsKelasDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                Semua Kelas
              </button>
              {(() => {
                const filteredKelasOptions = filterLembaga === "Semua Lembaga"
                  ? dataKelasList
                  : dataKelasList.filter((k) => {
                    const associatedLembaga = dataLembagaList.find((l) => (l.singkatan || l.nama_lembaga) === filterLembaga);
                    return associatedLembaga ? k.lembaga_id === associatedLembaga.lembaga_id : false;
                  });

                return filteredKelasOptions.map((k) => (
                  <button
                    key={k.kelas_id}
                    onClick={() => {
                      setFilterKelas(k.nama_kelas);
                      setIsKelasDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    {k.nama_kelas}
                  </button>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
