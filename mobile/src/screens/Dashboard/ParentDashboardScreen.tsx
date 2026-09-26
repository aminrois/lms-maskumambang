// mobile/src/screens/Dashboard/ParentDashboardScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ScrollText,
  Calendar,
  Clock,
  Compass,
  BookMarked,
  Newspaper,
  Bell,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  GraduationCap,
  MapPin,
  Megaphone,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  X,
  CheckCircle2,
  FileText,
  Info,
  User,
  Award,
  Wallet,
  CreditCard,
  Sparkles,
  ExternalLink,
  Lock,
} from "lucide-react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { waliService, AnakItem } from "../../api/waliService";
import { newsService, WordPressPost } from "../../api/newsService";
import { groupJadwalSessions, GroupedJadwalSesi } from "../../utils/jadwalHelper";
import {
  getPrayerTimes,
  PrayerTimesData,
  DOA_DZIKIR_LIST,
  DoaItem,
} from "../../utils/islamicPrayerUtil";
import {
  INDONESIAN_CITIES,
  CityLocation,
  calculatePrayerTimes,
} from "../../utils/prayerAndQibla";

const { width } = Dimensions.get("window");

const HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

const getNamaHariIni = () => {
  const dayIndex = new Date().getDay();
  const map = [6, 0, 1, 2, 3, 4, 5];
  return HARI_ORDER[map[dayIndex]];
};

const formatTanggal = (dateStr?: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

export const ParentDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Lokasi & Prayer times state dinamis
  const [selectedCity, setSelectedCity] = useState<CityLocation>(INDONESIAN_CITIES[0]);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [showCityPickerModal, setShowCityPickerModal] = useState(false);

  const dynamicPrayer = useMemo(() => calculatePrayerTimes(selectedCity), [selectedCity]);
  const qiblaAngle = (dynamicPrayer.qiblaBearing - deviceHeading + 360) % 360;
  const isQiblaAligned = Math.abs(qiblaAngle) < 4 || Math.abs(qiblaAngle - 360) < 4;

  const [prayerData, setPrayerData] = useState<PrayerTimesData>(() => getPrayerTimes());

  // Interactive Modals
  const [showSholatModal, setShowSholatModal] = useState(false);
  const [showKiblatModal, setShowKiblatModal] = useState(false);
  const [showDoaModal, setShowDoaModal] = useState(false);
  const [showKeuanganModal, setShowKeuanganModal] = useState(false);
  const [showBeritaModal, setShowBeritaModal] = useState(false);
  const [showLainnyaModal, setShowLainnyaModal] = useState(false);

  // Wali Modals
  const [showTahfidzModal, setShowTahfidzModal] = useState(false);
  const [tahfidzFilterKategori, setTahfidzFilterKategori] = useState<string>("Semua");
  const [showPresensiModal, setShowPresensiModal] = useState(false);
  const [showJadwalModal, setShowJadwalModal] = useState(false);
  const [selectedJadwalHari, setSelectedJadwalHari] = useState<string>(getNamaHariIni());
  const [showLmsModal, setShowLmsModal] = useState(false);

  // Santri selection state
  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(null);

  // Query Daftar Anak
  const {
    data: daftarAnak = [],
    isLoading: isLoadingAnak,
    refetch: refetchAnak,
  } = useQuery({
    queryKey: ["wali-daftar-anak"],
    queryFn: () => waliService.getDaftarAnak(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (daftarAnak.length > 0 && selectedSiswaId === null) {
      setSelectedSiswaId(daftarAnak[0].siswa_id);
    }
  }, [daftarAnak, selectedSiswaId]);

  // Query Perkembangan Anak yang Dipilih
  const {
    data: perkembangan,
    isLoading: isLoadingPerkembangan,
    refetch: refetchPerkembangan,
  } = useQuery({
    queryKey: ["wali-perkembangan-anak", selectedSiswaId],
    queryFn: () => (selectedSiswaId ? waliService.getPerkembanganAnak(selectedSiswaId) : null),
    enabled: !!selectedSiswaId,
    staleTime: 2 * 60 * 1000,
  });

  // Query Berita dari Website Maskumambang
  const {
    data: newsPosts = [],
    isLoading: isLoadingNews,
    refetch: refetchNews,
  } = useQuery({
    queryKey: ["wali-berita-list"],
    queryFn: () => newsService.getPosts({ per_page: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setPrayerData(getPrayerTimes());
    const interval = setInterval(() => {
      setPrayerData(getPrayerTimes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setPrayerData(getPrayerTimes());
    await Promise.all([refetchAnak(), refetchPerkembangan(), refetchNews()]);
    setRefreshing(false);
  };

  const userName = user?.pegawai?.nama || user?.username || "Wali Murid";

  const activeAnak = useMemo(
    () => daftarAnak.find((a) => a.siswa_id === selectedSiswaId) || daftarAnak[0],
    [daftarAnak, selectedSiswaId]
  );

  const rekap = perkembangan?.presensi?.rekap30Hari;
  const totalHari = (rekap?.hadir || 0) + (rekap?.izin || 0) + (rekap?.sakit || 0) + (rekap?.alpa || 0);
  const persentaseHadir = totalHari > 0 ? Math.round(((rekap?.hadir || 0) / totalHari) * 100) : 100;
  const totalSetoran = perkembangan?.tahfidz?.summary?.totalSetoran || 0;
  const totalJuz = perkembangan?.tahfidz?.summary?.totalJuzZiyadah || 0;
  const targetNominal = perkembangan?.tahfidz?.targetAktif?.target_nominal || 30;
  const targetPercent = Math.min(100, Math.round((totalJuz / targetNominal) * 100)) || 10;
  const hariIni = getNamaHariIni();

  // Kelompokkan jadwal pelajaran per sesi yang sinkron
  const allGroupedJadwal = useMemo<GroupedJadwalSesi[]>(() => {
    const list = (perkembangan?.jadwalPelajaran as any[]) || [];
    return groupJadwalSessions(list);
  }, [perkembangan?.jadwalPelajaran]);

  const jadwalHariIniGrouped = useMemo(() => {
    return allGroupedJadwal.filter((s) => s.hari === hariIni);
  }, [allGroupedJadwal, hariIni]);

  const latestSetoran = useMemo(() => {
    if (perkembangan?.tahfidz?.recentSetoran?.length) {
      return perkembangan.tahfidz.recentSetoran[0];
    }
    return activeAnak?.tahfidz_setoran?.[0] || null;
  }, [perkembangan, activeAnak]);

  // Filtered Setoran List untuk Laporan Hafalan
  const filteredSetoranList = useMemo(() => {
    const rawList = perkembangan?.tahfidz?.recentSetoran || activeAnak?.tahfidz_setoran || [];
    if (tahfidzFilterKategori === "Semua") return rawList;
    return rawList.filter((s: any) => s.kategori === tahfidzFilterKategori);
  }, [perkembangan, activeAnak, tahfidzFilterKategori]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#162E6E"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════════════════════════════════════════════
            1. TOP HEADER (Deep Gradient Navy with Mosque Backdrop)
        ════════════════════════════════════════════════════════ */}
        <View style={styles.headerBackground}>
          <Image
            source={require("../../../assets/pesantren-bg.jpg")}
            style={styles.headerBackdropImage}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay} />

          <SafeAreaView edges={["top"]} style={styles.headerContent}>
            {/* Top Brand & Actions Bar */}
            <View style={styles.topBar}>
              <View style={styles.brandRow}>
                <View style={styles.logoBadge}>
                  <Image
                    source={require("../../../assets/logo.png")}
                    style={styles.logoImg}
                    resizeMode="contain"
                  />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.brandSub}>Pondok Pesantren</Text>
                  <Text style={styles.brandTitle}>Maskumambang</Text>
                  <Text style={styles.brandMotto}>
                    Menyemai Aqidah Shohihah, Menuai Akhlak Karimah
                  </Text>
                </View>
              </View>

              <View style={styles.topRightActions}>
                <TouchableOpacity
                  style={styles.headerIconBtn}
                  onPress={() => setShowBeritaModal(true)}
                  activeOpacity={0.8}
                >
                  <Bell size={20} color="#FFFFFF" />
                  <View style={styles.unreadDot} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileBtn}
                  onPress={() => navigation.navigate("ProfileTab")}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
                  </View>
                  <ChevronDown size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>

            {/* User Greeting */}
            <View style={styles.greetingBox}>
              <Text style={styles.greetingSub}>Assalamu'alaikum Warahmatullah,</Text>
              <Text style={styles.greetingName}>{userName}</Text>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>Wali Murid Santri</Text>
              </View>
            </View>

            {/* Santri Switcher Strip (Jika ada anak / santri) */}
            {daftarAnak.length > 0 && (
              <View style={styles.santriSelectorContainer}>
                <Text style={styles.santriSelectorLabel}>Santri yang Dipantau:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.santriScroll}>
                  {daftarAnak.map((anak) => {
                    const isSelected = anak.siswa_id === selectedSiswaId;
                    return (
                      <TouchableOpacity
                        key={anak.siswa_id}
                        style={[
                          styles.santriChip,
                          isSelected && styles.santriChipActive,
                        ]}
                        onPress={() => setSelectedSiswaId(anak.siswa_id)}
                        activeOpacity={0.85}
                      >
                        <User size={13} color={isSelected ? "#FFFFFF" : "#CBD5E1"} />
                        <Text
                          style={[
                            styles.santriChipText,
                            isSelected && styles.santriChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {anak.nama} {anak.kelas ? `(${anak.kelas.nama_kelas})` : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </SafeAreaView>
        </View>

        {/* ═══════════════════════════════════════════════════════
            2. WAKTU SHOLAT CARD (Floating Card)
        ════════════════════════════════════════════════════════ */}
        <View style={styles.sholatCardWrapper}>
          <TouchableOpacity
            style={styles.sholatCard}
            onPress={() => setShowSholatModal(true)}
            activeOpacity={0.92}
          >
            {/* Card Header */}
            <View style={styles.sholatCardHeader}>
              <View style={styles.sholatLocationRow}>
                <View style={styles.mosqueBadge}>
                  <MapPin size={15} color="#162E6E" />
                </View>
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.sholatHeading}>Waktu Sholat</Text>
                  <TouchableOpacity
                    onPress={() => setShowCityPickerModal(true)}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <Text style={styles.sholatLocationText}>📍 {selectedCity.name} ▾</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sholatDateRight}>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.gregorianDateText}>{prayerData.gregorianDateFormatted}</Text>
                  <Text style={styles.hijriDateText}>{prayerData.hijriDateFormatted}</Text>
                </View>
                <Calendar size={18} color="#162E6E" style={{ marginLeft: 6 }} />
              </View>
            </View>

            {/* Prayer Times Row */}
            <View style={styles.prayerRow}>
              {/* Active Next Prayer Highlighted Box */}
              <View style={styles.activePrayerBox}>
                <View style={styles.activePrayerIconCircle}>
                  <Sun size={20} color="#15803d" />
                </View>
                <Text style={styles.activePrayerName}>{dynamicPrayer.nextPrayer.name}</Text>
                <Text style={styles.activePrayerTime}>{dynamicPrayer.nextPrayer.time}</Text>
                <View style={styles.countdownBadge}>
                  <Text style={styles.countdownText}>{dynamicPrayer.nextPrayer.countdown}</Text>
                </View>
              </View>

              {/* Individual Prayer Times Columns */}
              <View style={styles.prayerTimesGrid}>
                {/* Subuh */}
                <View
                  style={[
                    styles.prayerItem,
                    dynamicPrayer.nextPrayer.name === "Subuh" && styles.prayerItemActive,
                  ]}
                >
                  <Sunrise size={18} color="#64748b" />
                  <Text style={styles.prayerItemLabel}>Subuh</Text>
                  <Text style={styles.prayerItemTime}>{dynamicPrayer.times.subuh}</Text>
                </View>

                {/* Dzuhur */}
                <View
                  style={[
                    styles.prayerItem,
                    dynamicPrayer.nextPrayer.name === "Dzuhur" && styles.prayerItemActive,
                  ]}
                >
                  <Sun size={18} color="#eab308" />
                  <Text style={styles.prayerItemLabel}>Dzuhur</Text>
                  <Text style={styles.prayerItemTime}>{dynamicPrayer.times.dzuhur}</Text>
                </View>

                {/* Ashar */}
                <View
                  style={[
                    styles.prayerItem,
                    styles.prayerItemHighlighted,
                    dynamicPrayer.nextPrayer.name === "Ashar" && styles.prayerItemActive,
                  ]}
                >
                  <Sun size={18} color="#15803d" />
                  <Text style={[styles.prayerItemLabel, { color: "#15803d", fontWeight: "700" }]}>
                    Ashar
                  </Text>
                  <Text style={[styles.prayerItemTime, { color: "#15803d", fontWeight: "700" }]}>
                    {dynamicPrayer.times.ashar}
                  </Text>
                </View>

                {/* Maghrib */}
                <View
                  style={[
                    styles.prayerItem,
                    dynamicPrayer.nextPrayer.name === "Maghrib" && styles.prayerItemActive,
                  ]}
                >
                  <Sunset size={18} color="#ea580c" />
                  <Text style={styles.prayerItemLabel}>Maghrib</Text>
                  <Text style={styles.prayerItemTime}>{dynamicPrayer.times.maghrib}</Text>
                </View>

                {/* Isya */}
                <View
                  style={[
                    styles.prayerItem,
                    dynamicPrayer.nextPrayer.name === "Isya" && styles.prayerItemActive,
                  ]}
                >
                  <Moon size={18} color="#3b82f6" />
                  <Text style={styles.prayerItemLabel}>Isya</Text>
                  <Text style={styles.prayerItemTime}>{dynamicPrayer.times.isya}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════
            3. QUICK ACTION 8-GRID MENU (Sama seperti Guru)
        ════════════════════════════════════════════════════════ */}
        <View style={styles.menuGridContainer}>
          <View style={styles.menuGridRow}>
            {/* 1. LMS Santri */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate("WaliLms", { siswaId: selectedSiswaId })}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: "#10b981" }]}>
                <GraduationCap size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>LMS Santri</Text>
            </TouchableOpacity>

            {/* 2. Laporan Hafalan */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate("WaliLaporanHafalan", { siswaId: selectedSiswaId })}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: "#3b82f6" }]}>
                <ScrollText size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>Laporan Hafalan</Text>
            </TouchableOpacity>

            {/* 3. Presensi Santri */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate("WaliPresensi", { siswaId: selectedSiswaId })}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: "#8b5cf6" }]}>
                <CheckCircle2 size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>Presensi Santri</Text>
            </TouchableOpacity>

            {/* 4. Jadwal Pelajaran */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate("WaliJadwal", { siswaId: selectedSiswaId })}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: "#059669" }]}>
                <Calendar size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>Jadwal Pelajaran</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.menuGridRow, { marginTop: 12 }]}>
            {/* 5. Arah Kiblat */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => setShowKiblatModal(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: "#f97316" }]}>
                <Compass size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>Arah Kiblat</Text>
            </TouchableOpacity>

            {/* 6. Doa & Dzikir */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => setShowDoaModal(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: "#0284c7" }]}>
                <BookMarked size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>Doa & Dzikir</Text>
            </TouchableOpacity>

            {/* 7. Berita (Langsung navigasi ke Layar Berita seperti Guru) */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate("Berita")}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: "#f43f5e" }]}>
                <Newspaper size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>Berita</Text>
            </TouchableOpacity>

            {/* 8. Bimbingan & Karakter Santri (Guidance) */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate("WaliGuidance", { siswaId: selectedSiswaId })}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: "#162E6E" }]}>
                <Compass size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>Bimbingan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════
            4. DUA KARTU PROGRESS & PRESENSI (2 Columns)
        ════════════════════════════════════════════════════════ */}
        <View style={styles.dualCardContainer}>
          {/* Card Kiri: Progress Laporan Hafalan Santri */}
          <TouchableOpacity
            style={styles.dualCard}
            onPress={() => navigation.navigate("WaliLaporanHafalan", { siswaId: selectedSiswaId })}
            activeOpacity={0.85}
          >
            <View style={styles.dualCardHeader}>
              <View style={styles.dualCardTitleRow}>
                <BookOpen size={16} color="#15803d" />
                <Text style={styles.dualCardTitle}>Laporan Hafalan</Text>
              </View>
              <ChevronRight size={14} color="#94A3B8" />
            </View>

            <View style={styles.hafalanContentRow}>
              {/* Circular Ring Gauge */}
              <View style={styles.circularGauge}>
                <View style={styles.circularInner}>
                  <Text style={styles.gaugeNumber}>{totalJuz}</Text>
                  <Text style={styles.gaugeUnit}>Juz</Text>
                </View>
              </View>

              {/* Detail Hafalan */}
              <View style={styles.hafalanDetails}>
                <Text style={styles.hafalanJuz}>
                  Target: {targetNominal} Juz
                </Text>
                <Text style={styles.hafalanSurat} numberOfLines={1}>
                  {latestSetoran
                    ? `${latestSetoran.surat_mulai_nama || "Al-Qur'an"} : ${latestSetoran.ayat_mulai || 1}-${latestSetoran.ayat_selesai || 7}`
                    : "Belum ada setoran"}
                </Text>
                <Text style={styles.hafalanHalaman}>
                  {latestSetoran?.kelancaran || "Lihat Rapor Hafalan ›"}
                </Text>

                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${targetPercent}%` }]} />
                </View>
                <Text style={styles.progressStatusText}>
                  {totalSetoran} riwayat setoran
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Card Kanan: Presensi & Absensi */}
          <TouchableOpacity
            style={styles.dualCard}
            onPress={() => navigation.navigate("WaliPresensi", { siswaId: selectedSiswaId })}
            activeOpacity={0.85}
          >
            <View style={styles.dualCardHeader}>
              <View style={styles.dualCardTitleRow}>
                <CheckCircle2 size={16} color="#1d4ed8" />
                <Text style={styles.dualCardTitle}>Kehadiran</Text>
              </View>
              <ChevronRight size={14} color="#94A3B8" />
            </View>

            <View style={styles.lmsClassBox}>
              <View style={styles.lmsClassTop}>
                <View style={styles.lmsIconBox}>
                  <CheckCircle2 size={18} color="#1d4ed8" />
                </View>
                <View style={styles.lmsClassBadge}>
                  <Text style={styles.lmsClassBadgeText}>{persentaseHadir}% Hadir</Text>
                </View>
              </View>

              <Text style={styles.lmsClassName} numberOfLines={1}>
                {activeAnak?.nama || "Santri"}
              </Text>
              <Text style={styles.lmsTeacherName} numberOfLines={1}>
                Hadir: {rekap?.hadir || 0} • Izin: {rekap?.izin || 0} • Sakit: {rekap?.sakit || 0}
              </Text>

              <View style={[styles.progressBarBg, { marginTop: 8 }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${persentaseHadir}%`,
                      backgroundColor: persentaseHadir > 80 ? "#10b981" : "#f59e0b",
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressStatusText}>Lihat Rekapitulasi ›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════
            5. KARTU JADWAL PELAJARAN HARI INI (Sinkron & Terkelompok)
        ════════════════════════════════════════════════════════ */}
        <View style={styles.jadwalSectionContainer}>
          <TouchableOpacity
            style={styles.jadwalCard}
            onPress={() => navigation.navigate("WaliJadwal", { siswaId: selectedSiswaId })}
            activeOpacity={0.9}
          >
            <View style={styles.jadwalCardHeader}>
              <View style={styles.jadwalHeaderLeft}>
                <View style={styles.jadwalIconBox}>
                  <Calendar size={18} color="#8b5cf6" />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.jadwalTitle}>Jadwal Pelajaran Hari Ini</Text>
                  <Text style={styles.jadwalSubtitle}>
                    {hariIni} • {activeAnak?.kelas?.nama_kelas || "Kelas Aktif"}
                  </Text>
                </View>
              </View>
              <View style={styles.jadwalBadge}>
                <Text style={styles.jadwalBadgeText}>Lihat Semua ›</Text>
              </View>
            </View>

            {jadwalHariIniGrouped.length > 0 ? (
              <View style={styles.jadwalList}>
                {jadwalHariIniGrouped.slice(0, 4).map((item, idx) => (
                  <View key={idx} style={styles.jadwalItemRow}>
                    <View style={styles.jadwalTimeBadge}>
                      <Clock size={12} color="#1E293B" />
                      <Text style={styles.jadwalTimeText}>
                        {item.timeRangeStr}
                      </Text>
                    </View>
                    <View style={styles.jadwalInfoCol}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={styles.jadwalMapelName}>{item.namaMapel}</Text>
                        <Text style={styles.jadwalJamKePill}>{item.labelJam}</Text>
                      </View>
                      <Text style={styles.jadwalGuruName}>
                        {item.firstJadwal?.pegawai?.nama || "Ustadz / Ustadzah"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.jadwalEmptyBox}>
                <Text style={styles.jadwalEmptyText}>
                  Tidak ada jadwal mata pelajaran pada hari {hariIni}, santri fokus kegiatan asrama & halaqoh.
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════
            6. BANNER PESANTREN & BERITA DARI WEBSITE
        ════════════════════════════════════════════════════════ */}
        <View style={styles.bottomSectionContainer}>
          {/* Banner Dark Navy with Mosque Photo */}
          <View style={styles.pesantrenBanner}>
            <Image
              source={require("../../../assets/pesantren-bg.jpg")}
              style={styles.bannerBgImage}
              resizeMode="cover"
            />
            <View style={styles.bannerDarkOverlay} />

            <View style={styles.bannerContent}>
              <Text style={styles.bannerQuoteTitle}>
                Mendidik dengan Hati,{"\n"}Menjaga Amanah Wali Santri
              </Text>
              <Text style={styles.bannerQuoteSub}>
                Pondok Pesantren Maskumambang berkomitmen membina generasi Qur'ani, berakhlak mulia, dan berprestasi.
              </Text>

              <TouchableOpacity
                style={styles.bannerActionBtn}
                onPress={() => setShowLainnyaModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.bannerActionText}>Lihat Profil Pesantren</Text>
                <ArrowRight size={13} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Informasi & Berita Website Card */}
          <View style={styles.infoPentingCard}>
            <View style={styles.infoPentingHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Newspaper size={16} color="#162E6E" />
                <Text style={styles.infoPentingTitle}>Kabar & Berita Pesantren</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate("Berita")}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <Text style={{ fontSize: 11, color: "#2563EB", fontWeight: "700" }}>Lihat Semua ›</Text>
              </TouchableOpacity>
            </View>

            {isLoadingNews ? (
              <View style={{ paddingVertical: 14, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#162E6E" />
                <Text style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>Memuat berita terkini...</Text>
              </View>
            ) : newsPosts.length > 0 ? (
              newsPosts.slice(0, 3).map((post, idx) => (
                <TouchableOpacity
                  key={post.id || idx}
                  style={[
                    styles.infoItem,
                    idx === Math.min(newsPosts.length, 3) - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => navigation.navigate("Berita")}
                  activeOpacity={0.7}
                >
                  <View style={styles.infoItemIcon}>
                    <Sparkles size={14} color="#1D4ED8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoItemTitle} numberOfLines={1}>
                      {post.title}
                    </Text>
                    <Text style={styles.infoItemMeta}>
                      {post.dateFormatted || "Berita Terkini"} • {post.category || "Berita Pesantren"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ paddingVertical: 10, alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: "#94A3B8" }}>Belum ada kabar berita terbaru.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════
          MODAL 1: JADWAL SHOLAT LENGKAP
      ════════════════════════════════════════════════════════ */}
      <Modal visible={showSholatModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={[styles.modalHeaderIconCircle, { backgroundColor: "#DCFCE7" }]}>
                  <Clock size={20} color="#16A34A" />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.modalSheetTitle}>Jadwal Sholat Hari Ini</Text>
                  <Text style={styles.modalSheetSubtitle}>📍 {selectedCity.name} ({prayerData.gregorianDateFormatted})</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowSholatModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              {[
                { name: "Imsak", time: dynamicPrayer.times.imsak, icon: Moon, color: "#64748b" },
                { name: "Subuh", time: dynamicPrayer.times.subuh, icon: Sunrise, color: "#0284c7" },
                { name: "Terbit", time: dynamicPrayer.times.terbit, icon: Sun, color: "#d97706" },
                { name: "Dhuha", time: dynamicPrayer.times.dhuha, icon: Sun, color: "#16a34a" },
                { name: "Dzuhur", time: dynamicPrayer.times.dzuhur, icon: Sun, color: "#eab308" },
                { name: "Ashar", time: dynamicPrayer.times.ashar, icon: Sun, color: "#15803d" },
                { name: "Maghrib", time: dynamicPrayer.times.maghrib, icon: Sunset, color: "#ea580c" },
                { name: "Isya", time: dynamicPrayer.times.isya, icon: Moon, color: "#3b82f6" },
              ].map((p, idx) => (
                <View key={idx} style={styles.modalSholatRow}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <p.icon size={20} color={p.color} />
                    <Text style={styles.modalSholatName}>{p.name}</Text>
                  </View>
                  <Text style={styles.modalSholatTime}>{p.time} WIB</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL 2: ARAH KIBLAT INTERAKTIF
      ════════════════════════════════════════════════════════ */}
      <Modal visible={showKiblatModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={[styles.modalHeaderIconCircle, { backgroundColor: "#FFEDD5" }]}>
                  <Compass size={20} color="#EA580C" />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.modalSheetTitle}>Arah Kiblat</Text>
                  <Text style={styles.modalSheetSubtitle}>Ka'bah, Makkah Al-Mukarramah</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowKiblatModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 24, alignItems: "center" }}>
              <View style={styles.compassOuter}>
                <View style={[styles.compassNeedle, { transform: [{ rotate: `${dynamicPrayer.qiblaBearing}deg` }] }]}>
                  <Compass size={80} color="#162E6E" />
                </View>
              </View>
              <Text style={styles.compassDegreeText}>{dynamicPrayer.qiblaBearing}° Barat-Barat Laut</Text>
              <Text style={styles.compassSubText}>Titik koordinat {selectedCity.name} menuju Ka'bah di Makkah.</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL 3: DOA & DZIKIR HARIAN
      ════════════════════════════════════════════════════════ */}
      <Modal visible={showDoaModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={[styles.modalHeaderIconCircle, { backgroundColor: "#E0F2FE" }]}>
                  <BookMarked size={20} color="#0284C7" />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.modalSheetTitle}>Kumpulan Doa & Dzikir</Text>
                  <Text style={styles.modalSheetSubtitle}>Doa Harian Santri & Orang Tua</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowDoaModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              {DOA_DZIKIR_LIST.map((d) => (
                <View key={d.id} style={styles.doaCard}>
                  <Text style={styles.doaTitle}>{d.judul}</Text>
                  <Text style={styles.doaArab}>{d.arab}</Text>
                  <Text style={styles.doaLatin}>{d.latin}</Text>
                  <Text style={styles.doaArti}>"{d.arti}"</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL 4: PILIH KOTA (GPS / REGION PICKER)
      ════════════════════════════════════════════════════════ */}
      <Modal visible={showCityPickerModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>Pilih Lokasi Wilayah</Text>
              <TouchableOpacity onPress={() => setShowCityPickerModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={INDONESIAN_CITIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.cityPickerRow,
                    selectedCity.id === item.id && styles.cityPickerRowActive,
                  ]}
                  onPress={() => {
                    setSelectedCity(item);
                    setShowCityPickerModal(false);
                  }}
                >
                  <Text style={[styles.cityPickerText, selectedCity.id === item.id && styles.cityPickerTextActive]}>
                    {item.name} ({item.province})
                  </Text>
                  {selectedCity.id === item.id && <CheckCircle2 size={16} color="#162E6E" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL 5: PROFIL & INFORMASI PESANTREN
      ════════════════════════════════════════════════════════ */}
      <Modal visible={showLainnyaModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>Tentang Pesantren Maskumambang</Text>
              <TouchableOpacity onPress={() => setShowLainnyaModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 16 }}>
              <Text style={{ fontSize: 14, color: "#334155", lineHeight: 22 }}>
                Pondok Pesantren Maskumambang berdiri di Dukun, Gresik sejak tahun 1859 M. Memadukan kurikulum kepesantrenan berbasis kitab turots dan tahfidz Al-Qur'an dengan kurikulum formal kementerian.
              </Text>
              <Text style={{ fontSize: 13, color: "#64748B", marginTop: 12 }}>
                Layanan Informasi & Sekretariat:{"\n"}
                📞 (031) 3949 123{"\n"}
                🌐 www.maskumambang.ac.id
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // 1. Header Styles (Identik Guru)
  headerBackground: {
    position: "relative",
    backgroundColor: "#162E6E",
    paddingBottom: 28,
  },
  headerBackdropImage: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
    opacity: 0.18,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(22, 46, 110, 0.88)",
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 14 : 6,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImg: {
    width: "100%",
    height: "100%",
  },
  brandSub: {
    color: "#93C5FD",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  brandMotto: {
    color: "#E2E8F0",
    fontSize: 8.5,
    fontWeight: "500",
    fontStyle: "italic",
  },
  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  unreadDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  profileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 20,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  greetingBox: {
    marginTop: 4,
    marginBottom: 8,
  },
  greetingSub: {
    color: "#BFDBFE",
    fontSize: 12.5,
    fontWeight: "500",
  },
  greetingName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
  },
  rolePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    borderColor: "#10B981",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 6,
  },
  rolePillText: {
    color: "#A7F3D0",
    fontSize: 11,
    fontWeight: "700",
  },

  // Santri Selector Strip
  santriSelectorContainer: {
    marginTop: 14,
  },
  santriSelectorLabel: {
    color: "#93C5FD",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  santriScroll: {
    flexDirection: "row",
  },
  santriChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  santriChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#60A5FA",
  },
  santriChipText: {
    color: "#CBD5E1",
    fontSize: 11.5,
    fontWeight: "600",
    marginLeft: 6,
  },
  santriChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  // 2. Waktu Sholat Floating Card
  sholatCardWrapper: {
    paddingHorizontal: 16,
    marginTop: -16,
  },
  sholatCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sholatCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 10,
    marginBottom: 10,
  },
  sholatLocationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mosqueBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sholatHeading: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  sholatLocationText: {
    color: "#162E6E",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },
  sholatDateRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  gregorianDateText: {
    color: "#334155",
    fontSize: 11.5,
    fontWeight: "700",
  },
  hijriDateText: {
    color: "#16A34A",
    fontSize: 10,
    fontWeight: "600",
  },
  prayerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  activePrayerBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    width: 82,
    marginRight: 8,
  },
  activePrayerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  activePrayerName: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "800",
  },
  activePrayerTime: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 1,
  },
  countdownBadge: {
    backgroundColor: "#16A34A",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginTop: 3,
  },
  countdownText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "800",
  },
  prayerTimesGrid: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  prayerItem: {
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  prayerItemActive: {
    backgroundColor: "#F1F5F9",
  },
  prayerItemHighlighted: {},
  prayerItemLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },
  prayerItemTime: {
    color: "#0F172A",
    fontSize: 10.5,
    fontWeight: "700",
    marginTop: 1,
  },

  // 3. 8-Grid Menu
  menuGridContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  menuGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridCard: {
    width: (width - 32 - 36) / 4,
    alignItems: "center",
  },
  gridIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  gridCardTitle: {
    color: "#1E293B",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },

  // 4. Dua Kartu Berdampingan (Dual Cards)
  dualCardContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 18,
    gap: 12,
  },
  dualCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  dualCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dualCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dualCardTitle: {
    color: "#0F172A",
    fontSize: 12.5,
    fontWeight: "800",
  },
  hafalanContentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  circularGauge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#DCFCE7",
    borderWidth: 3,
    borderColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  circularInner: {
    alignItems: "center",
  },
  gaugeNumber: {
    color: "#15803D",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 16,
  },
  gaugeUnit: {
    color: "#166534",
    fontSize: 8.5,
    fontWeight: "700",
  },
  hafalanDetails: {
    flex: 1,
  },
  hafalanJuz: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "800",
  },
  hafalanSurat: {
    color: "#334155",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
  },
  hafalanHalaman: {
    color: "#16A34A",
    fontSize: 9.5,
    fontWeight: "700",
    marginTop: 1,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    marginTop: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#16A34A",
    borderRadius: 3,
  },
  progressStatusText: {
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "600",
    marginTop: 3,
  },
  lmsClassBox: {
    flex: 1,
  },
  lmsClassTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  lmsIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  lmsClassBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lmsClassBadgeText: {
    color: "#1D4ED8",
    fontSize: 9,
    fontWeight: "700",
  },
  lmsClassName: {
    color: "#0F172A",
    fontSize: 11.5,
    fontWeight: "800",
  },
  lmsTeacherName: {
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "500",
    marginTop: 1,
  },

  // 5. Jadwal Pelajaran Section
  jadwalSectionContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  jadwalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  jadwalCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 10,
    marginBottom: 10,
  },
  jadwalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  jadwalIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  jadwalTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  jadwalSubtitle: {
    color: "#64748B",
    fontSize: 10.5,
    fontWeight: "500",
    marginTop: 1,
  },
  jadwalBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  jadwalBadgeText: {
    color: "#4B5563",
    fontSize: 10.5,
    fontWeight: "700",
  },
  jadwalList: {
    gap: 8,
  },
  jadwalItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
  },
  jadwalTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
  },
  jadwalTimeText: {
    color: "#1E293B",
    fontSize: 9.5,
    fontWeight: "700",
    marginLeft: 4,
  },
  jadwalInfoCol: {
    flex: 1,
  },
  jadwalMapelName: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
  },
  jadwalGuruName: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "500",
  },
  jadwalEmptyBox: {
    paddingVertical: 12,
    alignItems: "center",
  },
  jadwalEmptyText: {
    color: "#94A3B8",
    fontSize: 11,
    textAlign: "center",
  },

  // 6. Bottom Banner & Pengumuman
  bottomSectionContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  pesantrenBanner: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#162E6E",
    padding: 16,
    marginBottom: 14,
  },
  bannerBgImage: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
    opacity: 0.25,
  },
  bannerDarkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(22, 46, 110, 0.85)",
  },
  bannerContent: {
    zIndex: 2,
  },
  bannerQuoteTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  bannerQuoteSub: {
    color: "#BFDBFE",
    fontSize: 10.5,
    fontWeight: "500",
    marginTop: 4,
    marginBottom: 10,
    lineHeight: 15,
  },
  bannerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  bannerActionText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "700",
  },
  infoPentingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  infoPentingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 8,
    marginBottom: 8,
  },
  infoPentingTitle: {
    color: "#0F172A",
    fontSize: 12.5,
    fontWeight: "800",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  infoItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoItemTitle: {
    color: "#1E293B",
    fontSize: 11.5,
    fontWeight: "700",
  },
  infoItemMeta: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 1,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalSheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  modalSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalHeaderIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSheetTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  modalSheetSubtitle: {
    color: "#64748B",
    fontSize: 11.5,
    fontWeight: "500",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSectionTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 8,
  },
  tahfidzTargetBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    padding: 14,
  },
  tahfidzTargetLabel: {
    color: "#1E40AF",
    fontSize: 11,
    fontWeight: "700",
  },
  tahfidzTargetValue: {
    color: "#1E3A8A",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  setoranCardItem: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  setoranCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  setoranSuratText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  kelancaranBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kelancaranBadgeText: {
    color: "#16A34A",
    fontSize: 10,
    fontWeight: "700",
  },
  setoranDateText: {
    color: "#64748B",
    fontSize: 10.5,
    marginTop: 4,
  },
  setoranCatatan: {
    color: "#334155",
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 4,
  },
  presensiStatsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  presensiStatCard: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  presensiStatNumber: {
    fontSize: 18,
    fontWeight: "900",
  },
  presensiStatLabel: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  presensiRateBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  presensiRateLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  presensiRateValue: {
    color: "#16A34A",
    fontSize: 16,
    fontWeight: "900",
  },
  presensiHistoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  presensiDateText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
  },
  presensiMapelText: {
    color: "#64748B",
    fontSize: 10.5,
  },
  presensiStatusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  presensiStatusTagText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  jadwalDaySection: {
    marginBottom: 14,
  },
  jadwalDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  jadwalDayTitle: {
    color: "#1E293B",
    fontSize: 12,
    fontWeight: "800",
  },
  jadwalDayCount: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
  },
  jadwalDayItem: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  jadwalDayTime: {
    color: "#2563EB",
    fontSize: 9.5,
    fontWeight: "700",
  },
  jadwalDaySubject: {
    color: "#0F172A",
    fontSize: 11.5,
    fontWeight: "700",
  },
  jadwalDayTeacher: {
    color: "#64748B",
    fontSize: 10,
  },
  jadwalDayEmpty: {
    color: "#94A3B8",
    fontSize: 10.5,
    fontStyle: "italic",
    paddingLeft: 4,
  },
  lmsInfoBanner: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  lmsInfoTitle: {
    color: "#065F46",
    fontSize: 12.5,
    fontWeight: "800",
  },
  lmsInfoText: {
    color: "#047857",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  santriDetailCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
  },
  santriDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  santriDetailLabel: {
    color: "#64748B",
    fontSize: 11.5,
  },
  santriDetailVal: {
    color: "#0F172A",
    fontSize: 11.5,
    fontWeight: "700",
  },
  emptyCard: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyCardText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  modalSholatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalSholatName: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 10,
  },
  modalSholatTime: {
    color: "#162E6E",
    fontSize: 13,
    fontWeight: "800",
  },
  compassOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#EEF2FF",
    borderWidth: 3,
    borderColor: "#C7D2FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  compassNeedle: {
    alignItems: "center",
    justifyContent: "center",
  },
  compassDegreeText: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
  },
  compassSubText: {
    color: "#64748B",
    fontSize: 11.5,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16,
  },
  doaCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  doaTitle: {
    color: "#0F172A",
    fontSize: 12.5,
    fontWeight: "800",
    marginBottom: 6,
  },
  doaArab: {
    color: "#162E6E",
    fontSize: 16,
    textAlign: "right",
    lineHeight: 26,
    fontWeight: "700",
  },
  doaLatin: {
    color: "#2563EB",
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 6,
  },
  doaArti: {
    color: "#475569",
    fontSize: 11,
    marginTop: 4,
  },
  cityPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cityPickerRowActive: {
    backgroundColor: "#EEF2FF",
  },
  cityPickerText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  cityPickerTextActive: {
    color: "#162E6E",
    fontWeight: "800",
  },
  newsDetailCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  newsDetailBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    fontSize: 9.5,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  newsDetailTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  newsDetailDate: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 2,
    marginBottom: 6,
  },
  newsDetailContent: {
    color: "#334155",
    fontSize: 11.5,
    lineHeight: 18,
  },

  // SOON Badge
  soonBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  soonBadgeText: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "900",
  },

  // Laporan Hafalan Extras
  activeTargetBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeTargetBadgeText: {
    color: "#16A34A",
    fontSize: 10,
    fontWeight: "700",
  },
  categoryFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 12,
  },
  categoryFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryFilterPillActive: {
    backgroundColor: "#162E6E",
    borderColor: "#162E6E",
  },
  categoryFilterPillText: {
    color: "#64748B",
    fontSize: 11.5,
    fontWeight: "600",
  },
  categoryFilterPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  jenisHafalanBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  jenisHafalanBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
  },
  kategoriTextSmall: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "500",
  },
  catatanGuruBox: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },

  // Jadwal Extras
  jadwalJamKePill: {
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  daySelectorBar: {
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 8,
  },
  daySelectorPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginRight: 8,
  },
  daySelectorPillActive: {
    backgroundColor: "#162E6E",
    borderColor: "#162E6E",
  },
  daySelectorPillText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },
  daySelectorPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  dayCountBadge: {
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 5,
  },
  dayCountBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  dayCountBadgeText: {
    color: "#334155",
    fontSize: 9.5,
    fontWeight: "800",
  },
  dayCountBadgeTextActive: {
    color: "#FFFFFF",
  },
  jadwalSessionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  jadwalSessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  jadwalSessionTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  jadwalSessionTimeText: {
    color: "#1E40AF",
    fontSize: 10.5,
    fontWeight: "700",
  },
  jadwalSessionJamBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  jadwalSessionJamText: {
    color: "#475569",
    fontSize: 10.5,
    fontWeight: "700",
  },
  jadwalSessionMapel: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  jadwalSessionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
    paddingTop: 6,
  },
  jadwalSessionGuru: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "500",
  },
  jadwalSessionKelas: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "700",
  },

  // Keuangan SOON Modal
  soonHeroBox: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  soonIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  soonHeroTitle: {
    color: "#1E1B4B",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  soonHeroDesc: {
    color: "#4338CA",
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
  },
  soonFeatureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  soonFeatureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4F46E5",
    marginTop: 5,
    marginRight: 10,
  },
  soonFeatureTitle: {
    color: "#0F172A",
    fontSize: 12.5,
    fontWeight: "700",
  },
  soonFeatureSub: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  soonCloseBtn: {
    backgroundColor: "#162E6E",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
  },
  soonCloseBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
