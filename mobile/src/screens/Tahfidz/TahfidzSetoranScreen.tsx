// mobile/src/screens/Tahfidz/TahfidzSetoranScreen.tsx
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
  Modal,
  FlatList,
  RefreshControl,
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
  Users,
  Layers,
  History,
  Target,
  Copy,
  FolderClosed,
  ChevronRight,
  TrendingUp,
  Award,
  Filter,
  Lock,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { canInputTahfidz, canViewTahfidz } from "../../utils/permissions";
import {
  tahfidzService,
  TahfidzSiswaItem,
  HalaqahItem,
  KolosalSetoranItem,
} from "../../api/tahfidzService";
import { QURAN_SURAHS, SurahInfo } from "../../data/quranSurahList";
import { HADITS_BOOK_PRESETS, MATAN_PRESETS, KELANCARAN_OPTIONS } from "../../data/tahfidzPresets";

type ActiveTab = "input" | "riwayat" | "halaqah" | "target";
type ModeInput = "individu" | "kolosal";
type KategoriHafalan = "Al-Quran" | "Hadits" | "Matan Ilmu";
type JenisSetoran = "Setoran Baru" | "Setoran Ulang" | "Ujian";

interface SantriKolosalState {
  siswa_id: number;
  nama: string;
  kelas_nama?: string;
  selected: boolean;
  suratMulaiNo: number;
  ayatMulai: string;
  suratSelesaiNo: number;
  ayatSelesai: string;
  kitabHadits: string;
  haditsNoMulai: string;
  haditsNoSelesai: string;
  namaMatan: string;
  baitMulai: string;
  baitSelesai: string;
  kelancaran: "Sangat Lancar" | "Lancar" | "Kurang Lancar" | "Belum Lancar";
  catatan: string;
}

export const TahfidzSetoranScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const hasInputPermission = canInputTahfidz(user);

  // Main navigation tab (default to riwayat if not a tahfidz teacher)
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => (hasInputPermission ? "input" : "riwayat"));
  const [modeInput, setModeInput] = useState<ModeInput>("kolosal");

  // Global Session Controls
  const [kategori, setKategori] = useState<KategoriHafalan>("Al-Quran");
  const [jenisSetoran, setJenisSetoran] = useState<JenisSetoran>("Setoran Baru");
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split("T")[0]);
  const [durasiMenit, setDurasiMenit] = useState<string>("15");
  const [kelancaranGlobal, setKelancaranGlobal] = useState<"Sangat Lancar" | "Lancar" | "Kurang Lancar" | "Belum Lancar">("Lancar");
  const [catatanGlobal, setCatatanGlobal] = useState<string>("");

  // Global Template / Template Range
  const [templateSuratMulaiNo, setTemplateSuratMulaiNo] = useState<number>(1);
  const [templateAyatMulai, setTemplateAyatMulai] = useState<string>("1");
  const [templateSuratSelesaiNo, setTemplateSuratSelesaiNo] = useState<number>(1);
  const [templateAyatSelesai, setTemplateAyatSelesai] = useState<string>("7");
  const [templateKitabHadits, setTemplateKitabHadits] = useState<string>("Hadits Arbain/Khamsin");
  const [templateHaditsMulai, setTemplateHaditsMulai] = useState<string>("1");
  const [templateHaditsSelesai, setTemplateHaditsSelesai] = useState<string>("5");
  const [templateNamaMatan, setTemplateNamaMatan] = useState<string>("Tuhfatul Athfal");
  const [templateBaitMulai, setTemplateBaitMulai] = useState<string>("1");
  const [templateBaitSelesai, setTemplateBaitSelesai] = useState<string>("10");

  // Master Data
  const [santriList, setSantriList] = useState<TahfidzSiswaItem[]>([]);
  const [halaqahList, setHalaqahList] = useState<HalaqahItem[]>([]);
  const [selectedHalaqahId, setSelectedHalaqahId] = useState<number | "ALL">("ALL");

  // Mode Individu State
  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(null);
  const [isSantriModalOpen, setIsSantriModalOpen] = useState(false);
  const [santriSearch, setSantriSearch] = useState("");

  // Mode Kolosal State
  const [kolosalCards, setKolosalCards] = useState<SantriKolosalState[]>([]);

  // Surah / Book / Matan Picker Modals
  const [surahPickerTarget, setSurahPickerTarget] = useState<{
    type: "template_mulai" | "template_selesai" | "card_mulai" | "card_selesai";
    siswaId?: number;
  } | null>(null);
  const [surahSearch, setSurahSearch] = useState("");
  const [isHaditsModalOpen, setIsHaditsModalOpen] = useState(false);
  const [haditsPickerTarget, setHaditsPickerTarget] = useState<number | "template">("template");
  const [isMatanModalOpen, setIsMatanModalOpen] = useState(false);
  const [matanPickerTarget, setMatanPickerTarget] = useState<number | "template">("template");

  // Riwayat Tab State
  const [riwayatList, setRiwayatList] = useState<any[]>([]);
  const [riwayatLoading, setRiwayatLoading] = useState(false);
  const [riwayatJenisFilter, setRiwayatJenisFilter] = useState<string>("ALL");
  const [riwayatSearch, setRiwayatSearch] = useState<string>("");

  // Target Tab State
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [targetLoading, setTargetLoading] = useState(false);

  // Common UI State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [santriData, halaqahData] = await Promise.all([
        tahfidzService.getSantriTahfidz(),
        tahfidzService.getHalaqahList(),
      ]);
      setSantriList(santriData);
      setHalaqahList(halaqahData);

      if (santriData.length > 0 && !selectedSiswaId) {
        setSelectedSiswaId(santriData[0].siswa_id);
      }

      // Initialize kolosal cards
      const initialCards: SantriKolosalState[] = santriData.map((s: TahfidzSiswaItem) => ({
        siswa_id: s.siswa_id,
        nama: s.nama,
        kelas_nama: s.kelas?.nama_kelas,
        selected: true,
        suratMulaiNo: 1,
        ayatMulai: "1",
        suratSelesaiNo: 1,
        ayatSelesai: "7",
        kitabHadits: "Hadits Arbain/Khamsin",
        haditsNoMulai: "1",
        haditsNoSelesai: "5",
        namaMatan: "Tuhfatul Athfal",
        baitMulai: "1",
        baitSelesai: "10",
        kelancaran: "Lancar",
        catatan: "",
      }));
      setKolosalCards(initialCards);
    } catch (err: any) {
      Alert.alert("Gagal Memuat Data", err.message || "Terjadi kesalahan saat memuat data tahfidz.");
    } finally {
      setLoading(false);
    }
  }, [selectedSiswaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch Riwayat when activeTab changes to riwayat
  const fetchRiwayat = useCallback(async () => {
    try {
      setRiwayatLoading(true);
      const res = await tahfidzService.getSetoranList({
        jenis_hafalan: riwayatJenisFilter === "ALL" ? undefined : riwayatJenisFilter,
        limit: 50,
      });
      setRiwayatList(res.data || []);
    } catch (err: any) {
      console.warn("Gagal load riwayat:", err.message);
    } finally {
      setRiwayatLoading(false);
    }
  }, [riwayatJenisFilter]);

  // Fetch Target / Dashboard summary when target tab is active
  const fetchTargetData = useCallback(async () => {
    try {
      setTargetLoading(true);
      const summary = await tahfidzService.getDashboardSummary();
      setDashboardSummary(summary);
    } catch (err: any) {
      console.warn("Gagal load target summary:", err.message);
    } finally {
      setTargetLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "riwayat") {
      fetchRiwayat();
    } else if (activeTab === "target") {
      fetchTargetData();
    }
  }, [activeTab, fetchRiwayat, fetchTargetData]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === "input" || activeTab === "halaqah") {
      await fetchData();
    } else if (activeTab === "riwayat") {
      await fetchRiwayat();
    } else if (activeTab === "target") {
      await fetchTargetData();
    }
    setRefreshing(false);
  };

  // Filtered santri for Individu
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

  const activeSiswa = useMemo(() => {
    return santriList.find((s) => s.siswa_id === selectedSiswaId) || null;
  }, [santriList, selectedSiswaId]);

  // Kolosal filtered cards based on halaqah
  const displayedKolosalCards = useMemo(() => {
    if (selectedHalaqahId === "ALL") return kolosalCards;
    const targetHalaqah = halaqahList.find((h) => h.halaqah_id === selectedHalaqahId);
    if (!targetHalaqah || !targetHalaqah.anggota) return kolosalCards;
    const allowedSiswaIds = new Set(targetHalaqah.anggota.map((a) => a.siswa_id));
    return kolosalCards.filter((c) => allowedSiswaIds.has(c.siswa_id));
  }, [kolosalCards, selectedHalaqahId, halaqahList]);

  // Kolosal selection actions
  const toggleSelectAll = (select: boolean) => {
    const displayedIds = new Set(displayedKolosalCards.map((c) => c.siswa_id));
    setKolosalCards((prev) =>
      prev.map((c) => (displayedIds.has(c.siswa_id) ? { ...c, selected: select } : c))
    );
  };

  const toggleSelectCard = (siswa_id: number) => {
    setKolosalCards((prev) =>
      prev.map((c) => (c.siswa_id === siswa_id ? { ...c, selected: !c.selected } : c))
    );
  };

  const updateCardState = (siswa_id: number, updates: Partial<SantriKolosalState>) => {
    setKolosalCards((prev) =>
      prev.map((c) => (c.siswa_id === siswa_id ? { ...c, ...updates } : c))
    );
  };

  // Apply Global Template to All Selected Cards
  const applyTemplateToAll = () => {
    const selectedCount = kolosalCards.filter((c) => c.selected).length;
    if (selectedCount === 0) {
      Alert.alert("Peringatan", "Pilih minimal 1 santri terlebih dahulu.");
      return;
    }
    setKolosalCards((prev) =>
      prev.map((c) => {
        if (!c.selected) return c;
        return {
          ...c,
          suratMulaiNo: templateSuratMulaiNo,
          ayatMulai: templateAyatMulai,
          suratSelesaiNo: templateSuratSelesaiNo,
          ayatSelesai: templateAyatSelesai,
          kitabHadits: templateKitabHadits,
          haditsNoMulai: templateHaditsMulai,
          haditsNoSelesai: templateHaditsSelesai,
          namaMatan: templateNamaMatan,
          baitMulai: templateBaitMulai,
          baitSelesai: templateBaitSelesai,
          kelancaran: kelancaranGlobal,
          catatan: catatanGlobal,
        };
      })
    );
    Alert.alert("Sukses", `Pengaturan berhasil diterapkan ke ${selectedCount} santri terpilih.`);
  };

  // Surah Helper
  const getSurahName = (no: number) => {
    const s = QURAN_SURAHS.find((item) => item.number === no);
    return s ? `${s.number}. ${s.name}` : `Surat ${no}`;
  };

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

  const handleSelectSurah = (surahNumber: number) => {
    if (!surahPickerTarget) return;
    const { type, siswaId } = surahPickerTarget;

    if (type === "template_mulai") {
      setTemplateSuratMulaiNo(surahNumber);
      if (surahNumber > templateSuratSelesaiNo) {
        setTemplateSuratSelesaiNo(surahNumber);
      }
    } else if (type === "template_selesai") {
      setTemplateSuratSelesaiNo(surahNumber);
    } else if (siswaId) {
      if (type === "card_mulai") {
        updateCardState(siswaId, { suratMulaiNo: surahNumber });
      } else if (type === "card_selesai") {
        updateCardState(siswaId, { suratSelesaiNo: surahNumber });
      }
    }
    setSurahPickerTarget(null);
    setSurahSearch("");
  };

  const handleSelectHadits = (bookName: string) => {
    if (haditsPickerTarget === "template") {
      setTemplateKitabHadits(bookName);
    } else {
      updateCardState(haditsPickerTarget, { kitabHadits: bookName });
    }
    setIsHaditsModalOpen(false);
  };

  const handleSelectMatan = (matanName: string) => {
    if (matanPickerTarget === "template") {
      setTemplateNamaMatan(matanName);
    } else {
      updateCardState(matanPickerTarget, { namaMatan: matanName });
    }
    setIsMatanModalOpen(false);
  };

  // Submit Handler Individu
  const handleSubmitIndividu = async () => {
    if (!canInputTahfidz(user)) {
      Alert.alert("Akses Ditolak", "Hanya Guru Tahfidz dan Administrator yang dapat menginput setoran.");
      return;
    }
    if (!selectedSiswaId) {
      Alert.alert("Peringatan", "Harap pilih santri.");
      return;
    }
    try {
      setSubmitting(true);
      const surahMulaiObj = QURAN_SURAHS.find((s) => s.number === templateSuratMulaiNo);
      const surahSelesaiObj = QURAN_SURAHS.find((s) => s.number === templateSuratSelesaiNo);

      const payload: any = {
        siswa_id: selectedSiswaId,
        kategori,
        jenis_hafalan: jenisSetoran,
        tanggal,
        durasi_menit: Number(durasiMenit) || 15,
        kelancaran: kelancaranGlobal,
        catatan_guru: catatanGlobal.trim(),
      };

      if (kategori === "Al-Quran") {
        payload.surat_mulai = templateSuratMulaiNo;
        payload.surat_mulai_nama = surahMulaiObj?.name;
        payload.ayat_mulai = Number(templateAyatMulai) || 1;
        payload.surat_selesai = templateSuratSelesaiNo;
        payload.surat_selesai_nama = surahSelesaiObj?.name;
        payload.ayat_selesai = Number(templateAyatSelesai) || 1;
      } else if (kategori === "Hadits") {
        payload.kitab_hadits = templateKitabHadits;
        payload.hadits_no_mulai = Number(templateHaditsMulai) || 1;
        payload.hadits_no_selesai = Number(templateHaditsSelesai) || 1;
      } else if (kategori === "Matan Ilmu") {
        payload.nama_matan = templateNamaMatan;
        payload.bait_mulai = Number(templateBaitMulai) || 1;
        payload.bait_selesai = Number(templateBaitSelesai) || 1;
      }

      await tahfidzService.submitSetoran(payload);
      Alert.alert("Berhasil", "Setoran hafalan santri berhasil disimpan.");
    } catch (err: any) {
      Alert.alert("Gagal", err.response?.data?.message || err.message || "Gagal menyimpan setoran");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Handler Kolosal
  const handleSubmitKolosal = async () => {
    if (!canInputTahfidz(user)) {
      Alert.alert("Akses Ditolak", "Hanya Guru Tahfidz dan Administrator yang dapat menginput setoran.");
      return;
    }
    const selectedCards = displayedKolosalCards.filter((c) => c.selected);
    if (selectedCards.length === 0) {
      Alert.alert("Peringatan", "Pilih minimal 1 santri untuk setoran kolosal.");
      return;
    }

    try {
      setSubmitting(true);
      const items: KolosalSetoranItem[] = selectedCards.map((c) => {
        const item: KolosalSetoranItem = {
          siswa_id: c.siswa_id,
          kategori,
          jenis_hafalan: jenisSetoran,
          kelancaran: c.kelancaran,
          catatan_guru: c.catatan.trim() || undefined,
        };

        if (kategori === "Al-Quran") {
          const sMulai = QURAN_SURAHS.find((s) => s.number === c.suratMulaiNo);
          const sSelesai = QURAN_SURAHS.find((s) => s.number === c.suratSelesaiNo);
          item.surat_mulai = c.suratMulaiNo;
          item.surat_mulai_nama = sMulai?.name;
          item.ayat_mulai = Number(c.ayatMulai) || 1;
          item.surat_selesai = c.suratSelesaiNo;
          item.surat_selesai_nama = sSelesai?.name;
          item.ayat_selesai = Number(c.ayatSelesai) || 1;
        } else if (kategori === "Hadits") {
          item.kitab_hadits = c.kitabHadits;
          item.hadits_no_mulai = Number(c.haditsNoMulai) || 1;
          item.hadits_no_selesai = Number(c.haditsNoSelesai) || 1;
        } else if (kategori === "Matan Ilmu") {
          item.nama_matan = c.namaMatan;
          item.bait_mulai = Number(c.baitMulai) || 1;
          item.bait_selesai = Number(c.baitSelesai) || 1;
        }
        return item;
      });

      await tahfidzService.submitSetoranKolosal({
        items,
        tanggal,
        kategori,
        jenis_hafalan: jenisSetoran,
        kelancaran: kelancaranGlobal,
      });

      Alert.alert(
        "Berhasil Disimpan",
        `Setoran kolosal untuk ${selectedCards.length} santri telah berhasil tersimpan.`
      );
    } catch (err: any) {
      Alert.alert("Gagal", err.response?.data?.message || err.message || "Gagal menyimpan setoran kolosal");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Riwayat
  const filteredRiwayat = useMemo(() => {
    if (!riwayatSearch.trim()) return riwayatList;
    const q = riwayatSearch.toLowerCase();
    return riwayatList.filter(
      (item) =>
        item.siswa?.nama?.toLowerCase().includes(q) ||
        item.surat_mulai_nama?.toLowerCase().includes(q) ||
        item.kitab_hadits?.toLowerCase().includes(q) ||
        item.nama_matan?.toLowerCase().includes(q)
    );
  }, [riwayatList, riwayatSearch]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Tahfidz & Hafalan"
        subtitle="Manajemen Setoran, Halaqoh & Capaian"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* ─── TOP TABS NAVIGATION ─── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "input" && styles.tabItemActive]}
          onPress={() => {
            if (!hasInputPermission) {
              Alert.alert(
                "Akses Dibatasi",
                "Fitur input setoran hanya dapat diakses oleh Guru Tahfidz dan Administrator."
              );
              return;
            }
            setActiveTab("input");
          }}
        >
          <BookOpen size={16} color={activeTab === "input" ? Colors.primary : "#64748b"} />
          <Text style={[styles.tabText, activeTab === "input" && styles.tabTextActive]}>
            Setoran
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "riwayat" && styles.tabItemActive]}
          onPress={() => setActiveTab("riwayat")}
        >
          <History size={16} color={activeTab === "riwayat" ? Colors.primary : "#64748b"} />
          <Text style={[styles.tabText, activeTab === "riwayat" && styles.tabTextActive]}>
            Riwayat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "halaqah" && styles.tabItemActive]}
          onPress={() => setActiveTab("halaqah")}
        >
          <Users size={16} color={activeTab === "halaqah" ? Colors.primary : "#64748b"} />
          <Text style={[styles.tabText, activeTab === "halaqah" && styles.tabTextActive]}>
            Halaqoh
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "target" && styles.tabItemActive]}
          onPress={() => setActiveTab("target")}
        >
          <Target size={16} color={activeTab === "target" ? Colors.primary : "#64748b"} />
          <Text style={[styles.tabText, activeTab === "target" && styles.tabTextActive]}>
            Target
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat data tahfidz...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: INPUT SETORAN (INDIVIDU & KOLOSAL)
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "input" && (
            !hasInputPermission ? (
              <Card style={styles.emptyBox}>
                <Lock size={36} color="#94a3b8" />
                <Text style={styles.emptyTitle}>Akses Khusus Guru Tahfidz</Text>
                <Text style={styles.emptySubtitle}>
                  Anda tidak memiliki hak akses untuk menginput setoran hafalan santri.
                </Text>
              </Card>
            ) : (
            <View style={styles.tabContent}>
              {/* MODE SWITCHER (Individu vs Kolosal) */}
              <View style={styles.modeToggleContainer}>
                <TouchableOpacity
                  style={[styles.modeToggleBtn, modeInput === "kolosal" && styles.modeToggleBtnActive]}
                  onPress={() => setModeInput("kolosal")}
                >
                  <Layers size={15} color={modeInput === "kolosal" ? "#fff" : "#475569"} />
                  <Text style={[styles.modeToggleText, modeInput === "kolosal" && styles.modeToggleTextActive]}>
                    Mode Kolosal (Halaqoh)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeToggleBtn, modeInput === "individu" && styles.modeToggleBtnActive]}
                  onPress={() => setModeInput("individu")}
                >
                  <User size={15} color={modeInput === "individu" ? "#fff" : "#475569"} />
                  <Text style={[styles.modeToggleText, modeInput === "individu" && styles.modeToggleTextActive]}>
                    Mode Individu
                  </Text>
                </TouchableOpacity>
              </View>

              {/* GLOBAL SESSION CONTROLS */}
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.stepBadge}>
                    <Clock size={14} color="#15803d" />
                  </View>
                  <Text style={styles.sectionHeading}>Pengaturan Sesi & Kategori</Text>
                </View>

                {/* Kategori Hafalan */}
                <Text style={styles.fieldLabel}>Kategori Hafalan</Text>
                <View style={styles.kategoriGrid}>
                  <TouchableOpacity
                    style={[styles.kategoriBtn, kategori === "Al-Quran" && styles.kategoriBtnActive]}
                    onPress={() => setKategori("Al-Quran")}
                  >
                    <BookOpen size={16} color={kategori === "Al-Quran" ? "#15803d" : "#64748b"} />
                    <Text style={[styles.kategoriBtnText, kategori === "Al-Quran" && styles.kategoriBtnTextActive]}>
                      Al-Qur'an
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.kategoriBtn, kategori === "Hadits" && styles.kategoriBtnActive]}
                    onPress={() => setKategori("Hadits")}
                  >
                    <ScrollText size={16} color={kategori === "Hadits" ? "#1d4ed8" : "#64748b"} />
                    <Text style={[styles.kategoriBtnText, kategori === "Hadits" && styles.kategoriBtnTextActiveHadits]}>
                      Hadits
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.kategoriBtn, kategori === "Matan Ilmu" && styles.kategoriBtnActive]}
                    onPress={() => setKategori("Matan Ilmu")}
                  >
                    <Bookmark size={16} color={kategori === "Matan Ilmu" ? "#b45309" : "#64748b"} />
                    <Text style={[styles.kategoriBtnText, kategori === "Matan Ilmu" && styles.kategoriBtnTextActiveMatan]}>
                      Matan Ilmu
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Jenis Setoran (Setoran Baru, Setoran Ulang, Ujian) */}
                <Text style={styles.fieldLabel}>Jenis Penilaian</Text>
                <View style={styles.jenisGrid}>
                  {(["Setoran Baru", "Setoran Ulang", "Ujian"] as JenisSetoran[]).map((j) => (
                    <TouchableOpacity
                      key={j}
                      style={[styles.jenisBtn, jenisSetoran === j && styles.jenisBtnActive]}
                      onPress={() => setJenisSetoran(j)}
                    >
                      <Text style={[styles.jenisBtnText, jenisSetoran === j && styles.jenisBtnTextActive]}>
                        {j}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Tanggal & Durasi */}
                <View style={styles.rowTwoCols}>
                  <View style={styles.colHalf}>
                    <Text style={styles.fieldLabel}>Tanggal</Text>
                    <View style={styles.inputWithIcon}>
                      <Calendar size={14} color="#64748b" />
                      <TextInput
                        style={styles.textInputInBox}
                        value={tanggal}
                        onChangeText={setTanggal}
                        placeholder="YYYY-MM-DD"
                      />
                    </View>
                  </View>

                  <View style={styles.colHalf}>
                    <Text style={styles.fieldLabel}>Durasi (Menit)</Text>
                    <View style={styles.inputWithIcon}>
                      <Clock size={14} color="#64748b" />
                      <TextInput
                        style={styles.textInputInBox}
                        value={durasiMenit}
                        onChangeText={setDurasiMenit}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              </Card>

              {/* ─────────────────────────────────────────────────────────────
                  MODE INDIVIDU
              ───────────────────────────────────────────────────────────── */}
              {modeInput === "individu" && (
                <>
                  <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.stepBadge}>
                        <User size={14} color="#15803d" />
                      </View>
                      <Text style={styles.sectionHeading}>Pilih Santri</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.dropdownTrigger}
                      onPress={() => setIsSantriModalOpen(true)}
                    >
                      <View style={styles.dropdownTextWrapper}>
                        <Text style={styles.dropdownMainText}>
                          {activeSiswa?.nama || "Pilih Santri..."}
                        </Text>
                        {activeSiswa?.kelas?.nama_kelas && (
                          <Text style={styles.dropdownSubText}>
                            {activeSiswa.kelas.nama_kelas} • NISN: {activeSiswa.nisn || "-"}
                          </Text>
                        )}
                      </View>
                      <ChevronDown size={18} color="#64748b" />
                    </TouchableOpacity>
                  </Card>

                  {/* Range Detail (Al-Quran / Hadits / Matan) */}
                  <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.stepBadge}>
                        <BookOpen size={14} color="#15803d" />
                      </View>
                      <Text style={styles.sectionHeading}>Rincian Hafalan</Text>
                    </View>

                    {kategori === "Al-Quran" && (
                      <View style={styles.rangeBox}>
                        <View style={styles.rowTwoCols}>
                          <View style={styles.colHalf}>
                            <Text style={styles.fieldLabel}>Surat Mulai</Text>
                            <TouchableOpacity
                              style={styles.selectorTrigger}
                              onPress={() => setSurahPickerTarget({ type: "template_mulai" })}
                            >
                              <Text style={styles.selectorText} numberOfLines={1}>
                                {getSurahName(templateSuratMulaiNo)}
                              </Text>
                              <ChevronDown size={14} color="#64748b" />
                            </TouchableOpacity>
                          </View>
                          <View style={styles.colHalf}>
                            <Text style={styles.fieldLabel}>Ayat Mulai</Text>
                            <TextInput
                              style={styles.numInput}
                              value={templateAyatMulai}
                              onChangeText={setTemplateAyatMulai}
                              keyboardType="numeric"
                            />
                          </View>
                        </View>

                        <View style={[styles.rowTwoCols, { marginTop: 10 }]}>
                          <View style={styles.colHalf}>
                            <Text style={styles.fieldLabel}>Surat Selesai</Text>
                            <TouchableOpacity
                              style={styles.selectorTrigger}
                              onPress={() => setSurahPickerTarget({ type: "template_selesai" })}
                            >
                              <Text style={styles.selectorText} numberOfLines={1}>
                                {getSurahName(templateSuratSelesaiNo)}
                              </Text>
                              <ChevronDown size={14} color="#64748b" />
                            </TouchableOpacity>
                          </View>
                          <View style={styles.colHalf}>
                            <Text style={styles.fieldLabel}>Ayat Selesai</Text>
                            <TextInput
                              style={styles.numInput}
                              value={templateAyatSelesai}
                              onChangeText={setTemplateAyatSelesai}
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                      </View>
                    )}

                    {kategori === "Hadits" && (
                      <View style={styles.rangeBox}>
                        <Text style={styles.fieldLabel}>Kitab Hadits</Text>
                        <TouchableOpacity
                          style={styles.selectorTrigger}
                          onPress={() => {
                            setHaditsPickerTarget("template");
                            setIsHaditsModalOpen(true);
                          }}
                        >
                          <Text style={styles.selectorText}>{templateKitabHadits}</Text>
                          <ChevronDown size={14} color="#64748b" />
                        </TouchableOpacity>

                        <View style={[styles.rowTwoCols, { marginTop: 10 }]}>
                          <View style={styles.colHalf}>
                            <Text style={styles.fieldLabel}>Hadits No. Mulai</Text>
                            <TextInput
                              style={styles.numInput}
                              value={templateHaditsMulai}
                              onChangeText={setTemplateHaditsMulai}
                              keyboardType="numeric"
                            />
                          </View>
                          <View style={styles.colHalf}>
                            <Text style={styles.fieldLabel}>Hadits No. Selesai</Text>
                            <TextInput
                              style={styles.numInput}
                              value={templateHaditsSelesai}
                              onChangeText={setTemplateHaditsSelesai}
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                      </View>
                    )}

                    {kategori === "Matan Ilmu" && (
                      <View style={styles.rangeBox}>
                        <Text style={styles.fieldLabel}>Nama Matan</Text>
                        <TouchableOpacity
                          style={styles.selectorTrigger}
                          onPress={() => {
                            setMatanPickerTarget("template");
                            setIsMatanModalOpen(true);
                          }}
                        >
                          <Text style={styles.selectorText}>{templateNamaMatan}</Text>
                          <ChevronDown size={14} color="#64748b" />
                        </TouchableOpacity>

                        <View style={[styles.rowTwoCols, { marginTop: 10 }]}>
                          <View style={styles.colHalf}>
                            <Text style={styles.fieldLabel}>Bait Mulai</Text>
                            <TextInput
                              style={styles.numInput}
                              value={templateBaitMulai}
                              onChangeText={setTemplateBaitMulai}
                              keyboardType="numeric"
                            />
                          </View>
                          <View style={styles.colHalf}>
                            <Text style={styles.fieldLabel}>Bait Selesai</Text>
                            <TextInput
                              style={styles.numInput}
                              value={templateBaitSelesai}
                              onChangeText={setTemplateBaitSelesai}
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Kelancaran */}
                    <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Tingkat Kelancaran</Text>
                    <View style={styles.kelancaranGrid}>
                      {KELANCARAN_OPTIONS.map((k) => (
                        <TouchableOpacity
                          key={k.value}
                          style={[
                            styles.kelancaranBtn,
                            kelancaranGlobal === k.value && styles.kelancaranBtnActive,
                          ]}
                          onPress={() => setKelancaranGlobal(k.value as any)}
                        >
                          <Text
                            style={[
                              styles.kelancaranBtnText,
                              kelancaranGlobal === k.value && styles.kelancaranBtnTextActive,
                            ]}
                          >
                            {k.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Catatan */}
                    <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Catatan Guru</Text>
                    <TextInput
                      style={styles.textArea}
                      value={catatanGlobal}
                      onChangeText={setCatatanGlobal}
                      placeholder="Catatan tajwid, makhraj, atau kelancaran..."
                      multiline
                      numberOfLines={3}
                    />
                  </Card>

                  <Button
                    title={submitting ? "Menyimpan..." : "Simpan Setoran Individu"}
                    onPress={handleSubmitIndividu}
                    loading={submitting}
                    icon={<Save size={16} color="#fff" />}
                    style={{ marginTop: 8 }}
                  />
                </>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  MODE KOLOSAL (HALAQOH CARDS)
              ───────────────────────────────────────────────────────────── */}
              {modeInput === "kolosal" && (
                <>
                  {/* Halaqah Filter & Quick Apply Toolbar */}
                  <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.stepBadge}>
                        <FolderClosed size={14} color="#15803d" />
                      </View>
                      <Text style={styles.sectionHeading}>Pilih Halaqoh / Kelompok</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.halaqahPills}>
                      <TouchableOpacity
                        style={[
                          styles.halaqahPill,
                          selectedHalaqahId === "ALL" && styles.halaqahPillActive,
                        ]}
                        onPress={() => setSelectedHalaqahId("ALL")}
                      >
                        <Text
                          style={[
                            styles.halaqahPillText,
                            selectedHalaqahId === "ALL" && styles.halaqahPillTextActive,
                          ]}
                        >
                          Semua Santri ({santriList.length})
                        </Text>
                      </TouchableOpacity>

                      {halaqahList.map((h) => (
                        <TouchableOpacity
                          key={h.halaqah_id}
                          style={[
                            styles.halaqahPill,
                            selectedHalaqahId === h.halaqah_id && styles.halaqahPillActive,
                          ]}
                          onPress={() => setSelectedHalaqahId(h.halaqah_id)}
                        >
                          <Text
                            style={[
                              styles.halaqahPillText,
                              selectedHalaqahId === h.halaqah_id && styles.halaqahPillTextActive,
                            ]}
                          >
                            {h.nama_halaqah} ({h.anggota?.length || 0})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Quick Apply Header Bar */}
                    <View style={styles.quickApplyBar}>
                      <View style={styles.quickApplyInfo}>
                        <Text style={styles.quickApplyTitle}>Template Massal (Salin ke Santri)</Text>
                        <Text style={styles.quickApplyDesc}>
                          {kategori === "Al-Quran"
                            ? `${getSurahName(templateSuratMulaiNo)}: ${templateAyatMulai} s/d ${getSurahName(templateSuratSelesaiNo)}: ${templateAyatSelesai}`
                            : kategori === "Hadits"
                            ? `${templateKitabHadits} (No. ${templateHaditsMulai}-${templateHaditsSelesai})`
                            : `${templateNamaMatan} (Bait ${templateBaitMulai}-${templateBaitSelesai})`}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.applyBtn} onPress={applyTemplateToAll}>
                        <Copy size={13} color="#fff" />
                        <Text style={styles.applyBtnText}>Terapkan ke Semua</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Checkbox Select All / Deselect All */}
                    <View style={styles.selectionRow}>
                      <TouchableOpacity
                        style={styles.selectionBtn}
                        onPress={() => toggleSelectAll(true)}
                      >
                        <CheckCircle size={14} color="#15803d" />
                        <Text style={styles.selectionBtnText}>Pilih Semua</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.selectionBtn}
                        onPress={() => toggleSelectAll(false)}
                      >
                        <X size={14} color="#ef4444" />
                        <Text style={[styles.selectionBtnText, { color: "#ef4444" }]}>
                          Hapus Pilihan
                        </Text>
                      </TouchableOpacity>

                      <Text style={styles.selectedCountText}>
                        {displayedKolosalCards.filter((c) => c.selected).length} Santri Aktif
                      </Text>
                    </View>
                  </Card>

                  {/* CARDS LIST PER SANTRI */}
                  {displayedKolosalCards.map((card, idx) => (
                    <View
                      key={card.siswa_id}
                      style={[
                        styles.kolosalCard,
                        card.selected ? styles.kolosalCardActive : styles.kolosalCardInactive,
                      ]}
                    >
                      {/* Card Header */}
                      <View style={styles.cardSantriHeader}>
                        <TouchableOpacity
                          style={styles.cardCheckboxRow}
                          onPress={() => toggleSelectCard(card.siswa_id)}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              card.selected && styles.checkboxChecked,
                            ]}
                          >
                            {card.selected && <Check size={12} color="#fff" />}
                          </View>
                          <View style={{ marginLeft: 8, flex: 1 }}>
                            <Text style={styles.cardSantriName}>{card.nama}</Text>
                            <Text style={styles.cardSantriMeta}>
                              {card.kelas_nama || "Santri"} • Santri #{idx + 1}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>

                      {card.selected && (
                        <View style={styles.cardBody}>
                          {/* Al-Quran Controls */}
                          {kategori === "Al-Quran" && (
                            <View style={styles.cardRangeRow}>
                              <View style={styles.cardCol}>
                                <Text style={styles.cardMiniLabel}>Surat Mulai</Text>
                                <TouchableOpacity
                                  style={styles.cardSelector}
                                  onPress={() =>
                                    setSurahPickerTarget({
                                      type: "card_mulai",
                                      siswaId: card.siswa_id,
                                    })
                                  }
                                >
                                  <Text style={styles.cardSelectorText} numberOfLines={1}>
                                    {getSurahName(card.suratMulaiNo)}
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              <View style={{ width: 60 }}>
                                <Text style={styles.cardMiniLabel}>Ayat</Text>
                                <TextInput
                                  style={styles.cardNumInput}
                                  value={card.ayatMulai}
                                  onChangeText={(val) =>
                                    updateCardState(card.siswa_id, { ayatMulai: val })
                                  }
                                  keyboardType="numeric"
                                />
                              </View>

                              <View style={styles.cardCol}>
                                <Text style={styles.cardMiniLabel}>Surat Selesai</Text>
                                <TouchableOpacity
                                  style={styles.cardSelector}
                                  onPress={() =>
                                    setSurahPickerTarget({
                                      type: "card_selesai",
                                      siswaId: card.siswa_id,
                                    })
                                  }
                                >
                                  <Text style={styles.cardSelectorText} numberOfLines={1}>
                                    {getSurahName(card.suratSelesaiNo)}
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              <View style={{ width: 60 }}>
                                <Text style={styles.cardMiniLabel}>Ayat</Text>
                                <TextInput
                                  style={styles.cardNumInput}
                                  value={card.ayatSelesai}
                                  onChangeText={(val) =>
                                    updateCardState(card.siswa_id, { ayatSelesai: val })
                                  }
                                  keyboardType="numeric"
                                />
                              </View>
                            </View>
                          )}

                          {/* Hadits Controls */}
                          {kategori === "Hadits" && (
                            <View>
                              <TouchableOpacity
                                style={[styles.cardSelector, { marginBottom: 6 }]}
                                onPress={() => {
                                  setHaditsPickerTarget(card.siswa_id);
                                  setIsHaditsModalOpen(true);
                                }}
                              >
                                <Text style={styles.cardSelectorText}>{card.kitabHadits}</Text>
                              </TouchableOpacity>
                              <View style={styles.rowTwoCols}>
                                <View style={styles.colHalf}>
                                  <Text style={styles.cardMiniLabel}>Hadits Mulai</Text>
                                  <TextInput
                                    style={styles.cardNumInput}
                                    value={card.haditsNoMulai}
                                    onChangeText={(v) =>
                                      updateCardState(card.siswa_id, { haditsNoMulai: v })
                                    }
                                    keyboardType="numeric"
                                  />
                                </View>
                                <View style={styles.colHalf}>
                                  <Text style={styles.cardMiniLabel}>Hadits Selesai</Text>
                                  <TextInput
                                    style={styles.cardNumInput}
                                    value={card.haditsNoSelesai}
                                    onChangeText={(v) =>
                                      updateCardState(card.siswa_id, { haditsNoSelesai: v })
                                    }
                                    keyboardType="numeric"
                                  />
                                </View>
                              </View>
                            </View>
                          )}

                          {/* Matan Controls */}
                          {kategori === "Matan Ilmu" && (
                            <View>
                              <TouchableOpacity
                                style={[styles.cardSelector, { marginBottom: 6 }]}
                                onPress={() => {
                                  setMatanPickerTarget(card.siswa_id);
                                  setIsMatanModalOpen(true);
                                }}
                              >
                                <Text style={styles.cardSelectorText}>{card.namaMatan}</Text>
                              </TouchableOpacity>
                              <View style={styles.rowTwoCols}>
                                <View style={styles.colHalf}>
                                  <Text style={styles.cardMiniLabel}>Bait Mulai</Text>
                                  <TextInput
                                    style={styles.cardNumInput}
                                    value={card.baitMulai}
                                    onChangeText={(v) =>
                                      updateCardState(card.siswa_id, { baitMulai: v })
                                    }
                                    keyboardType="numeric"
                                  />
                                </View>
                                <View style={styles.colHalf}>
                                  <Text style={styles.cardMiniLabel}>Bait Selesai</Text>
                                  <TextInput
                                    style={styles.cardNumInput}
                                    value={card.baitSelesai}
                                    onChangeText={(v) =>
                                      updateCardState(card.siswa_id, { baitSelesai: v })
                                    }
                                    keyboardType="numeric"
                                  />
                                </View>
                              </View>
                            </View>
                          )}

                          {/* Kelancaran Selector per Card */}
                          <View style={styles.cardKelancaranRow}>
                            {KELANCARAN_OPTIONS.map((k) => (
                              <TouchableOpacity
                                key={k.value}
                                style={[
                                  styles.cardKelancaranPill,
                                  card.kelancaran === k.value && styles.cardKelancaranPillActive,
                                ]}
                                onPress={() =>
                                  updateCardState(card.siswa_id, { kelancaran: k.value as any })
                                }
                              >
                                <Text
                                  style={[
                                    styles.cardKelancaranText,
                                    card.kelancaran === k.value && styles.cardKelancaranTextActive,
                                  ]}
                                >
                                  {k.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          {/* Catatan Per Santri */}
                          <TextInput
                            style={styles.cardTextInput}
                            placeholder="Catatan individu santri (opsional)..."
                            value={card.catatan}
                            onChangeText={(val) =>
                              updateCardState(card.siswa_id, { catatan: val })
                            }
                          />
                        </View>
                      )}
                    </View>
                  ))}

                  {/* Batch Submit Button */}
                  <Button
                    title={
                      submitting
                        ? "Menyimpan Massal..."
                        : `Simpan Setoran Kolosal (${
                            displayedKolosalCards.filter((c) => c.selected).length
                          } Santri)`
                    }
                    onPress={handleSubmitKolosal}
                    loading={submitting}
                    icon={<Save size={16} color="#fff" />}
                    style={{ marginTop: 12, marginBottom: 20 }}
                  />
                </>
              )}
            </View>
            )
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2: RIWAYAT SETORAN
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "riwayat" && (
            <View style={styles.tabContent}>
              {/* Filter Card */}
              <Card style={styles.card}>
                <View style={styles.searchBar}>
                  <Search size={16} color="#64748b" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Cari nama santri, surat, hadits..."
                    value={riwayatSearch}
                    onChangeText={setRiwayatSearch}
                  />
                  {riwayatSearch ? (
                    <TouchableOpacity onPress={() => setRiwayatSearch("")}>
                      <X size={16} color="#64748b" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.filterPillsRow}>
                  {["ALL", "Setoran Baru", "Setoran Ulang", "Ujian"].map((j) => (
                    <TouchableOpacity
                      key={j}
                      style={[
                        styles.filterPill,
                        riwayatJenisFilter === j && styles.filterPillActive,
                      ]}
                      onPress={() => setRiwayatJenisFilter(j)}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          riwayatJenisFilter === j && styles.filterPillTextActive,
                        ]}
                      >
                        {j === "ALL" ? "Semua" : j}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>

              {riwayatLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
              ) : filteredRiwayat.length === 0 ? (
                <View style={styles.emptyBox}>
                  <History size={36} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>Belum Ada Riwayat Setoran</Text>
                  <Text style={styles.emptySubtitle}>Data setoran hafalan akan tercatat di sini.</Text>
                </View>
              ) : (
                filteredRiwayat.map((item: any) => (
                  <Card key={item.setoran_id} style={styles.riwayatCard}>
                    <View style={styles.riwayatHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.riwayatSantriName}>{item.siswa?.nama || "Santri"}</Text>
                        <Text style={styles.riwayatDate}>
                          📅 {item.tanggal} • {item.pegawai?.nama || "Ustadz"}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.jenisBadge,
                          item.jenis_hafalan === "Setoran Baru"
                            ? styles.badgeBaru
                            : item.jenis_hafalan === "Setoran Ulang"
                            ? styles.badgeUlang
                            : styles.badgeUjian,
                        ]}
                      >
                        <Text
                          style={[
                            styles.jenisBadgeText,
                            item.jenis_hafalan === "Setoran Baru"
                              ? styles.badgeBaruText
                              : item.jenis_hafalan === "Setoran Ulang"
                              ? styles.badgeUlangText
                              : styles.badgeUjianText,
                          ]}
                        >
                          {item.jenis_hafalan}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.riwayatDetailBox}>
                      <Text style={styles.riwayatDetailText}>
                        {item.kategori === "Al-Quran"
                          ? `📖 ${item.surat_mulai_nama || "Surat"} (${item.ayat_mulai}) s/d ${item.surat_selesai_nama || "Surat"} (${item.ayat_selesai}) • ${item.total_ayat || 0} Ayat`
                          : item.kategori === "Hadits"
                          ? `📜 ${item.kitab_hadits} • No. ${item.hadits_no_mulai} - ${item.hadits_no_selesai}`
                          : `🔖 ${item.nama_matan} • Bait ${item.bait_mulai} - ${item.bait_selesai}`}
                      </Text>
                      <View style={styles.riwayatMetaRow}>
                        <Text style={styles.riwayatKelancaran}>
                          Kelancaran: <Text style={{ fontWeight: "700" }}>{item.kelancaran}</Text>
                        </Text>
                        {item.catatan_guru ? (
                          <Text style={styles.riwayatCatatan}>"{item.catatan_guru}"</Text>
                        ) : null}
                      </View>
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3: KELOMPOK HALAQOH
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "halaqah" && (
            <View style={styles.tabContent}>
              <View style={styles.halaqahHeaderBox}>
                <Text style={styles.halaqahHeaderTitle}>Kelompok Halaqoh Binaan</Text>
                <Text style={styles.halaqahHeaderDesc}>
                  Daftar kelompok halaqah tahfidz dan santri yang diampu
                </Text>
              </View>

              {halaqahList.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Users size={36} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>Belum Ada Kelompok Halaqoh</Text>
                  <Text style={styles.emptySubtitle}>Kelompok halaqah binaan belum dibuat.</Text>
                </View>
              ) : (
                halaqahList.map((h) => (
                  <Card key={h.halaqah_id} style={styles.halaqahCard}>
                    <View style={styles.halaqahCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.halaqahName}>{h.nama_halaqah}</Text>
                        <Text style={styles.halaqahMeta}>
                          {h.lembaga?.nama || "Lembaga"} • {h.status}
                        </Text>
                      </View>
                      <View style={styles.santriCountBadge}>
                        <Users size={12} color="#15803d" />
                        <Text style={styles.santriCountText}>
                          {h.anggota?.length || h._count?.anggota || 0} Santri
                        </Text>
                      </View>
                    </View>

                    {h.anggota && h.anggota.length > 0 && (
                      <View style={styles.anggotaList}>
                        <Text style={styles.anggotaHeading}>Daftar Santri Anggota:</Text>
                        {h.anggota.map((ang, i) => (
                          <View key={ang.id} style={styles.anggotaItem}>
                            <Text style={styles.anggotaNumber}>{i + 1}.</Text>
                            <Text style={styles.anggotaName}>{ang.siswa?.nama || "Santri"}</Text>
                            <Text style={styles.anggotaKelas}>
                              {ang.siswa?.kelas?.nama_kelas || "-"}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Card>
                ))
              )}
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 4: TARGET & CAPAIAN SANTRI
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "target" && (
            <View style={styles.tabContent}>
              {/* Summary Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={[styles.statBox, { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }]}>
                  <BookOpen size={20} color="#15803d" />
                  <Text style={styles.statNumber}>
                    {dashboardSummary?.totalSetoran || santriList.length}
                  </Text>
                  <Text style={styles.statLabel}>Total Santri Binaan</Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
                  <TrendingUp size={20} color="#1d4ed8" />
                  <Text style={styles.statNumber}>
                    {dashboardSummary?.totalHalaqah || halaqahList.length}
                  </Text>
                  <Text style={styles.statLabel}>Kelompok Halaqoh</Text>
                </View>
              </View>

              <Text style={styles.targetSectionHeading}>Monitoring Capaian Hafalan Santri</Text>

              {santriList.map((s) => (
                <Card key={s.siswa_id} style={styles.targetSantriCard}>
                  <View style={styles.targetCardHeader}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{s.nama.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.targetSantriName}>{s.nama}</Text>
                      <Text style={styles.targetSantriMeta}>
                        {s.kelas?.nama_kelas || "Santri"} • NISN: {s.nisn || "-"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Target Al-Qur'an (30 Juz)</Text>
                      <Text style={styles.progressValue}>Aktif</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: "25%" }]} />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ─── MODAL 1: SANTRI PICKER (FOR INDIVIDU) ─── */}
      <Modal visible={isSantriModalOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Santri</Text>
              <TouchableOpacity onPress={() => setIsSantriModalOpen(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBar}>
              <Search size={16} color="#64748b" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Cari santri berdasarkan nama / NISN..."
                value={santriSearch}
                onChangeText={setSantriSearch}
              />
            </View>

            <FlatList
              data={filteredSantriList}
              keyExtractor={(item) => String(item.siswa_id)}
              renderItem={({ item }) => {
                const isSelected = item.siswa_id === selectedSiswaId;
                return (
                  <TouchableOpacity
                    style={[styles.modalListItem, isSelected && styles.modalListItemActive]}
                    onPress={() => {
                      setSelectedSiswaId(item.siswa_id);
                      setIsSantriModalOpen(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalItemTitle}>{item.nama}</Text>
                      <Text style={styles.modalItemSubtitle}>
                        {item.kelas?.nama_kelas || "Kelas -"} • {item.nisn || "-"}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color="#15803d" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* ─── MODAL 2: SURAH PICKER (AL-QURAN) ─── */}
      <Modal visible={!!surahPickerTarget} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Surat Al-Qur'an</Text>
              <TouchableOpacity onPress={() => setSurahPickerTarget(null)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBar}>
              <Search size={16} color="#64748b" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Cari surat atau nomor..."
                value={surahSearch}
                onChangeText={setSurahSearch}
              />
            </View>

            <FlatList
              data={filteredSurahList}
              keyExtractor={(item) => String(item.number)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalListItem}
                  onPress={() => handleSelectSurah(item.number)}
                >
                  <View style={styles.surahNumberCircle}>
                    <Text style={styles.surahNumberText}>{item.number}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.modalItemTitle}>{item.name}</Text>
                    <Text style={styles.modalItemSubtitle}>
                      {item.type} • {item.totalVerses} Ayat
                    </Text>
                  </View>
                  <Text style={styles.surahArabicText}>{item.arabic}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* ─── MODAL 3: HADITS PICKER ─── */}
      <Modal visible={isHaditsModalOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kitab Hadits</Text>
              <TouchableOpacity onPress={() => setIsHaditsModalOpen(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={HADITS_BOOK_PRESETS}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalListItem}
                  onPress={() => handleSelectHadits(item.name)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemTitle}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.modalItemSubtitle}>{item.description}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* ─── MODAL 4: MATAN PICKER ─── */}
      <Modal visible={isMatanModalOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Matan Ilmu</Text>
              <TouchableOpacity onPress={() => setIsMatanModalOpen(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={MATAN_PRESETS}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalListItem}
                  onPress={() => handleSelectMatan(item.name)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemTitle}>{item.name}</Text>
                    <Text style={styles.modalItemSubtitle}>
                      {item.bidang} • {item.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  tabTextActive: {
    color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  tabContent: {
    gap: 12,
  },
  modeToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 14,
    padding: 4,
    marginBottom: 4,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  modeToggleBtnActive: {
    backgroundColor: "#065f46",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  modeToggleTextActive: {
    color: "#ffffff",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
    borderRadius: 8,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e293b",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    marginTop: 4,
  },
  kategoriGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  kategoriBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    gap: 6,
  },
  kategoriBtnActive: {
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
  },
  kategoriBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  kategoriBtnTextActive: {
    color: "#15803d",
  },
  kategoriBtnTextActiveHadits: {
    color: "#1d4ed8",
  },
  kategoriBtnTextActiveMatan: {
    color: "#b45309",
  },
  jenisGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  jenisBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  jenisBtnActive: {
    backgroundColor: "#065f46",
    borderColor: "#065f46",
  },
  jenisBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  jenisBtnTextActive: {
    color: "#ffffff",
  },
  rowTwoCols: {
    flexDirection: "row",
    gap: 10,
  },
  colHalf: {
    flex: 1,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  textInputInBox: {
    flex: 1,
    fontSize: 12,
    color: "#1e293b",
    fontWeight: "600",
    padding: 0,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownTextWrapper: {
    flex: 1,
  },
  dropdownMainText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e293b",
  },
  dropdownSubText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  rangeBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  selectorTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  selectorText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
  },
  numInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
  },
  kelancaranGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  kelancaranBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  kelancaranBtnActive: {
    backgroundColor: "#065f46",
    borderColor: "#065f46",
  },
  kelancaranBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },
  kelancaranBtnTextActive: {
    color: "#ffffff",
  },
  textArea: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 10,
    fontSize: 11,
    color: "#1e293b",
    textAlignVertical: "top",
  },
  // Kolosal specific styles
  halaqahPills: {
    flexDirection: "row",
    marginBottom: 12,
  },
  halaqahPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 8,
  },
  halaqahPillActive: {
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
  },
  halaqahPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  halaqahPillTextActive: {
    color: "#15803d",
  },
  quickApplyBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  quickApplyInfo: {
    flex: 1,
    marginRight: 8,
  },
  quickApplyTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#f8fafc",
  },
  quickApplyDesc: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  applyBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
  },
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  selectionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 16,
  },
  selectionBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803d",
  },
  selectedCountText: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  kolosalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
    overflow: "hidden",
  },
  kolosalCardActive: {
    borderColor: "#a7f3d0",
    backgroundColor: "#ffffff",
  },
  kolosalCardInactive: {
    opacity: 0.6,
  },
  cardSantriHeader: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#94a3b8",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  cardSantriName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },
  cardSantriMeta: {
    fontSize: 10,
    color: "#94a3b8",
  },
  cardBody: {
    padding: 12,
    backgroundColor: "#f8fafc",
    gap: 8,
  },
  cardRangeRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  cardCol: {
    flex: 1,
  },
  cardMiniLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 2,
  },
  cardSelector: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 32,
    justifyContent: "center",
  },
  cardSelectorText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1e293b",
  },
  cardNumInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 4,
    height: 32,
    fontSize: 10,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
  },
  cardKelancaranRow: {
    flexDirection: "row",
    gap: 4,
  },
  cardKelancaranPill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  cardKelancaranPillActive: {
    backgroundColor: "#065f46",
    borderColor: "#065f46",
  },
  cardKelancaranText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748b",
  },
  cardKelancaranTextActive: {
    color: "#ffffff",
  },
  cardTextInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 32,
    fontSize: 10,
    color: "#1e293b",
  },
  // Riwayat Tab Styles
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#1e293b",
    padding: 0,
  },
  filterPillsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterPillActive: {
    backgroundColor: "#065f46",
    borderColor: "#065f46",
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },
  filterPillTextActive: {
    color: "#ffffff",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
  },
  riwayatCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  riwayatHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  riwayatSantriName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e293b",
  },
  riwayatDate: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  jenisBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeBaru: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  badgeBaruText: {
    color: "#15803d",
    fontSize: 9,
    fontWeight: "800",
  },
  badgeUlang: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  badgeUlangText: {
    color: "#1d4ed8",
    fontSize: 9,
    fontWeight: "800",
  },
  badgeUjian: {
    backgroundColor: "#faf5ff",
    borderColor: "#e9d5ff",
  },
  badgeUjianText: {
    color: "#7e22ce",
    fontSize: 9,
    fontWeight: "800",
  },
  jenisBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  riwayatDetailBox: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  riwayatDetailText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  riwayatMetaRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  riwayatKelancaran: {
    fontSize: 10,
    color: "#64748b",
  },
  riwayatCatatan: {
    fontSize: 10,
    color: "#94a3b8",
    fontStyle: "italic",
  },
  // Halaqah Tab
  halaqahHeaderBox: {
    marginBottom: 4,
  },
  halaqahHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
  },
  halaqahHeaderDesc: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  halaqahCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
  },
  halaqahCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  halaqahName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
  },
  halaqahMeta: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  santriCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  santriCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803d",
  },
  anggotaList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  anggotaHeading: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  anggotaItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  anggotaNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    width: 20,
  },
  anggotaName: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "#1e293b",
  },
  anggotaKelas: {
    fontSize: 10,
    color: "#64748b",
  },
  // Target Tab
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 2,
  },
  targetSectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 6,
  },
  targetSantriCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  targetCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#065f46",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  targetSantriName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1e293b",
  },
  targetSantriMeta: {
    fontSize: 10,
    color: "#64748b",
  },
  progressContainer: {
    marginTop: 10,
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  progressValue: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803d",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 3,
  },
  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
  },
  modalSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 12,
    color: "#1e293b",
    padding: 0,
  },
  modalListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalListItemActive: {
    backgroundColor: "#ecfdf5",
  },
  modalItemTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e293b",
  },
  modalItemSubtitle: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  surahNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  surahNumberText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803d",
  },
  surahArabicText: {
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "700",
  },
});
