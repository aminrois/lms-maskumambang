// mobile/src/screens/Dashboard/TeacherDashboardScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  ClipboardList,
} from "lucide-react-native";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { jadwalService, JadwalItem } from "../../api/jadwalService";
import { absensiService } from "../../api/absensiService";

const HARI_MAP: { [key: number]: string } = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
};

export const TeacherDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [jurnals, setJurnals] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(
    HARI_MAP[new Date().getDay()] || "Senin"
  );

  const teacherPegawaiId = user?.pegawai_id || user?.pegawai?.pegawai_id;

  const todayFormatted = useMemo(() => {
    const d = new Date();
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }, []);

  const fetchData = useCallback(async () => {
    if (!teacherPegawaiId) return;
    try {
      const todayISO = new Date().toISOString().split("T")[0];
      const [jRes, lpRes, jurRes] = await Promise.all([
        jadwalService.getJadwalPelajaran({ pegawai_id: teacherPegawaiId }),
        absensiService.getLessonPlans({ pegawai_id: teacherPegawaiId, status: "Approved" }),
        absensiService.getJurnalMengajar({ pegawai_id: teacherPegawaiId, tanggal: todayISO }),
      ]);
      setJadwalList(jRes);
      setLessonPlans(lpRes);
      setJurnals(jurRes);
    } catch (err: any) {
      console.warn("Failed fetching dashboard data:", err);
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

  // Group jadwal berdasarkan Mapel & Kelas di hari yang dipilih
  const groupedSessions = useMemo(() => {
    const todayJadwals = jadwalList
      .filter((j) => (j.hari || "").toLowerCase() === selectedDay.toLowerCase())
      .sort((a, b) => (a.jam_ke || 0) - (b.jam_ke || 0));

    const groups: { [key: string]: JadwalItem[] } = {};
    todayJadwals.forEach((j) => {
      const kId = j.kelas_id || j.kelas?.kelas_id;
      const mId = j.mapel_id || j.mapel?.mapel_id;
      const key = `${kId}_${mId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(j);
    });

    return Object.keys(groups).map((key) => {
      const items = groups[key];
      const first = items[0];
      const mapelName = first.mapel?.nama_mapel || "Mata Pelajaran";
      const kelasName = first.kelas?.nama_kelas || "Kelas";

      // Jam ke range
      const jamNums = items.map((i) => i.jam_ke).filter(Boolean);
      const jamLabel =
        jamNums.length > 1
          ? `Jam ke-${Math.min(...jamNums)} - ${Math.max(...jamNums)}`
          : `Jam ke-${jamNums[0] || 1}`;

      const timeRange = `${first.jam_mulai?.slice(0, 5) || "07:00"} - ${
        items[items.length - 1].jam_selesai?.slice(0, 5) || "08:00"
      }`;

      // Check LP
      const isLPApproved = lessonPlans.some(
        (lp) =>
          (lp.mapel_id === first.mapel_id || lp.jadwal?.mapel_id === first.mapel_id) &&
          (lp.status === "Approved" || lp.status_verifikasi === "Approved")
      );

      // Check attendance completed today
      const isDone = jurnals.some(
        (jur) =>
          jur.kelas_id === first.kelas_id &&
          jur.mapel_id === first.mapel_id
      );

      return {
        key,
        jadwalIds: items.map((i) => i.jadwal_id),
        firstJadwalId: first.jadwal_id,
        kelasId: first.kelas_id,
        mapelId: first.mapel_id,
        mapelName,
        kelasName,
        jamLabel,
        timeRange,
        totalJam: items.length,
        isLPApproved,
        isDone,
      };
    });
  }, [jadwalList, selectedDay, lessonPlans, jurnals]);

  const stats = useMemo(() => {
    const total = groupedSessions.length;
    const selesai = groupedSessions.filter((s) => s.isDone).length;
    const belum = total - selesai;
    return { total, selesai, belum };
  }, [groupedSessions]);

  const handleStartAbsensi = (session: any) => {
    navigation.navigate("AbsensiMapel", {
      jadwalId: session.firstJadwalId,
      jadwalIds: session.jadwalIds,
      kelasId: session.kelasId,
      mapelId: session.mapelId,
      kelasNama: session.kelasName,
      mapelNama: session.mapelName,
    });
  };

  const daysList = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Card */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Assalamu'alaikum,</Text>
            <Text style={styles.teacherName}>
              {user?.pegawai?.nama || user?.nama_lengkap || "Ustadz/Ustadzah"}
            </Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleText}>{user?.peran || "Guru Pengajar"}</Text>
            </View>
          </View>
          <View style={styles.dateBox}>
            <Calendar size={14} color={Colors.primary} />
            <Text style={styles.dateText}>{todayFormatted}</Text>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: Colors.primary }]}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Sesi Hari Ini</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.success }]}>
            <Text style={[styles.statNumber, { color: Colors.success }]}>{stats.selesai}</Text>
            <Text style={styles.statLabel}>Selesai Absen</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.warning }]}>
            <Text style={[styles.statNumber, { color: Colors.warning }]}>{stats.belum}</Text>
            <Text style={styles.statLabel}>Menunggu Absen</Text>
          </View>
        </View>

        {/* Filter Hari */}
        <View style={styles.daySelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
            {daysList.map((day) => {
              const isSelected = selectedDay.toLowerCase() === day.toLowerCase();
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => setSelectedDay(day)}
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

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <ClipboardList size={20} color={Colors.primaryDark} />
            <Text style={styles.sectionTitle}>
              Jadwal Mengajar {selectedDay === HARI_MAP[new Date().getDay()] ? "Hari Ini" : selectedDay}
            </Text>
          </View>
          <Badge
            label={`${groupedSessions.length} Kelas`}
            variant={groupedSessions.length > 0 ? "primary" : "neutral"}
          />
        </View>

        {/* Schedule List */}
        {groupedSessions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Clock size={36} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Tidak Ada Jadwal Mengajar</Text>
            <Text style={styles.emptySubtitle}>
              Tidak ditemukan jadwal mengajar untuk hari {selectedDay}.
            </Text>
          </Card>
        ) : (
          groupedSessions.map((session) => (
            <Card key={session.key} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.jamBadge}>
                  <Clock size={12} color={Colors.primary} />
                  <Text style={styles.jamText}>{session.jamLabel}</Text>
                </View>
                <Badge
                  label={session.isDone ? "Sudah Diabsen" : "Siap Absen"}
                  variant={session.isDone ? "success" : "info"}
                />
              </View>

              <Text style={styles.mapelTitle}>{session.mapelName}</Text>
              
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Users size={14} color={Colors.textSub} />
                  <Text style={styles.metaText}>{session.kelasName}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Clock size={14} color={Colors.textSub} />
                  <Text style={styles.metaText}>{session.timeRange} ({session.totalJam} Jam)</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Button
                  title={session.isDone ? "Lihat / Edit Presensi" : "ISI ABSENSI SEKARANG"}
                  variant={session.isDone ? "secondary" : "primary"}
                  onPress={() => handleStartAbsensi(session)}
                  icon={<ArrowRight size={16} color={session.isDone ? Colors.primary : "#FFFFFF"} />}
                  style={{ flex: 1 }}
                />
              </View>
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
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  teacherName: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.primaryDark,
    marginTop: 2,
  },
  roleTag: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSub,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.primaryDark,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
  },
  daySelectorContainer: {
    marginBottom: 16,
  },
  dayScroll: {
    gap: 8,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSub,
  },
  dayTabTextActive: {
    color: "#FFFFFF",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.primaryDark,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
  sessionCard: {
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  jamBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  jamText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  mapelTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.primaryDark,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSub,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
  },
});
