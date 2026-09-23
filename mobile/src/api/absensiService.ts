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

export type AttendanceStatusType = "Hadir" | "Sakit" | "Izin" | "Alpha" | "Dispen";

export interface AbsensiDetailPayload {
  siswa_id: number;
  status: AttendanceStatusType;
  waktu_kehadiran?: string;
  catatan?: string;
}

export interface SubmitAbsensiMapelPayload {
  jadwal_id: number;
  kelas_id?: number;
  mapel_id?: number;
  tanggal?: string; // YYYY-MM-DD
  pertemuan_ke?: number;
  materi_diajarkan?: string;
  catatan_guru?: string;
  catatan_tambahan?: string;
  lesson_plan_detail_id?: number;
  status?: string;
  detail_absensi: AbsensiDetailPayload[];
}

export interface JurnalMengajarItem {
  jurnal_id: number;
  jadwal_id: number;
  lesson_plan_detail_id?: number | null;
  pertemuan_ke?: number;
  status?: string;
  tanggal: string;
  catatan_tambahan?: string;
  jadwal?: {
    jadwal_id: number;
    ruangan?: string;
    hari?: string;
    kelas?: { kelas_id: number; nama_kelas: string };
    mapel?: { mapel_id: number; nama_mapel: string };
    pegawai?: { pegawai_id: number; nama: string };
  };
  lesson_plan_detail?: {
    detail_id: number;
    pertemuan_ke: number;
    materi?: string;
    topik_materi?: string;
  };
  absensi_pelajaran?: Array<{
    absensi_pel_id: number;
    siswa_id: number;
    status: string;
    waktu_kehadiran?: string;
    siswa?: {
      siswa_id: number;
      nama: string;
      nis: string;
      nisn: string;
    };
  }>;
}

export interface LessonPlanDetailItem {
  detail_id: number;
  lesson_plan_id: number;
  pertemuan_ke: number;
  materi?: string;
  topik_materi?: string;
  rencana_pelaksanaan_kbm?: string;
  isi?: string;
  status_verifikasi_kepsek?: string;
  status_verifikasi_direktur?: string;
}

export interface LessonPlanItem {
  lesson_plan_id: number;
  pegawai_id: number;
  jadwal_id?: number | null;
  judul_rpp: string;
  status_verifikasi_kepsek?: string;
  status_verifikasi_direktur?: string;
  jadwal?: {
    jadwal_id: number;
    kelas?: { kelas_id: number; nama_kelas: string };
    mapel?: { mapel_id: number; nama_mapel: string };
  };
  details?: LessonPlanDetailItem[];
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
    jurnal_id?: number;
    siswa_id?: number;
  }) => {
    const response = await apiClient.get("/kbm/absensi-pelajaran", { params });
    return response.data?.data || response.data || [];
  },

  // Submit absensi mapel terpadu (Atomic Sesi: Jurnal Mengajar + Absensi Pelajaran)
  submitAbsensiMapel: async (payload: SubmitAbsensiMapelPayload) => {
    const response = await apiClient.post("/kbm/absensi-pelajaran/submit-sesi", payload);
    return response.data;
  },

  // Ambil riwayat jurnal mengajar
  getJurnalMengajar: async (params?: {
    pegawai_id?: number;
    jadwal_id?: number;
    tanggal?: string;
    kelas_id?: number;
  }): Promise<JurnalMengajarItem[]> => {
    const response = await apiClient.get("/kbm/jurnal-mengajar", { params });
    return response.data?.data || response.data || [];
  },

  // Ambil data lesson plan guru
  getLessonPlans: async (params?: {
    pegawai_id?: number;
    jadwal_id?: number;
  }): Promise<LessonPlanItem[]> => {
    const response = await apiClient.get("/kbm/lesson-plan", { params });
    return response.data?.data || response.data || [];
  },

  // Ambil detail lesson plan
  getLessonPlanDetails: async (params?: {
    lesson_plan_id?: number;
  }): Promise<LessonPlanDetailItem[]> => {
    const response = await apiClient.get("/kbm/lesson-plan-detail", { params });
    return response.data?.data || response.data || [];
  },
};

