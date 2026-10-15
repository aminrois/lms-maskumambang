// mobile/src/screens/Notifikasi/NotifikasiScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bell,
  ChevronLeft,
  Search,
  X,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  CheckCheck,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NotifikasiItem } from "../../api/notifikasiService";
import { useNotificationStore } from "../../store/useNotificationStore";

const KATEGORI_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  Umum:     { color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
  Akademik: { color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0" },
  Asrama:   { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  Kegiatan: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  Darurat:  { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
};

const KATEGORI_FILTER = ["Semua", "Umum", "Akademik", "Asrama", "Kegiatan", "Darurat"];

export const NotifikasiScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const {
    items,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAllAsRead,
    isRead,
  } = useNotificationStore();

  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Semua");

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const filtered = items.filter((n) => {
    const q = search.toLowerCase();
    const matchSearch = n.judul.toLowerCase().includes(q) || n.isi.toLowerCase().includes(q);
    const matchKat = selectedKategori === "Semua" || n.kategori === selectedKategori;
    return matchSearch && matchKat;
  });

  const getCfg = (kat: string) => KATEGORI_CONFIG[kat] || KATEGORI_CONFIG["Umum"];
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const handleOpenDetail = (item: NotifikasiItem) => {
    navigation.navigate("DetailNotifikasi", { notifikasi: item });
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    Alert.alert(
      "Tandai Semua Dibaca",
      "Apakah Anda yakin ingin menandai semua notifikasi sebagai telah dibaca?",
      [
        { text: "Batal", style: "cancel" },
        { text: "Ya, Tandai", onPress: () => markAllAsRead() },
      ]
    );
  };

  const renderItem = ({ item }: { item: NotifikasiItem }) => {
    const cfg = getCfg(item.kategori);
    const isDarurat = item.kategori === "Darurat";
    const read = isRead(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { borderLeftColor: cfg.color },
          isDarurat && styles.cardDarurat,
          !read && styles.cardUnread,
        ]}
        onPress={() => handleOpenDetail(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.kategoriBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <Text style={[styles.kategoriText, { color: cfg.color }]}>{item.kategori}</Text>
          </View>

          {isDarurat && (
            <View style={styles.daruratBadge}>
              <AlertTriangle size={11} color="#DC2626" />
              <Text style={styles.daruratText}>PENTING</Text>
            </View>
          )}

          {!read && (
            <View style={styles.newBadge}>
              <View style={styles.newBadgeDot} />
              <Text style={styles.newBadgeText}>Baru</Text>
            </View>
          )}

          <View style={{ flex: 1 }} />
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>

        <Text
          style={[
            styles.judul,
            !read && styles.judulUnread,
            isDarurat && { color: "#DC2626" },
          ]}
          numberOfLines={2}
        >
          {item.judul}
        </Text>

        <Text style={styles.isi} numberOfLines={2}>
          {item.isi}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={[styles.detailActionLabel, { color: cfg.color }]}>
            Lihat detail pesan
          </Text>
          <ChevronRight size={14} color={cfg.color} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="#162E6E" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Notifikasi</Text>
            <Text style={styles.headerSub}>Informasi & Pengumuman Terbaru</Text>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={handleMarkAllRead}
              activeOpacity={0.8}
            >
              <CheckCheck size={14} color="#FFFFFF" />
              <Text style={styles.markAllText}>Baca Semua</Text>
            </TouchableOpacity>
          )}

          <View style={styles.headerIconBox}>
            <Bell size={20} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari notifikasi..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
          {search !== "" && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={15} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          horizontal
          data={KATEGORI_FILTER}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(k) => k}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item: k }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedKategori === k && styles.filterChipActive]}
              onPress={() => setSelectedKategori(k)}
            >
              <Text style={[styles.filterChipText, selectedKategori === k && styles.filterChipTextActive]}>
                {k}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#162E6E" />
          <Text style={styles.loadingText}>Memuat notifikasi...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#162E6E"]} />}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <CheckCircle size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Tidak ada notifikasi</Text>
              <Text style={styles.emptySub}>
                {search || selectedKategori !== "Semua"
                  ? "Tidak ditemukan hasil pencarian."
                  : "Belum ada pengumuman dari pesantren."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#162E6E", paddingHorizontal: 16, paddingBottom: 12 },
  headerTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", marginRight: 12 },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  headerSub: { fontSize: 11, color: "#CBD5E1", marginTop: 2 },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  markAllText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  headerIconBox: { padding: 8, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", position: "relative" },
  headerBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  headerBadgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingHorizontal: 12, height: 40, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 13, color: "#FFFFFF" },
  filterRow: { paddingVertical: 4, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)" },
  filterChipActive: { backgroundColor: "#FFFFFF" },
  filterChipText: { fontSize: 11.5, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
  filterChipTextActive: { color: "#162E6E" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: "#64748B" },
  listContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  cardUnread: {
    backgroundColor: "#FFFFFF",
    borderColor: "#BFDBFE",
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.08,
  },
  cardDarurat: { borderColor: "#FECACA", backgroundColor: "#FFFBFB" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  kategoriBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  kategoriText: { fontSize: 10.5, fontWeight: "700" },
  daruratBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "#FEF2F2", borderRadius: 20, borderWidth: 1, borderColor: "#FECACA" },
  daruratText: { fontSize: 9, fontWeight: "800", color: "#DC2626" },
  newBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  newBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  judul: { fontSize: 14, fontWeight: "600", color: "#334155", lineHeight: 20 },
  judulUnread: { fontWeight: "800", color: "#0F172A" },
  isi: { fontSize: 13, color: "#64748B", lineHeight: 19 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  dateText: { fontSize: 11, color: "#94A3B8" },
  detailActionLabel: { fontSize: 12, fontWeight: "700" },
  emptyBox: { padding: 48, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#475569" },
  emptySub: { fontSize: 12, color: "#94A3B8", textAlign: "center" },
});
