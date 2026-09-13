import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Clock, UploadCloud } from "lucide-react";

interface JadwalHeaderProps {
  canCreate: boolean;
  hasUnuploadedSchedules?: boolean;
  unuploadedCount?: number;
  onUnggahJadwalClick?: () => void;
}

export const JadwalHeader: React.FC<JadwalHeaderProps> = ({
  canCreate,
  hasUnuploadedSchedules,
  unuploadedCount = 0,
  onUnggahJadwalClick,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
          <Clock className="w-6 h-6 text-[#243B7A]" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold text-[#2B3674] tracking-tight uppercase">Jadwal Pelajaran</h1>
          <p className="text-[#A3AED0] text-[13px] font-medium mt-1">Manajemen jadwal untuk lembaga dan kelas</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {hasUnuploadedSchedules && onUnggahJadwalClick && (
          <Button
            onClick={onUnggahJadwalClick}
            className="relative flex items-center bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl h-10 px-4 font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-0.5 transition-all duration-300 group border border-amber-400/50"
          >
            <UploadCloud className="w-4 h-4 mr-2 transition-transform group-hover:-translate-y-1 duration-300" />
            <span className="mr-2">Unggah Jadwal ({unuploadedCount})</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
          </Button>
        )}

        {canCreate && (
          <Link to="/akademik/jadwal/tambah">
            <Button className="bg-[#243B7A] hover:bg-[#1C2D5C] rounded-xl h-10 px-4 font-medium shadow-sm transition-all hover:shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Jadwal
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
