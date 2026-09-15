import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

interface LessonPlanReviewModalsProps {
  isApproveOpen: boolean;
  onApproveOpenChange: (open: boolean) => void;
  isRevisiOpen: boolean;
  onRevisiOpenChange: (open: boolean) => void;
  isApproveAllOpen?: boolean;
  onApproveAllOpenChange?: (open: boolean) => void;
  eligibleCount?: number;
  isApprovingAll?: boolean;
  onVerifyAll?: () => void;
  selectedPlan: any;
  revisiNote: string;
  setRevisiNote: (note: string) => void;
  isPending: boolean;
  onVerify: (action: "Disetujui" | "Revisi") => void;

  // Per-Meeting Verification Modals
  isDetailApproveOpen?: boolean;
  onDetailApproveOpenChange?: (open: boolean) => void;
  isDetailRevisiOpen?: boolean;
  onDetailRevisiOpenChange?: (open: boolean) => void;
  selectedDetailForVerify?: { plan: any; detail: any } | null;
  detailRevisiNote?: string;
  setDetailRevisiNote?: (note: string) => void;
  isDetailPending?: boolean;
  onVerifyDetail?: (action: "Disetujui" | "Revisi") => void;
}

export function LessonPlanReviewModals({
  isApproveOpen,
  onApproveOpenChange,
  isRevisiOpen,
  onRevisiOpenChange,
  isApproveAllOpen = false,
  onApproveAllOpenChange,
  eligibleCount = 0,
  isApprovingAll = false,
  onVerifyAll,
  selectedPlan,
  revisiNote,
  setRevisiNote,
  isPending,
  onVerify,

  // Detail props
  isDetailApproveOpen = false,
  onDetailApproveOpenChange,
  isDetailRevisiOpen = false,
  onDetailRevisiOpenChange,
  selectedDetailForVerify,
  detailRevisiNote = "",
  setDetailRevisiNote,
  isDetailPending = false,
  onVerifyDetail,
}: LessonPlanReviewModalsProps) {
  return (
    <>
      {/* Modal Approve All */}
      {onApproveAllOpenChange && onVerifyAll && (
        <Dialog open={isApproveAllOpen} onOpenChange={onApproveAllOpenChange}>
          <DialogContent className="sm:max-w-md p-6 rounded-[24px] border-none shadow-xl bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-600 text-xl font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                Setujui Semua Lesson Plan
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 text-slate-700 text-sm leading-relaxed">
              Apakah Anda yakin ingin menyetujui <span className="font-bold text-emerald-700">{eligibleCount} Lesson Plan (RPP)</span> sekaligus? Setelah disetujui, seluruh RPP ini akan berstatus <strong className="text-emerald-600">Disetujui</strong> dan siap digunakan untuk KBM.
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => onApproveAllOpenChange(false)}
                className="rounded-xl border-slate-200"
              >
                Batal
              </Button>
              <Button
                onClick={onVerifyAll}
                disabled={isApprovingAll}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isApprovingAll && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Ya, Setujui Semua ({eligibleCount})
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Approve Seluruh Plan */}
      <Dialog open={isApproveOpen} onOpenChange={onApproveOpenChange}>
        <DialogContent className="sm:max-w-md p-6 rounded-[24px] border-none shadow-xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 text-xl font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Setujui RPP (Semua Pertemuan)
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-gray-700 text-sm leading-relaxed">
            Apakah Anda yakin ingin menyetujui seluruh pertemuan RPP <span className="font-bold">{selectedPlan?.judul_rpp}</span>? Setelah disetujui, RPP ini dapat digunakan untuk pengisian jurnal mengajar dan absensi siswa.
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => onApproveOpenChange(false)}
              className="rounded-xl border-slate-200"
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
              Setujui RPP
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Revisi Seluruh Plan */}
      <Dialog open={isRevisiOpen} onOpenChange={onRevisiOpenChange}>
        <DialogContent className="sm:max-w-md p-6 rounded-[24px] border-none shadow-xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-xl font-semibold">
              <XCircle className="w-5 h-5" />
              Tolak & Minta Perbaikan RPP
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4 text-gray-700 text-sm">
            <p className="leading-relaxed">
              RPP <span className="font-bold">{selectedPlan?.judul_rpp}</span> akan dikembalikan kepada guru untuk diperbaiki. Mohon tuliskan catatan atau masukan yang jelas agar guru dapat merevisi dengan tepat.
            </p>
            <div className="space-y-2">
              <Label className="font-medium text-slate-600">Catatan Masukan / Perbaikan *</Label>
              <Textarea
                placeholder="cth: Mohon detailkan bagian deskripsi pada pertemuan ke-5..."
                value={revisiNote}
                onChange={(e) => setRevisiNote(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => onRevisiOpenChange(false)}
              className="rounded-xl border-slate-200"
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

      {/* MODAL APPROVE PERTEMUAN TERTENTU (PER-MEETING) */}
      {onDetailApproveOpenChange && onVerifyDetail && (
        <Dialog open={isDetailApproveOpen} onOpenChange={onDetailApproveOpenChange}>
          <DialogContent className="sm:max-w-md p-6 rounded-[24px] border-none shadow-xl bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-600 text-xl font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                Setujui Pertemuan Ke-{selectedDetailForVerify?.detail?.pertemuan_ke}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 text-gray-700 text-sm leading-relaxed space-y-2">
              <p>
                Apakah Anda yakin ingin menyetujui <span className="font-bold text-slate-800">Pertemuan Ke-{selectedDetailForVerify?.detail?.pertemuan_ke}</span> pada RPP <span className="font-semibold text-indigo-700">{selectedDetailForVerify?.plan?.judul_rpp}</span>?
              </p>
              {selectedDetailForVerify?.detail?.materi && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                  <span className="font-semibold text-slate-500 block">Materi:</span>
                  <span className="font-medium text-slate-800">{selectedDetailForVerify.detail.materi}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => onDetailApproveOpenChange(false)}
                className="rounded-xl border-slate-200"
              >
                Batal
              </Button>
              <Button
                onClick={() => onVerifyDetail("Disetujui")}
                disabled={isDetailPending}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isDetailPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Setujui Pertemuan Ini
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL REVISI PERTEMUAN TERTENTU (PER-MEETING) */}
      {onDetailRevisiOpenChange && onVerifyDetail && setDetailRevisiNote && (
        <Dialog open={isDetailRevisiOpen} onOpenChange={onDetailRevisiOpenChange}>
          <DialogContent className="sm:max-w-md p-6 rounded-[24px] border-none shadow-xl bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600 text-xl font-semibold">
                <XCircle className="w-5 h-5" />
                Minta Revisi Pertemuan Ke-{selectedDetailForVerify?.detail?.pertemuan_ke}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-4 text-gray-700 text-sm">
              <p className="leading-relaxed">
                <span className="font-bold text-slate-800">Pertemuan Ke-{selectedDetailForVerify?.detail?.pertemuan_ke}</span> pada RPP <span className="font-semibold text-indigo-700">{selectedDetailForVerify?.plan?.judul_rpp}</span> akan dikembalikan kepada guru untuk diperbaiki.
              </p>
              <div className="space-y-2">
                <Label className="font-medium text-slate-600">Catatan Masukan / Perbaikan Pertemuan *</Label>
                <Textarea
                  placeholder="cth: Materi pada pertemuan ini perlu dilengkapi referensi buku pegangan..."
                  value={detailRevisiNote}
                  onChange={(e) => setDetailRevisiNote(e.target.value)}
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => onDetailRevisiOpenChange(false)}
                className="rounded-xl border-slate-200"
              >
                Batal
              </Button>
              <Button
                onClick={() => onVerifyDetail("Revisi")}
                disabled={isDetailPending || !detailRevisiNote.trim()}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isDetailPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Tolak & Minta Revisi
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
