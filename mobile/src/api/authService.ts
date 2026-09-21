// mobile/src/api/authService.ts
import { apiClient } from "./client";

export interface LoginPayload {
  // Backend expects either 'username'/'email' + 'password' fields
  // We send both to be safe
  username?: string;
  email?: string;
  password?: string;
  // identifier is mapped to username in the service
}

export interface AuthUser {
  user_id: number;
  username: string;
  email: string;
  roles: {
    role_id: number;
    nama_role: string;
    lembaga_id?: number | null;
    lembaga?: any;
  }[];
  pegawai?: {
    pegawai_id: number;
    nig?: string;
    nip?: string;
    nama: string;
    jabatan?: string;
  } | null;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: AuthUser;
  };
}

export const authService = {
  login: async (identifier: string, password: string): Promise<{ token: string; user: AuthUser }> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", {
      username: identifier,
      email: identifier,
      password: password,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error((response.data as any).message || 'Login gagal');
    }
    return response.data.data;
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
