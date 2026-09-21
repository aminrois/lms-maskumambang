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
  CheckCircle,
  Users,
  Calendar,
  BookOpen,
  Save,
  CheckCheck,
  FileText,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { absensiService, SiswaItem } from "../../api/absensiService";

type AttendanceStatus = "Hadir" | "Sakit" | "Izin" | "Alpha";

export const AbsensiMapelScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { jadwalId, kelasId, mapelId, kelasNama, mapelNama } = route.params || {};

  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State kehadiran siswa: { [siswa_id]: "Hadir" | "Sakit" | "Izin" | "Alpha" }
  const [attendance, setAttendance] = useState<{ [key: number]: AttendanceStatus }>({});
  const [pertemuanKe, setPertemuanKe] = useState("1");
  const [materi, setMateri] = useState("");
  const [catatan, setCatatan] = useState("");

  useEffect(() => {
    const fetchSiswa = async () => {
      if (!kelasId) return;
      try {
        setLoading(true);
        const data = await absensiService.getSiswaByKelas(kelasId);
        setSiswaList(data);

        // Default semua siswa "Hadir"
        const defaultAtt: { [key: number]: AttendanceStatus } = {};
        data.forEach((s) => {
          defaultAtt[s.siswa_id] = "Hadir";
        });
        setAttendance(defaultAtt);
      } catch (err: any) {
        Alert.alert("Gagal Mengambil Siswa", err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchSiswa();
  }, [kelasId]);

  const setAllStatus = (status: AttendanceStatus) => {
    const updated: { [key: number]: AttendanceStatus } = {};
    siswaList.forEach((s) => {
      updated[s.siswa_id] = status;
    });
    setAttendance(updated);
  };

  const handleStatusChange = (siswaId: number, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [siswaId]: status,
    }));
  };

  const summary = useMemo(() => {
    let hadir = 0, sakit = 0, izin = 0, alpha = 0;
    Object.values(attendance).forEach((st) => {
      if (st === "Hadir") hadir++;
      else if (st === "Sakit") sakit++;
      else if (st === "Izin") izin++;
      else if (st === "Alpha") alpha++;
    });
    return { hadir, sakit, izin, alpha, total: siswaList.length };
  }, [attendance, siswaList]);

  const handleSubmit = async () => {
    if (!materi.trim()) {
      Alert.alert("Materi Pembelajaran", "Harap isi ringkasan materi/topik yang diajarkan hari ini.");
      return;
    }

    try {
      setSubmitting(true);
      const detail_absensi = Object.entries(attendance).map(([sId, status]) => ({
        siswa_id: Number(sId),
        status: status as any,
      }));

      await absensiService.submitAbsensiMapel({
        jadwal_id: jadwalId,
        kelas_id: kelasId,
        mapel_id: mapelId,
        tanggal: new Date().toISOString().split("T")[0],
        pertemuan_ke: Number(pertemuanKe) || 1,
        materi_diajarkan: materi.trim(),
        catatan_guru: catatan.trim(),
        detail_absensi,
      });

      Alert.alert("Presensi Berhasil Disimpan", "Data presensi & jurnal mengajar telah berhasil tersimpan.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert("Gagal Menyimpan", err.response?.data?.message || err.message || "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions: { label: string; value: AttendanceStatus; color: string; bg: string }[] = [
    { label: "H", value: "Hadir", color: Colors.hadir, bg: Colors.successBg },
    { label: "S", value: "Sakit", color: Colors.sakit, bg: Colors.infoBg },
    { label: "I", value: "Izin", color: Colors.izin, bg: Colors.warningBg },
    { label: "A", value: "Alpha", color: Colors.alpha, bg: Colors.dangerBg },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Form Presensi Siswa"
        subtitle={`${mapelNama || "Mapel"} • ${kelasNama || "Kelas"}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat daftar siswa...</Text>
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
              <View>
                <Text style={styles.mapelHeading}>{mapelNama}</Text>
                <Text style={styles.kelasHeading}>{kelasNama}</Text>
              </View>
              <Badge label={`${siswaList.length} Siswa`} variant="primary" />
            </View>

            {/* Input Pertemuan & Materi */}
            <View style={styles.inputRow}>
              <View style={{ width: 100 }}>
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
                <Text style={styles.fieldLabel}>Topik / Materi Diajarkan</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={materi}
                  onChangeText={setMateri}
                  placeholder="Contoh: Bab 3 Hukum Tajwid"
                />
              </View>
            </View>
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

          {/* List Siswa */}
          <Text style={styles.listSectionTitle}>Daftar Kehadiran Siswa</Text>
          {siswaList.map((siswa, idx) => {
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

                {/* Status Toggle Buttons (H, S, I, A) */}
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

          {/* Submit Action */}
          <View style={styles.bottomActionContainer}>
            <Button
              title="SIMPAN PRESENSI"
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
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  mapelHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primaryDark,
  },
  kelasHeading: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSub,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: "row",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  fieldLabel: {
    fontSize: 12,
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
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.text,
  },
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  summaryBadges: {
    flexDirection: "row",
    gap: 6,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  setAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  setAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  listSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.primaryDark,
    marginBottom: 10,
  },
  siswaRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  siswaIndex: {
    width: 24,
    alignItems: "center",
  },
  indexText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  siswaInfo: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  siswaNama: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  siswaNis: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusButtonsGroup: {
    flexDirection: "row",
    gap: 4,
  },
  statusOptionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textSub,
  },
  bottomActionContainer: {
    marginTop: 16,
  },
  saveBtn: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
