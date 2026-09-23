// mobile/src/api/jadwalService.ts
import { apiClient } from "./client";

export interface JamAkademikItem {
  jam_id: number;
  lembaga_id?: number;
  urutan_jam: number;
  jam_mulai: string;
  jam_selesai: string;
  tipe?: string;
}

export interface JadwalItem {
  jadwal_id: number;
  hari: string;
  jam_mulai_id?: number | null;
  jam_selesai_id?: number | null;
  jam_mulai?: JamAkademikItem | null;
  jam_selesai?: JamAkademikItem | null;
  // Computed / fallback
  jam_ke?: number;
  mapel_id: number;
  kelas_id: number;
  pegawai_id: number;
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

export interface GroupedJadwalSesi {
  sesiKey: string;
  jadwalIds: number[];
  kelasId: number;
  mapelId: number;
  namaKelas: string;
  namaMapel: string;
  hari: string;
  labelJam: string;
  timeRangeStr: string;
  jumlahJam: number;
  urutanMulai: number;
  urutanSelesai: number;
  firstJadwal: JadwalItem;
  isLPReady?: boolean;
  lessonPlanDetailId?: number | null;
  statusVerifikasiKepsek?: string;
  statusVerifikasiDirektur?: string;
}

export const jadwalService = {
  getJadwalPelajaran: async (params?: {
    pegawai_id?: number;
    hari?: string;
    kelas_id?: number;
    tahun_ajaran_id?: number;
  }): Promise<JadwalItem[]> => {
    const response = await apiClient.get("/akademik/jadwal-pelajaran", { params });
    const list = response.data?.data || response.data || [];
    return Array.isArray(list) ? list : [];
  },
};
