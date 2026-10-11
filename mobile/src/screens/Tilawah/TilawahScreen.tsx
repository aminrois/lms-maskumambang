// mobile/src/screens/Tilawah/TilawahScreen.tsx
// Tilawah Al-Qur'an Harian Santri — Form & Fitur serasi dengan versi Website
// Referensi web: src/pages/Tahfidz/Tilawah/Index.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Calendar,
  ChevronDown,
  CheckCircle2,
  X,
  Save,
  Search,
  Layers,
  BarChart3,
  TrendingUp,
  FileText,
  Clock,
  User,
  Users,
  Check,
  Bookmark,
  Sparkles,
  Lock,
} from "lucide-react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { apiClient } from "../../api/client";
import { waliService } from "../../api/waliService";
import {
  isWaliKelasRole,
  isWaliMuridRole,
  canInputTahfidz,
  getActiveRoleName,
} from "../../utils/permissions";
import { SingleDatePickerModal } from "../../components/ui/SingleDatePickerModal";
import {
  calculatePagesAndStats,
  getSurahMeta,
  SURAH_PAGE_DATA,
} from "../../data/quranPageMapping";

interface SantriItem {
  siswa_id: number;
  nama: string;
  nis?: string;
  kelas_id?: number;
  kelas?: { nama_kelas: string };
}

interface KelasItem {
  kelas_id: number;
  nama_kelas: string;
}

interface TilawahRecord {
  tilawah_id: number;
  siswa_id: number;
  tanggal: string;
  surat_mulai: number;
  surat_mulai_nama: string;
  ayat_mulai: number;
  surat_selesai: number;
  surat_selesai_nama: string;
  ayat_selesai: number;
  halaman_mulai?: number;
  halaman_selesai?: number;
  total_halaman?: number;
  total_ayat?: number;
  keterangan?: string;
  diinput_oleh?: string;
  penginput_nama?: string;
  siswa?: { nama: string; nis?: string; kelas?: { nama_kelas: string } };
}

const WAKTU_TILAWAH_PRESETS = [
  "Ba'da Subuh",
  "Ba'da Dzuhur",
  "Ba'da Ashar",
  "Ba'da Maghrib",
  "Ba'da Isya",
  "Tadarus Mandiri di Rumah",
  "Tadarus Bersama di Asrama",
  "Tadarus Kelas Pagi",
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const todayISO = () => new Date().toISOString().split("T")[0];

export const TilawahScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, activeRole } = useAuthStore();

  const isWaliKls = isWaliKelasRole(activeRole || user);
  const isWaliSantri = isWaliMuridRole(activeRole || user);
  const canInput = isWaliKls || isWaliSantri || canInputTahfidz(activeRole || user);

  const initialSiswaId = route.params?.siswaId ? Number(route.params.siswaId) : null;

  // Main list state
  const [activeTab, setActiveTab] = useState<"riwayat" | "input">(() => (canInput ? "input" : "riwayat"));
  const [records, setRecords] = useState<TilawahRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // Master Data
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [santriList, setSantriList] = useState<SantriItem[]>([]);

  // ─── FORM INPUT STATE (Matched with Web) ───
  const [modeInput, setModeInput] = useState<"individu" | "kelas">("individu");
  const [formTanggal, setFormTanggal] = useState(todayISO());
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null);
  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(initialSiswaId);
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<number[]>([]);

  // Coordinates
  const [suratMulaiNo, setSuratMulaiNo] = useState<number>(1);
  const [ayatMulai, setAyatMulai] = useState<string>("1");
  const [suratSelesaiNo, setSuratSelesaiNo] = useState<number>(1);
  const [ayatSelesai, setAyatSelesai] = useState<string>("7");

  // Keterangan & Penginput
  const [waktuPreset, setWaktuPreset] = useState<string>("Ba'da Maghrib");
  const [customKeterangan, setCustomKeterangan] = useState<string>("");
  const defaultPenginputRole = isWaliSantri ? "Wali Santri" : "Wali Kelas";
  const [diinputOleh, setDiinputOleh] = useState<string>(defaultPenginputRole);
  const [submitting, setSubmitting] = useState(false);

  // Picker Modals
  const [showSurahPicker, setShowSurahPicker] = useState<"mulai" | "selesai" | null>(null);
  const [surahSearch, setSurahSearch] = useState("");
  const [showSantriModal, setShowSantriModal] = useState(false);
  const [santriSearch, setSantriSearch] = useState("");
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  // Auto-calculated Quran Stats
  const pageStats = useMemo(() => {
    return calculatePagesAndStats(
      Number(suratMulaiNo),
      Number(ayatMulai) || 1,
      Number(suratSelesaiNo),
      Number(ayatSelesai) || 1
    );
  }, [suratMulaiNo, ayatMulai, suratSelesaiNo, ayatSelesai]);

  const surahMulaiMeta = useMemo(() => getSurahMeta(suratMulaiNo), [suratMulaiNo]);
  const surahSelesaiMeta = useMemo(() => getSurahMeta(suratSelesaiNo), [suratSelesaiNo]);

  // Load classes and santri
  const loadMasterData = useCallback(async () => {
    try {
      if (isWaliSantri) {
        // Khusus Wali Santri: langsung ambil daftar anak sendiri
        try {
          const anakList = await waliService.getDaftarAnak();
          if (Array.isArray(anakList) && anakList.length > 0) {
            const mappedSantri: SantriItem[] = anakList.map((a) => ({
              siswa_id: a.siswa_id,
              nama: a.nama,
              nis: a.nis,
              kelas_id: a.kelas?.kelas_id,
              kelas: a.kelas ? { nama_kelas: a.kelas.nama_kelas } : undefined,
            }));
            setSantriList(mappedSantri);
            const targetId = initialSiswaId || (selectedSiswaId || mappedSantri[0].siswa_id);
            const found = mappedSantri.find((s) => s.siswa_id === targetId) || mappedSantri[0];
            setSelectedSiswaId(found.siswa_id);
            if (found.kelas_id) setSelectedKelasId(found.kelas_id);
          }
        } catch (e) {
          console.warn("loadMasterData wali anak err:", e);
        }
        return;
      }

      // 1. Fetch kelas
      try {
        const kRes = await apiClient.get("/tahfidz/tilawah/kelas");
        const kData = kRes.data?.data || kRes.data || [];
        if (Array.isArray(kData) && kData.length > 0) {
          setKelasList(kData);
          if (!selectedKelasId) setSelectedKelasId(kData[0].kelas_id);
        }
      } catch (_) {
        // Fallback /kelas
        try {
          const kRes = await apiClient.get("/kelas");
          const kData = kRes.data?.data || kRes.data || [];
          if (Array.isArray(kData) && kData.length > 0) {
            setKelasList(kData);
            if (!selectedKelasId) setSelectedKelasId(kData[0].kelas_id);
          }
        } catch (_) {}
      }

      // 2. Fetch santri
      try {
        const sRes = await apiClient.get("/tahfidz/tilawah/santri");
        const sData = sRes.data?.data || sRes.data || [];
        if (Array.isArray(sData) && sData.length > 0) {
          setSantriList(sData);
          if (!selectedSiswaId) setSelectedSiswaId(sData[0].siswa_id);
        }
      } catch (_) {
        try {
          const sRes = await apiClient.get("/siswa?limit=200");
          const sData = sRes.data?.data || sRes.data || [];
          if (Array.isArray(sData)) {
            setSantriList(sData);
            if (sData.length > 0 && !selectedSiswaId) setSelectedSiswaId(sData[0].siswa_id);
          }
        } catch (_) {}
      }
    } catch (e) {
      console.warn("loadMasterData err:", e);
    }
  }, [isWaliSantri, initialSiswaId, selectedKelasId, selectedSiswaId]);

  // Fetch riwayat tilawah
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const targetSiswaId = isWaliSantri ? (selectedSiswaId || initialSiswaId) : null;
      const url = targetSiswaId
        ? `/tahfidz/tilawah?siswa_id=${targetSiswaId}&limit=50`
        : "/tahfidz/tilawah?limit=50";
      const res = await apiClient.get(url);
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setRecords(data);
      }
    } catch (err) {
      console.warn("Fetch tilawah records err:", err);
    } finally {
      setLoading(false);
    }
  }, [isWaliSantri, selectedSiswaId, initialSiswaId]);

  useEffect(() => {
    loadMasterData();
    fetchRecords();
  }, [loadMasterData, fetchRecords]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadMasterData(), fetchRecords()]);
    setRefreshing(false);
  };

  const handleSelectSurah = (surahNum: number) => {
    if (showSurahPicker === "mulai") {
      setSuratMulaiNo(surahNum);
      setAyatMulai("1");
      if (surahNum > suratSelesaiNo) {
        setSuratSelesaiNo(surahNum);
        const meta = getSurahMeta(surahNum);
        setAyatSelesai(String(meta?.totalVerses || 7));
      }
    } else if (showSurahPicker === "selesai") {
      setSuratSelesaiNo(surahNum);
      const meta = getSurahMeta(surahNum);
      setAyatSelesai(String(meta?.totalVerses || 7));
    }
    setShowSurahPicker(null);
    setSurahSearch("");
  };

  const handleSubmit = async () => {
    if (modeInput === "individu" && !selectedSiswaId) {
      Alert.alert("Perhatian", "Pilih santri terlebih dahulu.");
      return;
    }
    if (modeInput === "kelas" && selectedSiswaIds.length === 0) {
      Alert.alert("Perhatian", "Pilih minimal 1 santri untuk mode kelas.");
      return;
    }

    const keteranganFinal = customKeterangan.trim() || waktuPreset;
    const penginputNama =
      (user as any)?.pegawai?.nama || (user as any)?.nama || user?.username || diinputOleh;

    setSubmitting(true);
    try {
      const payload: any = {
        tanggal: formTanggal,
        surat_mulai: suratMulaiNo,
        surat_mulai_nama: surahMulaiMeta?.name || "Al-Fatihah",
        ayat_mulai: Number(ayatMulai) || 1,
        surat_selesai: suratSelesaiNo,
        surat_selesai_nama: surahSelesaiMeta?.name || "Al-Fatihah",
        ayat_selesai: Number(ayatSelesai) || 7,
        halaman_mulai: pageStats.pageStart,
        halaman_selesai: pageStats.pageEnd,
        total_halaman: pageStats.totalPages,
        total_ayat: pageStats.totalVerses,
        keterangan: keteranganFinal,
        diinput_oleh: diinputOleh,
        penginput_nama: penginputNama,
      };

      if (modeInput === "individu") {
        payload.siswa_id = selectedSiswaId;
      } else {
        payload.siswa_ids = selectedSiswaIds;
      }

      await apiClient.post("/tahfidz/tilawah", payload);

      Alert.alert("Berhasil", "Laporan tilawah santri berhasil disimpan!");
      setActiveTab("riwayat");
      fetchRecords();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Gagal menyimpan tilawah. Periksa data kembali.";
      Alert.alert("Gagal Simpan", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const currentSelectedSantri = useMemo(() => {
    return santriList.find((s) => s.siswa_id === selectedSiswaId);
  }, [santriList, selectedSiswaId]);

  const filteredSurahs = useMemo(() => {
    if (!surahSearch) return SURAH_PAGE_DATA;
    return SURAH_PAGE_DATA.filter(
      (s) =>
        s.name.toLowerCase().includes(surahSearch.toLowerCase()) ||
        String(s.number).includes(surahSearch)
    );
  }, [surahSearch]);

  const filteredSantris = useMemo(() => {
    let list = santriList;
    if (selectedKelasId) {
      list = list.filter((s) => !s.kelas_id || s.kelas_id === selectedKelasId);
    }
    if (!santriSearch) return list;
    return list.filter(
      (s) =>
        s.nama.toLowerCase().includes(santriSearch.toLowerCase()) ||
        (s.nis && s.nis.includes(santriSearch))
    );
  }, [santriList, selectedKelasId, santriSearch]);

  const filteredRecords = useMemo(() => {
    if (!searchFilter) return records;
    return records.filter(
      (r) =>
        r.siswa?.nama.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.surat_mulai_nama?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.keterangan?.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [records, searchFilter]);

  const totalHalamanAll = useMemo(() => {
    return records.reduce((acc, r) => acc + (r.total_halaman || 0), 0);
  }, [records]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* ─── HEADER ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tilawah Al-Qur'an</Text>
          <Text style={styles.headerSub}>Pencatatan & Riwayat Tilawah Santri</Text>
        </View>
        <View style={styles.badgeRole}>
          <Text style={styles.badgeRoleText}>{getActiveRoleName(activeRole || user) || "Wali Kelas"}</Text>
        </View>
      </View>

      {/* ─── TOP TABS (Catat Tilawah vs Riwayat) ─── */}
      <View style={styles.tabsRow}>
        {canInput && (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "input" && styles.tabBtnActive]}
            onPress={() => setActiveTab("input")}
            activeOpacity={0.8}
          >
            <Plus size={15} color={activeTab === "input" ? "#162E6E" : "#64748B"} />
            <Text style={[styles.tabBtnText, activeTab === "input" && styles.tabBtnTextActive]}>
              Catat Tilawah
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "riwayat" && styles.tabBtnActive]}
          onPress={() => setActiveTab("riwayat")}
          activeOpacity={0.8}
        >
          <BookOpen size={15} color={activeTab === "riwayat" ? "#162E6E" : "#64748B"} />
          <Text style={[styles.tabBtnText, activeTab === "riwayat" && styles.tabBtnTextActive]}>
            Riwayat Tilawah
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── TAB 1: RIWAYAT TILAWAH ─── */}
      {activeTab === "riwayat" && (
        <View style={{ flex: 1 }}>
          {/* Summary Banner */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{records.length}</Text>
              <Text style={styles.summaryLabel}>Total Sesi</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{totalHalamanAll}</Text>
              <Text style={styles.summaryLabel}>Total Halaman</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarWrapper}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Cari santri, surat, waktu..."
              placeholderTextColor="#94A3B8"
              value={searchFilter}
              onChangeText={setSearchFilter}
            />
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#162E6E" />
              <Text style={styles.loadingText}>Memuat riwayat tilawah...</Text>
            </View>
          ) : filteredRecords.length === 0 ? (
            <View style={styles.emptyBox}>
              <BookOpen size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Belum Ada Riwayat Tilawah</Text>
              <Text style={styles.emptySub}>
                Belum ada data tilawah santri yang tercatat. Klik tab &quot;Catat Tilawah&quot; untuk menginput data baru.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecords}
              keyExtractor={(item) => String(item.tilawah_id)}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#162E6E"]} />}
              renderItem={({ item }) => (
                <View style={styles.recordCard}>
                  <View style={styles.recordTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordName}>{item.siswa?.nama || "Santri"}</Text>
                      {item.siswa?.kelas?.nama_kelas && (
                        <Text style={styles.recordKelas}>Kelas: {item.siswa.kelas.nama_kelas}</Text>
                      )}
                    </View>
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateBadgeText}>{formatDate(item.tanggal)}</Text>
                    </View>
                  </View>

                  {/* Ayat & Surat Range */}
                  <View style={styles.recordRangeBox}>
                    <BookOpen size={14} color="#162E6E" />
                    <Text style={styles.recordRangeText}>
                      QS. {item.surat_mulai_nama || "Al-Fatihah"} : {item.ayat_mulai} s/d{" "}
                      {item.surat_selesai_nama || item.surat_mulai_nama || "Al-Fatihah"} : {item.ayat_selesai}
                    </Text>
                  </View>

                  <View style={styles.recordFooter}>
                    <View style={styles.pagePill}>
                      <Text style={styles.pagePillText}>
                        Hal. {item.halaman_mulai || 1}–{item.halaman_selesai || 1} ({item.total_halaman || 1} hal)
                      </Text>
                    </View>
                    {item.keterangan ? (
                      <View style={styles.waktuPill}>
                        <Clock size={11} color="#475569" style={{ marginRight: 3 }} />
                        <Text style={styles.waktuPillText}>{item.keterangan}</Text>
                      </View>
                    ) : null}
                  </View>

                  {item.diinput_oleh && (
                    <Text style={styles.diinputOlehText}>
                      Dicatat oleh: {item.penginput_nama || item.diinput_oleh} ({item.diinput_oleh})
                    </Text>
                  )}
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* ─── TAB 2: FORM CATAT TILAWAH (Identik dengan Web) ─── */}
      {activeTab === "input" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
          {/* Mode Switcher (Disembunyikan untuk Wali Murid karena hanya mencatat untuk anaknya sendiri) */}
          {!isWaliSantri && (
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeToggleBtn, modeInput === "individu" && styles.modeToggleBtnActive]}
                onPress={() => setModeInput("individu")}
              >
                <User size={14} color={modeInput === "individu" ? "#FFFFFF" : "#475569"} />
                <Text style={[styles.modeToggleText, modeInput === "individu" && styles.modeToggleTextActive]}>
                  Per Santri (Individu)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeToggleBtn, modeInput === "kelas" && styles.modeToggleBtnActive]}
                onPress={() => setModeInput("kelas")}
              >
                <Users size={14} color={modeInput === "kelas" ? "#FFFFFF" : "#475569"} />
                <Text style={[styles.modeToggleText, modeInput === "kelas" && styles.modeToggleTextActive]}>
                  Mode Kelas (Kolektif)
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Form Card: Santri & Tanggal */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>1. Informasi Santri & Sesi</Text>

            {/* Tanggal */}
            <Text style={styles.fieldLabel}>Tanggal Tilawah</Text>
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setShowDatePickerModal(true)}
              activeOpacity={0.8}
            >
              <Calendar size={16} color="#162E6E" />
              <Text style={{ flex: 1, marginLeft: 8, fontSize: 13, color: "#0F172A", fontWeight: "600" }}>
                {formTanggal || "Pilih Tanggal..."}
              </Text>
            </TouchableOpacity>

            {/* Mode Individu: Pilih Santri */}
            {modeInput === "individu" ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.fieldLabel}>Pilih Santri</Text>
                {isWaliSantri ? (
                  <View style={[styles.pickerSelector, styles.pickerSelectorLocked]}>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                      <View style={styles.lockedSantriIconCircle}>
                        <User size={16} color="#162E6E" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.pickerSelectorVal, { fontWeight: "700", color: "#0F172A" }]}>
                          {currentSelectedSantri ? currentSelectedSantri.nama : "Santri Anda"}
                        </Text>
                        <Text style={styles.pickerSelectorSub}>
                          {currentSelectedSantri?.kelas?.nama_kelas
                            ? `Kelas: ${currentSelectedSantri.kelas.nama_kelas}`
                            : currentSelectedSantri?.nis
                            ? `NIS: ${currentSelectedSantri.nis}`
                            : "Santri Anda"}
                        </Text>
                      </View>
                      <View style={styles.lockedAutoBadge}>
                        <Lock size={12} color="#1D4ED8" style={{ marginRight: 4 }} />
                        <Text style={styles.lockedAutoBadgeText}>Santri Anda</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.pickerSelector}
                    onPress={() => setShowSantriModal(true)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerSelectorVal}>
                        {currentSelectedSantri ? currentSelectedSantri.nama : "Pilih Santri..."}
                      </Text>
                      {currentSelectedSantri?.nis && (
                        <Text style={styles.pickerSelectorSub}>NIS: {currentSelectedSantri.nis}</Text>
                      )}
                    </View>
                    <ChevronDown size={18} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              /* Mode Kelas: Checklist Santri */
              <View style={{ marginTop: 12 }}>
                <Text style={styles.fieldLabel}>Pilih Santri di Kelas (Centang)</Text>
                <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                  {filteredSantris.map((s) => {
                    const isChecked = selectedSiswaIds.includes(s.siswa_id);
                    return (
                      <TouchableOpacity
                        key={s.siswa_id}
                        style={[styles.checkSantriRow, isChecked && styles.checkSantriRowActive]}
                        onPress={() => {
                          if (isChecked) {
                            setSelectedSiswaIds(selectedSiswaIds.filter((id) => id !== s.siswa_id));
                          } else {
                            setSelectedSiswaIds([...selectedSiswaIds, s.siswa_id]);
                          }
                        }}
                      >
                        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                          {isChecked && <Check size={12} color="#FFFFFF" />}
                        </View>
                        <Text style={styles.checkSantriName}>{s.nama}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Form Card: Surah & Ayat Coordinates */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>2. Bacaan Al-Qur'an (Surat & Ayat)</Text>

            {/* Surat Mulai */}
            <Text style={styles.fieldLabel}>Surat Mulai</Text>
            <TouchableOpacity
              style={styles.pickerSelector}
              onPress={() => setShowSurahPicker("mulai")}
              activeOpacity={0.8}
            >
              <Text style={styles.pickerSelectorVal}>
                {suratMulaiNo}. {surahMulaiMeta?.name || "Al-Fatihah"} ({surahMulaiMeta?.arabic})
              </Text>
              <ChevronDown size={18} color="#64748B" />
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Ayat Mulai</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={ayatMulai}
                onChangeText={setAyatMulai}
                placeholder="1"
              />
            </View>

            {/* Surat Selesai */}
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Surat Selesai</Text>
            <TouchableOpacity
              style={styles.pickerSelector}
              onPress={() => setShowSurahPicker("selesai")}
              activeOpacity={0.8}
            >
              <Text style={styles.pickerSelectorVal}>
                {suratSelesaiNo}. {surahSelesaiMeta?.name || "Al-Fatihah"} ({surahSelesaiMeta?.arabic})
              </Text>
              <ChevronDown size={18} color="#64748B" />
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Ayat Selesai</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={ayatSelesai}
                onChangeText={setAyatSelesai}
                placeholder="7"
              />
            </View>

            {/* Auto-Calculated Stats Box */}
            <View style={styles.calcStatsBox}>
              <View style={styles.calcStatsRow}>
                <View style={styles.calcItem}>
                  <Text style={styles.calcNum}>
                    {pageStats.pageStart} – {pageStats.pageEnd}
                  </Text>
                  <Text style={styles.calcLabel}>Rentang Halaman</Text>
                </View>
                <View style={styles.calcItem}>
                  <Text style={styles.calcNum}>{pageStats.totalPages} Hal</Text>
                  <Text style={styles.calcLabel}>Total Halaman</Text>
                </View>
                <View style={styles.calcItem}>
                  <Text style={styles.calcNum}>{pageStats.totalVerses} Ayat</Text>
                  <Text style={styles.calcLabel}>Total Ayat</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Form Card: Waktu & Penginput */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>3. Waktu & Keterangan</Text>

            <Text style={styles.fieldLabel}>Waktu Tilawah (Pilihan Cepat)</Text>
            <View style={styles.presetWrap}>
              {WAKTU_TILAWAH_PRESETS.map((p) => {
                const isSelected = waktuPreset === p && !customKeterangan;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => {
                      setWaktuPreset(p);
                      setCustomKeterangan("");
                    }}
                  >
                    <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>{p}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Atau Keterangan Tambahan / Custom</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                placeholder="Misal: Sima'an di masjid, evaluasi tahsin..."
                placeholderTextColor="#94A3B8"
                value={customKeterangan}
                onChangeText={setCustomKeterangan}
              />
            </View>

            <View style={styles.inputInfo}>
              <Text style={styles.inputInfoText}>
                Diinput sebagai: <Text style={{ fontWeight: "700" }}>{diinputOleh}</Text>
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Simpan Laporan Tilawah</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ─── SURAH PICKER MODAL ─── */}
      <Modal visible={!!showSurahPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Pilih Surat {showSurahPicker === "mulai" ? "Mulai" : "Selesai"}
              </Text>
              <TouchableOpacity onPress={() => setShowSurahPicker(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBarWrapper}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Cari nama surat..."
                placeholderTextColor="#94A3B8"
                value={surahSearch}
                onChangeText={setSurahSearch}
              />
            </View>
            <FlatList
              data={filteredSurahs}
              keyExtractor={(item) => String(item.number)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.surahRow}
                  onPress={() => handleSelectSurah(item.number)}
                >
                  <View style={styles.surahNumBadge}>
                    <Text style={styles.surahNumText}>{item.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.surahRowName}>{item.name}</Text>
                    <Text style={styles.surahRowInfo}>
                      {item.totalVerses} Ayat • Juz {item.juz} • Hal. {item.startPage}
                    </Text>
                  </View>
                  <Text style={styles.surahRowArabic}>{item.arabic}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ─── SANTRI PICKER MODAL ─── */}
      <Modal visible={showSantriModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Santri</Text>
              <TouchableOpacity onPress={() => setShowSantriModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBarWrapper}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Cari nama santri..."
                placeholderTextColor="#94A3B8"
                value={santriSearch}
                onChangeText={setSantriSearch}
              />
            </View>
            <FlatList
              data={filteredSantris}
              keyExtractor={(item) => String(item.siswa_id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.surahRow}
                  onPress={() => {
                    setSelectedSiswaId(item.siswa_id);
                    setShowSantriModal(false);
                    setSantriSearch("");
                  }}
                >
                  <View style={styles.surahNumBadge}>
                    <User size={14} color="#162E6E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.surahRowName}>{item.nama}</Text>
                    {item.nis && <Text style={styles.surahRowInfo}>NIS: {item.nis}</Text>}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      {/* ─── TANGGAL PICKER MODAL (KALENDER VISUAL HP) ─── */}
      <SingleDatePickerModal
        visible={showDatePickerModal}
        onClose={() => setShowDatePickerModal(false)}
        value={formTanggal}
        onSelect={(date) => setFormTanggal(date)}
        title="Pilih Tanggal Tilawah"
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 12,
    color: "#93C5FD",
    marginTop: 1,
  },
  badgeRole: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeRoleText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: "#162E6E",
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  tabBtnTextActive: {
    color: "#162E6E",
    fontWeight: "700",
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
  },
  summaryNum: {
    fontSize: 18,
    fontWeight: "800",
    color: "#162E6E",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  searchBarWrapper: {
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 40,
  },
  searchBarInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: "#1E293B",
  },
  recordCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  recordTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  recordName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  recordKelas: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  dateBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dateBadgeText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  recordRangeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 8,
    gap: 6,
    marginBottom: 8,
  },
  recordRangeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  recordFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pagePill: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pagePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4338CA",
  },
  waktuPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  waktuPillText: {
    fontSize: 11,
    color: "#475569",
  },
  diinputOlehText: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 6,
    fontStyle: "italic",
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  modeToggleBtnActive: {
    backgroundColor: "#162E6E",
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  modeToggleTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#162E6E",
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 4,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 40,
  },
  textInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: "#1E293B",
  },
  pickerSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pickerSelectorVal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  pickerSelectorSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  pickerSelectorLocked: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  },
  lockedSantriIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  lockedAutoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  lockedAutoBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  calcStatsBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  calcStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calcItem: {
    alignItems: "center",
    flex: 1,
  },
  calcNum: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4338CA",
  },
  calcLabel: {
    fontSize: 10,
    color: "#6366F1",
    marginTop: 1,
  },
  presetWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  presetChipActive: {
    backgroundColor: "#162E6E",
    borderColor: "#162E6E",
  },
  presetText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  presetTextActive: {
    color: "#FFFFFF",
  },
  inputInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  inputInfoText: {
    fontSize: 11,
    color: "#64748B",
  },
  submitBtn: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  surahRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  surahNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  surahNumText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#162E6E",
  },
  surahRowName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  surahRowInfo: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  surahRowArabic: {
    fontSize: 16,
    color: "#162E6E",
    fontWeight: "bold",
  },
  checkSantriRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  checkSantriRowActive: {
    backgroundColor: "#EEF2FF",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#162E6E",
    borderColor: "#162E6E",
  },
  checkSantriName: {
    fontSize: 13,
    color: "#1E293B",
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748B",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
