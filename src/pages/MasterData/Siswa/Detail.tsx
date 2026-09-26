import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Camera,
  Save,
  Trash2,
  Home,
  HeartPulse,
  Briefcase,
  GraduationCap,
  Sparkles,
  MessageSquare,
  User,
  Plus,
  Share2,
  Calendar,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";


const API_GUIDANCE = "/api/v1/guidance";

export default function MasterDataSiswaDetail() {
  const { siswa_id } = useParams<{ siswa_id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<
    "biodata" | "tempat_tinggal" | "sosial" | "kesehatan" | "internship" | "lanjutan" | "fundamental" | "konseling"
  >("biodata");

  // State Form Guidance 360°
  const [formData, setFormData] = useState<any>({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Modal Konseling
  const [showAddKonselingModal, setShowAddKonselingModal] = useState(false);
  const [konselingForm, setKonselingForm] = useState({
    tanggal_sesi: new Date().toISOString().slice(0, 10),
    kategori: "Akademik",
    topik_konseling: "",
    keluhan_masalah: "",
    dinamika_konseling: "",
    solusi_kesepakatan: "",
    status_follow_up: "Dalam Pemantauan",
    sifat_rahasia: "Internal Guru/Wali Kelas",
    catatan_tindak_lanjut: "",
  });

  // Query Fetch Siswa + Guidance Detail
  const { data: detailData, isLoading } = useQuery({
    queryKey: ["siswa-detail-360", siswa_id],
    queryFn: async () => {
      const res = await axios.get(`${API_GUIDANCE}/siswa/${siswa_id}`);
      return res.data?.data;
    },
    enabled: !!siswa_id,
  });

  const siswa = detailData;
  const guidance = detailData?.guidance_detail;
  const konselingList = detailData?.konseling_sesi || [];

  useEffect(() => {
    if (guidance) {
      setFormData({
        ...guidance,
      });
    } else {
      setFormData({
        transportasi: "Motor",
        kepemilikan_rumah: "Milik Sendiri",
        daya_listrik: "1.300 VA",
        sumber_air: "Sumur Bor",
        akses_internet: "Wifi",
        perangkat_belajar: "Ada",
        merokok: "Tidak",
        lanjut_kuliah: "Ya",
        skor_wudhu: 3,
        skor_doa_sholat: 3,
        skor_praktik_sholat: 3,
        skor_jamaah_masjid: 3,
        skor_alquran: 3,
        skor_hafalan_juz30: 3,
        skor_disiplin: 3,
        skor_rapi: 3,
        skor_adab: 3,
      });
    }
  }, [guidance]);

  // Mutation Save Guidance
  const saveGuidanceMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.put(`${API_GUIDANCE}/siswa/${siswa_id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Profil bimbingan santri berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["siswa-detail-360", siswa_id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan perubahan.");
    },
  });

  // Mutation Upload / Change Photo (Base64)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format file harus berupa gambar (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 3 MB.");
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = reader.result as string;
        await axios.patch(`${API_GUIDANCE}/siswa/${siswa_id}/foto`, { foto: base64String });
        toast.success("Foto profil santri berhasil diperbarui!");
        queryClient.invalidateQueries({ queryKey: ["siswa-detail-360", siswa_id] });
      } catch (err: any) {
        toast.error("Gagal mengunggah foto profil.");
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm("Hapus foto profil santri ini?")) return;
    try {
      setIsUploadingPhoto(true);
      await axios.patch(`${API_GUIDANCE}/siswa/${siswa_id}/foto`, { foto: null });
      toast.success("Foto profil berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["siswa-detail-360", siswa_id] });
    } catch (err: any) {
      toast.error("Gagal menghapus foto.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Mutation Create Konseling
  const addKonselingMutation = useMutation({
    mutationFn: async (payload: typeof konselingForm) => {
      const res = await axios.post(`${API_GUIDANCE}/konseling`, {
        ...payload,
        siswa_id: Number(siswa_id),
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Catatan konsultasi berhasil disimpan!");
      setShowAddKonselingModal(false);
      setKonselingForm({
        tanggal_sesi: new Date().toISOString().slice(0, 10),
        kategori: "Akademik",
        topik_konseling: "",
        keluhan_masalah: "",
        dinamika_konseling: "",
        solusi_kesepakatan: "",
        status_follow_up: "Dalam Pemantauan",
        sifat_rahasia: "Internal Guru/Wali Kelas",
        catatan_tindak_lanjut: "",
      });
      queryClient.invalidateQueries({ queryKey: ["siswa-detail-360", siswa_id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan sesi konsultasi.");
    },
  });

  // Mutation Delete Konseling
  const deleteKonselingMutation = useMutation({
    mutationFn: async (konseling_id: number) => {
      const res = await axios.delete(`${API_GUIDANCE}/konseling/${konseling_id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Catatan konsultasi berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["siswa-detail-360", siswa_id] });
    },
  });

  const fundamentalItems = [
    { key: "skor_wudhu", label: "1. Wudhu", desc: "Ketepatan rukun, sunnah, dan tertib wudhu" },
    { key: "skor_doa_sholat", label: "2. Do'a Sholat", desc: "Hafalan bacaan iftitah, ruku, sujud, tasyahud & qunut" },
    { key: "skor_praktik_sholat", label: "3. Praktik Sholat", desc: "Gerakan sholat, thuma'ninah dan kekhusyukan" },
    { key: "skor_jamaah_masjid", label: "4. Sholat Jama'ah di Masjid", desc: "Kedisiplinan hadir sholat 5 waktu di masjid" },
    { key: "skor_alquran", label: "5. Al-Qur'an (Tilawah/Tahsin)", desc: "Kelancaran tajwid, makharijul huruf & tilawah harian" },
    { key: "skor_hafalan_juz30", label: "6. Hafalan Juz 30", desc: "Kelancaran hafalan juz amma dan muroja'ah" },
    { key: "skor_disiplin", label: "7. Disiplin Waktu & Aturan", desc: "Kepatuhan jadwal bangun, KBM, halaqoh & istirahat" },
    { key: "skor_rapi", label: "8. Kerapihan Diri & Asrama", desc: "Kerapihan pakaian, lemari, ranjang & kebersihan diri" },
    { key: "skor_adab", label: "9. Adab & Akhlaqul Karimah", desc: "Sopan santun kepada guru, murobbi, orang tua & kawan" },
  ];

  const skorLabels: { [key: number]: { label: string; color: string; bg: string } } = {
    1: { label: "1 - Belum Bisa", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
    2: { label: "2 - Bisa", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    3: { label: "3 - Bisa, Butuh Kontrol", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    4: { label: "4 - Mandiri & Istiqomah", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 rounded-full border-4 border-[#162E6E] border-t-amber-400 animate-spin mb-3" />
        <span className="text-sm font-semibold text-slate-600">Memuat profil lengkap santri...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ═══════════════════════════════════════════════════════
          HEADER PROFIL SANTRI & FOTO UPLOAD
      ════════════════════════════════════════════════════════ */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Tombol Back */}
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all cursor-pointer shrink-0 self-start"
            title="Kembali"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Avatar / Foto dengan Upload Trigger */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#162E6E] to-[#254ea8] text-white font-bold flex items-center justify-center text-3xl shadow-md overflow-hidden border-2 border-white">
              {siswa?.foto ? (
                <img
                  src={siswa.foto}
                  alt={siswa.nama}
                  className="w-full h-full object-cover"
                />
              ) : (
                siswa?.nama?.charAt(0) || "S"
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute -bottom-2 -right-2 p-2 bg-[#162E6E] hover:bg-[#112457] text-white rounded-xl shadow-lg border-2 border-white transition-all cursor-pointer group-hover:scale-105"
              title="Unggah / Ubah Foto Santri"
            >
              <Camera className="w-4 h-4" />
            </button>

            {siswa?.foto && (
              <button
                onClick={handleRemovePhoto}
                disabled={isUploadingPhoto}
                className="absolute -top-2 -right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md border-2 border-white transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                title="Hapus Foto"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Info Pokok Santri */}
          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-bold text-slate-800">{siswa?.nama}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  siswa?.status === "Aktif"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : siswa?.status === "Alumni"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {siswa?.status || "Aktif"}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              NIS: <span className="text-slate-700 font-bold">{siswa?.nis || "—"}</span> • NISN:{" "}
              <span className="text-slate-700 font-bold">{siswa?.nisn || "—"}</span> • NIK:{" "}
              <span className="text-slate-700">{siswa?.nik || "—"}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="bg-[#162E6E]/10 text-[#162E6E] px-2.5 py-1 rounded-lg text-xs font-bold">
                {siswa?.kelas?.lembaga?.nama_lembaga || "Lembaga"}
              </span>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                Kelas: {siswa?.kelas?.nama_kelas || "—"}
              </span>
              <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-semibold border border-amber-200">
                Asrama: {siswa?.keterangan_asrama === "Ya" ? "Santri Mukim" : "Non-Asrama"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center sm:justify-end gap-3">
          <button
            onClick={() => saveGuidanceMutation.mutate(formData)}
            disabled={saveGuidanceMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saveGuidanceMutation.isPending ? "Menyimpan..." : "Simpan Profil Santri"}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          NAVIGATION TABS
      ════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: "biodata", label: "Biodata & Keluarga", icon: User },
          { id: "tempat_tinggal", label: "Tempat Tinggal & Fasilitas", icon: Home },
          { id: "sosial", label: "Data Sosial & Digital", icon: Share2 },
          { id: "kesehatan", label: "Riwayat Kesehatan", icon: HeartPulse },
          { id: "internship", label: "Rencana Internship / Dakwah", icon: Briefcase },
          { id: "lanjutan", label: "Pendidikan Lanjutan", icon: GraduationCap },
          { id: "fundamental", label: "9 Aspek Fundamental", icon: Sparkles },
          { id: "konseling", label: `Sesi Konsultasi (${konselingList.length})`, icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#162E6E] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════
          TAB 0: BIODATA POKOK & KELUARGA
      ════════════════════════════════════════════════════════ */}
      {activeTab === "biodata" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
            <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Identitas Pribadi Santri</h3>
                <p className="text-xs text-slate-500">Data identitas pokok terdaftar di database madrasah</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5 font-semibold">Nama Lengkap</span>
                <span className="font-bold text-slate-800 text-sm">{siswa?.nama || "—"}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5 font-semibold">Nama Panggilan</span>
                <span className="font-bold text-slate-800 text-sm">{siswa?.panggilan || "—"}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5 font-semibold">Jenis Kelamin</span>
                <span className="font-bold text-slate-800 text-sm">
                  {siswa?.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5 font-semibold">Tempat, Tanggal Lahir</span>
                <span className="font-bold text-slate-800 text-sm">
                  {siswa?.tempat_lahir || "—"}, {siswa?.tanggal_lahir || "—"}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5 font-semibold">Agama & Kewarganegaraan</span>
                <span className="font-bold text-slate-800 text-sm">
                  {siswa?.agama || "Islam"} ({siswa?.kewarganegaraan || "WNI"})
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5 font-semibold">Tahun Masuk & Asal Sekolah</span>
                <span className="font-bold text-slate-800 text-sm">
                  {siswa?.tahun_masuk || "—"} • {siswa?.asal_sekolah || "—"}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 md:col-span-3">
                <span className="text-slate-400 block mb-0.5 font-semibold">Alamat Lengkap</span>
                <span className="font-bold text-slate-800 text-sm">
                  {siswa?.alamat || "—"}
                  {siswa?.rt && ` RT ${siswa.rt}`}
                  {siswa?.rw && ` / RW ${siswa.rw}`}
                  {siswa?.desa_kelurahan && `, Desa/Kel. ${siswa.desa_kelurahan}`}
                  {siswa?.kecamatan && `, Kec. ${siswa.kecamatan}`}
                  {siswa?.kabupaten_kota && `, Kab/Kota ${siswa.kabupaten_kota}`}
                  {siswa?.provinsi && `, Prov. ${siswa.provinsi}`}
                  {siswa?.kode_pos && ` (${siswa.kode_pos})`}
                </span>
              </div>
            </div>
          </div>

          {/* Info Orang Tua / Wali */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
            <div className="border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Data Orang Tua & Wali Santri</h3>
              <p className="text-xs text-slate-500">Informasi kontak keluarga dan penanggung jawab santri</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Ayah */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-[#162E6E] font-bold">
                  <User className="w-4 h-4" />
                  <span>Data Ayah</span>
                </div>
                <div className="space-y-1 text-slate-700">
                  <p><span className="text-slate-400">Nama:</span> <span className="font-bold">{siswa?.wali_murid?.nama_ayah || "—"}</span></p>
                  <p><span className="text-slate-400">Status:</span> {siswa?.wali_murid?.status_ayah || "—"}</p>
                  <p><span className="text-slate-400">No HP:</span> {siswa?.wali_murid?.no_hp_ayah || "—"}</p>
                  <p><span className="text-slate-400">Pekerjaan:</span> {siswa?.wali_murid?.pekerjaan_ayah || "—"}</p>
                </div>
              </div>

              {/* Ibu */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 font-bold">
                  <User className="w-4 h-4" />
                  <span>Data Ibu</span>
                </div>
                <div className="space-y-1 text-slate-700">
                  <p><span className="text-slate-400">Nama:</span> <span className="font-bold">{siswa?.wali_murid?.nama_ibu || "—"}</span></p>
                  <p><span className="text-slate-400">Status:</span> {siswa?.wali_murid?.status_ibu || "—"}</p>
                  <p><span className="text-slate-400">No HP:</span> {siswa?.wali_murid?.no_hp_ibu || "—"}</p>
                  <p><span className="text-slate-400">Pekerjaan:</span> {siswa?.wali_murid?.pekerjaan_ibu || "—"}</p>
                </div>
              </div>

              {/* Wali */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <User className="w-4 h-4" />
                  <span>Wali Utama</span>
                </div>
                <div className="space-y-1 text-slate-700">
                  <p><span className="text-slate-400">Nama Wali:</span> <span className="font-bold">{siswa?.wali_murid?.nama_wali || "—"}</span></p>
                  <p><span className="text-slate-400">No HP Wali:</span> {siswa?.wali_murid?.no_hp_wali || "—"}</p>
                  <p><span className="text-slate-400">Alamat Wali:</span> {siswa?.wali_murid?.alamat || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 1: TEMPAT TINGGAL & FASILITAS
      ════════════════════════════════════════════════════════ */}
      {activeTab === "tempat_tinggal" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="border-b pb-3 border-slate-100">
            <h3 className="text-base font-bold text-slate-800">1. Data Tempat Tinggal & Fasilitas Santri</h3>
            <p className="text-xs text-slate-500">Kondisi mobilitas, kepemilikan rumah, dan sarana belajar daring di rumah</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">1. JARAK RUMAH-SEKOLAH</label>
              <input
                type="text"
                placeholder="Contoh: 5 km / 500 meter"
                value={formData.jarak_rumah_sekolah || ""}
                onChange={(e) => setFormData({ ...formData, jarak_rumah_sekolah: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">2. TRANSPORTASI</label>
              <select
                value={formData.transportasi || "Motor"}
                onChange={(e) => setFormData({ ...formData, transportasi: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                {["Antar Jemput", "Jalan Kaki", "Motor", "Mobil", "Lainnya"].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">3. KEPEMILIKAN RUMAH</label>
              <select
                value={formData.kepemilikan_rumah || "Milik Sendiri"}
                onChange={(e) => setFormData({ ...formData, kepemilikan_rumah: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                {["Kontrak", "Milik Sendiri"].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">4. DAYA LISTRIK</label>
              <select
                value={formData.daya_listrik || "1.300 VA"}
                onChange={(e) => setFormData({ ...formData, daya_listrik: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                {["450 VA", "900 VA", "1.300 VA", "2.200 VA", "3.500 VA", "4.400 VA", "5.500 VA", "Lebih dari 5.500"].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">5. SUMBER AIR MINUM</label>
              <select
                value={formData.sumber_air || "Sumur Bor"}
                onChange={(e) => setFormData({ ...formData, sumber_air: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                {["PDAM / PAM", "Sumur Bor"].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">6. AKSES INTERNET</label>
              <select
                value={formData.akses_internet || "Wifi"}
                onChange={(e) => setFormData({ ...formData, akses_internet: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                {["Paket Data", "Wifi", "Paket data + wifi", "Tidak ada"].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">7. PERANGKAT BELAJAR DARING</label>
              <select
                value={formData.perangkat_belajar || "Ada"}
                onChange={(e) => setFormData({ ...formData, perangkat_belajar: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                {["Ada", "Tidak"].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 2: DATA SOSIAL & DIGITAL
      ════════════════════════════════════════════════════════ */}
      {activeTab === "sosial" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="border-b pb-3 border-slate-100">
            <h3 className="text-base font-bold text-slate-800">2. Data Sosial & Kontak Digital Santri</h3>
            <p className="text-xs text-slate-500">Nomor kontak pribadi santri dan akun media sosial</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">1. No HP Siswa</label>
              <input
                type="text"
                placeholder="Contoh: 08123456789"
                value={formData.no_hp_siswa || ""}
                onChange={(e) => setFormData({ ...formData, no_hp_siswa: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">2. Email Siswa</label>
              <input
                type="email"
                placeholder="Contoh: santri@gmail.com"
                value={formData.email_siswa || ""}
                onChange={(e) => setFormData({ ...formData, email_siswa: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">3. Instagram</label>
              <input
                type="text"
                placeholder="Contoh: @username"
                value={formData.instagram || ""}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">4. Facebook</label>
              <input
                type="text"
                placeholder="Nama akun Facebook"
                value={formData.facebook || ""}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">5. Tiktok</label>
              <input
                type="text"
                placeholder="Contoh: @username_tiktok"
                value={formData.tiktok || ""}
                onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">6. Twitter / X</label>
              <input
                type="text"
                placeholder="Contoh: @handle_x"
                value={formData.twitter_x || ""}
                onChange={(e) => setFormData({ ...formData, twitter_x: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 3: RIWAYAT KESEHATAN & KONTAK DARURAT
      ════════════════════════════════════════════════════════ */}
      {activeTab === "kesehatan" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="border-b pb-3 border-slate-100">
            <h3 className="text-base font-bold text-slate-800">3. Riwayat Kesehatan & Kontak Darurat</h3>
            <p className="text-xs text-slate-500">Penting untuk penanganan medis & kesiapsiagaan asrama</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">1. MEROKOK</label>
              <select
                value={formData.merokok || "Tidak"}
                onChange={(e) => setFormData({ ...formData, merokok: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                {["Tidak", "Ya"].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">2. RIWAYAT PENYAKIT</label>
              <input
                type="text"
                placeholder="Contoh: Asma, Maag kronis, dll (kosongkan jika tidak ada)"
                value={formData.riwayat_penyakit || ""}
                onChange={(e) => setFormData({ ...formData, riwayat_penyakit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">3. RIWAYAT ALERGI</label>
              <input
                type="text"
                placeholder="Contoh: Alergi seafood, debu, obat tertentu"
                value={formData.riwayat_alergi || ""}
                onChange={(e) => setFormData({ ...formData, riwayat_alergi: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">4. RIWAYAT OPERASI</label>
              <input
                type="text"
                placeholder="Contoh: Operasi usus buntu tahun 2024"
                value={formData.riwayat_operasi || ""}
                onChange={(e) => setFormData({ ...formData, riwayat_operasi: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">5. GANGGUAN KESEHATAN</label>
              <input
                type="text"
                placeholder="Contoh: Migrain berkala, vertigo, dll"
                value={formData.gangguan_kesehatan || ""}
                onChange={(e) => setFormData({ ...formData, gangguan_kesehatan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">6. DALAM MASA PENGOBATAN</label>
              <input
                type="text"
                placeholder="Contoh: Obat rutin vitamin / resep dokter"
                value={formData.dalam_masa_pengobatan || ""}
                onChange={(e) => setFormData({ ...formData, dalam_masa_pengobatan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">7. ASURANSI KESEHATAN</label>
              <input
                type="text"
                placeholder="Contoh: BPJS Kesehatan / Asuransi Swasta"
                value={formData.asuransi_kesehatan || ""}
                onChange={(e) => setFormData({ ...formData, asuransi_kesehatan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Kontak Darurat (Isian Bebas) */}
          <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-3">
            <h4 className="font-bold text-rose-900 text-xs uppercase tracking-wider">8. KONTAK DARURAT KESEHATAN</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kontak Darurat</label>
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={formData.kontak_darurat_nama || ""}
                  onChange={(e) => setFormData({ ...formData, kontak_darurat_nama: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hubungan Keluarga</label>
                <input
                  type="text"
                  placeholder="Contoh: Paman / Kakak Kandung / Bibi"
                  value={formData.kontak_darurat_hubungan || ""}
                  onChange={(e) => setFormData({ ...formData, kontak_darurat_hubungan: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No HP Kontak Darurat</label>
                <input
                  type="text"
                  placeholder="Contoh: 081298765432"
                  value={formData.kontak_darurat_hp || ""}
                  onChange={(e) => setFormData({ ...formData, kontak_darurat_hp: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 4: RENCANA INTERNSHIP / DAKWAH
      ════════════════════════════════════════════════════════ */}
      {activeTab === "internship" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="border-b pb-3 border-slate-100">
            <h3 className="text-base font-bold text-slate-800">4. Rencana Internship & Praktik Dakwah</h3>
            <p className="text-xs text-slate-500">Proyeksi magang, pengabdian dakwah masyarakat & kompetensi keahlian</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">1. NAMA INSTANSI</label>
              <input
                type="text"
                placeholder="Contoh: PT Telkom / Lazis / Ponpes Cabang"
                value={formData.internship_instansi || ""}
                onChange={(e) => setFormData({ ...formData, internship_instansi: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">2. ALAMAT INSTANSI</label>
              <input
                type="text"
                placeholder="Contoh: Jl. Ahmad Yani No. 10 Surabaya"
                value={formData.internship_alamat || ""}
                onChange={(e) => setFormData({ ...formData, internship_alamat: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">3. BIDANG INSTANSI</label>
              <input
                type="text"
                placeholder="Contoh: Teknologi Informasi / Lembaga Sosial & Zakat / Pendidikan"
                value={formData.internship_bidang || ""}
                onChange={(e) => setFormData({ ...formData, internship_bidang: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">4. DIVISI</label>
              <input
                type="text"
                placeholder="Contoh: Digital Media / Public Relation / Pengajaran"
                value={formData.internship_divisi || ""}
                onChange={(e) => setFormData({ ...formData, internship_divisi: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">5. KOMPETENSI KEAHLIAN YANG DIKEMBANGKAN</label>
              <textarea
                rows={3}
                placeholder="Jelaskan keterampilan utama yang ditargetkan dalam masa internship/dakwah..."
                value={formData.internship_kompetensi || ""}
                onChange={(e) => setFormData({ ...formData, internship_kompetensi: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 5: RENCANA PENDIDIKAN LANJUTAN
      ════════════════════════════════════════════════════════ */}
      {activeTab === "lanjutan" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="border-b pb-3 border-slate-100">
            <h3 className="text-base font-bold text-slate-800">5. Rencana Pendidikan Lanjutan & Studi Tinggi</h3>
            <p className="text-xs text-slate-500">Pilihan karir akademik, prodi, dan target perguruan tinggi santri</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">1. LANJUT KULIAH</label>
              <select
                value={formData.lanjut_kuliah || "Ya"}
                onChange={(e) => setFormData({ ...formData, lanjut_kuliah: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                {["Ya", "Tidak"].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">2. TARGET PENDIDIKAN</label>
              <input
                type="text"
                placeholder="Contoh: S1 / Diploma 4 / Ma'had Aly / Timur Tengah"
                value={formData.target_pendidikan || ""}
                onChange={(e) => setFormData({ ...formData, target_pendidikan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">3. PROGRAM STUDI (PRODI)</label>
              <input
                type="text"
                placeholder="Contoh: Teknik Informatika / Syariah / Kedokteran / Pend. Bahasa Arab"
                value={formData.prodi_tujuan || ""}
                onChange={(e) => setFormData({ ...formData, prodi_tujuan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">4. PERGURUAN TINGGI / KAMPUS TUJUAN</label>
              <input
                type="text"
                placeholder="Contoh: ITS Surabaya / UIN Sunan Ampel / Univ. Al-Azhar Kairo"
                value={formData.universitas_tujuan || ""}
                onChange={(e) => setFormData({ ...formData, universitas_tujuan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">5. PERSIAPAN YANG DILAKUKAN</label>
              <input
                type="text"
                placeholder="Contoh: Bimbel UTBK, Kursus TOAFL / IELTS, Penguatan Tahfidz"
                value={formData.persiapan_kuliah || ""}
                onChange={(e) => setFormData({ ...formData, persiapan_kuliah: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">6. SUMBER BIAYA</label>
              <input
                type="text"
                placeholder="Contoh: Mandiri Orang Tua / Beasiswa KIP-K / Beasiswa LPDP"
                value={formData.sumber_biaya || ""}
                onChange={(e) => setFormData({ ...formData, sumber_biaya: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">7. JALUR MASUK</label>
              <input
                type="text"
                placeholder="Contoh: SNBP / SNBT / SPAN-PTKIN / Mandiri Prestasi"
                value={formData.jalur_masuk || ""}
                onChange={(e) => setFormData({ ...formData, jalur_masuk: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">8. DUKUNGAN YANG DIHARAPKAN DARI MADRASAH</label>
              <input
                type="text"
                placeholder="Contoh: Tryout intensif, surat rekomendasi, bimbingan konseling karir"
                value={formData.dukungan_diharapkan || ""}
                onChange={(e) => setFormData({ ...formData, dukungan_diharapkan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 6: 9 ASPEK FUNDAMENTAL (SKOR 1 - 4)
      ════════════════════════════════════════════════════════ */}
      {activeTab === "fundamental" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="border-b pb-3 border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-800">6. Penilaian 9 Aspek Fundamental Santri</h3>
              <p className="text-xs text-slate-500">Skala 1 - 4 (1: Belum Bisa, 2: Bisa, 3: Butuh Kontrol, 4: Mandiri & Istiqomah)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Keterangan:</span>
              {Object.entries(skorLabels).map(([num, item]) => (
                <span key={num} className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${item.bg} ${item.color}`}>
                  {num} = {item.label.split(" - ")[1]}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fundamentalItems.map((item) => {
              const currentVal = formData[item.key] || 3;
              return (
                <div key={item.key} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{item.label}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 pt-2">
                    {[1, 2, 3, 4].map((skor) => {
                      const isSelected = currentVal === skor;
                      const conf = skorLabels[skor];
                      return (
                        <button
                          key={skor}
                          type="button"
                          onClick={() => setFormData({ ...formData, [item.key]: skor })}
                          className={`py-2 text-center rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? `${conf.bg} ${conf.color} ring-2 ring-[#162E6E]`
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {skor}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 7: RIWAYAT SESI KONSELING
      ════════════════════════════════════════════════════════ */}
      {activeTab === "konseling" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="border-b pb-3 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Catatan Bimbingan & Konseling Santri</h3>
              <p className="text-xs text-slate-500">Rekam jejak konseling empat mata, penanganan kasus, dan tindak lanjut</p>
            </div>
            <button
              onClick={() => setShowAddKonselingModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Catat Sesi Baru
            </button>
          </div>

          {konselingList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm text-slate-600">Belum Ada Catatan Konseling</p>
              <p className="text-xs text-slate-400 mt-1">Klik tombol "Catat Sesi Baru" untuk membuat catatan bimbingan pertama.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {konselingList.map((sesi: any) => (
                <div
                  key={sesi.konseling_id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#162E6E]/10 text-[#162E6E]">
                        {sesi.kategori}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm">{sesi.topik_konseling}</h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(sesi.tanggal_sesi).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm("Hapus catatan konsultasi ini?")) {
                            deleteKonselingMutation.mutate(sesi.konseling_id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-600 block mb-1">Keluhan / Isu Pokok:</span>
                      <p className="text-slate-700 whitespace-pre-wrap">{sesi.keluhan_masalah}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-600 block mb-1">Dinamika / Refleksi:</span>
                      <p className="text-slate-700 whitespace-pre-wrap">{sesi.dinamika_konseling || "—"}</p>
                    </div>

                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      <span className="font-bold text-emerald-900 block mb-1">Solusi & Kesepakatan:</span>
                      <p className="text-emerald-800 whitespace-pre-wrap">{sesi.solusi_kesepakatan || "—"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Konselor/Guru:</span>
                      <span className="font-bold text-slate-700">{sesi.pegawai?.nama || "Guru BK / Wali Kelas"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                        {sesi.sifat_rahasia}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        sesi.status_follow_up === "Selesai"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {sesi.status_follow_up}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL TAMBAH SESI KONSELING
      ════════════════════════════════════════════════════════ */}
      {showAddKonselingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Catat Sesi Bimbingan & Konseling</h3>
              <button
                onClick={() => setShowAddKonselingModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Sesi</label>
                  <input
                    type="date"
                    value={konselingForm.tanggal_sesi}
                    onChange={(e) => setKonselingForm({ ...konselingForm, tanggal_sesi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Bimbingan</label>
                  <select
                    value={konselingForm.kategori}
                    onChange={(e) => setKonselingForm({ ...konselingForm, kategori: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {[
                      "Akademik",
                      "Karakter & Adab",
                      "Sosial & Teman Sebaya",
                      "Kedisiplinan & Tata Tertib",
                      "Minat & Karir / Lanjutan",
                      "Pribadi & Emosional",
                      "Lainnya",
                    ].map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Topik Utama Konseling *</label>
                <input
                  type="text"
                  placeholder="Contoh: Penurunan nilai mapel MIPA / Kesulitan adaptasi asrama"
                  value={konselingForm.topik_konseling}
                  onChange={(e) => setKonselingForm({ ...konselingForm, topik_konseling: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keluhan / Masalah yang Disampaikan *</label>
                <textarea
                  rows={3}
                  placeholder="Deskripsikan inti masalah atau cerita dari santri..."
                  value={konselingForm.keluhan_masalah}
                  onChange={(e) => setKonselingForm({ ...konselingForm, keluhan_masalah: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dinamika / Respon Santri</label>
                <textarea
                  rows={2}
                  placeholder="Kondisi psikologis, keterbukaan atau respon selama dialog..."
                  value={konselingForm.dinamika_konseling}
                  onChange={(e) => setKonselingForm({ ...konselingForm, dinamika_konseling: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Solusi / Kesepakatan Bersama</label>
                <textarea
                  rows={2}
                  placeholder="Komitmen dan langkah perbaikan yang disepakati bersama santri..."
                  value={konselingForm.solusi_kesepakatan}
                  onChange={(e) => setKonselingForm({ ...konselingForm, solusi_kesepakatan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Follow-up</label>
                  <select
                    value={konselingForm.status_follow_up}
                    onChange={(e) => setKonselingForm({ ...konselingForm, status_follow_up: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {["Dalam Pemantauan", "Perlu Sesi Lanjutan", "Selesai", "Dirujuk ke Pihak Luar"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sifat Kerahasiaan</label>
                  <select
                    value={konselingForm.sifat_rahasia}
                    onChange={(e) => setKonselingForm({ ...konselingForm, sifat_rahasia: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {[
                      "Internal Guru/Wali Kelas",
                      "Sangat Rahasia (Hanya BK)",
                      "Boleh Diinfokan ke Ortu",
                      "Umum",
                    ].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddKonselingModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!konselingForm.topik_konseling || !konselingForm.keluhan_masalah) {
                    toast.error("Topik dan keluhan/masalah wajib diisi!");
                    return;
                  }
                  addKonselingMutation.mutate(konselingForm);
                }}
                disabled={addKonselingMutation.isPending}
                className="px-5 py-2 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                {addKonselingMutation.isPending ? "Menyimpan..." : "Simpan Sesi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
