// mobile/src/screens/Quran/DoaDzikirScreen.tsx
// Halaman Penuh Doa & Dzikir — responsif, nyaman dibaca, dengan tasbih interaktif

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Share,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  Search,
  X,
  Share2,
  BookMarked,
  Sparkles,
  RotateCcw,
  Check,
  BookOpen,
} from "lucide-react-native";
import { doaDzikirService } from "../../api/doaDzikirService";
import { DoaItem } from "../../utils/islamicPrayerUtil";

export const DoaDzikirScreen = () => {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<DoaItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Tasbih Counter Map: { [doaId]: number }
  const [counters, setCounters] = useState<{ [id: string]: number }>({});
  const [showTasbihFor, setShowTasbihFor] = useState<{ [id: string]: boolean }>({});

  const loadData = useCallback(async () => {
    try {
      const [data, cats] = await Promise.all([
        doaDzikirService.getAll(),
        doaDzikirService.getCategories(),
      ]);
      setItems(data);
      setCategories(cats);
    } catch (e) {
      console.warn("Gagal memuat doa & dzikir:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter Data
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat =
        selectedCategory === "Semua" || item.kategori === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.judul.toLowerCase().includes(q) ||
        item.arti.toLowerCase().includes(q) ||
        item.latin.toLowerCase().includes(q) ||
        (item.riwayat && item.riwayat.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, search]);

  // Share / Copy Doa
  const handleShare = async (item: DoaItem) => {
    try {
      const message = `${item.judul}\n\n${item.arab}\n\n"${item.latin}"\n\nArtinya:\n${item.arti}\n\nSumber: ${item.riwayat || "Pesantren Maskumambang"}`;
      await Share.share({ message });
    } catch (error) {
      console.warn("Gagal membagikan doa:", error);
    }
  };

  // Increment Tasbih Counter
  const handleIncrementCounter = (id: string) => {
    setCounters((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  // Reset Tasbih Counter
  const handleResetCounter = (id: string) => {
    setCounters((prev) => ({
      ...prev,
      [id]: 0,
    }));
  };

  // Toggle Tasbih View
  const toggleTasbih = (id: string) => {
    setShowTasbihFor((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Doa & Dzikir</Text>
          <Text style={styles.headerSub}>Kumpulan Doa Harian & Wirid Pesantren</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari judul doa, arti, atau lafadz..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Horizontal Scroll */}
      <View style={styles.categoryWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#162E6E" />
          <Text style={styles.loadingText}>Memuat doa & dzikir...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#162E6E"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BookMarked size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Doa Tidak Ditemukan</Text>
              <Text style={styles.emptyText}>
                Tidak ada doa atau dzikir yang cocok dengan filter atau kata kunci pencarian.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const count = counters[item.id] || 0;
            const isTasbihOpen = showTasbihFor[item.id] || false;

            return (
              <View style={styles.doaCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.numberBadge}>
                      <Text style={styles.numberText}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.cardTitle}>{item.judul}</Text>
                      <Text style={styles.cardCategory}>{item.kategori}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleShare(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Share2 size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Teks Arab Box */}
                <View style={styles.arabCard}>
                  <Text style={styles.arabText}>{item.arab}</Text>
                </View>

                {/* Transliterasi Latin */}
                {item.latin ? (
                  <View style={styles.latinWrapper}>
                    <Text style={styles.latinLabel}>Cara Membaca:</Text>
                    <Text style={styles.latinText}>"{item.latin}"</Text>
                  </View>
                ) : null}

                {/* Terjemahan Arti */}
                <View style={styles.artiWrapper}>
                  <Text style={styles.artiLabel}>Artinya:</Text>
                  <Text style={styles.artiText}>{item.arti}</Text>
                </View>

                {/* Riwayat / Sumber Hadits */}
                {item.riwayat ? (
                  <View style={styles.riwayatWrapper}>
                    <BookOpen size={13} color="#059669" />
                    <Text style={styles.riwayatText}>{item.riwayat}</Text>
                  </View>
                ) : null}

                {/* Tasbih Counter Section */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={[styles.tasbihToggleBtn, isTasbihOpen && styles.tasbihToggleBtnActive]}
                    onPress={() => toggleTasbih(item.id)}
                  >
                    <Sparkles size={14} color={isTasbihOpen ? "#162E6E" : "#64748B"} />
                    <Text
                      style={[
                        styles.tasbihToggleText,
                        isTasbihOpen && styles.tasbihToggleTextActive,
                      ]}
                    >
                      {isTasbihOpen ? "Tutup Hitungan" : "Hitung Dzikir / Tasbih"}
                    </Text>
                  </TouchableOpacity>

                  {isTasbihOpen && (
                    <View style={styles.tasbihContainer}>
                      <View style={styles.tasbihRow}>
                        <TouchableOpacity
                          style={styles.tasbihTapBtn}
                          onPress={() => handleIncrementCounter(item.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.tasbihCountNum}>{count}</Text>
                          <Text style={styles.tasbihTapLabel}>Ketuk untuk Menghitung</Text>
                        </TouchableOpacity>

                        {count > 0 && (
                          <TouchableOpacity
                            style={styles.tasbihResetBtn}
                            onPress={() => handleResetCounter(item.id)}
                          >
                            <RotateCcw size={16} color="#DC2626" />
                            <Text style={styles.tasbihResetText}>Reset</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#162E6E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
  },
  categoryWrapper: {
    paddingBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  categoryPillActive: {
    backgroundColor: "#162E6E",
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    paddingTop: 6,
    paddingBottom: 36,
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  doaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  numberText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#162E6E",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  cardCategory: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
    marginTop: 1,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  arabCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    marginBottom: 12,
  },
  arabText: {
    fontSize: 22,
    color: "#064E3B",
    textAlign: "right",
    lineHeight: 38,
    fontFamily: "System",
  },
  latinWrapper: {
    marginBottom: 8,
  },
  latinLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  latinText: {
    fontSize: 13,
    color: "#047857",
    fontStyle: "italic",
    lineHeight: 18,
  },
  artiWrapper: {
    marginBottom: 8,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
  },
  artiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  artiText: {
    fontSize: 12,
    color: "#334155",
    lineHeight: 18,
  },
  riwayatWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    marginBottom: 10,
  },
  riwayatText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
    marginTop: 4,
  },
  tasbihToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  tasbihToggleBtnActive: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  tasbihToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  tasbihToggleTextActive: {
    color: "#162E6E",
  },
  tasbihContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tasbihRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tasbihTapBtn: {
    flex: 1,
    backgroundColor: "#162E6E",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#162E6E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tasbihCountNum: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  tasbihTapLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginTop: 2,
  },
  tasbihResetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  tasbihResetText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
});
