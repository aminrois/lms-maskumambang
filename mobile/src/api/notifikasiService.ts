import { apiClient } from "./client";

export interface NotifikasiItem {
  id: number;
  judul: string;
  isi: string;
  kategori: string;
  target_role: string;
  is_active: boolean;
  created_at: string;
}

export const notifikasiService = {
  getAll: async (params?: { limit?: number; offset?: number; kategori?: string }) => {
    const res = await apiClient.get("/notifikasi", { params });
    return res.data as { data: NotifikasiItem[]; total: number };
  },
};
