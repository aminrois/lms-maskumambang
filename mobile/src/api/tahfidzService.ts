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

export const tahfidzService = {
  // Ambil santri binaan
  getSantriTahfidz: async (params?: { kelas_id?: number; pegawai_id?: number }) => {
    const res = await apiClient.get("/tahfidz/santri", { params });
    return res.data?.data || [];
  },

  // Submit setoran hafalan
  submitSetoran: async (payload: SubmitTahfidzPayload) => {
    const res = await apiClient.post("/tahfidz/setoran", payload);
    return res.data;
  },

  // Ambil riwayat setoran
  getSetoranList: async (params?: { siswa_id?: number; limit?: number }) => {
    const res = await apiClient.get("/tahfidz/setoran", { params });
    return res.data?.data || [];
  },
};
