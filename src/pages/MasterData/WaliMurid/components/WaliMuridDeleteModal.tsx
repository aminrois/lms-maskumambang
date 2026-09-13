import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { WALI_MURID } from "../../../../types/database";

interface WaliMuridDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  waliToDelete: WALI_MURID | null;
  isPending: boolean;
  onConfirm: () => void;
}

export default function WaliMuridDeleteModal({
  isOpen,
  onClose,
  waliToDelete,
  isPending,
  onConfirm
}: WaliMuridDeleteModalProps) {
  if (!waliToDelete) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Konfirmasi Hapus Wali Murid
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <p className="text-sm text-gray-700">
            Apakah Anda yakin ingin menghapus data wali murid <span className="font-bold">{waliToDelete.nama_wali}</span>?
          </p>

          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Peringatan Penghapusan Data!</h4>
            <p className="text-xs text-red-700 mb-2">
              Menghapus wali murid ini akan berdampak pada <strong>{(waliToDelete as any).siswa?.length || 0} siswa</strong> yang saat ini tertaut dengannya. Siswa-siswa tersebut akan kehilangan data wali murid (menjadi kosong).
            </p>
            <p className="text-xs text-red-700">
              Akun login yang terkait dengan wali murid ini juga akan ikut terhapus.
            </p>
          </div>
          
          <p className="text-sm font-medium text-gray-800">
            Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
          </p>
        </div>

        <DialogFooter className="mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Ya, Hapus Wali Murid
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
