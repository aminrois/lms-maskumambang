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

  // Active Selected Session for Attendance
  const [activeJadwalId, setActiveJadwalId] = useState<number | undefined>(route.params?.jadwalId);
  const [activeKelasId, setActiveKelasId] = useState<number | undefined>(route.params?.kelasId);
  const [activeMapelId, setActiveMapelId] = useState<number | undefined>(route.params?.mapelId);
  const [activeKelasNama, setActiveKelasNama] = useState<string>(route.params?.kelasNama || "");
  const [activeMapelNama, setActiveMapelNama] = useState<string>(route.params?.mapelNama || "");

  // Schedule list state for Schedule Picker mode
  const [schedules, setSchedules] = useState<JadwalItem[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [activeDay, setActiveDay] = useState<string>(() => {
    const dayMap = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return dayMap[new Date().getDay()] || "Senin";
  });

  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Kehadiran siswa: { [siswa_id]: AttendanceStatusType }
  const [attendance, setAttendance] = useState<{ [key: number]: AttendanceStatusType }>({});
  const [pertemuanKe, setPertemuanKe] = useState(String(route.params?.pertemuanDefault || 1));
  const [materi, setMateri] = useState("");
  const [catatan, setCatatan] = useState("");
  const [selectedLpDetailId, setSelectedLpDetailId] = useState<number | undefined>(
    route.params?.lessonPlanDetailId
  );
  const [availableRppDetails, setAvailableRppDetails] = useState<LessonPlanDetailItem[]>([]);
  const [isRppApproved, setIsRppApproved] = useState<boolean>(true);
  const [rppStatusNote, setRppStatusNote] = useState<string>("");

  // Update params if route changes
  useEffect(() => {
    if (route.params?.jadwalId) {
      setActiveJadwalId(route.params.jadwalId);
      setActiveKelasId(route.params.kelasId);
      setActiveMapelId(route.params.mapelId);
      setActiveKelasNama(route.params.kelasNama || "");
      setActiveMapelNama(route.params.mapelNama || "");
      if (route.params.lessonPlanDetailId) {
        setSelectedLpDetailId(route.params.lessonPlanDetailId);
      }
    }
  }, [route.params]);

  // Fetch teacher schedules for schedule picker
  const fetchSchedules = useCallback(async () => {
    if (!teacherPegawaiId) return;
    try {
      setLoadingSchedules(true);
      const data = await jadwalService.getJadwalPelajaran({ pegawai_id: teacherPegawaiId });
      setSchedules(data);
    } catch (err: any) {
      console.warn("Gagal memuat jadwal:", err.message);
    } finally {
      setLoadingSchedules(false);
    }
  }, [teacherPegawaiId]);

  useEffect(() => {
    if (!activeJadwalId) {
      fetchSchedules();
    }
  }, [activeJadwalId, fetchSchedules]);

  // Fetch student and LP data when active schedule is set
  const fetchAttendanceData = useCallback(async () => {
    if (!activeKelasId || !activeJadwalId) return;
    try {
      setLoading(true);

      // 1. Ambil daftar siswa
      const siswas = await absensiService.getSiswaByKelas(activeKelasId);
      setSiswaList(siswas);

      // Default semua siswa "Hadir"
      const defaultAtt: { [key: number]: AttendanceStatusType } = {};
      siswas.forEach((s) => {
        defaultAtt[s.siswa_id] = "Hadir";
      });

      // 2. Ambil Lesson Plan (RPP) jika ada untuk jadwal ini
      if (activeJadwalId) {
        try {
          const lps = await absensiService.getLessonPlans({ jadwal_id: activeJadwalId });
          if (lps && lps.length > 0) {
            const currentLp = lps[0];
            const approved = isLessonPlanApproved(currentLp);
            setIsRppApproved(approved);

            if (!approved) {
              setRppStatusNote(
                `Status RPP: Kepsek (${currentLp.status_verifikasi_kepsek || "Menunggu"}), Direktur (${currentLp.status_verifikasi_direktur || "Menunggu"})`
              );
            }

            if (currentLp.details) {
              setAvailableRppDetails(currentLp.details);
              const matchingDetail = currentLp.details.find(
                (d) => Number(d.pertemuan_ke) === Number(pertemuanKe)
              );
              if (matchingDetail) {
                setSelectedLpDetailId(matchingDetail.detail_id);
                if (matchingDetail.materi || matchingDetail.topik_materi) {
                  setMateri(matchingDetail.topik_materi || matchingDetail.materi || "");
                }
              }
            }
          } else {
            // No RPP found
            setIsRppApproved(false);
            setRppStatusNote("Belum ada Lesson Plan (RPP) yang diunggah untuk jadwal ini.");
          }
        } catch (e) {
          console.log("No lesson plan found", e);
          setIsRppApproved(false);
          setRppStatusNote("Gagal memvalidasi status verifikasi RPP.");
        }

        // 3. Cek apakah sudah pernah ada jurnal & absensi tersimpan
        try {
          const jurnals = await absensiService.getJurnalMengajar({
            jadwal_id: activeJadwalId,
          });
          const existingForPertemuan = jurnals.find(
            (j) => Number(j.pertemuan_ke) === Number(pertemuanKe)
          );
          if (existingForPertemuan) {
            if (existingForPertemuan.catatan_tambahan) {
              setMateri(existingForPertemuan.catatan_tambahan);
            }
            if (
              existingForPertemuan.absensi_pelajaran &&
              existingForPertemuan.absensi_pelajaran.length > 0
            ) {
              existingForPertemuan.absensi_pelajaran.forEach((ab) => {
                defaultAtt[ab.siswa_id] = (ab.status as AttendanceStatusType) || "Hadir";
              });
            }
          }
        } catch (e) {
          console.log("No existing journal found", e);
        }
      }

      setAttendance(defaultAtt);
    } catch (err: any) {
      Alert.alert("Gagal Memuat Data", err.message || "Terjadi kesalahan saat memuat siswa.");
    } finally {
      setLoading(false);
    }
  }, [activeKelasId, activeJadwalId, pertemuanKe]);

  useEffect(() => {
    if (activeJadwalId && activeKelasId) {
      fetchAttendanceData();
    }
  }, [activeJadwalId, activeKelasId, fetchAttendanceData]);

  const selectSchedule = (s: JadwalItem) => {
    setActiveJadwalId(s.jadwal_id);
    setActiveKelasId(s.kelas_id);
    setActiveMapelId(s.mapel_id);
    setActiveKelasNama(s.kelas?.nama_kelas || `Kelas ${s.kelas_id}`);
    setActiveMapelNama(s.mapel?.nama_mapel || `Mapel ${s.mapel_id}`);
  };

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

  const filteredSchedules = useMemo(() => {
    return schedules.filter(
      (s) => (s.hari || "").toLowerCase() === activeDay.toLowerCase()
    );
  }, [schedules, activeDay]);

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

  const handleSubmit = async () => {
    if (!canManageKBM(user)) {
      Alert.alert("Akses Ditolak", "Anda tidak memiliki hak akses untuk menyimpan presensi.");
      return;
    }

    if (!activeJadwalId || !activeKelasId || !activeMapelId) {
      Alert.alert("Data Tidak Lengkap", "Jadwal dan kelas belum dipilih dengan benar.");
      return;
    }

    if (!isRppApproved) {
      Alert.alert(
        "Lesson Plan Belum Disetujui",
        `Lesson Plan (RPP) untuk "${activeMapelNama} - ${activeKelasNama}" belum disetujui oleh Kepala Sekolah & Direktur.\n\nSesuai aturan kurikulum, presensi dan jurnal mengajar baru dapat diisi dan disimpan setelah RPP berstatus "Disetujui".`
      );
      return;
    }

    if (!materi.trim() && !catatan.trim()) {
      Alert.alert(
        "Materi / Catatan Pembelajaran",
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
        jadwal_id: activeJadwalId,
        kelas_id: activeKelasId,
        mapel_id: activeMapelId,
        tanggal: new Date().toISOString().split("T")[0],
        pertemuan_ke: Number(pertemuanKe) || 1,
        materi_diajarkan: materi.trim(),
        catatan_guru: catatan.trim(),
        catatan_tambahan: materi.trim() || catatan.trim(),
        lesson_plan_detail_id: selectedLpDetailId,
        status: "Sesuai",
        detail_absensi,
      });

      Alert.alert(
        "Presensi Berhasil Disimpan",
        `Data presensi (${summary.hadir} Hadir, ${summary.sakit} Sakit, ${summary.izin} Izin, ${summary.alpha} Alpha, ${summary.dispen} Dispen) & Jurnal Mengajar telah tersimpan di sistem.`,
        [
          {
            text: "OK",
            onPress: () => {
              if (route.params?.jadwalId) {
                navigation.goBack();
              } else {
                setActiveJadwalId(undefined);
              }
            },
          }
        ]
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Gagal menyimpan presensi.";
      Alert.alert("Gagal Menyimpan Presensi", msg);
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
  // VIEW 1: PILIH JADWAL / KELAS (JIKA BELUM ADA JADWAL TERPILIH)
  // ═══════════════════════════════════════════════════════
  if (!activeJadwalId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Header
          title="Absensi Mapel"
          subtitle="Pilih Jadwal Mengajar untuk Presensi & Jurnal"
          showBack={navigation.canGoBack()}
          onBack={() => navigation.goBack()}
        />

        {/* Filter Hari */}
        <View style={styles.daysFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysScroll}
          >
            {DAYS.map((day) => {
              const isSelected = activeDay.toLowerCase() === day.toLowerCase();
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayTabBtn, isSelected && styles.dayTabBtnActive]}
                  onPress={() => setActiveDay(day)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.dayTabText, isSelected && styles.dayTabTextActive]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loadingSchedules ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat jadwal mengajar...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loadingSchedules}
                onRefresh={fetchSchedules}
                colors={[Colors.primary]}
              />
            }
          >
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Jadwal Hari {activeDay}</Text>
              <Text style={styles.pickerSubtitle}>
                Ketuk jadwal untuk memulai pengisian presensi santri
              </Text>
            </View>

            {filteredSchedules.length === 0 ? (
              <View style={styles.emptyScheduleCard}>
                <Calendar size={36} color="#94A3B8" />
                <Text style={styles.emptyScheduleTitle}>Tidak Ada Jadwal Mengajar</Text>
                <Text style={styles.emptyScheduleDesc}>
                  Tidak ada jadwal mengajar yang tercatat untuk hari {activeDay}.
                </Text>
              </View>
            ) : (
              filteredSchedules.map((item) => (
                <TouchableOpacity
                  key={item.jadwal_id}
                  style={styles.scheduleCard}
                  onPress={() => selectSchedule(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.scheduleCardHeader}>
                    <View style={styles.scheduleBadgeWrap}>
                      <Badge
                        label={`Kelas ${item.kelas?.nama_kelas || item.kelas_id}`}
                        variant="primary"
                      />
                      {item.jam_ke && (
                        <View style={styles.jamKeBadge}>
                          <Text style={styles.jamKeText}>Jam ke-{item.jam_ke}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.actionBtnSmall}>
                      <Text style={styles.actionBtnText}>Isi Presensi</Text>
                      <ChevronRight size={14} color="#1D4ED8" />
                    </View>
                  </View>

                  <Text style={styles.scheduleMapelName}>
                    {item.mapel?.nama_mapel || "Mata Pelajaran"}
                  </Text>

                  <View style={styles.scheduleCardFooter}>
                    <View style={styles.scheduleTimeRow}>
                      <Clock size={13} color="#64748B" />
                      <Text style={styles.scheduleTimeText}>
                        {typeof item.jam_mulai === "object" && item.jam_mulai?.jam_mulai
                          ? `${item.jam_mulai.jam_mulai} - ${item.jam_selesai?.jam_selesai || ""}`
                          : typeof item.jam_mulai === "string"
                          ? `${item.jam_mulai} - ${item.jam_selesai || ""}`
                          : "Waktu KBM"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════
  // VIEW 2: FORM PENGISIAN PRESENSI & JURNAL KBM
  // ═══════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Form Presensi & Jurnal"
        subtitle={`${activeMapelNama || "Mapel"} • ${activeKelasNama || "Kelas"}`}
        showBack
        onBack={() => {
          if (route.params?.jadwalId) {
            navigation.goBack();
          } else {
            setActiveJadwalId(undefined);
          }
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat data presensi & siswa...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Switch Schedule Header Option */}
          {!route.params?.jadwalId && (
            <TouchableOpacity
              style={styles.switchScheduleBtn}
              onPress={() => setActiveJadwalId(undefined)}
              activeOpacity={0.8}
            >
              <RotateCcw size={14} color="#1D4ED8" />
              <Text style={styles.switchScheduleText}>Ganti Jadwal / Kelas Lain</Text>
            </TouchableOpacity>
          )}

          {/* RPP Lock Warning Banner if not approved */}
          {!isRppApproved && (
            <View style={styles.lockWarningBanner}>
              <View style={styles.lockWarningIcon}>
                <AlertTriangle size={20} color="#b45309" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.lockWarningTitle}>
                  Lesson Plan (RPP) Belum Disetujui
                </Text>
                <Text style={styles.lockWarningDesc}>
                  Sesuai aturan kurikulum, pengisian presensi dan jurnal mengajar terkunci sampai RPP disetujui oleh Kepala Sekolah & Direktur.
                </Text>
                {rppStatusNote ? (
                  <Text style={styles.lockWarningStatus}>{rppStatusNote}</Text>
                ) : null}
              </View>
            </View>
          )}

          {/* Sesi & Informasi Card */}
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mapelHeading}>{activeMapelNama || "Mata Pelajaran"}</Text>
                <Text style={styles.kelasHeading}>{activeKelasNama || "Kelas"}</Text>
              </View>
              <Badge label={`${siswaList.length} Siswa`} variant="primary" />
            </View>

            {/* Input Pertemuan & Materi */}
            <View style={styles.inputRow}>
              <View style={{ width: 90 }}>
                <Text style={styles.fieldLabel}>Pertemuan</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={pertemuanKe}
                  onChangeText={setPertemuanKe}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.fieldLabel}>Materi / Topik KBM *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={materi}
                  onChangeText={setMateri}
                  placeholder="Tulis materi yang diajarkan..."
                />
              </View>
            </View>

            {/* Catatan Guru */}
            <View style={{ marginTop: 10 }}>
              <Text style={styles.fieldLabel}>Catatan Pembelajaran (Opsional)</Text>
              <TextInput
                style={[styles.fieldInput, { height: 60, textAlignVertical: "top" }]}
                value={catatan}
                onChangeText={setCatatan}
                placeholder="Catatan kendala / keaktifan kelas..."
                multiline
              />
            </View>
          </Card>

          {/* Summary Status Bar */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: Colors.hadir }]}>{summary.hadir}</Text>
              <Text style={styles.summaryLabel}>Hadir</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: Colors.sakit }]}>{summary.sakit}</Text>
              <Text style={styles.summaryLabel}>Sakit</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: Colors.izin }]}>{summary.izin}</Text>
              <Text style={styles.summaryLabel}>Izin</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: Colors.alpha }]}>{summary.alpha}</Text>
              <Text style={styles.summaryLabel}>Alpha</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: "#8B5CF6" }]}>{summary.dispen}</Text>
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
                <Text style={[styles.quickBtnText, { color: Colors.hadir }]}>Semua Hadir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: Colors.infoBg }]}
                onPress={() => setAllStatus("Sakit")}
                activeOpacity={0.8}
              >
                <Text style={[styles.quickBtnText, { color: Colors.sakit }]}>Semua Sakit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: Colors.warningBg }]}
                onPress={() => setAllStatus("Izin")}
                activeOpacity={0.8}
              >
                <Text style={[styles.quickBtnText, { color: Colors.izin }]}>Semua Izin</Text>
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
              title={submitting ? "Menyimpan..." : "Simpan Presensi & Jurnal"}
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
  daysFilterContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  daysScroll: {
    gap: 8,
  },
  dayTabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  dayTabBtnActive: {
    backgroundColor: "#1D4ED8",
  },
  dayTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  dayTabTextActive: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748B",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  pickerHeader: {
    marginBottom: 14,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
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
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  jamKeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#1D4ED8",
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
    marginBottom: 10,
  },
  scheduleCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  scheduleTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  scheduleTimeText: {
    fontSize: 11.5,
    color: "#64748B",
  },
  scheduleLembagaText: {
    fontSize: 11.5,
    color: "#94A3B8",
    fontWeight: "600",
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
  lockWarningBanner: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  lockWarningIcon: {
    marginTop: 2,
  },
  lockWarningTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#92400E",
    marginBottom: 2,
  },
  lockWarningDesc: {
    fontSize: 11.5,
    color: "#B45309",
    lineHeight: 16,
  },
  lockWarningStatus: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
    marginTop: 4,
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
  inputRow: {
    flexDirection: "row",
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
