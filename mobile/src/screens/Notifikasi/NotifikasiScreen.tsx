// mobile/src/screens/Notifikasi/NotifikasiScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, TextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, ChevronLeft, Search, X, AlertTriangle, CheckCircle } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { notifikasiService, NotifikasiItem } from "../../api/notifikasiService";

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
  const [items, setItems] = useState<NotifikasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Semua");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notifikasiService.getAll({ limit: 100 });
      setItems(res.data || []);
    } catch (e) {
      console.warn("Error fetch notifikasi:", e);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const filtered = items.filter((n) => {
    const q = search.toLowerCase();
    const matchSearch = n.judul.toLowerCase().includes(q) || n.isi.toLowerCase().includes(q);
    const matchKat = selectedKategori === "Semua" || n.kategori === selectedKategori;
    return matchSearch && matchKat;
  });

  const getCfg = (kat: string) => KATEGORI_CONFIG[kat] || KATEGORI_CONFIG["Umum"];
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const renderItem = ({ item }: { item: NotifikasiItem }) => {
    const cfg = getCfg(item.kategori);
    const isExpanded = expandedId === item.id;
    const isDarurat = item.kategori === "Darurat";
    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: cfg.color }, isDarurat && styles.cardDarurat]}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.85}
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
        </View>
        <Text style={[styles.judul, isDarurat && { color: "#DC2626" }]} numberOfLines={isExpanded ? undefined : 2}>
          {item.judul}
        </Text>
        <Text style={styles.isi} numberOfLines={isExpanded ? undefined : 2}>{item.isi}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          <Text style={[styles.expandLabel, { color: cfg.color }]}>
            {isExpanded ? "Sembunyikan ▲" : "Baca selengkapnya ▼"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const daruratCount = items.filter(i => i.kategori === "Darurat").length;

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
          <View style={styles.headerIconBox}>
            <Bell size={20} color="#FFFFFF" />
            {daruratCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{daruratCount}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.searchBox}>
          <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput style={styles.searchInput} placeholder="Cari notifikasi..." placeholderTextColor="rgba(255,255,255,0.5)"
            value={search} onChangeText={setSearch} />
          {search !== "" && <TouchableOpacity onPress={() => setSearch("")}><X size={15} color="#FFFFFF" /></TouchableOpacity>}
        </View>
        <FlatList horizontal data={KATEGORI_FILTER} showsHorizontalScrollIndicator={false}
          keyExtractor={(k) => k} contentContainerStyle={styles.filterRow}
          renderItem={({ item: k }) => (
            <TouchableOpacity style={[styles.filterChip, selectedKategori === k && styles.filterChipActive]}
              onPress={() => setSelectedKategori(k)}>
              <Text style={[styles.filterChipText, selectedKategori === k && styles.filterChipTextActive]}>{k}</Text>
            </TouchableOpacity>
          )} />
      </View>
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#162E6E" />
          <Text style={styles.loadingText}>Memuat notifikasi...</Text>
        </View>
      ) : (
        <FlatList data={filtered} keyExtractor={(i) => i.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#162E6E"]} />}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <CheckCircle size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Tidak ada notifikasi</Text>
              <Text style={styles.emptySub}>{search || selectedKategori !== "Semua" ? "Tidak ditemukan hasil pencarian." : "Belum ada pengumuman dari pesantren."}</Text>
            </View>
          } />
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
  headerIconBox: { padding: 8, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", position: "relative" },
  headerBadge: { position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center" },
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
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#EEF2F6", borderLeftWidth: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 8 },
  cardDarurat: { borderColor: "#FECACA", backgroundColor: "#FFFBFB" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  kategoriBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  kategoriText: { fontSize: 10.5, fontWeight: "700" },
  daruratBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "#FEF2F2", borderRadius: 20, borderWidth: 1, borderColor: "#FECACA" },
  daruratText: { fontSize: 9, fontWeight: "800", color: "#DC2626" },
  judul: { fontSize: 14, fontWeight: "800", color: "#0F172A", lineHeight: 20 },
  isi: { fontSize: 13, color: "#475569", lineHeight: 19 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  dateText: { fontSize: 11, color: "#94A3B8" },
  expandLabel: { fontSize: 11.5, fontWeight: "700" },
  emptyBox: { padding: 48, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#475569" },
  emptySub: { fontSize: 12, color: "#94A3B8", textAlign: "center" },
});
