import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Camera,
  Save,
  Trash2,
  MessageSquare,
  User,
  Plus,
  Calendar,
  FileDown,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_GUIDANCE = "/api/v1/guidance";

export default function MasterDataSiswaDetail() {
  const { siswa_id } = useParams<{ siswa_id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"profil" | "konseling">("profil");
  const [formData, setFormData] = useState<any>({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

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
      setFormData({ ...guidance });
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Format file harus berupa gambar."); return; }
    if (file.size > 3 * 1024 * 1024) { toast.error("Ukuran file maksimal 3 MB."); return; }
    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await axios.patch(`${API_GUIDANCE}/siswa/${siswa_id}/foto`, { foto: reader.result });
        toast.success("Foto profil santri berhasil diperbarui!");
        queryClient.invalidateQueries({ queryKey: ["siswa-detail-360", siswa_id] });
      } catch { toast.error("Gagal mengunggah foto profil."); }
      finally { setIsUploadingPhoto(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm("Hapus foto profil santri ini?")) return;
    setIsUploadingPhoto(true);
    try {
      await axios.patch(`${API_GUIDANCE}/siswa/${siswa_id}/foto`, { foto: null });
      toast.success("Foto profil berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["siswa-detail-360", siswa_id] });
    } catch { toast.error("Gagal menghapus foto."); }
    finally { setIsUploadingPhoto(false); }
  };

  const addKonselingMutation = useMutation({
    mutationFn: async (payload: typeof konselingForm) => {
      const res = await axios.post(`${API_GUIDANCE}/konseling`, { ...payload, siswa_id: Number(siswa_id) });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Catatan konsultasi berhasil disimpan!");
      setShowAddKonselingModal(false);
      setKonselingForm({ tanggal_sesi: new Date().toISOString().slice(0, 10), kategori: "Akademik", topik_konseling: "", keluhan_masalah: "", dinamika_konseling: "", solusi_kesepakatan: "", status_follow_up: "Dalam Pemantauan", sifat_rahasia: "Internal Guru/Wali Kelas", catatan_tindak_lanjut: "" });
      queryClient.invalidateQueries({ queryKey: ["siswa-detail-360", siswa_id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menyimpan sesi konsultasi."),
  });

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

  // ── PDF GENERATOR (Print-to-PDF via browser print) ──────────────────────────
  const handleDownloadPDF = () => {
    if (!siswa) return;
    setIsDownloadingPDF(true);

    const skorLabel = (v: number) => {
      const m: Record<number, string> = { 1: "1 - Belum Bisa", 2: "2 - Bisa", 3: "3 - Bisa, Butuh Kontrol", 4: "4 - Mandiri & Istiqomah" };
      return m[v] || "-";
    };

    const fld = (v: any) => v || "-";

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Profil Santri — ${fld(siswa.nama)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
    body { padding: 32px; color: #1e293b; font-size: 11px; }
    h1 { font-size: 18px; font-weight: 800; color: #162E6E; margin-bottom: 2px; }
    h2 { font-size: 12px; font-weight: 700; color: #162E6E; background: #e0e7ff; padding: 6px 10px; border-radius: 6px; margin-bottom: 10px; margin-top: 18px; }
    h3 { font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 6px; }
    .header { display: flex; gap: 20px; align-items: flex-start; border-bottom: 2px solid #162E6E; padding-bottom: 16px; margin-bottom: 4px; }
    .avatar { width: 80px; height: 80px; border-radius: 10px; object-fit: cover; border: 2px solid #162E6E; }
    .avatar-placeholder { width: 80px; height: 80px; border-radius: 10px; background: #162E6E; color: white; font-size: 28px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 20px; }
    .row { border-bottom: 1px solid #f1f5f9; padding: 4px 0; }
    .label { color: #64748b; font-size: 10px; }
    .value { font-weight: 600; color: #1e293b; }
    .skor-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
    .skor-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; }
    .skor-card .skor-val { font-size: 18px; font-weight: 800; color: #162E6E; }
    .konseling-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 8px; }
    .konseling-header { display: flex; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
    .tag { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>

  <div class="header">
    <div>
      ${siswa.foto
        ? `<img src="${siswa.foto}" class="avatar" alt="${siswa.nama}"/>`
        : `<div class="avatar-placeholder">${(siswa.nama || "S").charAt(0)}</div>`
      }
    </div>
    <div>
      <h1>${fld(siswa.nama)}</h1>
      <p style="color:#475569;margin-bottom:6px">NIS: ${fld(siswa.nis)} &nbsp;|&nbsp; NISN: ${fld(siswa.nisn)} &nbsp;|&nbsp; NIK: ${fld(siswa.nik)}</p>
      <span class="badge ${siswa.status === 'Aktif' ? 'badge-green' : siswa.status === 'Alumni' ? 'badge-blue' : 'badge-red'}">${fld(siswa.status)}</span>
      &nbsp;
      <span class="badge badge-blue">${fld(siswa.kelas?.lembaga?.nama_lembaga)}</span>
      &nbsp;
      <span class="badge" style="background:#f1f5f9;color:#334155">Kelas: ${fld(siswa.kelas?.nama_kelas)}</span>
      &nbsp;
      <span class="badge" style="background:#fef9c3;color:#92400e">Asrama: ${siswa.keterangan_asrama === 'Ya' ? 'Ya (Mukim)' : 'Tidak'}</span>
      <p style="color:#64748b;margin-top:6px;font-size:10px">Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  </div>

  <!-- BIODATA PRIBADI -->
  <h2>A. IDENTITAS PRIBADI</h2>
  <div class="grid">
    <div class="row"><div class="label">Nama Lengkap</div><div class="value">${fld(siswa.nama)}</div></div>
    <div class="row"><div class="label">Nama Panggilan</div><div class="value">${fld(siswa.panggilan)}</div></div>
    <div class="row"><div class="label">NIS</div><div class="value">${fld(siswa.nis)}</div></div>
    <div class="row"><div class="label">NISN</div><div class="value">${fld(siswa.nisn)}</div></div>
    <div class="row"><div class="label">NIK</div><div class="value">${fld(siswa.nik)}</div></div>
    <div class="row"><div class="label">Jenis Kelamin</div><div class="value">${siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div></div>
    <div class="row"><div class="label">Tempat, Tanggal Lahir</div><div class="value">${fld(siswa.tempat_lahir)}, ${fld(siswa.tanggal_lahir)}</div></div>
    <div class="row"><div class="label">Agama</div><div class="value">${fld(siswa.agama)}</div></div>
    <div class="row"><div class="label">Kewarganegaraan</div><div class="value">${fld(siswa.kewarganegaraan)}</div></div>
    <div class="row"><div class="label">Tahun Masuk</div><div class="value">${fld(siswa.tahun_masuk)}</div></div>
    <div class="row"><div class="label">Asal Sekolah</div><div class="value">${fld(siswa.asal_sekolah)}</div></div>
    <div class="row"><div class="label">No. Akta Kelahiran</div><div class="value">${fld(siswa.no_akta_kelahiran)}</div></div>
    <div class="row"><div class="label">No. KK</div><div class="value">${fld(siswa.no_kk)}</div></div>
  </div>
  <div class="row" style="margin-top:6px">
    <div class="label">Alamat Lengkap</div>
    <div class="value">${fld(siswa.alamat)}${siswa.rt ? ` RT ${siswa.rt}` : ''}${siswa.rw ? ` / RW ${siswa.rw}` : ''}${siswa.desa_kelurahan ? `, ${siswa.desa_kelurahan}` : ''}${siswa.kecamatan ? `, Kec. ${siswa.kecamatan}` : ''}${siswa.kabupaten_kota ? `, ${siswa.kabupaten_kota}` : ''}${siswa.provinsi ? `, ${siswa.provinsi}` : ''}${siswa.kode_pos ? ` (${siswa.kode_pos})` : ''}</div>
  </div>

  <!-- DATA ORANG TUA -->
  <h2>B. DATA ORANG TUA & WALI</h2>
  <div class="grid-3">
    <div>
      <h3>🧑 Ayah</h3>
      <div class="row"><div class="label">Nama</div><div class="value">${fld(siswa.wali_murid?.nama_ayah)}</div></div>
      <div class="row"><div class="label">Status</div><div class="value">${fld(siswa.wali_murid?.status_ayah)}</div></div>
      <div class="row"><div class="label">No HP</div><div class="value">${fld(siswa.wali_murid?.no_hp_ayah)}</div></div>
      <div class="row"><div class="label">Pekerjaan</div><div class="value">${fld(siswa.wali_murid?.pekerjaan_ayah)}</div></div>
      <div class="row"><div class="label">Penghasilan</div><div class="value">${fld(siswa.wali_murid?.penghasilan_ayah)}</div></div>
    </div>
    <div>
      <h3>👩 Ibu</h3>
      <div class="row"><div class="label">Nama</div><div class="value">${fld(siswa.wali_murid?.nama_ibu)}</div></div>
      <div class="row"><div class="label">Status</div><div class="value">${fld(siswa.wali_murid?.status_ibu)}</div></div>
      <div class="row"><div class="label">No HP</div><div class="value">${fld(siswa.wali_murid?.no_hp_ibu)}</div></div>
      <div class="row"><div class="label">Pekerjaan</div><div class="value">${fld(siswa.wali_murid?.pekerjaan_ibu)}</div></div>
      <div class="row"><div class="label">Penghasilan</div><div class="value">${fld(siswa.wali_murid?.penghasilan_ibu)}</div></div>
    </div>
    <div>
      <h3>👤 Wali</h3>
      <div class="row"><div class="label">Nama Wali</div><div class="value">${fld(siswa.wali_murid?.nama_wali)}</div></div>
      <div class="row"><div class="label">No HP Wali</div><div class="value">${fld(siswa.wali_murid?.no_hp_wali)}</div></div>
      <div class="row"><div class="label">Alamat</div><div class="value">${fld(siswa.wali_murid?.alamat)}</div></div>
    </div>
  </div>

  <!-- TEMPAT TINGGAL -->
  <h2>C. TEMPAT TINGGAL & FASILITAS</h2>
  <div class="grid">
    <div class="row"><div class="label">Jarak Rumah-Sekolah</div><div class="value">${fld(guidance?.jarak_rumah_sekolah)}</div></div>
    <div class="row"><div class="label">Transportasi</div><div class="value">${fld(guidance?.transportasi)}</div></div>
    <div class="row"><div class="label">Kepemilikan Rumah</div><div class="value">${fld(guidance?.kepemilikan_rumah)}</div></div>
    <div class="row"><div class="label">Daya Listrik</div><div class="value">${fld(guidance?.daya_listrik)}</div></div>
    <div class="row"><div class="label">Sumber Air Minum</div><div class="value">${fld(guidance?.sumber_air)}</div></div>
    <div class="row"><div class="label">Akses Internet</div><div class="value">${fld(guidance?.akses_internet)}</div></div>
    <div class="row"><div class="label">Perangkat Belajar Daring</div><div class="value">${fld(guidance?.perangkat_belajar)}</div></div>
  </div>

  <!-- DATA SOSIAL -->
  <h2>D. DATA SOSIAL & DIGITAL</h2>
  <div class="grid">
    <div class="row"><div class="label">No HP Santri</div><div class="value">${fld(guidance?.no_hp_siswa)}</div></div>
    <div class="row"><div class="label">Email Santri</div><div class="value">${fld(guidance?.email_siswa)}</div></div>
    <div class="row"><div class="label">Instagram</div><div class="value">${fld(guidance?.instagram)}</div></div>
    <div class="row"><div class="label">Facebook</div><div class="value">${fld(guidance?.facebook)}</div></div>
    <div class="row"><div class="label">TikTok</div><div class="value">${fld(guidance?.tiktok)}</div></div>
    <div class="row"><div class="label">Twitter / X</div><div class="value">${fld(guidance?.twitter_x)}</div></div>
  </div>

  <!-- RIWAYAT KESEHATAN -->
  <h2>E. RIWAYAT KESEHATAN & KONTAK DARURAT</h2>
  <div class="grid">
    <div class="row"><div class="label">Merokok</div><div class="value">${fld(guidance?.merokok)}</div></div>
    <div class="row"><div class="label">Riwayat Penyakit</div><div class="value">${fld(guidance?.riwayat_penyakit)}</div></div>
    <div class="row"><div class="label">Riwayat Alergi</div><div class="value">${fld(guidance?.riwayat_alergi)}</div></div>
    <div class="row"><div class="label">Riwayat Operasi</div><div class="value">${fld(guidance?.riwayat_operasi)}</div></div>
    <div class="row"><div class="label">Gangguan Kesehatan</div><div class="value">${fld(guidance?.gangguan_kesehatan)}</div></div>
    <div class="row"><div class="label">Dalam Masa Pengobatan</div><div class="value">${fld(guidance?.dalam_masa_pengobatan)}</div></div>
    <div class="row"><div class="label">Asuransi Kesehatan</div><div class="value">${fld(guidance?.asuransi_kesehatan)}</div></div>
    <div class="row"><div class="label">Kontak Darurat</div><div class="value">${fld(guidance?.kontak_darurat_nama)} (${fld(guidance?.kontak_darurat_hubungan)}) — ${fld(guidance?.kontak_darurat_hp)}</div></div>
  </div>

  <!-- INTERNSHIP -->
  <h2>F. RENCANA INTERNSHIP / DAKWAH</h2>
  <div class="grid">
    <div class="row"><div class="label">Nama Instansi</div><div class="value">${fld(guidance?.internship_instansi)}</div></div>
    <div class="row"><div class="label">Alamat Instansi</div><div class="value">${fld(guidance?.internship_alamat)}</div></div>
    <div class="row"><div class="label">Bidang Instansi</div><div class="value">${fld(guidance?.internship_bidang)}</div></div>
    <div class="row"><div class="label">Divisi</div><div class="value">${fld(guidance?.internship_divisi)}</div></div>
    <div class="row"><div class="label">Kompetensi</div><div class="value">${fld(guidance?.internship_kompetensi)}</div></div>
  </div>

  <!-- PENDIDIKAN LANJUTAN -->
  <h2>G. RENCANA PENDIDIKAN LANJUTAN</h2>
  <div class="grid">
    <div class="row"><div class="label">Lanjut Kuliah</div><div class="value">${fld(guidance?.lanjut_kuliah)}</div></div>
    <div class="row"><div class="label">Target Pendidikan</div><div class="value">${fld(guidance?.target_pendidikan)}</div></div>
    <div class="row"><div class="label">Program Studi</div><div class="value">${fld(guidance?.prodi_tujuan)}</div></div>
    <div class="row"><div class="label">Perguruan Tinggi</div><div class="value">${fld(guidance?.universitas_tujuan)}</div></div>
    <div class="row"><div class="label">Persiapan</div><div class="value">${fld(guidance?.persiapan_kuliah)}</div></div>
    <div class="row"><div class="label">Sumber Biaya</div><div class="value">${fld(guidance?.sumber_biaya)}</div></div>
    <div class="row"><div class="label">Jalur Masuk</div><div class="value">${fld(guidance?.jalur_masuk)}</div></div>
    <div class="row"><div class="label">Dukungan Diharapkan</div><div class="value">${fld(guidance?.dukungan_diharapkan)}</div></div>
  </div>

  <!-- 9 ASPEK FUNDAMENTAL -->
  <h2>H. PENILAIAN 9 ASPEK FUNDAMENTAL (Skala 1–4)</h2>
  <div class="skor-grid">
    ${[
      { key: "skor_wudhu", label: "Wudhu" },
      { key: "skor_doa_sholat", label: "Do'a Sholat" },
      { key: "skor_praktik_sholat", label: "Praktik Sholat" },
      { key: "skor_jamaah_masjid", label: "Sholat Jama'ah Masjid" },
      { key: "skor_alquran", label: "Al-Qur'an / Tilawah" },
      { key: "skor_hafalan_juz30", label: "Hafalan Juz 30" },
      { key: "skor_disiplin", label: "Disiplin Waktu & Aturan" },
      { key: "skor_rapi", label: "Kerapihan Diri & Asrama" },
      { key: "skor_adab", label: "Adab & Akhlaqul Karimah" },
    ].map(item => `
      <div class="skor-card">
        <div class="label">${item.label}</div>
        <div class="skor-val">${guidance?.[item.key] || "-"}</div>
        <div style="font-size:9px;color:#64748b">${skorLabel(guidance?.[item.key])}</div>
      </div>
    `).join("")}
  </div>

  <!-- SESI KONSELING -->
  ${konselingList.length > 0 ? `
  <h2>I. RIWAYAT BIMBINGAN & KONSELING (${konselingList.length} sesi)</h2>
  ${konselingList.map((sesi: any) => `
    <div class="konseling-card">
      <div class="konseling-header">
        <div>
          <span class="tag">${sesi.kategori}</span>
          &nbsp;<strong>${sesi.topik_konseling}</strong>
        </div>
        <div style="color:#64748b;font-size:10px">${new Date(sesi.tanggal_sesi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | ${sesi.pegawai?.nama || 'Guru/Wali Kelas'}</div>
      </div>
      <div class="grid-3" style="font-size:10px">
        <div><div class="label">Keluhan / Masalah:</div><div>${sesi.keluhan_masalah || '-'}</div></div>
        <div><div class="label">Dinamika:</div><div>${sesi.dinamika_konseling || '-'}</div></div>
        <div><div class="label">Solusi / Kesepakatan:</div><div>${sesi.solusi_kesepakatan || '-'}</div></div>
      </div>
      <div style="margin-top:4px;font-size:9px;color:#64748b">Status: <strong>${sesi.status_follow_up}</strong> | Kerahasiaan: ${sesi.sifat_rahasia}</div>
    </div>
  `).join("")}
  ` : ''}

  <div style="margin-top:24px;border-top:1px solid #e2e8f0;padding-top:10px;text-align:center;color:#94a3b8;font-size:10px">
    Dicetak dari Sistem Informasi Akademik Madrasah YKUI Maskumambang
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) { toast.error("Popup diblokir browser. Izinkan popup untuk mencetak PDF."); setIsDownloadingPDF(false); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      setIsDownloadingPDF(false);
    }, 600);
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

  const skorLabels: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: "1 - Belum Bisa", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
    2: { label: "2 - Bisa", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    3: { label: "3 - Bisa, Butuh Kontrol", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    4: { label: "4 - Mandiri & Istiqomah", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  };

  // ── Helper: Section Header ──────────────────────────────────────────────────
  const SectionHeader = ({ label, sub }: { label: string; sub?: string }) => (
    <div className="border-b border-slate-200 pb-3 mb-4">
      <h3 className="text-sm font-bold text-[#162E6E]">{label}</h3>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );

  // ── Helper: Info Field (read-only display) ──────────────────────────────────
  const InfoField = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5 uppercase tracking-wide">{label}</span>
      <span className="text-xs font-bold text-slate-800">{value || "—"}</span>
    </div>
  );

  // ── Helper: Editable Text Input ─────────────────────────────────────────────
  const EditInput = ({
    label, field, placeholder, type = "text",
  }: { label: string; field: string; placeholder?: string; type?: string }) => (
    <div>
      <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={formData[field] || ""}
        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#162E6E]/30"
      />
    </div>
  );

  // ── Helper: Editable Select ─────────────────────────────────────────────────
  const EditSelect = ({
    label, field, options,
  }: { label: string; field: string; options: string[] }) => (
    <div>
      <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wide">{label}</label>
      <select
        value={formData[field] || options[0]}
        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#162E6E]/30"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  if (isLoading) return (
    <div className="p-12 text-center flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-[#162E6E] border-t-amber-400 animate-spin" />
      <span className="text-sm font-semibold text-slate-500">Memuat profil lengkap santri...</span>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" ref={printRef}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Back */}
          <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all cursor-pointer shrink-0 self-start">
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Avatar + Upload */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-gradient-to-tr from-[#162E6E] to-[#254ea8] text-white font-bold text-3xl flex items-center justify-center">
              {siswa?.foto
                ? <img src={siswa.foto} alt={siswa.nama} className="w-full h-full object-cover" />
                : siswa?.nama?.charAt(0) || "S"
              }
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute -bottom-2 -right-2 p-2 bg-[#162E6E] hover:bg-[#112457] text-white rounded-xl shadow-lg border-2 border-white cursor-pointer group-hover:scale-105 transition-all"
              title="Unggah / Ubah Foto"
            >
              <Camera className="w-4 h-4" />
            </button>
            {siswa?.foto && (
              <button
                onClick={handleRemovePhoto}
                disabled={isUploadingPhoto}
                className="absolute -top-2 -right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg border-2 border-white shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
                title="Hapus Foto"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Info */}
          <div className="text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-bold text-slate-800">{siswa?.nama}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${siswa?.status === "Aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : siswa?.status === "Alumni" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                {siswa?.status || "Aktif"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              NISN: <b className="text-slate-700 font-semibold">{siswa?.nisn || "—"}</b>
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="bg-[#162E6E]/10 text-[#162E6E] px-2.5 py-1 rounded-lg text-xs font-bold">{siswa?.kelas?.lembaga?.nama_lembaga || "Lembaga"}</span>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">Kelas: {siswa?.kelas?.nama_kelas || "—"}</span>
              <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-semibold border border-amber-200">Asrama: {siswa?.keterangan_asrama === "Ya" ? "Mukim" : "Non-Asrama"}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF || isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            {isDownloadingPDF ? "Menyiapkan..." : "Download PDF"}
          </button>
          <button
            onClick={() => saveGuidanceMutation.mutate(formData)}
            disabled={saveGuidanceMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saveGuidanceMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {[
          { id: "profil", label: "Profil Lengkap Santri", icon: User },
          { id: "konseling", label: `Sesi Konsultasi (${konselingList.length})`, icon: MessageSquare },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === id ? "bg-[#162E6E] text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: PROFIL LENGKAP (semua data dalam satu scroll)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "profil" && (
        <div className="space-y-6">

          {/* A. IDENTITAS PRIBADI */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <SectionHeader label="A. Identitas Pribadi" sub="Data identitas pokok terdaftar di database madrasah" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <InfoField label="Nama Lengkap" value={siswa?.nama} />
              <InfoField label="Nama Panggilan" value={siswa?.panggilan} />
              <InfoField label="NIS" value={siswa?.nis} />
              <InfoField label="NISN" value={siswa?.nisn} />
              <InfoField label="NIK" value={siswa?.nik} />
              <InfoField label="Jenis Kelamin" value={siswa?.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} />
              <InfoField label="Tempat Lahir" value={siswa?.tempat_lahir} />
              <InfoField label="Tanggal Lahir" value={siswa?.tanggal_lahir} />
              <InfoField label="Agama" value={siswa?.agama} />
              <InfoField label="Kewarganegaraan" value={siswa?.kewarganegaraan} />
              <InfoField label="Tahun Masuk" value={siswa?.tahun_masuk} />
              <InfoField label="Asal Sekolah" value={siswa?.asal_sekolah} />
              <InfoField label="No. Akta Kelahiran" value={siswa?.no_akta_kelahiran} />
              <InfoField label="No. KK" value={siswa?.no_kk} />
              <InfoField label="Status" value={siswa?.status} />
              <div className="sm:col-span-2 md:col-span-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5 uppercase tracking-wide">Alamat Lengkap</span>
                <span className="text-xs font-bold text-slate-800">
                  {siswa?.alamat || "—"}
                  {siswa?.rt && ` RT ${siswa.rt}`}{siswa?.rw && ` / RW ${siswa.rw}`}
                  {siswa?.desa_kelurahan && `, ${siswa.desa_kelurahan}`}
                  {siswa?.kecamatan && `, Kec. ${siswa.kecamatan}`}
                  {siswa?.kabupaten_kota && `, ${siswa.kabupaten_kota}`}
                  {siswa?.provinsi && `, ${siswa.provinsi}`}
                  {siswa?.kode_pos && ` (${siswa.kode_pos})`}
                </span>
              </div>
            </div>
          </div>

          {/* B. DATA ORANG TUA */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <SectionHeader label="B. Data Orang Tua & Wali Santri" sub="Informasi kontak keluarga dan penanggung jawab" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Ayah", color: "text-blue-700", fields: [
                  { l: "Nama Ayah", v: siswa?.wali_murid?.nama_ayah },
                  { l: "Status", v: siswa?.wali_murid?.status_ayah },
                  { l: "No HP", v: siswa?.wali_murid?.no_hp_ayah },
                  { l: "Pekerjaan", v: siswa?.wali_murid?.pekerjaan_ayah },
                  { l: "Penghasilan", v: siswa?.wali_murid?.penghasilan_ayah },
                ]},
                { title: "Ibu", color: "text-rose-700", fields: [
                  { l: "Nama Ibu", v: siswa?.wali_murid?.nama_ibu },
                  { l: "Status", v: siswa?.wali_murid?.status_ibu },
                  { l: "No HP", v: siswa?.wali_murid?.no_hp_ibu },
                  { l: "Pekerjaan", v: siswa?.wali_murid?.pekerjaan_ibu },
                  { l: "Penghasilan", v: siswa?.wali_murid?.penghasilan_ibu },
                ]},
                { title: "Wali Utama", color: "text-emerald-700", fields: [
                  { l: "Nama Wali", v: siswa?.wali_murid?.nama_wali },
                  { l: "No HP Wali", v: siswa?.wali_murid?.no_hp_wali },
                  { l: "Alamat", v: siswa?.wali_murid?.alamat },
                ]},
              ].map(({ title, color, fields }) => (
                <div key={title} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className={`font-bold text-xs ${color} flex items-center gap-1.5`}><User className="w-3.5 h-3.5" />{title}</h4>
                  {fields.map(({ l, v }) => (
                    <div key={l} className="text-xs border-b border-slate-100 pb-1 last:border-0">
                      <span className="text-slate-400">{l}: </span>
                      <span className="font-bold text-slate-700">{v || "—"}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* C. TEMPAT TINGGAL & FASILITAS */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <SectionHeader label="C. Tempat Tinggal & Fasilitas" sub="Kondisi mobilitas, kepemilikan rumah, dan sarana belajar daring" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <EditInput label="Jarak Rumah - Sekolah" field="jarak_rumah_sekolah" placeholder="Contoh: 5 km" />
              <EditSelect label="Transportasi" field="transportasi" options={["Antar Jemput", "Jalan Kaki", "Motor", "Mobil", "Lainnya"]} />
              <EditSelect label="Kepemilikan Rumah" field="kepemilikan_rumah" options={["Kontrak", "Milik Sendiri"]} />
              <EditSelect label="Daya Listrik" field="daya_listrik" options={["450 VA", "900 VA", "1.300 VA", "2.200 VA", "3.500 VA", "4.400 VA", "5.500 VA", "Lebih dari 5.500"]} />
              <EditSelect label="Sumber Air Minum" field="sumber_air" options={["PDAM / PAM", "Sumur Bor"]} />
              <EditSelect label="Akses Internet" field="akses_internet" options={["Paket Data", "Wifi", "Paket data + wifi", "Tidak ada"]} />
              <EditSelect label="Perangkat Belajar Daring" field="perangkat_belajar" options={["Ada", "Tidak"]} />
            </div>
          </div>

          {/* D. DATA SOSIAL & DIGITAL */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <SectionHeader label="D. Data Sosial & Kontak Digital" sub="Nomor kontak pribadi santri dan akun media sosial" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <EditInput label="No HP Siswa" field="no_hp_siswa" placeholder="08xxxxxxxxx" />
              <EditInput label="Email Siswa" field="email_siswa" placeholder="santri@gmail.com" type="email" />
              <EditInput label="Instagram" field="instagram" placeholder="@username" />
              <EditInput label="Facebook" field="facebook" placeholder="Nama akun Facebook" />
              <EditInput label="TikTok" field="tiktok" placeholder="@username_tiktok" />
              <EditInput label="Twitter / X" field="twitter_x" placeholder="@handle_x" />
            </div>
          </div>

          {/* E. RIWAYAT KESEHATAN */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <SectionHeader label="E. Riwayat Kesehatan & Kontak Darurat" sub="Penting untuk penanganan medis & kesiapsiagaan asrama" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <EditSelect label="Merokok" field="merokok" options={["Tidak", "Ya"]} />
              <EditInput label="Riwayat Penyakit" field="riwayat_penyakit" placeholder="Contoh: Asma, Maag" />
              <EditInput label="Riwayat Alergi" field="riwayat_alergi" placeholder="Contoh: Seafood, debu" />
              <EditInput label="Riwayat Operasi" field="riwayat_operasi" placeholder="Contoh: Operasi usus buntu 2024" />
              <EditInput label="Gangguan Kesehatan" field="gangguan_kesehatan" placeholder="Contoh: Migrain" />
              <EditInput label="Dalam Masa Pengobatan" field="dalam_masa_pengobatan" placeholder="Contoh: Obat rutin vitamin" />
              <EditInput label="Asuransi Kesehatan" field="asuransi_kesehatan" placeholder="Contoh: BPJS Kesehatan" />
            </div>
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] font-bold text-rose-700 block mb-1 uppercase tracking-wide">🚨 Kontak Darurat — Nama</span>
                <input type="text" placeholder="Nama Lengkap" value={formData.kontak_darurat_nama || ""} onChange={(e) => setFormData({ ...formData, kontak_darurat_nama: e.target.value })} className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-700 block mb-1 uppercase tracking-wide">Hubungan Keluarga</span>
                <input type="text" placeholder="Contoh: Paman / Kakak" value={formData.kontak_darurat_hubungan || ""} onChange={(e) => setFormData({ ...formData, kontak_darurat_hubungan: e.target.value })} className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-700 block mb-1 uppercase tracking-wide">No HP Kontak Darurat</span>
                <input type="text" placeholder="Contoh: 081298765432" value={formData.kontak_darurat_hp || ""} onChange={(e) => setFormData({ ...formData, kontak_darurat_hp: e.target.value })} className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs" />
              </div>
            </div>
          </div>

          {/* F. RENCANA INTERNSHIP */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <SectionHeader label="F. Rencana Internship / Praktik Dakwah" sub="Proyeksi magang, pengabdian dakwah & kompetensi keahlian" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EditInput label="Nama Instansi" field="internship_instansi" placeholder="Contoh: PT Telkom / Ponpes Cabang" />
              <EditInput label="Alamat Instansi" field="internship_alamat" placeholder="Contoh: Jl. Ahmad Yani No.10" />
              <EditInput label="Bidang Instansi" field="internship_bidang" placeholder="Contoh: Teknologi Informasi / Pendidikan" />
              <EditInput label="Divisi" field="internship_divisi" placeholder="Contoh: Digital Media / Pengajaran" />
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wide">Kompetensi Keahlian yang Dikembangkan</label>
                <textarea rows={3} placeholder="Jelaskan keterampilan yang ditargetkan..." value={formData.internship_kompetensi || ""} onChange={(e) => setFormData({ ...formData, internship_kompetensi: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
            </div>
          </div>

          {/* G. PENDIDIKAN LANJUTAN */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <SectionHeader label="G. Rencana Pendidikan Lanjutan" sub="Pilihan karir akademik, prodi, dan target perguruan tinggi santri" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <EditSelect label="Lanjut Kuliah" field="lanjut_kuliah" options={["Ya", "Tidak"]} />
              <EditInput label="Target Pendidikan" field="target_pendidikan" placeholder="Contoh: S1 / Ma'had Aly" />
              <EditInput label="Program Studi (Prodi)" field="prodi_tujuan" placeholder="Contoh: Teknik Informatika" />
              <EditInput label="Perguruan Tinggi Tujuan" field="universitas_tujuan" placeholder="Contoh: ITS Surabaya / UIN" />
              <EditInput label="Persiapan yang Dilakukan" field="persiapan_kuliah" placeholder="Contoh: Bimbel UTBK, TOAFL" />
              <EditInput label="Sumber Biaya" field="sumber_biaya" placeholder="Contoh: Beasiswa KIP-K" />
              <EditInput label="Jalur Masuk" field="jalur_masuk" placeholder="Contoh: SNBP / SPAN-PTKIN" />
              <EditInput label="Dukungan dari Madrasah" field="dukungan_diharapkan" placeholder="Contoh: Surat rekomendasi" />
            </div>
          </div>

          {/* H. 9 ASPEK FUNDAMENTAL */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <SectionHeader label="H. Penilaian 9 Aspek Fundamental Santri" sub="Skala 1–4 (1: Belum Bisa, 2: Bisa, 3: Butuh Kontrol, 4: Mandiri & Istiqomah)" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {fundamentalItems.map((item) => {
                const currentVal = formData[item.key] || 3;
                return (
                  <div key={item.key} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{item.label}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((skor) => {
                        const isSelected = currentVal === skor;
                        const conf = skorLabels[skor];
                        return (
                          <button
                            key={skor}
                            type="button"
                            onClick={() => setFormData({ ...formData, [item.key]: skor })}
                            className={`py-2 text-center rounded-lg text-xs font-bold transition-all border cursor-pointer ${isSelected ? `${conf.bg} ${conf.color} ring-2 ring-[#162E6E]` : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: SESI KONSULTASI
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "konseling" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="border-b pb-4 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#162E6E]">Catatan Bimbingan & Konseling Santri</h3>
              <p className="text-xs text-slate-400 mt-0.5">Rekam jejak konseling, penanganan kasus, dan tindak lanjut</p>
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
            <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm text-slate-600">Belum Ada Catatan Konseling</p>
              <p className="text-xs text-slate-400 mt-1">Klik "Catat Sesi Baru" untuk membuat catatan bimbingan pertama.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {konselingList.map((sesi: any) => (
                <div key={sesi.konseling_id} className="p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#162E6E]/10 text-[#162E6E]">{sesi.kategori}</span>
                      <h4 className="font-bold text-slate-800 text-sm">{sesi.topik_konseling}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(sesi.tanggal_sesi).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <button
                        onClick={() => { if (window.confirm("Hapus catatan ini?")) deleteKonselingMutation.mutate(sesi.konseling_id); }}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-500 block mb-1">Keluhan / Isu Pokok:</span>
                      <p className="text-slate-700 whitespace-pre-wrap">{sesi.keluhan_masalah}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-500 block mb-1">Dinamika / Refleksi:</span>
                      <p className="text-slate-700 whitespace-pre-wrap">{sesi.dinamika_konseling || "—"}</p>
                    </div>
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      <span className="font-bold text-emerald-800 block mb-1">Solusi & Kesepakatan:</span>
                      <p className="text-emerald-700 whitespace-pre-wrap">{sesi.solusi_kesepakatan || "—"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">Konselor: <b className="text-slate-700">{sesi.pegawai?.nama || "Guru BK / Wali Kelas"}</b></span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-600">{sesi.sifat_rahasia}</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${sesi.status_follow_up === "Selesai" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{sesi.status_follow_up}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL TAMBAH SESI KONSELING ─────────────────────────────────────── */}
      {showAddKonselingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b pb-3 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Catat Sesi Bimbingan & Konseling</h3>
              <button onClick={() => setShowAddKonselingModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Sesi</label>
                  <input type="date" value={konselingForm.tanggal_sesi} onChange={(e) => setKonselingForm({ ...konselingForm, tanggal_sesi: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select value={konselingForm.kategori} onChange={(e) => setKonselingForm({ ...konselingForm, kategori: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
                    {["Akademik", "Karakter & Adab", "Sosial & Teman Sebaya", "Kedisiplinan & Tata Tertib", "Minat & Karir / Lanjutan", "Pribadi & Emosional", "Lainnya"].map((k) => <option key={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Topik Utama *</label>
                <input type="text" placeholder="Contoh: Penurunan nilai MIPA" value={konselingForm.topik_konseling} onChange={(e) => setKonselingForm({ ...konselingForm, topik_konseling: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Keluhan / Masalah *</label>
                <textarea rows={3} placeholder="Deskripsikan inti masalah..." value={konselingForm.keluhan_masalah} onChange={(e) => setKonselingForm({ ...konselingForm, keluhan_masalah: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dinamika / Respon Santri</label>
                <textarea rows={2} value={konselingForm.dinamika_konseling} onChange={(e) => setKonselingForm({ ...konselingForm, dinamika_konseling: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Solusi / Kesepakatan</label>
                <textarea rows={2} value={konselingForm.solusi_kesepakatan} onChange={(e) => setKonselingForm({ ...konselingForm, solusi_kesepakatan: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Follow-up</label>
                  <select value={konselingForm.status_follow_up} onChange={(e) => setKonselingForm({ ...konselingForm, status_follow_up: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
                    {["Dalam Pemantauan", "Perlu Sesi Lanjutan", "Selesai", "Dirujuk ke Pihak Luar"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sifat Kerahasiaan</label>
                  <select value={konselingForm.sifat_rahasia} onChange={(e) => setKonselingForm({ ...konselingForm, sifat_rahasia: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
                    {["Internal Guru/Wali Kelas", "Sangat Rahasia (Hanya BK)", "Boleh Diinfokan ke Ortu", "Umum"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowAddKonselingModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">Batal</button>
              <button
                onClick={() => {
                  if (!konselingForm.topik_konseling || !konselingForm.keluhan_masalah) { toast.error("Topik dan keluhan wajib diisi!"); return; }
                  addKonselingMutation.mutate(konselingForm);
                }}
                disabled={addKonselingMutation.isPending}
                className="px-5 py-2 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
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
