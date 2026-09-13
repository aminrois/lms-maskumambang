import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import type { MataPelajaranResponse } from "../hooks/useMataPelajaran";

interface MataPelajaranDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapelToDelete: MataPelajaranResponse | null;
  onConfirm: () => void;
}

export const MataPelajaranDeleteModal: React.FC<MataPelajaranDeleteModalProps> = ({
  open,
  onOpenChange,
  mapelToDelete,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Konfirmasi Hapus Mata Pelajaran
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <p className="text-sm text-gray-700">
            Apakah Anda yakin ingin menghapus mata pelajaran <span className="font-bold">{mapelToDelete?.nama_mapel}</span> untuk lembaga <span className="font-bold">{mapelToDelete?.lembaga?.singkatan || "—"}</span>?
          </p>
          <p className="text-xs text-gray-500">
            Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Kemungkinan memicu kegagalan jika mapel sudah digunakan di jadwal pelajaran atau absensi.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Hapus
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
