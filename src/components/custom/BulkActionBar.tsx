import { useState, useRef, useEffect } from "react";
import { Trash2, CheckCheck, X, ChevronDown, Building2, GraduationCap, AlertTriangle, Loader2, Check } from "lucide-react";
import StaticIslamicPattern from "@/components/ui/StaticIslamicPattern";

export interface BulkActionBarProps {
  selectedCount: number;
  totalDataCount?: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  isDeleting?: boolean;
  
  // Opsional: Untuk Siswa & Pegawai
  lembagaList?: { id: number | string; nama: string; singkatan?: string }[];
  onSelectByLembaga?: (lembagaId: number | string, isSelected: boolean) => void;
  
  kelasList?: { id: number | string; nama: string; lembaga_id?: number | string; nama_lembaga?: string }[];
  onSelectByKelas?: (kelasId: number | string, isSelected: boolean) => void;
  
  // Pesan peringatan kustom untuk modal konfirmasi
  warningMessage?: React.ReactNode;
}

export default function BulkActionBar({
  selectedCount,
  totalDataCount,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  isDeleting = false,
  lembagaList,
  onSelectByLembaga,
  kelasList,
  onSelectByKelas,
  warningMessage,
}: BulkActionBarProps) {
  const [openDropdown, setOpenDropdown] = useState<"lembaga" | "kelas" | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [checkedLembagas, setCheckedLembagas] = useState<(number | string)[]>([]);
  const [checkedKelas, setCheckedKelas] = useState<(number | string)[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [prevSelectedCount, setPrevSelectedCount] = useState(selectedCount);
  if (selectedCount !== prevSelectedCount) {
    setPrevSelectedCount(selectedCount);
    if (selectedCount === 0) {
      setCheckedLembagas([]);
      setCheckedKelas([]);
    } else if (totalDataCount !== undefined && totalDataCount > 0 && selectedCount === totalDataCount) {
      if (lembagaList) setCheckedLembagas(lembagaList.map(l => l.id));
      if (kelasList) setCheckedKelas(kelasList.map(k => k.id));
    }
  }

  const isAllSelected = totalDataCount !== undefined && totalDataCount > 0 && selectedCount === totalDataCount;

  const lembagaPercent = lembagaList && lembagaList.length > 0
    ? Math.round((checkedLembagas.length / lembagaList.length) * 100)
    : 0;
  const kelasPercent = kelasList && kelasList.length > 0
    ? Math.round((checkedKelas.length / kelasList.length) * 100)
    : 0;

  return (
    <>
      <div className="bg-[#1e2f65] text-white p-4 rounded-2xl shadow-xl border border-[#2A4080] flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300 relative z-30">
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-0">
          <StaticIslamicPattern className="opacity-50" opacity={0.07} />
        </div>
        {/* Left Side: Info */}
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wide text-white">Mode Hapus Banyak</span>
            <span className="text-xs text-slate-300 mt-0.5 font-medium">
              {totalDataCount !== undefined ? (
                <>
                  Terpilih <strong className="text-[#FACC15] font-bold">{selectedCount}</strong> dari total <strong className="text-white font-bold">{totalDataCount}</strong> data
                </>
              ) : (
                <>
                  Terpilih <strong className="text-[#FACC15] font-bold">{selectedCount}</strong> data
                </>
              )}
            </span>
          </div>
        </div>

        {/* Right Side: Quick Select & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10" ref={dropdownRef}>
          {/* Tombol Pilih Semua */}
          <button
            type="button"
            onClick={onSelectAll}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer border ${
              isAllSelected
                ? "bg-[#FACC15] hover:bg-[#eebf0c] text-[#1e2f65] font-extrabold border-white/40 shadow-md shadow-[#FACC15]/20"
                : "bg-[#2A4080] hover:bg-[#334d99] text-white border-slate-400/30"
            }`}
          >
            <CheckCheck className={`w-4 h-4 ${isAllSelected ? "text-[#1e2f65]" : "text-[#FACC15]"}`} />
            {isAllSelected ? `Batal Pilih Semua (${totalDataCount})` : `Pilih Semua ${totalDataCount !== undefined ? `(${totalDataCount})` : ""}`}
          </button>

          {/* Dropdown Pilih by Lembaga (Checklist) */}
          {onSelectByLembaga && lembagaList && lembagaList.length > 0 && (
            <div className="relative" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "lembaga" ? null : "lembaga")}
                style={{
                  background: lembagaPercent > 0
                    ? `linear-gradient(to right, #FACC15 ${lembagaPercent}%, #2A4080 ${lembagaPercent}%)`
                    : undefined
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer border ${
                  lembagaPercent === 100
                    ? "text-[#1e2f65] font-extrabold border-white/40 shadow-md shadow-[#FACC15]/20"
                    : lembagaPercent > 0
                    ? "text-white font-extrabold drop-shadow-sm border-slate-300/40"
                    : "bg-[#2A4080] hover:bg-[#334d99] text-white border-slate-400/30"
                }`}
              >
                <span className={lembagaPercent > 0 && lembagaPercent < 100 ? "inline-flex items-center gap-1.5 bg-[#1e2f65]/90 text-white px-2.5 py-0.5 rounded-lg shadow-sm border border-white/15 backdrop-blur-xs" : "inline-flex items-center gap-1.5"}>
                  <Building2 className={`w-4 h-4 shrink-0 ${lembagaPercent === 100 ? "text-[#1e2f65]" : "text-[#FACC15]"}`} />
                  <span>Pilih by Lembaga</span>
                </span>
                {checkedLembagas.length > 0 && (
                  <span className="bg-[#1e2f65] text-[#FACC15] text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-white/20 shadow-xs">
                    {checkedLembagas.length}/{lembagaList.length}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === "lembaga" ? "rotate-180" : ""}`} />
              </button>

              {openDropdown === "lembaga" && (
                <div className="absolute right-0 mt-2 w-60 bg-[#1e2f65]/95 backdrop-blur-xl border border-[#2A4080] rounded-xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto divide-y divide-white/10">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    <span>Pilih Berdasarkan Lembaga</span>
                  </div>
                  <div className="py-1">
                    {lembagaList.length === 0 ? (
                      <div className="px-3 py-2.5 text-xs text-slate-400 italic text-center">Tidak ada data</div>
                    ) : (
                      lembagaList.map((l, index) => (
                      <button
                        key={l.id ?? index}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const isChecked = checkedLembagas.includes(l.id);
                          const newChecked = !isChecked;
                          if (newChecked) {
                            setCheckedLembagas(prev => [...prev, l.id]);
                          } else {
                            setCheckedLembagas(prev => prev.filter(id => id !== l.id));
                          }
                          onSelectByLembaga(l.id, newChecked);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                          checkedLembagas.includes(l.id)
                            ? "bg-[#2A4080] text-white"
                            : "text-slate-200 hover:bg-[#2A4080]/60 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            checkedLembagas.includes(l.id)
                              ? "bg-[#FACC15] border-[#FACC15] text-[#1e2f65]"
                              : "border-slate-400 bg-white/5"
                          }`}>
                            {checkedLembagas.includes(l.id) && <Check className="w-3 h-3 stroke-3" />}
                          </div>
                          <span className="truncate">{l.nama}</span>
                        </div>
                        {l.singkatan && <span className="text-[10px] text-[#FACC15] bg-[#1e2f65] px-1.5 py-0.5 rounded border border-slate-400/30 shrink-0">{l.singkatan}</span>}
                      </button>
                    )))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dropdown Pilih by Kelas (Checklist) */}
          {onSelectByKelas && kelasList && kelasList.length > 0 && (
            <div className="relative" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "kelas" ? null : "kelas")}
                style={{
                  background: kelasPercent > 0
                    ? `linear-gradient(to right, #FACC15 ${kelasPercent}%, #2A4080 ${kelasPercent}%)`
                    : undefined
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer border ${
                  kelasPercent === 100
                    ? "text-[#1e2f65] font-extrabold border-white/40 shadow-md shadow-[#FACC15]/20"
                    : kelasPercent > 0
                    ? "text-white font-extrabold drop-shadow-sm border-slate-300/40"
                    : "bg-[#2A4080] hover:bg-[#334d99] text-white border-slate-400/30"
                }`}
              >
                <span className={kelasPercent > 0 && kelasPercent < 100 ? "inline-flex items-center gap-1.5 bg-[#1e2f65]/90 text-white px-2.5 py-0.5 rounded-lg shadow-sm border border-white/15 backdrop-blur-xs" : "inline-flex items-center gap-1.5"}>
                  <GraduationCap className={`w-4 h-4 shrink-0 ${kelasPercent === 100 ? "text-[#1e2f65]" : "text-[#FACC15]"}`} />
                  <span>Pilih by Kelas</span>
                </span>
                {checkedKelas.length > 0 && (
                  <span className="bg-[#1e2f65] text-[#FACC15] text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-white/20 shadow-xs">
                    {checkedKelas.length}/{kelasList.length}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === "kelas" ? "rotate-180" : ""}`} />
              </button>

              {openDropdown === "kelas" && (
                <div className="absolute right-0 mt-2 w-64 bg-[#1e2f65]/95 backdrop-blur-xl border border-[#2A4080] rounded-xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto divide-y divide-white/10">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    <span>Pilih Berdasarkan Kelas</span>
                  </div>
                  <div className="py-1">
                    {kelasList.length === 0 ? (
                      <div className="px-3 py-2.5 text-xs text-slate-400 italic text-center">Tidak ada data</div>
                    ) : (
                      kelasList.map((k, index) => (
                      <button
                        key={k.id ?? index}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const isChecked = checkedKelas.includes(k.id);
                          const newChecked = !isChecked;
                          if (newChecked) {
                            setCheckedKelas(prev => [...prev, k.id]);
                          } else {
                            setCheckedKelas(prev => prev.filter(id => id !== k.id));
                          }
                          onSelectByKelas(k.id, newChecked);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                          checkedKelas.includes(k.id)
                            ? "bg-[#2A4080] text-white"
                            : "text-slate-200 hover:bg-[#2A4080]/60 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            checkedKelas.includes(k.id)
                              ? "bg-[#FACC15] border-[#FACC15] text-[#1e2f65]"
                              : "border-slate-400 bg-white/5"
                          }`}>
                            {checkedKelas.includes(k.id) && <Check className="w-3 h-3 stroke-3" />}
                          </div>
                          <span className="truncate">{k.nama}</span>
                        </div>
                        {k.nama_lembaga && (
                          <span className="text-[10px] text-[#FACC15] bg-[#1e2f65] px-1.5 py-0.5 rounded border border-slate-400/30 whitespace-nowrap shrink-0">
                            {k.nama_lembaga}
                          </span>
                        )}
                      </button>
                    )))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tombol Kosongkan / Batal */}
          <button
            type="button"
            onClick={onClearSelection}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-[#2A4080]/60 transition-all active:scale-95 cursor-pointer"
            title="Kosongkan pilihan dan keluar mode hapus banyak"
          >
            <X className="w-4 h-4" />
            Batal
          </button>

          {/* Tombol Eksekusi Hapus */}
          <button
            type="button"
            disabled={selectedCount === 0 || isDeleting}
            onClick={() => setIsConfirmOpen(true)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              selectedCount === 0 || isDeleting
                ? "bg-[#16234b]/80 text-slate-400 border border-[#2A4080]/50 cursor-not-allowed shadow-none"
                : "bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30 hover:shadow-lg active:scale-95 border border-rose-400/30 cursor-pointer"
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Hapus Terpilih ({selectedCount})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 p-6 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-900/50 shadow-inner">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
              Konfirmasi Hapus Banyak
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-300 text-center mb-6 leading-relaxed">
              {warningMessage ? warningMessage : (
                <>Anda yakin ingin menghapus <strong className="text-rose-600 dark:text-rose-400 font-bold">{selectedCount} data</strong> yang terpilih? Tindakan ini tidak dapat dibatalkan dan akan otomatis membersihkan atau memutus relasi data terkait di sistem.</>
              )}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  onDeleteSelected();
                  setIsConfirmOpen(false);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25 transition-all active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  "Ya, Hapus Terpilih"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
