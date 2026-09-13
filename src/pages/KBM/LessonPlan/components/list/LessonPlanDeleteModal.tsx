import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface LessonPlanDeleteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: any;
  isPending: boolean;
  onDelete: () => void;
}

export function LessonPlanDeleteModal({
  isOpen,
  onOpenChange,
  selectedPlan,
  isPending,
  onDelete
}: LessonPlanDeleteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 rounded-[24px] border-none shadow-xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-xl font-semibold">
            <AlertTriangle className="w-5 h-5" />
            Hapus Lesson Plan (RPP)
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Apakah Anda yakin ingin menghapus RPP <span className="font-bold">{selectedPlan?.judul_rpp}</span>?
          </p>

          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Peringatan Penting!</h4>
            <p className="text-xs text-red-700 leading-relaxed">
              Menghapus RPP ini akan menghapus semua data yang terkait di dalamnya. Data berikut akan <strong>ikut terhapus secara permanen</strong>:
            </p>
            <ul className="list-disc list-inside text-xs text-red-700 space-y-1.5 ml-1 mt-2">
              <li>Seluruh detail pertemuan RPP</li>
              <li>Seluruh <strong>Jurnal Mengajar</strong> dan <strong>Absensi Siswa</strong> yang telah terisi dan terhubung ke RPP ini</li>
            </ul>
          </div>

          <p className="text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-150 p-3 rounded-lg leading-tight text-center">
            ⚠️ Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
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
            Hapus Permanen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
