// mobile/src/store/useAuthStore.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService, AuthUser } from "../api/authService";
import { apiClient } from "../api/client";
import { STORAGE_KEYS, DEFAULT_API_BASE_URL } from "../constants/config";
import { biometricService, BiometricStatus } from "../services/biometricService";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  apiBaseUrl: string;
  biometricStatus: BiometricStatus | null;

  login: (identifier: string, kata_sandi: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setApiBaseUrl: (url: string) => Promise<void>;

  // Biometric actions
  checkBiometricStatus: () => Promise<BiometricStatus>;
  enableBiometric: (identifier: string, kata_sandi: string) => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  loginWithBiometrics: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  apiBaseUrl: DEFAULT_API_BASE_URL,
  biometricStatus: null,

  checkBiometricStatus: async () => {
    const status = await biometricService.checkBiometricStatus();
    set({ biometricStatus: status });
    return status;
  },

  restoreSession: async () => {
    try {
      set({ isLoading: true });
      const [savedToken, savedUserData, savedBaseUrl] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.API_BASE_URL),
      ]);

      const activeUrl = savedBaseUrl || DEFAULT_API_BASE_URL;
      apiClient.defaults.baseURL = activeUrl;

      // Cek status biometrik juga
      const bioStatus = await biometricService.checkBiometricStatus();

      if (savedToken && savedUserData) {
        set({
          token: savedToken,
          user: JSON.parse(savedUserData),
          isAuthenticated: true,
          apiBaseUrl: activeUrl,
          biometricStatus: bioStatus,
          isLoading: false,
        });
      } else {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          apiBaseUrl: activeUrl,
          biometricStatus: bioStatus,
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
      const { token, user } = await authService.login(identifier, kata_sandi);

      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      // Jika biometrik sebelumnya aktif untuk user ini, perbarui passwordnya
      const currentBio = get().biometricStatus;
      if (currentBio?.isEnabled) {
        await biometricService.saveCredentials(identifier, kata_sandi);
      }

      const bioStatus = await biometricService.checkBiometricStatus();

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        biometricStatus: bioStatus,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  enableBiometric: async (identifier: string, kata_sandi: string) => {
    const success = await biometricService.saveCredentials(identifier, kata_sandi);
    if (success) {
      const bioStatus = await biometricService.checkBiometricStatus();
      set({ biometricStatus: bioStatus });
      return true;
    }
    return false;
  },

  disableBiometric: async () => {
    await biometricService.removeCredentials();
    const bioStatus = await biometricService.checkBiometricStatus();
    set({ biometricStatus: bioStatus });
  },

  loginWithBiometrics: async () => {
    const creds = await biometricService.getCredentials();
    if (!creds || !creds.identifier || !creds.kata_sandi) {
      throw new Error("Kredensial biometrik tidak ditemukan. Silakan login dengan kata sandi terlebih dahulu.");
    }

    const bioResult = await biometricService.authenticate(
      `Pindai untuk masuk sebagai ${creds.identifier}`
    );

    if (!bioResult.success) {
      throw new Error(bioResult.error || "Autentikasi biometrik dibatalkan");
    }

    // Eksekusi login dengan kredensial yang tersimpan aman
    await get().login(creds.identifier, creds.kata_sandi);
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
      const bioStatus = await biometricService.checkBiometricStatus();
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        biometricStatus: bioStatus,
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
