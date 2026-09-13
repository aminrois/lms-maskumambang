import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ActivityPlanDeleteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: any;
  isPending: boolean;
  onDelete: () => void;
}

export function ActivityPlanDeleteModal({
  isOpen,
  onOpenChange,
  selectedPlan,
  isPending,
  onDelete
}: ActivityPlanDeleteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 rounded-[24px] border-none shadow-xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-xl font-semibold">
            <AlertTriangle className="w-5 h-5" />
            Hapus Activity Plan
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <p className="text-sm text-gray-700">
            Apakah Anda yakin ingin menghapus activity plan <span className="font-bold">{selectedPlan?.nama_kegiatan}</span>?
          </p>

          {selectedPlan?.status_verifikasi === "Disetujui" ? (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-2">Perhatian: Data Terkait Akan Terhapus!</h4>
              <p className="text-xs text-red-700 mb-2">
                Activity Plan ini sudah disetujui. Menghapusnya akan menghapus data-data yang terkait. Data berikut kemungkinan besar akan <strong>ikut terhapus</strong>:
              </p>
              <ul className="list-disc list-inside text-xs text-red-700 space-y-1 ml-1">
                <li>Seluruh <strong>Status Verifikasi</strong> yang telah diberikan</li>
                <li>Tautan acara di dalam <strong>Kalender Akademik</strong></li>
              </ul>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-800 mb-2">Penghapusan Rancangan Kegiatan</h4>
              <p className="text-xs text-amber-700">
                Activity Plan ini belum mendapat persetujuan. Menghapusnya hanya akan menghapus rancangan kegiatan ini saja, tanpa memengaruhi Kalender Akademik.
              </p>
            </div>
          )}

          <p className="text-sm font-medium text-gray-800">
            Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row w-full gap-3 mt-4">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full flex-1 rounded-xl h-12 text-slate-600 font-medium border-slate-200"
            >
              Batal
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="w-full flex-1 rounded-xl h-12 bg-red-600 hover:bg-red-700 text-white font-medium"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Hapus
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
