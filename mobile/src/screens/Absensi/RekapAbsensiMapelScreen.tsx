// mobile/src/screens/Absensi/RekapAbsensiMapelScreen.tsx
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
import { useNavigation, useIsFocused, useRoute } from "@react-navigation/native";
import {
  Users,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileText,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Layers,
  BookOpen,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { jadwalService, JadwalItem } from "../../api/jadwalService";
import {
  absensiService,
  SiswaItem,
  JurnalMengajarItem,
} from "../../api/absensiService";

interface KelasOption {
  kelas_id: number;
  nama_kelas: string;
  mapelNames: string[];
}

export const RekapAbsensiMapelScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const { user } = useAuthStore();

  const teacherPegawaiId = user?.pegawai?.pegawai_id;

  // Step state: 'select_kelas' | 'display_results'
  const [step, setStep] = useState<"select_kelas" | "display_results">("select_kelas");
  const [selectedKelas, setSelectedKelas] = useState<KelasOption | null>(null);

  // Filter states
  const today = useMemo(() => new Date(), []);
  const firstDayOfMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );
  const formatDateStr = (d: Date) => d.toISOString().split("T")[0];

  const [tanggalMulai, setTanggalMulai] = useState<string>(formatDateStr(firstDayOfMonth));
  const [tanggalAkhir, setTanggalAkhir] = useState<string>(formatDateStr(today));
  const [selectedMapelId, setSelectedMapelId] = useState<number | null>(null);
  const [periodPreset, setPeriodPreset] = useState<"month" | "all">("month");

  // Search in student list
  const [searchStudent, setSearchStudent] = useState<string>("");
  const [showDisiplinDetails, setShowDisiplinDetails] = useState<boolean>(false);

  // Loading & refreshing
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Data states
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [jurnalsList, setJurnalsList] = useState<JurnalMengajarItem[]>([]);

  // 1. Fetch Teacher's Jadwal to determine classes taught
  const fetchJadwal = useCallback(async () => {
    if (!teacherPegawaiId) return;
    try {
      setLoading(true);
      const data = await jadwalService.getJadwalPelajaran({
        pegawai_id: teacherPegawaiId,
      });
      setJadwalList(data || []);
    } catch (err) {
      console.warn("Error fetching jadwal for rekap:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacherPegawaiId]);

  useEffect(() => {
    if (isFocused) {
      fetchJadwal();
    }
  }, [isFocused, fetchJadwal]);

  // Extract distinct classes from teacher's schedule
  const kelasesTaught = useMemo<KelasOption[]>(() => {
    const map = new Map<number, KelasOption>();
    jadwalList.forEach((j) => {
      const kId = j.kelas?.kelas_id || j.kelas_id;
      const kName = j.kelas?.nama_kelas || `Kelas ${kId}`;
      const mName = j.mapel?.nama_mapel;

      if (kId) {
        if (!map.has(kId)) {
          map.set(kId, {
            kelas_id: kId,
            nama_kelas: kName,
            mapelNames: mName ? [mName] : [],
          });
        } else {
          const existing = map.get(kId)!;
          if (mName && !existing.mapelNames.includes(mName)) {
            existing.mapelNames.push(mName);
          }
        }
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.nama_kelas.localeCompare(b.nama_kelas)
    );
  }, [jadwalList]);

  // Mapel options for selected class
  const mapelOptionsForKelas = useMemo(() => {
    if (!selectedKelas) return [];
    const map = new Map<number, string>();
    jadwalList.forEach((j) => {
      const kId = j.kelas?.kelas_id || j.kelas_id;
      if (kId === selectedKelas.kelas_id && j.mapel?.mapel_id && j.mapel?.nama_mapel) {
        map.set(j.mapel.mapel_id, j.mapel.nama_mapel);
      }
    });
    return Array.from(map.entries()).map(([mapel_id, nama_mapel]) => ({
      mapel_id,
      nama_mapel,
    }));
  }, [jadwalList, selectedKelas]);

  // 2. Fetch Students & Jurnal when class is selected
  const fetchRekapData = useCallback(async () => {
    if (!selectedKelas) return;
    try {
      setLoading(true);
      const [siswaRes, jurnalsRes] = await Promise.allSettled([
        absensiService.getSiswaByKelas(selectedKelas.kelas_id),
        absensiService.getJurnalMengajar({
          kelas_id: selectedKelas.kelas_id,
          pegawai_id: teacherPegawaiId,
        }),
      ]);

      if (siswaRes.status === "fulfilled") {
        setSiswaList(siswaRes.value || []);
      }
      if (jurnalsRes.status === "fulfilled") {
        setJurnalsList(jurnalsRes.value || []);
      }
    } catch (err) {
      console.warn("Error fetching rekap data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedKelas, teacherPegawaiId]);

  useEffect(() => {
    if (selectedKelas) {
      fetchRekapData();
    }
  }, [selectedKelas, fetchRekapData]);

  // Handle class selection
  const handleSelectKelas = (item: KelasOption) => {
    setSelectedKelas(item);
    // Auto-select first mapel if available
    const classMapels = jadwalList
      .filter((j) => (j.kelas?.kelas_id || j.kelas_id) === item.kelas_id)
      .map((j) => j.mapel?.mapel_id)
      .filter(Boolean) as number[];
    if (classMapels.length > 0) {
      setSelectedMapelId(classMapels[0]);
    } else {
      setSelectedMapelId(null);
    }
    setStep("display_results");
  };

  // Filter Jurnals by Mapel and Date Range
  const filteredJurnals = useMemo(() => {
    return jurnalsList.filter((j) => {
      // Mapel filter
      if (selectedMapelId && j.jadwal?.mapel?.mapel_id !== selectedMapelId) {
        return false;
      }
      // Date filter (if month preset)
      if (periodPreset === "month") {
        const itemDate = (j.tanggal || "").split("T")[0];
        if (tanggalMulai && itemDate < tanggalMulai) return false;
        if (tanggalAkhir && itemDate > tanggalAkhir) return false;
      }
      return true;
    });
  }, [jurnalsList, selectedMapelId, periodPreset, tanggalMulai, tanggalAkhir]);

  // Collect all attendance records from filtered jurnals
  const filteredAbsensi = useMemo(() => {
    const all: Array<{ siswa_id: number; status: string; waktu_kehadiran?: string }> = [];
    filteredJurnals.forEach((j) => {
      if (j.absensi_pelajaran && Array.isArray(j.absensi_pelajaran)) {
        j.absensi_pelajaran.forEach((a) => {
          all.push({
            siswa_id: a.siswa_id,
            status: a.status,
            waktu_kehadiran: a.waktu_kehadiran,
          });
        });
      }
    });
    return all;
  }, [filteredJurnals]);

  // 3. Rekap Disiplin Guru
  const rekapDisiplinGuru = useMemo(() => {
    let tepatWaktu = 0;
    let terlambat = 0;
    let terlaluCepat = 0;
    let belumAdaStatus = 0;

    const sessionList = filteredJurnals.map((j, idx) => {
      const st = j.status;
      let normStatus: "Tepat Waktu" | "Terlambat" | "Terlalu Cepat" | "Belum Ditentukan" =
        "Belum Ditentukan";
      if (st === "Tepat Waktu" || st === "Sesuai") {
        normStatus = "Tepat Waktu";
        tepatWaktu++;
      } else if (st === "Terlambat" || st === "Tertinggal") {
        normStatus = "Terlambat";
        terlambat++;
      } else if (st === "Terlalu Cepat") {
        normStatus = "Terlalu Cepat";
        terlaluCepat++;
      } else {
        belumAdaStatus++;
      }

      const jamMulai = (j.jadwal as any)?.jam_mulai?.jam_mulai?.substring(0, 5);
      const jamSelesai = (j.jadwal as any)?.jam_selesai?.jam_selesai?.substring(0, 5);
      const rentangJam = jamMulai && jamSelesai ? `${jamMulai} - ${jamSelesai}` : (jamMulai || "-");

      const matchedAbs = j.absensi_pelajaran?.find((a) => a.waktu_kehadiran);
      const waktuInput = matchedAbs?.waktu_kehadiran?.substring(0, 5) || "-";

      return {
        jurnal_id: j.jurnal_id,
        tanggal: (j.tanggal || "").split("T")[0],
        pertemuan_ke: j.pertemuan_ke || idx + 1,
        status: normStatus,
        waktu_input: waktuInput,
        mapel_nama: j.jadwal?.mapel?.nama_mapel || "Mata Pelajaran",
        rentang_jam: rentangJam,
        catatan: j.catatan_tambahan,
      };
    });

    const totalSesi = sessionList.length;
    const persenTepatWaktu =
      totalSesi > 0 ? ((tepatWaktu / totalSesi) * 100).toFixed(1) : "0.0";

    return {
      totalSesi,
      tepatWaktu,
      terlambat,
      terlaluCepat,
      belumAdaStatus,
      persenTepatWaktu,
      sessionList,
    };
  }, [filteredJurnals]);

  // 4. Student Recap Calculation
  const studentRecapList = useMemo(() => {
    return siswaList.map((siswa) => {
      const absList = filteredAbsensi.filter((a) => a.siswa_id === siswa.siswa_id);
      const hadir = absList.filter((a) => a.status === "Hadir").length;
      const sakit = absList.filter((a) => a.status === "Sakit").length;
      const izin = absList.filter((a) => a.status === "Izin").length;
      const alpha = absList.filter((a) => a.status === "Alpha").length;
      const dispen = absList.filter((a) => a.status === "Dispen").length;
      const totalAll = hadir + sakit + izin + alpha + dispen;
      const percentage = totalAll > 0 ? ((hadir / totalAll) * 100).toFixed(1) : "0.0";

      return {
        siswa_id: siswa.siswa_id,
        nama: siswa.nama_lengkap || siswa.nama || "Siswa",
        nis: siswa.nis || siswa.nisn || "-",
        hadir,
        sakit,
        izin,
        alpha,
        dispen,
        totalAll,
        percentage: parseFloat(percentage),
      };
    });
  }, [siswaList, filteredAbsensi]);

  // Overall Totals
  const totals = useMemo(() => {
    const totalHadir = studentRecapList.reduce((acc, curr) => acc + curr.hadir, 0);
    const totalSakit = studentRecapList.reduce((acc, curr) => acc + curr.sakit, 0);
    const totalIzin = studentRecapList.reduce((acc, curr) => acc + curr.izin, 0);
    const totalAlpha = studentRecapList.reduce((acc, curr) => acc + curr.alpha, 0);
    const totalDispen = studentRecapList.reduce((acc, curr) => acc + curr.dispen, 0);
    const totalAll = totalHadir + totalSakit + totalIzin + totalAlpha + totalDispen;
    const avgKehadiran = totalAll > 0 ? ((totalHadir / totalAll) * 100).toFixed(1) : "0.0";

    return {
      totalHadir,
      totalSakit,
      totalIzin,
      totalAlpha,
      totalDispen,
      avgKehadiran,
    };
  }, [studentRecapList]);

  // Filtered Students by Search
  const filteredStudents = useMemo(() => {
    if (!searchStudent.trim()) return studentRecapList;
    const q = searchStudent.toLowerCase().trim();
    return studentRecapList.filter(
      (s) => s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q)
    );
  }, [studentRecapList, searchStudent]);

  const onRefresh = () => {
    setRefreshing(true);
    if (step === "select_kelas") {
      fetchJadwal();
    } else {
      fetchRekapData();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title={step === "select_kelas" ? "Rekap Absensi Siswa" : `Rekap: ${selectedKelas?.nama_kelas}`}
        subtitle={
          step === "select_kelas"
            ? "Pilih kelas untuk melihat rekapitulasi kehadiran"
            : "Laporan presensi & disiplin pembelajaran"
        }
        showBack={true}
      />

      {/* ══════════════════════════════════════════════════════════
          LANGKAH 1: PILIH KELAS
      ═══════════════════════════════════════════════════════════ */}
      {step === "select_kelas" && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>LANGKAH 1</Text>
            </View>
            <Text style={styles.stepTitle}>Pilih Kelas yang Anda Ajar</Text>
            <Text style={styles.stepSubtitle}>
              Menampilkan daftar rombongan belajar berdasarkan jadwal mengajar aktif Anda.
            </Text>
          </View>

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Memuat jadwal kelas Anda...</Text>
            </View>
          ) : kelasesTaught.length === 0 ? (
            <Card style={styles.emptyCard}>
              <BookOpen size={44} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Tidak Ada Kelas yang Diajar</Text>
              <Text style={styles.emptySubtitle}>
                Anda belum memiliki jadwal mengajar aktif yang terdaftar dalam sistem.
              </Text>
            </Card>
          ) : (
            <View style={styles.kelasList}>
              {kelasesTaught.map((item) => (
                <TouchableOpacity
                  key={item.kelas_id}
                  style={styles.kelasCard}
                  onPress={() => handleSelectKelas(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.kelasIconWrap}>
                    <GraduationCap size={24} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kelasName}>{item.nama_kelas}</Text>
                    <Text style={styles.kelasMapel}>
                      {item.mapelNames.length > 0
                        ? item.mapelNames.join(" • ")
                        : "Mata Pelajaran"}
                    </Text>
                  </View>
                  <View style={styles.pilihBtn}>
                    <Text style={styles.pilihBtnText}>Buka Rekap</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════
          LANGKAH 2: TAMPILAN REKAPITULASI KELAS (DISIPLIN & SISWA)
      ═══════════════════════════════════════════════════════════ */}
      {step === "display_results" && selectedKelas && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Top Switcher Button */}
          <View style={styles.topActionRow}>
            <TouchableOpacity
              style={styles.backToKelasBtn}
              onPress={() => setStep("select_kelas")}
              activeOpacity={0.8}
            >
              <ChevronLeft size={16} color="#2563EB" />
              <Text style={styles.backToKelasText}>Ganti Kelas</Text>
            </TouchableOpacity>

            <View style={styles.currentKelasBadge}>
              <GraduationCap size={14} color="#1E3A8A" />
              <Text style={styles.currentKelasBadgeText}>{selectedKelas.nama_kelas}</Text>
            </View>
          </View>

          {/* Filter Bar (Mapel & Periode) */}
          <View style={styles.filterSectionCard}>
            {/* Mapel Filter Chips */}
            {mapelOptionsForKelas.length > 1 && (
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Mata Pelajaran:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {mapelOptionsForKelas.map((m) => {
                    const isSelected = selectedMapelId === m.mapel_id;
                    return (
                      <TouchableOpacity
                        key={m.mapel_id}
                        style={[styles.chipItem, isSelected && styles.chipItemActive]}
                        onPress={() => setSelectedMapelId(m.mapel_id)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {m.nama_mapel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Periode Preset Buttons */}
            <View style={styles.filterGroup}>
              <View style={styles.filterHeaderRow}>
                <Text style={styles.filterGroupTitle}>Rentang Periode:</Text>
                <View style={styles.presetButtonsRow}>
                  <TouchableOpacity
                    style={[styles.presetBtn, periodPreset === "month" && styles.presetBtnActive]}
                    onPress={() => setPeriodPreset("month")}
                  >
                    <Text style={[styles.presetBtnText, periodPreset === "month" && styles.presetBtnTextActive]}>
                      Bulan Ini
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.presetBtn, periodPreset === "all" && styles.presetBtnActive]}
                    onPress={() => setPeriodPreset("all")}
                  >
                    <Text style={[styles.presetBtnText, periodPreset === "all" && styles.presetBtnTextActive]}>
                      Semua Sesi
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.dateRangeBox}>
                <Calendar size={14} color="#64748B" />
                <Text style={styles.dateRangeText}>
                  {periodPreset === "month"
                    ? `${tanggalMulai} s/d ${tanggalAkhir}`
                    : "Semua riwayat KBM semester ini"}
                </Text>
              </View>
            </View>
          </View>

          {/* 5 Metric Summary Cards */}
          <View style={styles.metricsContainer}>
            <View style={[styles.metricCard, { borderLeftColor: "#10B981" }]}>
              <Text style={styles.metricLabel}>Rata-Rata Kehadiran</Text>
              <Text style={[styles.metricValue, { color: "#059669" }]}>
                {totals.avgKehadiran}%
              </Text>
            </View>

            <View style={styles.metricGrid}>
              <View style={styles.metricMiniBox}>
                <Text style={styles.miniBoxLabel}>Hadir</Text>
                <Text style={[styles.miniBoxValue, { color: "#059669" }]}>
                  {totals.totalHadir}
                </Text>
              </View>
              <View style={styles.metricMiniBox}>
                <Text style={styles.miniBoxLabel}>Sakit</Text>
                <Text style={[styles.miniBoxValue, { color: "#D97706" }]}>
                  {totals.totalSakit}
                </Text>
              </View>
              <View style={styles.metricMiniBox}>
                <Text style={styles.miniBoxLabel}>Izin</Text>
                <Text style={[styles.miniBoxValue, { color: "#2563EB" }]}>
                  {totals.totalIzin}
                </Text>
              </View>
              <View style={styles.metricMiniBox}>
                <Text style={styles.miniBoxLabel}>Alpha</Text>
                <Text style={[styles.miniBoxValue, { color: "#DC2626" }]}>
                  {totals.totalAlpha}
                </Text>
              </View>
              <View style={styles.metricMiniBox}>
                <Text style={styles.miniBoxLabel}>Dispen</Text>
                <Text style={[styles.miniBoxValue, { color: "#7C3AED" }]}>
                  {totals.totalDispen}
                </Text>
              </View>
            </View>
          </View>

          {/* Monitoring Kedisiplinan Guru */}
          {rekapDisiplinGuru.totalSesi > 0 && (
            <Card style={styles.disiplinCard}>
              <View style={styles.disiplinHeader}>
                <View style={styles.disiplinHeaderLeft}>
                  <View style={styles.clockIconBox}>
                    <Clock size={16} color="#FACC15" />
                  </View>
                  <View>
                    <Text style={styles.disiplinTitle}>Disiplin Pengisian KBM</Text>
                    <Text style={styles.disiplinSub}>
                      {rekapDisiplinGuru.totalSesi} Sesi Jurnal Mengajar
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.toggleDisiplinBtn}
                  onPress={() => setShowDisiplinDetails(!showDisiplinDetails)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.toggleDisiplinText}>
                    {showDisiplinDetails ? "Tutup" : "Rincian"}
                  </Text>
                  {showDisiplinDetails ? (
                    <ChevronUp size={14} color="#CBD5E1" />
                  ) : (
                    <ChevronDown size={14} color="#CBD5E1" />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.disiplinStatsBar}>
                <View style={styles.disiplinStatItem}>
                  <Text style={styles.disiplinStatLabel}>Tepat Waktu</Text>
                  <Text style={[styles.disiplinStatVal, { color: "#10B981" }]}>
                    {rekapDisiplinGuru.tepatWaktu} ({rekapDisiplinGuru.persenTepatWaktu}%)
                  </Text>
                </View>
                <View style={styles.disiplinStatItem}>
                  <Text style={styles.disiplinStatLabel}>Terlambat</Text>
                  <Text style={[styles.disiplinStatVal, { color: "#EF4444" }]}>
                    {rekapDisiplinGuru.terlambat} Sesi
                  </Text>
                </View>
                <View style={styles.disiplinStatItem}>
                  <Text style={styles.disiplinStatLabel}>Terlalu Cepat</Text>
                  <Text style={[styles.disiplinStatVal, { color: "#F59E0B" }]}>
                    {rekapDisiplinGuru.terlaluCepat} Sesi
                  </Text>
                </View>
              </View>

              {/* Collapsible Session List */}
              {showDisiplinDetails && (
                <View style={styles.sessionListWrap}>
                  {rekapDisiplinGuru.sessionList.map((s, idx) => (
                    <View key={s.jurnal_id || idx} style={styles.sessionItemCard}>
                      <View style={styles.sessionTopRow}>
                        <Text style={styles.sessionP}>Pertemuan {s.pertemuan_ke}</Text>
                        <Text style={styles.sessionDate}>{s.tanggal}</Text>
                      </View>
                      <View style={styles.sessionStatusRow}>
                        <Text style={styles.sessionTimeInfo}>
                          Jadwal: {s.rentang_jam} WIB • Input: {s.waktu_input}
                        </Text>
                        <Badge
                          label={s.status}
                          variant={
                            s.status === "Tepat Waktu"
                              ? "success"
                              : s.status === "Terlambat"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        />
                      </View>
                      {s.catatan ? (
                        <Text style={styles.sessionNotes} numberOfLines={2}>
                          Catatan: {s.catatan}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </Card>
          )}

          {/* Student Recap List */}
          <View style={styles.studentSection}>
            <View style={styles.studentSectionHeader}>
              <View>
                <Text style={styles.studentSectionTitle}>Daftar Kehadiran Siswa</Text>
                <Text style={styles.studentSectionSub}>
                  Total {filteredStudents.length} santri terdaftar
                </Text>
              </View>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama atau NIS siswa..."
                placeholderTextColor="#94A3B8"
                value={searchStudent}
                onChangeText={setSearchStudent}
              />
            </View>

            {loading ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Memuat presensi siswa...</Text>
              </View>
            ) : filteredStudents.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Users size={36} color="#94A3B8" />
                <Text style={styles.emptyTitle}>Siswa Tidak Ditemukan</Text>
                <Text style={styles.emptySubtitle}>
                  Tidak ada data siswa yang cocok dengan filter atau kata kunci.
                </Text>
              </Card>
            ) : (
              filteredStudents.map((s, index) => {
                const isGood = s.percentage >= 90;
                const isFair = s.percentage >= 75 && s.percentage < 90;

                return (
                  <View key={s.siswa_id} style={styles.studentCard}>
                    <View style={styles.studentHeaderRow}>
                      <View style={styles.studentNumberBadge}>
                        <Text style={styles.studentNumberText}>{index + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName}>{s.nama}</Text>
                        <Text style={styles.studentNis}>NIS: {s.nis}</Text>
                      </View>
                      <View
                        style={[
                          styles.percentageBadge,
                          {
                            backgroundColor: isGood
                              ? "#ECFDF5"
                              : isFair
                              ? "#FFFBEB"
                              : "#FEF2F2",
                            borderColor: isGood
                              ? "#A7F3D0"
                              : isFair
                              ? "#FDE68A"
                              : "#FECACA",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.percentageText,
                            {
                              color: isGood
                                ? "#065F46"
                                : isFair
                                ? "#92400E"
                                : "#991B1B",
                            },
                          ]}
                        >
                          {s.percentage}% Hadir
                        </Text>
                      </View>
                    </View>

                    {/* Breakdown Badges */}
                    <View style={styles.breakdownRow}>
                      <View style={[styles.breakdownPill, { backgroundColor: "#ECFDF5" }]}>
                        <Text style={[styles.breakdownPillText, { color: "#065F46" }]}>
                          H: {s.hadir}
                        </Text>
                      </View>
                      <View style={[styles.breakdownPill, { backgroundColor: "#FFFBEB" }]}>
                        <Text style={[styles.breakdownPillText, { color: "#92400E" }]}>
                          S: {s.sakit}
                        </Text>
                      </View>
                      <View style={[styles.breakdownPill, { backgroundColor: "#EFF6FF" }]}>
                        <Text style={[styles.breakdownPillText, { color: "#1E40AF" }]}>
                          I: {s.izin}
                        </Text>
                      </View>
                      <View style={[styles.breakdownPill, { backgroundColor: "#FEF2F2" }]}>
                        <Text style={[styles.breakdownPillText, { color: "#991B1B" }]}>
                          A: {s.alpha}
                        </Text>
                      </View>
                      <View style={[styles.breakdownPill, { backgroundColor: "#F5F3FF" }]}>
                        <Text style={[styles.breakdownPillText, { color: "#5B21B6" }]}>
                          D: {s.dispen}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
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
  stepHeader: {
    marginBottom: 16,
  },
  stepBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1E40AF",
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  stepSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 18,
  },
  centerLoading: {
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
  kelasList: {
    gap: 10,
  },
  kelasCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  kelasIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  kelasName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  kelasMapel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  pilihBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  pilihBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  topActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backToKelasBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 4,
  },
  backToKelasText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  currentKelasBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  currentKelasBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E3A8A",
  },
  filterSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
    gap: 12,
  },
  filterGroup: {
    gap: 6,
  },
  filterHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterGroupTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  chipItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipItemActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  presetButtonsRow: {
    flexDirection: "row",
    gap: 6,
  },
  presetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
  },
  presetBtnActive: {
    backgroundColor: "#2563EB",
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  presetBtnTextActive: {
    color: "#FFFFFF",
  },
  dateRangeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateRangeText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "500",
  },
  metricsContainer: {
    marginBottom: 14,
    gap: 8,
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  metricGrid: {
    flexDirection: "row",
    gap: 6,
  },
  metricMiniBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  miniBoxLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  miniBoxValue: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },
  disiplinCard: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 0,
  },
  disiplinHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  disiplinHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clockIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  disiplinTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  disiplinSub: {
    fontSize: 11,
    color: "#94A3B8",
  },
  toggleDisiplinBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  toggleDisiplinText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#E2E8F0",
  },
  disiplinStatsBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: 10,
    justifyContent: "space-around",
  },
  disiplinStatItem: {
    alignItems: "center",
  },
  disiplinStatLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "500",
  },
  disiplinStatVal: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  sessionListWrap: {
    marginTop: 12,
    gap: 8,
  },
  sessionItemCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sessionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sessionP: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sessionDate: {
    fontSize: 11,
    color: "#94A3B8",
  },
  sessionStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionTimeInfo: {
    fontSize: 10,
    color: "#CBD5E1",
  },
  sessionNotes: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 4,
    fontStyle: "italic",
  },
  studentSection: {
    marginTop: 4,
  },
  studentSectionHeader: {
    marginBottom: 10,
  },
  studentSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  studentSectionSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
  },
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  studentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  studentNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  studentNumberText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  studentNis: {
    fontSize: 11,
    color: "#64748B",
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: "800",
  },
  breakdownRow: {
    flexDirection: "row",
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  breakdownPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  breakdownPillText: {
    fontSize: 10,
    fontWeight: "800",
  },
});
