import { useRef, useEffect } from "react";
import { Plus, Search, Filter, ChevronDown, Loader2, User, Upload, Download, FileSpreadsheet, ArrowDownAZ, ArrowUpZA, Trash2 } from "lucide-react";

interface PegawaiHeaderProps {
  judulOtomatis: string;
  canCreate: boolean;
  canDelete: boolean;
  isBulkMode: boolean;
  onToggleBulkMode: () => void;
  isImporting: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterRole: string;
  setFilterRole: (val: string) => void;
  filterLembaga: string;
  setFilterLembaga: (val: string) => void;
  roles: { role_id: number | string; nama_role: string }[];
  lembagaOptions: { lembaga_id?: number | string; id?: number | string; nama_lembaga?: string; singkatan?: string }[];
  userRole: string | null;
  onOpenAddModal: () => void;
  onTemplateInfo: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (val: boolean) => void;
  isRoleDropdownOpen: boolean;
  setIsRoleDropdownOpen: (val: boolean) => void;
  isFilterLembagaDropdownOpen: boolean;
  setIsFilterLembagaDropdownOpen: (val: boolean) => void;
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
}

export default function PegawaiHeader({
  judulOtomatis,
  canCreate,
  canDelete = false,
  isBulkMode = false,
  onToggleBulkMode,
  isImporting,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterRole,
  setFilterRole,
  filterLembaga,
  setFilterLembaga,
  roles,
  lembagaOptions,
  userRole,
  onOpenAddModal,
  onTemplateInfo,
  onImport,
  onExport,
  isDropdownOpen,
  setIsDropdownOpen,
  isRoleDropdownOpen,
  setIsRoleDropdownOpen,
  isFilterLembagaDropdownOpen,
  setIsFilterLembagaDropdownOpen,
  sortOrder,
  onToggleSort
}: PegawaiHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const daftarStatus = ["Semua Status", "Aktif", "Tidak Aktif"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsFilterLembagaDropdownOpen(false);
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsDropdownOpen, setIsFilterLembagaDropdownOpen, setIsRoleDropdownOpen]);

  return (
    <div className="space-y-6 relative">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
            <User className="w-6 h-6 text-[#243B7A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2B3674] uppercase">DATA {judulOtomatis}</h1>
            <p className="text-[#A3AED0] text-sm mt-1">Kelola data seluruh pegawai yayasan.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2 w-full sm:w-auto">
          {canCreate && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onImport}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <button
                onClick={onTemplateInfo}
                title="Download Template Impor"
                className="flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors cursor-pointer shrink-0 w-full sm:w-auto"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>Template</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                title="Impor Data dari Excel"
                className="flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer shrink-0 w-full sm:w-auto"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Upload className="w-4 h-4 shrink-0" />}
                <span>{isImporting ? 'Mengimpor...' : 'Impor'}</span>
              </button>
            </>
          )}
          <button
            onClick={onExport}
            title="Ekspor Data ke Excel"
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border rounded-lg text-sm font-semibold transition-colors cursor-pointer shrink-0 w-full sm:w-auto"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Ekspor</span>
          </button>
          {canDelete && onToggleBulkMode && (
            <button
              onClick={onToggleBulkMode}
              title="Mode Hapus Banyak Data"
              className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer shrink-0 border w-full sm:w-auto ${
                isBulkMode
                  ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-md"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
              }`}
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>{isBulkMode ? "Batal Hapus Banyak" : "Hapus Banyak"}</span>
            </button>
          )}
          {canCreate && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer shrink-0 col-span-2 sm:col-span-1 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pegawai</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 bg-white border p-3 sm:p-4 rounded-xl shadow-sm relative z-30">
        {/* Search Row */}
        <div className="flex items-center gap-2 w-full">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama, email, no hp, nip..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            onClick={onToggleSort}
            className="p-2 border rounded-lg text-gray-500 hover:bg-gray-50 transition-colors bg-white shrink-0"
            title={sortOrder === "asc" ? "Urutkan Z-A" : "Urutkan A-Z"}
          >
            {sortOrder === "asc" ? <ArrowDownAZ className="w-5 h-5" /> : <ArrowUpZA className="w-5 h-5" />}
          </button>
        </div>

        {/* Filters Row */}
        <div ref={filterRef} className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full">
          {/* Status Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => {
                const nextState = !isDropdownOpen;
                setIsDropdownOpen(nextState);
                if (nextState) {
                  setIsFilterLembagaDropdownOpen(false);
                  setIsRoleDropdownOpen(false);
                }
              }}
              className="flex items-center justify-between w-full sm:w-40 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{filterStatus === "Semua Status" ? "Status" : filterStatus}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 ml-2 shrink-0" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-30">
                {daftarStatus.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setFilterStatus(status);
                      setIsDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterStatus === status ? "text-blue-600 font-medium bg-blue-50/50" : "text-gray-700"}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lembaga Dropdown */}
          {/* Filter Lembaga (Hanya untuk Super Admin & Direktur) */}
          {(userRole === 'Super Admin' || userRole === 'Direktur') && (
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => {
                  const nextState = !isFilterLembagaDropdownOpen;
                  setIsFilterLembagaDropdownOpen(nextState);
                  if (nextState) {
                    setIsDropdownOpen(false);
                    setIsRoleDropdownOpen(false);
                  }
                }}
                className="flex items-center justify-between w-full sm:w-40 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{filterLembaga === "Semua Lembaga" ? "Lembaga" : filterLembaga}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 ml-2 shrink-0" />
              </button>

              {isFilterLembagaDropdownOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-30 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setFilterLembaga("Semua Lembaga");
                      setIsFilterLembagaDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterLembaga === "Semua Lembaga" ? "text-blue-600 font-medium bg-blue-50/50" : "text-gray-700"}`}
                  >
                    Semua Lembaga
                  </button>
                  <button
                    onClick={() => {
                      setFilterLembaga("Global");
                      setIsFilterLembagaDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterLembaga === "Global" ? "text-blue-600 font-medium bg-blue-50/50" : "text-gray-700"}`}
                  >
                    Global (Yayasan)
                  </button>
                  {lembagaOptions?.map((l) => (
                    <button
                      key={l.lembaga_id || l.id}
                      onClick={() => {
                        setFilterLembaga(l.singkatan || "");
                        setIsFilterLembagaDropdownOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterLembaga === l.singkatan ? "text-blue-600 font-medium bg-blue-50/50" : "text-gray-700"}`}
                    >
                      {l.singkatan} · {l.nama_lembaga}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Role Dropdown */}
          <div className="relative col-span-2 sm:col-span-1 w-full sm:w-auto">
            <button
              onClick={() => {
                const nextState = !isRoleDropdownOpen;
                setIsRoleDropdownOpen(nextState);
                if (nextState) {
                  setIsDropdownOpen(false);
                  setIsFilterLembagaDropdownOpen(false);
                }
              }}
              className="flex items-center justify-between w-full sm:w-44 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{filterRole === "Semua Role" ? "Role Sistem" : filterRole}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 ml-2 shrink-0" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-44 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-30">
                <button
                  onClick={() => {
                    setFilterRole("Semua Role");
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterRole === "Semua Role" ? "text-blue-600 font-medium bg-blue-50/50" : "text-gray-700"}`}
                >
                  Semua Role
                </button>
                {roles?.map((r) => (
                  <button
                    key={r.role_id}
                    onClick={() => {
                      setFilterRole(r.nama_role);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterRole === r.nama_role ? "text-blue-600 font-medium bg-blue-50/50" : "text-gray-700"}`}
                  >
                    {r.nama_role}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
