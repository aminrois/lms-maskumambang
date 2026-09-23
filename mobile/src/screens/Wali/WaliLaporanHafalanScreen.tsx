// mobile/src/screens/Wali/WaliLaporanHafalanScreen.tsx
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
  BookOpen,
  ScrollText,
  Award,
  Sparkles,
  Calendar,
  CheckCircle2,
  Filter,
  User,
  Info,
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

export const WaliLaporanHafalanScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialSiswaId = route.params?.siswaId || null;

  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(initialSiswaId);
  const [filterKategori, setFilterKategori] = useState<string>("Semua");
  const [filterJenis, setFilterJenis] = useState<string>("Semua");
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

  const totalSetoran = perkembangan?.tahfidz?.summary?.totalSetoran || 0;
  const totalJuz = perkembangan?.tahfidz?.summary?.totalJuzZiyadah || 0;
  const totalHadits = perkembangan?.tahfidz?.summary?.totalHaditsZiyadah || 0;
  const totalBait = perkembangan?.tahfidz?.summary?.totalBaitZiyadah || 0;
  const targetNominal = perkembangan?.tahfidz?.targetAktif?.target_nominal || 30;
  const targetSatuan = perkembangan?.tahfidz?.targetAktif?.satuan || "Juz";
  const targetPercent = Math.min(100, Math.round((totalJuz / targetNominal) * 100)) || 0;

  const rawSetoranList = perkembangan?.tahfidz?.recentSetoran || activeAnak?.tahfidz_setoran || [];

  // Filtered List
  const filteredList = useMemo(() => {
    return rawSetoranList.filter((item: any) => {
      const matchKategori =
        filterKategori === "Semua" || item.kategori === filterKategori;
      const matchJenis =
        filterJenis === "Semua" ||
        (item.jenis_hafalan || "Setoran Baru") === filterJenis;
      return matchKategori && matchJenis;
    });
  }, [rawSetoranList, filterKategori, filterJenis]);

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
              <Text style={styles.headerTitle}>Laporan Hafalan</Text>
              <Text style={styles.headerSubtitle}>
                Tahfidz & Ujian Santri Maskumambang
              </Text>
            </View>

            <View style={styles.headerRightBadge}>
              <ScrollText size={18} color="#93C5FD" />
            </View>
          </View>

          {/* Santri Switcher Strip jika > 1 anak */}
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
              Kelas {activeAnak?.kelas?.nama_kelas || "-"} • NIS: {activeAnak?.nis || "-"}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>Aktif</Text>
          </View>
        </View>

        {/* 4 Statistik Cards */}
        <View style={styles.statsGrid}>
          {/* Card 1: Total Juz */}
          <View style={[styles.statCard, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
            <View style={styles.statIconCircle}>
              <BookOpen size={16} color="#1D4ED8" />
            </View>
            <Text style={styles.statVal}>{totalJuz}</Text>
            <Text style={styles.statLabel}>Juz Al-Qur'an</Text>
          </View>

          {/* Card 2: Total Hadits */}
          <View style={[styles.statCard, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}>
            <View style={[styles.statIconCircle, { backgroundColor: "#DCFCE7" }]}>
              <Award size={16} color="#15803D" />
            </View>
            <Text style={[styles.statVal, { color: "#15803D" }]}>{totalHadits}</Text>
            <Text style={styles.statLabel}>Hadits Selesai</Text>
          </View>

          {/* Card 3: Total Bait */}
          <View style={[styles.statCard, { backgroundColor: "#FAF5FF", borderColor: "#E9D5FF" }]}>
            <View style={[styles.statIconCircle, { backgroundColor: "#F3E8FF" }]}>
              <Sparkles size={16} color="#7E22CE" />
            </View>
            <Text style={[styles.statVal, { color: "#7E22CE" }]}>{totalBait}</Text>
            <Text style={styles.statLabel}>Bait Matan</Text>
          </View>

          {/* Card 4: Total Setoran */}
          <View style={[styles.statCard, { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }]}>
            <View style={[styles.statIconCircle, { backgroundColor: "#FEF3C7" }]}>
              <ScrollText size={16} color="#B45309" />
            </View>
            <Text style={[styles.statVal, { color: "#B45309" }]}>{totalSetoran}</Text>
            <Text style={styles.statLabel}>Total Setoran</Text>
          </View>
        </View>

        {/* Target Card Hero */}
        <View style={styles.targetCard}>
          <View style={styles.targetHeader}>
            <View>
              <Text style={styles.targetLabel}>Target Hafalan Santri</Text>
              <Text style={styles.targetTitle}>
                {targetNominal} {targetSatuan} ({perkembangan?.tahfidz?.targetAktif?.target_deskripsi || "Al-Qur'anul Karim"})
              </Text>
            </View>
            <View style={styles.targetBadge}>
              <Text style={styles.targetBadgeText}>
                {perkembangan?.tahfidz?.targetAktif?.status || "Aktif"}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressFill, { width: `${targetPercent}%` }]} />
          </View>

          <View style={styles.progressFooter}>
            <Text style={styles.progressFooterText}>
              Pencapaian: <Text style={{ fontWeight: "800", color: "#1E3A8A" }}>{totalJuz} Juz</Text> ({targetPercent}%)
            </Text>
            <Text style={styles.progressFooterText}>
              Sisa: <Text style={{ fontWeight: "800", color: "#64748B" }}>{Math.max(0, targetNominal - totalJuz)} Juz</Text>
            </Text>
          </View>
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Kategori Hafalan:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {["Semua", "Al-Quran", "Hadits", "Matan Ilmu"].map((kat) => (
              <TouchableOpacity
                key={kat}
                style={[
                  styles.filterPill,
                  filterKategori === kat && styles.filterPillActive,
                ]}
                onPress={() => setFilterKategori(kat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filterKategori === kat && styles.filterPillTextActive,
                  ]}
                >
                  {kat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.filterSectionTitle, { marginTop: 12 }]}>Jenis Setoran:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {["Semua", "Setoran Baru", "Setoran Ulang", "Ujian"].map((jenis) => (
              <TouchableOpacity
                key={jenis}
                style={[
                  styles.filterPill,
                  filterJenis === jenis && styles.filterPillActive,
                ]}
                onPress={() => setFilterJenis(jenis)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filterJenis === jenis && styles.filterPillTextActive,
                  ]}
                >
                  {jenis}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Riwayat Setoran Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Riwayat Setoran ({filteredList.length})
          </Text>
        </View>

        {/* Riwayat List */}
        {filteredList.length > 0 ? (
          filteredList.map((setoran: any, idx: number) => {
            const jenisText = setoran.jenis_hafalan || "Setoran Baru";
            const isSetoranBaru = jenisText === "Setoran Baru";
            const isUjian = jenisText === "Ujian";

            return (
              <View key={setoran.setoran_id || idx} style={styles.setoranCard}>
                <View style={styles.setoranTopRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View
                      style={[
                        styles.jenisBadge,
                        isSetoranBaru
                          ? { backgroundColor: "#DCFCE7" }
                          : isUjian
                          ? { backgroundColor: "#F3E8FF" }
                          : { backgroundColor: "#DBEAFE" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.jenisBadgeText,
                          isSetoranBaru
                            ? { color: "#15803D" }
                            : isUjian
                            ? { color: "#7E22CE" }
                            : { color: "#1D4ED8" },
                        ]}
                      >
                        {jenisText}
                      </Text>
                    </View>
                    <Text style={styles.kategoriBadge}>{setoran.kategori || "Al-Quran"}</Text>
                  </View>

                  <View
                    style={[
                      styles.kelancaranBadge,
                      setoran.kelancaran === "Sangat Lancar"
                        ? { backgroundColor: "#DCFCE7" }
                        : setoran.kelancaran === "Lancar"
                        ? { backgroundColor: "#EFF6FF" }
                        : { backgroundColor: "#FEF3C7" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.kelancaranBadgeText,
                        setoran.kelancaran === "Sangat Lancar"
                          ? { color: "#16A34A" }
                          : setoran.kelancaran === "Lancar"
                          ? { color: "#2563EB" }
                          : { color: "#D97706" },
                      ]}
                    >
                      {setoran.kelancaran || "Lancar"}
                    </Text>
                  </View>
                </View>

                {/* Surat & Ayat / Judul */}
                <Text style={styles.suratTitle}>
                  {setoran.surat_mulai_nama || "Al-Qur'an"}
                  {setoran.ayat_mulai ? ` : Ayat ${setoran.ayat_mulai} – ${setoran.ayat_selesai || setoran.ayat_mulai}` : ""}
                </Text>

                {/* Meta Info */}
                <View style={styles.setoranMetaRow}>
                  <Text style={styles.setoranDate}>
                    📅 {formatTanggal(setoran.tanggal)}
                  </Text>
                  <Text style={styles.setoranTeacher}>
                    👤 {setoran.pegawai?.nama || "Pembina Tahfidz"}
                  </Text>
                </View>

                {/* Catatan Guru */}
                {setoran.catatan_guru ? (
                  <View style={styles.catatanBox}>
                    <Text style={styles.catatanText}>
                      💬 "{setoran.catatan_guru}"
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <ScrollText size={36} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Belum Ada Riwayat Setoran</Text>
            <Text style={styles.emptySub}>
              Tidak ditemukan data setoran untuk kategori atau filter yang dipilih.
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
    letterSpacing: 0.3,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    width: (width - 32 - 8) / 2,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  statIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statVal: {
    color: "#1D4ED8",
    fontSize: 18,
    fontWeight: "900",
  },
  statLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  targetCard: {
    backgroundColor: "#162E6E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#162E6E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  targetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  targetLabel: {
    color: "#93C5FD",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  targetTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  targetBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  targetBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  progressContainer: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#38BDF8",
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressFooterText: {
    color: "#E2E8F0",
    fontSize: 11.5,
  },
  filterSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  filterSectionTitle: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterScroll: {
    marginBottom: 4,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 6,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  setoranCard: {
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
  setoranTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  jenisBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  jenisBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  kategoriBadge: {
    color: "#64748B",
    fontSize: 10.5,
    fontWeight: "600",
  },
  kelancaranBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  kelancaranBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  suratTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  setoranMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  setoranDate: {
    color: "#64748B",
    fontSize: 11,
  },
  setoranTeacher: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "500",
  },
  catatanBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  catatanText: {
    color: "#334155",
    fontSize: 11,
    fontStyle: "italic",
    lineHeight: 16,
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
