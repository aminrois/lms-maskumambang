// mobile/src/screens/Auth/LoginScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StatusBar,
  Image,
  TextInput,
  Dimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import {
  Lock,
  User,
  Check,
  FingerprintPattern,
  ScanFace,
  Eye,
  EyeOff,
  ArrowRight,
  UserCircle,
  ChevronRight,
  Server,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { APP_CONFIG, PROD_API_BASE_URL, LOCAL_API_BASE_URL } from "../../constants/config";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const HEADER_H = SCREEN_H * 0.44;

/* ─── Wave SVG divider ─── */
const WaveDivider = () => (
  <Svg
    width={SCREEN_W}
    height={54}
    viewBox={`0 0 ${SCREEN_W} 54`}
    style={{ marginTop: -1 }}
  >
    <Path
      d={`M0,0 C${SCREEN_W * 0.25},54 ${SCREEN_W * 0.75},0 ${SCREEN_W},54 L${SCREEN_W},54 L0,54 Z`}
      fill="#FFFFFF"
    />
  </Svg>
);

/* ─── Sparkle decoration (SVG) ─── */
const Sparkle = ({ x, y, size = 14 }: { x: number; y: number; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", left: x, top: y }}>
    <Path
      d="M12 2 L13.5 9 L20 10.5 L13.5 12 L12 19 L10.5 12 L4 10.5 L10.5 9 Z"
      fill="#7EAEFF"
      opacity={0.9}
    />
  </Svg>
);

export const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [showServerModal, setShowServerModal] = useState(false);
  const [isBioAuthenticating, setIsBioAuthenticating] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [customUrlInput, setCustomUrlInput] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const {
    login,
    isLoading,
    apiBaseUrl,
    setApiBaseUrl,
    biometricStatus,
    checkBiometricStatus,
    loginWithBiometrics,
    enableBiometric,
  } = useAuthStore();

  useEffect(() => {
    setCustomUrlInput(apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    const initBiometrics = async () => {
      const status = await checkBiometricStatus();
      if (status.isEnabled && status.savedUsername) {
        setIdentifier(status.savedUsername);
      }
    };
    initBiometrics();

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!identifier.trim() || !kataSandi.trim()) {
      setError("Harap isi username dan kata sandi.");
      return;
    }
    try {
      setError("");
      await login(identifier.trim(), kataSandi);
      if (
        biometricStatus?.isSupported &&
        biometricStatus?.isEnrolled &&
        !biometricStatus?.isEnabled
      ) {
        Alert.alert(
          `Aktifkan ${biometricStatus.biometricName}?`,
          `Apakah Anda ingin menggunakan ${biometricStatus.biometricName} untuk masuk lebih cepat?`,
          [
            { text: "Nanti Saja", style: "cancel" },
            {
              text: "Aktifkan",
              onPress: async () => {
                await enableBiometric(identifier.trim(), kataSandi);
              },
            },
          ]
        );
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Gagal masuk. Periksa kredensial atau koneksi server.";
      setError(msg);
      Alert.alert("Gagal Masuk", msg);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setIsBioAuthenticating(true);
      setError("");
      await loginWithBiometrics();
    } catch (err: any) {
      const msg = err.message || "Autentikasi biometrik gagal.";
      if (!msg.toLowerCase().includes("batal") && !msg.toLowerCase().includes("cancel")) {
        setError(msg);
        Alert.alert("Biometrik Gagal", msg);
      }
    } finally {
      setIsBioAuthenticating(false);
    }
  };

  const handleLogoTap = () => {
    const count = logoTapCount + 1;
    setLogoTapCount(count);
    if (count >= 7) {
      setLogoTapCount(0);
      setShowServerModal(true);
    }
  };

  const handleSaveServerUrl = async () => {
    if (!customUrlInput.trim()) return;
    await setApiBaseUrl(customUrlInput.trim());
    setShowServerModal(false);
    Alert.alert("Sukses", "Alamat server berhasil diperbarui.");
  };

  const isFaceId = biometricStatus?.biometricType === "faceid";
  const bioName = biometricStatus?.biometricName || "Sidik Jari / Face ID";
  const showBiometric = biometricStatus?.isEnabled;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#162E6E" />

      {/* ═══ HEADER: Navy Blue + Islamic Pattern + Masjid ═══ */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {/* Pattern background */}
        <Image
          source={require("../../../assets/islamic_pattern.jpg")}
          style={styles.patternBg}
          resizeMode="cover"
        />
        {/* Dark overlay agar pattern tidak terlalu dominan */}
        <View style={styles.patternOverlay} />

        {/* Mosque silhouette – right side */}
        <Image
          source={require("../../../assets/mosque_silhouette.jpg")}
          style={styles.mosqueBg}
          resizeMode="cover"
        />
        <View style={styles.mosqueOverlay} />

        {/* Sparkle decorations */}
        <Sparkle x={SCREEN_W * 0.72} y={HEADER_H * 0.12} size={12} />
        <Sparkle x={SCREEN_W * 0.78} y={HEADER_H * 0.22} size={8} />
        <Sparkle x={SCREEN_W * 0.08} y={HEADER_H * 0.55} size={10} />

        {/* Content */}
        <View style={styles.headerContent}>
          {/* Logo */}
          <TouchableOpacity onPress={handleLogoTap} activeOpacity={0.9}>
            <View style={styles.logoWrapper}>
              <Image
                source={require("../../../assets/logo.webp")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          <Text style={styles.appName}>siMas</Text>
          <Text style={styles.appSubtitle}>Sistem Informasi</Text>
          <Text style={styles.appSubtitle}>Pondok Pesantren Maskumambang</Text>
        </View>
      </View>

      {/* ═══ WAVE DIVIDER ═══ */}
      <View style={styles.waveContainer}>
        <WaveDivider />
      </View>

      {/* ═══ WHITE CARD: Form ═══ */}
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.cardContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.welcomeTitle}>Selamat Datang</Text>
            <Text style={styles.welcomeSub}>Masuk untuk mengakses layanan siMas.</Text>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            {/* Username Field */}
            <View style={styles.inputPill}>
              <User size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.inputText}
                placeholder="Masukkan username"
                placeholderTextColor="#94A3B8"
                value={identifier}
                onChangeText={(t) => { setIdentifier(t); setError(""); }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputPill}>
              <Lock size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.inputText}
                placeholder="Masukkan kata sandi"
                placeholderTextColor="#94A3B8"
                value={kataSandi}
                onChangeText={(t) => { setKataSandi(t); setError(""); }}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                {showPass
                  ? <Eye size={20} color="#94A3B8" />
                  : <EyeOff size={20} color="#94A3B8" />}
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={isLoading && !isBioAuthenticating}
            >
              {isLoading && !isBioAuthenticating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Login</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Divider ATAU */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ATAU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Passkey / Biometric Button */}
            {showBiometric ? (
              <TouchableOpacity
                style={styles.passkeyBtn}
                onPress={handleBiometricLogin}
                disabled={isBioAuthenticating || isLoading}
                activeOpacity={0.85}
              >
                {isBioAuthenticating ? (
                  <ActivityIndicator size="small" color="#162E6E" />
                ) : (
                  <>
                    {isFaceId
                      ? <ScanFace size={22} color="#162E6E" />
                      : <FingerprintPattern size={22} color="#162E6E" />}
                    <Text style={styles.passkeyBtnText}>Login dengan {bioName}</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.passkeyBtn}
                onPress={handleBiometricLogin}
                activeOpacity={0.85}
              >
                <FingerprintPattern size={22} color="#162E6E" />
                <Text style={styles.passkeyBtnText}>Login dengan Passkey</Text>
              </TouchableOpacity>
            )}

            {/* Mode Tamu */}
            <TouchableOpacity style={styles.tamuBtn} activeOpacity={0.8}>
              <UserCircle size={22} color="#162E6E" />
              <Text style={styles.tamuBtnText}>Mode Tamu</Text>
              <ChevronRight size={20} color="#162E6E" style={{ marginLeft: "auto" }} />
            </TouchableOpacity>

            {/* Footer */}
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Maskumambang Creative Center
            </Text>
          </Animated.View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      {/* ═══ Modal Server Settings (hidden, 7x tap logo) ═══ */}
      <Modal
        visible={showServerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowServerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Server size={20} color={Colors.primary} />
              <Text style={styles.modalTitle}>Pengaturan Server API</Text>
            </View>
            <Text style={styles.modalSub}>Tentukan endpoint backend API LMS</Text>

            <View style={styles.inputPillModal}>
              <TextInput
                style={styles.inputTextModal}
                placeholder="https://api.example.com"
                placeholderTextColor="#94A3B8"
                value={customUrlInput}
                onChangeText={setCustomUrlInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.presetRow}>
              <TouchableOpacity
                style={[styles.presetChip, { backgroundColor: "#ECFDF5" }]}
                onPress={() => setCustomUrlInput(PROD_API_BASE_URL)}
              >
                <Text style={[styles.presetChipText, { color: "#059669" }]}>🌐 Production</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setCustomUrlInput(LOCAL_API_BASE_URL)}
              >
                <Text style={styles.presetChipText}>💻 Local Dev</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnOutline]}
                onPress={() => setShowServerModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: Colors.primary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnFill]}
                onPress={handleSaveServerUrl}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  /* ─ Header ─ */
  header: {
    width: SCREEN_W,
    height: HEADER_H,
    backgroundColor: "#162E6E",
    overflow: "hidden",
    position: "relative",
  },
  patternBg: {
    position: "absolute",
    width: SCREEN_W,
    height: HEADER_H,
    opacity: 0.18,
  },
  patternOverlay: {
    position: "absolute",
    width: SCREEN_W,
    height: HEADER_H,
    backgroundColor: "transparent",
  },
  mosqueBg: {
    position: "absolute",
    right: -SCREEN_W * 0.15,
    bottom: 0,
    width: SCREEN_W * 0.75,
    height: HEADER_H * 0.85,
    opacity: 0.18,
  },
  mosqueOverlay: {
    position: "absolute",
    width: SCREEN_W,
    height: HEADER_H,
    backgroundColor: "transparent",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoWrapper: {
    width: 82,
    height: 82,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 14,
    padding: 10,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  appName: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  appSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 20,
  },

  /* ─ Wave ─ */
  waveContainer: {
    backgroundColor: "#162E6E",
    marginTop: -1,
  },

  /* ─ Card ─ */
  kav: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -2,
  },
  cardContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#162E6E",
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
  },

  /* ─ Error ─ */
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "600",
  },

  /* ─ Pill Input ─ */
  inputPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  inputIcon: {
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
  },
  eyeBtn: {
    paddingLeft: 8,
  },

  /* ─ Login Button ─ */
  loginBtn: {
    backgroundColor: "#162E6E",
    borderRadius: 50,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
    shadowColor: "#162E6E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  /* ─ Divider ─ */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
  },

  /* ─ Passkey Button ─ */
  passkeyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 50,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  passkeyBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#162E6E",
  },

  /* ─ Mode Tamu ─ */
  tamuBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EEF2FF",
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tamuBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#162E6E",
  },

  /* ─ Footer ─ */
  footerText: {
    textAlign: "center",
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 8,
  },

  /* ─ Server Modal ─ */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#162E6E",
  },
  modalSub: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
  },
  inputPillModal: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  inputTextModal: {
    fontSize: 14,
    color: "#1E293B",
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#162E6E",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnOutline: {
    borderWidth: 1.5,
    borderColor: "#162E6E",
  },
  modalBtnFill: {
    backgroundColor: "#162E6E",
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
