// mobile/src/api/tahfidzService.ts
import { apiClient } from "./client";

export interface TahfidzSiswaItem {
  siswa_id: number;
  nama: string;
  nisn?: string;
  nis?: string;
  kelas_id?: number;
  kelas?: {
    kelas_id: number;
    nama_kelas: string;
  };
}

export interface SubmitTahfidzPayload {
  siswa_id: number;
  pegawai_id?: number;
  kategori: "Al-Quran" | "Hadits" | "Matan Ilmu";
  jenis_hafalan: "Setoran Baru" | "Setoran Ulang" | "Ujian";
  tanggal: string;
  durasi_menit?: number;
  kelancaran: "Sangat Lancar" | "Lancar" | "Kurang Lancar" | "Belum Lancar";
  catatan_guru?: string;
  // Al-Quran
  surat_mulai?: number;
  surat_mulai_nama?: string;
  ayat_mulai?: number;
  surat_selesai?: number;
  surat_selesai_nama?: string;
  ayat_selesai?: number;
  total_ayat?: number;
  // Hadits
  kitab_hadits?: string;
  hadits_no_mulai?: number;
  hadits_no_selesai?: number;
  total_hadits?: number;
  // Matan Ilmu
  nama_matan?: string;
  bait_mulai?: number;
  bait_selesai?: number;
  total_bait?: number;
}

export interface KolosalSetoranItem {
  siswa_id: number;
  kategori?: "Al-Quran" | "Hadits" | "Matan Ilmu";
  jenis_hafalan?: "Setoran Baru" | "Setoran Ulang" | "Ujian";
  kelancaran?: "Sangat Lancar" | "Lancar" | "Kurang Lancar" | "Belum Lancar";
  catatan_guru?: string;
  // Al-Quran
  surat_mulai?: number;
  surat_mulai_nama?: string;
  ayat_mulai?: number;
  surat_selesai?: number;
  surat_selesai_nama?: string;
  ayat_selesai?: number;
  total_ayat?: number;
  // Hadits
  kitab_hadits?: string;
  hadits_no_mulai?: number;
  hadits_no_selesai?: number;
  total_hadits?: number;
  // Matan
  nama_matan?: string;
  bait_mulai?: number;
  bait_selesai?: number;
  total_bait?: number;
}

export interface SubmitKolosalPayload {
  items: KolosalSetoranItem[];
  tanggal: string;
  kategori: "Al-Quran" | "Hadits" | "Matan Ilmu";
  jenis_hafalan: "Setoran Baru" | "Setoran Ulang" | "Ujian";
  kelancaran?: "Sangat Lancar" | "Lancar" | "Kurang Lancar" | "Belum Lancar";
  catatan_guru?: string;
  surat_mulai?: number;
  surat_mulai_nama?: string;
  ayat_mulai?: number;
  surat_selesai?: number;
  surat_selesai_nama?: string;
  ayat_selesai?: number;
  total_ayat?: number;
  kitab_hadits?: string;
  hadits_no_mulai?: number;
  hadits_no_selesai?: number;
  total_hadits?: number;
  nama_matan?: string;
  bait_mulai?: number;
  bait_selesai?: number;
  total_bait?: number;
}

export interface HalaqahItem {
  halaqah_id: number;
  nama_halaqah: string;
  status: string;
  deskripsi?: string;
  pegawai?: { pegawai_id: number; nama: string };
  lembaga?: { lembaga_id: number; nama: string };
  tahun_ajaran?: { tahun_id: number; nama: string };
  anggota?: {
    id: number;
    siswa_id: number;
    siswa: TahfidzSiswaItem;
  }[];
  _count?: {
    anggota: number;
  };
}

export const tahfidzService = {
  // Ambil santri binaan
  getSantriTahfidz: async (params?: { kelas_id?: number; pegawai_id?: number; halaqah_id?: number }) => {
    const res = await apiClient.get("/tahfidz/santri", { params });
    return res.data?.data || [];
  },

  // Submit setoran hafalan individu
  submitSetoran: async (payload: SubmitTahfidzPayload) => {
    const res = await apiClient.post("/tahfidz/setoran", payload);
    return res.data;
  },

  // Submit setoran hafalan kolosal
  submitSetoranKolosal: async (payload: SubmitKolosalPayload) => {
    const res = await apiClient.post("/tahfidz/setoran/kolosal", payload);
    return res.data;
  },

  // Ambil riwayat setoran
  getSetoranList: async (params?: {
    siswa_id?: number;
    kategori?: string;
    jenis_hafalan?: string;
    kelancaran?: string;
    tanggal_mulai?: string;
    tanggal_selesai?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get("/tahfidz/setoran", { params });
    return res.data || { data: [] };
  },

  // Ambil daftar halaqoh
  getHalaqahList: async (params?: { lembaga_id?: number; status?: string }) => {
    const res = await apiClient.get("/tahfidz/halaqah", { params });
    return res.data?.data || [];
  },

  // Ambil statistik summary guru / dashboard
  getDashboardSummary: async () => {
    const res = await apiClient.get("/tahfidz/statistik/dashboard");
    return res.data?.data || null;
  },

  // Ambil target dan statistik siswa
  getStatistikSiswa: async (siswa_id: number) => {
    const res = await apiClient.get(`/tahfidz/statistik/siswa/${siswa_id}`);
    return res.data?.data || null;
  },

  // Ambil target siswa
  getTargetsBySiswa: async (siswa_id: number) => {
    const res = await apiClient.get(`/tahfidz/target/${siswa_id}`);
    return res.data?.data || [];
  },
};

