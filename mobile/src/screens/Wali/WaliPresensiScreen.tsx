// mobile/src/screens/Wali/WaliPresensiScreen.tsx
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
  CheckCircle2,
  Calendar,
  Clock,
  User,
  AlertCircle,
  FileText,
} from "lucide-react-native";
import { waliService } from "../../api/waliService";
import { SwipeBackContainer } from "../../components/ui/SwipeBackContainer";

const { width } = Dimensions.get("window");

const formatTanggal = (dateStr?: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const WaliPresensiScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialSiswaId = route.params?.siswaId || null;

  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(initialSiswaId);
  const [filterStatus, setFilterStatus] = useState<string>("Semua");
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

  const rekap = perkembangan?.presensi?.rekap30Hari;
  const totalHari = (rekap?.hadir || 0) + (rekap?.izin || 0) + (rekap?.sakit || 0) + (rekap?.alpa || 0);
  const persentaseHadir = totalHari > 0 ? Math.round(((rekap?.hadir || 0) / totalHari) * 100) : 100;
  const presensiHariIni = perkembangan?.presensi?.hariIni;

  const rawRiwayat = perkembangan?.presensi?.riwayat || [];

  const filteredRiwayat = useMemo(() => {
    if (filterStatus === "Semua") return rawRiwayat;
    return rawRiwayat.filter((item: any) => {
      if (filterStatus === "Hadir") return item.status === "Hadir" || item.status === "H";
      if (filterStatus === "Izin") return item.status === "Izin" || item.status === "I";
      if (filterStatus === "Sakit") return item.status === "Sakit" || item.status === "S";
      if (filterStatus === "Alpa") return item.status === "Alpa" || item.status === "A" || item.status === "Tanpa Keterangan";
      return true;
    });
  }, [rawRiwayat, filterStatus]);

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
              <Text style={styles.headerTitle}>Presensi Santri</Text>
              <Text style={styles.headerSubtitle}>
                Rekapitulasi & Riwayat Kehadiran
              </Text>
            </View>

            <View style={styles.headerRightBadge}>
              <CheckCircle2 size={18} color="#86EFAC" />
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
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>Aktif</Text>
          </View>
        </View>

        {/* Status Presensi Hari Ini Hero Card */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Clock size={16} color="#93C5FD" />
              <Text style={styles.todayLabel}>Presensi Hari Ini</Text>
            </View>
            <View
              style={[
                styles.todayStatusBadge,
                presensiHariIni
                  ? { backgroundColor: "#10B981" }
                  : { backgroundColor: "#F59E0B" },
              ]}
            >
              <Text style={styles.todayStatusBadgeText}>
                {presensiHariIni?.status || "Belum Absen"}
              </Text>
            </View>
          </View>

          <Text style={styles.todayTitle}>
            {presensiHariIni
              ? `Status: ${presensiHariIni.status} (${presensiHariIni.jam_masuk || "Tercatat"})`
              : "Santri belum melakukan presensi masuk kelas hari ini."}
          </Text>
          {presensiHariIni?.keterangan && (
            <Text style={styles.todaySub}>Keterangan: {presensiHariIni.keterangan}</Text>
          )}
        </View>

        {/* 4 Statistik Cards */}
        <View style={styles.statsGrid}>
          {/* Hadir */}
          <View style={[styles.statCard, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}>
            <Text style={[styles.statVal, { color: "#16A34A" }]}>{rekap?.hadir || 0}</Text>
            <Text style={styles.statLabel}>Hadir</Text>
          </View>

          {/* Izin */}
          <View style={[styles.statCard, { backgroundColor: "#FEF9C3", borderColor: "#FDE047" }]}>
            <Text style={[styles.statVal, { color: "#B45309" }]}>{rekap?.izin || 0}</Text>
            <Text style={styles.statLabel}>Izin</Text>
          </View>

          {/* Sakit */}
          <View style={[styles.statCard, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
            <Text style={[styles.statVal, { color: "#2563EB" }]}>{rekap?.sakit || 0}</Text>
            <Text style={styles.statLabel}>Sakit</Text>
          </View>

          {/* Alpa */}
          <View style={[styles.statCard, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
            <Text style={[styles.statVal, { color: "#DC2626" }]}>{rekap?.alpa || 0}</Text>
            <Text style={styles.statLabel}>Alpa</Text>
          </View>
        </View>

        {/* Persentase Card */}
        <View style={styles.rateCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rateLabel}>Tingkat Kehadiran 30 Hari Terakhir</Text>
            <Text style={styles.rateSub}>Dari total {totalHari} hari efektif belajar</Text>
          </View>
          <Text style={styles.rateVal}>{persentaseHadir}%</Text>
        </View>

        {/* Filter Tab Status */}
        <View style={styles.filterRow}>
          {["Semua", "Hadir", "Izin", "Sakit", "Alpa"].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.filterPill, filterStatus === st && styles.filterPillActive]}
              onPress={() => setFilterStatus(st)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, filterStatus === st && styles.filterPillTextActive]}>
                {st}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Riwayat Kehadiran Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Riwayat Presensi ({filteredRiwayat.length})
          </Text>
        </View>

        {/* List Riwayat */}
        {filteredRiwayat.length > 0 ? (
          filteredRiwayat.map((item: any, idx: number) => {
            const isHadir = item.status === "Hadir" || item.status === "H";
            const isIzin = item.status === "Izin" || item.status === "I";
            const isSakit = item.status === "Sakit" || item.status === "S";

            return (
              <View key={item.absensi_id || idx} style={styles.historyCard}>
                <View style={styles.historyTopRow}>
                  <Text style={styles.historyDate}>{formatTanggal(item.tanggal)}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isHadir
                        ? { backgroundColor: "#DCFCE7" }
                        : isIzin
                        ? { backgroundColor: "#FEF9C3" }
                        : isSakit
                        ? { backgroundColor: "#EFF6FF" }
                        : { backgroundColor: "#FEE2E2" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isHadir
                          ? { color: "#16A34A" }
                          : isIzin
                          ? { color: "#B45309" }
                          : isSakit
                          ? { color: "#2563EB" }
                          : { color: "#DC2626" },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.historyKeterangan}>
                  {item.keterangan || "Presensi KBM Harian Santri"}
                </Text>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Calendar size={36} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Belum Ada Catatan Presensi</Text>
            <Text style={styles.emptySub}>
              Data presensi santri belum tersedia untuk filter yang dipilih.
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
  statusPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    color: "#16A34A",
    fontSize: 10.5,
    fontWeight: "700",
  },
  todayCard: {
    backgroundColor: "#162E6E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  todayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  todayLabel: {
    color: "#93C5FD",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  todayStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayStatusBadgeText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "800",
  },
  todayTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  todaySub: {
    color: "#BFDBFE",
    fontSize: 11,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  statVal: {
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  rateCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  rateLabel: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  rateSub: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
  rateVal: {
    color: "#16A34A",
    fontSize: 24,
    fontWeight: "900",
  },
  filterRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterPillActive: {
    backgroundColor: "#162E6E",
    borderColor: "#162E6E",
  },
  filterPillText: {
    color: "#64748B",
    fontSize: 11.5,
    fontWeight: "600",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  historyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  historyDate: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
  },
  historyKeterangan: {
    color: "#64748B",
    fontSize: 11.5,
    marginTop: 2,
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
  },
});
