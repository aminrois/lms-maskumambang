// mobile/src/api/jadwalService.ts
import { apiClient } from "./client";

export interface JadwalItem {
  jadwal_id: number;
  hari: string;
  jam_ke: number;
  jam_mulai: string;
  jam_selesai: string;
  mapel_id: number;
  kelas_id: number;
  pegawai_id: number;
  tahun_ajaran_id?: number;
  ruangan?: string;
  mapel?: {
    mapel_id: number;
    nama_mapel: string;
    kode_mapel?: string;
  };
  kelas?: {
    kelas_id: number;
    nama_kelas: string;
  };
  pegawai?: {
    pegawai_id: number;
    nama: string;
  };
}

export const jadwalService = {
  getJadwalPelajaran: async (params?: {
    pegawai_id?: number;
    hari?: string;
    kelas_id?: number;
    tahun_ajaran_id?: number;
  }): Promise<JadwalItem[]> => {
    const response = await apiClient.get("/akademik/jadwal-pelajaran", { params });
    // Normalize if returned as { data: [...] } or direct array
    return response.data?.data || response.data || [];
  },
};
