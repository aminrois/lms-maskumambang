import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { apiClient } from "../api/client";
import { useAuthStore } from "../store/useAuthStore";

/**
 * Konfigurasi perilaku notifikasi saat aplikasi sedang terbuka (Foreground)
 * Agar tetap memunculkan banner pop-up di layar atas, berbunyi, dan bergetar seperti WhatsApp
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

/**
 * Mendaftarkan perangkat pengguna untuk menerima push notification sistem HP
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Hanya perangkat fisik yang memiliki device push token
  if (Platform.OS === "android") {
    // Buat Notification Channel Prioritas Tinggi untuk Android (Pop-up Banner Heads-up)
    await Notifications.setNotificationChannelAsync("default", {
      name: "Pengumuman Sekolah",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#162E6E",
      sound: "default",
      showBadge: true,
      enableVibrate: true,
      enableLights: true,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[NotificationService] Izin notifikasi tidak diberikan oleh pengguna.");
      return null;
    }

    try {
      // Ambil Project ID dari EAS config (wajib untuk standalone APK / Production Build)
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId ??
        "8e586831-5523-417e-a567-3b972f307a06";

      // Ambil Push Token Expo resmi
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = pushTokenData.data;
      console.log("[NotificationService] Device Push Token berhasil didapatkan:", token);

      // Simpan push token ke server backend
      if (token) {
        const currentUserId = useAuthStore.getState().user?.user_id;
        try {
          await apiClient.post("/users/push-token", {
            token,
            user_id: currentUserId,
          });
          console.log("[NotificationService] Push token tersimpan di server via /users/push-token.");
        } catch (postErr: any) {
          // Fallback untuk update user
          if (currentUserId) {
            try {
              await apiClient.patch(`/users/${currentUserId}`, { fcm_device_token: token });
              console.log("[NotificationService] Push token tersimpan via fallback user update.");
            } catch (patchErr: any) {
              console.warn("[NotificationService] Gagal kirim token ke server:", patchErr.message);
            }
          } else {
            console.warn("[NotificationService] Gagal kirim token ke server:", postErr.message);
          }
        }
      }
    } catch (e: any) {
      console.warn("[NotificationService] Gagal mengambil push token:", e.message);
    }
  } else {
    console.log("[NotificationService] Simulator/Emulator terdeteksi; Push Token memerlukan perangkat fisik.");
  }

  return token;
}

/**
 * Cek status izin dan token saat ini
 */
export async function getNotificationStatusAsync(): Promise<{
  granted: boolean;
  token: string | null;
  isDevice: boolean;
}> {
  const isDevice = Device.isDevice;
  const { status } = await Notifications.getPermissionsAsync();
  const granted = status === "granted";
  let token: string | null = null;

  if (isDevice && granted) {
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId ??
        "8e586831-5523-417e-a567-3b972f307a06";
      const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      token = pushTokenData.data;
    } catch (_) {}
  }

  return { granted, token, isDevice };
}

/**
 * Memicu notifikasi lokal langsung di HP (untuk tes pop-up perangkat)
 */
export async function scheduleLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: data || {},
    },
    trigger: null, // null = Langsung berbunyi & muncul detik ini juga
  });
}
