import { Search, ArrowDownAZ, ArrowUpZA, X, Loader2 } from "lucide-react";

interface WaliMuridFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
  isSearching?: boolean;
}

export default function WaliMuridFilter({ searchQuery, setSearchQuery, sortOrder, onToggleSort, isSearching = false }: WaliMuridFilterProps) {
  return (
    <div className="flex items-center gap-2 bg-white border p-4 rounded-xl shadow-sm w-full relative z-30">
      <div className="relative flex-1 w-full">
        {isSearching ? (
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute left-3 top-3.5" />
        ) : (
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
        )}
        <input
          type="text"
          placeholder="Cari nama wali murid, ayah, ibu, atau NIK..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-700"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-2.5 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Hapus pencarian"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <button
        onClick={onToggleSort}
        className="p-2 border rounded-lg text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
        title={sortOrder === "asc" ? "Urutkan Z-A" : "Urutkan A-Z"}
      >
        {sortOrder === "asc" ? <ArrowDownAZ className="w-5 h-5" /> : <ArrowUpZA className="w-5 h-5" />}
      </button>
    </div>
  );
}

