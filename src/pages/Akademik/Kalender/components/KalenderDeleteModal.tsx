import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

interface KalenderDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventToDelete: any;
  onConfirm: () => void;
  isPending: boolean;
}

export const KalenderDeleteModal: React.FC<KalenderDeleteModalProps> = ({
  open,
  onOpenChange,
  eventToDelete,
  onConfirm,
  isPending,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Konfirmasi Hapus Event Kalender
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <p className="text-sm text-gray-700">
            Apakah Anda yakin ingin menghapus event <span className="font-bold">{eventToDelete?.nama_kegiatan}</span>?
          </p>
          <p className="text-xs text-gray-500">
            Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            disabled={isPending}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            disabled={isPending}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Hapus
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
