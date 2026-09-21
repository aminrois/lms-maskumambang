// mobile/src/screens/Tahfidz/TahfidzSetoranScreen.tsx
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
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  Sparkles,
  BookOpen,
  ScrollText,
  Bookmark,
  CheckCircle,
  Save,
  User,
  Clock,
  ChevronDown
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";
import { tahfidzService, TahfidzSiswaItem } from "../../api/tahfidzService";

export const TahfidzSetoranScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [kategori, setKategori] = useState<"Al-Quran" | "Hadits" | "Matan Ilmu">("Al-Quran");
  const [jenisSetoran, setJenisSetoran] = useState<"Setoran Baru" | "Setoran Ulang">("Setoran Baru");
  const [santriList, setSantriList] = useState<TahfidzSiswaItem[]>([]);
  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Common Form
  const [kelancaran, setKelancaran] = useState<string>("Lancar");
  const [catatan, setCatatan] = useState<string>("");
  const [durasi, setDurasi] = useState<string>("15");

  // Al-Quran Form
  const [suratMulai, setSuratMulai] = useState<string>("Al-Baqarah");
  const [ayatMulai, setAyatMulai] = useState<string>("1");
  const [ayatSelesai, setAyatSelesai] = useState<string>("20");

  // Hadits Form
  const [kitabHadits, setKitabHadits] = useState<string>("Hadits Arbain/Khamsin");
  const [haditsNoMulai, setHaditsNoMulai] = useState<string>("1");
  const [haditsNoSelesai, setHaditsNoSelesai] = useState<string>("5");

  // Matan Form
  const [namaMatan, setNamaMatan] = useState<string>("Tuhfatul Athfal");
  const [baitMulai, setBaitMulai] = useState<string>("1");
  const [baitSelesai, setBaitSelesai] = useState<string>("10");

  useEffect(() => {
    const fetchSantri = async () => {
      try {
        setLoading(true);
        const data = await tahfidzService.getSantriTahfidz();
        setSantriList(data);
        if (data.length > 0) {
          setSelectedSiswaId(data[0].siswa_id);
        }
      } catch (err: any) {
        Alert.alert("Gagal Memuat Santri", err.message || "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    };
    fetchSantri();
  }, []);

  const handleSubmit = async () => {
    if (!selectedSiswaId) {
      Alert.alert("Santri Wajib Dipilih", "Harap pilih santri yang menyetorkan hafalan.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        siswa_id: selectedSiswaId,
        kategori,
        jenis_hafalan: jenisSetoran,
        tanggal: new Date().toISOString().split("T")[0],
        durasi_menit: Number(durasi) || 15,
        kelancaran,
        catatan_guru: catatan.trim(),
      };

      if (kategori === "Al-Quran") {
        payload.surat_mulai_nama = suratMulai;
        payload.surat_selesai_nama = suratMulai;
        payload.ayat_mulai = Number(ayatMulai) || 1;
        payload.ayat_selesai = Number(ayatSelesai) || 1;
        payload.total_ayat = Math.max(1, (payload.ayat_selesai - payload.ayat_mulai + 1));
      } else if (kategori === "Hadits") {
        payload.kitab_hadits = kitabHadits;
        payload.hadits_no_mulai = Number(haditsNoMulai) || 1;
        payload.hadits_no_selesai = Number(haditsNoSelesai) || 1;
        payload.total_hadits = Math.max(1, (payload.hadits_no_selesai - payload.hadits_no_mulai + 1));
      } else if (kategori === "Matan Ilmu") {
        payload.nama_matan = namaMatan;
        payload.bait_mulai = Number(baitMulai) || 1;
        payload.bait_selesai = Number(baitSelesai) || 1;
        payload.total_bait = Math.max(1, (payload.bait_selesai - payload.bait_mulai + 1));
      }

      await tahfidzService.submitSetoran(payload);
      Alert.alert("Berhasil Disimpan", "Catatan setoran hafalan santri telah berhasil tersimpan.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert("Gagal Menyimpan", err.response?.data?.message || err.message || "Terjadi kendala.");
    } finally {
      setSubmitting(false);
    }
  };

  const kelancaranList = ["Sangat Lancar", "Lancar", "Kurang Lancar", "Belum Lancar"];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Setoran Hafalan Santri"
        subtitle="Tahfidz & Hafalan"
        showBack
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat data santri binaan...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Pilih Santri */}
          <Card style={styles.card}>
            <Text style={styles.sectionHeading}>1. Pilih Santri Binaan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.santriScroll}>
              {santriList.map((s) => {
                const isSelected = s.siswa_id === selectedSiswaId;
                return (
                  <TouchableOpacity
                    key={s.siswa_id}
                    onPress={() => setSelectedSiswaId(s.siswa_id)}
                    style={[styles.santriChip, isSelected && styles.santriChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.santriChipName, isSelected && styles.santriChipNameActive]}>
                      {s.nama}
                    </Text>
                    <Text style={[styles.santriChipClass, isSelected && styles.santriChipClassActive]}>
                      {s.kelas?.nama_kelas || "Santri"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Card>

          {/* Kategori Tab */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setKategori("Al-Quran")}
              style={[styles.tabButton, kategori === "Al-Quran" && styles.tabButtonActive]}
            >
              <BookOpen size={14} color={kategori === "Al-Quran" ? "#FFFFFF" : Colors.textSub} />
              <Text style={[styles.tabText, kategori === "Al-Quran" && styles.tabTextActive]}>Al-Qur'an</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setKategori("Hadits")}
              style={[styles.tabButton, kategori === "Hadits" && styles.tabButtonActive]}
            >
              <ScrollText size={14} color={kategori === "Hadits" ? "#FFFFFF" : Colors.textSub} />
              <Text style={[styles.tabText, kategori === "Hadits" && styles.tabTextActive]}>Hadits</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setKategori("Matan Ilmu")}
              style={[styles.tabButton, kategori === "Matan Ilmu" && styles.tabButtonActive]}
            >
              <Bookmark size={14} color={kategori === "Matan Ilmu" ? "#FFFFFF" : Colors.textSub} />
              <Text style={[styles.tabText, kategori === "Matan Ilmu" && styles.tabTextActive]}>Matan</Text>
            </TouchableOpacity>
          </View>

          {/* Jenis Setoran */}
          <Card style={styles.card}>
            <Text style={styles.sectionHeading}>2. Jenis Setoran</Text>
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => setJenisSetoran("Setoran Baru")}
                style={[styles.jenisBtn, jenisSetoran === "Setoran Baru" && styles.jenisBtnActiveZiyadah]}
              >
                <Text style={[styles.jenisBtnText, jenisSetoran === "Setoran Baru" && styles.jenisBtnTextActive]}>
                  ✨ Ziyadah (Baru)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setJenisSetoran("Setoran Ulang")}
                style={[styles.jenisBtn, jenisSetoran === "Setoran Ulang" && styles.jenisBtnActiveMurajaah]}
              >
                <Text style={[styles.jenisBtnText, jenisSetoran === "Setoran Ulang" && styles.jenisBtnTextActive]}>
                  🔄 Muraja'ah (Ulang)
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Form Detail Capaian */}
          <Card style={styles.card}>
            <Text style={styles.sectionHeading}>3. Capaian Hafalan ({kategori})</Text>

            {kategori === "Al-Quran" && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Surat</Text>
                <TextInput
                  style={styles.input}
                  value={suratMulai}
                  onChangeText={setSuratMulai}
                  placeholder="Contoh: Al-Baqarah"
                />

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={styles.label}>Ayat Mulai</Text>
                    <TextInput
                      style={styles.input}
                      value={ayatMulai}
                      onChangeText={setAyatMulai}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <Text style={styles.label}>Ayat Selesai</Text>
                    <TextInput
                      style={styles.input}
                      value={ayatSelesai}
                      onChangeText={setAyatSelesai}
                      keyboardType="numeric"
                      placeholder="20"
                    />
                  </View>
                </View>
              </View>
            )}

            {kategori === "Hadits" && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Kitab Hadits</Text>
                <TextInput
                  style={styles.input}
                  value={kitabHadits}
                  onChangeText={setKitabHadits}
                  placeholder="Contoh: Hadits Arbain"
                />

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={styles.label}>No. Hadits Mulai</Text>
                    <TextInput
                      style={styles.input}
                      value={haditsNoMulai}
                      onChangeText={setHaditsNoMulai}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <Text style={styles.label}>No. Hadits Selesai</Text>
                    <TextInput
                      style={styles.input}
                      value={haditsNoSelesai}
                      onChangeText={setHaditsNoSelesai}
                      keyboardType="numeric"
                      placeholder="5"
                    />
                  </View>
                </View>
              </View>
            )}

            {kategori === "Matan Ilmu" && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Matan</Text>
                <TextInput
                  style={styles.input}
                  value={namaMatan}
                  onChangeText={setNamaMatan}
                  placeholder="Contoh: Tuhfatul Athfal"
                />

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={styles.label}>Bait Mulai</Text>
                    <TextInput
                      style={styles.input}
                      value={baitMulai}
                      onChangeText={setBaitMulai}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <Text style={styles.label}>Bait Selesai</Text>
                    <TextInput
                      style={styles.input}
                      value={baitSelesai}
                      onChangeText={setBaitSelesai}
                      keyboardType="numeric"
                      placeholder="10"
                    />
                  </View>
                </View>
              </View>
            )}
          </Card>

          {/* Kelancaran & Catatan */}
          <Card style={styles.card}>
            <Text style={styles.sectionHeading}>4. Evaluasi & Catatan</Text>

            <Text style={styles.label}>Kelancaran</Text>
            <View style={styles.kelancaranGrid}>
              {kelancaranList.map((k) => {
                const isSelected = kelancaran === k;
                return (
                  <TouchableOpacity
                    key={k}
                    onPress={() => setKelancaran(k)}
                    style={[styles.kelancaranBtn, isSelected && styles.kelancaranBtnActive]}
                  >
                    <Text style={[styles.kelancaranBtnText, isSelected && styles.kelancaranBtnTextActive]}>
                      {k}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>Catatan Pembimbing</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={catatan}
              onChangeText={setCatatan}
              multiline
              numberOfLines={3}
              placeholder="Catatan tajwid, makhraj, atau kelancaran santri..."
            />
          </Card>

          {/* Submit Action */}
          <Button
            title="SIMPAN SETORAN HAFALAN"
            onPress={handleSubmit}
            loading={submitting}
            size="lg"
            icon={<Save size={18} color="#FFFFFF" />}
            style={styles.saveBtn}
          />
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
  card: {
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    padding: 16,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.primaryDark,
    marginBottom: 10,
  },
  santriScroll: {
    flexDirection: "row",
  },
  santriChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  santriChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  santriChipName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
  },
  santriChipNameActive: {
    color: "#FFFFFF",
  },
  santriChipClass: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  santriChipClassActive: {
    color: "#FACC15",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: Colors.primaryDark,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSub,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  jenisBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.inputBg,
  },
  jenisBtnActiveZiyadah: {
    backgroundColor: Colors.hadir,
    borderColor: Colors.hadir,
  },
  jenisBtnActiveMurajaah: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  jenisBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSub,
  },
  jenisBtnTextActive: {
    color: "#FFFFFF",
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.text,
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
  },
  kelancaranGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  kelancaranBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  kelancaranBtnActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  kelancaranBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSub,
  },
  kelancaranBtnTextActive: {
    color: "#FFFFFF",
  },
  saveBtn: {
    marginTop: 8,
    backgroundColor: Colors.hadir,
  },
});
