import { REALTIME_CONFIG } from "@/config/realtimeConfig";

export interface RealtimeTable {
  table: string;
  queryKeys: string[][];
  filter?: string;
}

/**
 * useRealtimeSync — Hook untuk sinkronisasi data realtime.
 * Pada arsitektur REST backend custom, hook ini dinonaktifkan secara aman
 * tanpa merusak komponen yang memanggilnya.
 */
export function useRealtimeSync(_tables: RealtimeTable[]) {
  // Safe no-op for custom backend
}

export function useFeatureRealtimeSync(_featureKey: keyof typeof REALTIME_CONFIG.FEATURES) {
  // Safe no-op for custom backend
}
