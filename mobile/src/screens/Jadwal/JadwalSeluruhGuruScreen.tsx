// mobile/src/screens/Jadwal/JadwalSeluruhGuruScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  Calendar,
  Clock,
  BookOpen,
  Users,
  Search,
  User,
  GraduationCap,
  Sparkles,
  Layers,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { jadwalService, JadwalItem } from "../../api/jadwalService";
import { SwipeBackContainer } from "../../components/ui/SwipeBackContainer";
import { getJenjangLembagaIds, getJenjangDisplayName } from "../../utils/lembagaUtil";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

export const JadwalSeluruhGuruScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, activeRole } = useAuthStore();

  // Ambil lembaga_id efektif Kepala Sekolah / Pimpinan
  const effectiveLembagaId =
    activeRole?.lembaga_id ||
    activeRole?.lembaga?.lembaga_id ||
    (user as any)?.lembaga_id ||
    (user as any)?.pegawai?.pegawai_lembaga?.[0]?.lembaga_id ||
    (user as any)?.pegawai?.lembaga_id ||
    null;

  const effectiveLembagaName =
    activeRole?.lembaga?.singkatan ||
    activeRole?.lembaga?.nama_lembaga ||
    (user as any)?.lembaga?.singkatan ||
    (user as any)?.lembaga?.nama_lembaga ||
    (user as any)?.pegawai?.pegawai_lembaga?.[0]?.lembaga?.singkatan ||
    "Unit Sekolah";

  const kepsekJenjangIds = useMemo(() => {
    return getJenjangLembagaIds(effectiveLembagaId);
  }, [effectiveLembagaId]);

  const displayJenjangTitle = useMemo(() => {
    return getJenjangDisplayName(effectiveLembagaId, effectiveLembagaName);
  }, [effectiveLembagaId, effectiveLembagaName]);

  const [activeDay, setActiveDay] = useState(() => {
    const dayIndex = new Date().getDay(); // 0 = Ahad, 1 = Senin, ...
    const dayMap = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return dayMap[dayIndex] || "Senin";
  });

  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (kepsekJenjangIds.length > 0) {
        params.lembaga_id = kepsekJenjangIds.join(",");
      } else if (effectiveLembagaId) {
        params.lembaga_id = effectiveLembagaId;
      }
      const data = await jadwalService.getJadwalPelajaran(params);
      setJadwalList(data);
    } catch (err: any) {
      console.warn("Gagal fetch jadwal guru lembaga:", err.message);
    } finally {
      setLoading(false);
    }
  }, [kepsekJenjangIds, effectiveLembagaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Filter jadwal per hari dan pencarian
  const filteredJadwal = useMemo(() => {
    const dayFiltered = jadwalList.filter(
      (j) => (j.hari || "").toLowerCase() === activeDay.toLowerCase()
    );

    if (!searchQuery.trim()) {
      return dayFiltered.sort((a, b) => {
        const jamA = a.jam_mulai?.urutan_jam || a.jam_ke || a.jadwal_id;
        const jamB = b.jam_mulai?.urutan_jam || b.jam_ke || b.jadwal_id;
        return jamA - jamB;
      });
    }

    const q = searchQuery.toLowerCase();
    return dayFiltered
      .filter((j) => {
        const matchGuru = j.pegawai?.nama?.toLowerCase().includes(q);
        const matchMapel = j.mapel?.nama_mapel?.toLowerCase().includes(q);
        const matchKelas = j.kelas?.nama_kelas?.toLowerCase().includes(q);
        const matchRuang = j.ruangan?.toLowerCase().includes(q);
        return matchGuru || matchMapel || matchKelas || matchRuang;
      })
      .sort((a, b) => {
        const jamA = a.jam_mulai?.urutan_jam || a.jam_ke || a.jadwal_id;
        const jamB = b.jam_mulai?.urutan_jam || b.jam_ke || b.jadwal_id;
        return jamA - jamB;
      });
  }, [jadwalList, activeDay, searchQuery]);

  return (
    <SwipeBackContainer style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#162E6E" />
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
              <Text style={styles.headerTitle}>Jadwal Mengajar Guru</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {displayJenjangTitle} • {filteredJadwal.length} Sesi Terjadwal
              </Text>
            </View>

            <View style={styles.headerRightBadge}>
              <Calendar size={18} color="#93C5FD" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ─── DAY SELECTOR ─── */}
      <View style={styles.daySelectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {DAYS.map((day) => {
            const isActive = activeDay.toLowerCase() === day.toLowerCase();
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, isActive && styles.dayChipActive]}
                onPress={() => setActiveDay(day)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayChipText, isActive && styles.dayChipTextActive]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── SEARCH BAR ─── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={15} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari guru, mata pelajaran, atau kelas..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={{ fontSize: 13, color: "#94A3B8", fontWeight: "600" }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── LIST JADWAL GURU ─── */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat jadwal mengajar...</Text>
          </View>
        ) : filteredJadwal.length === 0 ? (
          <View style={styles.emptyCard}>
            <BookOpen size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Tidak Ada Jadwal</Text>
            <Text style={styles.emptySubtitle}>
              Tidak ada agenda pembelajaran pada hari {activeDay} untuk kriteria pencarian ini.
            </Text>
          </View>
        ) : (
          <View style={styles.jadwalListContainer}>
            {filteredJadwal.map((item) => {
              const jamMulaiStr = item.jam_mulai?.jam_mulai || "--:--";
              const jamSelesaiStr = item.jam_selesai?.jam_selesai || "--:--";
              const urutanMulai = item.jam_mulai?.urutan_jam || item.jam_ke || "-";
              const urutanSelesai = item.jam_selesai?.urutan_jam || urutanMulai;
              const urutanLabel =
                urutanMulai === urutanSelesai
                  ? `Jam ke-${urutanMulai}`
                  : `Jam ke ${urutanMulai}-${urutanSelesai}`;

              return (
                <View key={item.jadwal_id} style={styles.jadwalCard}>
                  {/* Top Bar: Jam & Kelas */}
                  <View style={styles.cardTopBar}>
                    <View style={styles.jamBadge}>
                      <Clock size={12} color="#1D4ED8" />
                      <Text style={styles.jamBadgeText}>
                        {jamMulaiStr} - {jamSelesaiStr} ({urutanLabel})
                      </Text>
                    </View>

                    <View style={styles.kelasBadge}>
                      <GraduationCap size={12} color="#059669" />
                      <Text style={styles.kelasBadgeText}>
                        Kelas {item.kelas?.nama_kelas || "-"}
                      </Text>
                    </View>
                  </View>

                  {/* Mata Pelajaran */}
                  <Text style={styles.mapelTitle}>
                    {item.mapel?.nama_mapel || "Mata Pelajaran"}
                  </Text>

                  {/* Guru Pengampu */}
                  <View style={styles.guruRow}>
                    <View style={styles.avatarMini}>
                      <User size={13} color="#162E6E" />
                    </View>
                    <Text style={styles.guruName}>
                      {item.pegawai?.nama || "Guru Belum Ditentukan"}
                    </Text>
                  </View>

                  {/* Ruangan jika ada */}
                  {item.ruangan && (
                    <Text style={styles.ruanganText}>Ruangan: {item.ruangan}</Text>
                  )}
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
  daySelectorContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  dayChipActive: {
    backgroundColor: "#162E6E",
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  dayChipTextActive: {
    color: "#FFFFFF",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#1E293B",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerLoading: {
    paddingVertical: 48,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748B",
  },
  emptyCard: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  jadwalListContainer: {
    gap: 12,
  },
  jadwalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  jamBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  jamBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  kelasBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  kelasBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  mapelTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  guruRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  avatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  guruName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#334155",
  },
  ruanganText: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 6,
    fontStyle: "italic",
  },
});
