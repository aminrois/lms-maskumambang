import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { FieldError } from "../../../../components/ui/FieldError";
import { Loader2 } from "lucide-react";
import type { LembagaUI } from "../hooks/useLembagaData";

interface LembagaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLembaga: LembagaUI | null;
  formData: {
    nama_lembaga: string;
    singkatan: string;
    kepala_sekolah_id: string;
    kurikulum_id: string;
  };
  setFormData: (data: {
    nama_lembaga: string;
    singkatan: string;
    kepala_sekolah_id: string;
    kurikulum_id: string;
  }) => void;
  dataPegawaiAll: {
    pegawai_id: number | string;
    nama: string;
    user_id?: string;
    pegawai_lembaga?: { lembaga_id: number | string }[];
  }[];
  isNamaDuplikat: boolean;
  isSingkatanDuplikat: boolean;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LembagaFormModal({
  isOpen,
  onClose,
  selectedLembaga,
  formData,
  setFormData,
  dataPegawaiAll,
  isNamaDuplikat,
  isSingkatanDuplikat,
  isPending,
  onSubmit
}: LembagaFormModalProps) {
  const hasDuplicateError = isNamaDuplikat || isSingkatanDuplikat;

  const candidatePegawai = React.useMemo(() => {
    if (!selectedLembaga) return dataPegawaiAll;
    const targetLembagaId = selectedLembaga.id;
    return dataPegawaiAll.filter((p) => {
      // Selalu sertakan jika pegawai ini yang saat ini terpilih
      if (
        (formData.kepala_sekolah_id && String(p.pegawai_id) === String(formData.kepala_sekolah_id)) ||
        (formData.kurikulum_id && String(p.pegawai_id) === String(formData.kurikulum_id))
      ) {
        return true;
      }
      // Jika pegawai tertaut pada lembaga ini
      if (p.pegawai_lembaga && Array.isArray(p.pegawai_lembaga) && p.pegawai_lembaga.length > 0) {
        return p.pegawai_lembaga.some((pl) => Number(pl.lembaga_id) === Number(targetLembagaId));
      }
      // Atau jika pegawai tidak tertaut ke lembaga manapun (Global/Yayasan)
      return true;
    });
  }, [dataPegawaiAll, selectedLembaga, formData.kepala_sekolah_id, formData.kurikulum_id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{selectedLembaga ? "Edit Lembaga" : "Tambah Lembaga Baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Lembaga <span className="text-red-500">*</span></label>
            <input
              required
              type="text"
              value={formData.nama_lembaga}
              onChange={e => setFormData({ ...formData, nama_lembaga: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isNamaDuplikat ? 'border-red-400' : ''}`}
              placeholder="Contoh: Madrasah Tsanawiyah"
            />
            {isNamaDuplikat && <FieldError message="Nama lembaga sudah digunakan" />}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Singkatan</label>
            <input
              type="text"
              value={formData.singkatan}
              onChange={e => setFormData({ ...formData, singkatan: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSingkatanDuplikat ? 'border-red-400' : ''}`}
              placeholder="Contoh: MTs"
            />
            {isSingkatanDuplikat && <FieldError message="Singkatan sudah digunakan" />}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Kepala Sekolah</label>
            <select
              value={formData.kepala_sekolah_id || ""}
              onChange={e => setFormData({ ...formData, kepala_sekolah_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Belum Ditentukan --</option>
              {candidatePegawai.map((p) => (
                <option key={p.pegawai_id} value={p.pegawai_id}>{p.nama}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Waka Kurikulum</label>
            <select
              value={formData.kurikulum_id || ""}
              onChange={e => setFormData({ ...formData, kurikulum_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Belum Ditentukan --</option>
              {candidatePegawai.map((p) => (
                <option key={p.pegawai_id} value={p.pegawai_id}>{p.nama}</option>
              ))}
            </select>
          </div>
          <DialogFooter className="mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || hasDuplicateError}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {selectedLembaga ? "Simpan Perubahan" : "Simpan"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
