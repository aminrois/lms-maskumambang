// mobile/src/api/authService.ts
import { apiClient } from "./client";

export interface LoginPayload {
  identifier: string; // email, username, nisn, atau nip
  kata_sandi: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    pengguna_id: number;
    username: string;
    nama_lengkap: string;
    email: string;
    peran: string;
    pegawai_id?: number | null;
    siswa_id?: number | null;
    wali_id?: number | null;
    pegawai?: {
      pegawai_id: number;
      nip?: string;
      nama: string;
      jabatan?: string;
      gelar_depan?: string;
      gelar_belakang?: string;
    };
    siswa?: {
      siswa_id: number;
      nisn: string;
      nama_lengkap: string;
      kelas?: {
        kelas_id: number;
        nama_kelas: string;
      };
    };
  };
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", payload);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore
    }
  },
};
