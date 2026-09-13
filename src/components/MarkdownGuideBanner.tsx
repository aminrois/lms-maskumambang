import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Heading, Type, ListOrdered, Table, Code2, HelpCircle } from "lucide-react";

export const MarkdownGuideBanner: React.FC = () => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="bg-linear-to-r from-indigo-50/90 via-blue-50/40 to-slate-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 text-xs text-indigo-950 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 font-bold text-indigo-900 text-sm">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-2xs shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="block font-bold">Panduan Format Penulisan Markdown</span>
            <span className="text-[11px] font-normal text-indigo-700">Gunakan sintaks di bawah ini untuk merapikan dokumen (sekarang menggunakan mode source)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-xl bg-white/90 border border-indigo-200/80 hover:bg-white transition-all shadow-2xs cursor-pointer"
        >
          <span>{isGuideOpen ? "Sembunyikan Panduan" : "Pelajari Panduan Markdown"}</span>
          {isGuideOpen ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-indigo-600" />}
        </button>
      </div>

      {isGuideOpen && (
        <div className="pt-3 border-t border-indigo-100/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 animate-in fade-in duration-300">
          <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-100 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-indigo-950 border-b border-indigo-50 pb-1.5">
              <Heading className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>1. Judul & Sub-Bab (Headings)</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="text-slate-500 font-medium block"># Judul Utama (H1) s.d ## Bab (H2)</span>
                <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block"># H1 Utama | ## H2 Sub-Bab</code>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">### Sub-Bab (H3) s.d #### (H4)</span>
                <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block">### H3 Poin A | #### H4 Sub-Poin</code>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">##### (H5) s.d ###### (H6)</span>
                <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block">##### H5 Detail | ###### H6 Sub-Detail</code>
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-100 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-indigo-950 border-b border-indigo-50 pb-1.5">
              <Type className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>2. Format Teks & Penekanan</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="text-slate-500 font-medium block">Teks Tebal (Bold) & Miring (Italic)</span>
                <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block">**Teks Tebal** | *Teks Miring*</code>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Teks Garis Bawah (Underline)</span>
                <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block">{"<u>Teks Garis Bawah</u>"}</code>
              </div>
              <div>
                <span className="text-slate-500 font-medium block font-sans">Kode / Istilah Highlight</span>
                <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block">`Variabel` atau `Kata Kunci`</code>
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-100 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-indigo-950 border-b border-indigo-50 pb-1.5">
              <ListOrdered className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>3. List Bullet & Berurutan</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="text-slate-500 font-medium block">Daftar Poin (Bullet List)</span>
                <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block">- Poin Kegiatan Pembelajaran</code>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Daftar Berurutan (Numbered List)</span>
                <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block">1. Langkah Pertama Pembelajaran</code>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Sub-Daftar Bertingkat</span>
                <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block">{"   - Sub Poin (Indentasi 3 spasi)"}</code>
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-100 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-indigo-950 border-b border-indigo-50 pb-1.5">
              <Table className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>4. Tabel Data (Markdown Table)</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <span className="text-slate-500 font-medium block">Format Struktur Tabel:</span>
              <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block">| No | Kegiatan | Waktu |</code>
              <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block">|---|---|---|</code>
              <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block">| 1 | Pendahuluan | 15 Menit |</code>
            </div>
          </div>

          <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-100 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-indigo-950 border-b border-indigo-50 pb-1.5">
              <Code2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>5. Variabel Otomatis RPP</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="text-slate-500 font-medium block">Nomor Pertemuan</span>
                <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block">{"{pertemuan_ke}"}</code>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Nama Materi Pembelajaran</span>
                <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block">{"{materi}"}</code>
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-100 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-indigo-950 border-b border-indigo-50 pb-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>6. Catatan Highlight & Pemisah</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="text-slate-500 font-medium block">Garis Pemisah Horisontal</span>
                <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block">---</code>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Kutipan / Highlight Catatan</span>
                <code className="font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded block font-medium">&gt; Catatan: Pembelajaran di Lab.</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
