// mobile/src/screens/LMS/JurnalMengajarScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {
  ClipboardList,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { absensiService, JurnalMengajarItem } from "../../api/absensiService";

export const JurnalMengajarScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [jurnalList, setJurnalList] = useState<JurnalMengajarItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const teacherPegawaiId = user?.pegawai?.pegawai_id;

  const fetchJurnal = useCallback(async () => {
    if (!teacherPegawaiId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await absensiService.getJurnalMengajar({ pegawai_id: teacherPegawaiId });
      setJurnalList(data || []);
    } catch (err) {
      console.warn("Error fetching Jurnal Mengajar:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacherPegawaiId]);

  useEffect(() => {
    if (isFocused) {
      fetchJurnal();
    }
  }, [isFocused, fetchJurnal]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJurnal();
  };

  const filteredList = jurnalList.filter((j) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const kelas = (j.jadwal?.kelas?.nama_kelas || "").toLowerCase();
    const mapel = (j.jadwal?.mapel?.nama_mapel || "").toLowerCase();
    const materi = (j.lesson_plan_detail?.topik_materi || j.lesson_plan_detail?.materi || "").toLowerCase();
    const catatan = (j.catatan_tambahan || "").toLowerCase();
    return kelas.includes(q) || mapel.includes(q) || materi.includes(q) || catatan.includes(q);
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Jurnal Mengajar"
        subtitle="Riwayat aktivitas belajar mengajar di kelas"
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
            placeholder="Cari kelas, mapel, materi, atau catatan..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat riwayat jurnal...</Text>
          </View>
        ) : filteredList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ClipboardList size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Belum Ada Jurnal Mengajar</Text>
            <Text style={styles.emptySubtitle}>
              Riwayat jurnal akan otomatis terdata saat Anda menyelesaikan absensi mapel.
            </Text>
          </Card>
        ) : (
          filteredList.map((j) => {
            const isTepatWaktu = j.status === "Tepat Waktu" || j.status === "Sesuai";
            const dateStr = (j.tanggal || "").split("T")[0];
            const attendanceCount = j.absensi_pelajaran?.length || 0;

            return (
              <Card key={j.jurnal_id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.badgeRow}>
                    <Badge
                      label={`Kelas ${j.jadwal?.kelas?.nama_kelas || "-"}`}
                      variant="primary"
                      size="sm"
                    />
                    <Badge
                      label={j.status || "Tepat Waktu"}
                      variant={isTepatWaktu ? "success" : "warning"}
                      size="sm"
                    />
                  </View>
                  <Text style={styles.dateText}>{dateStr}</Text>
                </View>

                <Text style={styles.mapelTitle}>
                  {j.jadwal?.mapel?.nama_mapel || "Mata Pelajaran"}
                </Text>

                <View style={styles.pertemuanRow}>
                  <View style={styles.pertemuanBadge}>
                    <Text style={styles.pertemuanText}>
                      Pertemuan ke-{j.pertemuan_ke || 1}
                    </Text>
                  </View>
                  <Text style={styles.attendanceText}>
                    {attendanceCount} Santri Terdata
                  </Text>
                </View>

                {(j.lesson_plan_detail?.topik_materi || j.lesson_plan_detail?.materi) && (
                  <View style={styles.materiBox}>
                    <Text style={styles.materiLabel}>Materi RPP:</Text>
                    <Text style={styles.materiContent}>
                      {j.lesson_plan_detail.topik_materi || j.lesson_plan_detail.materi}
                    </Text>
                  </View>
                )}

                {j.catatan_tambahan ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Catatan Guru:</Text>
                    <Text style={styles.notesContent}>{j.catatan_tambahan}</Text>
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
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
  },
  loadingContainer: {
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  mapelTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  pertemuanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  pertemuanBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pertemuanText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  attendanceText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  materiBox: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  materiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 2,
  },
  materiContent: {
    fontSize: 12,
    color: "#1E293B",
  },
  notesBox: {
    backgroundColor: "#FFFBEB",
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
    marginBottom: 2,
  },
  notesContent: {
    fontSize: 12,
    color: "#92400E",
  },
});
