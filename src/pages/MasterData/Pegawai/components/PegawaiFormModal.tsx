import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { FieldError } from "../../../../components/ui/FieldError";
import { Loader2, User, Users, GraduationCap, School } from "lucide-react";
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
  isSelfOnly?: boolean;
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
  onSubmit,
  isSelfOnly = false,
}: PegawaiFormModalProps) {
  const [activeTab, setActiveTab] = useState<"profil" | "keluarga" | "pendidikan">("profil");

  const isFormValid = !!formData.nig && !!formData.nama && !!formData.jenis_kelamin && !!formData.jabatan;
  const isDisabled = isSaving || isPending || hasDuplicateError || !isFormValid;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-800">
            {isSelfOnly ? "Edit Data Profil Saya" : selectedPegawai ? "Edit Data Pegawai" : "Tambah Pegawai Baru"}
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mt-2 mb-2 bg-slate-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("profil")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "profil"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Biodata & Kepegawaian
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("keluarga")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "keluarga"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Data Keluarga
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pendidikan")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "pendidikan"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Riwayat Pendidikan
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* ── TAB 1: BIODATA & KEPEGAWAIAN ────────────────────────────────── */}
          {activeTab === "profil" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">NIG <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    disabled={isSelfOnly}
                    value={formData.nig}
                    onChange={e => setFormData({ ...formData, nig: e.target.value })}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSelfOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''} ${isNigDuplikat ? 'border-red-400' : ''}`}
                    placeholder="Nomor Induk Guru"
                  />
                  {isSelfOnly && <p className="text-[10px] text-slate-400">Dikelola oleh Administrator</p>}
                  {isNigDuplikat && <FieldError message="NIG sudah terdaftar di sistem" />}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">NIP</label>
                  <input type="text" value={formData.nip || ""} onChange={e => setFormData({ ...formData, nip: e.target.value })} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Opsional" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">NIK (KTP)</label>
                  <input type="text" value={formData.nik || ""} onChange={e => setFormData({ ...formData, nik: e.target.value })} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="16 Digit NIK" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">No. Kartu Keluarga (KK)</label>
                  <input type="text" value={formData.no_kk || ""} onChange={e => setFormData({ ...formData, no_kk: e.target.value })} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="16 Digit No. KK" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input required type="text" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isNamaDuplikat ? 'border-red-400' : ''}`} placeholder="Masukkan nama lengkap" />
                  {isNamaDuplikat && <FieldError message="Nama pegawai sudah digunakan" />}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Jenis Kelamin <span className="text-red-500">*</span></label>
                  <select required value={formData.jenis_kelamin} onChange={e => setFormData({ ...formData, jenis_kelamin: e.target.value as "L" | "P" })} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tempat Lahir</label>
                  <input type="text" value={formData.tempat_lahir || ""} onChange={e => setFormData({ ...formData, tempat_lahir: e.target.value })} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Kota lahir" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tanggal Lahir</label>
                  <input type="date" value={formData.tanggal_lahir || ""} onChange={e => setFormData({ ...formData, tanggal_lahir: e.target.value })} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Golongan Darah</label>
                  <select value={formData.golongan_darah || ""} onChange={e => setFormData({ ...formData, golongan_darah: e.target.value })} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Pilih...</option>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nomor HP / WhatsApp</label>
                  <input type="text" value={formData.no_hp || ""} onChange={e => setFormData({ ...formData, no_hp: e.target.value })} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: 0812345678" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email Pegawai</label>
                  <input type="email" value={formData.email || ""} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: nama@domain.com" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Alamat Lengkap</label>
                <textarea value={formData.alamat || ""} onChange={e => setFormData({ ...formData, alamat: e.target.value })} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Alamat domisili lengkap" rows={2} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Status</label>
                  <select
                    disabled={isSelfOnly}
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as "Aktif" | "Tidak Aktif" })}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${isSelfOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Jabatan <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    disabled={isSelfOnly}
                    value={formData.jabatan}
                    onChange={e => setFormData({ ...formData, jabatan: e.target.value })}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSelfOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                    placeholder="Contoh: Guru"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tugas Tambahan</label>
                  <input
                    type="text"
                    disabled={isSelfOnly}
                    value={formData.tugas_tambahan || ""}
                    onChange={e => setFormData({ ...formData, tugas_tambahan: e.target.value })}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSelfOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                    placeholder="Opsional"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: DATA KELUARGA ────────────────────────────────────────── */}
          {activeTab === "keluarga" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1.5">
                <label className="text-xs font-bold text-blue-900 block">Nama Pasangan (Istri / Suami)</label>
                <input
                  type="text"
                  value={formData.nama_pasangan || ""}
                  onChange={e => setFormData({ ...formData, nama_pasangan: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Masukkan nama lengkap istri atau suami"
                />
                <p className="text-[11px] text-blue-700">Isi nama lengkap pasangan sah pegawai jika sudah menikah.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nama Ayah</label>
                  <input type="text" value={formData.nama_ayah || ""} onChange={e => setFormData({ ...formData, nama_ayah: e.target.value })} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nama Ayah Kandung" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nama Ibu</label>
                  <input type="text" value={formData.nama_ibu || ""} onChange={e => setFormData({ ...formData, nama_ibu: e.target.value })} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nama Ibu Kandung" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Jumlah Anak Laki-Laki</label>
                  <input type="number" min={0} value={formData.jumlah_anak_laki ?? ""} onChange={e => setFormData({ ...formData, jumlah_anak_laki: e.target.value !== "" ? parseInt(e.target.value) : undefined })} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Jumlah anak laki-laki" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Jumlah Anak Perempuan</label>
                  <input type="number" min={0} value={formData.jumlah_anak_perempuan ?? ""} onChange={e => setFormData({ ...formData, jumlah_anak_perempuan: e.target.value !== "" ? parseInt(e.target.value) : undefined })} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Jumlah anak perempuan" />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: RIWAYAT PENDIDIKAN ───────────────────────────────────── */}
          {activeTab === "pendidikan" && (
            <div className="space-y-4">
              {/* Bagian 1: Pendidikan Dasar & Menengah */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-blue-600" />
                  Pendidikan Dasar & Menengah
                </h4>
                <div className="space-y-2.5">
                  {/* TK/RA */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                    <span className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">
                      1. TK / RA (Raudhatul Athfal)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Nama Lembaga TK / RA"
                          value={formData.pendidikan_tk_nama || ""}
                          onChange={e => setFormData({ ...formData, pendidikan_tk_nama: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <input
                          type="text"
                          placeholder="Thn Masuk"
                          value={formData.pendidikan_tk_tahun_masuk || ""}
                          onChange={e => setFormData({ ...formData, pendidikan_tk_tahun_masuk: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <input
                          type="text"
                          placeholder="Thn Lulus"
                          value={formData.pendidikan_tk_tahun_lulus || ""}
                          onChange={e => setFormData({ ...formData, pendidikan_tk_tahun_lulus: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SD/MI */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                    <span className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">
                      2. SD / MI (Madrasah Ibtidaiyah)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Nama Lembaga SD / MI"
                          value={formData.pendidikan_sd_nama || ""}
                          onChange={e => setFormData({ ...formData, pendidikan_sd_nama: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <input
                          type="text"
                          placeholder="Thn Masuk"
                          value={formData.pendidikan_sd_tahun_masuk || ""}
                          onChange={e => setFormData({ ...formData, pendidikan_sd_tahun_masuk: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <input
                          type="text"
                          placeholder="Thn Lulus"
                          value={formData.pendidikan_sd_tahun_lulus || ""}
                          onChange={e => setFormData({ ...formData, pendidikan_sd_tahun_lulus: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SMP/MTS */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                    <span className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">
                      3. SMP / MTs (Madrasah Tsanawiyah)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Nama Lembaga SMP / MTs"
                          value={formData.pendidikan_smp_nama || ""}
                          onChange={e => setFormData({ ...formData, pendidikan_smp_nama: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <input
                          type="text"
                          placeholder="Thn Masuk"
                          value={formData.pendidikan_smp_tahun_masuk || ""}
                          onChange={e => setFormData({ ...formData, pendidikan_smp_tahun_masuk: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <input
                          type="text"
                          placeholder="Thn Lulus"
                          value={formData.pendidikan_smp_tahun_lulus || ""}
                          onChange={e => setFormData({ ...formData, pendidikan_smp_tahun_lulus: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SMA/MA/SMK */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                    <span className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">
                      4. SMA / MA / SMK
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Nama Lembaga SMA / MA / SMK"
                          value={formData.pendidikan_sma_nama || ""}
                          onChange={e => setFormData({ ...formData, pendidikan_sma_nama: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <input
                          type="text"
                          placeholder="Thn Masuk"
                          value={formData.pendidikan_sma_tahun_masuk || ""}
                          onChange={e => setFormData({ ...formData, pendidikan_sma_tahun_masuk: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <input
                          type="text"
                          placeholder="Thn Lulus"
                          value={formData.pendidikan_sma_tahun_lulus || ""}
                          onChange={e => setFormData({ ...formData, pendidikan_sma_tahun_lulus: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Perguruan Tinggi */}
              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-indigo-900 mb-2.5 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Pendidikan Tinggi (Perguruan Tinggi)
                </h4>
                <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Jenjang Pendidikan</label>
                      <select
                        value={formData.pt_jenjang || ""}
                        onChange={e => setFormData({ ...formData, pt_jenjang: e.target.value })}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                      >
                        <option value="">-- Pilih Jenjang --</option>
                        <option value="S1">S1 (Sarjana)</option>
                        <option value="S2">S2 (Magister)</option>
                        <option value="S3">S3 (Doktor)</option>
                        <option value="D3">D3 (Diploma 3)</option>
                        <option value="D4">D4 (Diploma 4)</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Nama Universitas / Institut / ST</label>
                      <input
                        type="text"
                        placeholder="Contoh: Universitas Gadjah Mada"
                        value={formData.pt_universitas || ""}
                        onChange={e => setFormData({ ...formData, pt_universitas: e.target.value })}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Fakultas</label>
                      <input
                        type="text"
                        placeholder="Contoh: Fakultas Tarbiyah dan Keguruan"
                        value={formData.pt_fakultas || ""}
                        onChange={e => setFormData({ ...formData, pt_fakultas: e.target.value })}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Jurusan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Pendidikan Agama Islam"
                        value={formData.pt_jurusan || ""}
                        onChange={e => setFormData({ ...formData, pt_jurusan: e.target.value })}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Program Studi (Prodi)</label>
                      <input
                        type="text"
                        placeholder="Contoh: S1 Pendidikan Guru MI"
                        value={formData.pt_prodi || ""}
                        onChange={e => setFormData({ ...formData, pt_prodi: e.target.value })}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Tahun Masuk</label>
                      <input
                        type="text"
                        placeholder="Contoh: 2017"
                        value={formData.pt_tahun_masuk || ""}
                        onChange={e => setFormData({ ...formData, pt_tahun_masuk: e.target.value })}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Tahun Lulus</label>
                      <input
                        type="text"
                        placeholder="Contoh: 2021"
                        value={formData.pt_tahun_lulus || ""}
                        onChange={e => setFormData({ ...formData, pt_tahun_lulus: e.target.value })}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between sm:justify-between w-full">
            <div className="flex items-center gap-1.5">
              {activeTab === "keluarga" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("profil")}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ← Profil
                </button>
              )}
              {activeTab === "pendidikan" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("keluarga")}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ← Keluarga
                </button>
              )}
              {activeTab === "profil" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("keluarga")}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                >
                  Keluarga →
                </button>
              )}
              {activeTab === "keluarga" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("pendidikan")}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                >
                  Pendidikan →
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isPending}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="submit" 
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                    if (!isFormValid) {
                      setActiveTab("profil");
                      toast.warning("Mohon lengkapi field wajib pada Biodata (NIG, Nama, Jenis Kelamin, Jabatan)");
                    } else if (hasDuplicateError) {
                      setActiveTab("profil");
                      toast.error("Terdapat data duplikat pada NIG atau Nama Pegawai");
                    }
                  }
                }}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'}`}
              >
                {(isSaving || isPending) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSaving ? "Menyimpan..." : selectedPegawai ? "Simpan Perubahan" : "Simpan"}
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

