// mobile/src/screens/Quran/DoaDzikirScreen.tsx
// Halaman Daftar Judul Doa & Dzikir — tampilan ringkas, rapi, dan mudah dicari

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  Search,
  X,
  BookMarked,
  ChevronRight,
  BookOpen,
} from "lucide-react-native";
import { doaDzikirService } from "../../api/doaDzikirService";
import { DoaItem } from "../../utils/islamicPrayerUtil";

export const DoaDzikirScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<DoaItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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

  // Navigate to Detail Doa
  const handleOpenDetail = (item: DoaItem, index: number) => {
    navigation.navigate("DoaDzikirDetail", {
      item,
      allItems: filteredItems,
      currentIndex: index,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#162E6E" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
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
        <View style={styles.headerCountBadge}>
          <Text style={styles.headerCountText}>
            {filteredItems.length} Doa
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari judul doa, arti, atau kata kunci..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
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

      {/* Main Content List (Daftar Judul Doa) */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#162E6E" />
          <Text style={styles.loadingText}>Memuat kumpulan doa...</Text>
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
                Tidak ada doa atau dzikir yang cocok dengan filter atau kata kunci "{search}".
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            return (
              <TouchableOpacity
                style={styles.doaListItemCard}
                onPress={() => handleOpenDetail(item, index)}
                activeOpacity={0.7}
              >
                {/* Nomor Urut */}
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>{index + 1}</Text>
                </View>

                {/* Judul & Kategori */}
                <View style={styles.itemCenter}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.judul}
                  </Text>
                  <View style={styles.itemMetaRow}>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{item.kategori}</Text>
                    </View>
                    {item.riwayat ? (
                      <View style={styles.riwayatChip}>
                        <BookOpen size={10} color="#059669" />
                        <Text style={styles.riwayatSnippet} numberOfLines={1}>
                          {item.riwayat}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Panah Navigasi */}
                <View style={styles.arrowCircle}>
                  <ChevronRight size={18} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
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
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
    fontSize: 11.5,
    color: "#E2E8F0",
    marginTop: 2,
  },
  headerCountBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
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
    paddingHorizontal: 13,
    paddingVertical: 6.5,
    borderRadius: 20,
    backgroundColor: "#EEF2F6",
  },
  categoryPillActive: {
    backgroundColor: "#162E6E",
  },
  categoryPillText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#475569",
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 36,
    gap: 8,
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

  // Doa List Item Card
  doaListItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1.5,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  numberText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#162E6E",
  },
  itemCenter: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 20,
  },
  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
    flexWrap: "wrap",
  },
  categoryTag: {
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  categoryTagText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#0284C7",
  },
  riwayatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 160,
  },
  riwayatSnippet: {
    fontSize: 10.5,
    color: "#059669",
    fontWeight: "600",
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
});
