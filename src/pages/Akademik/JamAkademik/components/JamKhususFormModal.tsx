import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { JamKhususConfig } from "../hooks/useJamKhusus";
import type { JamAkademikUI } from "../hooks/useJamAkademik";

interface JamKhususFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedData: JamKhususConfig | null;
  formData: Omit<JamKhususConfig, "id">;
  setFormData: React.Dispatch<React.SetStateAction<Omit<JamKhususConfig, "id">>>;
  dataLembagaList: any[];
  isWakaKurikulum: boolean;
  onSubmit: (e: React.FormEvent) => void;
  dataJamUmum: JamAkademikUI[];
}

const HARI_LIST = ["Sabtu", "Ahad", "Senin", "Selasa", "Rabu", "Kamis"];

export const JamKhususFormModal: React.FC<JamKhususFormModalProps> = ({
  open,
  onOpenChange,
  selectedData,
  formData,
  setFormData,
  dataLembagaList,
  isWakaKurikulum,
  onSubmit,
  dataJamUmum
}) => {

  // Get max urutan_jam for the selected lembaga
  const jamUmumLembaga = dataJamUmum.filter(j => j.raw.lembaga_id === formData.lembaga_id);
  let maxUrutan = Math.max(...jamUmumLembaga.map(j => j.urutanJam), 0);
  
  // Batasan khusus: Hari Kamis maksimal hanya sampai jam ke-5
  if (formData.hari === "Kamis" && maxUrutan > 5) {
    maxUrutan = 5;
  }
  
  const urutanOptions = Array.from({ length: maxUrutan }, (_, i) => i + 1);

  // Efek untuk reset urutan_jam jika melebihi batas saat pindah hari (misal dari Jumat ke Kamis)
  React.useEffect(() => {
    if (formData.urutan_jam > maxUrutan && maxUrutan > 0) {
      setFormData(prev => ({ ...prev, urutan_jam: maxUrutan }));
    }
  }, [formData.hari, maxUrutan, formData.urutan_jam, setFormData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25 rounded-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            {selectedData ? "Edit Jam Khusus" : "Tambah Jam Khusus"}
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
                  setFormData({ ...formData, lembaga_id: Number(e.target.value), urutan_jam: 1 })
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
                <span>Hari <span className="text-red-500">*</span></span>
              </label>
              <select
                required
                value={formData.hari}
                onChange={(e) =>
                  setFormData({ ...formData, hari: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              >
                {HARI_LIST.map(hari => (
                  <option key={hari} value={hari}>{hari}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                <span>Urutan Jam <span className="text-red-500">*</span></span>
              </label>
              <select
                required
                value={formData.urutan_jam}
                onChange={(e) =>
                  setFormData({ ...formData, urutan_jam: Number(e.target.value) })
                }
                disabled={urutanOptions.length === 0}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
              >
                {urutanOptions.length === 0 && <option value="">Tidak ada jam umum</option>}
                {urutanOptions.map(urutan => (
                  <option key={urutan} value={urutan}>Jam ke-{urutan}</option>
                ))}
              </select>
            </div>
          </div>
          {urutanOptions.length === 0 && formData.lembaga_id !== 0 && (
            <p className="text-xs text-red-500">
              Silakan buat jam umum terlebih dahulu untuk lembaga ini sebelum membuat jam khusus.
            </p>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tipe Jam Khusus <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.tipe === "Belajar" ? "Istirahat" : formData.tipe}
              onChange={(e) =>
                setFormData({ ...formData, tipe: e.target.value as any })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
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
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={urutanOptions.length === 0}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Simpan Jam Khusus
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
