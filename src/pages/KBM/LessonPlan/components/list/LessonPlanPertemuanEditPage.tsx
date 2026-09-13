import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  BookOpen, FileText, Calendar, School, Layers, CheckCircle, Loader2,
  AlertTriangle, Pencil, ArrowLeft, Eye, FileCode, Sparkles
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { MDXEditorWrapper } from "@/components/MDXEditorWrapper";
import { MarkdownGuideBanner } from "@/components/MarkdownGuideBanner";
import { PureMarkdownPreview } from "../template/PureMarkdownPreview";
import type { LESSON_PLAN_DETAIL } from "@/types/database";
import { DEFAULT_RPP_TEMPLATE, RPP_TEMPLATE_STORAGE_KEY } from "../template/LessonPlanTemplateConfigPage";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

interface LessonPlanPertemuanEditPageProps {
  pertemuan: LESSON_PLAN_DETAIL;
  rppTitle: string;
  namaLembaga: string;
  namaKelas: string;
  namaMapel: string;
  semester: string;
  alokasiWaktu?: string;
  onBack: () => void;
  onSave: (updatedDetail: Partial<LESSON_PLAN_DETAIL>) => Promise<void>;
  isSaving: boolean;
}

export const LessonPlanPertemuanEditPage: React.FC<LessonPlanPertemuanEditPageProps> = ({
  pertemuan,
  rppTitle,
  namaLembaga,
  namaKelas,
  namaMapel,
  semester,
  onBack,
  onSave,
  isSaving,
}) => {
  const role = useAuthStore((state) => state.role);
  const isDirektur = role === "Direktur";
  const isPureReadOnly = role === "Kepala Sekolah" || role === "WaKa Kurikulum";
  const isMetadataReadOnly = isDirektur || isPureReadOnly;

  const [materi, setMateri] = useState("");
  const [topikMateri, setTopikMateri] = useState("");
  const [rencanaPelaksanaanKbm, setRencanaPelaksanaanKbm] = useState("");
  const [isiMarkdown, setIsiMarkdown] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [useRichText, setUseRichText] = useState(true);

  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  useEffect(() => {
    if (pertemuan) {
      setMateri(pertemuan.materi || "");
      setTopikMateri(pertemuan.topik_materi || "");
      setRencanaPelaksanaanKbm(pertemuan.rencana_pelaksanaan_kbm || "");

      const savedTemplate = localStorage.getItem(RPP_TEMPLATE_STORAGE_KEY) || DEFAULT_RPP_TEMPLATE;
      const defaultFormatted = savedTemplate
        .replace(/\{pertemuan_ke\}/g, String(pertemuan.pertemuan_ke))
        .replace(/\{materi\}/g, pertemuan.materi || "Materi Pelajaran");

      setIsiMarkdown(pertemuan.isi || defaultFormatted);
      setEditorKey(prev => prev + 1);
      setIsDirty(false);
      setShowConfirmCancel(false);
    }
  }, [pertemuan]);

  const handleCancelClick = () => {
    if (isDirty && !isPureReadOnly) {
      setShowConfirmCancel(true);
    } else {
      onBack();
    }
  };

  const handleApplyTemplate = () => {
    const savedTemplate = localStorage.getItem(RPP_TEMPLATE_STORAGE_KEY) || DEFAULT_RPP_TEMPLATE;
    const formatted = savedTemplate
      .replace(/\{pertemuan_ke\}/g, String(pertemuan.pertemuan_ke))
      .replace(/\{materi\}/g, materi || "Materi Pelajaran");
    
    setIsiMarkdown(formatted);
    setEditorKey(prev => prev + 1);
    setIsDirty(true);
    toast.success("Template RPP berhasil diterapkan!");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPureReadOnly) return;
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-300 font-sans">
      {/* HEADER NAVIGASI PAGE EDIT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelClick}
            className="rounded-xl border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold h-10 px-3 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali
          </Button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm shrink-0 ${isPureReadOnly
              ? "bg-slate-700 text-white"
              : isDirektur
                ? "bg-indigo-700 text-white"
                : "bg-indigo-600 text-white"
            }`}>
              {isPureReadOnly ? (
                <Eye className="w-5 h-5" />
              ) : isDirektur ? (
                <FileCode className="w-5 h-5" />
              ) : (
                <Pencil className="w-5 h-5" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                {isPureReadOnly
                  ? `Detail Pertemuan Ke-${pertemuan.pertemuan_ke} — ${rppTitle}`
                  : isDirektur
                    ? `Pertemuan Ke-${pertemuan.pertemuan_ke} (Edit Isi via Template) — ${rppTitle}`
                    : `Edit Pertemuan Ke-${pertemuan.pertemuan_ke} — ${rppTitle}`}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPureReadOnly
                  ? `Tampilan rincian dokumen RPP pertemuan ke-${pertemuan.pertemuan_ke} (Mode View Only)`
                  : isDirektur
                    ? `Mode khusus Direktur: Metadata terunci, Anda dapat mengedit isi dokumen materi RPP`
                    : `Edit metadata dan dokumen materi RPP pertemuan ke-${pertemuan.pertemuan_ke}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelClick}
            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 font-medium px-4 h-9"
            disabled={isSaving}
          >
            {isPureReadOnly ? "Kembali" : "Batal"}
          </Button>
          {!isPureReadOnly && (
            <Button
              type="button"
              onClick={handleFormSubmit}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm px-5 h-9 cursor-pointer"
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
          )}
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* CARD 1 (METADATA PERTEMUAN) */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-2xs bg-white overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Informasi Pertemuan {isMetadataReadOnly && "(Terkunci / View Only)"}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              Pertemuan Ke-{pertemuan.pertemuan_ke}
            </span>
          </div>

          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Satuan Pendidikan (Read-only) */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600 text-xs flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-indigo-500" /> Satuan Pendidikan
              </label>
              <Input
                value={namaLembaga}
                readOnly
                className="text-slate-700 font-medium h-9 text-xs rounded-xl border-slate-200 focus:outline-none bg-slate-50"
              />
            </div>

            {/* Fase / Kelas / Semester (Read-only) */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600 text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" /> Kelas / Semester
              </label>
              <Input
                value={`${namaKelas} / Semester ${semester}`}
                readOnly
                className="text-slate-700 font-medium h-9 text-xs rounded-xl border-slate-200 focus:outline-none bg-slate-50"
              />
            </div>

            {/* Mata Pelajaran (Read-only) */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600 text-xs flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Mata Pelajaran
              </label>
              <Input
                value={namaMapel}
                readOnly
                className="text-slate-700 font-medium h-9 text-xs rounded-xl border-slate-200 focus:outline-none bg-slate-50"
              />
            </div>

            {/* Materi Pembelajaran */}
            <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
              <label className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> Materi Pembelajaran {!isMetadataReadOnly && <span className="text-red-500">*</span>}
              </label>
              <Input
                placeholder="Contoh: Trigonometri Dasar"
                value={materi}
                onChange={(e) => {
                  if (isMetadataReadOnly) return;
                  setMateri(e.target.value);
                  setIsDirty(true);
                }}
                readOnly={isMetadataReadOnly}
                className={`h-9 text-xs rounded-xl border-slate-200 font-medium ${isMetadataReadOnly ? "bg-slate-50 text-slate-700 cursor-not-allowed" : "focus:border-indigo-500"}`}
                required={!isMetadataReadOnly}
              />
            </div>

            {/* Sub-Topik / Pokok Bahasan */}
            <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
              <label className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> Sub-Topik / Pokok Bahasan {!isMetadataReadOnly && <span className="text-red-500">*</span>}
              </label>
              <Input
                placeholder="Contoh: Pengenalan Aturan Sinus dan Cosinus"
                value={topikMateri}
                onChange={(e) => {
                  if (isMetadataReadOnly) return;
                  setTopikMateri(e.target.value);
                  setIsDirty(true);
                }}
                readOnly={isMetadataReadOnly}
                className={`h-9 text-xs rounded-xl border-slate-200 font-medium ${isMetadataReadOnly ? "bg-slate-50 text-slate-700 cursor-not-allowed" : "focus:border-indigo-500"}`}
                required={!isMetadataReadOnly}
              />
            </div>

            {/* Pelaksanaan KBM (Hari) */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Pelaksanaan KBM {!isMetadataReadOnly && <span className="text-red-500">*</span>}
              </label>
              <Input
                type="date"
                value={rencanaPelaksanaanKbm}
                onChange={(e) => {
                  if (isMetadataReadOnly) return;
                  setRencanaPelaksanaanKbm(e.target.value);
                  setIsDirty(true);
                }}
                readOnly={isMetadataReadOnly}
                className={`h-9 text-xs rounded-xl border-slate-200 font-medium ${isMetadataReadOnly ? "bg-slate-50 text-slate-700 cursor-not-allowed" : "focus:border-indigo-500"}`}
              />
            </div>
          </CardContent>
        </Card>

        {/* CARD 2 (DOKUMEN KONTEN UTAMA RPP) */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-2xs bg-white overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Dokumen Konten Pembelajaran Pertemuan
              </h3>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {(isDirektur || !isPureReadOnly) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyTemplate}
                  className="h-8 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 flex items-center gap-1.5 cursor-pointer"
                  title="Gunakan struktur Template RPP default"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Isi via Template RPP</span>
                </Button>
              )}
              {!isPureReadOnly && (
                <>
                  <button
                    type="button"
                    onClick={() => setUseRichText(!useRichText)}
                    className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                  >
                    Ganti ke Mode {useRichText ? "Source (Markdown)" : "Rich Text"}
                  </button>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    {useRichText ? "Rich Text Mode" : "Markdown Source Mode"}
                  </span>
                </>
              )}
            </div>
          </div>
          <CardContent className="p-6 space-y-3">
            {isPureReadOnly ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Berikut adalah dokumen rencana pembelajaran RPP pertemuan ke-{pertemuan.pertemuan_ke} yang telah disusun:
                </p>
                <PureMarkdownPreview content={isiMarkdown} />
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  Gunakan editor di bawah ini untuk menyusun dan mengedit rencana kegiatan pembelajaran, tujuan, langkah-langkah KBM, dan penilaian pertemuan ke-{pertemuan.pertemuan_ke}.
                </p>
                {!useRichText && (
                  <div className="pb-1">
                    <MarkdownGuideBanner />
                  </div>
                )}

                {useRichText ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden min-h-75">
                    <MDXEditorWrapper
                      key={editorKey}
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
                    key={editorKey}
                    value={isiMarkdown}
                    onChange={(e) => {
                      setIsiMarkdown(e.target.value);
                      setIsDirty(true);
                    }}
                    className="min-h-100 font-mono text-sm leading-relaxed p-4 bg-slate-50 focus-visible:ring-1 focus-visible:ring-indigo-500 border border-slate-200 rounded-xl resize-y"
                    placeholder="Tulis konten RPP dalam format Markdown di sini..."
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* FOOTER ACTION BUTTONS */}
        {!isPureReadOnly && (
          <div className="pt-2 flex items-center justify-end gap-3 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelClick}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 font-medium px-6 h-10"
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm px-6 h-10 cursor-pointer"
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
          </div>
        )}
      </form>

      {/* MODAL INTERVENSI KONFIRMASI BATAL */}
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
              className="rounded-xl border-slate-200 text-slate-600 font-medium text-xs h-9"
            >
              Kembali Edit
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowConfirmCancel(false);
                setIsDirty(false);
                onBack();
              }}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9"
            >
              Ya, Batalkan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
