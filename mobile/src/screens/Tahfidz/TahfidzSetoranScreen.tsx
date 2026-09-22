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
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  BookOpen,
  ScrollText,
  Bookmark,
  CheckCircle,
  Save,
  User,
  Clock,
  ChevronDown,
  Search,
  X,
  Calendar,
  Check,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";
import { tahfidzService, TahfidzSiswaItem } from "../../api/tahfidzService";
import { QURAN_SURAHS, SurahInfo } from "../../data/quranSurahList";
import { HADITS_BOOK_PRESETS, MATAN_PRESETS, KELANCARAN_OPTIONS } from "../../data/tahfidzPresets";

type KategoriHafalan = "Al-Quran" | "Hadits" | "Matan Ilmu";
type JenisSetoran = "Setoran Baru" | "Setoran Ulang";

export const TahfidzSetoranScreen = () => {
  const navigation = useNavigation<any>();

  // Kategori & Sesi
  const [kategori, setKategori] = useState<KategoriHafalan>("Al-Quran");
  const [jenisSetoran, setJenisSetoran] = useState<JenisSetoran>("Setoran Baru");
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split("T")[0]);
  const [durasiMenit, setDurasiMenit] = useState<string>("15");
  const [kelancaran, setKelancaran] = useState<string>("Lancar");
  const [catatanGuru, setCatatanGuru] = useState<string>("");

  // Santri State
  const [santriList, setSantriList] = useState<TahfidzSiswaItem[]>([]);
  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(null);
  const [santriSearch, setSantriSearch] = useState<string>("");
  const [isSantriModalOpen, setIsSantriModalOpen] = useState<boolean>(false);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. Al-Qur'an State
  const [suratMulaiNo, setSuratMulaiNo] = useState<number>(1);
  const [ayatMulai, setAyatMulai] = useState<string>("1");
  const [suratSelesaiNo, setSuratSelesaiNo] = useState<number>(1);
  const [ayatSelesai, setAyatSelesai] = useState<string>("7");
  const [surahPickerTarget, setSurahPickerTarget] = useState<"mulai" | "selesai" | null>(null);
  const [surahSearch, setSurahSearch] = useState<string>("");

  // 2. Hadits State
  const [kitabHadits, setKitabHadits] = useState<string>("Hadits Arbain/Khamsin");
  const [customKitabHadits, setCustomKitabHadits] = useState<string>("");
  const [isHaditsModalOpen, setIsHaditsModalOpen] = useState<boolean>(false);
  const [haditsNoMulai, setHaditsNoMulai] = useState<string>("1");
  const [haditsNoSelesai, setHaditsNoSelesai] = useState<string>("5");

  // 3. Matan Ilmu State
  const [namaMatan, setNamaMatan] = useState<string>("Tuhfatul Athfal");
  const [customNamaMatan, setCustomNamaMatan] = useState<string>("");
  const [isMatanModalOpen, setIsMatanModalOpen] = useState<boolean>(false);
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

  // Selected Siswa Object
  const activeSiswa = useMemo(() => {
    return santriList.find((s) => s.siswa_id === selectedSiswaId) || null;
  }, [santriList, selectedSiswaId]);

  // Filtered Santri List for Search Modal
  const filteredSantriList = useMemo(() => {
    if (!santriSearch.trim()) return santriList;
    const q = santriSearch.toLowerCase();
    return santriList.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q)) ||
        (s.kelas?.nama_kelas && s.kelas.nama_kelas.toLowerCase().includes(q))
    );
  }, [santriList, santriSearch]);

  // Current Surah Mulai & Selesai Objects
  const currentSurahMulai = useMemo(() => {
    return QURAN_SURAHS.find((s) => s.number === suratMulaiNo) || QURAN_SURAHS[0];
  }, [suratMulaiNo]);

  const currentSurahSelesai = useMemo(() => {
    return QURAN_SURAHS.find((s) => s.number === suratSelesaiNo) || QURAN_SURAHS[0];
  }, [suratSelesaiNo]);

  // Filtered Surah for Picker
  const filteredSurahList = useMemo(() => {
    if (!surahSearch.trim()) return QURAN_SURAHS;
    const q = surahSearch.toLowerCase();
    return QURAN_SURAHS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.number).includes(q) ||
        s.arabic.includes(q)
    );
  }, [surahSearch]);

  // Calculated Total Ayat
  const calculatedTotalAyat = useMemo(() => {
    const aMulai = Number(ayatMulai) || 1;
    const aSelesai = Number(ayatSelesai) || 1;
    if (suratMulaiNo === suratSelesaiNo) {
      return Math.max(1, aSelesai - aMulai + 1);
    }
    let total = currentSurahMulai.totalVerses - aMulai + 1;
    for (let i = suratMulaiNo + 1; i < suratSelesaiNo; i++) {
      const s = QURAN_SURAHS.find((item) => item.number === i);
      if (s) total += s.totalVerses;
    }
    total += aSelesai;
    return total;
  }, [suratMulaiNo, suratSelesaiNo, ayatMulai, ayatSelesai, currentSurahMulai]);

  // Calculated Total Hadits
  const calculatedTotalHadits = useMemo(() => {
    const hMulai = Number(haditsNoMulai) || 1;
    const hSelesai = Number(haditsNoSelesai) || 1;
    return Math.max(1, hSelesai - hMulai + 1);
  }, [haditsNoMulai, haditsNoSelesai]);

  // Calculated Total Bait
  const calculatedTotalBait = useMemo(() => {
    const bMulai = Number(baitMulai) || 1;
    const bSelesai = Number(baitSelesai) || 1;
    return Math.max(1, bSelesai - bMulai + 1);
  }, [baitMulai, baitSelesai]);

  // Submit Handler
  const handleSubmit = async () => {
    if (!selectedSiswaId) {
      Alert.alert("Peringatan", "Harap pilih santri yang menyetorkan hafalan.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        siswa_id: selectedSiswaId,
        kategori,
        jenis_hafalan: jenisSetoran,
        tanggal,
        durasi_menit: Number(durasiMenit) || 15,
        kelancaran,
        catatan_guru: catatanGuru.trim(),
      };

      if (kategori === "Al-Quran") {
        payload.surat_mulai = suratMulaiNo;
        payload.surat_mulai_nama = currentSurahMulai.name;
        payload.ayat_mulai = Number(ayatMulai) || 1;
        payload.surat_selesai = suratSelesaiNo;
        payload.surat_selesai_nama = currentSurahSelesai.name;
        payload.ayat_selesai = Number(ayatSelesai) || 1;
        payload.total_ayat = calculatedTotalAyat;
      } else if (kategori === "Hadits") {
        payload.kitab_hadits = kitabHadits === "Hadits Lainnya (Kustom)" ? customKitabHadits.trim() || kitabHadits : kitabHadits;
        payload.hadits_no_mulai = Number(haditsNoMulai) || 1;
        payload.hadits_no_selesai = Number(haditsNoSelesai) || 1;
        payload.total_hadits = calculatedTotalHadits;
      } else if (kategori === "Matan Ilmu") {
        payload.nama_matan = namaMatan === "Matan Lainnya (Kustom)" ? customNamaMatan.trim() || namaMatan : namaMatan;
        payload.bait_mulai = Number(baitMulai) || 1;
        payload.bait_selesai = Number(baitSelesai) || 1;
        payload.total_bait = calculatedTotalBait;
      }

      await tahfidzService.submitSetoran(payload);
      Alert.alert("Berhasil Disimpan", "Catatan setoran hafalan santri telah berhasil tersimpan.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert("Gagal Menyimpan", err.response?.data?.message || err.message || "Terjadi kendala saat menyimpan setoran.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Input Setoran Hafalan"
        subtitle="Tahfidz & Hafalan Santri"
        showBack
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat data santri...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ─── 1. PILIH SANTRI (DROPDOWN WITH SEARCH) ─── */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.stepBadge}>
                <User size={14} color="#15803d" />
              </View>
              <Text style={styles.sectionHeading}>1. Pilih Santri</Text>
            </View>

            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setIsSantriModalOpen(true)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownLeft}>
                {activeSiswa ? (
                  <View>
                    <Text style={styles.dropdownSelectedName}>{activeSiswa.nama}</Text>
                    <Text style={styles.dropdownSelectedMeta}>
                      Kelas: {activeSiswa.kelas?.nama_kelas || "-"} • NISN: {activeSiswa.nisn || "-"}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.dropdownPlaceholder}>-- Cari & Pilih Santri --</Text>
                )}
              </View>
              <ChevronDown size={18} color={Colors.textSub} />
            </TouchableOpacity>

            {/* Active Santri Highlight Card */}
            {activeSiswa && (
              <View style={styles.activeSantriBox}>
                <View style={styles.activeSantriAvatar}>
                  <Text style={styles.activeSantriAvatarText}>{activeSiswa.nama.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeSantriLabel}>SANTRI TERPILIH</Text>
                  <Text style={styles.activeSantriName}>{activeSiswa.nama}</Text>
                  <Text style={styles.activeSantriSub}>
                    {activeSiswa.kelas?.nama_kelas || "Kelas Santri"}
                  </Text>
                </View>
              </View>
            )}
          </Card>

          {/* ─── 2. PARAMETER SESI ─── */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.stepBadge, { backgroundColor: "#dbeafe" }]}>
                <Clock size={14} color="#1d4ed8" />
              </View>
              <Text style={styles.sectionHeading}>2. Parameter Sesi</Text>
            </View>

            {/* Jenis Setoran */}
            <Text style={styles.label}>Jenis Setoran</Text>
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

            {/* Tanggal & Durasi */}
            <View style={[styles.row, { marginTop: 12 }]}>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.label}>Tanggal</Text>
                <View style={styles.inputWithIcon}>
                  <Calendar size={14} color={Colors.textMuted} style={{ marginRight: 6 }} />
                  <TextInput
                    style={styles.cleanInput}
                    value={tanggal}
                    onChangeText={setTanggal}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
              <View style={{ flex: 0.8 }}>
                <Text style={styles.label}>Durasi (Menit)</Text>
                <TextInput
                  style={styles.input}
                  value={durasiMenit}
                  onChangeText={setDurasiMenit}
                  keyboardType="numeric"
                  placeholder="15"
                />
              </View>
            </View>
          </Card>

          {/* ─── 3. KATEGORI HAFALAN TABS ─── */}
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
              <Text style={[styles.tabText, kategori === "Matan Ilmu" && styles.tabTextActive]}>Matan Ilmu</Text>
            </TouchableOpacity>
          </View>

          {/* ─── 4. DETAIL CAPAIAN HAFALAN ─── */}
          <Card style={styles.card}>
            <Text style={styles.sectionHeading}>3. Capaian Hafalan ({kategori})</Text>

            {/* === AL-QUR'AN FORM === */}
            {kategori === "Al-Quran" && (
              <View style={styles.formGroup}>
                {/* Surat Mulai & Ayat Mulai */}
                <View style={styles.subCard}>
                  <Text style={styles.subCardTitle}>🟢 DARI (SURAT & AYAT AWAL)</Text>
                  
                  <Text style={styles.label}>Pilih Surat Awal</Text>
                  <TouchableOpacity
                    style={styles.pickerTrigger}
                    onPress={() => {
                      setSurahSearch("");
                      setSurahPickerTarget("mulai");
                    }}
                  >
                    <Text style={styles.pickerTriggerText}>
                      {currentSurahMulai.number}. {currentSurahMulai.name} ({currentSurahMulai.totalVerses} Ayat)
                    </Text>
                    <ChevronDown size={16} color={Colors.textSub} />
                  </TouchableOpacity>

                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Ayat Mulai</Text>
                    <TextInput
                      style={styles.input}
                      value={ayatMulai}
                      onChangeText={setAyatMulai}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>
                </View>

                {/* Surat Selesai & Ayat Selesai */}
                <View style={[styles.subCard, { marginTop: 10 }]}>
                  <Text style={styles.subCardTitle}>🔴 SAMPAI (SURAT & AYAT AKHIR)</Text>
                  
                  <Text style={styles.label}>Pilih Surat Akhir</Text>
                  <TouchableOpacity
                    style={styles.pickerTrigger}
                    onPress={() => {
                      setSurahSearch("");
                      setSurahPickerTarget("selesai");
                    }}
                  >
                    <Text style={styles.pickerTriggerText}>
                      {currentSurahSelesai.number}. {currentSurahSelesai.name} ({currentSurahSelesai.totalVerses} Ayat)
                    </Text>
                    <ChevronDown size={16} color={Colors.textSub} />
                  </TouchableOpacity>

                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Ayat Selesai</Text>
                    <TextInput
                      style={styles.input}
                      value={ayatSelesai}
                      onChangeText={setAyatSelesai}
                      keyboardType="numeric"
                      placeholder="7"
                    />
                  </View>
                </View>

                {/* Total Ayat Badge */}
                <View style={styles.totalBadgeBox}>
                  <Text style={styles.totalBadgeLabel}>Total Capaian Ayat:</Text>
                  <Text style={styles.totalBadgeValue}>{calculatedTotalAyat} Ayat</Text>
                </View>
              </View>
            )}

            {/* === HADITS FORM === */}
            {kategori === "Hadits" && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Pilih Kitab Hadits</Text>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setIsHaditsModalOpen(true)}
                >
                  <Text style={styles.pickerTriggerText}>{kitabHadits}</Text>
                  <ChevronDown size={16} color={Colors.textSub} />
                </TouchableOpacity>

                {kitabHadits === "Hadits Lainnya (Kustom)" && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Nama Kitab Kustom</Text>
                    <TextInput
                      style={styles.input}
                      value={customKitabHadits}
                      onChangeText={setCustomKitabHadits}
                      placeholder="Tulis nama kitab hadits..."
                    />
                  </View>
                )}

                <View style={[styles.row, { marginTop: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>No. Hadits Mulai</Text>
                    <TextInput
                      style={styles.input}
                      value={haditsNoMulai}
                      onChangeText={setHaditsNoMulai}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
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

                <View style={styles.totalBadgeBox}>
                  <Text style={styles.totalBadgeLabel}>Total Hadits Disetor:</Text>
                  <Text style={styles.totalBadgeValue}>{calculatedTotalHadits} Hadits</Text>
                </View>
              </View>
            )}

            {/* === MATAN ILMU FORM === */}
            {kategori === "Matan Ilmu" && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Pilih Nama Matan</Text>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setIsMatanModalOpen(true)}
                >
                  <Text style={styles.pickerTriggerText}>{namaMatan}</Text>
                  <ChevronDown size={16} color={Colors.textSub} />
                </TouchableOpacity>

                {namaMatan === "Matan Lainnya (Kustom)" && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Nama Matan Kustom</Text>
                    <TextInput
                      style={styles.input}
                      value={customNamaMatan}
                      onChangeText={setCustomNamaMatan}
                      placeholder="Tulis nama matan ilmu..."
                    />
                  </View>
                )}

                <View style={[styles.row, { marginTop: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Bait Mulai</Text>
                    <TextInput
                      style={styles.input}
                      value={baitMulai}
                      onChangeText={setBaitMulai}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
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

                <View style={styles.totalBadgeBox}>
                  <Text style={styles.totalBadgeLabel}>Total Bait Disetor:</Text>
                  <Text style={styles.totalBadgeValue}>{calculatedTotalBait} Bait</Text>
                </View>
              </View>
            )}
          </Card>

          {/* ─── 5. KELANCARAN & CATATAN GURU ─── */}
          <Card style={styles.card}>
            <Text style={styles.sectionHeading}>4. Evaluasi & Catatan</Text>

            <Text style={styles.label}>Tingkat Kelancaran</Text>
            <View style={styles.kelancaranGrid}>
              {KELANCARAN_OPTIONS.map((opt) => {
                const isSelected = kelancaran === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setKelancaran(opt.value)}
                    style={[styles.kelancaranBtn, isSelected && styles.kelancaranBtnActive]}
                  >
                    <Text style={[styles.kelancaranBtnText, isSelected && styles.kelancaranBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Catatan Guru / Pembimbing</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={catatanGuru}
              onChangeText={setCatatanGuru}
              multiline
              numberOfLines={3}
              placeholder="Contoh: Tajwid dan kelancaran sangat baik. Perhatikan panjang mad di ayat 15."
            />
          </Card>

          {/* ─── SUBMIT ACTION ─── */}
          <Button
            title="SIMPAN CATATAN SETORAN"
            onPress={handleSubmit}
            loading={submitting}
            size="lg"
            icon={<Save size={18} color="#FFFFFF" />}
            style={styles.saveBtn}
          />
        </ScrollView>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: SEARCHABLE SANTRI PICKER
      ════════════════════════════════════════════════════════ */}
      <Modal
        visible={isSantriModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSantriModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Santri Binaan</Text>
              <TouchableOpacity
                onPress={() => setIsSantriModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.modalSearchBar}>
              <Search size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Cari nama atau NISN santri..."
                value={santriSearch}
                onChangeText={setSantriSearch}
                autoFocus={false}
              />
              {santriSearch.length > 0 && (
                <TouchableOpacity onPress={() => setSantriSearch("")}>
                  <X size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <FlatList
              data={filteredSantriList}
              keyExtractor={(item) => String(item.siswa_id)}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => {
                const isSelected = item.siswa_id === selectedSiswaId;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setSelectedSiswaId(item.siswa_id);
                      setIsSantriModalOpen(false);
                    }}
                  >
                    <View style={styles.modalItemAvatar}>
                      <Text style={styles.modalItemAvatarText}>{item.nama.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.modalItemName, isSelected && styles.modalItemNameSelected]}>
                        {item.nama}
                      </Text>
                      <Text style={styles.modalItemMeta}>
                        Kelas: {item.kelas?.nama_kelas || "-"} • NISN: {item.nisn || "-"}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color="#15803d" />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>Santri tidak ditemukan.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL: SEARCHABLE SURAH PICKER (114 SURAT)
      ════════════════════════════════════════════════════════ */}
      <Modal
        visible={surahPickerTarget !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSurahPickerTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {surahPickerTarget === "mulai" ? "Pilih Surat Awal" : "Pilih Surat Akhir"}
              </Text>
              <TouchableOpacity
                onPress={() => setSurahPickerTarget(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.modalSearchBar}>
              <Search size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Cari surat (contoh: Al-Baqarah, 2)..."
                value={surahSearch}
                onChangeText={setSurahSearch}
              />
              {surahSearch.length > 0 && (
                <TouchableOpacity onPress={() => setSurahSearch("")}>
                  <X size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* List Surah */}
            <FlatList
              data={filteredSurahList}
              keyExtractor={(item) => String(item.number)}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => {
                const currentNo = surahPickerTarget === "mulai" ? suratMulaiNo : suratSelesaiNo;
                const isSelected = item.number === currentNo;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      if (surahPickerTarget === "mulai") {
                        setSuratMulaiNo(item.number);
                        setAyatMulai("1");
                        if (item.number > suratSelesaiNo) {
                          setSuratSelesaiNo(item.number);
                          setAyatSelesai(String(Math.min(7, item.totalVerses)));
                        }
                      } else {
                        setSuratSelesaiNo(item.number);
                        setAyatSelesai(String(item.totalVerses));
                      }
                      setSurahPickerTarget(null);
                    }}
                  >
                    <View style={styles.surahNumberBadge}>
                      <Text style={styles.surahNumberText}>{item.number}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalItemName, isSelected && styles.modalItemNameSelected]}>
                        {item.name}
                      </Text>
                      <Text style={styles.modalItemMeta}>
                        {item.totalVerses} Ayat • {item.type}
                      </Text>
                    </View>
                    <Text style={styles.surahArabicText}>{item.arabic}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL: KITAB HADITS PICKER
      ════════════════════════════════════════════════════════ */}
      <Modal
        visible={isHaditsModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsHaditsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kitab Hadits</Text>
              <TouchableOpacity onPress={() => setIsHaditsModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={HADITS_BOOK_PRESETS}
              keyExtractor={(item) => item.name}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => {
                const isSelected = item.name === kitabHadits;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setKitabHadits(item.name);
                      setIsHaditsModalOpen(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalItemName, isSelected && styles.modalItemNameSelected]}>
                        {item.name}
                      </Text>
                      {item.description && (
                        <Text style={styles.modalItemMeta}>{item.description}</Text>
                      )}
                    </View>
                    {isSelected && <Check size={18} color="#15803d" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL: MATAN ILMU PICKER
      ════════════════════════════════════════════════════════ */}
      <Modal
        visible={isMatanModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsMatanModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Matan Ilmu</Text>
              <TouchableOpacity onPress={() => setIsMatanModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={MATAN_PRESETS}
              keyExtractor={(item) => item.name}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => {
                const isSelected = item.name === namaMatan;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setNamaMatan(item.name);
                      setIsMatanModalOpen(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalItemName, isSelected && styles.modalItemNameSelected]}>
                        {item.name}
                      </Text>
                      <Text style={styles.modalItemMeta}>
                        Bidang: {item.bidang} {item.defaultBait ? `(${item.defaultBait} Bait)` : ""}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color="#15803d" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
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
    borderRadius: 18,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.primaryDark,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownLeft: {
    flex: 1,
    marginRight: 8,
  },
  dropdownPlaceholder: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  dropdownSelectedName: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.text,
  },
  dropdownSelectedMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  activeSantriBox: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  activeSantriAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#15803d",
    alignItems: "center",
    justifyContent: "center",
  },
  activeSantriAvatarText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
  activeSantriLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#15803d",
    letterSpacing: 0.5,
  },
  activeSantriName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#14532d",
  },
  activeSantriSub: {
    fontSize: 10,
    color: "#166534",
    fontWeight: "600",
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
    marginTop: 4,
  },
  subCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  subCardTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textSub,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerTriggerText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
    marginRight: 6,
  },
  totalBadgeBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalBadgeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSub,
  },
  totalBadgeValue: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.primaryDark,
  },
  label: {
    fontSize: 11,
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
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  cleanInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
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
    flex: 1,
    minWidth: "45%",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: "50%",
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  modalSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    paddingVertical: 2,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  modalItemSelected: {
    backgroundColor: "#f0fdf4",
  },
  modalItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  modalItemAvatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.primaryDark,
  },
  modalItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  modalItemNameSelected: {
    color: "#15803d",
  },
  modalItemMeta: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  surahNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  surahNumberText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.primaryDark,
  },
  surahArabicText: {
    fontSize: 16,
    color: Colors.primaryDark,
    fontFamily: "System",
  },
  emptyList: {
    padding: 30,
    alignItems: "center",
  },
  emptyListText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
