// mobile/src/screens/Tahfidz/TahfidzRiwayatScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {
  History,
  Search,
  X,
  Filter,
  Calendar,
  BookOpen,
  ScrollText,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { tahfidzService } from "../../api/tahfidzService";

export const TahfidzRiwayatScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [riwayatList, setRiwayatList] = useState<any[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedKategori, setSelectedKategori] = useState<string>("ALL");
  const [selectedJenis, setSelectedJenis] = useState<string>("ALL");

  const teacherPegawaiId = user?.pegawai?.pegawai_id;

  const fetchRiwayat = useCallback(async () => {
    try {
      setLoading(true);
      const res = await tahfidzService.getSetoranList({
        pegawai_id: teacherPegawaiId,
        limit: 100,
      });
      const data = Array.isArray(res) ? res : res?.data || [];
      setRiwayatList(data);
    } catch (err) {
      console.warn("Error fetching riwayat setoran:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacherPegawaiId]);

  useEffect(() => {
    if (isFocused) {
      fetchRiwayat();
    }
  }, [isFocused, fetchRiwayat]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRiwayat();
  };

  const filteredList = useMemo(() => {
    return riwayatList.filter((item) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const nama = (item.siswa?.nama || "").toLowerCase();
      const nis = (item.siswa?.nis || item.siswa?.nisn || "").toLowerCase();
      const surat = (item.surat_mulai_nama || "").toLowerCase();
      const hadits = (item.kitab_hadits || "").toLowerCase();
      const matan = (item.nama_matan || "").toLowerCase();

      const matchSearch =
        !q ||
        nama.includes(q) ||
        nis.includes(q) ||
        surat.includes(q) ||
        hadits.includes(q) ||
        matan.includes(q);

      // Kategori filter
      const matchKategori =
        selectedKategori === "ALL" || item.kategori === selectedKategori;

      // Jenis filter
      const matchJenis =
        selectedJenis === "ALL" || item.jenis_hafalan === selectedJenis;

      return matchSearch && matchKategori && matchJenis;
    });
  }, [riwayatList, searchQuery, selectedKategori, selectedJenis]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Riwayat Hafalan"
        subtitle="Catatan riwayat setoran tahfidz santri"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama santri, surat, hadits, matan..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Kategori Filters */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {["ALL", "Al-Quran", "Hadits", "Matan Ilmu"].map((k) => {
              const isSelected = selectedKategori === k;
              return (
                <TouchableOpacity
                  key={k}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSelectedKategori(k)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {k === "ALL" ? "Semua Kategori" : k}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Jenis Setoran Filters */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {["ALL", "Setoran Baru", "Setoran Ulang", "Ujian"].map((j) => {
              const isSelected = selectedJenis === j;
              return (
                <TouchableOpacity
                  key={j}
                  style={[styles.chipPill, isSelected && styles.chipPillActive]}
                  onPress={() => setSelectedJenis(j)}
                >
                  <Text style={[styles.chipPillText, isSelected && styles.chipPillTextActive]}>
                    {j === "ALL" ? "Semua Jenis" : j}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Results Info */}
        <View style={styles.resultInfoRow}>
          <Text style={styles.resultCountText}>
            Ditemukan <Text style={{ fontWeight: "700" }}>{filteredList.length}</Text> riwayat setoran
          </Text>
        </View>

        {/* List Riwayat */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat riwayat setoran...</Text>
          </View>
        ) : filteredList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <History size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Belum Ada Riwayat Setoran</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedKategori !== "ALL" || selectedJenis !== "ALL"
                ? "Tidak ada data riwayat yang cocok dengan filter pencarian Anda."
                : "Data setoran hafalan santri akan tercatat di sini."}
            </Text>
          </Card>
        ) : (
          filteredList.map((item: any) => {
            const isBaru = item.jenis_hafalan === "Setoran Baru";
            const isUlang = item.jenis_hafalan === "Setoran Ulang";

            return (
              <Card key={item.setoran_id} style={styles.itemCard}>
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.santriName}>{item.siswa?.nama || "Santri"}</Text>
                    <Text style={styles.metaText}>
                      📅 {item.tanggal} • {item.siswa?.kelas?.nama_kelas || "Kelas"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.jenisBadge,
                      {
                        backgroundColor: isBaru ? "#EFF6FF" : isUlang ? "#FFFBEB" : "#F5F3FF",
                        borderColor: isBaru ? "#BFDBFE" : isUlang ? "#FDE68A" : "#DDD6FE",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.jenisBadgeText,
                        {
                          color: isBaru ? "#1D4ED8" : isUlang ? "#B45309" : "#6D28D9",
                        },
                      ]}
                    >
                      {item.jenis_hafalan}
                    </Text>
                  </View>
                </View>

                {/* Detail Capaian Hafalan */}
                <View style={styles.detailBox}>
                  <Text style={styles.detailText}>
                    {item.kategori === "Al-Quran"
                      ? `📖 ${item.surat_mulai_nama || "Surat"} (${item.ayat_mulai}) s/d ${item.surat_selesai_nama || "Surat"} (${item.ayat_selesai}) • ${item.total_ayat || 0} Ayat`
                      : item.kategori === "Hadits"
                      ? `📜 ${item.kitab_hadits || "Hadits"} • No. ${item.hadits_no_mulai} - ${item.hadits_no_selesai}`
                      : `🔖 ${item.nama_matan || "Matan"} • Bait ${item.bait_mulai} - ${item.bait_selesai}`}
                  </Text>
                </View>

                {/* Meta Row: Kelancaran & Catatan */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.kelancaranWrap}>
                    <Text style={styles.kelancaranLabel}>Kelancaran:</Text>
                    <Text style={styles.kelancaranVal}>{item.kelancaran || "Lancar"}</Text>
                  </View>
                  {item.pegawai?.nama ? (
                    <Text style={styles.ustadzText}>Ustadz: {item.pegawai.nama}</Text>
                  ) : null}
                </View>

                {item.catatan_guru ? (
                  <View style={styles.notesWrap}>
                    <Text style={styles.notesText}>Catatan: "{item.catatan_guru}"</Text>
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
  },
  filterSection: {
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  chipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  chipPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  chipPillActive: {
    backgroundColor: "#3B82F6",
  },
  chipPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  chipPillTextActive: {
    color: "#FFFFFF",
  },
  resultInfoRow: {
    marginVertical: 6,
  },
  resultCountText: {
    fontSize: 12,
    color: "#64748B",
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  emptyCard: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 260,
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  santriName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  metaText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  jenisBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  jenisBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  detailBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kelancaranWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  kelancaranLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  kelancaranVal: {
    fontSize: 11,
    fontWeight: "800",
    color: "#059669",
  },
  ustadzText: {
    fontSize: 10,
    color: "#94A3B8",
  },
  notesWrap: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  notesText: {
    fontSize: 11,
    color: "#64748B",
    fontStyle: "italic",
  },
});
