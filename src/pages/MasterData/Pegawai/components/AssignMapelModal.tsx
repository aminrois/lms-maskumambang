import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Info } from "lucide-react";

interface AssignMapelModalProps {
  isOpen: boolean;
  onClose: () => void;
  pegawaiId: number | null;
  pegawaiName: string;
}

export default function AssignMapelModal({ isOpen, onClose, pegawaiName }: AssignMapelModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mata Pelajaran Pengampu</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-1">Sistem Baru: Mapel per Kelas</p>
              <p className="text-sm text-blue-700">
                Penugasan mata pelajaran kini dikelola per <strong>kelas</strong>, bukan per guru.
                Untuk melihat atau mengubah mata pelajaran yang diajarkan oleh <strong>{pegawaiName}</strong>,
                pergi ke halaman <strong>Jadwal Pelajaran</strong> dan atur slot jadwal di kelas yang sesuai.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <BookOpen className="w-5 h-5 text-gray-500 shrink-0" />
            <p className="text-sm text-gray-600">
              Mata pelajaran yang tersedia per kelas dapat dikelola di halaman{" "}
              <strong>Akademik → Mata Pelajaran</strong>.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
