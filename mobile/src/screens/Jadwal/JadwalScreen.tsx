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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  ChevronRight,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { jadwalService, JadwalItem, GroupedJadwalSesi } from "../../api/jadwalService";
import { absensiService, LessonPlanItem } from "../../api/absensiService";
import { groupJadwalSessions } from "../../utils/jadwalHelper";
import { canManageKBM } from "../../utils/permissions";

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

  // Group and filter by selected day
  const groupedSessions = useMemo(() => {
    const forDay = jadwalList.filter(
      (j) => (j.hari || "").toLowerCase() === activeDay.toLowerCase()
    );
    return groupJadwalSessions(forDay, lessonPlans);
  }, [jadwalList, activeDay, lessonPlans]);

  const handleStartPresensi = (sesi: GroupedJadwalSesi) => {
    if (!canManageKBM(user)) {
      Alert.alert(
        "Akses Dibatasi",
        "Hanya Ustadz/Ustadzah pengampu dan Guru yang dapat mengisi presensi KBM."
      );
      return;
    }

    if (!sesi.isLPReady) {
      Alert.alert(
        "Lesson Plan (RPP) Belum Disetujui",
        `Lesson Plan (RPP) untuk "${sesi.namaMapel} - ${sesi.namaKelas}" belum disetujui oleh Kepala Sekolah & Direktur.\n\nSesuai aturan kurikulum, presensi dan jurnal mengajar baru dapat diisi setelah RPP berstatus "Disetujui".`
      );
      return;
    }

    navigation.navigate("AbsensiMapel", {
      jadwalId: sesi.firstJadwal.jadwal_id,
      jadwalIds: sesi.jadwalIds,
      kelasId: sesi.kelasId,
      mapelId: sesi.mapelId,
      kelasNama: sesi.namaKelas,
      mapelNama: sesi.namaMapel,
      lessonPlanDetailId: sesi.lessonPlanDetailId,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Jadwal Pelajaran"
        subtitle="Jadwal Mengajar & Presensi KBM"
      />

      {/* Tabs Hari */}
      <View style={styles.dayTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayTabs}
        >
          {DAYS.map((day) => {
            const isSelected = activeDay === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setActiveDay(day)}
                style={[styles.dayTab, isSelected && styles.dayTabActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayTabText, isSelected && styles.dayTabTextActive]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Hari {activeDay} ({groupedSessions.length} Sesi Pertemuan)
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat jadwal pelajaran & status RPP...</Text>
          </View>
        ) : groupedSessions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Calendar size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Tidak Ada Jadwal</Text>
            <Text style={styles.emptySubtitle}>
              Tidak ada jadwal mengajar pada hari {activeDay}.
            </Text>
          </Card>
        ) : (
          groupedSessions.map((sesi) => (
            <Card key={sesi.sesiKey} style={styles.jadwalCard}>
              {/* Header Sesi: Jam Ke & Waktu */}
              <View style={styles.jadwalHeader}>
                <View style={styles.jamKeTag}>
                  <Text style={styles.jamKeText}>{sesi.labelJam}</Text>
                </View>
                <View style={styles.timeTag}>
                  <Clock size={12} color="#475569" />
                  <Text style={styles.timeText}>{sesi.timeRangeStr}</Text>
                </View>
              </View>

              {/* Title & Info */}
              <Text style={styles.mapelTitle}>{sesi.namaMapel}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Users size={14} color="#64748b" />
                  <Text style={styles.metaText}>{sesi.namaKelas}</Text>
                </View>
                {sesi.jumlahJam > 1 && (
                  <View style={styles.durasiBadge}>
                    <Text style={styles.durasiText}>{sesi.jumlahJam} Jam Pelajaran</Text>
                  </View>
                )}
              </View>

              {/* Status RPP / Lesson Plan Banner */}
              <View
                style={[
                  styles.rppStatusBanner,
                  sesi.isLPReady ? styles.rppBannerReady : styles.rppBannerPending,
                ]}
              >
                {sesi.isLPReady ? (
                  <>
                    <CheckCircle2 size={14} color="#15803d" />
                    <Text style={styles.rppReadyText}>
                      RPP Disetujui (Siap Mengajar & Presensi)
                    </Text>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} color="#b45309" />
                    <Text style={styles.rppPendingText}>
                      RPP Belum Disetujui Kepsek/Direktur
                    </Text>
                  </>
                )}
              </View>

              {/* Action Button: Isi Presensi */}
              <TouchableOpacity
                style={[
                  styles.presensiActionBtn,
                  sesi.isLPReady
                    ? styles.presensiBtnEnabled
                    : styles.presensiBtnDisabled,
                ]}
                onPress={() => handleStartPresensi(sesi)}
                activeOpacity={0.85}
              >
                {sesi.isLPReady ? (
                  <>
                    <Text style={styles.presensiActionText}>📝 Isi Presensi & Jurnal</Text>
                    <ChevronRight size={16} color="#FFFFFF" />
                  </>
                ) : (
                  <>
                    <Lock size={14} color="#64748b" />
                    <Text style={styles.presensiActionTextDisabled}>
                      RPP Belum Disetujui (Terkunci)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  dayTabsWrapper: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  dayTabs: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  dayTabActive: {
    backgroundColor: "#065f46",
  },
  dayTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  dayTabTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 10,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#334155",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
  },
  jadwalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  jadwalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  jamKeTag: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  jamKeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#15803d",
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  mapelTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  durasiBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durasiText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  rppStatusBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
    marginBottom: 12,
  },
  rppBannerReady: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  rppReadyText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803d",
  },
  rppBannerPending: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  rppPendingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#b45309",
  },
  presensiActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  presensiBtnEnabled: {
    backgroundColor: "#065f46",
  },
  presensiBtnDisabled: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  presensiActionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },
  presensiActionTextDisabled: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
});
