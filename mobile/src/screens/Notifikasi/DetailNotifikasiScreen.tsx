// mobile/src/screens/Notifikasi/DetailNotifikasiScreen.tsx
import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Share,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  Calendar,
  Share2,
  ExternalLink,
  AlertTriangle,
  Users,
  CheckCircle2,
  ImageIcon,
} from "lucide-react-native";
import { NotifikasiItem } from "../../api/notifikasiService";
import { useNotificationStore } from "../../store/useNotificationStore";
import { SwipeBackContainer } from "../../components/ui/SwipeBackContainer";

const KATEGORI_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  Umum:     { color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
  Akademik: { color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0" },
  Asrama:   { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  Kegiatan: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  Darurat:  { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
};

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;
const IMAGE_URL_REGEX = /\.(jpeg|jpg|gif|png|webp)($|\?)/i;

export const DetailNotifikasiScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const notifikasi: NotifikasiItem = route.params?.notifikasi;
  const markAsRead = useNotificationStore((state) => state.markAsRead);

  useEffect(() => {
    if (notifikasi?.id) {
      markAsRead(notifikasi.id);
    }
  }, [notifikasi?.id, markAsRead]);

  // Ekstraksi tautan URL & Gambar dari isi teks
  const { urls, imageUrls, textParts } = useMemo(() => {
    if (!notifikasi?.isi) {
      return { urls: [], imageUrls: [], textParts: [] };
    }

    const detectedUrls: string[] = [];
    const detectedImages: string[] = [];
    const parts: { type: "text" | "url"; value: string }[] = [];

    let lastIndex = 0;
    const matches = Array.from(notifikasi.isi.matchAll(URL_REGEX));

    for (const match of matches) {
      const matchIndex = match.index ?? 0;
      const url = match[0];

      if (matchIndex > lastIndex) {
        parts.push({
          type: "text",
          value: notifikasi.isi.substring(lastIndex, matchIndex),
        });
      }

      parts.push({
        type: "url",
        value: url,
      });

      detectedUrls.push(url);
      if (IMAGE_URL_REGEX.test(url)) {
        detectedImages.push(url);
      }

      lastIndex = matchIndex + url.length;
    }

    if (lastIndex < notifikasi.isi.length) {
      parts.push({
        type: "text",
        value: notifikasi.isi.substring(lastIndex),
      });
    }

    return { urls: detectedUrls, imageUrls: detectedImages, textParts: parts };
  }, [notifikasi?.isi]);

  if (!notifikasi) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Data notifikasi tidak ditemukan.</Text>
          <TouchableOpacity style={styles.backBtnError} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnErrorText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = KATEGORI_CONFIG[notifikasi.kategori] || KATEGORI_CONFIG["Umum"];
  const isDarurat = notifikasi.kategori === "Darurat";

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";
    } catch {
      return dateStr;
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Tautan Tidak Valid", "Perangkat tidak dapat membuka tautan ini: " + url);
      }
    } catch (e: any) {
      Alert.alert("Gagal Membuka Tautan", e.message || "Terjadi kesalahan.");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: notifikasi.judul,
        message: `${notifikasi.judul}\n\n${notifikasi.isi}\n\n— Diterima dari siMas Maskumambang`,
      });
    } catch (e) {
      console.warn("Error sharing:", e);
    }
  };

  return (
    <SwipeBackContainer>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#162E6E" />

        {/* Custom Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <ChevronLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Detail Notifikasi</Text>
              <Text style={styles.headerSub}>Informasi & Pengumuman</Text>
            </View>

            <TouchableOpacity
              style={styles.headerBtn}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Share2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scroll Content */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Notifikasi Detail */}
          <View style={[styles.card, { borderLeftColor: cfg.color }]}>
            {/* Meta Tags Header */}
            <View style={styles.metaRow}>
              <View style={[styles.kategoriBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                <Text style={[styles.kategoriText, { color: cfg.color }]}>
                  {notifikasi.kategori}
                </Text>
              </View>

              {isDarurat && (
                <View style={styles.daruratBadge}>
                  <AlertTriangle size={12} color="#DC2626" />
                  <Text style={styles.daruratText}>PENTING / MENDESAK</Text>
                </View>
              )}

              {notifikasi.target_role && notifikasi.target_role !== "semua" && (
                <View style={styles.targetBadge}>
                  <Users size={12} color="#475569" />
                  <Text style={styles.targetText}>{notifikasi.target_role}</Text>
                </View>
              )}
            </View>

            {/* Judul Notifikasi */}
            <Text style={[styles.judulText, isDarurat && { color: "#DC2626" }]}>
              {notifikasi.judul}
            </Text>

            {/* Tanggal & Waktu */}
            <View style={styles.dateRow}>
              <Calendar size={14} color="#64748B" />
              <Text style={styles.dateText}>{formatDate(notifikasi.created_at)}</Text>
            </View>

            <View style={styles.divider} />

            {/* Isi Notifikasi Berita / Pengumuman */}
            <View style={styles.isiWrapper}>
              {textParts.length === 0 ? (
                <Text style={styles.isiText}>{notifikasi.isi}</Text>
              ) : (
                <Text style={styles.isiText}>
                  {textParts.map((part, index) => {
                    if (part.type === "url") {
                      return (
                        <Text
                          key={index}
                          style={styles.inlineLink}
                          onPress={() => handleOpenLink(part.value)}
                        >
                          {part.value}
                        </Text>
                      );
                    }
                    return <Text key={index}>{part.value}</Text>;
                  })}
                </Text>
              )}
            </View>

            {/* Gambar yang terdeteksi di dalam teks jika ada */}
            {imageUrls.map((imgUrl, idx) => (
              <View key={idx} style={styles.imageCard}>
                <View style={styles.imageHeader}>
                  <ImageIcon size={14} color="#475569" />
                  <Text style={styles.imageHeaderText}>Lampiran Gambar</Text>
                </View>
                <Image
                  source={{ uri: imgUrl }}
                  style={styles.attachedImage}
                  resizeMode="cover"
                />
              </View>
            ))}

            {/* Quick Action Tautan Terlampir */}
            {urls.length > 0 && (
              <View style={styles.linksContainer}>
                <Text style={styles.linksHeaderTitle}>Tautan Terlampir:</Text>
                {urls.map((link, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.linkButton}
                    onPress={() => handleOpenLink(link)}
                    activeOpacity={0.8}
                  >
                    <ExternalLink size={16} color="#1D4ED8" />
                    <Text style={styles.linkButtonText} numberOfLines={1}>
                      {link}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Footer status dibaca */}
            <View style={styles.readStatusFooter}>
              <CheckCircle2 size={14} color="#16A34A" />
              <Text style={styles.readStatusText}>Telah dibaca</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SwipeBackContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#162E6E",
    paddingHorizontal: 16,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 5,
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  kategoriBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  kategoriText: {
    fontSize: 12,
    fontWeight: "700",
  },
  daruratBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  daruratText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DC2626",
  },
  targetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  targetText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  judulText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 26,
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 16,
  },
  isiWrapper: {
    marginBottom: 16,
  },
  isiText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#334155",
    letterSpacing: 0.2,
  },
  inlineLink: {
    color: "#1D4ED8",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  imageCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  imageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F1F5F9",
  },
  imageHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  attachedImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#E2E8F0",
  },
  linksContainer: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  linksHeaderTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  linkButtonText: {
    flex: 1,
    fontSize: 13,
    color: "#1D4ED8",
    fontWeight: "600",
  },
  readStatusFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  readStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A",
  },
  errorBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: "#64748B",
    marginBottom: 16,
  },
  backBtnError: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#162E6E",
    borderRadius: 8,
  },
  backBtnErrorText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
