// mobile/src/screens/LMS/LmsScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {
  Calendar,
  FileSpreadsheet,
  FileCheck2,
  Users,
  Clock,
  ChevronRight,
  CheckCircle2,
  BookMarked,
  Layers,
  GraduationCap,
  ClipboardList,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { jadwalService, JadwalItem } from "../../api/jadwalService";
import {
  absensiService,
  JurnalMengajarItem,
  LessonPlanItem,
} from "../../api/absensiService";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

type TabType = "jadwal" | "jurnal" | "rpp" | "rekap";

export const LmsScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>("jadwal");
  const [activeDay, setActiveDay] = useState<string>("Senin");
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Data states
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [jurnalList, setJurnalList] = useState<JurnalMengajarItem[]>([]);
  const [lessonPlanList, setLessonPlanList] = useState<LessonPlanItem[]>([]);

  const teacherPegawaiId = user?.pegawai?.pegawai_id;

  // Auto set hari ini saat awal dibuka
  useEffect(() => {
    const dayIndex = new Date().getDay();
    const dayNames = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const todayName = dayNames[dayIndex];
    if (DAYS.includes(todayName)) {
      setActiveDay(todayName);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!teacherPegawaiId) return;
    try {
      setLoading(true);

      const [jadwalRes, jurnalRes, rppRes] = await Promise.allSettled([
        jadwalService.getJadwalPelajaran({ pegawai_id: teacherPegawaiId }),
        absensiService.getJurnalMengajar({ pegawai_id: teacherPegawaiId }),
        absensiService.getLessonPlans({ pegawai_id: teacherPegawaiId }),
      ]);

      if (jadwalRes.status === "fulfilled") {
        setJadwalList(jadwalRes.value || []);
      }
      if (jurnalRes.status === "fulfilled") {
        setJurnalList(jurnalRes.value || []);
      }
      if (rppRes.status === "fulfilled") {
        setLessonPlanList(rppRes.value || []);
      }
    } catch (err) {
      console.warn("Error fetching LMS data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacherPegawaiId]);

  useEffect(() => {
    if (isFocused) {
      fetchAllData();
    }
  }, [isFocused, fetchAllData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  // Filter jadwal per hari
  const filteredJadwal = useMemo(() => {
    return jadwalList
      .filter((j) => (j.hari || "").toLowerCase() === activeDay.toLowerCase())
      .sort((a, b) => (a.jam_ke || 0) - (b.jam_ke || 0));
  }, [jadwalList, activeDay]);

  // Statistik KBM
  const stats = useMemo(() => {
    const totalJam = jadwalList.length;
    const distinctKelas = new Set(jadwalList.map((j) => j.kelas?.kelas_id).filter(Boolean)).size;
    const totalJurnal = jurnalList.length;
    const totalRpp = lessonPlanList.length;
    return { totalJam, distinctKelas, totalJurnal, totalRpp };
  }, [jadwalList, jurnalList, lessonPlanList]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="LMS & KBM Pembelajaran"
        subtitle="Portal Terpadu Presensi, Jurnal & RPP"
      />

      {/* 1. Header Overview Stats Card */}
      <View style={styles.statsOverviewContainer}>
        <View style={styles.statBox}>
          <View style={[styles.statIconBadge, { backgroundColor: "#EFF6FF" }]}>
            <Clock size={16} color="#2563EB" />
          </View>
          <Text style={styles.statValue}>{stats.totalJam}</Text>
          <Text style={styles.statLabel}>Jam / Minggu</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <View style={[styles.statIconBadge, { backgroundColor: "#ECFDF5" }]}>
            <Users size={16} color="#059669" />
          </View>
          <Text style={styles.statValue}>{stats.distinctKelas}</Text>
          <Text style={styles.statLabel}>Kelas Diampu</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <View style={[styles.statIconBadge, { backgroundColor: "#F5F3FF" }]}>
            <FileSpreadsheet size={16} color="#7C3AED" />
          </View>
          <Text style={styles.statValue}>{stats.totalJurnal}</Text>
          <Text style={styles.statLabel}>Jurnal Terisi</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <View style={[styles.statIconBadge, { backgroundColor: "#FFFBEB" }]}>
            <FileCheck2 size={16} color="#D97706" />
          </View>
          <Text style={styles.statValue}>{stats.totalRpp}</Text>
          <Text style={styles.statLabel}>RPP Aktif</Text>
        </View>
      </View>

      {/* 2. Main Navigation Segmented Tabs */}
      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "jadwal" && styles.tabButtonActive]}
            onPress={() => setActiveTab("jadwal")}
            activeOpacity={0.8}
          >
            <Calendar size={15} color={activeTab === "jadwal" ? "#FFFFFF" : Colors.textSub} />
            <Text style={[styles.tabButtonText, activeTab === "jadwal" && styles.tabButtonTextActive]}>
              Jadwal & Presensi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "jurnal" && styles.tabButtonActive]}
            onPress={() => setActiveTab("jurnal")}
            activeOpacity={0.8}
          >
            <ClipboardList size={15} color={activeTab === "jurnal" ? "#FFFFFF" : Colors.textSub} />
            <Text style={[styles.tabButtonText, activeTab === "jurnal" && styles.tabButtonTextActive]}>
              Jurnal Mengajar ({jurnalList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "rpp" && styles.tabButtonActive]}
            onPress={() => setActiveTab("rpp")}
            activeOpacity={0.8}
          >
            <BookMarked size={15} color={activeTab === "rpp" ? "#FFFFFF" : Colors.textSub} />
            <Text style={[styles.tabButtonText, activeTab === "rpp" && styles.tabButtonTextActive]}>
              Lesson Plan ({lessonPlanList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "rekap" && styles.tabButtonActive]}
            onPress={() => setActiveTab("rekap")}
            activeOpacity={0.8}
          >
            <Layers size={15} color={activeTab === "rekap" ? "#FFFFFF" : Colors.textSub} />
            <Text style={[styles.tabButtonText, activeTab === "rekap" && styles.tabButtonTextActive]}>
              Rekap Siswa
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 3. Tab Contents */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════════════════════════════════════════════
            TAB 1: JADWAL & QUICK PRESENSI
        ════════════════════════════════════════════════════════ */}
        {activeTab === "jadwal" && (
          <View>
            {/* Filter Hari */}
            <View style={styles.daysFilterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {DAYS.map((day) => {
                  const isSelected = activeDay === day;
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setActiveDay(day)}
                      style={[styles.dayChip, isSelected && styles.dayChipActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Jadwal Hari {activeDay} ({filteredJadwal.length} Jam)
              </Text>
              <Text style={styles.sectionSubtitle}>Ketuk tombol aksi untuk mengisi presensi & jurnal</Text>
            </View>

            {loading && !refreshing ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingSubtext}>Memuat jadwal...</Text>
              </View>
            ) : filteredJadwal.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Calendar size={36} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Tidak Ada Jadwal Mengajar</Text>
                <Text style={styles.emptySubtitle}>
                  Tidak ada jadwal mengajar di hari {activeDay}. Silakan pilih hari lain.
                </Text>
              </Card>
            ) : (
              filteredJadwal.map((item) => {
                const mapelNama = item.mapel?.nama_mapel || "Mata Pelajaran";
                const kelasNama = item.kelas?.nama_kelas || "Kelas";

                // Cek jurnal yang sudah dibuat untuk jadwal ini
                const matchingJurnal = jurnalList.find((j) => j.jadwal_id === item.jadwal_id);

                return (
                  <Card key={item.jadwal_id} style={styles.jadwalCard}>
                    <View style={styles.jadwalHeader}>
                      <View style={styles.jamKeBadge}>
                        <Clock size={11} color={Colors.primary} />
                        <Text style={styles.jamKeText}>Jam Ke-{item.jam_ke || 1}</Text>
                      </View>
                      <View style={styles.timeTag}>
                        <Text style={styles.timeText}>
                          {item.jam_mulai?.slice(0, 5)} - {item.jam_selesai?.slice(0, 5)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.mapelName}>{mapelNama}</Text>

                    <View style={styles.jadwalMetaRow}>
                      <View style={styles.metaItem}>
                        <Users size={13} color={Colors.textSub} />
                        <Text style={styles.metaText}>{kelasNama}</Text>
                      </View>
                      {item.ruangan && (
                        <View style={styles.metaItem}>
                          <Text style={styles.ruanganText}>Ruang: {item.ruangan}</Text>
                        </View>
                      )}
                    </View>

                    {matchingJurnal && (
                      <View style={styles.jurnalSnippet}>
                        <CheckCircle2 size={13} color="#059669" />
                        <Text style={styles.jurnalSnippetText} numberOfLines={1}>
                          Pertemuan ke-{matchingJurnal.pertemuan_ke || 1}: {matchingJurnal.catatan_tambahan || "Jurnal terisi"}
                        </Text>
                      </View>
                    )}

                    {/* Tombol Aksi Langsung ke Presensi */}
                    <TouchableOpacity
                      style={styles.actionPresensiBtn}
                      onPress={() =>
                        navigation.navigate("AbsensiMapel", {
                          jadwalId: item.jadwal_id,
                          kelasId: item.kelas_id,
                          mapelId: item.mapel_id,
                          kelasNama: kelasNama,
                          mapelNama: mapelNama,
                          pertemuanDefault: matchingJurnal ? (matchingJurnal.pertemuan_ke || 1) : 1,
                        })
                      }
                      activeOpacity={0.85}
                    >
                      <Text style={styles.actionPresensiText}>
                        {matchingJurnal ? "✏️ Edit Presensi & Jurnal" : "📝 Isi Presensi & Jurnal"}
                      </Text>
                      <ChevronRight size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB 2: JURNAL MENGAJAR (HISTORY)
        ════════════════════════════════════════════════════════ */}
        {activeTab === "jurnal" && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Riwayat Jurnal Mengajar</Text>
              <Text style={styles.sectionSubtitle}>Laporan materi & kehadiran per pertemuan</Text>
            </View>

            {loading && !refreshing ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingSubtext}>Memuat jurnal...</Text>
              </View>
            ) : jurnalList.length === 0 ? (
              <Card style={styles.emptyCard}>
                <ClipboardList size={36} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Belum Ada Jurnal Tersimpan</Text>
                <Text style={styles.emptySubtitle}>
                  Isi presensi & jurnal mengajar harian Anda untuk melihat rekap di sini.
                </Text>
              </Card>
            ) : (
              jurnalList.map((jurnal) => {
                const absensi = jurnal.absensi_pelajaran || [];
                let hadir = 0, sakit = 0, izin = 0, alpha = 0, dispen = 0;
                absensi.forEach((a) => {
                  if (a.status === "Hadir") hadir++;
                  else if (a.status === "Sakit") sakit++;
                  else if (a.status === "Izin") izin++;
                  else if (a.status === "Alpha") alpha++;
                  else if (a.status === "Dispen") dispen++;
                });

                return (
                  <Card key={jurnal.jurnal_id} style={styles.jurnalCard}>
                    <View style={styles.jurnalTopRow}>
                      <View style={styles.pertemuanBadge}>
                        <Text style={styles.pertemuanBadgeText}>
                          Pertemuan Ke-{jurnal.pertemuan_ke || 1}
                        </Text>
                      </View>
                      <Text style={styles.jurnalTanggal}>{jurnal.tanggal}</Text>
                    </View>

                    <Text style={styles.jurnalMapelTitle}>
                      {jurnal.jadwal?.mapel?.nama_mapel || "Mata Pelajaran"}
                    </Text>
                    <Text style={styles.jurnalKelasSubtitle}>
                      Kelas: {jurnal.jadwal?.kelas?.nama_kelas || "-"} • Hari {jurnal.jadwal?.hari || "-"}
                    </Text>

                    {jurnal.catatan_tambahan ? (
                      <View style={styles.jurnalMateriBox}>
                        <Text style={styles.jurnalMateriLabel}>Materi / Topik Diajarkan:</Text>
                        <Text style={styles.jurnalMateriText}>{jurnal.catatan_tambahan}</Text>
                      </View>
                    ) : null}

                    {/* Quick Attendance Summary Counters */}
                    <View style={styles.jurnalAttendanceRow}>
                      <View style={[styles.jAttBadge, { backgroundColor: "#ECFDF5" }]}>
                        <Text style={[styles.jAttText, { color: "#059669" }]}>Hadir: {hadir}</Text>
                      </View>
                      <View style={[styles.jAttBadge, { backgroundColor: "#EFF6FF" }]}>
                        <Text style={[styles.jAttText, { color: "#2563EB" }]}>Sakit: {sakit}</Text>
                      </View>
                      <View style={[styles.jAttBadge, { backgroundColor: "#FFFBEB" }]}>
                        <Text style={[styles.jAttText, { color: "#D97706" }]}>Izin: {izin}</Text>
                      </View>
                      <View style={[styles.jAttBadge, { backgroundColor: "#FEF2F2" }]}>
                        <Text style={[styles.jAttText, { color: "#DC2626" }]}>Alpha: {alpha}</Text>
                      </View>
                      {dispen > 0 && (
                        <View style={[styles.jAttBadge, { backgroundColor: "#F5F3FF" }]}>
                          <Text style={[styles.jAttText, { color: "#7C3AED" }]}>Dispen: {dispen}</Text>
                        </View>
                      )}
                    </View>

                    {/* Edit Button */}
                    <TouchableOpacity
                      style={styles.jurnalEditBtn}
                      onPress={() =>
                        navigation.navigate("AbsensiMapel", {
                          jadwalId: jurnal.jadwal_id,
                          kelasId: jurnal.jadwal?.kelas?.kelas_id,
                          mapelId: jurnal.jadwal?.mapel?.mapel_id,
                          kelasNama: jurnal.jadwal?.kelas?.nama_kelas,
                          mapelNama: jurnal.jadwal?.mapel?.nama_mapel,
                          pertemuanDefault: jurnal.pertemuan_ke,
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.jurnalEditText}>Buka / Edit Presensi Sesi Ini</Text>
                      <ChevronRight size={14} color={Colors.primary} />
                    </TouchableOpacity>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB 3: LESSON PLAN / RPP
        ════════════════════════════════════════════════════════ */}
        {activeTab === "rpp" && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Lesson Plan & Silabus (RPP)</Text>
              <Text style={styles.sectionSubtitle}>Status verifikasi Kepala Sekolah & Direktur</Text>
            </View>

            {loading && !refreshing ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingSubtext}>Memuat RPP...</Text>
              </View>
            ) : lessonPlanList.length === 0 ? (
              <Card style={styles.emptyCard}>
                <BookMarked size={36} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Belum Ada Lesson Plan</Text>
                <Text style={styles.emptySubtitle}>
                  Lesson plan yang disusun guru akan tampil di sini lengkap dengan status verifikasi.
                </Text>
              </Card>
            ) : (
              lessonPlanList.map((rpp) => {
                const isKepsekApproved = rpp.status_verifikasi_kepsek === "Disetujui";
                const isDirekturApproved = rpp.status_verifikasi_direktur === "Disetujui";

                return (
                  <Card key={rpp.lesson_plan_id} style={styles.rppCard}>
                    <View style={styles.rppHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rppTitle}>{rpp.judul_rpp}</Text>
                        <Text style={styles.rppSubtitle}>
                          {rpp.jadwal?.mapel?.nama_mapel || "Mata Pelajaran"} • Kelas {rpp.jadwal?.kelas?.nama_kelas || "-"}
                        </Text>
                      </View>
                    </View>

                    {/* Verification Badges */}
                    <View style={styles.verifRow}>
                      <View style={styles.verifItem}>
                        <Text style={styles.verifLabel}>Verifikasi Kepsek:</Text>
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

                    {/* Detail Topik Pertemuan */}
                    {rpp.details && rpp.details.length > 0 && (
                      <View style={styles.rppDetailsList}>
                        <Text style={styles.rppDetailsHeading}>Daftar Pertemuan ({rpp.details.length}):</Text>
                        {rpp.details.slice(0, 4).map((d) => (
                          <View key={d.detail_id} style={styles.detailItemRow}>
                            <View style={styles.dotPertemuan} />
                            <Text style={styles.detailText}>
                              <Text style={{ fontWeight: "700" }}>P-{d.pertemuan_ke}:</Text>{" "}
                              {d.topik_materi || d.materi || "Materi Pembelajaran"}
                            </Text>
                          </View>
                        ))}
                        {rpp.details.length > 4 && (
                          <Text style={styles.moreDetailsText}>
                            + {rpp.details.length - 4} pertemuan lainnya
                          </Text>
                        )}
                      </View>
                    )}
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB 4: REKAP SISWA
        ════════════════════════════════════════════════════════ */}
        {activeTab === "rekap" && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Ringkasan Kehadiran Kelas</Text>
              <Text style={styles.sectionSubtitle}>Akumulasi kehadiran per kelas yang diampu</Text>
            </View>

            {jadwalList.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Layers size={36} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Belum Ada Data Rekap</Text>
                <Text style={styles.emptySubtitle}>Jadwal mengajar dan data absensi belum tersedia.</Text>
              </Card>
            ) : (
              // Distinct Kelas List
              Array.from(
                new Map(
                  jadwalList
                    .filter((j) => j.kelas)
                    .map((j) => [j.kelas?.kelas_id, { kelas: j.kelas, mapel: j.mapel, jadwalId: j.jadwal_id }])
                ).values()
              ).map((item, idx) => (
                <Card key={idx} style={styles.rekapCard}>
                  <View style={styles.rekapHeader}>
                    <View style={styles.rekapIcon}>
                      <GraduationCap size={20} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.rekapKelasNama}>{item.kelas?.nama_kelas || "Kelas"}</Text>
                      <Text style={styles.rekapMapelNama}>{item.mapel?.nama_mapel || "Mata Pelajaran"}</Text>
                    </View>
                    <Badge label="Aktif KBM" variant="primary" size="sm" />
                  </View>

                  <View style={styles.rekapBottomAction}>
                    <TouchableOpacity
                      style={styles.rekapBtn}
                      onPress={() =>
                        navigation.navigate("AbsensiMapel", {
                          jadwalId: item.jadwalId,
                          kelasId: item.kelas?.kelas_id,
                          mapelId: item.mapel?.mapel_id,
                          kelasNama: item.kelas?.nama_kelas,
                          mapelNama: item.mapel?.nama_mapel,
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.rekapBtnText}>Buka Form Presensi Kelas Ini</Text>
                      <ChevronRight size={14} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </Card>
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
    backgroundColor: Colors.background,
  },
  statsOverviewContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 2,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#F1F5F9",
  },
  tabBarContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 8,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabButtonActive: {
    backgroundColor: "#1D4ED8",
    borderColor: "#1D4ED8",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSub,
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  daysFilterContainer: {
    marginBottom: 12,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dayChipActive: {
    backgroundColor: "#1D4ED8",
    borderColor: "#1D4ED8",
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSub,
  },
  dayChipTextActive: {
    color: "#FFFFFF",
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: Colors.textMuted,
    marginTop: 2,
  },
  centerLoading: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    backgroundColor: "#FFFFFF",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  jadwalCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  jadwalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  jamKeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  jamKeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: Colors.textSub,
  },
  mapelName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  jadwalMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: Colors.textSub,
  },
  ruanganText: {
    fontSize: 11.5,
    color: Colors.textMuted,
  },
  jurnalSnippet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  jurnalSnippetText: {
    fontSize: 11.5,
    color: "#166534",
    fontWeight: "600",
    flex: 1,
  },
  actionPresensiBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1D4ED8",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 4,
  },
  actionPresensiText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "800",
  },
  jurnalCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  jurnalTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  pertemuanBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pertemuanBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
  },
  jurnalTanggal: {
    fontSize: 11.5,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  jurnalMapelTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  jurnalKelasSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSub,
    marginTop: 2,
    marginBottom: 8,
  },
  jurnalMateriBox: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  jurnalMateriLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 2,
  },
  jurnalMateriText: {
    fontSize: 12,
    color: "#1E293B",
    lineHeight: 16,
  },
  jurnalAttendanceRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  jAttBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  jAttText: {
    fontSize: 11,
    fontWeight: "800",
  },
  jurnalEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  jurnalEditText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  rppCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rppHeaderRow: {
    marginBottom: 10,
  },
  rppTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  rppSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSub,
    marginTop: 2,
  },
  verifRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 10,
  },
  verifItem: {
    flex: 1,
    gap: 4,
  },
  verifLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  rppDetailsList: {
    marginTop: 2,
  },
  rppDetailsHeading: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 6,
  },
  detailItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  dotPertemuan: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#3B82F6",
  },
  detailText: {
    fontSize: 11.5,
    color: "#334155",
    flex: 1,
  },
  moreDetailsText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  rekapCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rekapHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  rekapIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  rekapKelasNama: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  rekapMapelNama: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSub,
    marginTop: 1,
  },
  rekapBottomAction: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  rekapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  rekapBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
});
