import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, XCircle, RotateCcw, AlertTriangle, KeyRound } from "lucide-react";

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

  // Reset Verification Modal (Direktur / Super Admin)
  isResetVerifikasiOpen?: boolean;
  onResetVerifikasiOpenChange?: (open: boolean) => void;
  isResettingVerifikasi?: boolean;
  onResetVerifikasi?: (target: 'kepsek' | 'direktur' | 'both', pin: string) => Promise<void>;

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

  // Reset Verifikasi props
  isResetVerifikasiOpen = false,
  onResetVerifikasiOpenChange,
  isResettingVerifikasi = false,
  onResetVerifikasi,

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
  const [resetTarget, setResetTarget] = useState<'kepsek' | 'direktur' | 'both'>('both');
  const [resetPin, setResetPin] = useState("");
  const [resetPinError, setResetPinError] = useState("");

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPin.trim() !== "1859") {
      setResetPinError("PIN konfirmasi salah! Masukkan PIN 1859.");
      return;
    }
    setResetPinError("");
    if (onResetVerifikasi) {
      try {
        await onResetVerifikasi(resetTarget, resetPin.trim());
        setResetPin("");
      } catch (err: any) {
        setResetPinError(err?.message || "Gagal melakukan reset.");
      }
    }
  };
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

      {/* MODAL RESET VERIFIKASI LESSON PLAN (DIREKTUR / SUPER ADMIN) */}
      {onResetVerifikasiOpenChange && onResetVerifikasi && (
        <Dialog open={isResetVerifikasiOpen} onOpenChange={onResetVerifikasiOpenChange}>
          <DialogContent className="sm:max-w-md p-6 rounded-[24px] border-none shadow-xl bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600 text-xl font-bold">
                <RotateCcw className="w-5 h-5" />
                Reset Verifikasi Lesson Plan
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleExecuteReset} className="space-y-4 pt-2">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Tindakan ini akan mengembalikan status persetujuan Lesson Plan menjadi <strong>Menunggu Verifikasi</strong>.
                </span>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs text-slate-700">Pilih Pihak yang Direset *</Label>
                <div className="grid grid-cols-1 gap-2">
                  <label className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${resetTarget === 'both' ? 'border-rose-500 bg-rose-50 font-bold text-rose-900 ring-1 ring-rose-500' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                    <input
                      type="radio"
                      name="resetTarget"
                      value="both"
                      checked={resetTarget === 'both'}
                      onChange={() => setResetTarget('both')}
                      className="accent-rose-600"
                    />
                    <span>Reset Semua Pihak (Kepala Sekolah & Direktur)</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${resetTarget === 'direktur' ? 'border-rose-500 bg-rose-50 font-bold text-rose-900 ring-1 ring-rose-500' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                    <input
                      type="radio"
                      name="resetTarget"
                      value="direktur"
                      checked={resetTarget === 'direktur'}
                      onChange={() => setResetTarget('direktur')}
                      className="accent-rose-600"
                    />
                    <span>Hanya Reset Verifikasi Direktur</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${resetTarget === 'kepsek' ? 'border-rose-500 bg-rose-50 font-bold text-rose-900 ring-1 ring-rose-500' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                    <input
                      type="radio"
                      name="resetTarget"
                      value="kepsek"
                      checked={resetTarget === 'kepsek'}
                      onChange={() => setResetTarget('kepsek')}
                      className="accent-rose-600"
                    />
                    <span>Hanya Reset Verifikasi Kepala Sekolah</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <Label className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  PIN Konfirmasi Keamanan (1859) *
                </Label>
                <Input
                  type="password"
                  placeholder="Masukkan PIN 1859"
                  value={resetPin}
                  onChange={(e) => { setResetPin(e.target.value); setResetPinError(""); }}
                  className="rounded-xl border-slate-200 text-center font-mono font-bold tracking-widest text-lg h-11"
                  maxLength={6}
                />
                {resetPinError && (
                  <p className="text-xs text-rose-600 font-semibold">{resetPinError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onResetVerifikasiOpenChange(false);
                    setResetPin("");
                    setResetPinError("");
                  }}
                  className="rounded-xl border-slate-200"
                  disabled={isResettingVerifikasi}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isResettingVerifikasi || !resetPin}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {isResettingVerifikasi && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Eksekusi Reset Verifikasi
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
