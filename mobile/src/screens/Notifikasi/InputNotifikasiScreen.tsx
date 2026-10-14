// mobile/src/screens/Notifikasi/InputNotifikasiScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  Bell,
  Send,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Tag,
  AlertCircle,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { apiClient } from "../../api/client";
import { SwipeBackContainer } from "../../components/ui/SwipeBackContainer";
import { scheduleLocalNotification } from "../../services/notificationService";

interface NotifikasiAdminItem {
  id: number;
  judul: string;
  isi: string;
  kategori: string;
  target_role: string;
  is_active: boolean;
  is_sent: boolean;
  created_at: string;
}

const KATEGORI_OPTIONS = ["Umum", "Akademik", "Asrama", "Kegiatan", "Darurat"];
const TARGET_ROLE_OPTIONS = [
  { value: "semua", label: "Semua Pengguna" },
  { value: "Guru", label: "Semua Guru" },
  { value: "Wali Murid", label: "Wali Murid" },
  { value: "Wali Kelas", label: "Wali Kelas" },
];

export const InputNotifikasiScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  // Form State
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [kategori, setKategori] = useState("Umum");
  const [targetRole, setTargetRole] = useState("semua");
  const [submitting, setSubmitting] = useState(false);

  // History State
  const [historyList, setHistoryList] = useState<NotifikasiAdminItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await apiClient.get("/notifikasi/admin");
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setHistoryList(data);
      }
    } catch (err: any) {
      console.warn("Gagal fetch riwayat notifikasi:", err.message);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const handleKirim = async () => {
    if (!judul.trim()) {
      Alert.alert("Perhatian", "Judul notifikasi tidak boleh kosong.");
      return;
    }
    if (!isi.trim()) {
      Alert.alert("Perhatian", "Isi notifikasi tidak boleh kosong.");
      return;
    }

    Alert.alert(
      "Konfirmasi Kirim Notifikasi",
      `Kirim notifikasi "${judul}" kepada ${
        TARGET_ROLE_OPTIONS.find((t) => t.value === targetRole)?.label || targetRole
      }?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Kirim Sekarang",
          style: "default",
          onPress: async () => {
            try {
              setSubmitting(true);
              const payload = {
                judul: judul.trim(),
                isi: isi.trim(),
                kategori,
                target_role: targetRole,
                is_active: true,
              };

              await apiClient.post("/notifikasi", payload);
              Alert.alert("Sukses", "Notifikasi berhasil dibuat dan dikirim.");
              setJudul("");
              setIsi("");
              fetchHistory();
            } catch (err: any) {
              Alert.alert(
                "Gagal Kirim",
                err.response?.data?.message || err.message || "Terjadi kesalahan saat membuat notifikasi."
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (id: number, notifJudul: string) => {
    Alert.alert(
      "Hapus Notifikasi",
      `Apakah Anda yakin ingin menghapus notifikasi "${notifJudul}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/notifikasi/${id}`);
              fetchHistory();
            } catch (err: any) {
              Alert.alert("Gagal Hapus", err.message || "Gagal menghapus notifikasi.");
            }
          },
        },
      ]
    );
  };

  return (
    <SwipeBackContainer style={styles.container}>
      {/* ─── HEADER ─── */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Input Notifikasi</Text>
              <Text style={styles.headerSubtitle}>Pengumuman & Broadcast Pesantren</Text>
            </View>

            <View style={styles.headerRightBadge}>
              <Bell size={18} color="#93C5FD" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ─── FORM CARD ─── */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <Sparkles size={16} color="#1D4ED8" />
            <Text style={styles.formCardTitle}>Buat Notifikasi Baru</Text>
          </View>

          {/* Judul */}
          <Text style={styles.label}>Judul Notifikasi</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Contoh: Pengumuman Libur Hari Raya"
            placeholderTextColor="#94A3B8"
            value={judul}
            onChangeText={setJudul}
          />

          {/* Kategori */}
          <Text style={[styles.label, { marginTop: 14 }]}>Kategori Notifikasi</Text>
          <View style={styles.kategoriRow}>
            {KATEGORI_OPTIONS.map((kat) => (
              <TouchableOpacity
                key={kat}
                style={[
                  styles.kategoriChip,
                  kategori === kat && styles.kategoriChipActive,
                ]}
                onPress={() => setKategori(kat)}
              >
                <Text
                  style={[
                    styles.kategoriChipText,
                    kategori === kat && styles.kategoriChipTextActive,
                  ]}
                >
                  {kat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Target Penerima */}
          <Text style={[styles.label, { marginTop: 14 }]}>Target Penerima</Text>
          <View style={styles.targetRoleRow}>
            {TARGET_ROLE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.targetChip,
                  targetRole === opt.value && styles.targetChipActive,
                ]}
                onPress={() => setTargetRole(opt.value)}
              >
                <Users
                  size={12}
                  color={targetRole === opt.value ? "#FFFFFF" : "#64748B"}
                />
                <Text
                  style={[
                    styles.targetChipText,
                    targetRole === opt.value && styles.targetChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pesan */}
          <Text style={[styles.label, { marginTop: 14 }]}>Isi Pesan Notifikasi</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Tuliskan detail pengumuman atau instruksi di sini..."
            placeholderTextColor="#94A3B8"
            value={isi}
            onChangeText={setIsi}
            textAlignVertical="top"
          />

          {/* Tombol Kirim */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleKirim}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Kirim Notifikasi</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Tombol Uji Coba Pop-up di HP Ini */}
          <TouchableOpacity
            style={styles.testBtn}
            onPress={async () => {
              const testTitle = judul.trim() || "Pengumuman Simulasi";
              const testBody = isi.trim() || "Ini adalah contoh notifikasi pop-up sistem HP seperti pesan WhatsApp.";
              await scheduleLocalNotification(testTitle, testBody);
            }}
            activeOpacity={0.8}
          >
            <Sparkles size={15} color="#1D4ED8" />
            <Text style={styles.testBtnText}>Tes Pop-up di HP Ini</Text>
          </TouchableOpacity>
        </View>

        {/* ─── RIWAYAT NOTIFIKASI TERKIRIM ─── */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Riwayat Notifikasi</Text>
          <Text style={styles.historyCount}>{historyList.length} Total</Text>
        </View>

        {loadingHistory ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat riwayat...</Text>
          </View>
        ) : historyList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell size={28} color="#94A3B8" />
            <Text style={styles.emptyText}>Belum ada riwayat notifikasi yang dibuat.</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {historyList.map((item) => {
              return (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardTop}>
                    <View style={styles.badgeRow}>
                      <View style={styles.katBadge}>
                        <Text style={styles.katBadgeText}>{item.kategori || "Umum"}</Text>
                      </View>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>
                          Kepada: {item.target_role || "semua"}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(item.id, item.judul)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.notifJudul}>{item.judul}</Text>
                  <Text style={styles.notifIsi}>{item.isi}</Text>

                  <View style={styles.historyCardBottom}>
                    <Clock size={11} color="#94A3B8" />
                    <Text style={styles.notifDate}>
                      {item.created_at ? new Date(item.created_at).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }) : "-"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 16,
  },
  headerSafe: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 12 : 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#93C5FD",
    marginTop: 2,
  },
  headerRightBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  formCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  formCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  label: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: "#1E293B",
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: "#1E293B",
    minHeight: 88,
  },
  kategoriRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  kategoriChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  kategoriChipActive: {
    backgroundColor: "#162E6E",
  },
  kategoriChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  kategoriChipTextActive: {
    color: "#FFFFFF",
  },
  targetRoleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  targetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  targetChipActive: {
    backgroundColor: "#2563EB",
  },
  targetChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  targetChipTextActive: {
    color: "#FFFFFF",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#162E6E",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  testBtnText: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "700",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  historyCount: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  centerLoading: {
    paddingVertical: 24,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748B",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748B",
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  historyCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  katBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  katBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  roleBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#475569",
  },
  deleteBtn: {
    padding: 4,
  },
  notifJudul: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  notifIsi: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  historyCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  notifDate: {
    fontSize: 11,
    color: "#94A3B8",
  },
});
