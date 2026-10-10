// mobile/src/screens/Monitoring/MonitoringKbmScreen.tsx
import React, { useState, useEffect } from "react";
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
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Users,
  Shield,
  Award,
  ArrowLeft,
  FileText,
  AlertCircle,
  Building,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/useAuthStore";
import { monitoringService, KbmMonitoringItem } from "../../api/monitoringService";
import { Colors } from "../../constants/colors";

export const MonitoringKbmScreen = () => {
  const navigation = useNavigation<any>();
  const { activeRole } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"kbm" | "rpp">("kbm");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [kbmList, setKbmList] = useState<KbmMonitoringItem[]>([]);
  const [rppData, setRppData] = useState<any>({});

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    try {
      setLoading(true);
      const lembagaId = activeRole?.lembaga_id || undefined;

      const [kbmRes, rppRes] = await Promise.all([
        monitoringService.getKbmMonitoring({
          p_lembaga_id: lembagaId,
          p_tanggal_mulai: todayStr,
          p_tanggal_akhir: todayStr,
        }),
        monitoringService.getLessonPlanRekap({
          lembaga_id: lembagaId,
        }),
      ]);

      setKbmList(kbmRes);
      setRppData(rppRes);
    } catch (err) {
      console.warn("Error fetching monitoring data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeRole]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const roleName = activeRole?.nama_role || "Pimpinan";
  const lembagaLabel = activeRole?.lembaga?.singkatan || activeRole?.lembaga?.nama_lembaga || "Semua Lembaga";

  const totalSesi = kbmList.length;
  const guruListRpp: any[] = rppData?.data || rppData?.pegawai || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Monitoring & Supervisi</Text>
          <Text style={styles.headerSubtitle}>
            {roleName} • {lembagaLabel}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "kbm" && styles.tabButtonActive]}
          onPress={() => setActiveTab("kbm")}
          activeOpacity={0.8}
        >
          <BarChart3
            size={16}
            color={activeTab === "kbm" ? "#1D4ED8" : "#64748B"}
          />
          <Text
            style={[styles.tabText, activeTab === "kbm" && styles.tabTextActive]}
          >
            Aktivitas KBM Hari Ini
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "rpp" && styles.tabButtonActive]}
          onPress={() => setActiveTab("rpp")}
          activeOpacity={0.8}
        >
          <FileText
            size={16}
            color={activeTab === "rpp" ? "#1D4ED8" : "#64748B"}
          />
          <Text
            style={[styles.tabText, activeTab === "rpp" && styles.tabTextActive]}
          >
            Rekap Lesson Plan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1D4ED8"]} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="small" color="#1D4ED8" />
            <Text style={styles.loaderText}>Memuat data supervisi...</Text>
          </View>
        ) : activeTab === "kbm" ? (
          /* TAB 1: AKTIVITAS KBM */
          <View style={styles.tabSection}>
            {/* Stat Summary Box */}
            <View style={styles.statBox}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{totalSesi}</Text>
                <Text style={styles.statLabel}>Sesi KBM Terdata</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: "#059669" }]}>
                  {kbmList.filter((k) => (k.absensi_pelajaran?.length || 0) > 0).length}
                </Text>
                <Text style={styles.statLabel}>Sudah Diabsen</Text>
              </View>
            </View>

            {/* List KBM Sessions */}
            <Text style={styles.sectionHeading}>Jurnal & Sesi KBM Hari Ini</Text>
            {kbmList.length === 0 ? (
              <View style={styles.emptyCard}>
                <AlertCircle size={32} color="#94A3B8" />
                <Text style={styles.emptyTitle}>Belum Ada Aktivitas KBM</Text>
                <Text style={styles.emptyDesc}>
                  Belum ada jurnal atau sesi KBM yang tercatat untuk hari ini ({todayStr}).
                </Text>
              </View>
            ) : (
              kbmList.map((item, idx) => {
                const mapelName = item.jadwal?.mapel?.nama_mapel || "Mata Pelajaran";
                const kelasName = item.jadwal?.kelas?.nama_kelas || "Kelas";
                const guruName = item.jadwal?.pegawai?.nama || "Guru Pengajar";
                const materi = item.lesson_plan_detail?.materi || "Materi harian diajarkan";
                const jmlSiswaAbsen = item.absensi_pelajaran?.length || 0;

                return (
                  <View key={item.jurnal_id || idx} style={styles.kbmCard}>
                    <View style={styles.kbmCardTop}>
                      <View style={styles.badgeKelas}>
                        <Text style={styles.badgeKelasText}>{kelasName}</Text>
                      </View>
                      <View style={styles.badgeMapel}>
                        <Text style={styles.badgeMapelText}>{mapelName}</Text>
                      </View>
                    </View>

                    <Text style={styles.kbmGuruText}>👤 {guruName}</Text>
                    <Text style={styles.kbmMateriText}>📖 {materi}</Text>

                    <View style={styles.kbmCardBottom}>
                      <View style={styles.kbmAbsenBadge}>
                        <CheckCircle2 size={13} color="#059669" />
                        <Text style={styles.kbmAbsenText}>
                          {jmlSiswaAbsen > 0 ? `${jmlSiswaAbsen} santri diabsen` : "Belum absen"}
                        </Text>
                      </View>
                      <Text style={styles.kbmTanggalText}>Hari ini</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* TAB 2: REKAP LESSON PLAN */
          <View style={styles.tabSection}>
            <View style={styles.infoBanner}>
              <Award size={18} color="#1D4ED8" />
              <Text style={styles.infoBannerText}>
                Supervisi kepatuhan administrasi RPP & Lesson Plan guru pengajar.
              </Text>
            </View>

            <Text style={styles.sectionHeading}>Daftar Lesson Plan Guru</Text>
            {guruListRpp.length === 0 ? (
              <View style={styles.emptyCard}>
                <FileText size={32} color="#94A3B8" />
                <Text style={styles.emptyTitle}>Data Lesson Plan Kosong</Text>
                <Text style={styles.emptyDesc}>
                  Belum ada data lesson plan yang tercatat di sistem untuk lembaga ini.
                </Text>
              </View>
            ) : (
              guruListRpp.map((guru, idx) => (
                <View key={guru.pegawai_id || idx} style={styles.rppCard}>
                  <View style={styles.rppCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rppGuruNama}>{guru.nama || "Guru"}</Text>
                      <Text style={styles.rppGuruNig}>NIG: {guru.nig || "-"}</Text>
                    </View>
                    <View style={styles.rppBadgeLembaga}>
                      <Text style={styles.rppBadgeLembagaText}>
                        {guru.pegawai_lembaga?.[0]?.lembaga?.singkatan || "Aktif"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rppMetricsRow}>
                    <View style={styles.rppMetricItem}>
                      <Text style={styles.rppMetricNum}>{guru.lesson_plans?.length || 0}</Text>
                      <Text style={styles.rppMetricLabel}>Total RPP</Text>
                    </View>
                    <View style={styles.rppMetricDivider} />
                    <View style={styles.rppMetricItem}>
                      <Text style={[styles.rppMetricNum, { color: "#059669" }]}>
                        {guru.lesson_plans?.filter((lp: any) => lp.status_verifikasi_kepsek === "Disetujui").length || 0}
                      </Text>
                      <Text style={styles.rppMetricLabel}>Disetujui Kepsek</Text>
                    </View>
                    <View style={styles.rppMetricDivider} />
                    <View style={styles.rppMetricItem}>
                      <Text style={[styles.rppMetricNum, { color: "#2563EB" }]}>
                        {guru.lesson_plans?.filter((lp: any) => lp.status_verifikasi_direktur === "Disetujui").length || 0}
                      </Text>
                      <Text style={styles.rppMetricLabel}>Disetujui Direktur</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#162E6E",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#162E6E",
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#FACC15",
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabButtonActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#1D4ED8",
  },
  content: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabSection: {
    paddingBottom: 36,
  },
  loaderBox: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loaderText: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748B",
  },
  statBox: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
  },
  statNum: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E293B",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1E293B",
    marginTop: 10,
  },
  emptyDesc: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
  kbmCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  kbmCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  badgeKelas: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  badgeKelasText: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "bold",
  },
  badgeMapel: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeMapelText: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "600",
  },
  kbmGuruText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 4,
  },
  kbmMateriText: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 10,
  },
  kbmCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  kbmAbsenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  kbmAbsenText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  kbmTanggalText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    gap: 8,
  },
  infoBannerText: {
    fontSize: 12,
    color: "#1D4ED8",
    flex: 1,
    lineHeight: 16,
  },
  rppCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rppCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  rppGuruNama: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F172A",
  },
  rppGuruNig: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  rppBadgeLembaga: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rppBadgeLembagaText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#475569",
  },
  rppMetricsRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  rppMetricItem: {
    flex: 1,
    alignItems: "center",
  },
  rppMetricDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
  },
  rppMetricNum: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1E293B",
  },
  rppMetricLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
});
