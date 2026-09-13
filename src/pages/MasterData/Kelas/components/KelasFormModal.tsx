import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { FieldError } from "../../../../components/ui/FieldError";
import { Loader2 } from "lucide-react";
import type { KelasUI } from "../hooks/useKelasData";
import type { KELAS_CREATE } from "../../../../types/database";

interface KelasFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedKelas: KelasUI | null;
  formData: KELAS_CREATE;
  setFormData: (data: KELAS_CREATE) => void;
  dataLembagaList: { lembaga_id: number | string; nama_lembaga: string; singkatan?: string }[];
  dataTahunList: { tahun_id: number | string; nama_tahun: string; semester?: string; lembaga_id?: number | string }[];
  dataWaliList: { pegawai_id: number | string; nama: string; pegawai_lembaga?: { lembaga_id: number | string }[] }[];
  isNamaDuplikat: boolean;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function KelasFormModal({
  isOpen,
  onClose,
  selectedKelas,
  formData,
  setFormData,
  dataLembagaList,
  dataTahunList,
  dataWaliList,
  isNamaDuplikat,
  isPending,
  onSubmit
}: KelasFormModalProps) {
  const filteredWaliList = React.useMemo(() => {
    if (!formData.lembaga_id) return dataWaliList;
    const targetLembagaId = Number(formData.lembaga_id);
    return dataWaliList.filter((p) => {
      // Selalu sertakan jika pegawai ini yang saat ini terpilih sebagai wali kelas
      if (formData.wali_kelas_id && Number(p.pegawai_id) === Number(formData.wali_kelas_id)) {
        return true;
      }
      // Jika pegawai tertaut pada lembaga ini
      if (p.pegawai_lembaga && Array.isArray(p.pegawai_lembaga) && p.pegawai_lembaga.length > 0) {
        return p.pegawai_lembaga.some((pl) => Number(pl.lembaga_id) === targetLembagaId);
      }
      // Atau jika pegawai tidak tertaut ke lembaga manapun (Global/Yayasan)
      return true;
    });
  }, [dataWaliList, formData.lembaga_id, formData.wali_kelas_id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{selectedKelas ? "Edit Data Kelas" : "Tambah Kelas Baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Kelas <span className="text-red-500">*</span></label>
            <input required type="text" value={formData.nama_kelas} onChange={e => setFormData({ ...formData, nama_kelas: e.target.value })} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isNamaDuplikat ? 'border-red-400' : ''}`} placeholder="Contoh: Kelas 7A" />
            {isNamaDuplikat && <FieldError message="Nama kelas sudah digunakan di lembaga ini" />}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Lembaga <span className="text-red-500">*</span></label>
            <select required value={formData.lembaga_id || ""} onChange={e => setFormData({ ...formData, lembaga_id: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Pilih Lembaga...</option>
              {dataLembagaList.map((l) => (
                <option key={l.lembaga_id} value={l.lembaga_id}>{l.nama_lembaga} {l.singkatan ? `(${l.singkatan})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tahun Ajaran <span className="text-red-500">*</span></label>
            <select required disabled={!formData.lembaga_id} value={formData.tahun_id || ""} onChange={e => setFormData({ ...formData, tahun_id: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:bg-gray-100">
              <option value="">{formData.lembaga_id ? "Pilih Tahun Ajaran..." : "Pilih Lembaga terlebih dahulu..."}</option>
              {dataTahunList
                .filter((t) => formData.lembaga_id ? t.lembaga_id === formData.lembaga_id : false)
                .map((t) => (
                  <option key={t.tahun_id} value={t.tahun_id}>
                    {t.nama_tahun} {t.semester ? `(${t.semester})` : ''}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Wali Kelas (Opsional)</label>
            <select value={formData.wali_kelas_id || ""} onChange={e => setFormData({ ...formData, wali_kelas_id: e.target.value ? parseInt(e.target.value) : 0 })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Pilih Wali Kelas...</option>
              {filteredWaliList.map((p) => (
                <option key={p.pegawai_id} value={p.pegawai_id}>{p.nama}</option>
              ))}
            </select>
          </div>

          <DialogFooter className="mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">Batal</button>
            <button type="submit" disabled={isPending || isNamaDuplikat} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {selectedKelas ? "Simpan Perubahan" : "Simpan Kelas"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
