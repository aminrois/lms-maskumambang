// mobile/src/screens/Guidance/GuidanceCatatSesiScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  ChevronLeft,
  MessageSquarePlus,
  User,
  School,
  Building,
  Calendar,
  Save,
  CheckCircle2,
} from "lucide-react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { guidanceService } from "../../api/guidanceService";

export const GuidanceCatatSesiScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { siswaId, namaSiswa, namaKelas, namaLembaga } = route.params || {};

  const [kategori, setKategori] = useState("Akademik");
  const [topik, setTopik] = useState("");
  const [keluhan, setKeluhan] = useState("");
  const [solusi, setSolusi] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const [tanggalSesi, setTanggalSesi] = useState(todayStr);

  const handleSave = async () => {
    if (!topik.trim() || !keluhan.trim()) {
      Alert.alert("Perhatian", "Harap isi Topik Masalah dan Keluhan / Uraian Masalah santri.");
      return;
    }

    try {
      setIsSubmitting(true);
      await guidanceService.createKonseling({
        siswa_id: Number(siswaId),
        tanggal_sesi: tanggalSesi,
        kategori,
        topik_konseling: topik.trim(),
        keluhan_masalah: keluhan.trim(),
        solusi_kesepakatan: solusi.trim() || undefined,
      });

      Alert.alert("Berhasil", "Sesi konsultasi santri berhasil dicatat.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Gagal Menyimpan",
        err.response?.data?.message || "Terjadi kesalahan saat mencatat sesi konsultasi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#162E6E" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ChevronLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Catat Sesi Konsultasi</Text>
          <Text style={styles.headerSubtitle}>Dokumentasi Bimbingan & Konseling Santri</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Student Info Card */}
          <View style={styles.studentCard}>
            <View style={styles.studentAvatar}>
              <Text style={styles.studentAvatarText}>
                {namaSiswa ? namaSiswa.charAt(0).toUpperCase() : "S"}
              </Text>
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentLabel}>SANTRI BINAAN</Text>
              <Text style={styles.studentName} numberOfLines={2}>
                {namaSiswa || "Santri Binaan"}
              </Text>
              <View style={styles.metaRow}>
                {namaKelas ? (
                  <View style={styles.metaBadge}>
                    <School size={11} color="#1E40AF" />
                    <Text style={styles.metaBadgeText}>Kelas {namaKelas}</Text>
                  </View>
                ) : null}
                {namaLembaga ? (
                  <View style={[styles.metaBadge, styles.metaBadgeSecondary]}>
                    <Building size={11} color="#475569" />
                    <Text style={[styles.metaBadgeText, styles.metaBadgeTextSecondary]}>
                      {namaLembaga}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Tanggal Sesi */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tanggal Sesi Konsultasi</Text>
              <View style={styles.dateInputWrapper}>
                <Calendar size={16} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.dateTextInput}
                  value={tanggalSesi}
                  onChangeText={setTanggalSesi}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Kategori Masalah */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Kategori Masalah</Text>
              <View style={styles.pillContainer}>
                {["Akademik", "Karakter", "Sosial", "Keluarga", "Karier"].map((k) => {
                  const isSelected = kategori === k;
                  return (
                    <TouchableOpacity
                      key={k}
                      style={[styles.pill, isSelected && styles.pillActive]}
                      onPress={() => setKategori(k)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                        {k}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Topik / Judul Masalah */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Topik / Judul Masalah <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Evaluasi KBM & Kedisiplinan Asrama"
                placeholderTextColor="#94A3B8"
                value={topik}
                onChangeText={setTopik}
              />
            </View>

            {/* Keluhan / Uraian Masalah */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Keluhan / Uraian Masalah <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Jelaskan pokok permasalahan, latar belakang kendala, atau poin yang diceritakan santri..."
                placeholderTextColor="#94A3B8"
                value={keluhan}
                onChangeText={setKeluhan}
              />
            </View>

            {/* Solusi & Kesepakatan */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Solusi & Rencana Tindak Lanjut</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={3}
                placeholder="Tuliskan rekomendasi bimbingan, komitmen santri, atau arahan yang disepakati bersama..."
                placeholderTextColor="#94A3B8"
                value={solusi}
                onChangeText={setSolusi}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSave}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <CheckCircle2 size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Simpan Sesi Konsultasi</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#162E6E",
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginRight: 10,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#CBD5E1",
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  studentAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  studentAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E40AF",
  },
  studentInfo: {
    flex: 1,
  },
  studentLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  studentName: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  metaBadgeSecondary: {
    backgroundColor: "#F1F5F9",
  },
  metaBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#1E40AF",
  },
  metaBadgeTextSecondary: {
    color: "#475569",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  required: {
    color: "#DC2626",
    fontWeight: "800",
  },
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "600",
  },
  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pillActive: {
    backgroundColor: "#162E6E",
    borderColor: "#162E6E",
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  pillTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 12,
    color: "#0F172A",
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    fontSize: 12,
    color: "#0F172A",
    textAlignVertical: "top",
    minHeight: 80,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#162E6E",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#162E6E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
