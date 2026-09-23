// mobile/src/screens/Dashboard/TeacherDashboardScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  BookOpen,
  ScrollText,
  Calendar,
  Clock,
  Compass,
  BookMarked,
  Newspaper,
  MoreHorizontal,
  Bell,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  GraduationCap,
  MapPin,
  Megaphone,
  QrCode,
  Scan,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  X,
  CheckCircle2,
  FileText,
  Info,
  Sparkles,
  Share2,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { canInputTahfidz, canViewTahfidz, canManageKBM } from "../../utils/permissions";
import { APP_CONFIG } from "../../constants/config";
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

export const TeacherDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const isTahfidzUser = canInputTahfidz(user);
  const [refreshing, setRefreshing] = useState(false);

  // Lokasi & Prayer times state dinamis
  const [selectedCity, setSelectedCity] = useState<CityLocation>(INDONESIAN_CITIES[0]);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [showCityPickerModal, setShowCityPickerModal] = useState(false);

  const dynamicPrayer = useMemo(() => calculatePrayerTimes(selectedCity), [selectedCity]);
  const qiblaAngle = (dynamicPrayer.qiblaBearing - deviceHeading + 360) % 360;
  const isQiblaAligned = Math.abs(qiblaAngle) < 4 || Math.abs(qiblaAngle - 360) < 4;

  // Prayer times static wrapper
  const [prayerData, setPrayerData] = useState<PrayerTimesData>(() => getPrayerTimes());

  // Interactive Modals
  const [showSholatModal, setShowSholatModal] = useState(false);
  const [showKiblatModal, setShowKiblatModal] = useState(false);
  const [showDoaModal, setShowDoaModal] = useState(false);
  const [selectedDoa, setSelectedDoa] = useState<DoaItem | null>(null);
  const [showBeritaModal, setShowBeritaModal] = useState(false);
  const [showLainnyaModal, setShowLainnyaModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);

  // Update prayer time on mount & interval
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
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const userName = user?.pegawai?.nama || user?.username || "Amin Rois";
  const userRole = user?.roles?.[0]?.nama_role || "Santri MTs YKUI";

  // Data Berita Pesantren
  const BERITA_LIST = [
    {
      id: "1",
      title: "Peringatan Maulid Nabi Muhammad SAW di Masjid Jami' Maskumambang",
      category: "Kegiatan Pesantren",
      date: "20 September 2025",
      author: "Humas Pesantren",
      content:
        "Ribuan santri dan asatidz memadati Masjid Jami' Pondok Pesantren Maskumambang dalam rangka memperingati Maulid Nabi Muhammad SAW dengan lantunan sholawat dan tausiyah penuh berkah.",
    },
    {
      id: "2",
      title: "Prestasi Gemilang Santri Maskumambang di Olimpiade Bahasa Arab Nasional",
      category: "Prestasi Akademik",
      date: "18 September 2025",
      author: "Tim Media",
      content:
        "Alhamdulillah, santri MA Maskumambang berhasil meraih Juara 1 dan 3 dalam ajang Olimpiade Bahasa Arab (OBA) tingkat Provinsi Jawa Timur.",
    },
    {
      id: "3",
      title: "Sosialisasi Penerimaan Santri Baru (PSB) Tahun Ajaran 2026/2027",
      category: "Informasi PSB",
      date: "15 September 2025",
      author: "Panitia PSB",
      content:
        "Pondok Pesantren Maskumambang membuka pendaftaran santri baru untuk jenjang MI, MTs, MA, dan SMK berbasis asrama tahfidz & kitab kuning.",
    },
  ];

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
          {/* Mosque Watermark Image Backdrop */}
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
                {/* Notification Bell */}
                <TouchableOpacity
                  style={styles.headerIconBtn}
                  onPress={() => navigation.navigate("Berita")}
                  activeOpacity={0.8}
                >
                  <Bell size={20} color="#FFFFFF" />
                  <View style={styles.unreadDot} />
                </TouchableOpacity>

                {/* Profile Avatar */}
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
              <Text style={styles.greetingSub}>Assalamu'alaikum</Text>
              <Text style={styles.greetingName}>{userName}</Text>
              <Text style={styles.greetingRole}>{userRole}</Text>
            </View>
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
            3. QUICK ACTION 8-GRID MENU
        ════════════════════════════════════════════════════════ */}
        <View style={styles.menuGridContainer}>
          <View style={styles.menuGridRow}>
            {/* 1. LMS */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate("LmsTab")}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: "#10b981" }]}>
                <BookOpen size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>LMS</Text>
            </TouchableOpacity>

            {/* 2. Setoran Hafalan (Guru Tahfidz) or Jadwal Pelajaran (Guru Mapel) */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() =>
                isTahfidzUser
                  ? navigation.navigate("TahfidzSetoran")
                  : navigation.navigate("JadwalTab")
              }
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.gridIconCircle,
                  { backgroundColor: isTahfidzUser ? "#3b82f6" : "#059669" },
                ]}
              >
                {isTahfidzUser ? (
                  <ScrollText size={24} color="#FFFFFF" />
                ) : (
                  <Calendar size={24} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.gridCardTitle}>
                {isTahfidzUser ? "Setoran Hafalan" : "Jadwal Pelajaran"}
              </Text>
            </TouchableOpacity>

            {/* 3. Jadwal Kegiatan */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate("JadwalTab")}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: "#8b5cf6" }]}>
                <Calendar size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>Jadwal Kegiatan</Text>
            </TouchableOpacity>

            {/* 4. Jadwal Sholat */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => setShowSholatModal(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: "#059669" }]}>
                <Clock size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>Jadwal Sholat</Text>
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

            {/* 7. Berita */}
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

            {/* 8. Lainnya */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => setShowLainnyaModal(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: "#64748b" }]}>
                <MoreHorizontal size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.gridCardTitle}>Lainnya</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════
            4. DUA KARTU PROGRESS & KELAS (2 Columns)
        ════════════════════════════════════════════════════════ */}
        <View style={styles.dualCardContainer}>
          {/* Card Kiri: Progress Hafalan */}
          <TouchableOpacity
            style={styles.dualCard}
            onPress={() => navigation.navigate("TahfidzSetoran")}
            activeOpacity={0.85}
          >
            <View style={styles.dualCardHeader}>
              <View style={styles.dualCardTitleRow}>
                <BookOpen size={16} color="#15803d" />
                <Text style={styles.dualCardTitle}>Progress Hafalan</Text>
              </View>
            </View>

            <View style={styles.hafalanContentRow}>
              {/* Circular Ring Gauge */}
              <View style={styles.circularGauge}>
                <View style={styles.circularInner}>
                  <Text style={styles.gaugeNumber}>12</Text>
                  <Text style={styles.gaugeUnit}>Juz</Text>
                </View>
              </View>

              {/* Detail Hafalan */}
              <View style={styles.hafalanDetails}>
                <Text style={styles.hafalanJuz}>Juz 29</Text>
                <Text style={styles.hafalanSurat}>Surat An-Naml</Text>
                <Text style={styles.hafalanHalaman}>Halaman 12 – 15</Text>

                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: "75%" }]} />
                </View>
                <Text style={styles.progressStatusText}>3/4 setoran</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Card Kanan: Kelas di LMS */}
          <TouchableOpacity
            style={styles.dualCard}
            onPress={() => navigation.navigate("JadwalTab")}
            activeOpacity={0.85}
          >
            <View style={styles.dualCardHeader}>
              <View style={styles.dualCardTitleRow}>
                <GraduationCap size={16} color="#1d4ed8" />
                <Text style={styles.dualCardTitle}>Kelas di LMS</Text>
              </View>
            </View>

            <View style={styles.lmsClassBox}>
              <View style={styles.lmsClassTop}>
                <View style={styles.lmsIconBox}>
                  <BookOpen size={18} color="#1d4ed8" />
                </View>
                <View style={styles.lmsClassBadge}>
                  <Text style={styles.lmsClassBadgeText}>Hari ini</Text>
                </View>
              </View>

              <Text style={styles.lmsClassName} numberOfLines={1}>
                Fiqih Ibadah
              </Text>
              <Text style={styles.lmsTeacherName} numberOfLines={1}>
                Ust. Ahmad Fauzi
              </Text>

              <View style={[styles.progressBarBg, { marginTop: 8 }]}>
                <View style={[styles.progressBarFill, { width: "40%", backgroundColor: "#3b82f6" }]} />
              </View>
              <Text style={styles.progressStatusText}>2/5 materi</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════
            5. BANNER & INFORMASI PENTING (Bottom Section)
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
                Disiplin Hari Ini{"\n"}Untuk Masa Depan Terbaik
              </Text>
              <Text style={styles.bannerQuoteSub}>
                Bersama Maskumambang, menuju generasi yang berilmu, berakhlak dan bermanfaat.
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

          {/* Informasi Penting Card */}
          <View style={styles.infoPentingCard}>
            <View style={styles.infoPentingHeader}>
              <Megaphone size={16} color="#162E6E" />
              <Text style={styles.infoPentingTitle}>Informasi Penting</Text>
            </View>

            {/* List 1 */}
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate("Berita")}
              activeOpacity={0.7}
            >
              <View style={styles.infoItemIcon}>
                <Calendar size={15} color="#1d4ed8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoItemTitle}>Jadwal Ujian Tengah Semester</Text>
                <Text style={styles.infoItemMeta}>Sen, 29 Sep 2025</Text>
              </View>
            </TouchableOpacity>

            {/* List 2 */}
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate("Berita")}
              activeOpacity={0.7}
            >
              <View style={styles.infoItemIcon}>
                <FileText size={15} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoItemTitle}>Pengumuman Asrama</Text>
                <Text style={styles.infoItemMeta}>Hari ini, 08:00</Text>
              </View>
            </TouchableOpacity>

            {/* List 3 */}
            <TouchableOpacity
              style={[styles.infoItem, { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate("Berita")}
              activeOpacity={0.7}
            >
              <View style={styles.infoItemIcon}>
                <Info size={15} color="#d97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoItemTitle}>Pengumuman Lainnya</Text>
                <Text style={[styles.infoItemMeta, { color: "#2563eb", fontWeight: "700" }]}>
                  Lihat semua ›
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════
          MODAL 1: JADWAL SHOLAT LENGKAP & IMSAKIYAH
      ════════════════════════════════════════════════════════ */}
      <Modal
        visible={showSholatModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSholatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={[styles.gridIconCircle, { width: 34, height: 34, backgroundColor: "#059669" }]}>
                  <Clock size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.modalSheetTitle}>Jadwal Sholat & Imsakiyah</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowSholatModal(false);
                      setShowCityPickerModal(true);
                    }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
                  >
                    <Text style={[styles.modalSheetSub, { color: "#059669", fontWeight: "700" }]}>
                      📍 {selectedCity.name} (Ubah Lokasi ▾)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowSholatModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Highlight Card */}
              <View style={styles.sholatDetailHero}>
                <Text style={styles.sholatHeroLabel}>Sholat Selanjutnya</Text>
                <Text style={styles.sholatHeroPrayer}>{dynamicPrayer.nextPrayer.name}</Text>
                <Text style={styles.sholatHeroTime}>{dynamicPrayer.nextPrayer.time} WIB</Text>
                <Text style={styles.sholatHeroCountdown}>
                  ⏳ Hitung Mundur: {dynamicPrayer.nextPrayer.countdown}
                </Text>
              </View>

              {/* Schedule Table */}
              <View style={styles.sholatTable}>
                {[
                  { name: "Imsak", time: `${dynamicPrayer.times.imsak} WIB`, icon: <Sunrise size={16} color="#64748b" /> },
                  { name: "Subuh", time: `${dynamicPrayer.times.subuh} WIB`, icon: <Sunrise size={16} color="#0284c7" /> },
                  { name: "Terbit / Syuruq", time: `${dynamicPrayer.times.terbit} WIB`, icon: <Sun size={16} color="#ea580c" /> },
                  { name: "Dhuha", time: `${dynamicPrayer.times.dhuha} WIB`, icon: <Sun size={16} color="#eab308" /> },
                  { name: "Dzuhur", time: `${dynamicPrayer.times.dzuhur} WIB`, icon: <Sun size={16} color="#eab308" /> },
                  { name: "Ashar", time: `${dynamicPrayer.times.ashar} WIB`, icon: <Sun size={16} color="#16a34a" /> },
                  { name: "Maghrib (Buka Puasa)", time: `${dynamicPrayer.times.maghrib} WIB`, icon: <Sunset size={16} color="#ea580c" /> },
                  { name: "Isya", time: `${dynamicPrayer.times.isya} WIB`, icon: <Moon size={16} color="#3b82f6" /> },
                ].map((item, index) => (
                  <View key={index} style={styles.sholatTableRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      {item.icon}
                      <Text style={styles.sholatTableName}>{item.name}</Text>
                    </View>
                    <Text style={styles.sholatTableTime}>{item.time}</Text>
                  </View>
                ))}
              </View>

              {/* Sunnah Recommendation */}
              <View style={styles.sunnahCard}>
                <Sparkles size={16} color="#15803d" />
                <Text style={styles.sunnahText}>
                  "Barangsiapa sholat berjamaah di masjid tepat waktu, Allah akan melipatgandakan pahalanya 27 derajat." (HR. Bukhari & Muslim)
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL 2: ARAH KIBLAT (Interactive Qibla Compass)
      ════════════════════════════════════════════════════════ */}
      <Modal
        visible={showKiblatModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowKiblatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={[styles.gridIconCircle, { width: 34, height: 34, backgroundColor: "#f97316" }]}>
                  <Compass size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.modalSheetTitle}>Kompas Arah Kiblat</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowKiblatModal(false);
                      setShowCityPickerModal(true);
                    }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
                  >
                    <Text style={[styles.modalSheetSub, { color: "#ea580c", fontWeight: "700" }]}>
                      📍 {selectedCity.name} (Ubah Lokasi ▾)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowKiblatModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", paddingVertical: 14 }}>
              {/* Degree Badge */}
              <View style={[styles.qiblaDegreeBadge, isQiblaAligned && { backgroundColor: "#16A34A", borderColor: "#16A34A" }]}>
                <Text style={[styles.qiblaDegreeNumber, isQiblaAligned && { color: "#FFFFFF" }]}>
                  {dynamicPrayer.qiblaBearing}°
                </Text>
                <Text style={[styles.qiblaDegreeLabel, isQiblaAligned && { color: "#FFFFFF" }]}>
                  {isQiblaAligned ? "✅ Arah Kiblat Tepat Sesuai!" : "Arahkan jarum ke Ka'bah"}
                </Text>
              </View>

              {/* Visual Compass Circle */}
              <View style={styles.compassContainer}>
                <View style={styles.compassDial}>
                  {/* Cardinal Points */}
                  <Text style={[styles.cardinalPoint, { top: 10, fontWeight: "900", color: "#dc2626" }]}>U (0°)</Text>
                  <Text style={[styles.cardinalPoint, { right: 12 }]}>T (90°)</Text>
                  <Text style={[styles.cardinalPoint, { bottom: 10 }]}>S (180°)</Text>
                  <Text style={[styles.cardinalPoint, { left: 12 }]}>B (270°)</Text>

                  {/* Kaaba Direction Indicator Line */}
                  <View style={[styles.compassNeedle, { transform: [{ rotate: `${qiblaAngle}deg` }] }]}>
                    <View style={[styles.needlePointer, isQiblaAligned && { backgroundColor: "#16A34A" }]} />
                    <View style={styles.kaabaIconBox}>
                      <Text style={{ fontSize: 22 }}>🕋</Text>
                    </View>
                  </View>

                  <View style={styles.compassCenterDot} />
                </View>
              </View>

              {/* Putar Arah Simulator */}
              <View style={{ width: "100%", backgroundColor: "#F8FAFC", padding: 12, borderRadius: 14, marginBottom: 14, alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: "#64748B", marginBottom: 8, fontWeight: "500" }}>
                  Arah Kompas HP ({deviceHeading}°):
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    style={{ backgroundColor: "#E2E8F0", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 }}
                    onPress={() => setDeviceHeading((prev) => (prev - 15 + 360) % 360)}
                  >
                    <Text style={{ fontSize: 10.5, fontWeight: "700", color: "#334155" }}>◀ Putar 15°</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: "#059669", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 }}
                    onPress={() => setDeviceHeading(Math.round(dynamicPrayer.qiblaBearing))}
                  >
                    <Text style={{ fontSize: 10.5, fontWeight: "700", color: "#FFFFFF" }}>🎯 Pas ke Kiblat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: "#E2E8F0", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 }}
                    onPress={() => setDeviceHeading((prev) => (prev + 15) % 360)}
                  >
                    <Text style={{ fontSize: 10.5, fontWeight: "700", color: "#334155" }}>Putar 15° ▶</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Info Badges */}
              <View style={styles.qiblaInfoGrid}>
                <View style={styles.qiblaInfoItem}>
                  <Text style={styles.qiblaInfoLabel}>Jarak ke Ka'bah</Text>
                  <Text style={styles.qiblaInfoValue}>± {dynamicPrayer.distanceKaaba.toLocaleString("id-ID")} KM</Text>
                </View>
                <View style={styles.qiblaInfoItem}>
                  <Text style={styles.qiblaInfoLabel}>Titik Koordinat</Text>
                  <Text style={styles.qiblaInfoValue}>
                    {selectedCity.latitude.toFixed(2)}°, {selectedCity.longitude.toFixed(2)}°
                  </Text>
                </View>
              </View>

              <Text style={styles.qiblaTip}>
                💡 Letakkan HP di atas permukaan datar untuk keakuratan sensor arah kiblat.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL 3: PILIH LOKASI KOTA / GPS
      ════════════════════════════════════════════════════════ */}
      <Modal
        visible={showCityPickerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCityPickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: "75%" }]}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MapPin size={20} color="#059669" />
                <View>
                  <Text style={styles.modalSheetTitle}>Pilih Lokasi Sholat & Kiblat</Text>
                  <Text style={styles.modalSheetSub}>Sesuaikan jadwal dan arah kiblat terkini</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCityPickerModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
              {INDONESIAN_CITIES.map((city) => {
                const isSelected = city.id === selectedCity.id;
                return (
                  <TouchableOpacity
                    key={city.id}
                    style={[
                      {
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderBottomWidth: 1,
                        borderColor: "#F1F5F9",
                      },
                      isSelected && { backgroundColor: "#F0FDF4", borderRadius: 12 },
                    ]}
                    onPress={() => {
                      setSelectedCity(city);
                      setShowCityPickerModal(false);
                    }}
                  >
                    <View>
                      <Text style={[{ fontSize: 13, fontWeight: "600", color: "#0F172A" }, isSelected && { color: "#059669", fontWeight: "700" }]}>
                        {city.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{city.province}</Text>
                    </View>
                    {isSelected && <CheckCircle2 size={18} color="#059669" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL 3: DOA & DZIKIR HARIAN
        ════════════════════════════════════════════════════════ */}
      <Modal
        visible={showDoaModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setSelectedDoa(null);
          setShowDoaModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={[styles.gridIconCircle, { width: 34, height: 34, backgroundColor: "#0284c7" }]}>
                  <BookMarked size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.modalSheetTitle}>Doa & Dzikir Harian</Text>
                  <Text style={styles.modalSheetSub}>Kumpulan doa mustajab santri & guru</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedDoa(null);
                  setShowDoaModal(false);
                }}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            {selectedDoa ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12 }}>
                <TouchableOpacity
                  onPress={() => setSelectedDoa(null)}
                  style={styles.backToDoaListBtn}
                >
                  <Text style={styles.backToDoaText}>‹ Kembali ke Kumpulan Doa</Text>
                </TouchableOpacity>

                <Text style={styles.doaDetailJudul}>{selectedDoa.judul}</Text>
                <Text style={styles.doaDetailKategori}>{selectedDoa.kategori}</Text>

                <View style={styles.doaArabicBox}>
                  <Text style={styles.doaArabicText}>{selectedDoa.arab}</Text>
                </View>

                <Text style={styles.doaDetailLabel}>Transliterasi Latin:</Text>
                <Text style={styles.doaLatinText}>{selectedDoa.latin}</Text>

                <Text style={[styles.doaDetailLabel, { marginTop: 12 }]}>Artinya:</Text>
                <Text style={styles.doaArtiText}>"{selectedDoa.arti}"</Text>

                {selectedDoa.riwayat && (
                  <View style={styles.doaRiwayatBox}>
                    <Text style={styles.doaRiwayatText}>📚 {selectedDoa.riwayat}</Text>
                  </View>
                )}
              </ScrollView>
            ) : (
              <FlatList
                data={DOA_DZIKIR_LIST}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingVertical: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.doaListItem}
                    onPress={() => setSelectedDoa(item)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.doaItemJudul}>{item.judul}</Text>
                      <Text style={styles.doaItemKategori}>{item.kategori}</Text>
                      <Text style={styles.doaItemSnippet} numberOfLines={1}>
                        {item.arab}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL 4: BERITA & PENGUMUMAN PESANTREN
        ════════════════════════════════════════════════════════ */}
      <Modal
        visible={showBeritaModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setSelectedNews(null);
          setShowBeritaModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={[styles.gridIconCircle, { width: 34, height: 34, backgroundColor: "#f43f5e" }]}>
                  <Newspaper size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.modalSheetTitle}>Kabar & Berita Pesantren</Text>
                  <Text style={styles.modalSheetSub}>Informasi aktual Maskumambang</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedNews(null);
                  setShowBeritaModal(false);
                }}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            {selectedNews ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12 }}>
                <TouchableOpacity
                  onPress={() => setSelectedNews(null)}
                  style={styles.backToDoaListBtn}
                >
                  <Text style={styles.backToDoaText}>‹ Kembali ke Daftar Berita</Text>
                </TouchableOpacity>

                <Text style={styles.newsDetailTitle}>{selectedNews.title}</Text>
                <Text style={styles.newsDetailMeta}>
                  {selectedNews.category} • {selectedNews.date} • Oleh {selectedNews.author}
                </Text>

                <Image
                  source={require("../../../assets/pesantren-bg.jpg")}
                  style={styles.newsDetailImg}
                  resizeMode="cover"
                />

                <Text style={styles.newsDetailBody}>{selectedNews.content}</Text>
              </ScrollView>
            ) : (
              <FlatList
                data={BERITA_LIST}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingVertical: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.newsCardItem}
                    onPress={() => setSelectedNews(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.newsBadgeRow}>
                      <Text style={styles.newsBadgeText}>{item.category}</Text>
                      <Text style={styles.newsDateText}>{item.date}</Text>
                    </View>
                    <Text style={styles.newsItemTitle}>{item.title}</Text>
                    <Text style={styles.newsItemSnippet} numberOfLines={2}>
                      {item.content}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL 5: PROFIL PESANTREN & LAINNYA
        ════════════════════════════════════════════════════════ */}
      <Modal
        visible={showLainnyaModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLainnyaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={[styles.gridIconCircle, { width: 34, height: 34, backgroundColor: "#162E6E" }]}>
                  <Info size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.modalSheetTitle}>Profil & Informasi Pesantren</Text>
                  <Text style={styles.modalSheetSub}>Pondok Pesantren Maskumambang Dukun Gresik</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowLainnyaModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Image
                source={require("../../../assets/pesantren-bg.jpg")}
                style={styles.profilPesantrenImg}
                resizeMode="cover"
              />

              <Text style={styles.profilHeading}>Visi & Misi</Text>
              <Text style={styles.profilBody}>
                "Menyemai Aqidah Shohihah, Menuai Akhlak Karimah, Membangun Generasi Unggul Berwawasan Global."
              </Text>

              <Text style={styles.profilHeading}>Jenjang Pendidikan</Text>
              <View style={styles.jenjangGrid}>
                {["MI Maskumambang", "MTs YKUI Putra & Putri", "MA Maskumambang", "SMK Maskumambang", "Ma'had Aly Tahfidz"].map((j, i) => (
                  <View key={i} style={styles.jenjangBadge}>
                    <CheckCircle2 size={13} color="#15803d" />
                    <Text style={styles.jenjangText}>{j}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.profilHeading}>Alamat & Kontak</Text>
              <Text style={styles.profilBody}>
                Jl. Raya Sembungan Kidul No. 01, Dukun, Gresik, Jawa Timur 61155{"\n"}
                Website: https://maskumambang.ac.id{"\n"}
                Portal LMS: https://lms2.maskumambang.ac.id
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
    backgroundColor: "#F4F7FE",
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // 1. Header Styles
  headerBackground: {
    backgroundColor: "#0D1C44",
    paddingBottom: 48,
    position: "relative",
    overflow: "hidden",
  },
  headerBackdropImage: {
    position: "absolute",
    right: -20,
    top: 0,
    width: width * 0.75,
    height: "100%",
    opacity: 0.22,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(13, 28, 68, 0.85)",
  },
  headerContent: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 14 : 0,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  logoImg: {
    width: "100%",
    height: "100%",
  },
  brandSub: {
    fontSize: 10,
    color: "#93c5fd",
    fontWeight: "600",
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  brandMotto: {
    fontSize: 8.5,
    color: "#cbd5e1",
    fontWeight: "500",
    marginTop: 1,
  },
  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 1.5,
    borderColor: "#0D1C44",
  },
  profileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 20,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0D1C44",
  },
  greetingBox: {
    marginTop: 4,
  },
  greetingSub: {
    fontSize: 12,
    color: "#93c5fd",
    fontWeight: "600",
  },
  greetingName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
  },
  greetingRole: {
    fontSize: 12,
    color: "#cbd5e1",
    fontWeight: "600",
    marginTop: 2,
  },

  // 2. Waktu Sholat Card
  sholatCardWrapper: {
    paddingHorizontal: 16,
    marginTop: -32,
  },
  sholatCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  sholatCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sholatLocationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mosqueBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sholatHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },
  sholatLocationText: {
    fontSize: 10.5,
    color: "#64748B",
    fontWeight: "600",
  },
  sholatDateRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  gregorianDateText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },
  hijriDateText: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  prayerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  activePrayerBox: {
    width: "28%",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  activePrayerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  activePrayerName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
  },
  activePrayerTime: {
    fontSize: 16,
    fontWeight: "900",
    color: "#14532D",
    marginTop: 1,
  },
  countdownBadge: {
    marginTop: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countdownText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#15803D",
  },
  prayerTimesGrid: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  prayerItem: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  prayerItemHighlighted: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  prayerItemActive: {
    backgroundColor: "#FEF08A",
  },
  prayerItemLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 4,
  },
  prayerItemTime: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },

  // 3. Quick Action Grid Menu
  menuGridContainer: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  menuGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  gridCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  gridIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  gridCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  gridCardSub: {
    fontSize: 8.5,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },

  // 4. Dual Middle Cards
  dualCardContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 18,
    gap: 12,
  },
  dualCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
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
    fontSize: 11.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  dualCardLink: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#15803D",
  },
  hafalanContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  circularGauge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 4,
    borderColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  circularInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeNumber: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
  gaugeUnit: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#15803D",
  },
  hafalanDetails: {
    flex: 1,
  },
  hafalanJuz: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F172A",
  },
  hafalanSurat: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#475569",
    marginTop: 1,
  },
  hafalanHalaman: {
    fontSize: 8.5,
    color: "#94A3B8",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 2,
  },
  progressStatusText: {
    fontSize: 8.5,
    color: "#64748B",
    marginTop: 3,
    fontWeight: "600",
  },
  lmsClassBox: {
    flex: 1,
  },
  lmsClassTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  lmsIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  lmsClassBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lmsClassBadgeText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#15803D",
  },
  lmsClassName: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  lmsTeacherName: {
    fontSize: 9.5,
    color: "#64748B",
    marginTop: 1,
  },

  // 5. Bottom Section: Banner & Info Penting
  bottomSectionContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  pesantrenBanner: {
    flex: 1.1,
    backgroundColor: "#0D1C44",
    borderRadius: 18,
    overflow: "hidden",
    padding: 14,
    position: "relative",
    justifyContent: "space-between",
    minHeight: 140,
  },
  bannerBgImage: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
    opacity: 0.35,
  },
  bannerDarkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(13, 28, 68, 0.75)",
  },
  bannerContent: {
    zIndex: 2,
  },
  bannerQuoteTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 16,
  },
  bannerQuoteSub: {
    fontSize: 8.5,
    color: "#CBD5E1",
    marginTop: 4,
    lineHeight: 12,
  },
  bannerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  bannerActionText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  infoPentingCard: {
    flex: 1.1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  infoPentingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoPentingTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F172A",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
    gap: 8,
  },
  infoItemIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  infoItemTitle: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  infoItemMeta: {
    fontSize: 8,
    color: "#64748B",
    marginTop: 1,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: "85%",
    minHeight: "50%",
  },
  modalSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalSheetTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSheetSub: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },

  // Sholat Modal Inside
  sholatDetailHero: {
    backgroundColor: "#0D1C44",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 14,
  },
  sholatHeroLabel: {
    fontSize: 11,
    color: "#93C5FD",
    fontWeight: "700",
  },
  sholatHeroPrayer: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
  },
  sholatHeroTime: {
    fontSize: 16,
    fontWeight: "800",
    color: "#86EFAC",
    marginTop: 1,
  },
  sholatHeroCountdown: {
    fontSize: 11,
    color: "#CBD5E1",
    marginTop: 6,
    fontWeight: "600",
  },
  sholatTable: {
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 10,
  },
  sholatTableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  sholatTableName: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  sholatTableTime: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#162E6E",
  },
  sunnahCard: {
    flexDirection: "row",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    gap: 8,
    alignItems: "flex-start",
  },
  sunnahText: {
    flex: 1,
    fontSize: 11,
    color: "#166534",
    lineHeight: 16,
    fontStyle: "italic",
  },

  // Qibla Compass
  qiblaDegreeBadge: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDBA74",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  qiblaDegreeNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: "#C2410C",
  },
  qiblaDegreeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9A3412",
  },
  compassContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  compassDial: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cardinalPoint: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.7)",
  },
  compassNeedle: {
    position: "absolute",
    width: 4,
    height: 140,
    alignItems: "center",
    justifyContent: "space-between",
  },
  needlePointer: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 20,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#10B981",
  },
  kaabaIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  compassCenterDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
  },
  qiblaInfoGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    width: "100%",
  },
  qiblaInfoItem: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  qiblaInfoLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  qiblaInfoValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  qiblaTip: {
    fontSize: 10.5,
    color: "#64748B",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 15,
  },

  // Doa List
  doaListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  doaItemJudul: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  doaItemKategori: {
    fontSize: 10,
    color: "#0284C7",
    fontWeight: "700",
    marginTop: 2,
  },
  doaItemSnippet: {
    fontSize: 13,
    color: "#475569",
    marginTop: 3,
  },
  backToDoaListBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    marginBottom: 8,
  },
  backToDoaText: {
    fontSize: 12,
    color: "#0284C7",
    fontWeight: "700",
  },
  doaDetailJudul: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  doaDetailKategori: {
    fontSize: 11,
    color: "#0284C7",
    fontWeight: "700",
    marginTop: 2,
    marginBottom: 12,
  },
  doaArabicBox: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  doaArabicText: {
    fontSize: 20,
    lineHeight: 34,
    color: "#0F172A",
    textAlign: "right",
    fontFamily: Platform.OS === "ios" ? "Geeza Pro" : "System",
  },
  doaDetailLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 3,
  },
  doaLatinText: {
    fontSize: 12,
    color: "#334155",
    lineHeight: 18,
    fontStyle: "italic",
  },
  doaArtiText: {
    fontSize: 12,
    color: "#1E293B",
    lineHeight: 18,
  },
  doaRiwayatBox: {
    backgroundColor: "#F1F5F9",
    padding: 8,
    borderRadius: 8,
    marginTop: 14,
  },
  doaRiwayatText: {
    fontSize: 10.5,
    color: "#475569",
    fontWeight: "600",
  },

  // News Modal
  newsCardItem: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  newsBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  newsBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#F43F5E",
  },
  newsDateText: {
    fontSize: 9.5,
    color: "#94A3B8",
  },
  newsItemTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  newsItemSnippet: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 16,
  },
  newsDetailTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  newsDetailMeta: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 12,
  },
  newsDetailImg: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    marginBottom: 12,
  },
  newsDetailBody: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 20,
  },

  // Profil Pesantren
  profilPesantrenImg: {
    width: "100%",
    height: 150,
    borderRadius: 14,
    marginVertical: 12,
  },
  profilHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 12,
    marginBottom: 4,
  },
  profilBody: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
  },
  jenjangGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  jenjangBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  jenjangText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#166534",
  },
});
