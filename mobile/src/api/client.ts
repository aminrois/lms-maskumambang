// mobile/src/api/client.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_API_BASE_URL, STORAGE_KEYS } from "../constants/config";

export const apiClient = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Menambahkan Bearer Token & Dynamic Base URL
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Periksa apakah ada custom server URL yang diset pengguna di settings
      const customBaseUrl = await AsyncStorage.getItem(STORAGE_KEYS.API_BASE_URL);
      if (customBaseUrl) {
        config.baseURL = customBaseUrl;
      }

      // Periksa token login
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Error reading storage in API interceptor:", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Menangani error respons global (401 unauthorized, dll)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Hapus token jika unauthorized
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
    }
    return Promise.reject(error);
  }
);
