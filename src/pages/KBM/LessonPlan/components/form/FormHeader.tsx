import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileSpreadsheet, Loader2 } from "lucide-react";

interface FormHeaderProps {
  id: string | undefined;
  isImporting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onCancelClick: () => void;
  onDownloadTemplate: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FormHeader({
  id,
  isImporting,
  fileInputRef,
  onCancelClick,
  onDownloadTemplate,
  onImport,
}: FormHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
      <div className="flex items-center space-x-3">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={onCancelClick}
          className="rounded-xl border border-slate-150 hover:bg-slate-50"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 uppercase">
            {id ? "Edit Lesson Plan" : "Buat Lesson Plan Baru"}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Silakan lengkapi data Rencana Pelaksanaan Pembelajaran (RPP)</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDownloadTemplate}
          className="rounded-xl h-10 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 text-xs"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" /> Template
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="rounded-xl h-10 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 text-xs"
        >
          {isImporting ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
          )}
          Impor Excel
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImport}
          accept=".xlsx, .xls"
          className="hidden"
        />
      </div>
    </div>
  );
}
