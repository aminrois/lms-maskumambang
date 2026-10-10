// mobile/src/screens/Siswa/DaftarSiswaKelasScreen.tsx
// Daftar Siswa — Khusus Wali Kelas melihat dan memantau biodata seluruh siswa binaannya

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  Search,
  Users,
  User,
  ChevronRight,
  GraduationCap,
  Sparkles,
  X,
  Phone,
  Calendar,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { apiClient } from "../../api/client";
import { SwipeBackContainer } from "../../components/ui/SwipeBackContainer";
import { Card } from "../../components/ui/Card";

interface KelasItem {
  kelas_id: number;
  nama_kelas: string;
}

interface SiswaItem {
  siswa_id: number;
  nama: string;
  nis?: string;
  nisn?: string;
  jenis_kelamin?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  foto?: string;
  wali_murid?: {
    nama_lengkap?: string;
    no_hp?: string;
  };
}

export const DaftarSiswaKelasScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null);

  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [loadingKelas, setLoadingKelas] = useState(true);
  const [loadingSiswa, setLoadingSiswa] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const pegawaiId = (user as any)?.pegawai?.pegawai_id || (user as any)?.pegawai_id;

  // 1. Fetch Kelas Wali
  const fetchKelasWali = useCallback(async () => {
    try {
      setLoadingKelas(true);
      let foundClasses: KelasItem[] = [];
      const cached = (user as any)?.pegawai?.kelas_wali;
      if (Array.isArray(cached) && cached.length > 0) {
        foundClasses = cached;
      }

      if (foundClasses.length === 0 && pegawaiId) {
        try {
          const res = await apiClient.get(`/kelas?wali_kelas_id=${pegawaiId}`);
          const data = res.data?.data || res.data;
          if (Array.isArray(data) && data.length > 0) {
            foundClasses = data;
          }
        } catch (_) {}
      }

      if (foundClasses.length === 0) {
        try {
          const res = await apiClient.get("/kelas");
          const all = res.data?.data || res.data;
          if (Array.isArray(all)) {
            const matched = all.filter(
              (k: any) => k.wali_kelas_id === pegawaiId || k.wali_kelas?.pegawai_id === pegawaiId
            );
            if (matched.length > 0) {
              foundClasses = matched;
            } else if (all.length > 0) {
              foundClasses = all.slice(0, 1);
            }
          }
        } catch (_) {}
      }

      setKelasList(foundClasses);
      if (foundClasses.length > 0) {
        setSelectedKelasId((prev) =>
          prev && foundClasses.some((k) => k.kelas_id === prev) ? prev : foundClasses[0].kelas_id
        );
      }
    } catch (err: any) {
      console.warn("Gagal fetch kelas wali:", err.message);
    } finally {
      setLoadingKelas(false);
    }
  }, [pegawaiId, user]);

  // 2. Fetch Siswa dalam kelas
  const fetchSiswa = useCallback(async () => {
    if (!selectedKelasId) {
      setSiswaList([]);
      return;
    }

    try {
      setLoadingSiswa(true);
      const res = await apiClient.get(`/siswa?kelas_id=${selectedKelasId}&limit=200`);
      const data: SiswaItem[] = res.data?.data || res.data || [];
      setSiswaList(data);
    } catch (err: any) {
      console.warn("Gagal fetch siswa kelas:", err.message);
    } finally {
      setLoadingSiswa(false);
    }
  }, [selectedKelasId]);

  useEffect(() => {
    fetchKelasWali();
  }, [fetchKelasWali]);

  useEffect(() => {
    if (selectedKelasId) {
      fetchSiswa();
    }
  }, [selectedKelasId, fetchSiswa]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchKelasWali();
    if (selectedKelasId) {
      await fetchSiswa();
    }
    setRefreshing(false);
  };

  const currentKelas = useMemo(() => {
    return kelasList.find((k) => k.kelas_id === selectedKelasId);
  }, [kelasList, selectedKelasId]);

  // Filtered siswa by search
  const filteredSiswa = useMemo(() => {
    if (!searchQuery.trim()) return siswaList;
    const q = searchQuery.toLowerCase();
    return siswaList.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q)) ||
        (s.nis && s.nis.toLowerCase().includes(q))
    );
  }, [siswaList, searchQuery]);

  // Gender metrics
  const genderStats = useMemo(() => {
    let lk = 0;
    let pr = 0;
    siswaList.forEach((s) => {
      const jk = (s.jenis_kelamin || "").toUpperCase();
      if (jk === "L" || jk.includes("LAKI")) lk += 1;
      else if (jk === "P" || jk.includes("PEREMPUAN")) pr += 1;
    });
    return { lk, pr, total: siswaList.length };
  }, [siswaList]);

  const handleOpenDetail = (siswaId: number, nama: string) => {
    navigation.navigate("WaliDetailSantri", {
      siswaId,
      nama,
    });
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
              <Text style={styles.headerTitle}>Daftar Siswa Kelas</Text>
              <Text style={styles.headerSubtitle}>
                {currentKelas ? `Kelas ${currentKelas.nama_kelas} (${genderStats.total} Siswa)` : "Daftar Siswa Binaan"}
              </Text>
            </View>

            <View style={styles.headerRightBadge}>
              <Users size={18} color="#93C5FD" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ─── SELECTOR KELAS (JIKA LEBIH DARI 1) ─── */}
      {kelasList.length > 1 && (
        <View style={styles.classSelectorBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {kelasList.map((k) => (
              <TouchableOpacity
                key={k.kelas_id}
                style={[
                  styles.classChip,
                  selectedKelasId === k.kelas_id && styles.classChipActive,
                ]}
                onPress={() => setSelectedKelasId(k.kelas_id)}
              >
                <Text
                  style={[
                    styles.classChipText,
                    selectedKelasId === k.kelas_id && styles.classChipTextActive,
                  ]}
                >
                  Kelas {k.nama_kelas}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ─── SEARCH & METRICS BAR ─── */}
      <View style={styles.topFilterBar}>
        <View style={styles.searchBar}>
          <Search size={15} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama atau NISN santri..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={15} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Quick Gender Badges */}
        <View style={styles.genderRow}>
          <View style={styles.genderBadge}>
            <Text style={styles.genderBadgeText}>Total: {genderStats.total}</Text>
          </View>
          <View style={[styles.genderBadge, { backgroundColor: "#DBEAFE" }]}>
            <Text style={[styles.genderBadgeText, { color: "#1D4ED8" }]}>L: {genderStats.lk}</Text>
          </View>
          <View style={[styles.genderBadge, { backgroundColor: "#FCE7F3" }]}>
            <Text style={[styles.genderBadgeText, { color: "#BE185D" }]}>P: {genderStats.pr}</Text>
          </View>
        </View>
      </View>

      {/* ─── STUDENT LIST ─── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loadingKelas || loadingSiswa ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat daftar siswa...</Text>
          </View>
        ) : filteredSiswa.length === 0 ? (
          <View style={styles.emptyCard}>
            <Users size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Siswa Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>Tidak ada siswa yang sesuai kriteria pencarian.</Text>
          </View>
        ) : (
          <View style={styles.siswaListContainer}>
            {filteredSiswa.map((item, index) => {
              const jk = (item.jenis_kelamin || "").toUpperCase();
              const isMale = jk === "L" || jk.includes("LAKI");

              return (
                <TouchableOpacity
                  key={item.siswa_id}
                  style={styles.studentCard}
                  onPress={() => handleOpenDetail(item.siswa_id, item.nama)}
                  activeOpacity={0.7}
                >
                  <View style={styles.studentCardRow}>
                    {/* Avatar */}
                    <View
                      style={[
                        styles.avatarCircle,
                        { backgroundColor: isMale ? "#DBEAFE" : "#FCE7F3" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          { color: isMale ? "#1D4ED8" : "#BE185D" },
                        ]}
                      >
                        {item.nama.charAt(0)}
                      </Text>
                    </View>

                    {/* Information */}
                    <View style={styles.studentInfoCol}>
                      <View style={styles.nameRow}>
                        <Text style={styles.studentName} numberOfLines={1}>
                          {item.nama}
                        </Text>
                        <View
                          style={[
                            styles.genderTag,
                            { backgroundColor: isMale ? "#EFF6FF" : "#FDF2F8" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.genderTagText,
                              { color: isMale ? "#2563EB" : "#DB2777" },
                            ]}
                          >
                            {isMale ? "L" : "P"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.studentMetaText}>
                        NISN: {item.nisn || "-"} • NIS: {item.nis || "-"}
                      </Text>

                      {item.wali_murid?.nama_lengkap ? (
                        <Text style={styles.waliMetaText} numberOfLines={1}>
                          Wali: {item.wali_murid.nama_lengkap}
                        </Text>
                      ) : null}
                    </View>

                    {/* Chevron Detail */}
                    <View style={styles.chevronBox}>
                      <ChevronRight size={18} color="#94A3B8" />
                    </View>
                  </View>
                </TouchableOpacity>
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
  classSelectorBar: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  classChipActive: {
    backgroundColor: "#162E6E",
  },
  classChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  classChipTextActive: {
    color: "#FFFFFF",
  },
  topFilterBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: "#1E293B",
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  genderBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  siswaListContainer: {
    gap: 10,
  },
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  studentCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
  },
  studentInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  studentName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  genderTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  genderTagText: {
    fontSize: 11,
    fontWeight: "700",
  },
  studentMetaText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },
  waliMetaText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  chevronBox: {
    marginLeft: 8,
  },
});
