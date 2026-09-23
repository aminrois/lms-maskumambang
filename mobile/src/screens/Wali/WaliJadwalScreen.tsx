// mobile/src/screens/Wali/WaliJadwalScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Calendar,
  Clock,
  User,
  GraduationCap,
  BookOpen,
} from "lucide-react-native";
import { waliService } from "../../api/waliService";
import { groupJadwalSessions, GroupedJadwalSesi } from "../../utils/jadwalHelper";
import { SwipeBackContainer } from "../../components/ui/SwipeBackContainer";

const HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

const getNamaHariIni = () => {
  const dayIndex = new Date().getDay();
  const map = [6, 0, 1, 2, 3, 4, 5];
  return HARI_ORDER[map[dayIndex]];
};

export const WaliJadwalScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialSiswaId = route.params?.siswaId || null;

  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(initialSiswaId);
  const [selectedHari, setSelectedHari] = useState<string>(getNamaHariIni());
  const [refreshing, setRefreshing] = useState(false);

  // Query Daftar Anak
  const { data: daftarAnak = [], refetch: refetchAnak } = useQuery({
    queryKey: ["wali-daftar-anak"],
    queryFn: () => waliService.getDaftarAnak(),
    staleTime: 5 * 60 * 1000,
  });

  const activeSiswaId = selectedSiswaId || (daftarAnak.length > 0 ? daftarAnak[0].siswa_id : null);

  const activeAnak = useMemo(
    () => daftarAnak.find((a) => a.siswa_id === activeSiswaId) || daftarAnak[0],
    [daftarAnak, activeSiswaId]
  );

  // Query Perkembangan Anak
  const {
    data: perkembangan,
    isLoading,
    refetch: refetchPerkembangan,
  } = useQuery({
    queryKey: ["wali-perkembangan-anak", activeSiswaId],
    queryFn: () => (activeSiswaId ? waliService.getPerkembanganAnak(activeSiswaId) : null),
    enabled: !!activeSiswaId,
    staleTime: 2 * 60 * 1000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAnak(), refetchPerkembangan()]);
    setRefreshing(false);
  };

  // Grouping jadwal
  const allGroupedJadwal = useMemo<GroupedJadwalSesi[]>(() => {
    const list = (perkembangan?.jadwalPelajaran as any[]) || [];
    return groupJadwalSessions(list);
  }, [perkembangan?.jadwalPelajaran]);

  const activeDaySessions = useMemo(() => {
    return allGroupedJadwal.filter((j) => j.hari === selectedHari);
  }, [allGroupedJadwal, selectedHari]);

  return (
    <SwipeBackContainer style={styles.container}>
      {/* ═══════════════════════════════════════════════════════
          TOP HEADER
      ════════════════════════════════════════════════════════ */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.topNavRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle}>Jadwal Pelajaran</Text>
              <Text style={styles.headerSubtitle}>
                Kurikulum & Jam Belajar Santri
              </Text>
            </View>

            <View style={styles.headerRightBadge}>
              <Calendar size={18} color="#C4B5FD" />
            </View>
          </View>

          {/* Santri Switcher Strip */}
          {daftarAnak.length > 1 && (
            <View style={styles.santriSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {daftarAnak.map((anak) => {
                  const isSelected = anak.siswa_id === activeSiswaId;
                  return (
                    <TouchableOpacity
                      key={anak.siswa_id}
                      style={[styles.santriChip, isSelected && styles.santriChipActive]}
                      onPress={() => setSelectedSiswaId(anak.siswa_id)}
                      activeOpacity={0.8}
                    >
                      <User size={13} color={isSelected ? "#FFFFFF" : "#CBD5E1"} />
                      <Text
                        style={[styles.santriChipText, isSelected && styles.santriChipTextActive]}
                      >
                        {anak.nama}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </View>

      {/* ═══════════════════════════════════════════════════════
          DAY SELECTOR HORIZONTAL BAR
      ════════════════════════════════════════════════════════ */}
      <View style={styles.daySelectorBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {HARI_ORDER.map((hariName) => {
            const count = allGroupedJadwal.filter((j) => j.hari === hariName).length;
            const isSelected = selectedHari === hariName;
            return (
              <TouchableOpacity
                key={hariName}
                style={[styles.dayPill, isSelected && styles.dayPillActive]}
                onPress={() => setSelectedHari(hariName)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayPillText, isSelected && styles.dayPillTextActive]}>
                  {hariName}
                </Text>
                {count > 0 && (
                  <View style={[styles.dayCountBadge, isSelected && styles.dayCountBadgeActive]}>
                    <Text style={[styles.dayCountBadgeText, isSelected && styles.dayCountBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ═══════════════════════════════════════════════════════
          CONTENT BODY
      ════════════════════════════════════════════════════════ */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#162E6E"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Info Santri Bar */}
        <View style={styles.santriInfoBar}>
          <View style={styles.santriAvatar}>
            <Text style={styles.santriAvatarText}>{activeAnak?.nama?.charAt(0) || "S"}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.santriName}>{activeAnak?.nama || "Santri"}</Text>
            <Text style={styles.santriMeta}>
              Kelas {activeAnak?.kelas?.nama_kelas || "-"} • {activeAnak?.kelas?.lembaga?.nama_lembaga || "Pesantren Maskumambang"}
            </Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Jadwal Hari {selectedHari} ({activeDaySessions.length} Sesi Pelajaran)
          </Text>
        </View>

        {/* Sesi List */}
        {activeDaySessions.length > 0 ? (
          activeDaySessions.map((session, idx) => (
            <View key={session.sesiKey || idx} style={styles.sessionCard}>
              <View style={styles.sessionTopRow}>
                <View style={styles.timeBadge}>
                  <Clock size={12} color="#1E40AF" />
                  <Text style={styles.timeBadgeText}>{session.timeRangeStr}</Text>
                </View>

                <View style={styles.jamKeBadge}>
                  <Text style={styles.jamKeBadgeText}>{session.labelJam}</Text>
                </View>
              </View>

              <Text style={styles.mapelTitle}>{session.namaMapel}</Text>

              <View style={styles.sessionFooter}>
                <Text style={styles.guruText}>
                  👤 {session.firstJadwal?.pegawai?.nama || "Guru Pengampu"}
                </Text>
                <Text style={styles.kelasText}>
                  🏫 {session.namaKelas}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Calendar size={36} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Tidak Ada Jam Pelajaran</Text>
            <Text style={styles.emptySub}>
              Pada hari {selectedHari}, santri tidak memiliki jadwal mata pelajaran kelas utama. Kegiatan difokuskan pada asrama, tahfidz, dan pengembangan diri.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
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
    paddingTop: Platform.OS === "android" ? 10 : 4,
  },
  topNavRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#93C5FD",
    fontSize: 11.5,
    fontWeight: "500",
    marginTop: 1,
  },
  headerRightBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  santriSelector: {
    marginTop: 14,
  },
  santriChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  santriChipActive: {
    backgroundColor: "#2563EB",
  },
  santriChipText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },
  santriChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  daySelectorBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 10,
  },
  dayPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
  },
  dayPillActive: {
    backgroundColor: "#162E6E",
    borderColor: "#162E6E",
  },
  dayPillText: {
    color: "#475569",
    fontSize: 12.5,
    fontWeight: "600",
  },
  dayPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  dayCountBadge: {
    backgroundColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  dayCountBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dayCountBadgeText: {
    color: "#1E293B",
    fontSize: 10,
    fontWeight: "800",
  },
  dayCountBadgeTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
  },
  santriInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  santriAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#162E6E",
    alignItems: "center",
    justifyContent: "center",
  },
  santriAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  santriName: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  santriMeta: {
    color: "#64748B",
    fontSize: 11.5,
    marginTop: 2,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sessionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    gap: 4,
  },
  timeBadgeText: {
    color: "#1E40AF",
    fontSize: 11,
    fontWeight: "700",
  },
  jamKeBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  jamKeBadgeText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
  },
  mapelTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  sessionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
    paddingTop: 8,
  },
  guruText: {
    color: "#64748B",
    fontSize: 11.5,
    fontWeight: "500",
  },
  kelasText: {
    color: "#059669",
    fontSize: 11.5,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 10,
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 12,
  },
  emptySub: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
});
