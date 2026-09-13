import { Building, Plus, Search } from "lucide-react";

interface LembagaHeaderProps {
  judulOtomatis: string;
  totalData: number;
  canCreate: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onOpenAddModal: () => void;
}

export default function LembagaHeader({
  judulOtomatis,
  totalData,
  canCreate,
  searchQuery,
  setSearchQuery,
  onOpenAddModal
}: LembagaHeaderProps) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
            <Building className="w-6 h-6 text-[#243B7A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2B3674] uppercase">DATA {judulOtomatis}</h1>
            <p className="text-[#A3AED0] text-sm mt-1">{totalData} lembaga aktif di sistem</p>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Lembaga</span>
          </button>
        )}
      </div>

      <div className="flex items-center bg-white border p-4 rounded-xl shadow-sm w-full">
        <div className="relative w-full flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Cari singkatan atau nama lengkap..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-700"
          />
        </div>
      </div>
    </>
  );
}
