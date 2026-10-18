// mobile/src/screens/Guest/GuestDashboardScreen.tsx
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
  Dimensions,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  BookOpen,
  BookMarked,
  Newspaper,
  Compass,
  Bell,
  CalendarDays,
  Calendar,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  ChevronRight,
  MapPin,
  LogIn,
  X,
  FileCheck2,
  Megaphone,
  ArrowRight,
  Info,
  FileText,
  Scale,
  MessageCircleQuestion,
} from "lucide-react-native";
import {
  getPrayerTimes,
  PrayerTimesData,
} from "../../utils/islamicPrayerUtil";
import {
  calculatePrayerTimes,
  INDONESIAN_CITIES,
  CityLocation,
} from "../../utils/prayerAndQibla";
import { useLocationStore } from "../../store/useLocationStore";

const { width } = Dimensions.get("window");

export const GuestDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  // Lokasi & Waktu Sholat dari location store terpusat
  const {
    currentLocation: selectedCity,
    isGpsActive,
    fetchCurrentLocation,
    setSelectedCity,
  } = useLocationStore();

  const [prayerData, setPrayerData] = useState<PrayerTimesData>(() =>
    getPrayerTimes()
  );
  const [showSholatModal, setShowSholatModal] = useState(false);
  const [showCityPickerModal, setShowCityPickerModal] = useState(false);

  useEffect(() => {
    fetchCurrentLocation();
    setPrayerData(getPrayerTimes());
    const interval = setInterval(() => {
      setPrayerData(getPrayerTimes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const dynamicPrayer = useMemo(
    () => calculatePrayerTimes(selectedCity),
    [selectedCity]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setPrayerData(getPrayerTimes());
    await fetchCurrentLocation(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  /* Notifikasi interaktif mode tamu untuk menu-menu di bawah */
  const showGuestAlert = (featureName: string, desc?: string) => {
    Alert.alert(
      "🔒 Mode Tamu",
      desc ||
        `Fitur "${featureName}" hanya dapat diakses oleh akun resmi terdaftar (Guru, Wali Santri, atau Siswa).\n\nSilakan login ke siMas untuk membuka akses penuh ke seluruh layanan akademik.`,
      [
        { text: "Nanti Saja", style: "cancel" },
        {
          text: "Login Sekarang",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  /* ─── 8 Menu Grid (Layout 4 Kolom x 2 Baris sama persis dengan role lain) ─── */
  const menuItems = [
    // Baris 1: 4 Menu Aktif
    {
      id: "quran",
      title: "Al-Qur'an",
      icon: <BookOpen size={24} color="#FFFFFF" />,
      bg: "#059669",
      badge: undefined,
      onPress: () => navigation.navigate("Quran"),
    },
    {
      id: "doa",
      title: "Doa & Dzikir",
      icon: <BookMarked size={24} color="#FFFFFF" />,
      bg: "#0284C7",
      badge: undefined,
      onPress: () => navigation.navigate("DoaDzikir"),
    },
    {
      id: "kiblat",
      title: "Arah Kiblat",
      icon: <Compass size={24} color="#FFFFFF" />,
      bg: "#0D9488",
      badge: undefined,
      onPress: () => navigation.navigate("ArahKiblat"),
    },
    {
      id: "berita",
      title: "Berita",
      icon: <Newspaper size={24} color="#FFFFFF" />,
      bg: "#F43F5E",
      badge: undefined,
      onPress: () => navigation.navigate("Berita"),
    },
    // Baris 2: 4 Menu Tambahan (Alarm, Kalender Islam, Faraidh, Tanya Ustadz)
    {
      id: "alarm",
      title: "Alarm",
      icon: <Bell size={24} color="#FFFFFF" />,
      bg: "#EA580C",
      badge: "SOON",
      onPress: () =>
        Alert.alert(
          "Fitur Segera Hadir",
          "Fitur Alarm Pengingat Sholat & Kegiatan sedang dalam tahap pengembangan dan akan segera tersedia."
        ),
    },
    {
      id: "kalender",
      title: "Kalender Islam",
      icon: <CalendarDays size={24} color="#FFFFFF" />,
      bg: "#4F46E5",
      badge: "SOON",
      onPress: () =>
        Alert.alert(
          "Fitur Segera Hadir",
          "Fitur Kalender Hijriah & Hari Besar Islam sedang dalam tahap pengembangan dan akan segera tersedia."
        ),
    },
    {
      id: "faraidh",
      title: "Faraidh",
      icon: <Scale size={24} color="#FFFFFF" />,
      bg: "#0891B2",
      badge: "SOON",
      onPress: () =>
        Alert.alert(
          "Fitur Segera Hadir",
          "Fitur Kalkulator Faraidh (Pembagian Waris Islam) sedang dalam tahap pengembangan dan akan segera tersedia."
        ),
    },
    {
      id: "tanya",
      title: "Tanya Ustadz",
      icon: <MessageCircleQuestion size={24} color="#FFFFFF" />,
      bg: "#8B5CF6",
      badge: "SOON",
      onPress: () =>
        Alert.alert(
          "Fitur Segera Hadir",
          "Fitur Konsultasi & Tanya Ustadz sedang dalam tahap pengembangan dan akan segera tersedia."
        ),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1C44" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0D1C44"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════════════════════════════════════════════
            1. TOP HEADER (Deep Navy dengan Mosque Backdrop)
        ════════════════════════════════════════════════════════ */}
        <View style={styles.headerBackground}>
          <Image
            source={require("../../../assets/pesantren-bg.webp")}
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
                    source={require("../../../assets/logo.webp")}
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
                {/* Notifikasi Bell */}
                <TouchableOpacity
                  style={styles.headerIconBtn}
                  onPress={() =>
                    showGuestAlert(
                      "Notifikasi",
                      "Layanan notifikasi pribadi hanya tersedia untuk pengguna yang telah login."
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Bell size={20} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Profile / Tombol Login */}
                <TouchableOpacity
                  style={styles.profileBtn}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.85}
                >
                  <View style={styles.avatarCircle}>
                    <LogIn size={14} color="#0D1C44" />
                  </View>
                  <Text style={styles.profileNameText}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Greeting Box */}
            <View style={styles.greetingBox}>
              <Text style={styles.greetingSub}>Assalamu'alaikum Warahmatullah,</Text>
              <Text style={styles.greetingName}>Mode Tamu</Text>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>Tamu (Akses Terbatas)</Text>
              </View>
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
                    style={styles.locRow}
                  >
                    <Text style={styles.sholatLocationText}>
                      📍 {selectedCity.name} {isGpsActive ? "(GPS)" : ""} ▾
                    </Text>
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
            3. QUICK ACTION GRID MENU (4 Kolom Sesuai Desain Asli)
        ════════════════════════════════════════════════════════ */}
        <View style={styles.menuGridContainer}>
          {Array.from({ length: Math.ceil(menuItems.length / 4) }).map((_, rowIdx) => (
            <View
              key={rowIdx}
              style={[styles.menuGridRow, rowIdx > 0 && { marginTop: 14 }]}
            >
              {menuItems.slice(rowIdx * 4, rowIdx * 4 + 4).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridCard}
                  onPress={item.onPress}
                  activeOpacity={0.8}
                >
                  <View style={[styles.gridIconCircle, { backgroundColor: item.bg }]}>
                    {item.icon}
                    {item.badge ? (
                      <View style={styles.soonBadge}>
                        <Text style={styles.soonBadgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.gridCardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* ═══════════════════════════════════════════════════════
            4. DUA KARTU FITUR UTAMA (DUAL MIDDLE CARDS)
            Tetap ada sama persis dengan role lain, diklik memunculkan notif mode tamu
        ════════════════════════════════════════════════════════ */}
        <View style={styles.dualCardContainer}>
          {/* Card Kiri: Lesson Plan */}
          <TouchableOpacity
            style={styles.dualCard}
            onPress={() =>
              showGuestAlert(
                "Lesson Plan",
                "Fitur Lesson Plan (RPP & Modul Pembelajaran) hanya dapat diakses oleh akun Guru terdaftar."
              )
            }
            activeOpacity={0.85}
          >
            <View style={styles.dualCardHeader}>
              <View style={styles.dualCardTitleRow}>
                <FileCheck2 size={16} color="#D97706" />
                <Text style={styles.dualCardTitle}>Lesson Plan</Text>
              </View>
              <ChevronRight size={14} color="#94A3B8" />
            </View>

            <View style={styles.lmsClassBox}>
              <View style={styles.lmsClassTop}>
                <View style={[styles.lmsIconBox, { backgroundColor: "#FFFBEB" }]}>
                  <FileCheck2 size={18} color="#D97706" />
                </View>
                <View style={[styles.lmsClassBadge, { backgroundColor: "#FFFBEB" }]}>
                  <Text style={[styles.lmsClassBadgeText, { color: "#D97706" }]}>RPP Aktif</Text>
                </View>
              </View>

              <Text style={styles.lmsClassName} numberOfLines={1}>
                Perangkat Ajar
              </Text>
              <Text style={styles.lmsTeacherName} numberOfLines={1}>
                RPP & Modul Pembelajaran
              </Text>

              <View style={[styles.progressBarBg, { marginTop: 8 }]}>
                <View style={[styles.progressBarFill, { width: "100%", backgroundColor: "#D97706" }]} />
              </View>
              <Text style={[styles.progressStatusText, { color: "#D97706" }]}>Buka Lesson Plan ›</Text>
            </View>
          </TouchableOpacity>

          {/* Card Kanan: Jadwal Guru */}
          <TouchableOpacity
            style={styles.dualCard}
            onPress={() =>
              showGuestAlert(
                "Jadwal Guru",
                "Fitur Jadwal Guru & Agenda KBM hanya dapat diakses oleh akun Guru terdaftar."
              )
            }
            activeOpacity={0.85}
          >
            <View style={styles.dualCardHeader}>
              <View style={styles.dualCardTitleRow}>
                <Calendar size={16} color="#15803d" />
                <Text style={styles.dualCardTitle}>Jadwal Guru</Text>
              </View>
              <ChevronRight size={14} color="#94A3B8" />
            </View>

            <View style={styles.lmsClassBox}>
              <View style={styles.lmsClassTop}>
                <View style={[styles.lmsIconBox, { backgroundColor: "#F0FDF4" }]}>
                  <BookOpen size={18} color="#15803d" />
                </View>
                <View style={[styles.lmsClassBadge, { backgroundColor: "#F0FDF4" }]}>
                  <Text style={[styles.lmsClassBadgeText, { color: "#15803d" }]}>Hari Ini</Text>
                </View>
              </View>

              <Text style={styles.lmsClassName} numberOfLines={1}>
                Agenda KBM & Kelas
              </Text>
              <Text style={styles.lmsTeacherName} numberOfLines={1}>
                Presensi & Jurnal Mengajar
              </Text>

              <View style={[styles.progressBarBg, { marginTop: 8 }]}>
                <View style={[styles.progressBarFill, { width: "100%", backgroundColor: "#15803d" }]} />
              </View>
              <Text style={styles.progressStatusText}>Buka Jadwal Guru ›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════
            5. BANNER & INFORMASI PENTING (Bottom Section)
        ════════════════════════════════════════════════════════ */}
        <View style={styles.bottomSectionContainer}>
          {/* Banner Dark Navy dengan Foto Backdrop Masjid */}
          <View style={styles.pesantrenBanner}>
            <Image
              source={require("../../../assets/pesantren-bg.webp")}
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
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Text style={styles.bannerActionText}>Login ke Akun Anda</Text>
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
              onPress={() =>
                showGuestAlert(
                  "Jadwal Ujian",
                  "Jadwal Ujian Tengah Semester hanya dapat diakses oleh akun santri & asatidz terdaftar."
                )
              }
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
              onPress={() =>
                showGuestAlert(
                  "Pengumuman Asrama",
                  "Pengumuman internal kepesantrenan hanya dapat diakses oleh akun santri & wali santri terdaftar."
                )
              }
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
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <View style={styles.infoItemIcon}>
                <Info size={15} color="#d97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoItemTitle}>Ingin Akses Penuh?</Text>
                <Text style={[styles.infoItemMeta, { color: "#2563eb", fontWeight: "700" }]}>
                  Login sekarang ›
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
                <View style={[styles.gridIconCircle, { width: 34, height: 34, backgroundColor: "#059669", marginBottom: 0 }]}>
                  <Sunrise size={18} color="#FFFFFF" />
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
                  { name: "Dzuhur", time: `${dynamicPrayer.times.dzuhur} WIB`, icon: <Sun size={16} color="#16a34a" /> },
                  { name: "Ashar", time: `${dynamicPrayer.times.ashar} WIB`, icon: <Sun size={16} color="#0d9488" /> },
                  { name: "Maghrib", time: `${dynamicPrayer.times.maghrib} WIB`, icon: <Sunset size={16} color="#ea580c" /> },
                  { name: "Isya", time: `${dynamicPrayer.times.isya} WIB`, icon: <Moon size={16} color="#3b82f6" /> },
                ].map((row, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.sholatTableRow,
                      dynamicPrayer.nextPrayer.name.toLowerCase() === row.name.toLowerCase() && styles.sholatTableRowActive,
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      {row.icon}
                      <Text
                        style={[
                          styles.sholatTableName,
                          dynamicPrayer.nextPrayer.name.toLowerCase() === row.name.toLowerCase() && { color: "#162E6E", fontWeight: "800" },
                        ]}
                      >
                        {row.name}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.sholatTableTime,
                        dynamicPrayer.nextPrayer.name.toLowerCase() === row.name.toLowerCase() && { color: "#162E6E", fontWeight: "800" },
                      ]}
                    >
                      {row.time}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL 2: PILIH KOTA / LOKASI SHOLAT
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
              <View>
                <Text style={styles.modalSheetTitle}>Pilih Kota / Lokasi</Text>
                <Text style={styles.modalSheetSub}>Penyesuaian waktu sholat & kiblat</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCityPickerModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* GPS Option */}
            <TouchableOpacity
              style={[styles.cityItem, isGpsActive && styles.cityItemActive]}
              onPress={async () => {
                await fetchCurrentLocation(true);
                setShowCityPickerModal(false);
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={[styles.cityDot, { backgroundColor: "#059669" }]} />
                <View>
                  <Text style={[styles.cityName, isGpsActive && { color: "#059669", fontWeight: "800" }]}>
                    📍 Gunakan Lokasi GPS Saya
                  </Text>
                  <Text style={styles.cityProvince}>Otomatis deteksi koordinat perangkat</Text>
                </View>
              </View>
              {isGpsActive && <Text style={{ color: "#059669", fontWeight: "800" }}>✓</Text>}
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {INDONESIAN_CITIES.map((city: CityLocation) => {
                const isSelected = !isGpsActive && selectedCity.id === city.id;
                return (
                  <TouchableOpacity
                    key={city.id}
                    style={[styles.cityItem, isSelected && styles.cityItemActive]}
                    onPress={() => {
                      setSelectedCity(city);
                      setShowCityPickerModal(false);
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={[styles.cityDot, isSelected && { backgroundColor: "#162E6E" }]} />
                      <View>
                        <Text style={[styles.cityName, isSelected && { color: "#162E6E", fontWeight: "800" }]}>
                          {city.name}
                        </Text>
                        <Text style={styles.cityProvince}>{city.province}</Text>
                      </View>
                    </View>
                    {isSelected && <Text style={{ color: "#162E6E", fontWeight: "800" }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* ═══════════════════════════════════════════════════════
   STYLES (IDENTIK 100% PERSIS DENGAN TeacherDashboardScreen)
════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // 1. Top Header
  headerBackground: {
    backgroundColor: "#0D1C44",
    position: "relative",
    paddingBottom: 48,
    overflow: "hidden",
  },
  headerBackdropImage: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
    opacity: 0.25,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(13, 28, 68, 0.72)",
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
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
  profileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 6,
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileNameText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    paddingRight: 2,
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
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
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
  soonBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#ef4444",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  soonBadgeText: {
    color: "#ffffff",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
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
    alignItems: "center",
    justifyContent: "center",
  },
  lmsClassBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lmsClassBadgeText: {
    fontSize: 8.5,
    fontWeight: "800",
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
  progressBarBg: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressStatusText: {
    fontSize: 8.5,
    color: "#64748B",
    marginTop: 3,
    fontWeight: "600",
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
  },
  modalSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSheetSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  sholatDetailHero: {
    backgroundColor: "#0D1C44",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  sholatHeroLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  sholatHeroPrayer: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
  },
  sholatHeroTime: {
    fontSize: 16,
    fontWeight: "700",
    color: "#86EFAC",
    marginTop: 2,
  },
  sholatHeroCountdown: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 6,
  },
  sholatTable: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sholatTableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sholatTableRowActive: {
    backgroundColor: "#EFF6FF",
  },
  sholatTableName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  sholatTableTime: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  /* City Picker */
  cityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: "#F8FAFC",
  },
  cityItemActive: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  cityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#94A3B8",
  },
  cityName: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  cityProvince: {
    fontSize: 10.5,
    color: "#64748B",
  },
});
