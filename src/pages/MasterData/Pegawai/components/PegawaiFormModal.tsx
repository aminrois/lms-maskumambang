
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { FieldError } from "../../../../components/ui/FieldError";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PegawaiUI } from "../hooks/usePegawaiData";
import type { PEGAWAI_CREATE } from "../../../../types/database";

interface PegawaiFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPegawai: PegawaiUI | null;
  formData: PEGAWAI_CREATE & { lembaga_ids: number[] };
  setFormData: (data: PEGAWAI_CREATE & { lembaga_ids: number[] }) => void;
  isNigDuplikat: boolean;
  isNamaDuplikat: boolean;
  hasDuplicateError: boolean;
  isSaving: boolean;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function PegawaiFormModal({
  isOpen,
  onClose,
  selectedPegawai,
  formData,
  setFormData,
  isNigDuplikat,
  isNamaDuplikat,
  hasDuplicateError,
  isSaving,
  isPending,
  onSubmit
}: PegawaiFormModalProps) {
  const isFormValid = !!formData.nig && !!formData.nama && !!formData.jenis_kelamin && !!formData.jabatan;
  const isDisabled = isSaving || isPending || hasDuplicateError || !isFormValid;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedPegawai ? "Edit Data Pegawai" : "Tambah Pegawai Baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">NIG <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.nig} onChange={e => setFormData({ ...formData, nig: e.target.value })} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isNigDuplikat ? 'border-red-400' : ''}`} placeholder="Nomor Induk Guru" />
              {isNigDuplikat && <FieldError message="NIG sudah terdaftar di sistem" />}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">NIP</label>
              <input type="text" value={formData.nip || ""} onChange={e => setFormData({ ...formData, nip: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Opsional" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">NIK</label>
              <input type="text" value={formData.nik || ""} onChange={e => setFormData({ ...formData, nik: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nomor Induk Kependudukan" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Lengkap <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isNamaDuplikat ? 'border-red-400' : ''}`} placeholder="Masukkan nama pegawai" />
              {isNamaDuplikat && <FieldError message="Nama pegawai sudah digunakan" />}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Jenis Kelamin <span className="text-red-500">*</span></label>
              <select required value={formData.jenis_kelamin} onChange={e => setFormData({ ...formData, jenis_kelamin: e.target.value as "L" | "P" })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tempat Lahir</label>
              <input type="text" value={formData.tempat_lahir || ""} onChange={e => setFormData({ ...formData, tempat_lahir: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Opsional" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Lahir</label>
              <input type="date" value={formData.tanggal_lahir || ""} onChange={e => setFormData({ ...formData, tanggal_lahir: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {formData.tanggal_lahir && (
                <p className="text-xs text-blue-600 font-medium">
                  Tahun: {new Date(formData.tanggal_lahir).getFullYear()} | Umur: {(() => {
                    const birth = new Date(formData.tanggal_lahir);
                    if (isNaN(birth.getTime())) return "—";
                    const now = new Date();
                    let age = now.getFullYear() - birth.getFullYear();
                    const m = now.getMonth() - birth.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                    return age >= 0 ? `${age} tahun` : "—";
                  })()}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Golongan Darah</label>
              <select value={formData.golongan_darah || ""} onChange={e => setFormData({ ...formData, golongan_darah: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Pilih Golongan Darah...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Ayah</label>
              <input type="text" value={formData.nama_ayah || ""} onChange={e => setFormData({ ...formData, nama_ayah: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nama Ayah Kandung" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Ibu</label>
              <input type="text" value={formData.nama_ibu || ""} onChange={e => setFormData({ ...formData, nama_ibu: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nama Ibu Kandung" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jumlah Anak Laki-Laki</label>
              <input type="number" min={0} value={formData.jumlah_anak_laki ?? ""} onChange={e => setFormData({ ...formData, jumlah_anak_laki: e.target.value !== "" ? parseInt(e.target.value) : undefined })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Jumlah anak (L)" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Jumlah Anak Perempuan</label>
              <input type="number" min={0} value={formData.jumlah_anak_perempuan ?? ""} onChange={e => setFormData({ ...formData, jumlah_anak_perempuan: e.target.value !== "" ? parseInt(e.target.value) : undefined })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Jumlah anak (P)" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Alamat</label>
            <textarea value={formData.alamat || ""} onChange={e => setFormData({ ...formData, alamat: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Alamat lengkap (Opsional)" rows={2} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nomor HP</label>
              <input type="text" value={formData.no_hp || ""} onChange={e => setFormData({ ...formData, no_hp: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: 0812345678" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as "Aktif" | "Tidak Aktif" })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jabatan <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.jabatan} onChange={e => setFormData({ ...formData, jabatan: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Guru" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tugas Tambahan</label>
              <input type="text" value={formData.tugas_tambahan || ""} onChange={e => setFormData({ ...formData, tugas_tambahan: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Opsional" />
            </div>
          </div>

          <DialogFooter className="mt-6 pt-4">
            <button type="button" onClick={onClose} disabled={isSaving || isPending} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50">Batal</button>
            <button 
              type="submit" 
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault();
                  toast.warning("Data yang terisi masih belum lengkap");
                }
              }}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors flex items-center gap-2 ${isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {(isSaving || isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? "Menyimpan..." : selectedPegawai ? "Simpan Perubahan" : "Simpan"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
