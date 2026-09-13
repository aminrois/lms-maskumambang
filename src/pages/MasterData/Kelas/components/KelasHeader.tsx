import { useRef, useEffect } from "react";
import { Search, Filter, ChevronDown, Plus, Book } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

interface KelasHeaderProps {
  judulOtomatis: string;
  totalKelas: number;
  canCreate: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterLembaga: string;
  setFilterLembaga: (val: string) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (val: boolean) => void;
  tabs: string[];
  onOpenAddModal: () => void;
}

export default function KelasHeader({
  judulOtomatis,
  totalKelas,
  canCreate,
  searchQuery,
  setSearchQuery,
  filterLembaga,
  setFilterLembaga,
  isDropdownOpen,
  setIsDropdownOpen,
  tabs,
  onOpenAddModal
}: KelasHeaderProps) {
  const role = useAuthStore((state) => state.role);
  const isGlobalRole = role === "Super Admin" || role === "Direktur";
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsDropdownOpen]);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
            <Book className="w-6 h-6 text-[#243B7A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2B3674] uppercase">DATA {judulOtomatis}</h1>
            <p className="text-[#A3AED0] text-sm mt-1">{totalKelas} kelas aktif</p>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kelas</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 bg-white border p-3 sm:p-4 rounded-xl shadow-sm relative z-30">
        {/* Search Input */}
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Lembaga Dropdown (Hanya untuk Super Admin & Direktur) */}
        {isGlobalRole && (
          <div ref={filterRef} className="relative w-full sm:w-auto shrink-0">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full sm:w-52 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="truncate">{filterLembaga === "Semua" ? "Semua Lembaga" : filterLembaga}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-full sm:w-52 bg-white border rounded-lg shadow-xl z-30 overflow-hidden max-h-60 overflow-y-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setFilterLembaga(tab);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterLembaga === tab
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                  >
                    {tab === "Semua" ? "Semua Lembaga" : tab}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
