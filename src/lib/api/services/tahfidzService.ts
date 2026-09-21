// src/lib/api/services/tahfidzService.ts
import { apiClient } from '../axios';

export interface TahfidzPengampuItem {
  pengampu_id: number;
  pegawai_id: number;
  lembaga_id: number;
  kelas_id: number;
  tahun_id?: number;
  created_at: string;
  pegawai?: {
    pegawai_id: number;
    nama: string;
    nig: string;
    jabatan?: string;
  };
  kelas?: {
    kelas_id: number;
    nama_kelas: string;
    lembaga?: {
      lembaga_id: number;
      nama_lembaga: string;
      singkatan?: string;
    };
    siswa?: { siswa_id: number }[];
  };
  lembaga?: {
    lembaga_id: number;
    nama_lembaga: string;
    singkatan?: string;
  };
}

export interface TahfidzTargetItem {
  target_id: number;
  siswa_id: number;
  kategori: 'Al-Quran' | 'Hadits' | 'Matan Ilmu';
  target_deskripsi: string;
  target_nominal: number;
  satuan: string;
  tanggal_mulai: string;
  tanggal_target?: string;
  status: 'Aktif' | 'Tercapai' | 'Ditunda';
}

export interface TahfidzSetoranItem {
  setoran_id: number;
  siswa_id: number;
  pegawai_id: number;
  kategori: 'Al-Quran' | 'Hadits' | 'Matan Ilmu';
  jenis_hafalan: 'Setoran Baru' | 'Setoran Ulang';
  tanggal: string;
  durasi_menit?: number;
  kelancaran: 'Sangat Lancar' | 'Lancar' | 'Kurang Lancar' | 'Belum Lancar';
  catatan_guru?: string;
  // Al-Quran
  surat_mulai?: number;
  surat_mulai_nama?: string;
  ayat_mulai?: number;
  surat_selesai?: number;
  surat_selesai_nama?: string;
  ayat_selesai?: number;
  juz?: number;
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
  created_at?: string;
  siswa?: {
    siswa_id: number;
    nama: string;
    nis?: string;
    nisn?: string;
    kelas?: {
      kelas_id: number;
      nama_kelas: string;
    };
  };
  pegawai?: {
    pegawai_id: number;
    nama: string;
  };
}

export const tahfidzService = {
  // 1. Penugasan Guru Tahfidz
  getPengampu: async (params?: { lembaga_id?: number; pegawai_id?: number; tahun_id?: number }) => {
    const res = await apiClient.get('/tahfidz/pengampu', { params });
    return res.data?.data || [];
  },

  assignPengampu: async (payload: { pegawai_id: number; lembaga_id: number; kelas_id: number; tahun_id?: number }) => {
    const res = await apiClient.post('/tahfidz/pengampu', payload);
    return res.data;
  },

  deletePengampu: async (id: number) => {
    const res = await apiClient.delete(`/tahfidz/pengampu/${id}`);
    return res.data;
  },

  // 2. Santri Binaan
  getSantriTahfidz: async (params?: { kelas_id?: number; lembaga_id?: number; pegawai_id?: number }) => {
    const res = await apiClient.get('/tahfidz/santri', { params });
    return res.data?.data || [];
  },

  // 3. Target
  getTargetsBySiswa: async (siswa_id: number) => {
    const res = await apiClient.get(`/tahfidz/target/${siswa_id}`);
    return res.data?.data || [];
  },

  createTarget: async (payload: Partial<TahfidzTargetItem>) => {
    const res = await apiClient.post('/tahfidz/target', payload);
    return res.data;
  },

  updateTarget: async (id: number, payload: Partial<TahfidzTargetItem>) => {
    const res = await apiClient.patch(`/tahfidz/target/${id}`, payload);
    return res.data;
  },

  deleteTarget: async (id: number) => {
    const res = await apiClient.delete(`/tahfidz/target/${id}`);
    return res.data;
  },

  // 4. Setoran
  getSetoranList: async (params?: {
    siswa_id?: number;
    kelas_id?: number;
    kategori?: string;
    jenis_hafalan?: string;
    pegawai_id?: number;
    tanggal_mulai?: string;
    tanggal_akhir?: string;
    limit?: number;
    offset?: number;
  }) => {
    const res = await apiClient.get('/tahfidz/setoran', { params });
    return res.data;
  },

  createSetoran: async (payload: Partial<TahfidzSetoranItem>) => {
    const res = await apiClient.post('/tahfidz/setoran', payload);
    return res.data;
  },

  deleteSetoran: async (id: number) => {
    const res = await apiClient.delete(`/tahfidz/setoran/${id}`);
    return res.data;
  },

  // 5. Dashboard & Statistik Siswa
  getDashboardSummary: async (params?: { lembaga_id?: number; kelas_id?: number; pegawai_id?: number }) => {
    const res = await apiClient.get('/tahfidz/statistik/dashboard', { params });
    return res.data?.data;
  },

  getStatistikSiswa: async (siswa_id: number) => {
    const res = await apiClient.get(`/tahfidz/statistik/siswa/${siswa_id}`);
    return res.data?.data;
  },
};
