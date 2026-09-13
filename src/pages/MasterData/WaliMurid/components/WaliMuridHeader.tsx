import { useRef } from "react";
import { Users, Plus, Trash2, Download, Upload, FileSpreadsheet, Loader2 } from "lucide-react";

interface WaliMuridHeaderProps {
  dataCount: number;
  canCreate: boolean;
  canDelete?: boolean;
  isBulkMode?: boolean;
  onToggleBulkMode?: () => void;
  onOpenAddModal: () => void;
  isImporting?: boolean;
  onTemplateInfo?: () => void;
  onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport?: () => void;
}

export default function WaliMuridHeader({ 
  dataCount, 
  canCreate, 
  canDelete = false,
  isBulkMode = false,
  onToggleBulkMode,
  onOpenAddModal,
  isImporting = false,
  onTemplateInfo,
  onImport,
  onExport,
}: WaliMuridHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
          <Users className="w-6 h-6 text-[#243B7A]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674] uppercase">DATA WALI MURID</h1>
          <p className="text-[#A3AED0] text-sm mt-1">{dataCount} wali murid terdaftar</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2 w-full sm:w-auto">
        {canCreate && onImport && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImport}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <button
              onClick={onTemplateInfo}
              title="Download Template Impor"
              className="flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors cursor-pointer shrink-0 w-full sm:w-auto"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Template</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              title="Impor Data dari Excel"
              className="flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer shrink-0 w-full sm:w-auto"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Upload className="w-4 h-4 shrink-0" />}
              <span>{isImporting ? 'Mengimpor...' : 'Impor'}</span>
            </button>
          </>
        )}

        {onExport && (
          <button
            onClick={onExport}
            title="Ekspor Data ke Excel"
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border rounded-lg text-sm font-semibold transition-colors cursor-pointer shrink-0 w-full sm:w-auto"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Ekspor</span>
          </button>
        )}

        {canDelete && onToggleBulkMode && (
          <button
            onClick={onToggleBulkMode}
            title="Mode Hapus Banyak Data"
            className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer shrink-0 border w-full sm:w-auto ${
              isBulkMode 
                ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-md" 
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
            }`}
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>{isBulkMode ? "Batal Hapus Banyak" : "Hapus Banyak"}</span>
          </button>
        )}

        {canCreate && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer shrink-0 col-span-2 sm:col-span-1 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Tambah Wali Murid</span>
          </button>
        )}
      </div>
    </div>
  );
}
