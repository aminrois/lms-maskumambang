// mobile/src/store/useNotificationStore.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { notifikasiService, NotifikasiItem } from "../api/notifikasiService";

const STORAGE_KEY_READ_IDS = "@simas_read_notif_ids_v1";

interface NotificationStoreState {
  items: NotifikasiItem[];
  readIds: number[];
  unreadCount: number;
  hasUnread: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isRead: (id: number) => boolean;
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  items: [],
  readIds: [],
  unreadCount: 0,
  hasUnread: false,
  isLoading: false,
  isInitialized: false,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });

      // 1. Muat ID yang sudah dibaca dari AsyncStorage
      let savedReadIds: number[] = [];
      const stored = await AsyncStorage.getItem(STORAGE_KEY_READ_IDS);
      if (stored) {
        try {
          savedReadIds = JSON.parse(stored);
        } catch {
          savedReadIds = [];
        }
      }

      // 2. Ambil notifikasi aktif dari API
      const res = await notifikasiService.getAll({ limit: 100 });
      const activeItems = (res.data || []).filter(item => item.is_active !== false);

      // 3. Hitung jumlah unread
      const unreadCount = activeItems.filter(item => !savedReadIds.includes(item.id)).length;

      set({
        items: activeItems,
        readIds: savedReadIds,
        unreadCount,
        hasUnread: unreadCount > 0,
        isInitialized: true,
      });
    } catch (e) {
      console.warn("[useNotificationStore] Gagal mengambil notifikasi:", e);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: number) => {
    const { readIds, items } = get();
    if (readIds.includes(id)) return;

    const newReadIds = [...readIds, id];
    const unreadCount = items.filter(item => !newReadIds.includes(item.id)).length;

    set({
      readIds: newReadIds,
      unreadCount,
      hasUnread: unreadCount > 0,
    });

    try {
      await AsyncStorage.setItem(STORAGE_KEY_READ_IDS, JSON.stringify(newReadIds));
    } catch (e) {
      console.warn("[useNotificationStore] Gagal menyimpan readIds:", e);
    }
  },

  markAllAsRead: async () => {
    const { items, readIds } = get();
    const allIds = Array.from(new Set([...readIds, ...items.map(i => i.id)]));

    set({
      readIds: allIds,
      unreadCount: 0,
      hasUnread: false,
    });

    try {
      await AsyncStorage.setItem(STORAGE_KEY_READ_IDS, JSON.stringify(allIds));
    } catch (e) {
      console.warn("[useNotificationStore] Gagal menyimpan readIds:", e);
    }
  },

  isRead: (id: number) => {
    return get().readIds.includes(id);
  },
}));
