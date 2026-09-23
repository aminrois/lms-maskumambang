// mobile/src/screens/Absensi/AbsensiMapelScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
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
import { useAuthStore } from "../../store/useAuthStore";
import { canManageKBM } from "../../utils/permissions";
import { isLessonPlanApproved } from "../../utils/jadwalHelper";

export const AbsensiMapelScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const {
    jadwalId,
    kelasId,
    mapelId,
    kelasNama,
    mapelNama,
    pertemuanDefault = 1,
    lessonPlanDetailId,
  } = route.params || {};

  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Kehadiran siswa: { [siswa_id]: AttendanceStatusType }
  const [attendance, setAttendance] = useState<{ [key: number]: AttendanceStatusType }>({});
  const [pertemuanKe, setPertemuanKe] = useState(String(pertemuanDefault || 1));
  const [materi, setMateri] = useState("");
  const [catatan, setCatatan] = useState("");
  const [selectedLpDetailId, setSelectedLpDetailId] = useState<number | undefined>(lessonPlanDetailId);
  const [availableRppDetails, setAvailableRppDetails] = useState<LessonPlanDetailItem[]>([]);
  const [isRppApproved, setIsRppApproved] = useState<boolean>(true);
  const [rppStatusNote, setRppStatusNote] = useState<string>("");

  useEffect(() => {
    // Check permission to manage KBM
    if (!canManageKBM(user)) {
      Alert.alert(
        "Akses Ditolak",
        "Anda tidak memiliki hak akses untuk menginput presensi & jurnal KBM.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }

    const fetchData = async () => {
      if (!kelasId && !jadwalId) return;
      try {
        setLoading(true);

        // 1. Ambil daftar siswa
        const siswas = await absensiService.getSiswaByKelas(kelasId);
        setSiswaList(siswas);

        // Default semua siswa "Hadir"
        const defaultAtt: { [key: number]: AttendanceStatusType } = {};
        siswas.forEach((s) => {
          defaultAtt[s.siswa_id] = "Hadir";
        });

        // 2. Ambil Lesson Plan (RPP) jika ada untuk jadwal ini
        if (jadwalId) {
          try {
            const lps = await absensiService.getLessonPlans({ jadwal_id: jadwalId });
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
            console.log("No lesson plan found or error fetching lesson plan", e);
            setIsRppApproved(false);
            setRppStatusNote("Gagal memvalidasi status verifikasi RPP.");
          }

          // 3. Cek apakah sudah pernah ada jurnal & absensi tersimpan untuk jadwal & pertemuan ini
          try {
            const jurnals = await absensiService.getJurnalMengajar({
              jadwal_id: jadwalId,
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
    };

    fetchData();
  }, [kelasId, jadwalId, pertemuanKe, user]);

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
    let hadir = 0, sakit = 0, izin = 0, alpha = 0, dispen = 0;
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

    if (!isRppApproved) {
      Alert.alert(
        "Lesson Plan Belum Disetujui",
        `Lesson Plan (RPP) untuk "${mapelNama} - ${kelasNama}" belum disetujui oleh Kepala Sekolah & Direktur.\n\nSesuai aturan kurikulum, presensi dan jurnal mengajar baru dapat diisi dan disimpan setelah RPP berstatus "Disetujui".`
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
        jadwal_id: jadwalId,
        kelas_id: kelasId,
        mapel_id: mapelId,
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
        [{ text: "OK", onPress: () => navigation.goBack() }]
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Form Presensi & Jurnal"
        subtitle={`${mapelNama || "Mapel"} • ${kelasNama || "Kelas"}`}
        showBack
        onBack={() => navigation.goBack()}
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
                <Text style={styles.mapelHeading}>{mapelNama || "Mata Pelajaran"}</Text>
                <Text style={styles.kelasHeading}>{kelasNama || "Kelas"}</Text>
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
                  editable={isRppApproved}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.fieldLabel}>Topik / Materi Pembelajaran</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={materi}
                  onChangeText={setMateri}
                  placeholder="Contoh: Bab 3 Hukum Tajwid / Aljabar"
                  editable={isRppApproved}
                />
              </View>
            </View>

            {/* Rekomendasi Topik RPP jika tersedia */}
            {availableRppDetails.length > 0 && (
              <View style={styles.rppSection}>
                <View style={styles.rppHeader}>
                  <BookOpen size={12} color={Colors.primary} />
                  <Text style={styles.rppLabel}>Topik Terkait RPP (Silabus):</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 4 }}>
                  {availableRppDetails.map((det) => (
                    <TouchableOpacity
                      key={det.detail_id}
                      style={[
                        styles.rppChip,
                        selectedLpDetailId === det.detail_id && styles.rppChipActive,
                      ]}
                      onPress={() => {
                        if (!isRppApproved) return;
                        setSelectedLpDetailId(det.detail_id);
                        setPertemuanKe(String(det.pertemuan_ke));
                        if (det.materi || det.topik_materi) {
                          setMateri(det.topik_materi || det.materi || "");
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.rppChipText,
                          selectedLpDetailId === det.detail_id && styles.rppChipTextActive,
                        ]}
                      >
                        P-{det.pertemuan_ke}: {det.topik_materi || det.materi || "Topik RPP"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </Card>

          {/* Quick Actions (Set All Hadir) */}
          <View style={styles.quickActionRow}>
            <Text style={styles.quickActionHeading}>Daftar Kehadiran Siswa</Text>
            <TouchableOpacity
              style={[styles.setAllBtn, !isRppApproved && { opacity: 0.5 }]}
              onPress={() => isRppApproved && setAllStatus("Hadir")}
              activeOpacity={0.7}
              disabled={!isRppApproved}
            >
              <CheckCheck size={14} color={Colors.primary} />
              <Text style={styles.setAllText}>Set Semua Hadir</Text>
            </TouchableOpacity>
          </View>

          {/* Summary Chips */}
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryBox, { backgroundColor: Colors.successBg }]}>
              <Text style={[styles.summaryCount, { color: Colors.hadir }]}>{summary.hadir}</Text>
              <Text style={styles.summaryLabel}>Hadir</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: Colors.infoBg }]}>
              <Text style={[styles.summaryCount, { color: Colors.sakit }]}>{summary.sakit}</Text>
              <Text style={styles.summaryLabel}>Sakit</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: Colors.warningBg }]}>
              <Text style={[styles.summaryCount, { color: Colors.izin }]}>{summary.izin}</Text>
              <Text style={styles.summaryLabel}>Izin</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: Colors.dangerBg }]}>
              <Text style={[styles.summaryCount, { color: Colors.alpha }]}>{summary.alpha}</Text>
              <Text style={styles.summaryLabel}>Alpha</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: "#F5F3FF" }]}>
              <Text style={[styles.summaryCount, { color: "#8B5CF6" }]}>{summary.dispen}</Text>
              <Text style={styles.summaryLabel}>Dispen</Text>
            </View>
          </View>

          {/* Search Siswa */}
          <View style={styles.searchContainer}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Cari siswa berdasarkan nama / NISN..."
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {filteredSiswa.map((siswa, idx) => {
            const currentStatus = attendance[siswa.siswa_id] || "Hadir";
            return (
              <View key={siswa.siswa_id} style={styles.siswaRow}>
                <View style={styles.siswaIndex}>
                  <Text style={styles.indexText}>{idx + 1}</Text>
                </View>
                <View style={styles.siswaInfo}>
                  <Text style={styles.siswaNama} numberOfLines={1}>
                    {siswa.nama || siswa.nama_lengkap || "Siswa"}
                  </Text>
                  <Text style={styles.siswaNis}>
                    NISN: {siswa.nisn || "-"}
                    {siswa.nis ? ` • NIS: ${siswa.nis}` : ""}
                  </Text>
                </View>

                {/* Status Toggle Buttons (H, S, I, A, D) */}
                <View style={styles.statusButtonsGroup}>
                  {statusOptions.map((opt) => {
                    const isActive = currentStatus === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => isRppApproved && handleStatusChange(siswa.siswa_id, opt.value)}
                        style={[
                          styles.statusOptionBtn,
                          isActive && { backgroundColor: opt.color, borderColor: opt.color },
                          !isRppApproved && { opacity: 0.5 },
                        ]}
                        activeOpacity={0.7}
                        disabled={!isRppApproved}
                      >
                        <Text
                          style={[
                            styles.statusOptionText,
                            isActive && { color: "#FFFFFF" },
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
          })}

          {filteredSiswa.length === 0 && (
            <Card style={styles.emptySearchCard}>
              <Text style={styles.emptySearchText}>
                Tidak ditemukan siswa dengan kata kunci "{searchQuery}"
              </Text>
            </Card>
          )}

          {/* Submit Action */}
          <View style={styles.bottomActionContainer}>
            <Button
              title={
                !isRppApproved
                  ? "RPP BELUM DISETUJUI (TERKUNCI)"
                  : "SIMPAN PRESENSI & JURNAL"
              }
              onPress={handleSubmit}
              loading={submitting}
              size="lg"
              icon={
                !isRppApproved ? (
                  <Lock size={18} color="#FFFFFF" />
                ) : (
                  <Save size={18} color="#FFFFFF" />
                )
              }
              style={[
                styles.saveBtn,
                !isRppApproved && { backgroundColor: "#94a3b8" },
              ]}
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
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748b",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  lockWarningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fffbeb",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
    marginBottom: 14,
  },
  lockWarningIcon: {
    marginTop: 2,
  },
  lockWarningTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#b45309",
  },
  lockWarningDesc: {
    fontSize: 11,
    color: "#92400e",
    marginTop: 2,
    lineHeight: 16,
  },
  lockWarningStatus: {
    fontSize: 10,
    fontWeight: "700",
    color: "#b45309",
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
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
    color: "#1e293b",
  },
  kelasHeading: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  inputRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    color: "#1e293b",
  },
  rppSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  rppHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rppLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803d",
  },
  rppChip: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  rppChipActive: {
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
  },
  rppChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },
  rppChipTextActive: {
    color: "#15803d",
  },
  quickActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  quickActionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e293b",
  },
  setAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  setAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803d",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  summaryBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  summaryCount: {
    fontSize: 16,
    fontWeight: "900",
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#1e293b",
  },
  siswaRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
    color: "#94a3b8",
  },
  siswaInfo: {
    flex: 1,
    marginLeft: 6,
    marginRight: 8,
  },
  siswaNama: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1e293b",
  },
  siswaNis: {
    fontSize: 10,
    color: "#64748b",
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
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  statusOptionText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
  },
  emptySearchCard: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
  },
  emptySearchText: {
    fontSize: 12,
    color: "#64748b",
  },
  bottomActionContainer: {
    marginTop: 14,
  },
  saveBtn: {
    backgroundColor: "#065f46",
  },
});
