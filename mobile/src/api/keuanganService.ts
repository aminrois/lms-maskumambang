// mobile/src/api/keuanganService.ts
import { apiClient } from './client';

export interface PosPembayaran {
  pos_id: number;
  nama_pos: string;
  kode_pos: string;
  tipe_pembayaran: string;
  deskripsi?: string;
}

export interface TagihanItem {
  tagihan_id: number;
  siswa_id: number;
  pos_id: number;
  bulan?: number | null;
  tahun_periode?: number | null;
  nama_tagihan: string;
  nominal_total: number;
  nominal_terbayar: number;
  sisa_tagihan: number;
  status: 'Belum Bayar' | 'Sebagian' | 'Lunas';
  jatuh_tempo?: string | null;
  keterangan?: string | null;
  pos: PosPembayaran;
}

export interface RekeningPesantren {
  rekening_id: number;
  nama_bank: string;
  nomor_rekening: string;
  atas_nama: string;
  cabang?: string;
  is_active: boolean;
}

export interface PembayaranTransaksiItem {
  item_id: number;
  transaksi_id: number;
  tagihan_id: number;
  nominal_bayar: number;
  tagihan?: TagihanItem;
}

export interface PembayaranTransaksi {
  transaksi_id: number;
  nomor_transaksi: string;
  siswa_id: number;
  tanggal_bayar: string;
  total_bayar: number;
  metode_pembayaran: string;
  rekening_tujuan_id?: number | null;
  bank_pengirim?: string | null;
  nomor_rekening_pengirim?: string | null;
  atas_nama_pengirim?: string | null;
  bukti_transfer_url?: string | null;
  status: 'Menunggu Verifikasi' | 'Disetujui' | 'Ditolak';
  catatan?: string | null;
  alasan_penolakan?: string | null;
  waktu_verifikasi?: string | null;
  created_at: string;
  rekening_tujuan?: RekeningPesantren | null;
  items?: PembayaranTransaksiItem[];
}

export interface KeuanganWaliData {
  siswaList: {
    siswa_id: number;
    nama: string;
    nis: string;
    kelas: string;
  }[];
  selectedSiswaId: number;
  ringkasan: {
    total_tunggakan: number;
    total_terbayar: number;
    status_spp_bulan_ini: string;
    spp_bulan_ini?: TagihanItem | null;
  };
  kategori: {
    uang_pangkal: TagihanItem[];
    spp: TagihanItem[];
    kegiatan: TagihanItem[];
    seragam: TagihanItem[];
    lainnya: TagihanItem[];
  };
  riwayat_transaksi: PembayaranTransaksi[];
  rekening_pesantren: RekeningPesantren[];
}

export const keuanganService = {
  getKeuanganWali: async (siswa_id?: number): Promise<KeuanganWaliData> => {
    const params = siswa_id ? { siswa_id } : {};
    const res = await apiClient.get<{ success: boolean; data: KeuanganWaliData }>('/keuangan/wali-santri', { params });
    return res.data?.data;
  },

  ajukanTransfer: async (payload: {
    siswa_id: number;
    items: { tagihan_id: number; nominal_bayar: number }[];
    rekening_tujuan_id: number;
    bank_pengirim?: string;
    nomor_rekening_pengirim?: string;
    atas_nama_pengirim?: string;
    bukti_transfer_url?: string;
    catatan?: string;
  }) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>('/keuangan/ajukan-transfer', payload);
    return res.data;
  },

  getKuitansi: async (transaksi_id: number) => {
    const res = await apiClient.get<{ success: boolean; data: any }>(`/keuangan/kuitansi/${transaksi_id}`);
    return res.data?.data;
  },
};
