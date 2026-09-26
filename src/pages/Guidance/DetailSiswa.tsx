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
  Calendar,
  UserCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit3,
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

  // Tab utama: 'profil_lengkap' (menyatukan semua seksi profil) & 'konseling'
  const [activeTab, setActiveTab] = useState<"profil_lengkap" | "konseling">("profil_lengkap");

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

  // Modal Sesi Konsultasi Baru
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

  // Modal Follow-Up Konseling
  const [followUpModalData, setFollowUpModalData] = useState<{
    isOpen: boolean;
    sesi: any | null;
    status_follow_up: string;
    catatan_tindak_lanjut: string;
    solusi_kesepakatan: string;
  }>({
    isOpen: false,
    sesi: null,
    status_follow_up: "Dalam Pemantauan",
    catatan_tindak_lanjut: "",
    solusi_kesepakatan: "",
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

  // Mutation Update Follow Up Sesi Konseling
  const updateFollowUpMutation = useMutation({
    mutationFn: async ({
      konseling_id,
      status_follow_up,
      catatan_tindak_lanjut,
      solusi_kesepakatan,
    }: {
      konseling_id: number;
      status_follow_up: string;
      catatan_tindak_lanjut: string;
      solusi_kesepakatan: string;
    }) => {
      const res = await restClient.patch(`${API_BASE}/konseling/${konseling_id}`, {
        status_follow_up,
        catatan_tindak_lanjut,
        solusi_kesepakatan,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Status follow-up sesi konsultasi berhasil diperbarui!");
      setFollowUpModalData({
        isOpen: false,
        sesi: null,
        status_follow_up: "Dalam Pemantauan",
        catatan_tindak_lanjut: "",
        solusi_kesepakatan: "",
      });
      queryClient.invalidateQueries({ queryKey: ["guidance-detail", siswa_id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal memperbarui follow-up.");
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

  const openFollowUpModal = (sesi: any) => {
    setFollowUpModalData({
      isOpen: true,
      sesi,
      status_follow_up: sesi.status_follow_up || "Dalam Pemantauan",
      catatan_tindak_lanjut: sesi.catatan_tindak_lanjut || "",
      solusi_kesepakatan: sesi.solusi_kesepakatan || "",
    });
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Selesai":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
          </span>
        );
      case "Dirujuk ke Pihak Luar":
      case "Perlu Rujukan Lanjut":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <ExternalLink className="w-3.5 h-3.5" /> Dirujuk ke Pihak Luar
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1D4ED8] border border-blue-200">
            <Clock className="w-3.5 h-3.5" /> Dalam Pemantauan
          </span>
        );
    }
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
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-bold text-slate-800">{siswaData?.nama}</h1>
              {siswaData?.nisn && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600">
                  NISN: {siswaData.nisn}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              NIS: <strong className="text-slate-700">{siswaData?.nis}</strong> • Kelas:{" "}
              <strong className="text-slate-700">{siswaData?.kelas?.nama_kelas || "-"}</strong> ({siswaData?.kelas?.lembaga?.nama_lembaga || "-"})
            </p>
          </div>
        </div>

        {activeTab === "profil_lengkap" && (
          <button
            onClick={handleSave}
            disabled={saveGuidanceMutation.isPending}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            {saveGuidanceMutation.isPending ? "Menyimpan..." : "Simpan Profil Santri"}
          </button>
        )}
      </div>

      {/* Navigation Tabs (Disatukan menjadi 2 Tab Utama) */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("profil_lengkap")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "profil_lengkap"
              ? "bg-[#162E6E] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Profil Lengkap & 360° Santri
        </button>

        <button
          onClick={() => setActiveTab("konseling")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "konseling"
              ? "bg-[#162E6E] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Riwayat Sesi Konsultasi & BK
          {siswaData?.konseling_sesi?.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "konseling" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {siswaData.konseling_sesi.length}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════
          TAB 1: PROFIL LENGKAP SANTRI (ALL-IN-ONE SECTIONS)
      ════════════════════════════════════════════════════════ */}
      {activeTab === "profil_lengkap" && (
        <div className="space-y-6">
          {/* SECTION A: TEMPAT TINGGAL & FASILITAS */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
            <div className="border-b pb-3 border-slate-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-[#162E6E]">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">A. Data Tempat Tinggal & Fasilitas Santri</h3>
                <p className="text-xs text-slate-500">Kondisi mobilitas, kepemilikan rumah, dan sarana belajar daring di rumah</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Jarak Rumah - Sekolah</label>
                <input
                  type="text"
                  placeholder="Contoh: 5 km / 500 meter"
                  value={formData.jarak_rumah_sekolah || ""}
                  onChange={(e) => setFormData({ ...formData, jarak_rumah_sekolah: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">2. Transportasi</label>
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
                <label className="block font-bold text-slate-700 mb-1">3. Kepemilikan Rumah</label>
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
                <label className="block font-bold text-slate-700 mb-1">4. Daya Listrik</label>
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
                <label className="block font-bold text-slate-700 mb-1">5. Sumber Air Minum</label>
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
                <label className="block font-bold text-slate-700 mb-1">6. Akses Internet</label>
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
                <label className="block font-bold text-slate-700 mb-1">7. Perangkat Belajar Daring</label>
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

          {/* SECTION B: DATA SOSIAL & DIGITAL */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
            <div className="border-b pb-3 border-slate-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">B. Data Sosial & Kontak Digital Santri</h3>
                <p className="text-xs text-slate-500">Nomor kontak pribadi santri dan akun media sosial</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
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
                <label className="block font-bold text-slate-700 mb-1">5. TikTok</label>
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

          {/* SECTION C: RIWAYAT KESEHATAN & KONTAK DARURAT */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
            <div className="border-b pb-3 border-slate-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">C. Riwayat Kesehatan & Kontak Darurat</h3>
                <p className="text-xs text-slate-500">Penting untuk penanganan medis & kesiapsiagaan asrama</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Merokok</label>
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
                <label className="block font-bold text-slate-700 mb-1">2. Riwayat Penyakit</label>
                <input
                  type="text"
                  placeholder="Contoh: Asma, Maag kronis, dll"
                  value={formData.riwayat_penyakit || ""}
                  onChange={(e) => setFormData({ ...formData, riwayat_penyakit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">3. Riwayat Alergi</label>
                <input
                  type="text"
                  placeholder="Contoh: Alergi seafood, debu, obat tertentu"
                  value={formData.riwayat_alergi || ""}
                  onChange={(e) => setFormData({ ...formData, riwayat_alergi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">4. Riwayat Operasi</label>
                <input
                  type="text"
                  placeholder="Contoh: Operasi usus buntu tahun 2024"
                  value={formData.riwayat_operasi || ""}
                  onChange={(e) => setFormData({ ...formData, riwayat_operasi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">5. Gangguan Kesehatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Migrain berkala, vertigo, dll"
                  value={formData.gangguan_kesehatan || ""}
                  onChange={(e) => setFormData({ ...formData, gangguan_kesehatan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">6. Dalam Masa Pengobatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Obat rutin vitamin / resep dokter"
                  value={formData.dalam_masa_pengobatan || ""}
                  onChange={(e) => setFormData({ ...formData, dalam_masa_pengobatan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">7. Asuransi Kesehatan</label>
                <input
                  type="text"
                  placeholder="Contoh: BPJS Kesehatan / Swasta"
                  value={formData.asuransi_kesehatan || ""}
                  onChange={(e) => setFormData({ ...formData, asuransi_kesehatan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Kontak Darurat */}
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-3">
              <h4 className="font-bold text-rose-900 text-xs uppercase tracking-wider">8. Kontak Darurat Kesehatan</h4>
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

          {/* SECTION D: RENCANA INTERNSHIP / DAKWAH */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
            <div className="border-b pb-3 border-slate-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">D. Rencana Internship & Praktik Dakwah</h3>
                <p className="text-xs text-slate-500">Proyeksi magang, pengabdian dakwah masyarakat & kompetensi keahlian</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Nama Instansi</label>
                <input
                  type="text"
                  placeholder="Contoh: Rumah Sakit Islam / Lazisnu / Bank Syariah"
                  value={formData.internship_nama || ""}
                  onChange={(e) => setFormData({ ...formData, internship_nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">2. Alamat Instansi</label>
                <input
                  type="text"
                  placeholder="Kota / Alamat lengkap instansi tujuan"
                  value={formData.internship_alamat || ""}
                  onChange={(e) => setFormData({ ...formData, internship_alamat: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">3. Bidang Instansi</label>
                <input
                  type="text"
                  placeholder="Contoh: Pendidikan / Kesehatan / Keuangan / Dakwah"
                  value={formData.internship_bidang || ""}
                  onChange={(e) => setFormData({ ...formData, internship_bidang: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">4. Divisi</label>
                <input
                  type="text"
                  placeholder="Contoh: IT Support / Humas / Pengajaran / Administrasi"
                  value={formData.internship_divisi || ""}
                  onChange={(e) => setFormData({ ...formData, internship_divisi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">5. Kompetensi yang Ingin Dikembangkan</label>
                <textarea
                  rows={2}
                  placeholder="Uraikan keahlian yang ingin dipelajari dan dipraktikkan..."
                  value={formData.internship_kompetensi || ""}
                  onChange={(e) => setFormData({ ...formData, internship_kompetensi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* SECTION E: RENCANA PENDIDIKAN LANJUTAN */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
            <div className="border-b pb-3 border-slate-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">E. Rencana Pendidikan Lanjutan & Karier</h3>
                <p className="text-xs text-slate-500">Arah minat studi lanjut perguruan tinggi negeri, swasta, atau luar negeri</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Lanjut Kuliah</label>
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
                <label className="block font-bold text-slate-700 mb-1">2. Target Pendidikan</label>
                <input
                  type="text"
                  placeholder="Contoh: S1 / D4 / Ma'had Aly / Al-Azhar"
                  value={formData.target_pendidikan || ""}
                  onChange={(e) => setFormData({ ...formData, target_pendidikan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">3. Program Studi Pilihan</label>
                <input
                  type="text"
                  placeholder="Contoh: Teknik Informatika / Kedokteran"
                  value={formData.prodi_pilihan || ""}
                  onChange={(e) => setFormData({ ...formData, prodi_pilihan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">4. Universitas / Lembaga Tujuan</label>
                <input
                  type="text"
                  placeholder="Contoh: ITS Surabaya / UIN Malang / UI"
                  value={formData.universitas_tujuan || ""}
                  onChange={(e) => setFormData({ ...formData, universitas_tujuan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">5. Persiapan yang Dilakukan</label>
                <input
                  type="text"
                  placeholder="Contoh: Bimbel UTBK, Kursus Bahasa Arab"
                  value={formData.persiapan || ""}
                  onChange={(e) => setFormData({ ...formData, persiapan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">6. Sumber Biaya</label>
                <input
                  type="text"
                  placeholder="Contoh: Beasiswa PBSB / KIP-Kuliah / Orang Tua"
                  value={formData.sumber_biaya || ""}
                  onChange={(e) => setFormData({ ...formData, sumber_biaya: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">7. Jalur Masuk</label>
                <input
                  type="text"
                  placeholder="Contoh: SNBP / SNBT / Mandiri"
                  value={formData.jalur_masuk || ""}
                  onChange={(e) => setFormData({ ...formData, jalur_masuk: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">8. Dukungan Diharapkan dari Pesantren</label>
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

          {/* SECTION F: PEMETAAN 9 ASPEK FUNDAMENTAL */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
            <div className="border-b pb-3 border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">F. Pemetaan 9 Aspek Fundamental Santri</h3>
                  <p className="text-xs text-slate-500">Evaluasi pembiasaan ibadah, akhlak & kedisiplinan santri (Skor 1 - 4)</p>
                </div>
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

          {/* ── TOMBOL SIMPAN DI PALING BAWAH HALAMAN ──────────────── */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h4 className="font-bold text-sm text-[#162E6E]">Simpan Pembaruan Data Santri</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Pastikan data tempat tinggal, sosial, kesehatan, internship, pendidikan lanjutan, dan 9 aspek fundamental telah lengkap dan akurat.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saveGuidanceMutation.isPending}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4" />
              {saveGuidanceMutation.isPending ? "Menyimpan Perubahan..." : "Simpan Perubahan Data Santri"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 2: SESI KONSULTASI & FOLLOW-UP
      ════════════════════════════════════════════════════════ */}
      {activeTab === "konseling" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Riwayat Sesi Konsultasi & Bimbingan Santri</h3>
              <p className="text-xs text-slate-500">Catatan dialog empat mata, penanganan kasus, serta status follow-up & tindak lanjut</p>
            </div>

            <button
              onClick={() => setShowAddKonselingModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
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
                <p className="text-xs text-slate-400 mt-1">Klik tombol di atas untuk mencatat sesi dialog atau bimbingan santri.</p>
              </div>
            ) : (
              siswaData?.konseling_sesi?.map((sesi: any) => (
                <div key={sesi.konseling_id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3 border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-blue-50 text-[#1D4ED8] text-xs font-bold rounded-lg">
                        {sesi.kategori}
                      </span>
                      <h4 className="font-bold text-base text-slate-800">{sesi.topik_konseling}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(sesi.tanggal_sesi).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span>Konselor/Murobbi: <strong className="text-slate-700">{sesi.pegawai?.nama || "Murobbi"}</strong></span>
                      <button
                        onClick={() => {
                          if (confirm("Hapus catatan konsultasi ini?")) {
                            deleteKonselingMutation.mutate(sesi.konseling_id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-600 uppercase text-[10px]">Pokok Masalah / Keluhan:</span>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{sesi.keluhan_masalah}</p>
                    </div>

                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-1">
                      <span className="font-bold text-emerald-800 uppercase text-[10px]">Solusi & Rencana Aksi Kesepakatan:</span>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{sesi.solusi_kesepakatan || "Belum ada rencana tindak lanjut."}</p>
                    </div>
                  </div>

                  {sesi.catatan_tindak_lanjut && (
                    <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 text-xs">
                      <span className="font-bold text-purple-900 block mb-1">Catatan Follow-Up & Perkembangan Kasus:</span>
                      <p className="text-slate-700 whitespace-pre-wrap">{sesi.catatan_tindak_lanjut}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Status:</span>
                      {getStatusBadge(sesi.status_follow_up)}
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 font-medium">
                        {sesi.sifat_rahasia}
                      </span>
                    </div>

                    {/* Tombol Follow Up oleh Murobbi */}
                    <button
                      onClick={() => openFollowUpModal(sesi)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-[#162E6E] text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Follow Up / Update Status
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── MODAL FOLLOW-UP SESI KONSULTASI ─────────────────────────── */}
      {followUpModalData.isOpen && followUpModalData.sesi && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">Follow-Up Sesi Konsultasi</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Topik: <strong className="text-slate-700">{followUpModalData.sesi.topik_konseling}</strong>
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Pilih Status Perkembangan Kasus *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { value: "Dalam Pemantauan", label: "Dalam Pemantauan", desc: "Masih observasi", color: "border-blue-300 text-blue-800 bg-blue-50/50" },
                    { value: "Selesai", label: "Selesai", desc: "Kasus tuntas", color: "border-emerald-300 text-emerald-800 bg-emerald-50/50" },
                    { value: "Dirujuk ke Pihak Luar", label: "Dirujuk ke Pihak Luar", desc: "Dilempar ke pihak eksternal", color: "border-purple-300 text-purple-800 bg-purple-50/50" },
                  ].map((opt) => {
                    const isSelected = followUpModalData.status_follow_up === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFollowUpModalData({ ...followUpModalData, status_follow_up: opt.value })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? `${opt.color} ring-2 ring-blue-500 shadow-sm font-bold`
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-bold text-xs">{opt.label}</span>
                        <span className="text-[10px] text-slate-400 mt-1">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Follow-Up / Keterangan Pihak Luar *
                </label>
                <textarea
                  rows={4}
                  placeholder={
                    followUpModalData.status_follow_up === "Dirujuk ke Pihak Luar"
                      ? "Jelaskan alasan dan kepada pihak luar mana santri dirujuk (misal: Dokter Spesialis RS Islam, Psikolog Luar, Orang Tua Khusus, dll)..."
                      : followUpModalData.status_follow_up === "Selesai"
                      ? "Tuliskan ringkasan hasil akhir dan evaluasi bahwa masalah santri telah terselesaikan..."
                      : "Tuliskan catatan perkembangan dan jadwal pemantauan lanjutan bersama santri..."
                  }
                  value={followUpModalData.catatan_tindak_lanjut}
                  onChange={(e) => setFollowUpModalData({ ...followUpModalData, catatan_tindak_lanjut: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Solusi & Kesepakatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Tambahkan kesepakatan baru jika ada..."
                  value={followUpModalData.solusi_kesepakatan}
                  onChange={(e) => setFollowUpModalData({ ...followUpModalData, solusi_kesepakatan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setFollowUpModalData({ ...followUpModalData, isOpen: false })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  updateFollowUpMutation.mutate({
                    konseling_id: followUpModalData.sesi.konseling_id,
                    status_follow_up: followUpModalData.status_follow_up,
                    catatan_tindak_lanjut: followUpModalData.catatan_tindak_lanjut,
                    solusi_kesepakatan: followUpModalData.solusi_kesepakatan,
                  });
                }}
                disabled={updateFollowUpMutation.isPending}
                className="px-4 py-2 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
              >
                {updateFollowUpMutation.isPending ? "Menyimpan..." : "Simpan Follow Up"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Catat Sesi Konsultasi Baru */}
      {showAddKonselingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Dalam Pemantauan">Dalam Pemantauan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dirujuk ke Pihak Luar">Dirujuk ke Pihak Luar</option>
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
