// mobile/src/screens/Jadwal/JadwalKelasScreen.tsx
// Jadwal Pelajaran Kelas — Khusus Wali Kelas melihat seluruh mata pelajaran di kelas binaannya

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  Calendar,
  Clock,
  BookOpen,
  User,
  GraduationCap,
  MapPin,
  Sparkles,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { apiClient } from "../../api/client";
import { jadwalService, JadwalItem, GroupedJadwalSesi } from "../../api/jadwalService";
import { groupJadwalSessions } from "../../utils/jadwalHelper";
import { SwipeBackContainer } from "../../components/ui/SwipeBackContainer";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

const getTodayDayName = () => {
  const dayIndex = new Date().getDay();
  const dayMap = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return dayMap[dayIndex] || "Senin";
};

interface KelasItem {
  kelas_id: number;
  nama_kelas: string;
  tingkat?: string | number;
}

export const JadwalKelasScreen = () => {
  const navigation = useNavigation<any>();
  const { user, activeRole } = useAuthStore();

  const [activeDay, setActiveDay] = useState<string>(getTodayDayName);
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null);

  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [loadingKelas, setLoadingKelas] = useState(true);
  const [loadingJadwal, setLoadingJadwal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const pegawaiId = (user as any)?.pegawai?.pegawai_id || (user as any)?.pegawai_id;

  // 1. Fetch kelas binaan wali kelas
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

  // 2. Fetch jadwal untuk kelas terpilih
  const fetchJadwalKelas = useCallback(async () => {
    if (!selectedKelasId) {
      setJadwalList([]);
      return;
    }
    try {
      setLoadingJadwal(true);
      const data = await jadwalService.getJadwalPelajaran({ kelas_id: selectedKelasId });
      setJadwalList(data);
    } catch (err: any) {
      console.warn("Gagal load jadwal kelas:", err.message);
    } finally {
      setLoadingJadwal(false);
    }
  }, [selectedKelasId]);

  useEffect(() => {
    fetchKelasWali();
  }, [fetchKelasWali]);

  useEffect(() => {
    if (selectedKelasId) {
      fetchJadwalKelas();
    }
  }, [selectedKelasId, fetchJadwalKelas]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchKelasWali();
    if (selectedKelasId) {
      await fetchJadwalKelas();
    }
    setRefreshing(false);
  };

  const currentKelas = useMemo(() => {
    return kelasList.find((k) => k.kelas_id === selectedKelasId);
  }, [kelasList, selectedKelasId]);

  // Group jadwal untuk hari terpilih
  const groupedSessions = useMemo<GroupedJadwalSesi[]>(() => {
    const forDay = jadwalList.filter(
      (j) => (j.hari || "").toLowerCase() === activeDay.toLowerCase()
    );
    return groupJadwalSessions(forDay);
  }, [jadwalList, activeDay]);

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
              <Text style={styles.headerTitle}>Jadwal Pelajaran Kelas</Text>
              <Text style={styles.headerSubtitle}>
                {currentKelas ? `Kelas ${currentKelas.nama_kelas}` : "Jadwal Belajar Siswa"}
              </Text>
            </View>

            <View style={styles.badgeTop}>
              <GraduationCap size={18} color="#93C5FD" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ─── CLASS SELECTOR (Jika wali kelas ampu > 1 kelas) ─── */}
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

      {/* ─── DAYS SELECTOR TABS ─── */}
      <View style={styles.daysTabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysScrollContent}
        >
          {DAYS.map((day) => {
            const isActive = activeDay.toLowerCase() === day.toLowerCase();
            const countForDay = jadwalList.filter(
              (j) => (j.hari || "").toLowerCase() === day.toLowerCase()
            ).length;

            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayTab, isActive && styles.dayTabActive]}
                onPress={() => setActiveDay(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive]}>
                  {day}
                </Text>
                {countForDay > 0 && (
                  <View style={[styles.dayCountBadge, isActive && styles.dayCountBadgeActive]}>
                    <Text style={[styles.dayCountText, isActive && styles.dayCountTextActive]}>
                      {countForDay}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── LIST JADWAL SESI ─── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loadingKelas || loadingJadwal ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat jadwal pelajaran kelas...</Text>
          </View>
        ) : groupedSessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Calendar size={36} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>Tidak Ada Pelajaran</Text>
            <Text style={styles.emptySubtitle}>
              Tidak ada jadwal pelajaran untuk Kelas {currentKelas?.nama_kelas || ""} pada hari {activeDay}.
            </Text>
          </View>
        ) : (
          <View style={styles.sessionsList}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Jadwal Hari {activeDay} ({groupedSessions.length} Pelajaran)
              </Text>
              <Text style={styles.sectionClassBadge}>
                {currentKelas?.nama_kelas || "Kelas"}
              </Text>
            </View>

            {groupedSessions.map((sesi, index) => {
              const guruNama = sesi.firstJadwal.pegawai?.nama || "Guru Pengampu";
              const ruangan = sesi.firstJadwal.ruangan;

              return (
                <Card key={sesi.sesiKey || index} style={styles.sessionCard}>
                  {/* Top Bar Card */}
                  <View style={styles.sessionCardHeader}>
                    <View style={styles.timeBadge}>
                      <Clock size={13} color="#1E40AF" />
                      <Text style={styles.timeText}>{sesi.timeRangeStr}</Text>
                    </View>

                    <View style={styles.jpBadge}>
                      <Text style={styles.jpText}>
                        {sesi.labelJam} ({sesi.jumlahJam} JP)
                      </Text>
                    </View>
                  </View>

                  {/* Subject Name */}
                  <View style={styles.subjectRow}>
                    <View style={styles.subjectIconBox}>
                      <BookOpen size={20} color="#162E6E" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subjectName}>{sesi.namaMapel}</Text>
                      {sesi.firstJadwal.mapel?.kode_mapel ? (
                        <Text style={styles.subjectCode}>
                          Kode: {sesi.firstJadwal.mapel.kode_mapel}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Teacher & Room Info */}
                  <View style={styles.teacherInfoRow}>
                    <View style={styles.teacherItem}>
                      <User size={14} color="#64748B" />
                      <Text style={styles.teacherName} numberOfLines={1}>
                        {guruNama}
                      </Text>
                    </View>

                    {ruangan ? (
                      <View style={styles.roomItem}>
                        <MapPin size={13} color="#64748B" />
                        <Text style={styles.roomText}>{ruangan}</Text>
                      </View>
                    ) : null}
                  </View>
                </Card>
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
  badgeTop: {
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
  daysTabContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  daysScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  dayTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dayTabActive: {
    backgroundColor: "#162E6E",
    borderColor: "#162E6E",
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  dayTabTextActive: {
    color: "#FFFFFF",
  },
  dayCountBadge: {
    marginLeft: 6,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dayCountBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  dayCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  dayCountTextActive: {
    color: "#FFFFFF",
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
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  sessionsList: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  sectionClassBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#162E6E",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sessionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E40AF",
  },
  jpBadge: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  jpText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  subjectIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  subjectName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  subjectCode: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  teacherInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  teacherItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  teacherName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#475569",
    flex: 1,
  },
  roomItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roomText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
});
