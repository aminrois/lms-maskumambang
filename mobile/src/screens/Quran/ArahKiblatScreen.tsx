// mobile/src/screens/Quran/ArahKiblatScreen.tsx
// Halaman Arah Kiblat — real-time compass dengan sensor Magnetometer

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  MapPin,
  Compass,
  Navigation,
  AlertCircle,
  Search,
  Check,
  RotateCw,
  Info,
} from "lucide-react-native";
import { Magnetometer } from "expo-sensors";
import {
  INDONESIAN_CITIES,
  CityLocation,
  calculatePrayerTimes,
} from "../../utils/prayerAndQibla";
import { useLocationStore } from "../../store/useLocationStore";

const CARDINALS = ["U", "TL", "T", "TG", "S", "BD", "B", "BL"];
const getCardinal = (deg: number): string => {
  const index = Math.round(((deg % 360) / 45)) % 8;
  return CARDINALS[index];
};

export const ArahKiblatScreen = () => {
  const navigation = useNavigation<any>();
  const {
    currentLocation: selectedCity,
    isGpsActive,
    isLoadingGps,
    gpsError,
    fetchCurrentLocation,
    setSelectedCity,
  } = useLocationStore();

  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasCompass, setHasCompass] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCityList, setShowCityList] = useState<boolean>(false);
  const [citySearch, setCitySearch] = useState<string>("");

  const dialAnim = useRef(new Animated.Value(0)).current;
  const currentDialAngleRef = useRef<number>(0);

  // Ambil lokasi GPS otomatis saat halaman dibuka
  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const dynamicPrayer = calculatePrayerTimes(selectedCity);
  const qiblaBearing = dynamicPrayer.qiblaBearing;

  // Sudut kiblat relatif terhadap arah hadap perangkat (0° = tepat menghadap kiblat)
  const relativeAngle = (qiblaBearing - deviceHeading + 360) % 360;
  const isAligned = hasCompass && (relativeAngle <= 4 || relativeAngle >= 356);

  // Instruksi putaran
  const diffDegrees = relativeAngle > 180 ? 360 - relativeAngle : relativeAngle;
  const turnDirection = relativeAngle > 180 ? "kiri" : "kanan";

  // Setup sensor Magnetometer
  useEffect(() => {
    let subscription: any = null;
    let isMounted = true;

    const initSensor = async () => {
      try {
        const available = await Magnetometer.isAvailableAsync();
        if (!isMounted) return;

        setHasCompass(available);
        setLoading(false);

        if (available) {
          Magnetometer.setUpdateInterval(100);
          subscription = Magnetometer.addListener((data) => {
            if (!isMounted) return;
            // Hitung derajat sudut dari komponen x & y
            let angle = Math.atan2(data.y, data.x) * (180 / Math.PI) - 90;
            if (angle < 0) {
              angle += 360;
            }
            setDeviceHeading(Math.round(angle));
          });
        }
      } catch (err) {
        console.warn("Gagal menginisialisasi sensor Magnetometer:", err);
        if (isMounted) {
          setHasCompass(false);
          setLoading(false);
        }
      }
    };

    initSensor();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Animasi rotasi piringan kompas secara halus tanpa spin terbalik (unwrapped angle)
  useEffect(() => {
    // Piringan kompas diputar berlawanan dengan arah hadap hp (-deviceHeading)
    // sehingga huruf 'U' (Utara) selalu menunjuk ke arah Utara fisik sebenarnya
    const targetDial = (-deviceHeading + 360) % 360;

    const current = currentDialAngleRef.current;
    const currentMod = ((current % 360) + 360) % 360;
    let diff = targetDial - currentMod;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    const nextAngle = current + diff;
    currentDialAngleRef.current = nextAngle;

    Animated.spring(dialAnim, {
      toValue: nextAngle,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, [deviceHeading]);

  const dialRotate = dialAnim.interpolate({
    inputRange: [-36000, 36000],
    outputRange: ["-36000deg", "36000deg"],
  });

  const filteredCities = INDONESIAN_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.province.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Arah Kiblat</Text>
          <Text style={styles.headerSub}>Kompas Penunjuk Ka'bah Makkah</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Lokasi */}
        <TouchableOpacity
          style={styles.locationCard}
          onPress={() => setShowCityList(!showCityList)}
          activeOpacity={0.8}
        >
          <View style={styles.locationIconWrap}>
            <MapPin size={20} color="#162E6E" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.locationLabel}>Lokasi Acuan</Text>
              {isGpsActive && (
                <View style={styles.gpsBadge}>
                  <View style={styles.gpsDot} />
                  <Text style={styles.gpsBadgeText}>GPS Terkini</Text>
                </View>
              )}
            </View>
            <Text style={styles.locationName}>
              {selectedCity.name}, <Text style={styles.provinceText}>{selectedCity.province}</Text>
            </Text>
          </View>
          <Text style={styles.changeText}>{showCityList ? "Tutup ▲" : "Ganti ▾"}</Text>
        </TouchableOpacity>

        {/* City List Dropdown with Search */}
        {showCityList && (
          <View style={styles.cityListContainer}>
            {/* Tombol Ambil GPS Saat Ini */}
            <TouchableOpacity
              style={styles.gpsRefreshBtn}
              onPress={async () => {
                await fetchCurrentLocation(true);
                setShowCityList(false);
              }}
              disabled={isLoadingGps}
            >
              {isLoadingGps ? (
                <ActivityIndicator size="small" color="#162E6E" />
              ) : (
                <Navigation size={16} color="#162E6E" />
              )}
              <Text style={styles.gpsRefreshBtnText}>
                {isLoadingGps ? "Mendeteksi Lokasi GPS..." : "Gunakan Lokasi GPS Terkini"}
              </Text>
            </TouchableOpacity>

            <View style={styles.searchBox}>
              <Search size={16} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Atau pilih manual dari daftar kota..."
                placeholderTextColor="#94A3B8"
                value={citySearch}
                onChangeText={setCitySearch}
              />
            </View>
            <ScrollView style={styles.cityScroll} nestedScrollEnabled={true}>
              {filteredCities.map((city) => {
                const isSelected = selectedCity.id === city.id;
                const cityQibla = calculatePrayerTimes(city).qiblaBearing;
                return (
                  <TouchableOpacity
                    key={city.id}
                    style={[styles.cityItem, isSelected && styles.cityItemActive]}
                    onPress={() => {
                      setSelectedCity(city);
                      setShowCityList(false);
                      setCitySearch("");
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cityItemName, isSelected && styles.cityItemNameActive]}>
                        {city.name}
                      </Text>
                      <Text style={styles.cityItemProvince}>{city.province}</Text>
                    </View>
                    <View style={styles.cityItemBearing}>
                      <Text style={styles.cityItemBearingText}>{cityQibla.toFixed(1)}°</Text>
                    </View>
                    {isSelected && <Check size={18} color="#162E6E" style={{ marginLeft: 8 }} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Info Kiblat & Sensor Status */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Sudut Kiblat</Text>
              <Text style={styles.infoValue}>{qiblaBearing.toFixed(1)}°</Text>
            </View>
            <View style={styles.infoSeparator} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Arah HP</Text>
              <Text style={styles.infoValue}>
                {hasCompass ? `${deviceHeading}° (${getCardinal(deviceHeading)})` : "—"}
              </Text>
            </View>
            <View style={styles.infoSeparator} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status Sensor</Text>
              <View style={styles.sensorStatusWrap}>
                <View
                  style={[
                    styles.sensorDot,
                    { backgroundColor: hasCompass ? "#16A34A" : "#F59E0B" },
                  ]}
                />
                <Text
                  style={[
                    styles.sensorStatusText,
                    { color: hasCompass ? "#16A34A" : "#D97706" },
                  ]}
                >
                  {hasCompass ? "Aktif" : "Tidak Ada"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Kompas Visual */}
        <View style={styles.compassContainer}>
          {/* Top Fixed Indicator (12 O'Clock Needle) */}
          <View style={styles.topMarker}>
            <View
              style={[
                styles.topTriangle,
                isAligned && { borderTopColor: "#16A34A" },
              ]}
            />
            <View
              style={[
                styles.topMarkerLine,
                isAligned && { backgroundColor: "#16A34A" },
              ]}
            />
          </View>

          {/* Bezel Kompas */}
          <View
            style={[
              styles.compassBezel,
              isAligned && styles.compassBezelAligned,
            ]}
          >
            {/* Piringan Kompas Berputar (Rotating Dial) */}
            <Animated.View
              style={[
                styles.compassDial,
                { transform: [{ rotate: dialRotate }] },
              ]}
            >
              {/* Garis-garis Derajat Kompas (Setiap 30 derajat) */}
              {[...Array(12)].map((_, i) => {
                const deg = i * 30;
                return (
                  <View
                    key={deg}
                    style={[
                      styles.tickWrapper,
                      { transform: [{ rotate: `${deg}deg` }] },
                    ]}
                  >
                    <View
                      style={[
                        styles.tick,
                        deg % 90 === 0 ? styles.tickMajor : styles.tickMinor,
                      ]}
                    />
                  </View>
                );
              })}

              {/* Titik Mata Angin Utama (U, T, S, B) */}
              {[
                { label: "U", deg: 0, color: "#EF4444" },
                { label: "T", deg: 90, color: "#162E6E" },
                { label: "S", deg: 180, color: "#64748B" },
                { label: "B", deg: 270, color: "#162E6E" },
              ].map((item) => {
                const rad = ((item.deg - 90) * Math.PI) / 180;
                const r = 90;
                const x = r * Math.cos(rad);
                const y = r * Math.sin(rad);
                return (
                  <View
                    key={item.label}
                    style={[
                      styles.cardinalPoint,
                      {
                        transform: [
                          { translateX: x },
                          { translateY: y },
                        ],
                      },
                    ]}
                  >
                    <Text style={[styles.cardinalText, { color: item.color }]}>
                      {item.label}
                    </Text>
                  </View>
                );
              })}

              {/* Jarum Penunjuk Kiblat (Menunjuk ke qiblaBearing pada piringan) */}
              <View
                style={[
                  styles.qiblaPointerWrap,
                  { transform: [{ rotate: `${qiblaBearing}deg` }] },
                ]}
              >
                {/* Ujung Panah Kiblat */}
                <View style={styles.qiblaArrowHead} />
                <View style={styles.qiblaArrowStem} />
                <View style={styles.qiblaKaabaIcon}>
                  <Text style={styles.qiblaKaabaText}>🕋</Text>
                </View>
              </View>

              {/* Pusat Kompas */}
              <View style={styles.compassCenterCircle}>
                <Compass size={18} color="#162E6E" />
              </View>
            </Animated.View>
          </View>

          {/* Badge Status Kelurusan Kiblat */}
          {hasCompass ? (
            isAligned ? (
              <View style={styles.alignedBadgeSuccess}>
                <Navigation size={18} color="#16A34A" />
                <Text style={styles.alignedTextSuccess}>
                  Menghadap Kiblat ✓ ({qiblaBearing.toFixed(1)}°)
                </Text>
              </View>
            ) : (
              <View style={styles.alignedBadgeGuide}>
                <RotateCw size={16} color="#D97706" />
                <Text style={styles.alignedTextGuide}>
                  Putar HP {Math.round(diffDegrees)}° ke {turnDirection}
                </Text>
              </View>
            )
          ) : (
            <View style={styles.alignedBadgeStatic}>
              <Info size={16} color="#475569" />
              <Text style={styles.alignedTextStatic}>
                Arah Ka'bah: {qiblaBearing.toFixed(1)}° dari Utara
              </Text>
            </View>
          )}
        </View>

        {/* Warning / Catatan Jika Sensor Tidak Ada */}
        {!hasCompass && (
          <View style={styles.noteCard}>
            <AlertCircle size={18} color="#D97706" style={{ marginTop: 2 }} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.noteTitle}>Sensor Kompas Tidak Tersedia</Text>
              <Text style={styles.noteText}>
                Perangkat ini tidak memiliki sensor magnetometer aktif. Gunakan referensi sudut statis{" "}
                <Text style={{ fontWeight: "700" }}>{qiblaBearing.toFixed(1)}°</Text> dari arah Utara kota{" "}
                {selectedCity.name}.
              </Text>
            </View>
          </View>
        )}

        {/* Petunjuk Penggunaan */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>💡 Petunjuk Penggunaan</Text>
          <Text style={styles.guideItem}>
            1. <Text style={styles.guideBold}>Posisikan HP mendatar (horizontal)</Text> sejajar dengan lantai/meja untuk akurasi terbaik.
          </Text>
          <Text style={styles.guideItem}>
            2. Putar badan atau arahkan HP perlahan hingga panah hijau{" "}
            <Text style={styles.guideBold}>🕋 lurus ke atas</Text> bertemu tanda penunjuk atas.
          </Text>
          <Text style={styles.guideItem}>
            3. Saat tanda berubah hijau{" "}
            <Text style={styles.guideBold}>"Menghadap Kiblat ✓"</Text>, Anda telah tepat menghadap Ka'bah.
          </Text>
          <Text style={styles.guideItem}>
            4. Jika kompas terasa tidak akurat, gerakkan HP membentuk angka <Text style={styles.guideBold}>8</Text> di udara untuk mengkalibrasi sensor.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#162E6E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, marginHorizontal: 12 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1 },
  scrollContent: { padding: 16, paddingBottom: 36 },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  locationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  locationLabel: { fontSize: 11, color: "#64748B", fontWeight: "600" },
  locationName: { fontSize: 15, fontWeight: "800", color: "#162E6E", marginTop: 2 },
  provinceText: { fontSize: 13, fontWeight: "500", color: "#64748B" },
  changeText: { fontSize: 12, color: "#162E6E", fontWeight: "700" },
  gpsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  gpsBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803D",
  },
  gpsRefreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
  },
  gpsRefreshBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#162E6E",
  },
  cityListContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: "#0F172A", padding: 0 },
  cityScroll: { maxHeight: 220 },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cityItemActive: { backgroundColor: "#EFF6FF" },
  cityItemName: { fontSize: 14, color: "#334155", fontWeight: "600" },
  cityItemNameActive: { color: "#162E6E", fontWeight: "800" },
  cityItemProvince: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  cityItemBearing: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cityItemBearingText: { fontSize: 11, fontWeight: "700", color: "#162E6E" },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoItem: { flex: 1, alignItems: "center" },
  infoLabel: { fontSize: 11, color: "#64748B", marginBottom: 4, fontWeight: "600" },
  infoValue: { fontSize: 14, fontWeight: "800", color: "#162E6E", textAlign: "center" },
  infoSeparator: { width: 1, height: 36, backgroundColor: "#E2E8F0" },
  sensorStatusWrap: { flexDirection: "row", alignItems: "center", gap: 5 },
  sensorDot: { width: 7, height: 7, borderRadius: 4 },
  sensorStatusText: { fontSize: 12, fontWeight: "700" },
  compassContainer: {
    alignItems: "center",
    marginBottom: 18,
    position: "relative",
  },
  topMarker: {
    alignItems: "center",
    marginBottom: 4,
    zIndex: 10,
  },
  topTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#EF4444",
  },
  topMarkerLine: {
    width: 2,
    height: 8,
    backgroundColor: "#EF4444",
  },
  compassBezel: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#FFFFFF",
    borderWidth: 4,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#162E6E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  compassBezelAligned: {
    borderColor: "#22C55E",
    shadowColor: "#16A34A",
    shadowOpacity: 0.35,
    shadowRadius: 22,
  },
  compassDial: {
    width: 236,
    height: 236,
    borderRadius: 118,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tickWrapper: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  tick: {
    backgroundColor: "#94A3B8",
    borderRadius: 1,
    marginTop: 6,
  },
  tickMajor: { width: 3, height: 12, backgroundColor: "#475569" },
  tickMinor: { width: 1.5, height: 6, backgroundColor: "#CBD5E1" },
  cardinalPoint: {
    position: "absolute",
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cardinalText: {
    fontSize: 15,
    fontWeight: "900",
  },
  qiblaPointerWrap: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  qiblaArrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#16A34A",
    marginTop: 18,
  },
  qiblaArrowStem: {
    width: 6,
    height: 70,
    backgroundColor: "#16A34A",
    borderRadius: 3,
  },
  qiblaKaabaIcon: {
    position: "absolute",
    top: 46,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#16A34A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  qiblaKaabaText: { fontSize: 13 },
  compassCenterCircle: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#162E6E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  alignedBadgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: "#86EFAC",
  },
  alignedTextSuccess: { fontSize: 14, fontWeight: "800", color: "#15803D" },
  alignedBadgeGuide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  alignedTextGuide: { fontSize: 14, fontWeight: "700", color: "#B45309" },
  alignedBadgeStatic: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  alignedTextStatic: { fontSize: 13, fontWeight: "700", color: "#334155" },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 14,
  },
  noteTitle: { fontSize: 13, fontWeight: "800", color: "#B45309", marginBottom: 3 },
  noteText: { fontSize: 12, color: "#92400E", lineHeight: 18 },
  guideCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  guideTitle: { fontSize: 13, fontWeight: "800", color: "#162E6E", marginBottom: 8 },
  guideItem: { fontSize: 12, color: "#334155", lineHeight: 20, marginBottom: 4 },
  guideBold: { fontWeight: "700", color: "#162E6E" },
});

