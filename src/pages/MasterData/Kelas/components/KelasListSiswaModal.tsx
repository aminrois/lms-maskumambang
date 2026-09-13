import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { Loader2, Plus, X } from "lucide-react";
import { useState } from "react";

interface KelasListSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoadingSiswa: boolean;
  dataSiswa: any[];
  canManageSiswa: boolean;
  onOpenAssignModal: () => void;
  onRemoveSiswa: (siswaId: number) => void;
  isRemoving: boolean;
}

export default function KelasListSiswaModal({
  isOpen,
  onClose,
  isLoadingSiswa,
  dataSiswa,
  canManageSiswa,
  onOpenAssignModal,
  onRemoveSiswa,
  isRemoving
}: KelasListSiswaModalProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Daftar Siswa Kelas</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto mt-4 pr-2">
          {isLoadingSiswa ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : dataSiswa.length === 0 ? (
            <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg border">
              Tidak ada siswa yang terdaftar di kelas ini.
            </div>
          ) : (
            <ul className="space-y-3">
              {dataSiswa.map((siswa: any, index: number) => (
                <li key={siswa.siswa_id} className="flex items-center justify-between gap-4 p-3 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 font-bold rounded-full text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">{siswa.nama}</h4>
                      <p className="text-xs text-gray-500">NIS: {siswa.nis || "—"}</p>
                    </div>
                  </div>
                  {canManageSiswa && (
                    <div>
                      {confirmId === siswa.siswa_id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-600 font-medium">Yakin lepas?</span>
                          <button
                            onClick={() => {
                              onRemoveSiswa(siswa.siswa_id);
                              setConfirmId(null);
                            }}
                            disabled={isRemoving}
                            className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Ya
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            disabled={isRemoving}
                            className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(siswa.siswa_id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Lepas siswa dari kelas"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter className="mt-6 border-t pt-4 w-full">
          <div className="flex flex-col-reverse sm:flex-row justify-between w-full gap-2">
            <div>
              {canManageSiswa && (
                <button
                  type="button"
                  onClick={onOpenAssignModal}
                  className="px-4 py-2 w-full sm:w-auto text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah Siswa
                </button>
              )}
            </div>
            <button type="button" onClick={onClose} className="px-4 py-2 w-full sm:w-auto text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
              Tutup
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
