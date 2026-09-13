import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface FormCancelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FormCancelDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel
}: FormCancelDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 rounded-[24px] border-none shadow-xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600 text-xl font-semibold">
            <AlertTriangle className="w-5 h-5" />
            Ada Perubahan Belum Disimpan!
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 text-gray-755 text-sm leading-relaxed">
          Anda telah melakukan perubahan pada form ini. Apakah Anda yakin ingin membatalkan dan meninggalkan halaman? Perubahan yang Anda buat tidak akan disimpan.
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-xl border-slate-200"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
          >
            Ya, Tinggalkan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
