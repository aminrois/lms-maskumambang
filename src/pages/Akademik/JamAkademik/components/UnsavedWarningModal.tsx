import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface UnsavedWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmLeave: () => void;
  onTerapkanNow: () => void;
}

export const UnsavedWarningModal: React.FC<UnsavedWarningModalProps> = ({
  open,
  onOpenChange,
  onConfirmLeave,
  onTerapkanNow,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600 font-bold">
            <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
            Perubahan Belum Tersimpan!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm text-gray-700">
            Anda memiliki perubahan draf <span className="font-semibold text-gray-900">Jam Akademik</span> yang belum diterapkan ke server.
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            Jika Anda meninggalkan halaman ini sekarang, seluruh perubahan draf yang belum diterapkan akan hilang.
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-1.5 flex flex-col sm:flex-row justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirmLeave}
            className="px-3.5 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
          >
            Tinggalkan & Buang
          </button>
          <button
            type="button"
            onClick={onTerapkanNow}
            className="px-3.5 py-2 text-xs font-medium text-white bg-[#243B7A] hover:bg-[#1a2b5a] rounded-lg transition-colors cursor-pointer"
          >
            Terapkan Sekarang
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
