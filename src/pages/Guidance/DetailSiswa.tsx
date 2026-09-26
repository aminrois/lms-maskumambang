import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Home,
  HeartPulse,
  Briefcase,
  GraduationCap,
  Sparkles,
  MessageSquare,
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  Share2,
  Camera,
} from "lucide-react";
import { restClient } from "../../lib/api/axios";
import { toast } from "sonner";

const API_BASE = "/guidance";

export default function GuidanceDetailSiswa() {
  const { siswa_id } = useParams<{ siswa_id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "tempat_tinggal" | "sosial" | "kesehatan" | "internship" | "kuliah" | "fundamental" | "konseling"
  >("tempat_tinggal");

  // Form State Guidance
  const [formData, setFormData] = useState<any>({
    // 1. Tempat Tinggal & Fasilitas
    jarak_rumah_sekolah: "",
    transportasi: "Motor",
    kepemilikan_rumah: "Milik Sendiri",
    daya_listrik: "1.300 VA",
    sumber_air: "Sumur Bor",
    akses_internet: "Wifi",
    perangkat_belajar: "Ada",

    // 2. Data Sosial
    no_hp_siswa: "",
    email_siswa: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    twitter_x: "",

    // 3. Riwayat Kesehatan
    merokok: "Tidak",
    riwayat_penyakit: "",
    riwayat_alergi: "",
    riwayat_operasi: "",
    gangguan_kesehatan: "",
    dalam_masa_pengobatan: "",
    asuransi_kesehatan: "BPJS Kesehatan",
    kontak_darurat_nama: "",
    kontak_darurat_hubungan: "",
    kontak_darurat_hp: "",

    // 4. Rencana Internship / Dakwah
    internship_nama: "",
    internship_alamat: "",
    internship_bidang: "",
    internship_divisi: "",
    internship_kompetensi: "",

    // 5. Rencana Pendidikan Lanjutan
    lanjut_kuliah: "Ya",
    target_pendidikan: "S1 (Sarjana)",
    prodi_pilihan: "",
    universitas_tujuan: "",
    persiapan: "",
    sumber_biaya: "Orang Tua / Mandiri",
    jalur_masuk: "SNBT / UTBK",
    dukungan_diharapkan: "",

    // 6. 9 Aspek Fundamental
    skor_wudhu: 3,
    skor_doa_sholat: 3,
    skor_praktik_sholat: 3,
    skor_jamaah_masjid: 3,
    skor_alquran: 3,
    skor_hafalan_juz30: 3,
    skor_disiplin: 3,
    skor_rapi: 3,
    skor_adab: 3,
    catatan_fundamental: "",
  });

  // Form Sesi Konsultasi Baru
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

  // Fetch Detail Santri & Guidance
  const { data: siswaData, isLoading } = useQuery({
    queryKey: ["guidance-detail", siswa_id],
    queryFn: async () => {
      const res = await restClient.get(`${API_BASE}/siswa/${siswa_id}`);
      return res.data?.data;
    },
  });

  useEffect(() => {
    if (siswaData?.guidance_detail) {
      setFormData((prev: any) => ({
        ...prev,
        ...siswaData.guidance_detail,
      }));
    }
  }, [siswaData]);

  // Mutation Save Guidance Profile
  const saveGuidanceMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await restClient.put(`${API_BASE}/siswa/${siswa_id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Profil guidance santri berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ["guidance-detail", siswa_id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan data guidance.");
    },
  });

  // Mutation Add Sesi Konseling
  const addKonselingMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await restClient.post(`${API_BASE}/konseling`, {
        siswa_id: parseInt(siswa_id as string, 10),
        ...payload,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Catatan sesi konsultasi berhasil disimpan!");
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
      queryClient.invalidateQueries({ queryKey: ["guidance-detail", siswa_id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan sesi konsultasi.");
    },
  });

  // Mutation Delete Konseling Sesi
  const deleteKonselingMutation = useMutation({
    mutationFn: async (konseling_id: number) => {
      const res = await restClient.delete(`${API_BASE}/konseling/${konseling_id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Catatan konsultasi berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["guidance-detail", siswa_id] });
    },
  });

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
        await restClient.patch(`${API_BASE}/siswa/${siswa_id}/foto`, { foto: base64String });
        toast.success("Foto profil santri berhasil diperbarui!");
        queryClient.invalidateQueries({ queryKey: ["guidance-detail", siswa_id] });
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
      await restClient.patch(`${API_BASE}/siswa/${siswa_id}/foto`, { foto: null });
      toast.success("Foto profil berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["guidance-detail", siswa_id] });
    } catch (err: any) {
      toast.error("Gagal menghapus foto.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = () => {
    saveGuidanceMutation.mutate(formData);
  };

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
      <div className="p-8 text-center text-slate-400">
        Memuat detail bimbingan konseling santri...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <button
            onClick={() => navigate("/guidance")}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all cursor-pointer shrink-0 self-start"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Photo Avatar with Upload Trigger */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#162E6E] to-[#254ea8] text-white font-bold flex items-center justify-center text-2xl shadow-md overflow-hidden border-2 border-white">
              {siswaData?.foto ? (
                <img
                  src={siswaData.foto}
                  alt={siswaData.nama}
                  className="w-full h-full object-cover"
                />
              ) : (
                siswaData?.nama?.charAt(0) || "S"
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
              className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-[#162E6E] hover:bg-[#112457] text-white rounded-lg shadow-md border-2 border-white transition-all cursor-pointer group-hover:scale-105"
              title="Unggah / Ubah Foto Santri"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {siswaData?.foto && (
              <button
                onClick={handleRemovePhoto}
                disabled={isUploadingPhoto}
                className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow border border-white transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                title="Hapus Foto"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold text-slate-800">{siswaData?.nama}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              NIS: {siswaData?.nis} • Kelas: {siswaData?.kelas?.nama_kelas || "-"} ({siswaData?.kelas?.lembaga?.nama_lembaga || "-"})
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saveGuidanceMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saveGuidanceMutation.isPending ? "Menyimpan..." : "Simpan Perubahan Profil"}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: "tempat_tinggal", label: "1. Tempat Tinggal & Fasilitas", icon: Home },
          { id: "sosial", label: "2. Data Sosial & Digital", icon: Share2 },
          { id: "kesehatan", label: "3. Riwayat Kesehatan", icon: HeartPulse },
          { id: "internship", label: "4. Rencana Internship/Dakwah", icon: Briefcase },
          { id: "kuliah", label: "5. Pendidikan Lanjutan", icon: GraduationCap },
          { id: "fundamental", label: "6. Aspek Fundamental (1-4)", icon: Sparkles },
          { id: "konseling", label: "7. Sesi Konsultasi & BK", icon: MessageSquare },
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
              <label className="block font-bold text-slate-700 mb-1">2. TRANSPORTASI (Dropdown)</label>
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
              <label className="block font-bold text-slate-700 mb-1">3. KEPEMILIKAN RUMAH (Dropdown)</label>
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
              <label className="block font-bold text-slate-700 mb-1">4. DAYA LISTRIK (Dropdown)</label>
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
              <label className="block font-bold text-slate-700 mb-1">5. SUMBER AIR MINUM (Dropdown)</label>
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
              <label className="block font-bold text-slate-700 mb-1">6. AKSES INTERNET (Dropdown)</label>
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
              <label className="block font-bold text-slate-700 mb-1">7. PERANGKAT BELAJAR DARING (Dropdown)</label>
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
              <label className="block font-bold text-slate-700 mb-1">1. MEROKOK (Dropdown)</label>
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
                placeholder="Contoh: Alergi seafood, debu, obat antibiotik tertentu"
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
                placeholder="Contoh: Rumah Sakit Islam / Lazisnu / Bank Syariah"
                value={formData.internship_nama || ""}
                onChange={(e) => setFormData({ ...formData, internship_nama: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">2. ALAMAT INSTANSI</label>
              <input
                type="text"
                placeholder="Kota / Alamat lengkap instansi tujuan"
                value={formData.internship_alamat || ""}
                onChange={(e) => setFormData({ ...formData, internship_alamat: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">3. BIDANG INSTANSI</label>
              <input
                type="text"
                placeholder="Contoh: Pendidikan / Kesehatan / Keuangan / Dakwah"
                value={formData.internship_bidang || ""}
                onChange={(e) => setFormData({ ...formData, internship_bidang: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">4. DIVISI</label>
              <input
                type="text"
                placeholder="Contoh: IT Support / Humas / Pengajaran / Administrasi"
                value={formData.internship_divisi || ""}
                onChange={(e) => setFormData({ ...formData, internship_divisi: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">5. KOMPETENSI YANG INGIN DIKEMBANGKAN</label>
              <textarea
                rows={3}
                placeholder="Uraikan keahlian yang ingin dipelajari dan dipraktikkan..."
                value={formData.internship_kompetensi || ""}
                onChange={(e) => setFormData({ ...formData, internship_kompetensi: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 5: RENCANA PENDIDIKAN LANJUTAN (KULIAH)
      ════════════════════════════════════════════════════════ */}
      {activeTab === "kuliah" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="border-b pb-3 border-slate-100">
            <h3 className="text-base font-bold text-slate-800">5. Rencana Pendidikan Lanjutan & Karier</h3>
            <p className="text-xs text-slate-500">Arah minat studi lanjut perguruan tinggi negeri, swasta, atau luar negeri</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">1. LANJUT KULIAH (Dropdown)</label>
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
                placeholder="Contoh: S1 / D4 / Ma'had Aly / Universitas Al-Azhar Kairo"
                value={formData.target_pendidikan || ""}
                onChange={(e) => setFormData({ ...formData, target_pendidikan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">3. PRODI (Program Studi Pilihan)</label>
              <input
                type="text"
                placeholder="Contoh: Teknik Informatika / Kedokteran / Ilmu Al-Qur'an & Tafsir"
                value={formData.prodi_pilihan || ""}
                onChange={(e) => setFormData({ ...formData, prodi_pilihan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">4. UNIVERSITAS / LEMBAGA TUJUAN</label>
              <input
                type="text"
                placeholder="Contoh: ITS Surabaya / UIN Malang / Univ. Indonesia / Al-Azhar"
                value={formData.universitas_tujuan || ""}
                onChange={(e) => setFormData({ ...formData, universitas_tujuan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">5. PERSIAPAN YANG TELAH DILAKUKAN</label>
              <input
                type="text"
                placeholder="Contoh: Bimbel UTBK, Kursus Bahasa Arab, Penguatan Portofolio"
                value={formData.persiapan || ""}
                onChange={(e) => setFormData({ ...formData, persiapan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">6. SUMBER BIAYA</label>
              <input
                type="text"
                placeholder="Contoh: Beasiswa Santri Berprestasi (PBSB) / KIP-Kuliah / Orang Tua"
                value={formData.sumber_biaya || ""}
                onChange={(e) => setFormData({ ...formData, sumber_biaya: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">7. JALUR MASUK</label>
              <input
                type="text"
                placeholder="Contoh: SNBP (Prestasi) / SNBT (Tes) / Beasiswa Kemenag / Mandiri"
                value={formData.jalur_masuk || ""}
                onChange={(e) => setFormData({ ...formData, jalur_masuk: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">8. DUKUNGAN DIHARAPKAN DARI PESANTREN</label>
              <input
                type="text"
                placeholder="Contoh: Surat Rekomendasi Pengasuh, Pendampingan Khusus Ujian"
                value={formData.dukungan_diharapkan || ""}
                onChange={(e) => setFormData({ ...formData, dukungan_diharapkan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 6: ASPEK FUNDAMENTAL (SKALA 1 - 4)
      ════════════════════════════════════════════════════════ */}
      {activeTab === "fundamental" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="border-b pb-3 border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-800">6. Pemetaan 9 Aspek Fundamental Santri</h3>
              <p className="text-xs text-slate-500">Evaluasi pembiasaan ibadah, akhlak & kedisiplinan santri (Skor 1 - 4)</p>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">1: Belum Bisa</span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">2: Bisa</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">3: Butuh Kontrol</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">4: Mandiri & Istiqomah</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fundamentalItems.map((item) => {
              const currentScore = formData[item.key] || 1;
              return (
                <div key={item.key} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">{item.label}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Skor Penilaian:</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4].map((num) => {
                        const isSelected = currentScore === num;
                        const conf = skorLabels[num];
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setFormData({ ...formData, [item.key]: num })}
                            className={`py-1.5 text-center rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? `${conf.bg} ${conf.color} ring-2 ring-blue-500/20 shadow-sm`
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg text-[10px] font-bold text-center border ${skorLabels[currentScore].bg} ${skorLabels[currentScore].color}`}>
                    {skorLabels[currentScore].label}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Perkembangan Fundamental Santri</label>
            <textarea
              rows={3}
              placeholder="Uraikan catatan pembiasaan atau rekomendasi bimbingan khusus dari Murobbi/Wali Kelas..."
              value={formData.catatan_fundamental || ""}
              onChange={(e) => setFormData({ ...formData, catatan_fundamental: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 7: SESI KONSULTASI / KONSELING
      ════════════════════════════════════════════════════════ */}
      {activeTab === "konseling" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Riwayat Sesi Konsultasi & BK</h3>
              <p className="text-xs text-slate-500">Catatan sesi dialog empat mata antara santri dan Murobbi / Wali Kelas / Konselor</p>
            </div>

            <button
              onClick={() => setShowAddKonselingModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Catat Sesi Konsultasi Baru
            </button>
          </div>

          {/* List Sesi */}
          <div className="space-y-4">
            {siswaData?.konseling_sesi?.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl text-center text-slate-400 border border-slate-100">
                <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Belum ada catatan sesi konsultasi untuk santri ini.</p>
              </div>
            ) : (
              siswaData?.konseling_sesi?.map((sesi: any) => (
                <div key={sesi.konseling_id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3 border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-blue-50 text-[#1D4ED8] text-xs font-bold rounded-lg">
                        {sesi.kategori}
                      </span>
                      <h4 className="font-bold text-base text-slate-800">{sesi.topik_konseling}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Tanggal: <strong className="text-slate-700">{sesi.tanggal_sesi}</strong></span>
                      <span>Konselor: <strong className="text-slate-700">{sesi.pegawai?.nama || "Guru BK"}</strong></span>
                      <button
                        onClick={() => {
                          if (confirm("Hapus catatan konsultasi ini?")) {
                            deleteKonselingMutation.mutate(sesi.konseling_id);
                          }
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-600 uppercase text-[10px]">Pokok Masalah / Keluhan:</span>
                      <p className="text-slate-800 leading-relaxed">{sesi.keluhan_masalah}</p>
                    </div>

                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-1">
                      <span className="font-bold text-emerald-800 uppercase text-[10px]">Solusi & Rencana Aksi Kesepakatan:</span>
                      <p className="text-slate-800 leading-relaxed">{sesi.solusi_kesepakatan || "Belum ada rencana tindak lanjut."}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-500">
                      Status Follow-Up: <strong className="text-blue-800">{sesi.status_follow_up}</strong>
                    </span>
                    <span className="text-slate-500">
                      Sifat: <strong className="text-slate-700">{sesi.sifat_rahasia}</strong>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Catat Sesi Konsultasi Baru */}
      {showAddKonselingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800">Catat Sesi Konsultasi Santri</h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Sesi *</label>
                  <input
                    type="date"
                    value={konselingForm.tanggal_sesi}
                    onChange={(e) => setKonselingForm({ ...konselingForm, tanggal_sesi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Masalah *</label>
                  <select
                    value={konselingForm.kategori}
                    onChange={(e) => setKonselingForm({ ...konselingForm, kategori: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {["Akademik", "Karakter & Kedisiplinan", "Sosial & Emosional", "Keluarga", "Karier & Studi Lanjut", "Kesehatan", "Lainnya"].map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Topik / Judul Konsultasi *</label>
                <input
                  type="text"
                  placeholder="Contoh: Konsultasi Pemilihan Jurusan Kuliah & Masalah Kedisiplinan Bangun Pagi"
                  value={konselingForm.topik_konseling}
                  onChange={(e) => setKonselingForm({ ...konselingForm, topik_konseling: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Uraian Masalah / Keluhan Santri *</label>
                <textarea
                  rows={3}
                  placeholder="Ceritakan latar belakang dan poin yang disampaikan santri..."
                  value={konselingForm.keluhan_masalah}
                  onChange={(e) => setKonselingForm({ ...konselingForm, keluhan_masalah: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Solusi & Kesepakatan Tindak Lanjut</label>
                <textarea
                  rows={3}
                  placeholder="Rencana aksi yang disepakati bersama..."
                  value={konselingForm.solusi_kesepakatan}
                  onChange={(e) => setKonselingForm({ ...konselingForm, solusi_kesepakatan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Tindak Lanjut</label>
                  <select
                    value={konselingForm.status_follow_up}
                    onChange={(e) => setKonselingForm({ ...konselingForm, status_follow_up: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Dalam Pemantauan">Dalam Pemantauan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Perlu Rujukan Lanjut">Perlu Rujukan Lanjut</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sifat Kerahasiaan</label>
                  <select
                    value={konselingForm.sifat_rahasia}
                    onChange={(e) => setKonselingForm({ ...konselingForm, sifat_rahasia: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Internal Guru/Wali Kelas">Internal Guru/Wali Kelas</option>
                    <option value="Sangat Rahasia">Sangat Rahasia</option>
                    <option value="Terbuka">Terbuka</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowAddKonselingModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => addKonselingMutation.mutate(konselingForm)}
                disabled={addKonselingMutation.isPending || !konselingForm.topik_konseling || !konselingForm.keluhan_masalah}
                className="px-4 py-2 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {addKonselingMutation.isPending ? "Menyimpan..." : "Simpan Sesi Konsultasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
