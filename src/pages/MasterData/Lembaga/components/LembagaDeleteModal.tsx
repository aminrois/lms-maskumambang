import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { LembagaUI } from "../hooks/useLembagaData";

interface LembagaDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  lembagaToDelete: LembagaUI | null;
  isPending: boolean;
  onConfirm: () => void;
}

export default function LembagaDeleteModal({
  isOpen,
  onClose,
  lembagaToDelete,
  isPending,
  onConfirm
}: LembagaDeleteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Konfirmasi Hapus Lembaga
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-3">
          <p className="text-sm text-gray-700">
            Apakah Anda yakin ingin menghapus lembaga <span className="font-bold">{lembagaToDelete?.namaLengkap} ({lembagaToDelete?.singkatan})</span>?
          </p>
          
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Peringatan Penghapusan Data!</h4>
            <p className="text-xs text-red-700 mb-2">
              Menghapus lembaga ini akan berdampak pada seluruh data yang berelasi dengannya. Data berikut kemungkinan akan <strong>ikut terhapus</strong> atau kehilangan referensinya:
            </p>
            <ul className="list-disc list-inside text-xs text-red-700 space-y-1 ml-1">
              <li>Data <strong>Siswa</strong> yang terdaftar di lembaga ini <span className="font-bold">({lembagaToDelete?.statistik?.siswa || 0} siswa akan terdampak)</span></li>
              <li>Data <strong>Kelas</strong> dan Wali Kelas terkait <span className="font-bold">({lembagaToDelete?.statistik?.kelas || 0} kelas akan terdampak)</span></li>
              <li>Data <strong>Tahun Ajaran</strong> dan Semester aktif</li>
              <li>Data <strong>Jadwal Pelajaran</strong> dan Kalender Akademik</li>
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
            Ya, Hapus Lembaga
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
