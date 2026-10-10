// mobile/src/screens/Absensi/RekapAbsensiHarianScreen.tsx
// Rekap Kehadiran Harian — Role Wali Kelas
// Menghitung rekapitulasi kehadiran Hadir, Sakit, Izin, Alpha, Dispen dengan Filter Tanggal Interaktif

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  TrendingUp,
  Users,
  X,
  ChevronDown,
  CalendarDays,
  ArrowRight,
  Filter,
  Check,
  ChevronRight,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { apiClient } from "../../api/client";
import { SwipeBackContainer } from "../../components/ui/SwipeBackContainer";
import { Card } from "../../components/ui/Card";
import { DateRangePickerModal } from "../../components/ui/DateRangePickerModal";

interface KelasItem {
  kelas_id: number;
  nama_kelas: string;
}

interface SiswaItem {
  siswa_id: number;
  nama: string;
  nis?: string;
  nisn?: string;
}

interface StudentRekapRow {
  siswa_id: number;
  nama: string;
  nis?: string;
  nisn?: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  dispen: number;
  totalHari: number;
  persentase: number;
}

const formatDateId = (dateStr: string) => {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${parseInt(d, 10)} ${monthNames[parseInt(m, 10) - 1]} ${y}`;
};

export const RekapAbsensiHarianScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const firstDayOfMonthStr = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  }, []);

  // Filter States
  const [tanggalMulai, setTanggalMulai] = useState<string>(firstDayOfMonthStr);
  const [tanggalAkhir, setTanggalAkhir] = useState<string>(todayStr);
  const [activeDatePreset, setActiveDatePreset] = useState<string>("bulan_ini");

  // Modal Date Range Picker
  const [showDateModal, setShowDateModal] = useState<boolean>(false);
  const [tempTanggalMulai, setTempTanggalMulai] = useState<string>(firstDayOfMonthStr);
  const [tempTanggalAkhir, setTempTanggalAkhir] = useState<string>(todayStr);

  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null);

  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [rawAbsensiList, setRawAbsensiList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const pegawaiId = (user as any)?.pegawai?.pegawai_id || (user as any)?.pegawai_id;

  // 1. Fetch Daftar Kelas Wali
  const fetchKelasWali = useCallback(async () => {
    try {
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
      console.warn("Error fetching kelas wali:", err.message);
    }
  }, [pegawaiId, user]);

  // 2. Fetch Siswa & Data Absensi Harian pada rentang tanggal
  const fetchData = useCallback(async () => {
    if (!selectedKelasId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch siswa dalam kelas terpilih
      const resSiswa = await apiClient.get(`/siswa?kelas_id=${selectedKelasId}&limit=200`);
      const sData: SiswaItem[] = resSiswa.data?.data || resSiswa.data || [];
      setSiswaList(sData);

      if (sData.length === 0) {
        setRawAbsensiList([]);
        return;
      }

      const siswaIds = sData.map((s) => s.siswa_id).join(",");
      let allAbsensi: any[] = [];
      const recordMap = new Map<string, any>();

      // 1. Fetch via /absensi_harian?siswa_id=in.(...) & and=(tanggal.gte,tanggal.lte)
      try {
        const resWeb = await apiClient.get(
          `/absensi_harian?siswa_id=in.(${siswaIds})&and=(tanggal.gte.${tanggalMulai},tanggal.lte.${tanggalAkhir})&limit=1000`
        );
        const data = resWeb.data?.data || resWeb.data || [];
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            const key = `${item.siswa_id}_${item.tanggal}`;
            if (!recordMap.has(key)) recordMap.set(key, item);
          });
        }
      } catch (_) {}

      // 2. Fetch via /absensi_harian?siswa_id=in.(...)&tanggal=gte...&tanggal=lte...
      if (recordMap.size === 0) {
        try {
          const resWeb2 = await apiClient.get(
            `/absensi_harian?siswa_id=in.(${siswaIds})&tanggal=gte.${tanggalMulai}&tanggal=lte.${tanggalAkhir}&limit=1000`
          );
          const data2 = resWeb2.data?.data || resWeb2.data || [];
          if (Array.isArray(data2)) {
            data2.forEach((item: any) => {
              const key = `${item.siswa_id}_${item.tanggal}`;
              if (!recordMap.has(key)) recordMap.set(key, item);
            });
          }
        } catch (_) {}
      }

      // 3. Fallback via /kbm/absensi-harian
      if (recordMap.size === 0) {
        try {
          const resKbm = await apiClient.get(
            `/kbm/absensi-harian?kelas_id=${selectedKelasId}&tanggal_mulai=${tanggalMulai}&tanggal_akhir=${tanggalAkhir}`
          );
          const dataKbm = resKbm.data?.data || resKbm.data || [];
          if (Array.isArray(dataKbm)) {
            dataKbm.forEach((item: any) => {
              const key = `${item.siswa_id}_${item.tanggal}`;
              if (!recordMap.has(key)) recordMap.set(key, item);
            });
          }
        } catch (_) {}
      }

      // 4. Fallback broad date range filter
      if (recordMap.size === 0) {
        try {
          const resDirect = await apiClient.get(
            `/absensi_harian?and=(tanggal.gte.${tanggalMulai},tanggal.lte.${tanggalAkhir})&limit=1000`
          );
          const dataDirect = resDirect.data?.data || resDirect.data || [];
          if (Array.isArray(dataDirect)) {
            const allowedSiswaSet = new Set(sData.map((s) => s.siswa_id));
            dataDirect.forEach((item: any) => {
              if (allowedSiswaSet.has(item.siswa_id)) {
                const key = `${item.siswa_id}_${item.tanggal}`;
                if (!recordMap.has(key)) recordMap.set(key, item);
              }
            });
          }
        } catch (_) {}
      }

      setRawAbsensiList(Array.from(recordMap.values()));
    } catch (err: any) {
      console.warn("Gagal load data rekap:", err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedKelasId, tanggalMulai, tanggalAkhir]);

  useEffect(() => {
    fetchKelasWali();
  }, [fetchKelasWali]);

  useEffect(() => {
    if (selectedKelasId) {
      fetchData();
    }
  }, [selectedKelasId, tanggalMulai, tanggalAkhir, fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchKelasWali();
    if (selectedKelasId) {
      await fetchData();
    }
    setRefreshing(false);
  };

  // Quick Preset Helper
  const applyPresetDates = (preset: string) => {
    setActiveDatePreset(preset);
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    if (preset === "hari_ini") {
      setTempTanggalMulai(today);
      setTempTanggalAkhir(today);
    } else if (preset === "minggu_ini") {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      setTempTanggalMulai(past7.toISOString().split("T")[0]);
      setTempTanggalAkhir(today);
    } else if (preset === "bulan_ini") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      setTempTanggalMulai(firstDay);
      setTempTanggalAkhir(today);
    } else if (preset === "bulan_lalu") {
      const firstDayPast = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      const lastDayPast = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
      setTempTanggalMulai(firstDayPast);
      setTempTanggalAkhir(lastDayPast);
    } else if (preset === "30_hari") {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 29);
      setTempTanggalMulai(past30.toISOString().split("T")[0]);
      setTempTanggalAkhir(today);
    }
  };

  const handleOpenDateModal = () => {
    setTempTanggalMulai(tanggalMulai);
    setTempTanggalAkhir(tanggalAkhir);
    setShowDateModal(true);
  };

  const handleConfirmDateFilter = () => {
    if (tempTanggalMulai > tempTanggalAkhir) {
      Alert.alert("Tanggal Tidak Valid", "Tanggal mulai tidak boleh lebih besar dari tanggal akhir.");
      return;
    }
    setTanggalMulai(tempTanggalMulai);
    setTanggalAkhir(tempTanggalAkhir);
    setShowDateModal(false);
  };

  // Kalkulasi Rekap Siswa
  const rekapRows = useMemo<StudentRekapRow[]>(() => {
    if (siswaList.length === 0) return [];

    // Grouping absensi per siswa_id
    const statsMap = new Map<number, { hadir: number; sakit: number; izin: number; alpha: number; dispen: number }>();

    siswaList.forEach((s) => {
      statsMap.set(s.siswa_id, { hadir: 0, sakit: 0, izin: 0, alpha: 0, dispen: 0 });
    });

    rawAbsensiList.forEach((item: any) => {
      const stats = statsMap.get(item.siswa_id);
      if (stats) {
        const raw = (item.status || "").trim().toLowerCase();
        if (raw === "hadir") stats.hadir += 1;
        else if (raw === "sakit") stats.sakit += 1;
        else if (raw === "izin") stats.izin += 1;
        else if (raw === "alpha" || raw === "alfa") stats.alpha += 1;
        else if (raw === "dispen" || raw === "dispensasi") stats.dispen += 1;
      }
    });

    return siswaList.map((s) => {
      const st = statsMap.get(s.siswa_id) || { hadir: 0, sakit: 0, izin: 0, alpha: 0, dispen: 0 };
      const totalHari = st.hadir + st.sakit + st.izin + st.alpha + st.dispen;
      const persentase = totalHari > 0 ? Math.round((st.hadir / totalHari) * 100) : 100;

      return {
        siswa_id: s.siswa_id,
        nama: s.nama,
        nis: s.nis,
        nisn: s.nisn,
        hadir: st.hadir,
        sakit: st.sakit,
        izin: st.izin,
        alpha: st.alpha,
        dispen: st.dispen,
        totalHari,
        persentase,
      };
    });
  }, [siswaList, rawAbsensiList]);

  // Totals keseluruhan kelas
  const summaryTotals = useMemo(() => {
    let totHadir = 0;
    let totSakit = 0;
    let totIzin = 0;
    let totAlpha = 0;
    let totDispen = 0;
    let sumPersentase = 0;

    rekapRows.forEach((r) => {
      totHadir += r.hadir;
      totSakit += r.sakit;
      totIzin += r.izin;
      totAlpha += r.alpha;
      totDispen += r.dispen;
      sumPersentase += r.persentase;
    });

    const avgPersen = rekapRows.length > 0 ? Math.round(sumPersentase / rekapRows.length) : 100;
    return {
      totHadir,
      totSakit,
      totIzin,
      totAlpha,
      totDispen,
      avgPersen,
    };
  }, [rekapRows]);

  // Filtered rows by search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rekapRows;
    const q = searchQuery.toLowerCase();
    return rekapRows.filter(
      (r) =>
        r.nama.toLowerCase().includes(q) ||
        (r.nisn && r.nisn.toLowerCase().includes(q)) ||
        (r.nis && r.nis.toLowerCase().includes(q))
    );
  }, [rekapRows, searchQuery]);

  const currentKelas = useMemo(() => {
    return kelasList.find((k) => k.kelas_id === selectedKelasId);
  }, [kelasList, selectedKelasId]);

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
              <Text style={styles.headerTitle}>Rekap Kehadiran Harian</Text>
              <Text style={styles.headerSubtitle}>
                {currentKelas ? `Kelas ${currentKelas.nama_kelas}` : "Laporan Presensi Siswa"}
              </Text>
            </View>

            <View style={styles.headerRightBadge}>
              <FileText size={18} color="#93C5FD" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ─── SELECTOR KELAS (JIKA LEBIH DARI 1) ─── */}
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

      {/* ─── INTERACTIVE FILTER TANGGAL (BISA DI KLIK & DI SESUAIKAN) ─── */}
      <View style={styles.filterCard}>
        {/* Clickable Date Range Banner */}
        <TouchableOpacity
          style={styles.datePickerTrigger}
          onPress={handleOpenDateModal}
          activeOpacity={0.85}
        >
          <View style={styles.datePickerLeft}>
            <View style={styles.calIconCircle}>
              <CalendarDays size={18} color="#162E6E" />
            </View>
            <View>
              <Text style={styles.filterRangeLabel}>Rentang Waktu Rekapitulasi</Text>
              <Text style={styles.filterRangeVal}>
                {formatDateId(tanggalMulai)} — {formatDateId(tanggalAkhir)}
              </Text>
            </View>
          </View>

          <View style={styles.changeFilterBadge}>
            <Filter size={13} color="#1E40AF" />
            <Text style={styles.changeFilterText}>Ubah</Text>
          </View>
        </TouchableOpacity>

        {/* Search Bar Siswa */}
        <View style={styles.searchBar}>
          <Search size={15} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama atau NISN santri..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={15} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Menghitung rekapitulasi kehadiran...</Text>
          </View>
        ) : (
          <>
            {/* ─── SUMMARY STATS GRID ─── */}
            <View style={styles.statsSummaryGrid}>
              <View style={[styles.statBox, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}>
                <View style={styles.statHeaderRow}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <Text style={[styles.statNum, { color: "#16A34A" }]}>{summaryTotals.totHadir}</Text>
                </View>
                <Text style={styles.statLabel}>Hadir</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: "#FEFCE8", borderColor: "#FEF08A" }]}>
                <View style={styles.statHeaderRow}>
                  <Clock size={16} color="#CA8A04" />
                  <Text style={[styles.statNum, { color: "#CA8A04" }]}>{summaryTotals.totSakit}</Text>
                </View>
                <Text style={styles.statLabel}>Sakit</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
                <View style={styles.statHeaderRow}>
                  <AlertCircle size={16} color="#2563EB" />
                  <Text style={[styles.statNum, { color: "#2563EB" }]}>{summaryTotals.totIzin}</Text>
                </View>
                <Text style={styles.statLabel}>Izin</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
                <View style={styles.statHeaderRow}>
                  <XCircle size={16} color="#DC2626" />
                  <Text style={[styles.statNum, { color: "#DC2626" }]}>{summaryTotals.totAlpha}</Text>
                </View>
                <Text style={styles.statLabel}>Alpha</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: "#FAF5FF", borderColor: "#E9D5FF" }]}>
                <View style={styles.statHeaderRow}>
                  <TrendingUp size={16} color="#7C3AED" />
                  <Text style={[styles.statNum, { color: "#7C3AED" }]}>{summaryTotals.avgPersen}%</Text>
                </View>
                <Text style={styles.statLabel}>Rata-rata</Text>
              </View>
            </View>

            {/* ─── DAFTAR SISWA REKAP ─── */}
            <View style={styles.listContainer}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.listTitle}>
                  Hasil Rekap Siswa ({filteredRows.length} Anak)
                </Text>
                <Text style={styles.listSubtitle}>H / S / I / A / D</Text>
              </View>

              {filteredRows.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Users size={36} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>Data Tidak Ditemukan</Text>
                  <Text style={styles.emptySubtitle}>Tidak ada absensi atau siswa yang cocok dengan pencarian.</Text>
                </View>
              ) : (
                filteredRows.map((item, idx) => {
                  const healthColor =
                    item.persentase >= 90
                      ? "#16A34A"
                      : item.persentase >= 75
                      ? "#CA8A04"
                      : "#DC2626";

                  return (
                    <Card key={item.siswa_id} style={styles.studentCard}>
                      <View style={styles.studentTopRow}>
                        <View style={styles.studentAvatar}>
                          <Text style={styles.studentAvatarText}>{item.nama.charAt(0)}</Text>
                        </View>

                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.studentName} numberOfLines={1}>
                            {idx + 1}. {item.nama}
                          </Text>
                          <Text style={styles.studentMeta}>
                            NISN: {item.nisn || "-"} • Record Absen: {item.totalHari} Hari
                          </Text>
                        </View>

                        <View style={[styles.percentBadge, { borderColor: healthColor }]}>
                          <Text style={[styles.percentText, { color: healthColor }]}>
                            {item.persentase}%
                          </Text>
                        </View>
                      </View>

                      {/* Pill Status Grid */}
                      <View style={styles.chipsRow}>
                        <View style={[styles.chip, { backgroundColor: "#DCFCE7" }]}>
                          <Text style={[styles.chipText, { color: "#166534" }]}>Hadir: {item.hadir}</Text>
                        </View>
                        <View style={[styles.chip, { backgroundColor: "#FEF9C3" }]}>
                          <Text style={[styles.chipText, { color: "#854D0E" }]}>Sakit: {item.sakit}</Text>
                        </View>
                        <View style={[styles.chip, { backgroundColor: "#DBEAFE" }]}>
                          <Text style={[styles.chipText, { color: "#1E40AF" }]}>Izin: {item.izin}</Text>
                        </View>
                        <View style={[styles.chip, { backgroundColor: "#FEE2E2" }]}>
                          <Text style={[styles.chipText, { color: "#991B1B" }]}>Alpha: {item.alpha}</Text>
                        </View>
                        <View style={[styles.chip, { backgroundColor: "#EDE9FE" }]}>
                          <Text style={[styles.chipText, { color: "#5B21B6" }]}>Dispen: {item.dispen}</Text>
                        </View>
                      </View>

                      {/* Progress bar */}
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${Math.min(item.persentase, 100)}%`, backgroundColor: healthColor },
                          ]}
                        />
                      </View>
                    </Card>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* ─── MODAL FILTER RENTANG TANGGAL INTERAKTIF (KALENDER HP NATIVE) ─── */}
      <DateRangePickerModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        startDate={tanggalMulai}
        endDate={tanggalAkhir}
        onApply={(start, end) => {
          setTanggalMulai(start);
          setTanggalAkhir(end);
        }}
      />
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
  headerRightBadge: {
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
  filterCard: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 10,
  },
  datePickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  datePickerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  calIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  filterRangeLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  filterRangeVal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#162E6E",
    marginTop: 2,
  },
  changeFilterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeFilterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E40AF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: "#1E293B",
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
  statsSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: "18%",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  statHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statNum: {
    fontSize: 14,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  listContainer: {
    gap: 10,
  },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  listSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  studentTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  studentAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E40AF",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  studentMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  percentBadge: {
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  percentText: {
    fontSize: 12,
    fontWeight: "800",
  },
  chipsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 2,
    marginTop: 10,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  presetHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetGridBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  presetGridBtnActive: {
    backgroundColor: "#162E6E",
    borderColor: "#162E6E",
  },
  presetGridBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  presetGridBtnTextActive: {
    color: "#FFFFFF",
  },
  dateInputsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  dateInputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  dateInputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600",
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#162E6E",
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
