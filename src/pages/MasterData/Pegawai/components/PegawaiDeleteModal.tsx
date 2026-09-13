import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import type { PegawaiUI } from "../hooks/usePegawaiData";

interface PegawaiDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  pegawaiToDelete: PegawaiUI | null;
  isPending: boolean;
  onConfirm: () => void;
}

export default function PegawaiDeleteModal({
  isOpen,
  onClose,
  pegawaiToDelete,
  isPending,
  onConfirm
}: PegawaiDeleteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Konfirmasi Hapus Pegawai
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <p className="text-sm text-gray-700">
            Apakah Anda yakin ingin menghapus data pegawai <span className="font-bold">{pegawaiToDelete?.nama}</span> ?
          </p>

          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Peringatan Penghapusan Data!</h4>
            <p className="text-xs text-red-700 mb-2">
              Menghapus pegawai ini akan berdampak pada seluruh data yang berelasi dengannya. Data berikut kemungkinan akan <strong>ikut terhapus</strong> atau kehilangan referensinya:
            </p>
            <ul className="list-disc list-inside text-xs text-red-700 space-y-1 ml-1">
              <li>Akun <strong>User (Login)</strong> beserta akses Role-nya</li>
              <li>Relasi <strong>Penugasan Lembaga</strong> yang dimiliki</li>
              <li>Relasi <strong>Mata Pelajaran</strong> yang diajarkan</li>
              <li>Data sebagai <strong>Wali Kelas</strong> (jika ada)</li>
              <li>Data sebagai <strong>Kepala Sekolah / Waka Kurikulum</strong></li>
              <li>Riwayat <strong>Presensi (Absensi)</strong></li>
            </ul>
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
            Ya, Hapus Pegawai
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
