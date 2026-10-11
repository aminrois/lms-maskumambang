// mobile/src/screens/Jadwal/JadwalScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  AlertTriangle,
  User,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  MapPin,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { jadwalService, JadwalItem } from "../../api/jadwalService";
import { absensiService, LessonPlanItem } from "../../api/absensiService";
import { isLessonPlanApproved } from "../../utils/jadwalHelper";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

export const JadwalScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [activeDay, setActiveDay] = useState(() => {
    const dayIndex = new Date().getDay(); // 0 = Ahad, 1 = Senin, ...
    const dayMap = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return dayMap[dayIndex] || "Senin";
  });

  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const teacherPegawaiId = user?.pegawai?.pegawai_id;
  const pegawaiNama = user?.pegawai?.nama || user?.username || "Guru Aktif";

  const fetchData = useCallback(async () => {
    if (!teacherPegawaiId) return;
    try {
      setLoading(true);
      const [jadwalData, lpData] = await Promise.all([
        jadwalService.getJadwalPelajaran({ pegawai_id: teacherPegawaiId }),
        absensiService.getLessonPlans({ pegawai_id: teacherPegawaiId }).catch(() => []),
      ]);
      setJadwalList(jadwalData);
      setLessonPlans(lpData);
    } catch (err: any) {
      console.warn("Error fetching jadwal / lesson plans:", err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherPegawaiId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Map of unverified Lesson Plans
  const unverifiedCount = useMemo(() => {
    let count = 0;
    jadwalList.forEach((j) => {
      const matched = lessonPlans.find((lp) => lp.jadwal_id === j.jadwal_id);
      if (!matched || !isLessonPlanApproved(matched)) {
        count++;
      }
    });
    return count;
  }, [jadwalList, lessonPlans]);

  // Filter schedules for active day
  const forActiveDay = useMemo(() => {
    return jadwalList
      .filter((j) => (j.hari || "").toLowerCase() === activeDay.toLowerCase())
      .sort((a, b) => {
        const jamA = a.jam_mulai?.urutan_jam || a.jam_ke || a.jadwal_id;
        const jamB = b.jam_mulai?.urutan_jam || b.jam_ke || b.jadwal_id;
        return jamA - jamB;
      });
  }, [jadwalList, activeDay]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Jadwal Mengajar Saya"
        subtitle="Sistem Akademik · Tahun Ajaran Aktif"
      />

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
        {/* Guru Aktif Card */}
        <View style={styles.teacherCard}>
          <View style={styles.teacherIconBox}>
            <User size={18} color="#1D4ED8" />
          </View>
          <View style={styles.teacherInfoWrap}>
            <Text style={styles.teacherRoleLabel}>GURU AKTIF</Text>
            <Text style={styles.teacherNameText}>{pegawaiNama}</Text>
          </View>
        </View>

        {/* Warning Lesson Plan Belum Terverifikasi jika ada */}
        {unverifiedCount > 0 && (
          <View style={styles.unverifiedBanner}>
            <View style={styles.unverifiedIconBox}>
              <AlertTriangle size={18} color="#D97706" />
            </View>
            <View style={styles.unverifiedTextWrap}>
              <Text style={styles.unverifiedTitle}>
                {unverifiedCount} Lesson Plan Belum Diverifikasi
              </Text>
              <Text style={styles.unverifiedDesc}>
                Terdapat jadwal pelajaran yang RPP-nya belum disetujui Kepala Sekolah & Direktur.
              </Text>
            </View>
          </View>
        )}

        {/* Tabs Hari */}
        <View style={styles.dayTabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayTabs}
          >
            {DAYS.map((day) => {
              const isSelected = activeDay === day;
              const countForDay = jadwalList.filter(
                (j) => (j.hari || "").toLowerCase() === day.toLowerCase()
              ).length;

              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => setActiveDay(day)}
                  style={[styles.dayTab, isSelected && styles.dayTabActive]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.dayTabText, isSelected && styles.dayTabTextActive]}
                  >
                    {day}
                  </Text>
                  {countForDay > 0 && (
                    <View
                      style={[
                        styles.dayCountBadge,
                        isSelected && styles.dayCountBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayCountText,
                          isSelected && styles.dayCountTextActive,
                        ]}
                      >
                        {countForDay}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.dayIconCircle}>
            <Text style={styles.dayIconText}>{activeDay.substring(0, 2)}</Text>
          </View>
          <Text style={styles.sectionTitle}>Jadwal Hari {activeDay}</Text>
          <View style={styles.sessionCountBadge}>
            <Text style={styles.sessionCountText}>{forActiveDay.length} Sesi</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat jadwal mengajar...</Text>
          </View>
        ) : forActiveDay.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CalendarDays size={42} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Tidak Ada Jadwal Mengajar</Text>
            <Text style={styles.emptySubtitle}>
              Anda tidak memiliki jadwal mengajar pada hari {activeDay}.
            </Text>
          </Card>
        ) : (
          forActiveDay.map((item, index) => {
            const matchedLP = lessonPlans.find((lp) => lp.jadwal_id === item.jadwal_id);
            const isLPReady = matchedLP ? isLessonPlanApproved(matchedLP) : false;

            const jamMulaiStr =
              typeof item.jam_mulai === "object"
                ? item.jam_mulai?.jam_mulai
                : item.jam_mulai || "-";
            const jamSelesaiStr =
              typeof item.jam_selesai === "object"
                ? item.jam_selesai?.jam_selesai
                : item.jam_selesai || "-";
            const jamNum =
              typeof item.jam_mulai === "object" && item.jam_mulai?.urutan_jam
                ? item.jam_mulai.urutan_jam
                : item.jam_ke || index + 1;

            return (
              <Card key={item.jadwal_id || index} style={styles.jadwalCard}>
                {/* Header Sesi: Jam Ke & Waktu */}
                <View style={styles.jadwalHeader}>
                  <View style={styles.jamKeTag}>
                    <Text style={styles.jamKeText}>Jam ke-{jamNum}</Text>
                  </View>
                  <View style={styles.timeTag}>
                    <Clock size={12} color="#475569" />
                    <Text style={styles.timeText}>
                      {jamMulaiStr} - {jamSelesaiStr}
                    </Text>
                  </View>
                </View>

                {/* Mata Pelajaran & Kelas */}
                <Text style={styles.mapelTitle}>
                  {item.mapel?.nama_mapel || `Mapel ${item.mapel_id}`}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Users size={13} color="#64748B" />
                    <Text style={styles.metaText}>
                      {item.kelas?.nama_kelas || `Kelas ${item.kelas_id}`}
                    </Text>
                  </View>
                  {item.ruangan && (
                    <View style={styles.metaItem}>
                      <MapPin size={13} color="#64748B" />
                      <Text style={styles.metaText}>{item.ruangan}</Text>
                    </View>
                  )}
                </View>

                {/* Status RPP Indicator Badge */}
                <View style={styles.rppFooter}>
                  <View
                    style={[
                      styles.rppBadge,
                      isLPReady ? styles.rppBadgeApproved : styles.rppBadgePending,
                    ]}
                  >
                    {isLPReady ? (
                      <>
                        <CheckCircle2 size={12} color="#15803D" />
                        <Text style={styles.rppApprovedText}>RPP Terverifikasi</Text>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={12} color="#B45309" />
                        <Text style={styles.rppPendingText}>RPP Belum Disetujui</Text>
                      </>
                    )}
                  </View>
                </View>
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
  teacherCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    marginBottom: 12,
  },
  teacherIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  teacherInfoWrap: {
    flex: 1,
  },
  teacherRoleLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  teacherNameText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 1,
  },
  unverifiedBanner: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FEF3C7",
    marginBottom: 14,
  },
  unverifiedIconBox: {
    marginRight: 10,
    marginTop: 2,
  },
  unverifiedTextWrap: {
    flex: 1,
  },
  unverifiedTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#92400E",
  },
  unverifiedDesc: {
    fontSize: 11,
    color: "#B45309",
    marginTop: 2,
    lineHeight: 15,
  },
  dayTabsWrapper: {
    marginBottom: 14,
  },
  dayTabs: {
    gap: 8,
  },
  dayTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dayTabActive: {
    backgroundColor: "#162E6E",
    borderColor: "#162E6E",
  },
  dayTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  dayTabTextActive: {
    color: "#FFFFFF",
  },
  dayCountBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  dayCountBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  dayCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  dayCountTextActive: {
    color: "#FFFFFF",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dayIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#162E6E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  dayIconText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
  },
  sessionCountBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sessionCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  loadingContainer: {
    padding: 30,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748B",
  },
  emptyCard: {
    padding: 28,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  jadwalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  jadwalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  jamKeTag: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  jamKeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 11.5,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#475569",
  },
  mapelTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  rppFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
  },
  rppBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rppBadgeApproved: {
    backgroundColor: "#F0FDF4",
  },
  rppBadgePending: {
    backgroundColor: "#FFFBEB",
  },
  rppApprovedText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#15803D",
  },
  rppPendingText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#B45309",
  },
});
