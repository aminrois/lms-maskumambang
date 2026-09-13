import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

interface WaliMuridResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
  isPending: boolean;
  onConfirm: (userId: string) => void;
}

export default function WaliMuridResetPasswordModal({
  isOpen,
  onClose,
  userId,
  isPending,
  onConfirm
}: WaliMuridResetPasswordModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Konfirmasi Reset Password
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <p className="text-sm text-gray-700">
            Apakah Anda yakin ingin me-reset password akun ini ke "password123"?
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
            onClick={() => {
              if (userId) onConfirm(userId);
            }}
            disabled={isPending || !userId}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Ya, Reset Password
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
