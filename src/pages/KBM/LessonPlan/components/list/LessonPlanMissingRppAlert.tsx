import { AlertTriangle, BookPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MissingRppItem } from "../../hooks/useLessonPlanList";

interface Props {
  items: MissingRppItem[];
}

export function LessonPlanMissingRppAlert({ items }: Props) {
  const navigate = useNavigate();

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 rounded-full bg-amber-100 p-1.5">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800 mb-1">
            {items.length} Mata Pelajaran belum memiliki RPP
          </p>
          <p className="text-xs text-amber-700 mb-3">
            Berdasarkan jadwal mengajar Anda, mata pelajaran berikut belum dibuatkan Lesson Plan (RPP):
          </p>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <button
                key={item.mapel_id}
                onClick={() =>
                  navigate(`/kbm/lesson-plan/form?mapel_id=${item.mapel_id}&jadwal_id=${item.jadwal_id}`)
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 shadow-xs hover:bg-amber-50 hover:border-amber-400 transition-colors"
              >
                <BookPlus className="h-3.5 w-3.5 text-amber-600" />
                <span>{item.nama_mapel}</span>
                {item.nama_kelas && (
                  <span className="text-amber-500">({item.nama_kelas})</span>
                )}
                <span className="ml-1 text-amber-600 font-semibold">→ Buat RPP</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
