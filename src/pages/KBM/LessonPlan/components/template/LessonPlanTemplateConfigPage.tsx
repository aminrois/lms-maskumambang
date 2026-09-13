import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, FileCode, Save, RotateCcw, AlertTriangle
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { MDXEditorWrapper } from "@/components/MDXEditorWrapper";
import { ApplyTemplateModal } from "./ApplyTemplateModal";
import { MarkdownGuideBanner } from "@/components/MarkdownGuideBanner";
import { batchUpdateEmptyLessonPlanDetails } from "@/lib/api/services/kbmService";
import { toast } from "sonner";

export const DEFAULT_RPP_TEMPLATE = `## **A. CAPAI PEMBELAJARAN**

* «Capaian Pembelajaran»

## **B. TUJUAN  PEMBELAJARAN**

* «Tujuan Pembelajaran»

## **C. PEMAHAMAN BERMAKNA**

* «Pemahaman Bermakna»

## **D. KEGIATAN  PEMBELAJARAN**

| Stage of Learning               | Learning Activities                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pendahuluan                     | Peserta didik bersama guru berdoa sebelum belajar. Peserta didik bersama guru berkomunikasi tentang kehadiran. Guru melakukan Brainstorming bersama peserta didik beberapa kasus dalam kehidupan sehari-hari yang ada kaitannya dengan materi pembelajaran, Guru menyampaikan preview (termasuk tujuan pembelajaran) pertemuan hari ini. Guru menyampaikan Pertanyaan Pemantik ( Guiding Question ):  «Pertanyaan Pemantik Guiding Question» |
| Learning Cycle 1: Exploring     | «Exploring»                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Learning Cycle 2: Planning      | «Planning»                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Learning Cycle 3: Doing         | «Doing»                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Learning Cycle 4: Communicating | «Communicating»                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Learning Cycle 5: Reflecting    | «Reflecting»                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Penutup                         | Peserta didik bersama guru bertanya jawab tentang materi yang dipelajari. Peserta didik membuat rangkuman/simpulan hasil belajar. Peserta didik menjawab Pertanyaan Pemantik ( Guiding Question ). Guru menyampaikan Pemahaman Bermakna. Guru menyampaikan preview pertemuan selanjutnya. Peserta didik bersama guru berdoa sesudah belajar.                                                                                               |

## **E. PENILAIAN**

* 1. **Penilaian Sikap:** «Penilaian Sikap»
* 1. **Penilaian Pengetahuan:** «Penilaian Pengetahuan»
* 1. **Penilaian Keterampilan:** «Penilaian Keterampilan»
* 1. **LKPD**

## **F. MEDIA PEMBELAJARAN**

* «Media Pembelajaran»`;

export const RPP_TEMPLATE_STORAGE_KEY = "rpp_default_template";

interface LessonPlanTemplateConfigPageProps {
  onBack: () => void;
}

const getStoredTemplate = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(RPP_TEMPLATE_STORAGE_KEY) || DEFAULT_RPP_TEMPLATE;
  }
  return DEFAULT_RPP_TEMPLATE;
};

export const LessonPlanTemplateConfigPage: React.FC<LessonPlanTemplateConfigPageProps> = ({ onBack }) => {
  const [templateMarkdown, setTemplateMarkdown] = useState<string>(getStoredTemplate);
  const [initialMarkdown, setInitialMarkdown] = useState<string>(getStoredTemplate);
  const [editorKey, setEditorKey] = useState<number>(0);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState<boolean>(false);
  const [isSourceMode, setIsSourceMode] = useState<boolean>(false);

  const handleMarkdownChange = (val: string) => {
    setTemplateMarkdown(val);
    setIsDirty(val !== initialMarkdown);
  };

  // Langkah 1: Simpan ke localStorage → buka modal pemilihan kelas
  const handleSaveClick = () => {
    localStorage.setItem(RPP_TEMPLATE_STORAGE_KEY, templateMarkdown);
    setShowApplyModal(true);
  };

  // Langkah 2: Dipanggil modal setelah user memilih kelas → batch update ke DB
  const handleConfirmApply = async (selectedLessonPlanIds: number[]) => {
    setIsSaving(true);
    const toastId = toast.loading("Menerapkan template ke pertemuan yang belum diisi...");
    try {
      await batchUpdateEmptyLessonPlanDetails(templateMarkdown, selectedLessonPlanIds);
      setInitialMarkdown(templateMarkdown);
      setIsDirty(false);
      setShowApplyModal(false);
      toast.success("Template berhasil diterapkan ke pertemuan yang dipilih!", { id: toastId });
    } catch (error) {
      console.error("Gagal menerapkan template RPP:", error);
      toast.error("Gagal menerapkan template. Silakan coba lagi.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };  // end handleConfirmApply

  const handleReset = () => {
    setTemplateMarkdown(DEFAULT_RPP_TEMPLATE);
    setEditorKey((prev) => prev + 1);
    setIsDirty(DEFAULT_RPP_TEMPLATE !== initialMarkdown);
    toast.info("Template telah dikembalikan ke format standar. Klik 'Simpan Template' untuk menerapkan.");
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowConfirmCancel(true);
    } else {
      onBack();
    }
  };

  const confirmCancel = () => {
    setShowConfirmCancel(false);
    setIsDirty(false);
    onBack();
  };



  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={handleCancelClick}
            className="p-0 h-auto hover:bg-transparent text-indigo-600 hover:text-indigo-700 font-semibold text-xs flex items-center gap-1.5 mb-1"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar RPP
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileCode className="w-6 h-6 text-indigo-600" />
            Pengaturan Template Default RPP
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Atur struktur awal dokumen RPP (Isi) yang otomatis diterapkan saat pengisian pertemuan baru.
          </p>
        </div>

      </div>

      {/* PANDUAN PENULISAN MARKDOWN BANNER */}
      <MarkdownGuideBanner />

      {/* 1-CARD EDITOR DENGAN TOGGLE MODE */}
      <Card className="rounded-2xl border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Editor Template (Markdown)</h3>
          </div>
          
          {/* TOGGLE MODE */}
          <div className="flex bg-slate-200/70 p-1 rounded-lg">
            <button
              onClick={() => setIsSourceMode(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                !isSourceMode ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Rich Text
            </button>
            <button
              onClick={() => setIsSourceMode(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                isSourceMode ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Source Mode
            </button>
          </div>
        </div>
        <CardContent className="p-4 flex-1">
          {isSourceMode ? (
            <Textarea
              key={editorKey}
              value={templateMarkdown}
              onChange={(e) => handleMarkdownChange(e.target.value)}
              placeholder="Tulis template RPP dalam format Markdown di sini..."
              className="min-h-100 font-mono text-sm leading-relaxed p-4 bg-slate-50 focus-visible:ring-1 focus-visible:ring-indigo-500 border border-slate-200 rounded-xl resize-y"
            />
          ) : (
            <MDXEditorWrapper
              key={editorKey}
              markdown={templateMarkdown}
              onChange={handleMarkdownChange}
              placeholder="Tulis template RPP dalam format Markdown di sini..."
            />
          )}
        </CardContent>
      </Card>

      {/* FOOTER ACTION BAR */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <Button
          variant="ghost"
          onClick={handleReset}
          className="text-slate-500 hover:text-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-100 rounded-xl px-3"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset ke Template Standar
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleCancelClick}
            className="rounded-xl text-xs font-semibold px-5 border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            Batal
          </Button>
          <Button
            onClick={handleSaveClick}
            disabled={isSaving}
            className={`rounded-xl text-xs font-bold px-6 flex items-center gap-2 shadow-xs transition-all ${
              !isSaving
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Menerapkan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Terapkan Template
              </>
            )}
          </Button>
        </div>
      </div>

      {/* MODAL PEMILIHAN KELAS */}
      <ApplyTemplateModal
        open={showApplyModal}
        onOpenChange={setShowApplyModal}
        onConfirm={handleConfirmApply}
        isSaving={isSaving}
      />

      {/* MODAL KONFIRMASI BATAL JIKA IS_DIRTY */}
      <Dialog open={showConfirmCancel} onOpenChange={setShowConfirmCancel}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-800">
              Batalkan Perubahan Template?
            </DialogTitle>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anda memiliki perubahan template RPP yang belum disimpan. Perubahan tersebut akan hilang jika Anda membatalkannya.
            </p>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmCancel(false)}
              className="rounded-xl text-xs font-semibold border-slate-200 text-slate-700"
            >
              Lanjutkan Edit
            </Button>
            <Button
              onClick={confirmCancel}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
            >
              Ya, Batalkan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
