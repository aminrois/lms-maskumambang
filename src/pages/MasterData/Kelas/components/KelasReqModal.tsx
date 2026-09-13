import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface KelasReqModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirementError: string[];
}

export default function KelasReqModal({
  isOpen,
  onClose,
  requirementError
}: KelasReqModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            Persyaratan Data Belum Terpenuhi
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <p className="text-sm text-gray-600">
            Untuk menambahkan Kelas baru, Anda memerlukan data pendukung berikut:
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            {requirementError.map((err, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-amber-800">
                <span className="font-bold text-amber-600">•</span>
                <span>{err}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Silakan tambahkan data yang diperlukan terlebih dahulu melalui menu Master Data yang sesuai sebelum membuat Kelas baru.
          </p>
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 w-full text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
          >
            Mengerti
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
