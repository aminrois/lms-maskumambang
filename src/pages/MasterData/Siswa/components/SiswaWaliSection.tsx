import React, { useState, useMemo } from "react";
import { Users, UserPlus, Search, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

export interface WaliEmbeddedForm {
  status_ayah: "Hidup" | "Wafat";
  nama_ayah: string;
  nik_ayah: string;
  no_hp_ayah: string;
  pekerjaan_ayah?: string;

  status_ibu: "Hidup" | "Wafat";
  nama_ibu: string;
  nik_ibu: string;
  no_hp_ibu: string;
  pekerjaan_ibu?: string;

  status: "Hidup" | "Wafat";
  nama_wali: string;
  nik_wali: string;
  no_hp_wali: string;
  alamat: string;
}

export const initialWaliEmbedded: WaliEmbeddedForm = {
  status_ayah: "Hidup",
  nama_ayah: "",
  nik_ayah: "",
  no_hp_ayah: "",
  pekerjaan_ayah: "",

  status_ibu: "Hidup",
  nama_ibu: "",
  nik_ibu: "",
  no_hp_ibu: "",
  pekerjaan_ibu: "",

  status: "Hidup",
  nama_wali: "",
  nik_wali: "",
  no_hp_wali: "",
  alamat: "",
};

interface SiswaWaliSectionProps {
  modeWali: "pilih" | "baru";
  setModeWali: (mode: "pilih" | "baru") => void;
  selectedWaliId: number | null;
  setSelectedWaliId: (id: number | null) => void;
  dataWaliList: any[];
  getNamaWaliUtama: (wali: any) => string;
  waliFormData: WaliEmbeddedForm;
  setWaliFormData: React.Dispatch<React.SetStateAction<WaliEmbeddedForm>>;
  alamatSiswa?: string;
}

export default function SiswaWaliSection({
  modeWali,
  setModeWali,
  selectedWaliId,
  setSelectedWaliId,
  dataWaliList,
  getNamaWaliUtama,
  waliFormData,
  setWaliFormData,
  alamatSiswa = "",
}: SiswaWaliSectionProps) {
  const [waliSearch, setWaliSearch] = useState("");
  const inputClass = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white";
  const labelClass = "text-xs font-semibold text-gray-700 mb-1 block";

  // Filtered wali list for dropdown/search
  const filteredWali = useMemo(() => {
    if (!waliSearch.trim()) return dataWaliList;
    const q = waliSearch.toLowerCase();
    return dataWaliList.filter((w: any) => {
      const nama = getNamaWaliUtama(w).toLowerCase();
      const nik = (w.nik_wali || w.nik_ayah || "").toLowerCase();
      const anak = (w.siswa || []).map((s: any) => s.nama?.toLowerCase()).join(" ");
      return nama.includes(q) || nik.includes(q) || anak.includes(q);
    });
  }, [dataWaliList, waliSearch, getNamaWaliUtama]);

  const activeSelectedWali = useMemo(() => {
    if (!selectedWaliId) return null;
    return dataWaliList.find((w: any) => w.wali_id === selectedWaliId) || null;
  }, [selectedWaliId, dataWaliList]);

  // Real-time Sibling / Existing Family detection
  const detectedFamily = useMemo(() => {
    if (modeWali !== "baru") return null;
    const nikWali = waliFormData.nik_wali?.trim();
    const nikAyah = waliFormData.nik_ayah?.trim();
    const nikIbu = waliFormData.nik_ibu?.trim();

    if (!nikWali && !nikAyah && !nikIbu) return null;

    return dataWaliList.find((w: any) => {
      const wNikWali = w.nik_wali?.trim();
      const wNikAyah = w.nik_ayah?.trim();
      const wNikIbu = w.nik_ibu?.trim();

      const matchWali = nikWali && (wNikWali === nikWali || wNikAyah === nikWali);
      const matchAyah = nikAyah && (wNikAyah === nikAyah || wNikWali === nikAyah);
      const matchIbu = nikIbu && (wNikIbu === nikIbu || wNikWali === nikIbu);

      return Boolean(matchWali || matchAyah || matchIbu);
    }) || null;
  }, [modeWali, waliFormData.nik_wali, waliFormData.nik_ayah, waliFormData.nik_ibu, dataWaliList]);

  // Auto-fill logic when user changes Ayah or Ibu in Mode Baru
  const handleAyahChange = (field: keyof WaliEmbeddedForm, value: any) => {
    setWaliFormData((prev) => {
      const next = { ...prev, [field]: value };
      // If status_ayah is Hidup, default wali follows Ayah unless admin explicitly customized
      if (next.status_ayah === "Hidup") {
        if (field === "nama_ayah" && (!prev.nama_wali || prev.nama_wali === prev.nama_ayah)) {
          next.nama_wali = value;
        }
        if (field === "nik_ayah" && (!prev.nik_wali || prev.nik_wali === prev.nik_ayah)) {
          next.nik_wali = value;
        }
        if (field === "no_hp_ayah" && (!prev.no_hp_wali || prev.no_hp_wali === prev.no_hp_ayah)) {
          next.no_hp_wali = value;
        }
        next.status = "Hidup";
      }
      return next;
    });
  };

  const handleIbuChange = (field: keyof WaliEmbeddedForm, value: any) => {
    setWaliFormData((prev) => {
      const next = { ...prev, [field]: value };
      // If status_ayah is Wafat and Ibu is Hidup, default wali follows Ibu unless admin customized
      if (next.status_ayah === "Wafat" && next.status_ibu === "Hidup") {
        if (field === "nama_ibu" && (!prev.nama_wali || prev.nama_wali === prev.nama_ibu)) {
          next.nama_wali = value;
        }
        if (field === "nik_ibu" && (!prev.nik_wali || prev.nik_wali === prev.nik_ibu)) {
          next.nik_wali = value;
        }
        if (field === "no_hp_ibu" && (!prev.no_hp_wali || prev.no_hp_wali === prev.no_hp_ibu)) {
          next.no_hp_wali = value;
        }
        next.status = "Hidup";
      }
      return next;
    });
  };

  const handleCopyAyah = () => {
    setWaliFormData((prev) => ({
      ...prev,
      nama_wali: prev.nama_ayah || "",
      nik_wali: prev.nik_ayah || "",
      no_hp_wali: prev.no_hp_ayah || "",
      status: prev.status_ayah || "Hidup",
    }));
    toast.success("Data Ayah disalin ke Wali Utama");
  };

  const handleCopyIbu = () => {
    setWaliFormData((prev) => ({
      ...prev,
      nama_wali: prev.nama_ibu || "",
      nik_wali: prev.nik_ibu || "",
      no_hp_wali: prev.no_hp_ibu || "",
      status: prev.status_ibu || "Hidup",
    }));
    toast.success("Data Ibu disalin ke Wali Utama");
  };

  const handleCopyAlamat = () => {
    if (!alamatSiswa) {
      toast.warning("Alamat santri masih kosong");
      return;
    }
    setWaliFormData((prev) => ({ ...prev, alamat: alamatSiswa }));
    toast.success("Alamat santri disalin ke Alamat Wali");
  };

  return (
    <div className="border border-blue-100 rounded-xl p-4 bg-slate-50/60 space-y-4">
      {/* Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h4 className="text-sm font-bold text-blue-950 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-700" />
            Data Orang Tua / Wali Murid
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih wali yang sudah terdaftar (misal punya saudara/kakak), atau input data baru sekaligus.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shrink-0">
          <button
            type="button"
            onClick={() => setModeWali("pilih")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              modeWali === "pilih"
                ? "bg-blue-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Pilih Wali Terdaftar
          </button>
          <button
            type="button"
            onClick={() => setModeWali("baru")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              modeWali === "baru"
                ? "bg-blue-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Input Wali Baru Sekaligus
          </button>
        </div>
      </div>

      {/* MODE A: Pilih Wali Terdaftar */}
      {modeWali === "pilih" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Cari & Pilih Wali Murid</label>
              <div className="relative">
                <select
                  value={selectedWaliId || ""}
                  onChange={(e) => setSelectedWaliId(e.target.value ? parseInt(e.target.value) : null)}
                  className={inputClass}
                >
                  <option value="">-- Pilih Wali Murid (atau cari di bawah) --</option>
                  {filteredWali.map((w: any) => {
                    const anakList = (w.siswa || []).map((s: any) => s.nama).filter(Boolean);
                    const labelAnak = anakList.length > 0 ? ` (Anak: ${anakList.join(", ")})` : "";
                    const nik = w.nik_wali || w.nik_ayah ? ` - [NIK: ${w.nik_wali || w.nik_ayah}]` : "";
                    return (
                      <option key={w.wali_id} value={w.wali_id}>
                        {getNamaWaliUtama(w)} {nik} {labelAnak}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Filter Cepat Nama / NIK / Nama Anak</label>
              <input
                type="text"
                value={waliSearch}
                onChange={(e) => setWaliSearch(e.target.value)}
                placeholder="Ketik untuk menyaring daftar pilihan..."
                className={inputClass}
              />
            </div>
          </div>

          {activeSelectedWali && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-start justify-between gap-3">
              <div>
                <p className="font-bold flex items-center gap-1 text-blue-950">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Wali Terpilih: {getNamaWaliUtama(activeSelectedWali)}
                </p>
                <p className="text-slate-600 mt-1">
                  NIK: <span className="font-mono font-medium">{activeSelectedWali.nik_wali || activeSelectedWali.nik_ayah || "—"}</span> | No. HP: {activeSelectedWali.no_hp_wali || activeSelectedWali.no_hp_ayah || "—"}
                </p>
                {activeSelectedWali.siswa && activeSelectedWali.siswa.length > 0 && (
                  <p className="text-emerald-700 mt-1 font-medium">
                    👨‍👩‍👧 Saudara/Anak lain di sistem: {activeSelectedWali.siswa.map((s: any) => s.nama).join(", ")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedWaliId(null)}
                className="text-xs text-red-600 hover:text-red-700 font-semibold underline shrink-0"
              >
                Lepas Pilihan
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE B: Input Wali Baru Sekaligus */}
      {modeWali === "baru" && (
        <div className="space-y-4">
          {/* Banner Deteksi Saudara Kandung / Keluarga Terdaftar */}
          {detectedFamily && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-emerald-900">
                    💡 Terdeteksi: Keluarga ini sudah terdaftar di sistem!
                  </p>
                  <p className="text-emerald-800 mt-0.5">
                    NIK ini cocok dengan Wali <strong>{getNamaWaliUtama(detectedFamily)}</strong> (NIK: {detectedFamily.nik_wali || detectedFamily.nik_ayah}).
                    {detectedFamily.siswa && detectedFamily.siswa.length > 0 && (
                      <span className="block mt-0.5 text-emerald-700 font-medium">
                        Saudara kandung santri: {detectedFamily.siswa.map((s: any) => s.nama).join(", ")}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedWaliId(detectedFamily.wali_id);
                  setModeWali("pilih");
                  toast.success(`Santri berhasil ditautkan ke keluarga ${getNamaWaliUtama(detectedFamily)}!`);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors shrink-0 shadow-sm"
              >
                Tautkan ke Wali Ini
              </button>
            </div>
          )}

          {/* Tab / Bagian Data Ayah & Ibu */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Kartu Data Ayah */}
            <div className="border border-slate-200 bg-white rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Data Ayah</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Status:</span>
                  <select
                    value={waliFormData.status_ayah}
                    onChange={(e) => handleAyahChange("status_ayah", e.target.value as any)}
                    className="text-xs border rounded px-2 py-1 font-semibold"
                  >
                    <option value="Hidup">Hidup</option>
                    <option value="Wafat">Wafat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nama Ayah</label>
                  <input
                    type="text"
                    value={waliFormData.nama_ayah}
                    onChange={(e) => handleAyahChange("nama_ayah", e.target.value)}
                    placeholder="Nama Lengkap Ayah"
                    className={inputClass}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className={labelClass}>NIK Ayah</label>
                    {waliFormData.nik_ayah && (
                      <span className={`text-[10px] font-medium ${waliFormData.nik_ayah.length === 16 ? 'text-emerald-600 font-semibold' : 'text-amber-600'}`}>
                        {waliFormData.nik_ayah.length}/16 digit
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={waliFormData.nik_ayah}
                    onChange={(e) => handleAyahChange("nik_ayah", e.target.value.replace(/[^0-9-]/g, ""))}
                    placeholder="16 digit angka KTP"
                    className={`${inputClass} font-mono`}
                    maxLength={16}
                  />
                </div>
                <div>
                  <label className={labelClass}>No. HP Ayah</label>
                  <input
                    type="text"
                    value={waliFormData.no_hp_ayah}
                    onChange={(e) => handleAyahChange("no_hp_ayah", e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Pekerjaan Ayah</label>
                  <input
                    type="text"
                    value={waliFormData.pekerjaan_ayah || ""}
                    onChange={(e) => handleAyahChange("pekerjaan_ayah", e.target.value)}
                    placeholder="PNS / Swasta / Wiraswasta"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Kartu Data Ibu */}
            <div className="border border-slate-200 bg-white rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Data Ibu</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Status:</span>
                  <select
                    value={waliFormData.status_ibu}
                    onChange={(e) => handleIbuChange("status_ibu", e.target.value as any)}
                    className="text-xs border rounded px-2 py-1 font-semibold"
                  >
                    <option value="Hidup">Hidup</option>
                    <option value="Wafat">Wafat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nama Ibu</label>
                  <input
                    type="text"
                    value={waliFormData.nama_ibu}
                    onChange={(e) => handleIbuChange("nama_ibu", e.target.value)}
                    placeholder="Nama Lengkap Ibu"
                    className={inputClass}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className={labelClass}>NIK Ibu</label>
                    {waliFormData.nik_ibu && (
                      <span className={`text-[10px] font-medium ${waliFormData.nik_ibu.length === 16 ? 'text-emerald-600 font-semibold' : 'text-amber-600'}`}>
                        {waliFormData.nik_ibu.length}/16 digit
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={waliFormData.nik_ibu}
                    onChange={(e) => handleIbuChange("nik_ibu", e.target.value.replace(/[^0-9-]/g, ""))}
                    placeholder="16 digit angka KTP"
                    className={`${inputClass} font-mono`}
                    maxLength={16}
                  />
                </div>
                <div>
                  <label className={labelClass}>No. HP Ibu</label>
                  <input
                    type="text"
                    value={waliFormData.no_hp_ibu}
                    onChange={(e) => handleIbuChange("no_hp_ibu", e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Pekerjaan Ibu</label>
                  <input
                    type="text"
                    value={waliFormData.pekerjaan_ibu || ""}
                    onChange={(e) => handleIbuChange("pekerjaan_ibu", e.target.value)}
                    placeholder="Ibu Rumah Tangga / Guru / dll"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Kartu Wali Utama (Akun Login Portal) */}
          <div className="border border-indigo-200 bg-indigo-50/40 rounded-lg p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2">
              <div>
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                  Profil Wali Utama (Akun Login Portal Wali Santri)
                </span>
                <p className="text-[11px] text-slate-500">
                  Otomatis terisi dari Ayah/Ibu. <strong>Admin tetap dapat mengedit NIK dan Nama Wali secara bebas.</strong>
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {waliFormData.nama_ayah && (
                  <button
                    type="button"
                    onClick={handleCopyAyah}
                    className="px-2 py-1 text-[11px] font-semibold bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded"
                  >
                    Ikuti Ayah
                  </button>
                )}
                {waliFormData.nama_ibu && (
                  <button
                    type="button"
                    onClick={handleCopyIbu}
                    className="px-2 py-1 text-[11px] font-semibold bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded"
                  >
                    Ikuti Ibu
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Nama Wali Utama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={waliFormData.nama_wali}
                  onChange={(e) => setWaliFormData({ ...waliFormData, nama_wali: e.target.value })}
                  placeholder="Nama Lengkap Wali"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>
                    NIK Wali Utama (Username Login) <span className="text-red-500">*</span>
                  </label>
                  {waliFormData.nik_wali && (
                    <span className={`text-[10px] font-medium ${waliFormData.nik_wali.length === 16 ? 'text-emerald-600 font-semibold' : 'text-amber-600'}`}>
                      {waliFormData.nik_wali.length}/16 digit
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={waliFormData.nik_wali}
                  onChange={(e) => setWaliFormData({ ...waliFormData, nik_wali: e.target.value.replace(/[^0-9-]/g, "") })}
                  placeholder="16 digit angka KTP"
                  className={`${inputClass} font-mono`}
                  maxLength={16}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Status Wali Utama <span className="text-red-500">*</span>
                </label>
                <select
                  value={waliFormData.status}
                  onChange={(e) => setWaliFormData({ ...waliFormData, status: e.target.value as any })}
                  className={inputClass}
                >
                  <option value="Hidup">Hidup</option>
                  <option value="Wafat">Wafat</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  No. HP Wali Utama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={waliFormData.no_hp_wali}
                  onChange={(e) => setWaliFormData({ ...waliFormData, no_hp_wali: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>
                    Alamat Domisili Wali <span className="text-red-500">*</span>
                  </label>
                  {alamatSiswa && (
                    <button
                      type="button"
                      onClick={handleCopyAlamat}
                      className="text-[10px] text-blue-700 hover:underline font-semibold"
                    >
                      Salin Alamat Santri
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={waliFormData.alamat}
                  onChange={(e) => setWaliFormData({ ...waliFormData, alamat: e.target.value })}
                  placeholder="Alamat lengkap tempat tinggal wali"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
