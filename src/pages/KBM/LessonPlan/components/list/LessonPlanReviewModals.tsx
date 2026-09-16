import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, XCircle, RotateCcw, AlertTriangle, KeyRound, Search, Filter } from "lucide-react";
import { getLembagas, getKelas, getPegawais } from "@/lib/api/services/masterService";

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
  onResetVerifikasi?: (payload: {
    target: 'kepsek' | 'direktur' | 'both';
    pin: string;
    lembaga_id?: number | null;
    kelas_id?: number | null;
    pegawai_id?: number | null;
  }) => Promise<void>;

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
  const [resetLembagaId, setResetLembagaId] = useState<string>("");
  const [resetKelasId, setResetKelasId] = useState<string>("");
  const [resetPegawaiId, setResetPegawaiId] = useState<string>("");
  const [searchGuru, setSearchGuru] = useState<string>("");
  const [resetPin, setResetPin] = useState("");
  const [resetPinError, setResetPinError] = useState("");

  // Query master data untuk filter modal reset verifikasi
  const { data: lembagas = [] } = useQuery({
    queryKey: ["master", "lembagas-reset-modal"],
    queryFn: async () => await getLembagas({ order: "nama_lembaga.asc" }),
    enabled: isResetVerifikasiOpen
  });

  const { data: allKelas = [] } = useQuery({
    queryKey: ["master", "kelas-reset-modal", resetLembagaId],
    queryFn: async () => {
      const params: Record<string, any> = { order: "nama_kelas.asc" };
      if (resetLembagaId) {
        params.lembaga_id = `eq.${resetLembagaId}`;
      }
      return await getKelas(params);
    },
    enabled: isResetVerifikasiOpen
  });

  const { data: allPegawai = [] } = useQuery({
    queryKey: ["master", "pegawai-reset-modal"],
    queryFn: async () => await getPegawais({ order: "nama.asc" }),
    enabled: isResetVerifikasiOpen
  });

  const filteredPegawai = useMemo(() => {
    if (!searchGuru.trim()) return allPegawai;
    const q = searchGuru.toLowerCase();
    return allPegawai.filter((p: any) => p.nama?.toLowerCase().includes(q) || p.nip?.toLowerCase().includes(q));
  }, [allPegawai, searchGuru]);

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPin.trim() !== "1859") {
      setResetPinError("PIN konfirmasi salah! Masukkan PIN 1859.");
      return;
    }
    setResetPinError("");
    if (onResetVerifikasi) {
      try {
        await onResetVerifikasi({
          target: resetTarget,
          pin: resetPin.trim(),
          lembaga_id: resetLembagaId ? Number(resetLembagaId) : null,
          kelas_id: resetKelasId ? Number(resetKelasId) : null,
          pegawai_id: resetPegawaiId ? Number(resetPegawaiId) : null,
        });
        setResetPin("");
        setResetLembagaId("");
        setResetKelasId("");
        setResetPegawaiId("");
        setSearchGuru("");
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
          <DialogContent className="sm:max-w-lg p-6 rounded-[24px] border-none shadow-xl bg-white max-h-[90vh] overflow-y-auto">
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

              {/* 1. Pilih Pihak */}
              <div className="space-y-2">
                <Label className="font-bold text-xs text-slate-700">1. Pilih Pihak yang Direset *</Label>
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

              {/* 2. Filter Sasaran Reset */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <Label className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" />
                  2. Filter Sasaran Reset (Opsional)
                </Label>
                <p className="text-[11px] text-slate-500">
                  Kosongkan filter (Semua) jika ingin mereset seluruh Lesson Plan, atau tentukan filter spesifik:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Lembaga */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Lembaga
                    </label>
                    <select
                      value={resetLembagaId}
                      onChange={(e) => {
                        setResetLembagaId(e.target.value);
                        setResetKelasId("");
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="">Semua Lembaga</option>
                      {lembagas.map((l: any) => (
                        <option key={l.lembaga_id} value={l.lembaga_id}>
                          {l.nama_lembaga}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kelas */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kelas
                    </label>
                    <select
                      value={resetKelasId}
                      onChange={(e) => setResetKelasId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="">Semua Kelas</option>
                      {allKelas.map((k: any) => (
                        <option key={k.kelas_id} value={k.kelas_id}>
                          {k.nama_kelas}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cari & Pilih Guru */}
                <div className="space-y-2 pt-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Guru Pengajar (Cari / Pilih)
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Ketik nama guru untuk memfilter list..."
                      value={searchGuru}
                      onChange={(e) => setSearchGuru(e.target.value)}
                      className="pl-8 bg-white border-slate-200 rounded-xl text-xs h-9"
                    />
                  </div>
                  <select
                    value={resetPegawaiId}
                    onChange={(e) => setResetPegawaiId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="">Semua Guru</option>
                    {filteredPegawai.map((p: any) => (
                      <option key={p.pegawai_id} value={p.pegawai_id}>
                        {p.nama} {p.nip ? `(${p.nip})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. PIN Keamanan */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <Label className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  3. PIN Konfirmasi Keamanan (1859) *
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
                    setResetLembagaId("");
                    setResetKelasId("");
                    setResetPegawaiId("");
                    setSearchGuru("");
                  }}
                  className="rounded-xl border-slate-200"
                  disabled={isResettingVerifikasi}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isResettingVerifikasi || !resetPin}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
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
