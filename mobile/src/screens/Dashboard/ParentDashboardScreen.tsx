// mobile/src/screens/Dashboard/ParentDashboardScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  GraduationCap,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  MapPin,
  X,
  PhoneCall,
  Bell,
  Award
} from "lucide-react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { waliService, AnakItem } from "../../api/waliService";
import { Colors } from "../../constants/colors";
import {
  INDONESIAN_CITIES,
  CityLocation,
  calculatePrayerTimes,
} from "../../utils/prayerAndQibla";

export const ParentDashboardScreen = () => {
  const { user, logout } = useAuthStore();
  const [selectedCity, setSelectedCity] = useState<CityLocation>(INDONESIAN_CITIES[0]);
  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(null);

  // Modals
  const [showSholatModal, setShowSholatModal] = useState(false);
  const [showKiblatModal, setShowKiblatModal] = useState(false);
  const [showCityPickerModal, setShowCityPickerModal] = useState(false);

  // Kiblat simulation heading
  const [deviceHeading, setDeviceHeading] = useState(0);

  // 1. Fetch Daftar Anak
  const {
    data: daftarAnak = [],
    isLoading: isLoadingAnak,
    refetch: refetchAnak,
    isRefetching,
  } = useQuery({
    queryKey: ["wali-daftar-anak"],
    queryFn: () => waliService.getDaftarAnak(),
    staleTime: 5 * 60 * 1000,
  });

  // Set default anak pertama
  useEffect(() => {
    if (daftarAnak.length > 0 && selectedSiswaId === null) {
      setSelectedSiswaId(daftarAnak[0].siswa_id);
    }
  }, [daftarAnak, selectedSiswaId]);

  // 2. Fetch Detail Perkembangan Anak Terpilih
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

  const onRefresh = async () => {
    await Promise.all([refetchAnak(), refetchPerkembangan()]);
  };

  // Data sholat & kiblat dinamis
  const prayerData = useMemo(() => calculatePrayerTimes(selectedCity), [selectedCity]);
  const qiblaAngle = (prayerData.qiblaBearing - deviceHeading + 360) % 360;
  const isQiblaAligned = Math.abs(qiblaAngle) < 4 || Math.abs(qiblaAngle - 360) < 4;

  const activeAnak = useMemo(() => {
    return daftarAnak.find((a) => a.siswa_id === selectedSiswaId) || daftarAnak[0];
  }, [daftarAnak, selectedSiswaId]);

  return (
    <View style={styles.container}>
      {/* ─── Top Green Header ─── */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderContent}>
          <View>
            <Text style={styles.headerGreeting}>Assalamu'alaikum,</Text>
            <Text style={styles.headerParentName}>{user?.username || "Wali Murid"}</Text>
            <Text style={styles.headerSub}>Portal Pemantauan Santri Maskumambang</Text>
          </View>
          <View style={styles.headerBadgeContainer}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Wali Murid</Text>
            </View>
          </View>
        </View>

        {/* Quick Prayer Strip */}
        <TouchableOpacity
          style={styles.prayerStrip}
          onPress={() => setShowSholatModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.prayerStripLeft}>
            <Clock size={15} color="#10B981" />
            <Text style={styles.prayerStripText}>
              {prayerData.nextPrayer.name} • {prayerData.nextPrayer.time} WIB ({selectedCity.name})
            </Text>
          </View>
          <Text style={styles.prayerStripRight}>Detail ›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={["#10B981"]} />
        }
      >
        {/* ─── 1. Pilihan Santri (Jika > 1 Anak) ─── */}
        {daftarAnak.length > 1 && (
          <View style={styles.anakSelectorContainer}>
            <Text style={styles.sectionTitle}>Pilih Ananda:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.anakPillsScroll}>
              {daftarAnak.map((anak) => {
                const isSelected = anak.siswa_id === selectedSiswaId;
                return (
                  <TouchableOpacity
                    key={anak.siswa_id}
                    style={[styles.anakPill, isSelected && styles.anakPillActive]}
                    onPress={() => setSelectedSiswaId(anak.siswa_id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.anakPillAvatar, isSelected && styles.anakPillAvatarActive]}>
                      <Text style={[styles.anakPillAvatarText, isSelected && styles.anakPillAvatarTextActive]}>
                        {anak.nama.charAt(0)}
                      </Text>
                    </View>
                    <Text style={[styles.anakPillText, isSelected && styles.anakPillTextActive]}>
                      {anak.panggilan || anak.nama.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ─── 2. Kartu Profil Santri ─── */}
        {isLoadingAnak ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.loadingText}>Memuat data ananda...</Text>
          </View>
        ) : activeAnak ? (
          <View style={styles.santriCard}>
            <View style={styles.santriCardHeader}>
              <View style={styles.santriAvatarBox}>
                <Text style={styles.santriAvatarLetter}>{activeAnak.nama.charAt(0)}</Text>
              </View>
              <View style={styles.santriInfo}>
                <Text style={styles.santriName}>{activeAnak.nama}</Text>
                <Text style={styles.santriMeta}>
                  NISN: {activeAnak.nisn || "-"} • Kelas: {activeAnak.kelas?.nama_kelas || "-"}
                </Text>
                <View style={styles.lembagaBadge}>
                  <Text style={styles.lembagaBadgeText}>
                    {activeAnak.kelas?.lembaga?.nama_lembaga || "Pesantren Maskumambang"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* ─── 3. Menu Pintas Islami (Sholat, Kiblat, Berita) ─── */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => setShowSholatModal(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: "#059669" }]}>
              <Clock size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.quickCardTitle}>Jadwal Sholat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => setShowKiblatModal(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: "#EA580C" }]}>
              <Compass size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.quickCardTitle}>Arah Kiblat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => setShowCityPickerModal(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: "#2563EB" }]}>
              <MapPin size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.quickCardTitle}>Ubah Lokasi</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 4. Card Progres Tahfidz & Hafalan ─── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: "#DCFCE7" }]}>
              <Sparkles size={16} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>Perkembangan Tahfidz</Text>
              <Text style={styles.sectionSub}>Capaian hafalan Al-Qur'an ananda</Text>
            </View>
          </View>

          {isLoadingPerkembangan ? (
            <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 20 }} />
          ) : (
            <>
              {/* Stat Highlight Box */}
              <View style={styles.tahfidzStatGrid}>
                <View style={styles.tahfidzStatItem}>
                  <Text style={styles.tahfidzStatLabel}>Total Setoran</Text>
                  <Text style={styles.tahfidzStatValue}>
                    {perkembangan?.tahfidz?.summary?.totalSetoran || 0} Kali
                  </Text>
                </View>
                <View style={[styles.tahfidzStatItem, { borderLeftWidth: 1, borderColor: "#E2E8F0" }]}>
                  <Text style={styles.tahfidzStatLabel}>Total Ziyadah</Text>
                  <Text style={[styles.tahfidzStatValue, { color: "#16A34A" }]}>
                    {perkembangan?.tahfidz?.summary?.totalJuzZiyadah || 0} Juz
                  </Text>
                  <Text style={styles.tahfidzStatUnit}>
                    ({perkembangan?.tahfidz?.summary?.totalAyatZiyadah || 0} Ayat)
                  </Text>
                </View>
              </View>

              {/* Setoran Terakhir */}
              {perkembangan?.tahfidz?.recentSetoran && perkembangan.tahfidz.recentSetoran.length > 0 ? (
                <View style={styles.lastSetoranBox}>
                  <View style={styles.lastSetoranHeader}>
                    <Text style={styles.lastSetoranTitle}>Setoran Terakhir Disimak</Text>
                    <Text style={styles.lastSetoranDate}>
                      {perkembangan.tahfidz.recentSetoran[0].tanggal}
                    </Text>
                  </View>
                  <Text style={styles.lastSetoranSurat}>
                    📖 {perkembangan.tahfidz.recentSetoran[0].surat_mulai_nama || "Al-Qur'an"} : Ayat{" "}
                    {perkembangan.tahfidz.recentSetoran[0].ayat_mulai || 1} -{" "}
                    {perkembangan.tahfidz.recentSetoran[0].ayat_selesai || 7}
                  </Text>
                  <View style={styles.lastSetoranMetaRow}>
                    <View style={styles.kelancaranBadge}>
                      <Text style={styles.kelancaranBadgeText}>
                        {perkembangan.tahfidz.recentSetoran[0].kelancaran || "Lancar"}
                      </Text>
                    </View>
                    <Text style={styles.guruPenyimakText}>
                      Ustadz: {perkembangan.tahfidz.recentSetoran[0].pegawai?.nama || "-"}
                    </Text>
                  </View>
                  {perkembangan.tahfidz.recentSetoran[0].catatan_guru ? (
                    <Text style={styles.catatanGuruText}>
                      💬 "{perkembangan.tahfidz.recentSetoran[0].catatan_guru}"
                    </Text>
                  ) : null}
                </View>
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Belum ada catatan setoran baru untuk ananda.</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* ─── 5. Card Presensi & Kehadiran ─── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: "#DBEAFE" }]}>
              <Calendar size={16} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>Kehadiran & Presensi</Text>
              <Text style={styles.sectionSub}>Rekapitulasi kehadiran di kelas</Text>
            </View>
          </View>

          {isLoadingPerkembangan ? (
            <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 20 }} />
          ) : (
            <>
              {/* 4-Box Rekap Presensi */}
              <View style={styles.presensiGrid}>
                <View style={[styles.presensiBox, { backgroundColor: "#F0FDF4" }]}>
                  <Text style={[styles.presensiNumber, { color: "#16A34A" }]}>
                    {perkembangan?.presensi?.rekap30Hari?.hadir || 0}
                  </Text>
                  <Text style={styles.presensiLabel}>Hadir</Text>
                </View>
                <View style={[styles.presensiBox, { backgroundColor: "#FEF9C3" }]}>
                  <Text style={[styles.presensiNumber, { color: "#CA8A04" }]}>
                    {perkembangan?.presensi?.rekap30Hari?.izin || 0}
                  </Text>
                  <Text style={styles.presensiLabel}>Izin</Text>
                </View>
                <View style={[styles.presensiBox, { backgroundColor: "#EFF6FF" }]}>
                  <Text style={[styles.presensiNumber, { color: "#2563EB" }]}>
                    {perkembangan?.presensi?.rekap30Hari?.sakit || 0}
                  </Text>
                  <Text style={styles.presensiLabel}>Sakit</Text>
                </View>
                <View style={[styles.presensiBox, { backgroundColor: "#FEF2F2" }]}>
                  <Text style={[styles.presensiNumber, { color: "#DC2626" }]}>
                    {perkembangan?.presensi?.rekap30Hari?.alpa || 0}
                  </Text>
                  <Text style={styles.presensiLabel}>Alpa</Text>
                </View>
              </View>

              {/* Status Hari Ini */}
              <View style={styles.todayPresensiStatus}>
                <Text style={styles.todayPresensiLabel}>Status Hari Ini:</Text>
                <View style={styles.todayPresensiBadge}>
                  <CheckCircle2 size={13} color="#16A34A" style={{ marginRight: 4 }} />
                  <Text style={styles.todayPresensiText}>
                    {perkembangan?.presensi?.hariIni?.status || "Hadir (Tercatat)"}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ─── 6. Jadwal Pelajaran ─── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: "#EDE9FE" }]}>
              <BookOpen size={16} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>Jadwal Pelajaran Kelas</Text>
              <Text style={styles.sectionSub}>Mata pelajaran santri</Text>
            </View>
          </View>

          {perkembangan?.jadwalPelajaran && perkembangan.jadwalPelajaran.length > 0 ? (
            <View style={styles.jadwalList}>
              {perkembangan.jadwalPelajaran.slice(0, 5).map((j) => (
                <View key={j.jadwal_id} style={styles.jadwalItem}>
                  <View style={styles.jadwalItemLeft}>
                    <Text style={styles.jadwalMapel}>{j.mata_pelajaran?.nama_mapel || "Pelajaran"}</Text>
                    <Text style={styles.jadwalGuru}>Ustadz: {j.pegawai?.nama || "-"}</Text>
                  </View>
                  <View style={styles.jadwalTimeBadge}>
                    <Text style={styles.jadwalTimeText}>
                      {j.jam_akademik ? `${j.jam_akademik.jam_mulai} - ${j.jam_akademik.jam_selesai}` : `Jam ke-${j.jam_ke}`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Jadwal pelajaran belum tersedia.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ─── MODAL JADWAL SHOLAT ─── */}
      <Modal visible={showSholatModal} animationType="slide" transparent={true} onRequestClose={() => setShowSholatModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={[styles.quickIconCircle, { width: 34, height: 34, backgroundColor: "#059669" }]}>
                  <Clock size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.modalSheetTitle}>Jadwal Sholat & Imsakiyah</Text>
                  <Text style={styles.modalSheetSub}>{selectedCity.name}, {selectedCity.province}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowSholatModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.sholatDetailHero}>
                <Text style={styles.sholatHeroLabel}>Sholat Selanjutnya</Text>
                <Text style={styles.sholatHeroPrayer}>{prayerData.nextPrayer.name}</Text>
                <Text style={styles.sholatHeroTime}>{prayerData.nextPrayer.time} WIB</Text>
                <Text style={styles.sholatHeroCountdown}>⏳ Hitung Mundur: {prayerData.nextPrayer.countdown}</Text>
              </View>

              <View style={styles.sholatTable}>
                {Object.entries(prayerData.times).map(([key, val]) => (
                  <View key={key} style={styles.sholatTableRow}>
                    <Text style={[styles.sholatTableName, { textTransform: "capitalize" }]}>{key}</Text>
                    <Text style={styles.sholatTableTime}>{val} WIB</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL ARAH KIBLAT (KOMPAS DINAMIS) ─── */}
      <Modal visible={showKiblatModal} animationType="slide" transparent={true} onRequestClose={() => setShowKiblatModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={[styles.quickIconCircle, { width: 34, height: 34, backgroundColor: "#f97316" }]}>
                  <Compass size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.modalSheetTitle}>Kompas Arah Kiblat</Text>
                  <Text style={styles.modalSheetSub}>Dari lokasi: {selectedCity.name}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowKiblatModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", paddingVertical: 14 }}>
              <View style={[styles.qiblaDegreeBadge, isQiblaAligned && styles.qiblaDegreeBadgeAligned]}>
                <Text style={[styles.qiblaDegreeNumber, isQiblaAligned && { color: "#FFFFFF" }]}>
                  {prayerData.qiblaBearing}°
                </Text>
                <Text style={[styles.qiblaDegreeLabel, isQiblaAligned && { color: "#FFFFFF" }]}>
                  {isQiblaAligned ? "✅ Arah Kiblat Tepat!" : "Arahkan jarum ke Ka'bah"}
                </Text>
              </View>

              {/* Kompas Interaktif Dial */}
              <View style={styles.compassContainer}>
                <View style={styles.compassDial}>
                  <Text style={[styles.cardinalPoint, { top: 10, fontWeight: "900", color: "#dc2626" }]}>U (0°)</Text>
                  <Text style={[styles.cardinalPoint, { right: 12 }]}>T (90°)</Text>
                  <Text style={[styles.cardinalPoint, { bottom: 10 }]}>S (180°)</Text>
                  <Text style={[styles.cardinalPoint, { left: 12 }]}>B (270°)</Text>

                  {/* Jarum Kiblat Dinamis */}
                  <View style={[styles.compassNeedle, { transform: [{ rotate: `${qiblaAngle}deg` }] }]}>
                    <View style={[styles.needlePointer, isQiblaAligned && { backgroundColor: "#16A34A" }]} />
                    <View style={styles.kaabaIconBox}>
                      <Text style={{ fontSize: 22 }}>🕋</Text>
                    </View>
                  </View>

                  <View style={styles.compassCenterDot} />
                </View>
              </View>

              {/* Slider / Tombol Putar Simulasi Kompas */}
              <View style={styles.compassHeadingControl}>
                <Text style={styles.compassHeadingText}>Putar HP atau simulasi arah ({deviceHeading}°):</Text>
                <View style={styles.headingBtnRow}>
                  <TouchableOpacity
                    style={styles.headingBtn}
                    onPress={() => setDeviceHeading((prev) => (prev - 15 + 360) % 360)}
                  >
                    <Text style={styles.headingBtnText}>◀ Putar Kiri 15°</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.headingBtn, { backgroundColor: "#059669" }]}
                    onPress={() => setDeviceHeading(Math.round(prayerData.qiblaBearing))}
                  >
                    <Text style={[styles.headingBtnText, { color: "#FFFFFF" }]}>🎯 Pas ke Ka'bah</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headingBtn}
                    onPress={() => setDeviceHeading((prev) => (prev + 15) % 360)}
                  >
                    <Text style={styles.headingBtnText}>Putar Kanan 15° ▶</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.qiblaInfoGrid}>
                <View style={styles.qiblaInfoItem}>
                  <Text style={styles.qiblaInfoLabel}>Jarak ke Ka'bah</Text>
                  <Text style={styles.qiblaInfoValue}>± {prayerData.distanceKaaba.toLocaleString("id-ID")} KM</Text>
                </View>
                <View style={styles.qiblaInfoItem}>
                  <Text style={styles.qiblaInfoLabel}>Titik Koordinat</Text>
                  <Text style={styles.qiblaInfoValue}>
                    {selectedCity.latitude.toFixed(2)}°, {selectedCity.longitude.toFixed(2)}°
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL PILIH KOTA / LOKASI GPS ─── */}
      <Modal visible={showCityPickerModal} animationType="slide" transparent={true} onRequestClose={() => setShowCityPickerModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: "75%" }]}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MapPin size={20} color="#2563EB" />
                <View>
                  <Text style={styles.modalSheetTitle}>Pilih Lokasi Terkini</Text>
                  <Text style={styles.modalSheetSub}>Sesuaikan jadwal sholat & arah kiblat</Text>
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
                    style={[styles.cityPickerItem, isSelected && styles.cityPickerItemActive]}
                    onPress={() => {
                      setSelectedCity(city);
                      setShowCityPickerModal(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.cityNameText, isSelected && styles.cityNameTextActive]}>
                        {city.name}
                      </Text>
                      <Text style={styles.cityProvinceText}>{city.province}</Text>
                    </View>
                    {isSelected && <CheckCircle2 size={18} color="#2563EB" />}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topHeader: {
    backgroundColor: "#0F382A",
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerGreeting: {
    fontSize: 12,
    color: "#6EE7B7",
    fontWeight: "600",
  },
  headerParentName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 10.5,
    color: "#A7F3D0",
    marginTop: 2,
  },
  headerBadgeContainer: {
    alignItems: "flex-end",
  },
  roleBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  prayerStrip: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prayerStripLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  prayerStripText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "500",
  },
  prayerStripRight: {
    color: "#6EE7B7",
    fontSize: 11.5,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  anakSelectorContainer: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  anakPillsScroll: {
    flexDirection: "row",
  },
  anakPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  anakPillActive: {
    backgroundColor: "#0F382A",
    borderColor: "#0F382A",
  },
  anakPillAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  anakPillAvatarActive: {
    backgroundColor: "#10B981",
  },
  anakPillAvatarText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  anakPillAvatarTextActive: {
    color: "#FFFFFF",
  },
  anakPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  anakPillTextActive: {
    color: "#FFFFFF",
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  loadingText: {
    fontSize: 12,
    color: "#64748B",
  },
  santriCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  santriCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  santriAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  santriAvatarLetter: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  santriInfo: {
    flex: 1,
  },
  santriName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  santriMeta: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
  },
  lembagaBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F0FDF4",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  lembagaBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#16A34A",
  },
  quickGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickCardTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E293B",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionSub: {
    fontSize: 10.5,
    color: "#64748B",
  },
  tahfidzStatGrid: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  tahfidzStatItem: {
    flex: 1,
    alignItems: "center",
  },
  tahfidzStatLabel: {
    fontSize: 10.5,
    color: "#64748B",
    fontWeight: "500",
  },
  tahfidzStatValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  tahfidzStatUnit: {
    fontSize: 9.5,
    color: "#94A3B8",
  },
  lastSetoranBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  lastSetoranHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  lastSetoranTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#16A34A",
    textTransform: "uppercase",
  },
  lastSetoranDate: {
    fontSize: 10,
    color: "#64748B",
  },
  lastSetoranSurat: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  lastSetoranMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  kelancaranBadge: {
    backgroundColor: "#16A34A",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  kelancaranBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  guruPenyimakText: {
    fontSize: 10.5,
    color: "#475569",
  },
  catatanGuruText: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#334155",
    marginTop: 6,
    lineHeight: 15,
  },
  presensiGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  presensiBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  presensiNumber: {
    fontSize: 16,
    fontWeight: "800",
  },
  presensiLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "600",
  },
  todayPresensiStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
  },
  todayPresensiLabel: {
    fontSize: 11.5,
    color: "#475569",
    fontWeight: "500",
  },
  todayPresensiBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  todayPresensiText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#16A34A",
  },
  jadwalList: {
    gap: 8,
  },
  jadwalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
  },
  jadwalItemLeft: {
    flex: 1,
  },
  jadwalMapel: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#0F172A",
  },
  jadwalGuru: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 2,
  },
  jadwalTimeBadge: {
    backgroundColor: "#EDE9FE",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  jadwalTimeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7C3AED",
  },
  emptyBox: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 11.5,
    color: "#94A3B8",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "85%",
  },
  modalSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalSheetSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  sholatDetailHero: {
    backgroundColor: "#065F46",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  sholatHeroLabel: {
    fontSize: 11,
    color: "#A7F3D0",
    fontWeight: "600",
  },
  sholatHeroPrayer: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
  },
  sholatHeroTime: {
    fontSize: 14,
    color: "#D1FAE5",
    fontWeight: "600",
  },
  sholatHeroCountdown: {
    fontSize: 11.5,
    color: "#FDE047",
    fontWeight: "700",
    marginTop: 6,
  },
  sholatTable: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  sholatTableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#EEF2F6",
  },
  sholatTableName: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#334155",
  },
  sholatTableTime: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  qiblaDegreeBadge: {
    backgroundColor: "#FFF7ED",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  qiblaDegreeBadgeAligned: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  qiblaDegreeNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#EA580C",
  },
  qiblaDegreeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#C2410C",
  },
  compassContainer: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  compassDial: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#334155",
  },
  cardinalPoint: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
  },
  compassNeedle: {
    width: 170,
    height: 170,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  needlePointer: {
    width: 4,
    height: 60,
    backgroundColor: "#EA580C",
    borderRadius: 2,
  },
  kaabaIconBox: {
    marginTop: -16,
  },
  compassCenterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
    position: "absolute",
  },
  compassHeadingControl: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    alignItems: "center",
  },
  compassHeadingText: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 8,
  },
  headingBtnRow: {
    flexDirection: "row",
    gap: 8,
  },
  headingBtn: {
    backgroundColor: "#E2E8F0",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  headingBtnText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#334155",
  },
  qiblaInfoGrid: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },
  qiblaInfoItem: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  qiblaInfoLabel: {
    fontSize: 10,
    color: "#64748B",
  },
  qiblaInfoValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  cityPickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  cityPickerItemActive: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
  },
  cityNameText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  cityNameTextActive: {
    color: "#2563EB",
    fontWeight: "700",
  },
  cityProvinceText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
});
