import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FileText, Calendar, Clock, School, Layers, CheckCircle, Loader2, AlertTriangle, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { MDXEditorWrapper } from "@/components/MDXEditorWrapper";
import { MarkdownGuideBanner } from "@/components/MarkdownGuideBanner";
import type { LESSON_PLAN_DETAIL } from "@/types/database";

interface LessonPlanPertemuanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pertemuan: LESSON_PLAN_DETAIL | null;
  rppTitle: string;
  namaLembaga: string;
  namaKelas: string;
  namaMapel: string;
  semester: string;
  alokasiWaktu?: string;
  onSave: (updatedDetail: Partial<LESSON_PLAN_DETAIL>) => Promise<void>;
  isSaving: boolean;
}

export const LessonPlanPertemuanModal: React.FC<LessonPlanPertemuanModalProps> = ({
  open,
  onOpenChange,
  pertemuan,
  rppTitle,
  namaLembaga,
  namaKelas,
  namaMapel,
  semester,
  alokasiWaktu: alokasiWaktuProp,
  onSave,
  isSaving,
}) => {
  const [materi, setMateri] = useState("");
  const [topikMateri, setTopikMateri] = useState("");
  const [rencanaPelaksanaanKbm, setRencanaPelaksanaanKbm] = useState("");
  const [isiMarkdown, setIsiMarkdown] = useState("");
  const [useRichText, setUseRichText] = useState(true);

  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  useEffect(() => {
    if (pertemuan) {
      setMateri(pertemuan.materi || "");
      setTopikMateri(pertemuan.topik_materi || "");
      setRencanaPelaksanaanKbm(pertemuan.rencana_pelaksanaan_kbm || "");
      setIsiMarkdown(pertemuan.isi || `# Pertemuan Ke-${pertemuan.pertemuan_ke}: ${pertemuan.materi || "Materi Pelajaran"}\n\n### A. Tujuan Pembelajaran\n- Siswa mampu memahami...\n\n### B. Langkah-Langkah Kegiatan\n1. Pendahuluan (15 Menit)\n2. Kegiatan Inti (60 Menit)\n3. Penutup (15 Menit)\n\n### C. Asesmen / Penilaian\n- Penilaian Formatif...`);
      setIsDirty(false);
      setShowConfirmCancel(false);
    }
  }, [pertemuan]);

  if (!pertemuan) return null;

  const handleCancelClick = () => {
    if (isDirty) {
      setShowConfirmCancel(true);
    } else {
      onOpenChange(false);
    }
  };

  const confirmCancel = () => {
    setShowConfirmCancel(false);
    setIsDirty(false);
    onOpenChange(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      detail_id: pertemuan.detail_id,
      lesson_plan_id: pertemuan.lesson_plan_id,
      pertemuan_ke: pertemuan.pertemuan_ke,
      materi,
      topik_materi: topikMateri,
      rencana_pelaksanaan_kbm: rencanaPelaksanaanKbm || null,
      isi: isiMarkdown,
    });
    setIsDirty(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => {
        if (!val) {
          handleCancelClick();
        } else {
          onOpenChange(val);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 bg-slate-50/50">
          <DialogHeader className="pb-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-800">
                  Edit Pertemuan Ke-{pertemuan.pertemuan_ke} — {rppTitle}
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Edit metadata dan isi materi RPP pertemuan ke-{pertemuan.pertemuan_ke}
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-6 pt-2">
            <Card className="rounded-2xl border border-slate-200/80 shadow-2xs bg-white overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Informasi Pertemuan
                </h3>
              </div>
              <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-indigo-500" /> Satuan Pendidikan
                  </label>
                  <Input
                    value={namaLembaga}
                    readOnly
                    className="text-slate-700 font-medium h-9 text-xs rounded-xl border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" /> Kelas / Semester
                  </label>
                  <Input
                    value={`${namaKelas} / Semester ${semester}`}
                    readOnly
                    className="text-slate-700 font-medium h-9 text-xs rounded-xl border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Mata Pelajaran
                  </label>
                  <Input
                    value={namaMapel}
                    readOnly
                    className="text-slate-700 font-medium h-9 text-xs rounded-xl border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" /> Materi Pembelajaran <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Contoh: Trigonometri Dasar"
                    value={materi}
                    onChange={(e) => {
                      setMateri(e.target.value);
                      setIsDirty(true);
                    }}
                    className="h-9 text-xs rounded-xl border-slate-200 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" /> Sub-Topik / Pokok Bahasan <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Contoh: Pengenalan Aturan Sinus dan Cosinus"
                    value={topikMateri}
                    onChange={(e) => {
                      setTopikMateri(e.target.value);
                      setIsDirty(true);
                    }}
                    className="h-9 text-xs rounded-xl border-slate-200 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Urutan Pertemuan
                  </label>
                  <Input
                    value={`Pertemuan Ke-${pertemuan.pertemuan_ke}`}
                    readOnly
                    className="text-slate-700 font-bold h-9 text-xs rounded-xl border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Pelaksanaan KBM (Tanggal) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={rencanaPelaksanaanKbm}
                    onChange={(e) => {
                      setRencanaPelaksanaanKbm(e.target.value);
                      setIsDirty(true);
                    }}
                    className="text-slate-700 font-medium h-9 text-xs rounded-xl border-slate-200 focus:border-indigo-500"
                    required
                  />
                </div>
                {/* Alokasi Waktu (Read-only dari Jadwal Pelajaran) */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-semibold text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Alokasi Waktu (Dari Jadwal Pelajaran)
                  </label>
                  <Input
                    value={alokasiWaktuProp || "Sesuai Jadwal Pelajaran"}
                    readOnly
                    className="text-slate-700 font-medium h-9 text-xs rounded-xl border-slate-200 focus:outline-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200/80 shadow-2xs bg-white overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Dokumen Konten Pembelajaran Pertemuan
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setUseRichText(!useRichText)}
                    className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors"
                  >
                    Ganti ke Mode {useRichText ? "Source (Markdown)" : "Rich Text"}
                  </button>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    {useRichText ? "Rich Text Mode" : "Markdown Source Mode"}
                  </span>
                </div>
              </div>
              <CardContent className="p-5 space-y-2">
                <p className="text-xs text-slate-500 mb-2">
                  Gunakan editor di bawah ini untuk mengedit rencana kegiatan pembelajaran, tujuan, langkah-langkah KBM, dan penilaian.
                </p>
                {!useRichText && (
                  <div className="pb-1">
                    <MarkdownGuideBanner />
                  </div>
                )}

                {useRichText ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden min-h-75">
                    <MDXEditorWrapper
                      markdown={isiMarkdown}
                      onChange={(val) => {
                        setIsiMarkdown(val);
                        setIsDirty(true);
                      }}
                      placeholder="Tulis konten RPP di sini..."
                    />
                  </div>
                ) : (
                  <Textarea
                    value={isiMarkdown}
                    onChange={(e) => {
                      setIsiMarkdown(e.target.value);
                      setIsDirty(true);
                    }}
                    className="min-h-100 font-mono text-sm leading-relaxed p-4 bg-slate-50 focus-visible:ring-1 focus-visible:ring-indigo-500 border border-slate-200 rounded-xl resize-y"
                    placeholder="Tulis konten RPP dalam format Markdown di sini..."
                  />
                )}
              </CardContent>
            </Card>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelClick}
                className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm px-5"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" /> Simpan Pertemuan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmCancel} onOpenChange={setShowConfirmCancel}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-800">
                  Batalkan Perubahan Pertemuan?
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Perubahan yang telah Anda buat pada pertemuan ke-{pertemuan.pertemuan_ke} ini belum disimpan dan akan hilang jika Anda membatalkannya.
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="pt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmCancel(false)}
              className="rounded-xl border-slate-200 text-slate-700 font-medium text-xs"
            >
              Lanjutkan Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmCancel}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-sm px-4"
            >
              Ya, Batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
