// mobile/src/api/guidanceService.ts
import { apiClient } from "./client";

export interface SiswaGuidanceItem {
  siswa_id: number;
  nama: string;
  nis: string;
  foto?: string | null;
  kelas: string;
  lembaga: string;
  is_profile_filled: boolean;
  avg_fundamental: number;
  rencana_kuliah: string;
  target_pendidikan: string;
  universitas_tujuan: string;
  last_konseling?: any | null;
}

export interface GuidanceDetail {
  jarak_rumah_sekolah?: string;
  transportasi?: string;
  kepemilikan_rumah?: string;
  daya_listrik?: string;
  sumber_air?: string;
  akses_internet?: string;
  perangkat_belajar?: string;

  no_hp_siswa?: string;
  email_siswa?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  twitter_x?: string;

  merokok?: string;
  riwayat_penyakit?: string;
  riwayat_alergi?: string;
  riwayat_operasi?: string;
  gangguan_kesehatan?: string;
  dalam_masa_pengobatan?: string;
  asuransi_kesehatan?: string;
  kontak_darurat_nama?: string;
  kontak_darurat_hubungan?: string;
  kontak_darurat_hp?: string;

  internship_nama?: string;
  internship_alamat?: string;
  internship_bidang?: string;
  internship_divisi?: string;
  internship_kompetensi?: string;

  lanjut_kuliah?: string;
  target_pendidikan?: string;
  prodi_pilihan?: string;
  universitas_tujuan?: string;
  persiapan?: string;
  sumber_biaya?: string;
  jalur_masuk?: string;
  dukungan_diharapkan?: string;

  skor_wudhu?: number;
  skor_doa_sholat?: number;
  skor_praktik_sholat?: number;
  skor_jamaah_masjid?: number;
  skor_alquran?: number;
  skor_hafalan_juz30?: number;
  skor_disiplin?: number;
  skor_rapi?: number;
  skor_adab?: number;
  catatan_fundamental?: string;
}

export interface KonselingSesi {
  konseling_id: number;
  siswa_id: number;
  pegawai_id: number;
  tanggal_sesi: string;
  kategori: string;
  topik_konseling: string;
  keluhan_masalah: string;
  dinamika_konseling?: string;
  solusi_kesepakatan?: string;
  status_follow_up: string;
  sifat_rahasia: string;
  catatan_tindak_lanjut?: string;
  siswa?: {
    nama: string;
    nis: string;
    kelas?: { nama_kelas: string };
  };
  pegawai?: {
    nama: string;
    jabatan?: string;
  };
}

export const guidanceService = {
  // Mendapatkan daftar siswa binaan/bimbingan (Murobbi / Wali Kelas / Direktur)
  getSiswaList: async (): Promise<SiswaGuidanceItem[]> => {
    const res = await apiClient.get("/guidance/siswa");
    return res.data?.data || [];
  },

  // Mendapatkan detail lengkap bimbingan siswa (termasuk profil, fundamental & konseling)
  getSiswaDetail: async (siswa_id: number | string): Promise<any> => {
    const res = await apiClient.get(`/guidance/siswa/${siswa_id}`);
    return res.data?.data;
  },

  // Menyimpan pembaruan profil & aspek fundamental bimbingan siswa
  saveSiswaDetail: async (siswa_id: number | string, data: Partial<GuidanceDetail>): Promise<any> => {
    const res = await apiClient.put(`/guidance/siswa/${siswa_id}`, data);
    return res.data?.data;
  },

  // Mendapatkan daftar sesi konseling
  getKonselingList: async (params?: {
    siswa_id?: number | string;
    kategori?: string;
    status_follow_up?: string;
    search?: string;
  }): Promise<KonselingSesi[]> => {
    const res = await apiClient.get("/guidance/konseling", { params });
    return res.data?.data || [];
  },

  // Mencatat sesi konseling baru
  createKonseling: async (data: {
    siswa_id: number;
    tanggal_sesi?: string;
    kategori?: string;
    topik_konseling: string;
    keluhan_masalah: string;
    dinamika_konseling?: string;
    solusi_kesepakatan?: string;
    status_follow_up?: string;
    sifat_rahasia?: string;
    catatan_tindak_lanjut?: string;
  }): Promise<any> => {
    const res = await apiClient.post("/guidance/konseling", data);
    return res.data?.data;
  },

  // Memperbarui status follow-up sesi konseling
  updateFollowUp: async (
    konseling_id: number,
    data: {
      status_follow_up: string;
      catatan_tindak_lanjut?: string;
      solusi_kesepakatan?: string;
    }
  ): Promise<any> => {
    const res = await apiClient.patch(`/guidance/konseling/${konseling_id}`, data);
    return res.data?.data;
  },

  // Menghapus sesi konseling
  deleteKonseling: async (konseling_id: number): Promise<any> => {
    const res = await apiClient.delete(`/guidance/konseling/${konseling_id}`);
    return res.data;
  },
};
