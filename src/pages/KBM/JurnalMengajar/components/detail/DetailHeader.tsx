import { ArrowLeft, BookOpen, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface DetailHeaderProps {
  mapelName: string;
  className: string;
  guruName: string;
  tanggal: string;
  onBack: () => void;
}

export function DetailHeader({
  mapelName,
  className,
  guruName,
  tanggal,
  onBack
}: DetailHeaderProps) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-150 px-3 py-1.5 rounded-xl shadow-xs"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Kembali ke Daftar Jurnal
      </button>

      <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex gap-5">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-100 to-blue-50 text-blue-700 flex items-center justify-center shadow-inner border border-blue-100/50 shrink-0">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 uppercase leading-none">{mapelName}</h1>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                  Kelas {className}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 font-semibold">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-slate-700">{guruName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{tanggal ? format(new Date(tanggal), 'dd MMMM yyyy', { locale: idLocale }) : "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
