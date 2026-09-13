import React, { useState, useEffect } from "react";
import {
  usePublisher,
  useCellValue,
  linkDialogState$,
  updateLink$,
  cancelLinkEdit$,
  switchFromPreviewToLinkEdit$,
  removeLink$,
} from "@mdxeditor/editor";
import { Link2, X, ExternalLink, Trash2, Edit3 } from "lucide-react";

/**
 * Custom Link Dialog untuk MDXEditor.
 * Menggunakan modal centered (fixed position) alih-alih popover anchored,
 * sehingga tidak terpotong oleh sidebar atau container overflow-hidden.
 */
export const CustomLinkDialog: React.FC = () => {
  const dialogState = useCellValue(linkDialogState$);
  const updateLink = usePublisher(updateLink$);
  const cancelLinkEdit = usePublisher(cancelLinkEdit$);
  const switchToEdit = usePublisher(switchFromPreviewToLinkEdit$);
  const removeLink = usePublisher(removeLink$);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (dialogState.type === "edit") {
      setUrl(dialogState.url || "");
      setTitle(dialogState.title || "");
    }
  }, [dialogState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateLink({ url, title, text: undefined });
  };

  const handleCancel = () => {
    cancelLinkEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (dialogState.type === "inactive") {
    return null;
  }

  if (dialogState.type === "preview") {
    return (
      <>
        <div
          className="fixed inset-0 z-[99998] bg-black/10 backdrop-blur-[1px]"
          onClick={handleCancel}
        />
        <div className="fixed z-[99999] inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div
            className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-indigo-100 w-full max-w-sm overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                  <Link2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-bold text-sm text-indigo-900 block leading-none">Tautan</span>
                  {dialogState.title && (
                    <span className="text-[11px] text-indigo-600 font-medium">{dialogState.title}</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="w-7 h-7 rounded-lg hover:bg-indigo-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">URL Tautan</p>
              <a
                href={dialogState.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium break-all group"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{dialogState.url}</span>
              </a>
            </div>

            <div className="px-5 pb-4 flex items-center gap-2 justify-between">
              <button
                onClick={() => removeLink()}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Tautan
              </button>
              <button
                onClick={() => switchToEdit()}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg transition-all shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Tautan
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[99998] bg-black/20 backdrop-blur-[2px]"
        onClick={handleCancel}
      />
      <div className="fixed z-[99999] inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-indigo-100 w-full max-w-sm overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                <Link2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm text-indigo-900 block">Sisipkan Tautan</span>
                <span className="text-[11px] text-indigo-500">Masukkan URL dan judul tautan</span>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="w-7 h-7 rounded-lg hover:bg-indigo-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                URL / Alamat Tautan
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://contoh.com"
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder-slate-400 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Judul Tautan <span className="text-slate-400 font-normal normal-case">(opsional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul tampilan tautan"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!url.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Link2 className="w-4 h-4" />
                Simpan Tautan
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
