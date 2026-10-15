// server/src/services/pushNotificationService.ts
import prisma from '../config/prisma';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  kategori?: string;
  notifikasiId?: number;
}

/**
 * Mengirim notifikasi push ke Expo Push Notification Service
 * Endpoint resmi: https://exp.host/--/api/v2/push/send
 */
export const sendExpoPushMessages = async (
  tokens: string[],
  payload: PushNotificationPayload
): Promise<void> => {
  if (!tokens || tokens.length === 0) return;

  // Saring token unik dan buang nilai null/kosong
  const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
  if (uniqueTokens.length === 0) return;

  // Format payload sesuai standar Expo Push API
  const messages = uniqueTokens.map((token) => ({
    to: token,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    priority: 'high',
    channelId: 'default',
    data: {
      ...payload.data,
      kategori: payload.kategori || 'Umum',
      notifikasiId: payload.notifikasiId,
    },
  }));

  // Kirim dalam batch (maksimal 100 pesan per request sesuai ketentuan Expo)
  const BATCH_SIZE = 100;
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[PushNotification] Gagal mengirim batch (${response.status}):`, errorText);
      } else {
        const result: any = await response.json();
        console.log(`[PushNotification] Expo API response:`, JSON.stringify(result));
      }
    } catch (err: any) {
      console.error('[PushNotification] Error saat menghubungi Expo Push API:', err.message);
    }
  }
};

/**
 * Mengambil token HP pengguna target berdasarkan target_role dan mengirimkan push notification
 */
export const broadcastPushNotification = async (
  targetRole: string = 'semua',
  payload: PushNotificationPayload
): Promise<void> => {
  try {
    const normalizedTarget = (targetRole || 'semua').toLowerCase().trim();

    let whereClause: any = {
      fcm_device_token: {
        not: null,
      },
    };

    // Filter pengguna berdasarkan target_role
    if (normalizedTarget === 'guru') {
      whereClause.user_roles = {
        some: {
          role: {
            nama_role: {
              contains: 'guru',
              mode: 'insensitive',
            },
          },
        },
      };
    } else if (normalizedTarget.includes('wali') && normalizedTarget.includes('murid')) {
      whereClause.user_roles = {
        some: {
          role: {
            nama_role: {
              contains: 'wali murid',
              mode: 'insensitive',
            },
          },
        },
      };
    } else if (normalizedTarget.includes('wali') && normalizedTarget.includes('kelas')) {
      whereClause.user_roles = {
        some: {
          role: {
            nama_role: {
              contains: 'wali kelas',
              mode: 'insensitive',
            },
          },
        },
      };
    }

    const usersWithToken = await prisma.user.findMany({
      where: whereClause,
      select: {
        user_id: true,
        fcm_device_token: true,
      },
    });

    const tokens = usersWithToken
      .map((u) => u.fcm_device_token)
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

    if (tokens.length > 0) {
      console.log(`[PushNotification] Menyiapkan push untuk ${tokens.length} penerima (Target: ${targetRole})...`);
      // Jalankan pengiriman
      await sendExpoPushMessages(tokens, payload);
    } else {
      console.log(`[PushNotification] Tidak ada device token terdaftar untuk target: ${targetRole}`);
    }
  } catch (err: any) {
    console.error('[PushNotification] Gagal melakukan broadcast:', err.message);
  }
};
