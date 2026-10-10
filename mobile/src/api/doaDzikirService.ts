// mobile/src/api/doaDzikirService.ts
import { apiClient } from "./client";
import { DOA_DZIKIR_LIST, DoaItem } from "../utils/islamicPrayerUtil";

export interface ApiDoaDzikirItem {
  id: number;
  judul: string;
  kategori: string;
  arab: string;
  latin?: string | null;
  arti: string;
  riwayat?: string | null;
  urutan: number;
  is_active: boolean;
}

export const doaDzikirService = {
  // Ambil semua doa & dzikir aktif dari server dengan fallback ke data lokal
  getAll: async (kategori?: string, search?: string): Promise<DoaItem[]> => {
    try {
      const params: any = { is_active: true };
      if (kategori && kategori !== "Semua") {
        params.kategori = kategori;
      }
      if (search && search.trim()) {
        params.search = search.trim();
      }

      const res = await apiClient.get<{ success: boolean; data: ApiDoaDzikirItem[] }>(
        "/doa-dzikir",
        { params }
      );

      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data.map((item) => ({
          id: String(item.id),
          judul: item.judul,
          kategori: item.kategori,
          arab: item.arab,
          latin: item.latin || "",
          arti: item.arti,
          riwayat: item.riwayat || undefined,
        }));
      }
    } catch (error) {
      console.warn("Gagal mengambil Doa & Dzikir dari server, menggunakan cache lokal:", error);
    }

    // Fallback ke koleksi lokal jika server offline / belum ada koneksi
    let fallback = [...DOA_DZIKIR_LIST];
    if (kategori && kategori !== "Semua") {
      fallback = fallback.filter((d) => d.kategori === kategori);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      fallback = fallback.filter(
        (d) =>
          d.judul.toLowerCase().includes(q) ||
          d.arti.toLowerCase().includes(q) ||
          d.latin.toLowerCase().includes(q)
      );
    }
    return fallback;
  },

  // Ambil daftar kategori unik
  getCategories: async (): Promise<string[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: string[] }>(
        "/doa-dzikir/categories"
      );
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return ["Semua", ...res.data.data];
      }
    } catch (e) {
      // fallback
    }

    const localCategories = Array.from(new Set(DOA_DZIKIR_LIST.map((d) => d.kategori)));
    return ["Semua", ...localCategories];
  },
};
