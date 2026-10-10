// mobile/src/store/useAuthStore.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService, AuthUser } from "../api/authService";
import { apiClient } from "../api/client";
import { STORAGE_KEYS, DEFAULT_API_BASE_URL, DEFAULT_AUTO_LOGOUT_MINUTES } from "../constants/config";
import { biometricService, BiometricStatus } from "../services/biometricService";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  apiBaseUrl: string;
  biometricStatus: BiometricStatus | null;
  
  // Auto Logout State
  autoLogoutMinutes: number;
  lastActiveTime: number;
  wasAutoLoggedOut: boolean;

  login: (identifier: string, kata_sandi: string) => Promise<void>;
  logout: (isAutoLogout?: boolean) => Promise<void>;
  restoreSession: () => Promise<void>;
  setApiBaseUrl: (url: string) => Promise<void>;

  // Auto Logout actions
  updateLastActiveTime: () => void;
  checkSessionExpiry: () => Promise<boolean>;
  setAutoLogoutMinutes: (minutes: number) => Promise<void>;
  resetAutoLogoutFlag: () => void;

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
  autoLogoutMinutes: DEFAULT_AUTO_LOGOUT_MINUTES,
  lastActiveTime: Date.now(),
  wasAutoLoggedOut: false,

  updateLastActiveTime: () => {
    const now = Date.now();
    set({ lastActiveTime: now });
    AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_TIME, String(now)).catch(() => {});
  },

  resetAutoLogoutFlag: () => {
    set({ wasAutoLoggedOut: false });
  },

  setAutoLogoutMinutes: async (minutes: number) => {
    set({ autoLogoutMinutes: minutes });
    await AsyncStorage.setItem(STORAGE_KEYS.AUTO_LOGOUT_TIMEOUT, String(minutes));
  },

  checkSessionExpiry: async () => {
    const { isAuthenticated, autoLogoutMinutes, lastActiveTime } = get();
    if (!isAuthenticated) return false;

    const now = Date.now();
    let effectiveLastActive = lastActiveTime;
    if (!effectiveLastActive) {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE_TIME);
      effectiveLastActive = saved ? Number(saved) : now;
    }

    const timeoutMs = (autoLogoutMinutes || DEFAULT_AUTO_LOGOUT_MINUTES) * 60 * 1000;
    if (now - effectiveLastActive > timeoutMs) {
      console.log(
        `[SIMAS AutoLogout] Session expired! Inactive for ${Math.round(
          (now - effectiveLastActive) / 1000
        )}s (Limit: ${timeoutMs / 1000}s)`
      );
      await get().logout(true);
      return true;
    }
    return false;
  },

  checkBiometricStatus: async () => {
    const status = await biometricService.checkBiometricStatus();
    set({ biometricStatus: status });
    return status;
  },

  restoreSession: async () => {
    try {
      set({ isLoading: true });
      const [savedToken, savedUserData, savedBaseUrl, savedLastActive, savedTimeout] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.API_BASE_URL),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE_TIME),
        AsyncStorage.getItem(STORAGE_KEYS.AUTO_LOGOUT_TIMEOUT),
      ]);

      const activeUrl = savedBaseUrl || DEFAULT_API_BASE_URL;
      apiClient.defaults.baseURL = activeUrl;

      const configuredMinutes = savedTimeout ? Number(savedTimeout) : DEFAULT_AUTO_LOGOUT_MINUTES;
      const timeoutMs = configuredMinutes * 60 * 1000;
      const now = Date.now();

      // Cek status biometrik
      const bioStatus = await biometricService.checkBiometricStatus();

      if (savedToken && savedUserData) {
        const lastActiveTimestamp = savedLastActive ? Number(savedLastActive) : 0;
        
        // Periksa apakah sesi sudah kedaluwarsa karena aplikasi ditinggalkan/ditutup lama
        if (lastActiveTimestamp > 0 && now - lastActiveTimestamp > timeoutMs) {
          console.log("[SIMAS AutoLogout] Saved session expired upon app launch.");
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.USER_DATA,
            STORAGE_KEYS.LAST_ACTIVE_TIME,
          ]);

          set({
            token: null,
            user: null,
            isAuthenticated: false,
            apiBaseUrl: activeUrl,
            biometricStatus: bioStatus,
            autoLogoutMinutes: configuredMinutes,
            wasAutoLoggedOut: true,
            isLoading: false,
          });
          return;
        }

        // Sesi masih valid: perbarui aktivitas terakhir
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_TIME, String(now));

        set({
          token: savedToken,
          user: JSON.parse(savedUserData),
          isAuthenticated: true,
          apiBaseUrl: activeUrl,
          biometricStatus: bioStatus,
          autoLogoutMinutes: configuredMinutes,
          lastActiveTime: now,
          wasAutoLoggedOut: false,
          isLoading: false,
        });
      } else {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          apiBaseUrl: activeUrl,
          biometricStatus: bioStatus,
          autoLogoutMinutes: configuredMinutes,
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

      const now = Date.now();
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_TIME, String(now));

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
        lastActiveTime: now,
        wasAutoLoggedOut: false,
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

  logout: async (isAutoLogout = false) => {
    try {
      set({ isLoading: true });
      if (!isAutoLogout) {
        await authService.logout();
      }
    } catch {
      // ignore
    } finally {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.LAST_ACTIVE_TIME,
      ]);
      const bioStatus = await biometricService.checkBiometricStatus();
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        biometricStatus: bioStatus,
        wasAutoLoggedOut: !!isAutoLogout,
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
