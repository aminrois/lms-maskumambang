import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { FieldError } from "../../../../components/ui/FieldError";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SiswaUI } from "../hooks/useSiswaData";

interface SiswaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSiswa: SiswaUI | null;
  formData: any;
  setFormData: (data: any) => void;
  dataKelasList: any[];
  dataWaliList: any[];
  isNisDuplikat: boolean;
  isNisnDuplikat: boolean;
  isNamaDuplikat: boolean;
  isPending: boolean;
  hasDuplicateError: boolean;
  onSubmit: (e: React.FormEvent) => void;
  getNamaWaliUtama: (wali: any) => string;
}

export default function SiswaFormModal({
  isOpen,
  onClose,
  selectedSiswa,
  formData,
  setFormData,
  dataKelasList,
  dataWaliList,
  isNisDuplikat,
  isNisnDuplikat,
  isNamaDuplikat,
  isPending,
  hasDuplicateError,
  onSubmit,
  getNamaWaliUtama
}: SiswaFormModalProps) {
  // Wilayah fallback loaders — hanya dieksekusi jika API Wilayah.id gagal
  const loadFallbackProvinces = () =>
    fetch("/data/wilayah/provinces.json").then(res => res.json() as Promise<{ code: string; name: string }[]>);
  const loadFallbackRegencies = () =>
    fetch("/data/wilayah/regencies.json").then(res => res.json() as Promise<Record<string, { code: string; name: string }[]>>);

  const [provinces, setProvinces] = React.useState<{ code: string; name: string }[]>([]);
  const [regencies, setRegencies] = React.useState<{ code: string; name: string }[]>([]);

  const [selectedProvCode, setSelectedProvCode] = React.useState<string>("");
  const [selectedRegCode, setSelectedRegCode] = React.useState<string>("");

  const [loadingProv, setLoadingProv] = React.useState<boolean>(false);
  const [loadingReg, setLoadingReg] = React.useState<boolean>(false);

  // 1. Fetch Provinces when modal is open (with local JSON fallback)
  React.useEffect(() => {
    if (!isOpen) return;
    setLoadingProv(true);
    fetch("/api/wilayah/provinces.json")
      .then(res => { if (!res.ok) throw new Error("API error"); return res.json(); })
      .then(data => setProvinces(data.data || []))
      .catch(() => {
        // Fallback: gunakan data lokal jika API gagal
        loadFallbackProvinces().then(data => setProvinces(data));
      })
      .finally(() => setLoadingProv(false));
  }, [isOpen]);

  // Sync selectedProvCode when provinces load or formData.provinsi changes
  React.useEffect(() => {
    if (!formData.provinsi || provinces.length === 0) return;
    const found = provinces.find(p => p.name.toLowerCase() === formData.provinsi.toLowerCase());
    if (found && found.code !== selectedProvCode) {
      setSelectedProvCode(found.code);
    }
  }, [formData.provinsi, provinces]);

  // 2. Fetch Regencies when selectedProvCode changes (with local JSON fallback)
  React.useEffect(() => {
    if (!selectedProvCode) {
      setRegencies([]);
      setSelectedRegCode("");
      return;
    }
    setLoadingReg(true);
    fetch(`/api/wilayah/regencies/${selectedProvCode}.json`)
      .then(res => { if (!res.ok) throw new Error("API error"); return res.json(); })
      .then(data => setRegencies(data.data || []))
      .catch(() => {
        // Fallback: gunakan data lokal jika API gagal
        loadFallbackRegencies().then(all => setRegencies(all[selectedProvCode] || []));
      })
      .finally(() => setLoadingReg(false));
  }, [selectedProvCode]);

  // Sync selectedRegCode when regencies load or formData.kabupaten_kota changes
  React.useEffect(() => {
    if (!formData.kabupaten_kota || regencies.length === 0) return;
    const found = regencies.find(r => r.name.toLowerCase() === formData.kabupaten_kota.toLowerCase());
    if (found && found.code !== selectedRegCode) {
      setSelectedRegCode(found.code);
    }
  }, [formData.kabupaten_kota, regencies]);

  const isFormValid = !!formData.nis && !!formData.nisn && !!formData.nama && !!formData.jenis_kelamin && !!formData.tempat_lahir && !!formData.tanggal_lahir && !!formData.agama && !!formData.kewarganegaraan && !!formData.asal_sekolah && !!formData.tahun_masuk;
  const isDisabled = isPending || hasDuplicateError || !isFormValid;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedSiswa ? "Edit Data Siswa" : "Tambah Siswa Baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6 mt-4">

          {/* Bagian 1: Identitas Utama */}
          <div>
            <h3 className="text-sm font-semibold text-blue-900 border-b pb-2 mb-4 uppercase tracking-wider">Identitas Utama</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">NIS <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.nis} onChange={e => setFormData({ ...formData, nis: e.target.value })} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isNisDuplikat ? 'border-red-400' : ''}`} placeholder="Nomor Induk Siswa" />
                {isNisDuplikat && <FieldError message="NIS sudah terdaftar di sistem" />}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">NISN <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.nisn} onChange={e => setFormData({ ...formData, nisn: e.target.value })} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isNisnDuplikat ? 'border-red-400' : ''}`} placeholder="NIS Nasional" />
                {isNisnDuplikat && <FieldError message="NISN sudah terdaftar di sistem" />}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">NIK</label>
                <input type="text" value={formData.nik || ""} onChange={e => setFormData({ ...formData, nik: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="16 Digit NIK" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">No. Kartu Keluarga (KK)</label>
                <input type="text" value={formData.no_kk || ""} onChange={e => setFormData({ ...formData, no_kk: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="16 Digit No. KK" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">No. Akta Kelahiran</label>
                <input type="text" value={formData.no_akta_kelahiran || ""} onChange={e => setFormData({ ...formData, no_akta_kelahiran: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nomor Akta Kelahiran" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">PIN Akun</label>
                <input type="text" value={formData.pin || ""} onChange={e => setFormData({ ...formData, pin: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="PIN Transaksi / Login" />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium">Nama Lengkap <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isNamaDuplikat ? 'border-red-400' : ''}`} placeholder="Nama lengkap siswa" />
                {isNamaDuplikat && <FieldError message="Nama siswa sudah terdaftar" />}
              </div>
            </div>
          </div>

          {/* Bagian 2: Data Pribadi & Alamat */}
          <div>
            <h3 className="text-sm font-semibold text-blue-900 border-b pb-2 mb-4 uppercase tracking-wider">Data Pribadi & Alamat</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Panggilan</label>
                <input type="text" value={formData.panggilan || ""} onChange={e => setFormData({ ...formData, panggilan: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Panggilan" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jenis Kelamin <span className="text-red-500">*</span></label>
                <select value={formData.jenis_kelamin} onChange={e => setFormData({ ...formData, jenis_kelamin: e.target.value as "L" | "P" })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tempat Lahir <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.tempat_lahir} onChange={e => setFormData({ ...formData, tempat_lahir: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Kota/Kab Tempat Lahir" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Lahir <span className="text-red-500">*</span></label>
                <input required type="date" value={formData.tanggal_lahir} onChange={e => setFormData({ ...formData, tanggal_lahir: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Agama <span className="text-red-500">*</span></label>
                <select value={formData.agama} onChange={e => setFormData({ ...formData, agama: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Khonghucu">Khonghucu</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kewarganegaraan <span className="text-red-500">*</span></label>
                <select value={formData.kewarganegaraan} onChange={e => setFormData({ ...formData, kewarganegaraan: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="WNI">WNI</option>
                  <option value="WNA">WNA</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kode Pos</label>
                <input type="text" value={formData.kode_pos || ""} onChange={e => setFormData({ ...formData, kode_pos: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Kode Pos" />
              </div>
            </div>

            {/* Sub-bagian Alamat & Dropdown Wilayah.id */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{formData.kewarganegaraan === "WNA" ? "Negara" : "Provinsi"}</label>
                {formData.kewarganegaraan === "WNA" ? (
                  <input
                    type="text"
                    value={formData.provinsi || ""}
                    onChange={e => setFormData({ ...formData, provinsi: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Nama Negara"
                  />
                ) : (
                  <select
                    value={provinces.find(p => p.name.toLowerCase() === (formData.provinsi || "").toLowerCase())?.code || ""}
                    onChange={e => {
                      const code = e.target.value;
                      const prov = provinces.find(p => p.code === code);
                      setSelectedProvCode(code);
                      setSelectedRegCode("");
                      setFormData({
                        ...formData,
                        provinsi: prov ? prov.name : "",
                        kabupaten_kota: "",
                        kecamatan: "",
                        desa_kelurahan: ""
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    disabled={loadingProv}
                  >
                    <option value="">{loadingProv ? "Memuat Provinsi..." : "Pilih Provinsi..."}</option>
                    {provinces.map(p => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {formData.kewarganegaraan !== "WNA" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kabupaten/Kota</label>
                  <select
                    value={regencies.find(r => r.name.toLowerCase() === (formData.kabupaten_kota || "").toLowerCase())?.code || ""}
                    onChange={e => {
                      const code = e.target.value;
                      const reg = regencies.find(r => r.code === code);
                      setSelectedRegCode(code);
                      setFormData({
                        ...formData,
                        kabupaten_kota: reg ? reg.name : "",
                        kecamatan: "",
                        desa_kelurahan: ""
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
                    disabled={!selectedProvCode || loadingReg}
                  >
                    <option value="">
                      {!selectedProvCode ? "Pilih Provinsi Terlebih Dahulu" : loadingReg ? "Memuat Kabupaten/Kota..." : "Pilih Kabupaten/Kota..."}
                    </option>
                    {regencies.map(r => (
                      <option key={r.code} value={r.code}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {formData.kewarganegaraan !== "WNA" && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
                <div className="space-y-2 col-span-1">
                  <label className="text-sm font-medium">RT</label>
                  <input type="text" value={formData.rt || ""} onChange={e => setFormData({ ...formData, rt: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="RT" />
                </div>
                <div className="space-y-2 col-span-1">
                  <label className="text-sm font-medium">RW</label>
                  <input type="text" value={formData.rw || ""} onChange={e => setFormData({ ...formData, rw: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="RW" />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-2">
                  <label className="text-sm font-medium">Kecamatan</label>
                  <input
                    type="text"
                    value={formData.kecamatan || ""}
                    onChange={e => setFormData({ ...formData, kecamatan: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Nama Kecamatan"
                  />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-2">
                  <label className="text-sm font-medium">Desa/Kelurahan</label>
                  <input
                    type="text"
                    value={formData.desa_kelurahan || ""}
                    onChange={e => setFormData({ ...formData, desa_kelurahan: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Nama Desa / Kelurahan"
                  />
                </div>
              </div>
            )}

            <div className="mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Alamat Tempat Tinggal</label>
                <textarea rows={2} value={formData.alamat || ""} onChange={e => setFormData({ ...formData, alamat: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Jl. Raya / Dusun / RT RW lengkap" />
              </div>
            </div>
          </div>

          {/* Bagian 3: Akademik & Relasi */}
          <div>
            <h3 className="text-sm font-semibold text-blue-900 border-b pb-2 mb-4 uppercase tracking-wider">Akademik & Relasi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-medium">Wali Murid</label>
                <select value={formData.wali_murid_id || ""} onChange={e => setFormData({ ...formData, wali_murid_id: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Pilih Wali Murid...</option>
                  {dataWaliList.map((w: any) => (
                    <option key={w.wali_id} value={w.wali_id}>{getNamaWaliUtama(w)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-medium">Kelas</label>
                <select value={formData.kelas_id || ""} onChange={e => setFormData({ ...formData, kelas_id: e.target.value ? parseInt(e.target.value) : 0 })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Pilih Kelas...</option>
                  {dataKelasList.map((k: any) => (
                    <option key={k.kelas_id} value={k.kelas_id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-medium">Status Siswa</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as "Aktif" | "Tidak Aktif" })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Aktif">Aktif</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              </div>
              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-medium">Asrama</label>
                <select value={formData.keterangan_asrama} onChange={e => setFormData({ ...formData, keterangan_asrama: e.target.value as "Ya" | "Tidak" })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Ya">Ya</option>
                  <option value="Tidak">Tidak</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Asal Sekolah <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.asal_sekolah} onChange={e => setFormData({ ...formData, asal_sekolah: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Asal sekolah sebelumnya" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">No. UN Sebelumnya</label>
                <input type="text" value={formData.no_un_sebelumnya || ""} onChange={e => setFormData({ ...formData, no_un_sebelumnya: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nomor Ujian Nasional" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tahun Masuk <span className="text-red-500">*</span></label>
                <input required type="number" value={formData.tahun_masuk} onChange={e => setFormData({ ...formData, tahun_masuk: parseInt(e.target.value) || new Date().getFullYear() })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Alamat Sekolah Asal</label>
                <textarea rows={2} value={formData.alamat_sekolah_asal || ""} onChange={e => setFormData({ ...formData, alamat_sekolah_asal: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Alamat lengkap sekolah asal" />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">Batal</button>
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
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {selectedSiswa ? "Simpan Perubahan" : "Simpan Siswa"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
