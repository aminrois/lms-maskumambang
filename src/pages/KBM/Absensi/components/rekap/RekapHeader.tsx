import { Clipboard } from "lucide-react";

interface RekapHeaderProps {
  isGuru: boolean;
}

export function RekapHeader({ isGuru }: RekapHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#F4F7FE] p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
          <Clipboard className="w-6 h-6 text-[#243B7A]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674] uppercase">Rekap Absensi Siswa</h1>
          <p className="text-[#A3AED0] text-sm mt-1">
            {isGuru
              ? "Pantau kehadiran siswa pada kelas yang Anda ajar."
              : "Pantau agregasi kehadiran siswa berdasarkan lembaga, kelas, dan mata pelajaran."}
          </p>
        </div>
      </div>
    </div>
  );
}
