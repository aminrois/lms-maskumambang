import { apiClient } from '../axios';
import { useAuthStore } from '@/store/useAuthStore';

export const login = async (payload: { username?: string; email?: string; password: string; captchaToken?: string | null }) => {
  const response = await apiClient.post('/auth/login', {
    username: payload.username || payload.email,
    password: payload.password,
  });
  return response.data.data; // { token, user }
};

export const signup = async (payload: any) => {
  const response = await apiClient.post('/auth/register', payload);
  return response.data.data;
};

export const logout = async () => {
  // Reset Zustand store & hapus token
  useAuthStore.getState().logout();
  try {
    localStorage.removeItem('auth-storage');
  } catch (e) {
    // ignore
  }
  return true;
};

export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data.data;
};

export const changePassword = async (payload: { old_password?: string; new_password: string }) => {
  const response = await apiClient.post('/auth/change-password', {
    old_password: payload.old_password,
    new_password: payload.new_password,
  });
  return response.data;
};
