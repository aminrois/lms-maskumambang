import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

interface ActivityPlanVerifyModalsProps {
  isApproveOpen: boolean;
  onApproveOpenChange: (open: boolean) => void;
  isRevisiOpen: boolean;
  onRevisiOpenChange: (open: boolean) => void;
  selectedPlan: any;
  revisiNote: string;
  setRevisiNote: (note: string) => void;
  isPending: boolean;
  onVerify: (action: "Disetujui" | "Revisi") => void;
}

export function ActivityPlanVerifyModals({
  isApproveOpen,
  onApproveOpenChange,
  isRevisiOpen,
  onRevisiOpenChange,
  selectedPlan,
  revisiNote,
  setRevisiNote,
  isPending,
  onVerify
}: ActivityPlanVerifyModalsProps) {
  return (
    <>
      {/* Modal Approve */}
      <Dialog open={isApproveOpen} onOpenChange={onApproveOpenChange}>
        <DialogContent className="sm:max-w-md p-6 rounded-[24px] border-none shadow-xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 text-xl font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Setujui Activity Plan
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-gray-700 text-sm">
            Apakah Anda yakin ingin menyetujui Activity Plan{" "}
            <span className="font-bold">{selectedPlan?.nama_kegiatan}</span>?
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => onApproveOpenChange(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={() => onVerify("Disetujui")}
              disabled={isPending}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Setujui
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Revisi */}
      <Dialog open={isRevisiOpen} onOpenChange={onRevisiOpenChange}>
        <DialogContent className="sm:max-w-md p-6 rounded-[24px] border-none shadow-xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-xl font-semibold">
              <XCircle className="w-5 h-5" />
              Tolak / Revisi Activity Plan
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4 text-gray-700 text-sm">
            <p>
              Activity Plan{" "}
              <span className="font-bold">{selectedPlan?.nama_kegiatan}</span> akan
              dikembalikan kepada pengusul untuk diperbaiki. Mohon tuliskan catatan atau alasan penolakan dengan jelas.
            </p>
            <div className="space-y-2">
              <Label>Catatan Revisi</Label>
              <Textarea
                placeholder="Alasan penolakan / revisi..."
                value={revisiNote}
                onChange={(e) => setRevisiNote(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => onRevisiOpenChange(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={() => onVerify("Revisi")}
              disabled={isPending || !revisiNote.trim()}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Tolak & Kembalikan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
