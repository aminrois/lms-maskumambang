import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, GraduationCap } from "lucide-react";

interface GuruPengampuModalProps {
  isOpen: boolean;
  onClose: () => void;
  namaMapel: string;
  guruList: Array<{
    nama: string;
    nig?: string;
    nip?: string;
    jabatan?: string;
  }>;
}

export const GuruPengampuModal: React.FC<GuruPengampuModalProps> = ({
  isOpen,
  onClose,
  namaMapel,
  guruList,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span>Daftar Guru Pengampu</span>
              <p className="text-xs font-normal text-slate-500 mt-0.5">{namaMapel}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-center w-12">No</th>
                <th className="px-4 py-3">Nama Guru</th>
                <th className="px-4 py-3 text-right">NIG / NIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {guruList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    Tidak ada data guru pengampu.
                  </td>
                </tr>
              ) : (
                guruList.map((guru, index) => (
                  <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-center font-medium text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>{guru.nama || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500 font-mono">
                      {guru.nig || guru.nip || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DialogFooter className="mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
