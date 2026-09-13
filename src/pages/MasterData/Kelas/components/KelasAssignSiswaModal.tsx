import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { restClient } from "../../../../lib/api/axios";
import { sanitizePostgrestSearch } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../../../components/ui/dialog";
import { Loader2, Search, Check, AlertCircle } from "lucide-react";

interface KelasAssignSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelasId: number | null;
  lembagaId: number | null;
  onAssign: (siswaIds: number[]) => void;
  isPending: boolean;
}

export default function KelasAssignSiswaModal({
  isOpen,
  onClose,
  kelasId,
  lembagaId,
  onAssign,
  isPending
}: KelasAssignSiswaModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: searchResults = [], isLoading: isSearchLoading } = useQuery({
    queryKey: ['assign-siswa-search', debouncedQuery, lembagaId, kelasId],
    queryFn: async () => {
      // Return empty if there's no search query and we don't want to load all 10000 by default.
      // Or fetch up to 30 as a default list.
      const params: any = {
        select: 'siswa_id,nama,nis,kelas_id,status,kelas:kelas_id(nama_kelas,lembaga_id)',
        status: 'eq.Aktif',
        limit: 30,
        order: 'nama.asc'
      };

      if (debouncedQuery.trim()) {
        const cleanQuery = sanitizePostgrestSearch(debouncedQuery);
        if (cleanQuery) {
          params.or = `(nama.ilike.*${cleanQuery}*,nis.ilike.*${cleanQuery}*)`;
        }
      }

      const response = await restClient.get('/siswa', { params });
      return response.data || [];
    },
    enabled: isOpen
  });
  const filteredSiswa = useMemo(() => {
    return searchResults.filter((siswa: any) => {
      let matchLembaga = true;
      if (lembagaId && siswa.kelas_id && siswa.kelas?.lembaga_id) {
        matchLembaga = siswa.kelas.lembaga_id === lembagaId;
      }
      const notInThisClass = siswa.kelas_id !== kelasId;
      return matchLembaga && notInThisClass;
    });
  }, [searchResults, lembagaId, kelasId]);

  const handleToggle = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleToggleAll = () => {
    if (selectedIds.size === filteredSiswa.length && filteredSiswa.length > 0) {
      setSelectedIds(newSet => {
        const next = new Set(newSet);
        filteredSiswa.forEach((s: any) => next.delete(s.siswa_id));
        return next;
      });
    } else {
      setSelectedIds(newSet => {
        const next = new Set(newSet);
        filteredSiswa.forEach((s: any) => next.add(s.siswa_id));
        return next;
      });
    }
  };

  const handleSave = () => {
    if (selectedIds.size === 0) return;
    onAssign(Array.from(selectedIds));
  };

  // Reset state on close
  const handleClose = () => {
    setSearchQuery("");
    setSelectedIds(new Set());
    onClose();
  };

  const allSelected = filteredSiswa.length > 0 && selectedIds.size === filteredSiswa.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tambah Siswa ke Kelas</DialogTitle>
          <DialogDescription>
            Pilih siswa untuk ditambahkan. Siswa yang sudah berada di kelas lain akan dipindahkan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden mt-2">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama atau NIS siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-0 focus:border-gray-300 transition-all text-gray-700"
            />
          </div>

          {/* Header Action */}
          <div className="flex justify-between items-center mb-2 px-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleToggleAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                disabled={filteredSiswa.length === 0}
              />
              Pilih Semua ({filteredSiswa.length})
            </label>
            <span className="text-xs text-gray-500 font-medium">
              {selectedIds.size} dipilih
            </span>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto pr-2 border rounded-lg bg-gray-50/30">
            {isSearchLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : filteredSiswa.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <AlertCircle className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">Tidak ada siswa yang ditemukan.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {filteredSiswa.map((siswa: any) => {
                  const isSelected = selectedIds.has(siswa.siswa_id);
                  return (
                    <li
                      key={siswa.siswa_id}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-blue-50/50 ${isSelected ? "bg-blue-50/30" : "bg-white"}`}
                      onClick={() => handleToggle(siswa.siswa_id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(siswa.siswa_id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                        onClick={(e) => e.stopPropagation()} // Prevent double trigger
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-gray-800 text-sm">{siswa.nama}</h4>
                          {siswa.kelas_id && (
                            <span className="text-[10px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                              {siswa.kelas?.nama_kelas || "Kelas Lain"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">NIS: {siswa.nis || "—"}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6 border-t pt-4">
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="px-4 py-2 w-full sm:w-auto text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || selectedIds.size === 0}
              className="px-4 py-2 w-full sm:w-auto text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Simpan ({selectedIds.size})
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
