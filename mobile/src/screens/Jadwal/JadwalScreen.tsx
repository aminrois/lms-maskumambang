// mobile/src/screens/Jadwal/JadwalScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Clock, BookOpen, Users } from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { jadwalService, JadwalItem } from "../../api/jadwalService";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export const JadwalScreen = () => {
  const { user } = useAuthStore();
  const [activeDay, setActiveDay] = useState("Senin");
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [loading, setLoading] = useState(false);

  const teacherPegawaiId = user?.pegawai_id || user?.pegawai?.pegawai_id;

  const fetchJadwal = async () => {
    if (!teacherPegawaiId) return;
    try {
      setLoading(true);
      const data = await jadwalService.getJadwalPelajaran({ pegawai_id: teacherPegawaiId });
      setJadwalList(data);
    } catch (err) {
      console.warn("Error fetching jadwal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJadwal();
  }, [teacherPegawaiId]);

  const filteredJadwal = useMemo(() => {
    return jadwalList
      .filter((j) => (j.hari || "").toLowerCase() === activeDay.toLowerCase())
      .sort((a, b) => (a.jam_ke || 0) - (b.jam_ke || 0));
  }, [jadwalList, activeDay]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="Jadwal Pelajaran" subtitle="Jadwal mengajar mingguan Anda" />

      {/* Tabs Hari */}
      <View style={styles.dayTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
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
          <RefreshControl refreshing={loading} onRefresh={fetchJadwal} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Hari {activeDay} ({filteredJadwal.length} Jam Pertemuan)
          </Text>
        </View>

        {filteredJadwal.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Calendar size={36} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Tidak Ada Jadwal</Text>
            <Text style={styles.emptySubtitle}>Tidak ada jadwal mengajar di hari {activeDay}.</Text>
          </Card>
        ) : (
          filteredJadwal.map((item) => (
            <Card key={item.jadwal_id} style={styles.jadwalCard}>
              <View style={styles.jadwalHeader}>
                <View style={styles.jamKeTag}>
                  <Text style={styles.jamKeText}>Jam Ke-{item.jam_ke}</Text>
                </View>
                <View style={styles.timeTag}>
                  <Clock size={12} color={Colors.textSub} />
                  <Text style={styles.timeText}>
                    {item.jam_mulai?.slice(0, 5)} - {item.jam_selesai?.slice(0, 5)}
                  </Text>
                </View>
              </View>

              <Text style={styles.mapelTitle}>{item.mapel?.nama_mapel || "Mata Pelajaran"}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Users size={14} color={Colors.textSub} />
                  <Text style={styles.metaText}>{item.kelas?.nama_kelas || "Kelas"}</Text>
                </View>
                {item.mapel?.kode_mapel && (
                  <Badge label={item.mapel.kode_mapel} variant="neutral" size="sm" />
                )}
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
  dayTabsWrapper: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayTabs: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
  },
  dayTabActive: {
    backgroundColor: Colors.primary,
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSub,
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
    fontSize: 15,
    fontWeight: "800",
    color: Colors.primaryDark,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
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
    marginTop: 4,
  },
  jadwalCard: {
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  jadwalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  jamKeTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  jamKeText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.primary,
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSub,
  },
  mapelTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSub,
    fontWeight: "600",
  },
});
