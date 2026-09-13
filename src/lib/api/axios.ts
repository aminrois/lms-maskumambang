import axios from "axios";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "sonner";

// Base URL ke custom backend kita
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001";

// Satu axios instance untuk semua request REST API
export const apiClient = axios.create({
    baseURL: `${BASE_URL}/api/v1`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Alias untuk kompatibilitas dengan services yang memakai restClient / functionClient
export const restClient = apiClient;
export const functionClient = apiClient;

// Request Interceptor: Sisipkan JWT token dari localStorage
apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Tangani error 401 & 403
apiClient.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
        } else if (error.response?.status === 403) {
            toast.error("Anda tidak memiliki akses untuk melakukan tindakan ini.");
        }
        return Promise.reject(error);
    }
);