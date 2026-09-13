import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { FieldError } from "../../../../components/ui/FieldError";
import type { WALI_MURID_CREATE, WALI_MURID } from "../../../../types/database";

interface WaliMuridFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWali: WALI_MURID | null;
  formData: WALI_MURID_CREATE;
  setFormData: (data: WALI_MURID_CREATE) => void;
  activeTab: "Ayah" | "Ibu" | "Wali";
  setActiveTab: (tab: "Ayah" | "Ibu" | "Wali") => void;
  isNikDuplikat: boolean;
  hasDuplicateError: boolean;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function WaliMuridFormModal({
  isOpen,
  onClose,
  selectedWali,
  formData,
  setFormData,
  activeTab,
  setActiveTab,
  isNikDuplikat,
  hasDuplicateError,
  isPending,
  onSubmit
}: WaliMuridFormModalProps) {
  const inputClass = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "text-sm font-medium text-gray-700 mb-1 block";

  const isFormValid = formData.status_ayah === "Hidup"
    ? !!formData.nik_ayah && !!formData.alamat
    : !!formData.nik_wali && !!formData.nama_wali && !!formData.status && !!formData.no_hp_wali && !!formData.alamat;

  const isDisabled = isPending || hasDuplicateError || !isFormValid;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{selectedWali ? "Edit Data Wali Murid" : "Tambah Wali Murid Baru"}</DialogTitle>
        </DialogHeader>

        {!selectedWali && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 mb-2 mx-1 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 leading-relaxed">
              <span className="font-semibold block mb-0.5">Informasi Pengisian Data</span>
              Setidaknya harus ada satu pengisian <strong className="font-bold">Nama</strong> dan <strong className="font-bold">NIK</strong> antara profil Ayah, Ibu, atau Wali untuk keperluan pembuatan akun sistem.
            </div>
          </div>
        )}

        <div className="flex space-x-1 border-b mt-2">
          {["Ayah", "Ibu", "Wali"].map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Data {tab}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4">
          {activeTab === "Ayah" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nama Ayah</label>
                <input type="text" value={formData.nama_ayah || ""} onChange={e => setFormData({ ...formData, nama_ayah: e.target.value })} className={inputClass} placeholder="Nama Lengkap" />
              </div>
              <div>
                <label className={labelClass}>NIK Ayah</label>
                <input type="text" value={formData.nik_ayah || ""} onChange={e => setFormData({ ...formData, nik_ayah: e.target.value })} className={`${inputClass} ${formData.status_ayah === 'Hidup' && isNikDuplikat ? 'border-red-400' : ''}`} placeholder="Nomor Induk Kependudukan" />
                {formData.status_ayah === 'Hidup' && isNikDuplikat && <FieldError message="NIK sudah terdaftar" />}
              </div>
              <div>
                <label className={labelClass}>Status Ayah</label>
                <select value={formData.status_ayah || "Hidup"} onChange={e => setFormData({ ...formData, status_ayah: e.target.value as any })} className={inputClass}>
                  <option value="Hidup">Hidup</option>
                  <option value="Wafat">Wafat</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Tempat Lahir</label>
                <input type="text" value={formData.tempat_lahir_ayah || ""} onChange={e => setFormData({ ...formData, tempat_lahir_ayah: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tanggal Lahir</label>
                <input type="date" value={formData.tanggal_lahir_ayah || ""} onChange={e => setFormData({ ...formData, tanggal_lahir_ayah: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Pendidikan</label>
                <input type="text" value={formData.pendidikan_ayah || ""} onChange={e => setFormData({ ...formData, pendidikan_ayah: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Pekerjaan</label>
                <input type="text" value={formData.pekerjaan_ayah || ""} onChange={e => setFormData({ ...formData, pekerjaan_ayah: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Penghasilan</label>
                <input type="text" value={formData.penghasilan_ayah || ""} onChange={e => setFormData({ ...formData, penghasilan_ayah: e.target.value })} className={inputClass} placeholder="Contoh: 3000000" />
              </div>
              <div>
                <label className={labelClass}>No. HP Ayah</label>
                <input type="text" value={formData.no_hp_ayah || ""} onChange={e => setFormData({ ...formData, no_hp_ayah: e.target.value })} className={inputClass} />
              </div>
            </div>
          )}

          {activeTab === "Ibu" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nama Ibu</label>
                <input type="text" value={formData.nama_ibu || ""} onChange={e => setFormData({ ...formData, nama_ibu: e.target.value })} className={inputClass} placeholder="Nama Lengkap" />
              </div>
              <div>
                <label className={labelClass}>NIK Ibu</label>
                <input type="text" value={formData.nik_ibu || ""} onChange={e => setFormData({ ...formData, nik_ibu: e.target.value })} className={`${inputClass} ${formData.status_ayah !== 'Hidup' && formData.status_ibu === 'Hidup' && isNikDuplikat ? 'border-red-400' : ''}`} placeholder="Nomor Induk Kependudukan" />
                {formData.status_ayah !== 'Hidup' && formData.status_ibu === 'Hidup' && isNikDuplikat && <FieldError message="NIK sudah terdaftar" />}
              </div>
              <div>
                <label className={labelClass}>Status Ibu</label>
                <select value={formData.status_ibu || "Hidup"} onChange={e => setFormData({ ...formData, status_ibu: e.target.value as any })} className={inputClass}>
                  <option value="Hidup">Hidup</option>
                  <option value="Wafat">Wafat</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Tempat Lahir</label>
                <input type="text" value={formData.tempat_lahir_ibu || ""} onChange={e => setFormData({ ...formData, tempat_lahir_ibu: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tanggal Lahir</label>
                <input type="date" value={formData.tanggal_lahir_ibu || ""} onChange={e => setFormData({ ...formData, tanggal_lahir_ibu: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Pendidikan</label>
                <input type="text" value={formData.pendidikan_ibu || ""} onChange={e => setFormData({ ...formData, pendidikan_ibu: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Pekerjaan</label>
                <input type="text" value={formData.pekerjaan_ibu || ""} onChange={e => setFormData({ ...formData, pekerjaan_ibu: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Penghasilan</label>
                <input type="text" value={formData.penghasilan_ibu || ""} onChange={e => setFormData({ ...formData, penghasilan_ibu: e.target.value })} className={inputClass} placeholder="Contoh: 3000000" />
              </div>
              <div>
                <label className={labelClass}>No. HP Ibu</label>
                <input type="text" value={formData.no_hp_ibu || ""} onChange={e => setFormData({ ...formData, no_hp_ibu: e.target.value })} className={inputClass} />
              </div>
            </div>
          )}

          {activeTab === "Wali" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formData.status_ayah !== "Hidup" ? (
                <>
                  {(formData.status_ibu === "Hidup" || !formData.status_ibu) && (() => {
                    const isDataIbuTersalin = Boolean(
                      formData.nama_ibu &&
                      formData.nama_wali === formData.nama_ibu &&
                      formData.nik_wali === formData.nik_ibu &&
                      formData.no_hp_wali === formData.no_hp_ibu
                    );

                    return (
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (isDataIbuTersalin) {
                              toast.info("Data ibu sudah tersalin dan sama.");
                              return;
                            }
                            setFormData({ ...formData, nama_wali: formData.nama_ibu || "", nik_wali: formData.nik_ibu || "", no_hp_wali: formData.no_hp_ibu || "", status: "Hidup" })
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${isDataIbuTersalin ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                        >
                          Salin Data Ibu sebagai Wali Utama
                        </button>
                      </div>
                    );
                  })()}
                  <div>
                    <label className={labelClass}>Nama Wali Utama <span className="text-red-500">*</span></label>
                    <input required type="text" value={formData.nama_wali || ""} onChange={e => setFormData({ ...formData, nama_wali: e.target.value })} className={inputClass} placeholder="Nama Lengkap" />
                  </div>
                  <div>
                    <label className={labelClass}>NIK Wali Utama <span className="text-red-500">*</span></label>
                    <input required type="text" value={formData.nik_wali || ""} onChange={e => setFormData({ ...formData, nik_wali: e.target.value })} className={`${inputClass} ${isNikDuplikat ? 'border-red-400' : ''}`} placeholder="Nomor Induk Kependudukan" />
                    {isNikDuplikat && <FieldError message="NIK sudah terdaftar" />}
                  </div>
                  <div>
                    <label className={labelClass}>Status Wali Utama <span className="text-red-500">*</span></label>
                    <select required value={formData.status || "Hidup"} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className={inputClass}>
                      <option value="Hidup">Hidup</option>
                      <option value="Wafat">Wafat</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>No. HP Wali <span className="text-red-500">*</span></label>
                    <input required type="text" value={formData.no_hp_wali || ""} onChange={e => setFormData({ ...formData, no_hp_wali: e.target.value })} className={inputClass} />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm border border-blue-100">
                    Karena status Ayah masih hidup, data pribadi Wali Utama akan otomatis ditautkan ke Ayah. Anda hanya perlu melengkapi alamat di bawah ini.
                  </div>
                </div>
              )}
              <div className="sm:col-span-2">
                <label className={labelClass}>Alamat Wali Utama <span className="text-red-500">*</span></label>
                <textarea required value={formData.alamat || ""} onChange={e => setFormData({ ...formData, alamat: e.target.value })} className={`${inputClass} min-h-25`} placeholder="Alamat lengkap" />
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 pt-4 border-t sticky bottom-0 bg-white">
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
              {selectedWali ? "Simpan Perubahan" : "Simpan Data"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
