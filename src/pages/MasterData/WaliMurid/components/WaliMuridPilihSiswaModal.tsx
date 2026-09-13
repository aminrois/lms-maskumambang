import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { Plus, Trash2, Search, GraduationCap, Loader2 } from "lucide-react";
import type { WALI_MURID } from "../../../../types/database";

interface WaliMuridPilihSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWali: WALI_MURID | null;
  isAddingSiswa: boolean;
  setIsAddingSiswa: (val: boolean) => void;
  searchSiswaQuery: string;
  setSearchSiswaQuery: (val: string) => void;
  selectedKelasFilter: string;
  setSelectedKelasFilter: (val: string) => void;
  dataKelasFilter: any[];
  isLoadingUnlinkedSiswa: boolean;
  filteredUnlinkedSiswa: any[];
  selectedSiswaIds: number[];
  setSelectedSiswaIds: (val: number[]) => void;
  tautkanPending: boolean;
  onTautkan: () => void;
  onOpenUnlink: (siswa: any) => void;
}

export default function WaliMuridPilihSiswaModal({
  isOpen,
  onClose,
  activeWali,
  isAddingSiswa,
  setIsAddingSiswa,
  searchSiswaQuery,
  setSearchSiswaQuery,
  selectedKelasFilter,
  setSelectedKelasFilter,
  dataKelasFilter,
  isLoadingUnlinkedSiswa,
  filteredUnlinkedSiswa,
  selectedSiswaIds,
  setSelectedSiswaIds,
  tautkanPending,
  onTautkan,
  onOpenUnlink
}: WaliMuridPilihSiswaModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md max-h-[85vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Kelola Ananda untuk {activeWali?.nama_wali}</DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex flex-col space-y-4 overflow-y-auto pr-1">
          <div className="border rounded-md overflow-hidden bg-slate-50">
            <div className="bg-slate-100 px-4 py-2 border-b flex justify-between items-center">
              <span className="text-sm font-medium">Daftar Siswa</span>
              <button 
                onClick={() => setIsAddingSiswa(!isAddingSiswa)}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Tambah
              </button>
            </div>
            
            <ul className="divide-y max-h-48 overflow-y-auto">
              {activeWali && (activeWali as any).siswa && (activeWali as any).siswa.length > 0 ? (
                (activeWali as any).siswa.map((s: any) => (
                  <li key={s.siswa_id} className="p-3 text-sm flex justify-between items-center bg-white hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex justify-center items-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{s.nama}</p>
                        <p className="text-xs text-slate-500">NIS: {s.nis || '—'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onOpenUnlink(s)}
                      className="text-red-500 p-2 hover:bg-red-50 rounded transition-colors"
                      title="Hapus Tautan Siswa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))
              ) : (
                <li className="p-4 text-center text-sm text-slate-500">Belum ada siswa yang diasuh.</li>
              )}
            </ul>
          </div>

          {isAddingSiswa && (
            <div className="space-y-4 p-4 border rounded-md bg-white">
              <h4 className="text-sm font-semibold border-b pb-2">Tambah Siswa Baru</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari nama atau NIS siswa..."
                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={searchSiswaQuery}
                    onChange={(e) => setSearchSiswaQuery(e.target.value)}
                  />
                </div>
                <select
                  value={selectedKelasFilter}
                  onChange={(e) => setSelectedKelasFilter(e.target.value)}
                  className="border rounded-lg text-sm px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Semua Kelas</option>
                  {dataKelasFilter.map((k: any) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1 overflow-y-auto border rounded-lg max-h-[30vh] bg-gray-50/50">
                {isLoadingUnlinkedSiswa ? (
                  <div className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span className="text-sm">Memuat data siswa...</span>
                  </div>
                ) : filteredUnlinkedSiswa.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    Tidak ada siswa yang belum ditautkan (atau tidak sesuai pencarian/filter).
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredUnlinkedSiswa.map((siswa: any) => (
                      <label key={siswa.siswa_id} className="flex items-center p-3 hover:bg-blue-50/50 cursor-pointer transition-colors group">
                        <div className="mr-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={selectedSiswaIds.includes(siswa.siswa_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSiswaIds([...selectedSiswaIds, siswa.siswa_id]);
                              } else {
                                setSelectedSiswaIds(selectedSiswaIds.filter((id: number) => id !== siswa.siswa_id));
                              }
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700">{siswa.nama}</p>
                          <p className="text-xs text-gray-500">NIS: {siswa.nis || '—'} | Kelas: {siswa.kelas?.nama_kelas || '—'}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedSiswaIds.length > 0 && (
                <div className="flex justify-end pt-2 border-t">
                  <button
                    type="button"
                    disabled={tautkanPending}
                    onClick={onTautkan}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {tautkanPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Simpan ({selectedSiswaIds.length} Siswa)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 pt-2 border-t shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 w-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Tutup
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
