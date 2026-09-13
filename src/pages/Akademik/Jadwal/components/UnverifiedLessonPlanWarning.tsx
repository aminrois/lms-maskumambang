import React from "react";
import { ShieldAlert } from "lucide-react";

interface UnverifiedLessonPlanWarningProps {
  count: number;
}

export const UnverifiedLessonPlanWarning: React.FC<UnverifiedLessonPlanWarningProps> = ({ count }) => {
  if (count <= 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm mb-6">
      <div className="p-2 bg-amber-100/80 rounded-lg shrink-0">
        <ShieldAlert className="w-5 h-5 text-amber-600" />
      </div>
      <div>
        <h3 className="text-amber-800 font-bold text-sm">
          Perhatian: Terdapat Mata Pelajaran yang Belum Terverifikasi Penuh
        </h3>
        <p className="text-amber-700/90 text-xs mt-1 leading-relaxed">
          Terdapat mata pelajaran yang RPP (Lesson Plan) nya masih menunggu verifikasi. Aktivitas KBM (Absensi & Jurnal) untuk jadwal tersebut belum dapat dilakukan sebelum RPP disetujui sepenuhnya.
        </p>
      </div>
    </div>
  );
};
