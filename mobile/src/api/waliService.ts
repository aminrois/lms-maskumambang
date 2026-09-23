// mobile/src/api/waliService.ts
import { apiClient } from "./client";

export interface AnakItem {
  siswa_id: number;
  nis: string;
  nisn: string;
  nama: string;
  panggilan?: string;
  jenis_kelamin: string;
  status: string;
  kelas?: {
    kelas_id: number;
    nama_kelas: string;
    lembaga?: {
      lembaga_id: number;
      nama_lembaga: string;
      singkatan?: string;
    };
  };
  tahfidz_target?: {
    target_id: number;
    kategori: string;
    target_nominal: number;
    satuan: string;
    status: string;
  }[];
  tahfidz_setoran?: {
    setoran_id: number;
    kategori: string;
    jenis_hafalan: string;
    tanggal: string;
    surat_mulai_nama?: string;
    ayat_mulai?: number;
    surat_selesai_nama?: string;
    ayat_selesai?: number;
    total_ayat?: number;
    kelancaran: string;
    catatan_guru?: string;
    pegawai?: {
      nama: string;
    };
  }[];
}

export interface PerkembanganAnakData {
  siswa: AnakItem;
  presensi: {
    hariIni: {
      status: string;
      jam_masuk?: string;
      keterangan?: string;
    } | null;
    rekap30Hari: {
      total: number;
      hadir: number;
      sakit: number;
      izin: number;
      alpa: number;
    };
    riwayat: {
      absensi_id: number;
      tanggal: string;
      status: string;
      keterangan?: string;
    }[];
  };
  tahfidz: {
    summary: {
      totalSetoran: number;
      totalJuzZiyadah: number;
      totalAyatZiyadah: number;
      totalHaditsZiyadah: number;
      totalBaitZiyadah: number;
    };
    targetAktif: {
      target_id: number;
      kategori: string;
      target_deskripsi: string;
      target_nominal: number;
      satuan: string;
      status?: string;
    } | null;
    targets: any[];
    recentSetoran: any[];
  };
  jadwalPelajaran: {
    jadwal_id: number;
    hari: string;
    jam_ke: number;
    mata_pelajaran?: {
      nama_mapel: string;
    };
    pegawai?: {
      nama: string;
    };
    jam_akademik?: {
      jam_mulai: string;
      jam_selesai: string;
    };
  }[];
}

export const waliService = {
  getDaftarAnak: async (): Promise<AnakItem[]> => {
    const res = await apiClient.get<{ success: boolean; data: AnakItem[] }>("/wali/anak");
    return res.data?.data || [];
  },

  getPerkembanganAnak: async (siswa_id: number): Promise<PerkembanganAnakData> => {
    const res = await apiClient.get<{ success: boolean; data: PerkembanganAnakData }>(
      `/wali/anak/${siswa_id}/perkembangan`
    );
    return res.data?.data;
  },
};
