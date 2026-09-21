// mobile/src/api/absensiService.ts
import { apiClient } from "./client";

export interface SiswaItem {
  siswa_id: number;
  nisn: string;
  nis?: string;
  nama?: string;
  nama_lengkap?: string;
  jenis_kelamin?: string;
  kelas_id?: number;
}

export interface AbsensiDetailPayload {
  siswa_id: number;
  status: "Hadir" | "Sakit" | "Izin" | "Alpha" | "Terlambat";
  catatan?: string;
}

export interface SubmitAbsensiMapelPayload {
  jadwal_id: number;
  kelas_id: number;
  mapel_id: number;
  tanggal: string; // YYYY-MM-DD
  pertemuan_ke?: number;
  materi_diajarkan?: string;
  catatan_guru?: string;
  detail_absensi: AbsensiDetailPayload[];
}

export const absensiService = {
  // Ambil daftar siswa berdasarkan kelas
  getSiswaByKelas: async (kelas_id: number): Promise<SiswaItem[]> => {
    const response = await apiClient.get("/master/siswa", {
      params: { kelas_id, limit: 100 },
    });
    return response.data?.data || response.data || [];
  },

  // Ambil riwayat absensi pelajaran
  getAbsensiPelajaran: async (params?: {
    jadwal_id?: number;
    tanggal?: string;
    kelas_id?: number;
  }) => {
    const response = await apiClient.get("/kbm/absensi-pelajaran", { params });
    return response.data?.data || response.data || [];
  },

  // Submit absensi mapel
  submitAbsensiMapel: async (payload: SubmitAbsensiMapelPayload) => {
    const response = await apiClient.post("/kbm/absensi-pelajaran", payload);
    return response.data;
  },

  // Ambil riwayat jurnal mengajar
  getJurnalMengajar: async (params?: { pegawai_id?: number; tanggal?: string }) => {
    const response = await apiClient.get("/kbm/jurnal-mengajar", { params });
    return response.data?.data || response.data || [];
  },

  // Ambil data lesson plan guru
  getLessonPlans: async (params?: { pegawai_id?: number; status?: string }) => {
    const response = await apiClient.get("/kbm/lesson-plan", { params });
    return response.data?.data || response.data || [];
  },
};
