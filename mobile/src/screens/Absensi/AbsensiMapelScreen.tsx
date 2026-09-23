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
} from "../../api/absensiService";

export const AbsensiMapelScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

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

  useEffect(() => {
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
            if (lps && lps.length > 0 && lps[0].details) {
              setAvailableRppDetails(lps[0].details);
              const matchingDetail = lps[0].details.find(
                (d) => Number(d.pertemuan_ke) === Number(pertemuanKe)
              );
              if (matchingDetail) {
                setSelectedLpDetailId(matchingDetail.detail_id);
                if (matchingDetail.materi || matchingDetail.topik_materi) {
                  setMateri(matchingDetail.topik_materi || matchingDetail.materi || "");
                }
              }
            }
          } catch (e) {
            console.log("No lesson plan found or error fetching lesson plan", e);
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
  }, [kelasId, jadwalId, pertemuanKe]);

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
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.fieldLabel}>Topik / Materi Pembelajaran</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={materi}
                  onChangeText={setMateri}
                  placeholder="Contoh: Bab 3 Hukum Tajwid / Aljabar"
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

          {/* Quick Counter Summary & Action Set All */}
          <View style={styles.summaryBar}>
            <View style={styles.summaryBadges}>
              <View style={[styles.miniBadge, { backgroundColor: Colors.successBg }]}>
                <Text style={[styles.miniBadgeText, { color: Colors.hadir }]}>
                  H: {summary.hadir}
                </Text>
              </View>
              <View style={[styles.miniBadge, { backgroundColor: Colors.infoBg }]}>
                <Text style={[styles.miniBadgeText, { color: Colors.sakit }]}>
                  S: {summary.sakit}
                </Text>
              </View>
              <View style={[styles.miniBadge, { backgroundColor: Colors.warningBg }]}>
                <Text style={[styles.miniBadgeText, { color: Colors.izin }]}>
                  I: {summary.izin}
                </Text>
              </View>
              <View style={[styles.miniBadge, { backgroundColor: Colors.dangerBg }]}>
                <Text style={[styles.miniBadgeText, { color: Colors.alpha }]}>
                  A: {summary.alpha}
                </Text>
              </View>
              <View style={[styles.miniBadge, { backgroundColor: "#F5F3FF" }]}>
                <Text style={[styles.miniBadgeText, { color: "#8B5CF6" }]}>
                  D: {summary.dispen}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setAllStatus("Hadir")}
              style={styles.setAllBtn}
              activeOpacity={0.7}
            >
              <CheckCheck size={14} color={Colors.primary} />
              <Text style={styles.setAllText}>Set Semua Hadir</Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchWrapper}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari siswa atau NISN..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          {/* List Siswa */}
          <View style={styles.listHeaderRow}>
            <Text style={styles.listSectionTitle}>
              Daftar Kehadiran Siswa ({filteredSiswa.length})
            </Text>
            <Text style={styles.listLegend}>H / S / I / A / D</Text>
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
                        onPress={() => handleStatusChange(siswa.siswa_id, opt.value)}
                        style={[
                          styles.statusOptionBtn,
                          isActive && { backgroundColor: opt.color, borderColor: opt.color },
                        ]}
                        activeOpacity={0.7}
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
              title="SIMPAN PRESENSI & JURNAL"
              onPress={handleSubmit}
              loading={submitting}
              size="lg"
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
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    padding: 14,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  mapelHeading: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.primaryDark,
  },
  kelasHeading: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSub,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: "row",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    color: Colors.text,
  },
  rppSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  rppHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rppLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  rppChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rppChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  rppChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSub,
  },
  rppChipTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  summaryBadges: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
    flex: 1,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
  },
  setAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  setAllText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: Colors.primary,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.primaryDark,
  },
  listLegend: {
    fontSize: 10.5,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  siswaRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  siswaIndex: {
    width: 20,
    alignItems: "center",
  },
  indexText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  siswaInfo: {
    flex: 1,
    marginLeft: 6,
    marginRight: 6,
  },
  siswaNama: {
    fontSize: 13.5,
    fontWeight: "700",
    color: Colors.text,
  },
  siswaNis: {
    fontSize: 10.5,
    color: Colors.textMuted,
    marginTop: 1,
  },
  statusButtonsGroup: {
    flexDirection: "row",
    gap: 3,
  },
  statusOptionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  statusOptionText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textSub,
  },
  emptySearchCard: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  emptySearchText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
  },
  bottomActionContainer: {
    marginTop: 14,
  },
  saveBtn: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});

