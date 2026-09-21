// mobile/src/store/useAuthStore.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService, AuthResponse } from "../api/authService";
import { apiClient } from "../api/client";
import { STORAGE_KEYS, DEFAULT_API_BASE_URL } from "../constants/config";

interface AuthState {
  token: string | null;
  user: AuthResponse["user"] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  apiBaseUrl: string;

  login: (identifier: string, kata_sandi: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setApiBaseUrl: (url: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  apiBaseUrl: DEFAULT_API_BASE_URL,

  restoreSession: async () => {
    try {
      set({ isLoading: true });
      const [savedToken, savedUserData, savedBaseUrl] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.API_BASE_URL),
      ]);

      if (savedToken && savedUserData) {
        const activeUrl = savedBaseUrl || DEFAULT_API_BASE_URL;
        apiClient.defaults.baseURL = activeUrl;
        set({
          token: savedToken,
          user: JSON.parse(savedUserData),
          isAuthenticated: true,
          apiBaseUrl: activeUrl,
          isLoading: false,
        });
      } else {
        const activeUrl = savedBaseUrl || DEFAULT_API_BASE_URL;
        apiClient.defaults.baseURL = activeUrl;
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          apiBaseUrl: activeUrl,
          isLoading: false,
        });
      }
    } catch (e) {
      console.warn("Failed to restore auth session:", e);
      set({ isLoading: false });
    }
  },

  login: async (identifier: string, kata_sandi: string) => {
    try {
      set({ isLoading: true });
      const res = await authService.login({ identifier, kata_sandi });

      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, res.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(res.user));

      set({
        token: res.token,
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout();
    } catch {
      // ignore
    } finally {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setApiBaseUrl: async (url: string) => {
    const cleanUrl = url.trim();
    await AsyncStorage.setItem(STORAGE_KEYS.API_BASE_URL, cleanUrl);
    apiClient.defaults.baseURL = cleanUrl;
    set({ apiBaseUrl: cleanUrl });
  },
}));
