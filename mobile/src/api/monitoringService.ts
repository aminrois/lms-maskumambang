// mobile/src/api/monitoringService.ts
import { apiClient } from "./client";

export interface KbmMonitoringItem {
  jurnal_id: number;
  tanggal: string;
  jadwal?: {
    jadwal_id: number;
    kelas?: { kelas_id: number; nama_kelas: string };
    mapel?: { mapel_id: number; nama_mapel: string };
    pegawai?: { pegawai_id: number; nama: string };
    jam_mulai?: { jam_mulai: string };
    jam_selesai?: { jam_selesai: string };
    ruangan?: string;
  };
  lesson_plan_detail?: {
    pertemuan_ke: number;
    materi?: string;
  };
  absensi_pelajaran?: Array<{
    status: string;
    siswa_id: number;
  }>;
}

export interface LessonPlanRekapItem {
  pegawai_id: number;
  nama: string;
  nig?: string;
  total_rpp: number;
  total_detail: number;
  verified_kepsek: number;
  verified_direktur: number;
  lembaga_names?: string;
}

export const monitoringService = {
  // Ambil sesi KBM aktif / jurnal monitoring
  getKbmMonitoring: async (params?: {
    p_lembaga_id?: number;
    p_kelas_id?: number;
    p_tanggal_mulai?: string;
    p_tanggal_akhir?: string;
  }): Promise<KbmMonitoringItem[]> => {
    try {
      const response = await apiClient.post("/rpc/monitoring_kbm", params || {});
      return response.data?.data || response.data || [];
    } catch {
      return [];
    }
  },

  // Ambil rekap Lesson Plan guru
  getLessonPlanRekap: async (params?: {
    lembaga_id?: number;
    target_pertemuan?: number;
  }): Promise<any> => {
    try {
      const response = await apiClient.get("/kbm/lesson-plan/monitoring-rekap", { params });
      return response.data?.data || response.data || {};
    } catch {
      return {};
    }
  },
};
