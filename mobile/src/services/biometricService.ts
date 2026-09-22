// mobile/src/services/biometricService.ts
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { STORAGE_KEYS } from "../constants/config";

export type BiometricType = "fingerprint" | "faceid" | "biometric" | null;

export interface BiometricStatus {
  isSupported: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
  biometricName: string; // e.g. "Face ID", "Sidik Jari", "Biometrik"
  isEnabled: boolean;
  savedUsername: string | null;
}

export interface SavedCredentials {
  identifier: string;
  kata_sandi: string;
}

export const biometricService = {
  /**
   * Cek dukungan hardware dan pendaftaran biometrik pada perangkat
   */
  checkBiometricStatus: async (): Promise<BiometricStatus> => {
    try {
      if (Platform.OS === "web") {
        return {
          isSupported: false,
          isEnrolled: false,
          biometricType: null,
          biometricName: "Biometrik",
          isEnabled: false,
          savedUsername: null,
        };
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType: BiometricType = null;
      let biometricName = "Biometrik";

      if (hasHardware) {
        if (
          supportedTypes.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          )
        ) {
          biometricType = "faceid";
          biometricName = Platform.OS === "ios" ? "Face ID" : "Pengenalan Wajah";
        } else if (
          supportedTypes.includes(
            LocalAuthentication.AuthenticationType.FINGERPRINT
          )
        ) {
          biometricType = "fingerprint";
          biometricName = Platform.OS === "ios" ? "Touch ID" : "Sidik Jari (Fingerprint)";
        } else if (supportedTypes.length > 0) {
          biometricType = "biometric";
          biometricName = "Biometrik";
        }
      }

      const [enabledVal, savedUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_USER),
      ]);

      const isEnabled = enabledVal === "true" && hasHardware && isEnrolled;

      return {
        isSupported: hasHardware,
        isEnrolled,
        biometricType,
        biometricName,
        isEnabled,
        savedUsername: savedUser || null,
      };
    } catch (e) {
      console.warn("Error checking biometric status:", e);
      return {
        isSupported: false,
        isEnrolled: false,
        biometricType: null,
        biometricName: "Biometrik",
        isEnabled: false,
        savedUsername: null,
      };
    }
  },

  /**
   * Pemicu verifikasi sensor sidik jari / Face ID
   */
  authenticate: async (promptMsg?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (Platform.OS === "web") {
        return { success: false, error: "Tidak didukung di web" };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMsg || "Pindai Sidik Jari atau Wajah untuk masuk",
        cancelLabel: "Gunakan Kata Sandi",
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || "Autentikasi biometrik dibatalkan atau gagal",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Terjadi kesalahan pada sensor biometrik",
      };
    }
  },

  /**
   * Simpan kredensial login secara aman di SecureStore
   */
  saveCredentials: async (identifier: string, kata_sandi: string): Promise<boolean> => {
    try {
      const payload: SavedCredentials = { identifier, kata_sandi };
      await SecureStore.setItemAsync(
        STORAGE_KEYS.BIOMETRIC_CREDENTIALS,
        JSON.stringify(payload),
        { keychainAccessible: SecureStore.WHEN_UNLOCKED }
      );
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, "true");
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_USER, identifier);
      return true;
    } catch (e) {
      console.warn("Failed to save biometric credentials in SecureStore:", e);
      return false;
    }
  },

  /**
   * Ambil kredensial yang tersimpan di SecureStore
   */
  getCredentials: async (): Promise<SavedCredentials | null> => {
    try {
      const json = await SecureStore.getItemAsync(STORAGE_KEYS.BIOMETRIC_CREDENTIALS);
      if (!json) return null;
      return JSON.parse(json) as SavedCredentials;
    } catch (e) {
      console.warn("Failed to get biometric credentials from SecureStore:", e);
      return null;
    }
  },

  /**
   * Hapus kredensial biometrik dari SecureStore & nonaktifkan
   */
  removeCredentials: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.BIOMETRIC_CREDENTIALS);
    } catch (e) {
      console.warn("Failed to delete SecureStore item:", e);
    }
    await AsyncStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
    await AsyncStorage.removeItem(STORAGE_KEYS.BIOMETRIC_USER);
  },
};
