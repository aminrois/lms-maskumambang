// mobile/src/screens/Absensi/AbsensiMapelScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  Users,
  Save,
  CheckCheck,
  Search,
  BookOpen,
  Sparkles,
  Info,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  BookMarked,
  Check,
  FileCheck2,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import {
  absensiService,
  SiswaItem,
  AttendanceStatusType,
  LessonPlanDetailItem,
  LessonPlanItem,
  JurnalMengajarItem,
} from "../../api/absensiService";
import { jadwalService, JadwalItem } from "../../api/jadwalService";
import { useAuthStore } from "../../store/useAuthStore";
import { canManageKBM } from "../../utils/permissions";
import { isLessonPlanApproved } from "../../utils/jadwalHelper";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

export const AbsensiMapelScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const teacherPegawaiId = user?.pegawai?.pegawai_id;

  // Day Name Helper
  const todayName = useMemo(() => {
    const dayMap = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return dayMap[new Date().getDay()] || "Senin";
  }, []);

  // Wizard Step: 1 = Pilih Jadwal, 2 = Pilih Pertemuan (RPP), 3 = Isi Absensi & Jurnal
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Selected schedule & RPP state
  const [selectedJadwal, setSelectedJadwal] = useState<JadwalItem | null>(null);
  const [selectedPertemuan, setSelectedPertemuan] = useState<number | null>(null);
  const [selectedLpDetail, setSelectedLpDetail] = useState<LessonPlanDetailItem | null>(null);

  // Data lists
  const [schedules, setSchedules] = useState<JadwalItem[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlanItem[]>([]);
  const [existingJurnals, setExistingJurnals] = useState<JurnalMengajarItem[]>([]);
  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);

  // Loading states
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [loadingStep2, setLoadingStep2] = useState<boolean>(false);
  const [loadingStep3, setLoadingStep3] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filter day for Step 1
  const [activeDayFilter, setActiveDayFilter] = useState<string>(todayName);

  // Form states for Step 3
  const [attendance, setAttendance] = useState<{ [key: number]: AttendanceStatusType }>({});
  const [materi, setMateri] = useState<string>("");
  const [catatan, setCatatan] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 1. Fetch initial teacher schedules & lesson plans
  const fetchInitialData = useCallback(async () => {
    if (!teacherPegawaiId) return;
    try {
      setLoadingInitial(true);
      const [jadwalData, lpData] = await Promise.all([
        jadwalService.getJadwalPelajaran({ pegawai_id: teacherPegawaiId }),
        absensiService.getLessonPlans({ pegawai_id: teacherPegawaiId }).catch(() => []),
      ]);
      setSchedules(jadwalData);
      setLessonPlans(lpData);
    } catch (err: any) {
      console.warn("Gagal memuat jadwal & RPP:", err.message);
    } finally {
      setLoadingInitial(false);
    }
  }, [teacherPegawaiId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Handle route params if passed from navigation
  useEffect(() => {
    if (route.params?.jadwalId && schedules.length > 0) {
      const found = schedules.find((s) => s.jadwal_id === route.params.jadwalId);
      if (found) {
        handleSelectSchedule(found);
      }
    }
  }, [route.params?.jadwalId, schedules]);

  // Check matched RPP and verification status for a schedule
  const getScheduleRppStatus = useCallback(
    (item: JadwalItem) => {
      const matched = lessonPlans.find(
        (lp) =>
          lp.jadwal_id === item.jadwal_id ||
          (lp.jadwal?.mapel?.mapel_id === item.mapel_id &&
            lp.jadwal?.kelas?.kelas_id === item.kelas_id)
      );

      if (!matched) {
        return {
          hasLP: false,
          isApproved: false,
          lp: null,
          reason: "Anda belum membuat Lesson Plan (RPP) untuk mata pelajaran ini.",
        };
      }

      const approved = isLessonPlanApproved(matched);
      return {
        hasLP: true,
        isApproved: approved,
        lp: matched,
        reason: approved
          ? "RPP Terverifikasi"
          : "RPP untuk mata pelajaran ini belum disetujui Kepala Sekolah / Direktur.",
      };
    },
    [lessonPlans]
  );

  // 2. Select schedule in Step 1
  const handleSelectSchedule = async (item: JadwalItem) => {
    const isToday = (item.hari || "").toLowerCase() === todayName.toLowerCase();
    const rppStatus = getScheduleRppStatus(item);

    // Rule 1: Day Lock
    if (!isToday) {
      Alert.alert(
        "🔒 Jadwal Terkunci",
        `Absensi jadwal "${item.mapel?.nama_mapel || "Mapel"} - ${
          item.kelas?.nama_kelas || "Kelas"
        }" hanya dapat diisi pada hari ${item.hari}.`
      );
      return;
    }

    // Rule 2: RPP Lock
    if (!rppStatus.isApproved) {
      Alert.alert(
        "🔒 RPP Belum Disetujui",
        rppStatus.reason +
          "\n\nSesuai aturan kurikulum, presensi dan jurnal mengajar terkunci sampai RPP disetujui."
      );
      return;
    }

    setSelectedJadwal(item);
    setCurrentStep(2);

    // Load existing journals for this schedule to show completed meetings
    try {
      setLoadingStep2(true);
      const jurnals = await absensiService.getJurnalMengajar({
        jadwal_id: item.jadwal_id,
      });
      setExistingJurnals(jurnals);
    } catch (e) {
      console.warn("Error fetching journals:", e);
    } finally {
      setLoadingStep2(false);
    }
  };

  // 3. Select meeting in Step 2 -> Move to Step 3
  const handleSelectMeeting = async (
    pertemuanNum: number,
    lpDetail: LessonPlanDetailItem | null,
    existingJurnal: JurnalMengajarItem | null
  ) => {
    if (!selectedJadwal) return;

    setSelectedPertemuan(pertemuanNum);
    setSelectedLpDetail(lpDetail);
    setCurrentStep(3);

    try {
      setLoadingStep3(true);

      // Fetch students of the class
      const siswas = await absensiService.getSiswaByKelas(selectedJadwal.kelas_id);
      setSiswaList(siswas);

      // Default attendance map: 'Hadir' for all
      const initialAtt: { [key: number]: AttendanceStatusType } = {};
      siswas.forEach((s) => {
        initialAtt[s.siswa_id] = "Hadir";
      });

      // If existing journal has attendance records, pre-fill them
      if (existingJurnal?.absensi_pelajaran && existingJurnal.absensi_pelajaran.length > 0) {
        existingJurnal.absensi_pelajaran.forEach((ab) => {
          initialAtt[ab.siswa_id] = (ab.status as AttendanceStatusType) || "Hadir";
        });
      }

      setAttendance(initialAtt);

      // Pre-fill materi and catatan
      const defaultMateri =
        existingJurnal?.catatan_tambahan ||
        lpDetail?.topik_materi ||
        lpDetail?.materi ||
        lpDetail?.isi ||
        "";
      setMateri(defaultMateri);
      setCatatan(existingJurnal?.catatan_tambahan || "");
    } catch (err: any) {
      Alert.alert("Gagal Memuat Siswa", err.message || "Terjadi kesalahan saat memuat siswa.");
    } finally {
      setLoadingStep3(false);
    }
  };

  // Attendance handlers
  const setAllStatus = (status: AttendanceStatusType) => {
    const updated: { [key: number]: AttendanceStatusType } = {};
    siswaList.forEach((s) => {
      updated[s.siswa_id] = status;
    });
    setAttendance(updated);
  };

  const handleStatusChange = (siswaId: number, status: AttendanceStatusType) => {
    setAttendance((prev) => ({
      ...prev,
      [siswaId]: status,
    }));
  };

  const filteredSiswa = useMemo(() => {
    if (!searchQuery.trim()) return siswaList;
    const q = searchQuery.toLowerCase().trim();
    return siswaList.filter(
      (s) =>
        (s.nama || s.nama_lengkap || "").toLowerCase().includes(q) ||
        (s.nisn || "").includes(q) ||
        (s.nis || "").includes(q)
    );
  }, [siswaList, searchQuery]);

  const summary = useMemo(() => {
    let hadir = 0,
      sakit = 0,
      izin = 0,
      alpha = 0,
      dispen = 0;
    Object.values(attendance).forEach((st) => {
      if (st === "Hadir") hadir++;
      else if (st === "Sakit") sakit++;
      else if (st === "Izin") izin++;
      else if (st === "Alpha") alpha++;
      else if (st === "Dispen") dispen++;
    });
    return { hadir, sakit, izin, alpha, dispen, total: siswaList.length };
  }, [attendance, siswaList]);

  // Submit attendance & journal
  const handleSubmit = async () => {
    if (!canManageKBM(user)) {
      Alert.alert("Akses Ditolak", "Anda tidak memiliki hak akses untuk menyimpan presensi.");
      return;
    }

    if (!selectedJadwal || !selectedPertemuan) {
      Alert.alert("Data Belum Lengkap", "Jadwal atau pertemuan belum dipilih.");
      return;
    }

    if (!materi.trim() && !catatan.trim()) {
      Alert.alert(
        "Materi / Topik Pembelajaran",
        "Harap isi ringkasan materi atau catatan topik yang diajarkan pada pertemuan ini."
      );
      return;
    }

    try {
      setSubmitting(true);
      const detail_absensi = Object.entries(attendance).map(([sId, status]) => ({
        siswa_id: Number(sId),
        status: status,
      }));

      await absensiService.submitAbsensiMapel({
        jadwal_id: selectedJadwal.jadwal_id,
        kelas_id: selectedJadwal.kelas_id,
        mapel_id: selectedJadwal.mapel_id,
        tanggal: new Date().toISOString().split("T")[0],
        pertemuan_ke: selectedPertemuan,
        materi_diajarkan: materi.trim(),
        catatan_guru: catatan.trim(),
        catatan_tambahan: materi.trim() || catatan.trim(),
        lesson_plan_detail_id: selectedLpDetail?.detail_id,
        status: "Sesuai",
        detail_absensi,
      });

      Alert.alert(
        "✅ Presensi Berhasil Disimpan",
        `Data presensi Pertemuan ${selectedPertemuan} (${summary.hadir} Hadir, ${summary.sakit} Sakit, ${summary.izin} Izin, ${summary.alpha} Alpha, ${summary.dispen} Dispen) & Jurnal Mengajar telah tersimpan di sistem.`,
        [
          {
            text: "Kembali ke Pertemuan",
            onPress: async () => {
              setCurrentStep(2);
              // Refresh journals list
              const jurnals = await absensiService.getJurnalMengajar({
                jadwal_id: selectedJadwal.jadwal_id,
              });
              setExistingJurnals(jurnals);
            },
          },
        ]
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Gagal menyimpan presensi.";
      Alert.alert("Gagal Menyimpan", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions: {
    label: string;
    value: AttendanceStatusType;
    color: string;
    bg: string;
  }[] = [
    { label: "H", value: "Hadir", color: Colors.hadir, bg: Colors.successBg },
    { label: "S", value: "Sakit", color: Colors.sakit, bg: Colors.infoBg },
    { label: "I", value: "Izin", color: Colors.izin, bg: Colors.warningBg },
    { label: "A", value: "Alpha", color: Colors.alpha, bg: Colors.dangerBg },
    { label: "D", value: "Dispen", color: "#8B5CF6", bg: "#F5F3FF" },
  ];

  // ═══════════════════════════════════════════════════════
  // STEP 1: PILIH JADWAL MENGAJAR (DENGAN DAY LOCK & RPP LOCK)
  // ═══════════════════════════════════════════════════════
  if (currentStep === 1) {
    const schedulesForDay = schedules.filter(
      (s) => (s.hari || "").toLowerCase() === activeDayFilter.toLowerCase()
    );

    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Header
          title="Absensi Mata Pelajaran"
          subtitle="Langkah 1 dari 3: Pilih Jadwal Mengajar"
          showBack={navigation.canGoBack()}
          onBack={() => navigation.goBack()}
        />

        {/* Wizard Step Indicator */}
        <View style={styles.wizardBar}>
          <View style={[styles.wizardStepItem, styles.wizardStepActive]}>
            <View style={styles.wizardCircleActive}>
              <Text style={styles.wizardCircleTextActive}>1</Text>
            </View>
            <Text style={styles.wizardLabelActive}>Jadwal</Text>
          </View>
          <View style={styles.wizardLine} />
          <View style={styles.wizardStepItem}>
            <View style={styles.wizardCircle}>
              <Text style={styles.wizardCircleText}>2</Text>
            </View>
            <Text style={styles.wizardLabel}>Lesson Plan</Text>
          </View>
          <View style={styles.wizardLine} />
          <View style={styles.wizardStepItem}>
            <View style={styles.wizardCircle}>
              <Text style={styles.wizardCircleText}>3</Text>
            </View>
            <Text style={styles.wizardLabel}>Absensi</Text>
          </View>
        </View>

        {/* Day Filter Tabs */}
        <View style={styles.daysFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysScroll}
          >
            {DAYS.map((day) => {
              const isSelected = activeDayFilter.toLowerCase() === day.toLowerCase();
              const isToday = day.toLowerCase() === todayName.toLowerCase();
              const countForDay = schedules.filter(
                (s) => (s.hari || "").toLowerCase() === day.toLowerCase()
              ).length;

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayTabBtn,
                    isSelected && styles.dayTabBtnActive,
                    isToday && !isSelected && styles.dayTabBtnToday,
                  ]}
                  onPress={() => setActiveDayFilter(day)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayTabText,
                      isSelected && styles.dayTabTextActive,
                      isToday && !isSelected && styles.dayTabTextToday,
                    ]}
                  >
                    {day}
                  </Text>
                  {isToday && (
                    <View style={styles.todayIndicatorDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loadingInitial ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memeriksa jadwal mengajar & verifikasi RPP...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loadingInitial}
                onRefresh={fetchInitialData}
                colors={[Colors.primary]}
              />
            }
          >
            <View style={styles.pickerHeader}>
              <View style={styles.pickerTitleRow}>
                <Text style={styles.pickerTitle}>Jadwal Hari {activeDayFilter}</Text>
                {activeDayFilter.toLowerCase() === todayName.toLowerCase() ? (
                  <View style={styles.todayActiveBadge}>
                    <Sparkles size={11} color="#15803D" />
                    <Text style={styles.todayActiveText}>Hari Ini (Dapat Diisi)</Text>
                  </View>
                ) : (
                  <View style={styles.lockedDayBadge}>
                    <Lock size={11} color="#94A3B8" />
                    <Text style={styles.lockedDayText}>Terkunci (Bukan Hari Ini)</Text>
                  </View>
                )}
              </View>
              <Text style={styles.pickerSubtitle}>
                Pilih jadwal KBM untuk melanjutkan ke pemilihan pertemuan RPP.
              </Text>
            </View>

            {schedulesForDay.length === 0 ? (
              <View style={styles.emptyScheduleCard}>
                <Calendar size={36} color="#94A3B8" />
                <Text style={styles.emptyScheduleTitle}>Tidak Ada Jadwal Mengajar</Text>
                <Text style={styles.emptyScheduleDesc}>
                  Tidak ada jadwal mengajar yang tercatat untuk hari {activeDayFilter}.
                </Text>
              </View>
            ) : (
              schedulesForDay.map((item) => {
                const isToday = (item.hari || "").toLowerCase() === todayName.toLowerCase();
                const rppStatus = getScheduleRppStatus(item);
                const isLocked = !isToday || !rppStatus.isApproved;

                const jamMulaiStr =
                  typeof item.jam_mulai === "object"
                    ? item.jam_mulai?.jam_mulai
                    : item.jam_mulai || "-";
                const jamSelesaiStr =
                  typeof item.jam_selesai === "object"
                    ? item.jam_selesai?.jam_selesai
                    : item.jam_selesai || "-";

                return (
                  <TouchableOpacity
                    key={item.jadwal_id}
                    style={[
                      styles.scheduleCard,
                      isLocked && styles.scheduleCardLocked,
                    ]}
                    onPress={() => handleSelectSchedule(item)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.scheduleCardHeader}>
                      <View style={styles.scheduleBadgeWrap}>
                        <Badge
                          label={`Kelas ${item.kelas?.nama_kelas || item.kelas_id}`}
                          variant={isLocked ? "neutral" : "primary"}
                        />
                        <View style={styles.jamKeBadge}>
                          <Clock size={11} color="#475569" />
                          <Text style={styles.jamKeText}>
                            {jamMulaiStr} - {jamSelesaiStr}
                          </Text>
                        </View>
                      </View>

                      {isLocked ? (
                        <View style={styles.lockIconBox}>
                          <Lock size={14} color="#94A3B8" />
                        </View>
                      ) : (
                        <View style={styles.actionBtnSmall}>
                          <Text style={styles.actionBtnText}>Pilih</Text>
                          <ChevronRight size={14} color="#1D4ED8" />
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.scheduleMapelName,
                        isLocked && { color: "#64748B" },
                      ]}
                    >
                      {item.mapel?.nama_mapel || `Mapel ${item.mapel_id}`}
                    </Text>

                    {/* Status RPP Footnote */}
                    <View style={styles.scheduleCardFooter}>
                      <View style={styles.scheduleRppStatusRow}>
                        {rppStatus.isApproved ? (
                          <>
                            <CheckCircle2 size={12} color="#15803D" />
                            <Text style={styles.rppStatusApprovedText}>
                              RPP Terverifikasi (Siap Absensi)
                            </Text>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={12} color="#D97706" />
                            <Text style={styles.rppStatusPendingText}>
                              {rppStatus.hasLP
                                ? "RPP Belum Disetujui"
                                : "Belum Ada RPP"}
                            </Text>
                          </>
                        )}
                      </View>
                      {!isToday && (
                        <Text style={styles.notTodayFootnote}>
                          Khusus hari {item.hari}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════
  // STEP 2: PILIH PERTEMUAN LESSON PLAN (RPP)
  // ═══════════════════════════════════════════════════════
  if (currentStep === 2 && selectedJadwal) {
    const matchedLP = lessonPlans.find(
      (lp) =>
        lp.jadwal_id === selectedJadwal.jadwal_id ||
        (lp.jadwal?.mapel?.mapel_id === selectedJadwal.mapel_id &&
          lp.jadwal?.kelas?.kelas_id === selectedJadwal.kelas_id)
    );

    const rppDetails = matchedLP?.details || [];
    // Default 16 meetings if details array is empty
    const meetingsCount = Math.max(rppDetails.length, 16);
    const meetingNumbers = Array.from({ length: meetingsCount }, (_, i) => i + 1);

    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Header
          title="Pilih Pertemuan RPP"
          subtitle="Langkah 2 dari 3: Pilih Nomor Pertemuan"
          showBack
          onBack={() => setCurrentStep(1)}
        />

        {/* Wizard Step Indicator */}
        <View style={styles.wizardBar}>
          <View style={[styles.wizardStepItem, styles.wizardStepDone]}>
            <View style={styles.wizardCircleDone}>
              <Check size={12} color="#FFFFFF" strokeWidth={3} />
            </View>
            <Text style={styles.wizardLabelDone}>Jadwal</Text>
          </View>
          <View style={[styles.wizardLine, styles.wizardLineActive]} />
          <View style={[styles.wizardStepItem, styles.wizardStepActive]}>
            <View style={styles.wizardCircleActive}>
              <Text style={styles.wizardCircleTextActive}>2</Text>
            </View>
            <Text style={styles.wizardLabelActive}>Lesson Plan</Text>
          </View>
          <View style={styles.wizardLine} />
          <View style={styles.wizardStepItem}>
            <View style={styles.wizardCircle}>
              <Text style={styles.wizardCircleText}>3</Text>
            </View>
            <Text style={styles.wizardLabel}>Absensi</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loadingStep2}
              onRefresh={async () => {
                if (!selectedJadwal) return;
                setLoadingStep2(true);
                const jurnals = await absensiService.getJurnalMengajar({
                  jadwal_id: selectedJadwal.jadwal_id,
                });
                setExistingJurnals(jurnals);
                setLoadingStep2(false);
              }}
              colors={[Colors.primary]}
            />
          }
        >
          {/* Selected Schedule Header Summary */}
          <Card style={styles.selectedScheduleCard}>
            <View style={styles.selectedScheduleHeader}>
              <View style={styles.selectedScheduleIcon}>
                <BookOpen size={20} color="#1D4ED8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedScheduleTitle}>
                  {selectedJadwal.mapel?.nama_mapel || "Mata Pelajaran"}
                </Text>
                <Text style={styles.selectedScheduleSubtitle}>
                  Kelas {selectedJadwal.kelas?.nama_kelas || "-"} • Hari {selectedJadwal.hari}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeScheduleBtn}
                onPress={() => setCurrentStep(1)}
                activeOpacity={0.8}
              >
                <Text style={styles.changeScheduleText}>Ganti</Text>
              </TouchableOpacity>
            </View>
          </Card>

          <View style={styles.meetingSectionTitleRow}>
            <Text style={styles.meetingSectionTitle}>Daftar Pertemuan KBM</Text>
            <Text style={styles.meetingSectionSubtitle}>
              Pilih pertemuan yang akan diisi atau diperbarui presensinya
            </Text>
          </View>

          {loadingStep2 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Memuat status pertemuan...</Text>
            </View>
          ) : (
            meetingNumbers.map((num) => {
              const lpDetail = rppDetails.find(
                (d) => Number(d.pertemuan_ke) === num
              ) || null;

              const existingJurnal = existingJurnals.find(
                (j) => Number(j.pertemuan_ke) === num
              ) || null;

              const isCompleted = !!existingJurnal;
              const topicStr =
                lpDetail?.topik_materi ||
                lpDetail?.materi ||
                lpDetail?.isi ||
                existingJurnal?.catatan_tambahan ||
                `Materi Pertemuan ke-${num}`;

              return (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.meetingCard,
                    isCompleted && styles.meetingCardCompleted,
                  ]}
                  onPress={() => handleSelectMeeting(num, lpDetail, existingJurnal)}
                  activeOpacity={0.85}
                >
                  <View style={styles.meetingCardLeft}>
                    <View
                      style={[
                        styles.meetingNumBadge,
                        isCompleted && styles.meetingNumBadgeCompleted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.meetingNumText,
                          isCompleted && styles.meetingNumTextCompleted,
                        ]}
                      >
                        {num}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.meetingCardCenter}>
                    <View style={styles.meetingStatusRow}>
                      <Text style={styles.meetingTitle}>Pertemuan {num}</Text>
                      {isCompleted ? (
                        <View style={styles.completedBadge}>
                          <CheckCircle2 size={11} color="#15803D" />
                          <Text style={styles.completedBadgeText}>Sudah Diisi</Text>
                        </View>
                      ) : (
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingBadgeText}>Belum Diisi</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.meetingTopicText} numberOfLines={2}>
                      {topicStr}
                    </Text>
                  </View>

                  <View style={styles.meetingCardRight}>
                    <ChevronRight size={16} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════
  // STEP 3: FORM ABSENSI & JURNAL KBM
  // ═══════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title={`Presensi Pertemuan ${selectedPertemuan || 1}`}
        subtitle={`${selectedJadwal?.mapel?.nama_mapel || "Mapel"} • ${
          selectedJadwal?.kelas?.nama_kelas || "Kelas"
        }`}
        showBack
        onBack={() => setCurrentStep(2)}
      />

      {/* Wizard Step Indicator */}
      <View style={styles.wizardBar}>
        <View style={[styles.wizardStepItem, styles.wizardStepDone]}>
          <View style={styles.wizardCircleDone}>
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
          </View>
          <Text style={styles.wizardLabelDone}>Jadwal</Text>
        </View>
        <View style={[styles.wizardLine, styles.wizardLineActive]} />
        <View style={[styles.wizardStepItem, styles.wizardStepDone]}>
          <View style={styles.wizardCircleDone}>
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
          </View>
          <Text style={styles.wizardLabelDone}>Lesson Plan</Text>
        </View>
        <View style={[styles.wizardLine, styles.wizardLineActive]} />
        <View style={[styles.wizardStepItem, styles.wizardStepActive]}>
          <View style={styles.wizardCircleActive}>
            <Text style={styles.wizardCircleTextActive}>3</Text>
          </View>
          <Text style={styles.wizardLabelActive}>Absensi</Text>
        </View>
      </View>

      {loadingStep3 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat data santri & presensi...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back to Meeting Picker Option */}
          <TouchableOpacity
            style={styles.switchScheduleBtn}
            onPress={() => setCurrentStep(2)}
            activeOpacity={0.8}
          >
            <ArrowLeft size={13} color="#1D4ED8" />
            <Text style={styles.switchScheduleText}>
              Ganti Pertemuan (Saat ini: Pertemuan {selectedPertemuan})
            </Text>
          </TouchableOpacity>

          {/* Sesi & Informasi Card */}
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mapelHeading}>
                  {selectedJadwal?.mapel?.nama_mapel || "Mata Pelajaran"}
                </Text>
                <Text style={styles.kelasHeading}>
                  Kelas {selectedJadwal?.kelas?.nama_kelas || "-"} • Pertemuan ke-{selectedPertemuan}
                </Text>
              </View>
              <Badge label={`${siswaList.length} Santri`} variant="primary" />
            </View>

            {/* Input Materi Pembelajaran */}
            <View style={{ marginTop: 6 }}>
              <Text style={styles.fieldLabel}>Materi / Topik KBM *</Text>
              <TextInput
                style={styles.fieldInput}
                value={materi}
                onChangeText={setMateri}
                placeholder="Tulis materi yang diajarkan..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Input Catatan Guru */}
            <View style={{ marginTop: 10 }}>
              <Text style={styles.fieldLabel}>Catatan Pembelajaran (Opsional)</Text>
              <TextInput
                style={[styles.fieldInput, { height: 60, textAlignVertical: "top" }]}
                value={catatan}
                onChangeText={setCatatan}
                placeholder="Catatan keaktifan siswa / kendala KBM..."
                placeholderTextColor="#94A3B8"
                multiline
              />
            </View>
          </Card>

          {/* Summary Status Bar */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: Colors.hadir }]}>
                {summary.hadir}
              </Text>
              <Text style={styles.summaryLabel}>Hadir</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: Colors.sakit }]}>
                {summary.sakit}
              </Text>
              <Text style={styles.summaryLabel}>Sakit</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: Colors.izin }]}>
                {summary.izin}
              </Text>
              <Text style={styles.summaryLabel}>Izin</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: Colors.alpha }]}>
                {summary.alpha}
              </Text>
              <Text style={styles.summaryLabel}>Alpha</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: "#8B5CF6" }]}>
                {summary.dispen}
              </Text>
              <Text style={styles.summaryLabel}>Dispen</Text>
            </View>
          </View>

          {/* Quick Action: Set All */}
          <View style={styles.quickActionCard}>
            <Text style={styles.quickActionLabel}>Set Cepat Semua:</Text>
            <View style={styles.quickActionBtns}>
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: Colors.successBg }]}
                onPress={() => setAllStatus("Hadir")}
                activeOpacity={0.8}
              >
                <Text style={[styles.quickBtnText, { color: Colors.hadir }]}>
                  Semua Hadir
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: Colors.infoBg }]}
                onPress={() => setAllStatus("Sakit")}
                activeOpacity={0.8}
              >
                <Text style={[styles.quickBtnText, { color: Colors.sakit }]}>
                  Semua Sakit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: Colors.warningBg }]}
                onPress={() => setAllStatus("Izin")}
                activeOpacity={0.8}
              >
                <Text style={[styles.quickBtnText, { color: Colors.izin }]}>
                  Semua Izin
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari santri berdasarkan nama / NIS..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Daftar Siswa */}
          {filteredSiswa.length === 0 ? (
            <View style={styles.emptySearchCard}>
              <Text style={styles.emptySearchText}>Tidak ada santri ditemukan.</Text>
            </View>
          ) : (
            filteredSiswa.map((siswa, idx) => {
              const currentStat = attendance[siswa.siswa_id] || "Hadir";
              return (
                <View key={siswa.siswa_id} style={styles.siswaRow}>
                  <View style={styles.siswaIndex}>
                    <Text style={styles.indexText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.siswaInfo}>
                    <Text style={styles.siswaNama} numberOfLines={1}>
                      {siswa.nama || siswa.nama_lengkap}
                    </Text>
                    <Text style={styles.siswaNis}>
                      NIS: {siswa.nis || siswa.nisn || "-"}
                    </Text>
                  </View>
                  <View style={styles.statusButtonsGroup}>
                    {statusOptions.map((opt) => {
                      const isSelected = currentStat === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.statusOptionBtn,
                            isSelected && {
                              backgroundColor: opt.color,
                              borderColor: opt.color,
                            },
                          ]}
                          onPress={() => handleStatusChange(siswa.siswa_id, opt.value)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.statusOptionText,
                              isSelected && { color: "#FFFFFF", fontWeight: "900" },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}

          {/* Tombol Simpan */}
          <View style={styles.bottomActionContainer}>
            <Button
              title={submitting ? "Menyimpan Presensi..." : "Simpan Presensi & Jurnal"}
              variant="primary"
              onPress={handleSubmit}
              disabled={submitting}
              icon={<Save size={18} color="#FFFFFF" />}
              style={styles.saveBtn}
            />
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
  wizardBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  wizardStepItem: {
    alignItems: "center",
  },
  wizardCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 3,
  },
  wizardCircleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  wizardLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
  },
  wizardStepActive: {},
  wizardCircleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1D4ED8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 3,
  },
  wizardCircleTextActive: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  wizardLabelActive: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  wizardStepDone: {},
  wizardCircleDone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 3,
  },
  wizardLabelDone: {
    fontSize: 10,
    fontWeight: "700",
    color: "#16A34A",
  },
  wizardLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
    marginBottom: 14,
  },
  wizardLineActive: {
    backgroundColor: "#16A34A",
  },
  daysFilterContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  daysScroll: {
    gap: 8,
  },
  dayTabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  dayTabBtnActive: {
    backgroundColor: "#162E6E",
  },
  dayTabBtnToday: {
    borderWidth: 1,
    borderColor: "#86EFAC",
    backgroundColor: "#F0FDF4",
  },
  dayTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  dayTabTextActive: {
    color: "#FFFFFF",
  },
  dayTabTextToday: {
    color: "#15803D",
  },
  todayIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12.5,
    color: "#64748B",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  pickerHeader: {
    marginBottom: 14,
  },
  pickerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  todayActiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  todayActiveText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#15803D",
  },
  lockedDayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  lockedDayText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#64748B",
  },
  pickerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  emptyScheduleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEF2F6",
    marginTop: 10,
  },
  emptyScheduleTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginTop: 10,
  },
  emptyScheduleDesc: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  scheduleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  scheduleCardLocked: {
    opacity: 0.65,
    backgroundColor: "#F8FAFC",
  },
  scheduleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  scheduleBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  jamKeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  jamKeText: {
    fontSize: 10.5,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#1D4ED8",
  },
  lockIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  scheduleMapelName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  scheduleCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  scheduleRppStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rppStatusApprovedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
  },
  rppStatusPendingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
  },
  notTodayFootnote: {
    fontSize: 10.5,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  selectedScheduleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  selectedScheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectedScheduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedScheduleTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  selectedScheduleSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  changeScheduleBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  changeScheduleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  meetingSectionTitleRow: {
    marginBottom: 12,
  },
  meetingSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  meetingSectionSubtitle: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
  },
  meetingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  meetingCardCompleted: {
    borderColor: "#DCFCE7",
    backgroundColor: "#FAFDFB",
  },
  meetingCardLeft: {
    marginRight: 10,
  },
  meetingNumBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  meetingNumBadgeCompleted: {
    backgroundColor: "#DCFCE7",
  },
  meetingNumText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },
  meetingNumTextCompleted: {
    color: "#15803D",
  },
  meetingCardCenter: {
    flex: 1,
  },
  meetingStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  meetingTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#15803D",
  },
  pendingBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748B",
  },
  meetingTopicText: {
    fontSize: 11.5,
    color: "#64748B",
    lineHeight: 16,
  },
  meetingCardRight: {
    marginLeft: 8,
  },
  switchScheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  switchScheduleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  infoCard: {
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  mapelHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  kelasHeading: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: "#0F172A",
  },
  summaryContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    alignItems: "center",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNum: {
    fontSize: 16,
    fontWeight: "900",
  },
  summaryLabel: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#EEF2F6",
  },
  quickActionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  quickActionLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },
  quickActionBtns: {
    flexDirection: "row",
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: "center",
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#0F172A",
  },
  siswaRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    padding: 10,
    marginBottom: 6,
  },
  siswaIndex: {
    width: 22,
    alignItems: "center",
  },
  indexText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  siswaInfo: {
    flex: 1,
    marginLeft: 6,
    marginRight: 8,
  },
  siswaNama: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  siswaNis: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  statusButtonsGroup: {
    flexDirection: "row",
    gap: 4,
  },
  statusOptionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  statusOptionText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
  },
  emptySearchCard: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
  },
  emptySearchText: {
    fontSize: 12,
    color: "#64748B",
  },
  bottomActionContainer: {
    marginTop: 14,
  },
  saveBtn: {
    backgroundColor: "#059669",
  },
});
