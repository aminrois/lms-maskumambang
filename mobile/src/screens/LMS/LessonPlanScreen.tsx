// mobile/src/screens/LMS/LessonPlanScreen.tsx
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {
  BookMarked,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  GraduationCap,
  Layers,
  Calendar,
  Sparkles,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { absensiService, LessonPlanItem } from "../../api/absensiService";
import { isLessonPlanApproved } from "../../utils/jadwalHelper";

export const LessonPlanScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lessonPlanList, setLessonPlanList] = useState<LessonPlanItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "approved" | "pending">("all");
  const [expandedPlans, setExpandedPlans] = useState<Record<number, boolean>>({});

  const teacherPegawaiId = user?.pegawai?.pegawai_id;

  const fetchLessonPlans = useCallback(async () => {
    if (!teacherPegawaiId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await absensiService.getLessonPlans({ pegawai_id: teacherPegawaiId });
      setLessonPlanList(data || []);
    } catch (err) {
      console.warn("Error fetching Lesson Plans:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacherPegawaiId]);

  useEffect(() => {
    if (isFocused) {
      fetchLessonPlans();
    }
  }, [isFocused, fetchLessonPlans]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLessonPlans();
  };

  const toggleExpand = (planId: number) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = lessonPlanList.length;
    let approved = 0;
    let pending = 0;

    lessonPlanList.forEach((lp) => {
      if (isLessonPlanApproved(lp)) {
        approved++;
      } else {
        pending++;
      }
    });

    return { total, approved, pending };
  }, [lessonPlanList]);

  // Filtered list
  const filteredList = useMemo(() => {
    return lessonPlanList.filter((lp) => {
      const title = (lp.judul_rpp || "").toLowerCase();
      const mapel = (lp.jadwal?.mapel?.nama_mapel || "").toLowerCase();
      const kelas = (lp.jadwal?.kelas?.nama_kelas || "").toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || title.includes(query) || mapel.includes(query) || kelas.includes(query);

      const isApproved = isLessonPlanApproved(lp);
      if (selectedFilter === "approved") {
        return matchesSearch && isApproved;
      }
      if (selectedFilter === "pending") {
        return matchesSearch && !isApproved;
      }
      return matchesSearch;
    });
  }, [lessonPlanList, searchQuery, selectedFilter]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Lesson Plan"
        subtitle="Rencana Pelaksanaan Pembelajaran (RPP)"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header Metrics Card */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <View style={[styles.statIconBadge, { backgroundColor: "#EFF6FF" }]}>
              <BookMarked size={16} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total RPP</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <View style={[styles.statIconBadge, { backgroundColor: "#ECFDF5" }]}>
              <CheckCircle2 size={16} color="#059669" />
            </View>
            <Text style={[styles.statValue, { color: "#059669" }]}>{stats.approved}</Text>
            <Text style={styles.statLabel}>Disetujui</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <View style={[styles.statIconBadge, { backgroundColor: "#FFFBEB" }]}>
              <Clock size={16} color="#D97706" />
            </View>
            <Text style={[styles.statValue, { color: "#D97706" }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Menunggu</Text>
          </View>
        </View>

        {/* 2. Search & Filter Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari judul RPP, mapel, atau kelas..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterChipsRow}>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === "all" && styles.filterChipActive]}
              onPress={() => setSelectedFilter("all")}
            >
              <Text style={[styles.filterChipText, selectedFilter === "all" && styles.filterChipTextActive]}>
                Semua ({stats.total})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === "approved" && styles.filterChipActive]}
              onPress={() => setSelectedFilter("approved")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === "approved" && styles.filterChipTextActive,
                ]}
              >
                Disetujui ({stats.approved})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === "pending" && styles.filterChipActive]}
              onPress={() => setSelectedFilter("pending")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === "pending" && styles.filterChipTextActive,
                ]}
              >
                Menunggu ({stats.pending})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. List of Lesson Plans */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat data Lesson Plan...</Text>
          </View>
        ) : filteredList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <BookMarked size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Tidak Ada Lesson Plan</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Tidak ditemukan Lesson Plan yang cocok dengan kata kunci pencarian Anda."
                : "Anda belum memiliki Lesson Plan yang tersimpan."}
            </Text>
          </Card>
        ) : (
          filteredList.map((rpp) => {
            const isApproved = isLessonPlanApproved(rpp);
            const isExpanded = !!expandedPlans[rpp.lesson_plan_id];
            const isKepsekApproved = rpp.status_verifikasi_kepsek === "Disetujui";
            const isDirekturApproved = rpp.status_verifikasi_direktur === "Disetujui";
            const detailsCount = rpp.details?.length || 0;

            return (
              <Card key={rpp.lesson_plan_id} style={styles.rppCard}>
                {/* Header Card */}
                <View style={styles.rppCardHeader}>
                  <View style={styles.rppHeaderLeft}>
                    <View style={styles.rppBadgeWrap}>
                      <Badge
                        label={`Kelas ${rpp.jadwal?.kelas?.nama_kelas || "-"}`}
                        variant="primary"
                        size="sm"
                      />
                      {isApproved ? (
                        <Badge label="Approved" variant="success" size="sm" />
                      ) : (
                        <Badge label="Menunggu Verifikasi" variant="warning" size="sm" />
                      )}
                    </View>
                    <Text style={styles.rppTitle}>{rpp.judul_rpp}</Text>
                    <Text style={styles.rppMapelName}>
                      {rpp.jadwal?.mapel?.nama_mapel || "Mata Pelajaran"}
                    </Text>
                  </View>
                </View>

                {/* Status Verifikasi Row */}
                <View style={styles.verifBox}>
                  <View style={styles.verifItem}>
                    <Text style={styles.verifLabel}>Verifikasi Kepala Sekolah:</Text>
                    <Badge
                      label={rpp.status_verifikasi_kepsek || "Menunggu"}
                      variant={isKepsekApproved ? "success" : "warning"}
                      size="sm"
                    />
                  </View>

                  <View style={styles.verifItem}>
                    <Text style={styles.verifLabel}>Verifikasi Direktur:</Text>
                    <Badge
                      label={rpp.status_verifikasi_direktur || "Menunggu"}
                      variant={isDirekturApproved ? "success" : "warning"}
                      size="sm"
                    />
                  </View>
                </View>

                {/* Action Toggle Detail Pertemuan */}
                {detailsCount > 0 && (
                  <TouchableOpacity
                    style={styles.toggleDetailsBtn}
                    onPress={() => toggleExpand(rpp.lesson_plan_id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.toggleDetailsLeft}>
                      <FileText size={15} color="#2563EB" />
                      <Text style={styles.toggleDetailsText}>
                        {detailsCount} Pertemuan Terdaftar
                      </Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={16} color="#64748B" />
                    ) : (
                      <ChevronDown size={16} color="#64748B" />
                    )}
                  </TouchableOpacity>
                )}

                {/* Expanded Details List */}
                {isExpanded && rpp.details && rpp.details.length > 0 && (
                  <View style={styles.detailsListContainer}>
                    {rpp.details.map((d) => (
                      <View key={d.detail_id} style={styles.detailCard}>
                        <View style={styles.detailHeaderRow}>
                          <View style={styles.pertemuanBadge}>
                            <Text style={styles.pertemuanBadgeText}>
                              Pertemuan {d.pertemuan_ke}
                            </Text>
                          </View>
                          {d.status_verifikasi_kepsek === "Disetujui" && (
                            <Badge label="Valid" variant="success" size="sm" />
                          )}
                        </View>
                        <Text style={styles.detailMateriTitle}>
                          {d.topik_materi || d.materi || "Materi Pembelajaran"}
                        </Text>
                        {d.rencana_pelaksanaan_kbm && (
                          <Text style={styles.detailRencanaText} numberOfLines={2}>
                            {d.rencana_pelaksanaan_kbm}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
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
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#E2E8F0",
  },
  searchSection: {
    marginBottom: 16,
    gap: 10,
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
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
  },
  filterChipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
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
  rppCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  rppCardHeader: {
    marginBottom: 12,
  },
  rppHeaderLeft: {
    flex: 1,
  },
  rppBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  rppTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 20,
  },
  rppMapelName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: 2,
  },
  verifBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 8,
    marginBottom: 10,
  },
  verifItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verifLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#475569",
  },
  toggleDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  toggleDetailsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toggleDetailsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  detailsListContainer: {
    marginTop: 10,
    gap: 8,
  },
  detailCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  detailHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  pertemuanBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pertemuanBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3730A3",
  },
  detailMateriTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 2,
  },
  detailRencanaText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 15,
  },
});
