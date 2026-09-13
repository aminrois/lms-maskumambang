import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { JAM_AKADEMIK_CREATE } from "@/types/database";

interface JamFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedData: any;
  formData: JAM_AKADEMIK_CREATE;
  setFormData: React.Dispatch<React.SetStateAction<JAM_AKADEMIK_CREATE>>;
  dataLembagaList: any[];
  isWakaKurikulum: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export const JamFormModal: React.FC<JamFormModalProps> = ({
  open,
  onOpenChange,
  selectedData,
  formData,
  setFormData,
  dataLembagaList,
  isWakaKurikulum,
  onSubmit,
  isPending,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25 rounded-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            {selectedData ? "Edit Jam Akademik" : "Tambah Jam Akademik"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-2">
          {!isWakaKurikulum && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Lembaga <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.lembaga_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lembaga_id: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Pilih Lembaga</option>
                {dataLembagaList.map((item: any) => (
                  <option key={item.lembaga_id} value={item.lembaga_id}>
                    {item.singkatan || item.nama_lembaga}
                  </option>
                ))}
              </select>
            </div>
          )}


          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                <span>Jam Mulai <span className="text-red-500">*</span></span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  placeholder="07:00"
                  maxLength={5}
                  pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                  value={formData.jam_mulai}
                  onChange={(e) =>
                    setFormData({ ...formData, jam_mulai: e.target.value })
                  }
                  className="w-full pl-3 pr-12 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm font-semibold text-gray-800"
                />
                <span className="absolute right-2 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded pointer-events-none">
                  WIB
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                <span>Jam Selesai <span className="text-red-500">*</span></span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  placeholder="07:45"
                  maxLength={5}
                  pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                  value={formData.jam_selesai}
                  onChange={(e) =>
                    setFormData({ ...formData, jam_selesai: e.target.value })
                  }
                  className="w-full pl-3 pr-12 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm font-semibold text-gray-800"
                />
                <span className="absolute right-2 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded pointer-events-none">
                  WIB
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tipe Jam <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.tipe}
              onChange={(e) =>
                setFormData({ ...formData, tipe: e.target.value as any })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Belajar">Belajar</option>
              <option value="Istirahat">Istirahat</option>
              <option value="Sholat Dhuha & Halaqoh">Sholat Dhuha &amp; Halaqoh</option>
              <option value="Apel">Apel</option>
              <option value="Mapel Pilihan / Bimbingan TKA">Mapel Pilihan / Bimbingan TKA</option>
              <option value="Bonding / Life Skill">Bonding / Life Skill</option>
            </select>
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isPending}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md transition-colors"
              disabled={isPending}
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
