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
  ImageBackground,
  TextInput,
  Dimensions,
  Animated,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import {
  Lock,
  User,
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
import { PROD_API_BASE_URL, LOCAL_API_BASE_URL } from "../../constants/config";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
// Header tinggi fixed agar tidak terpengaruh KAV
const HEADER_H = Math.min(SCREEN_H * 0.37, 280);

/* ─── Wave SVG ─── */
const WaveDivider = () => (
  <Svg width={SCREEN_W} height={44} viewBox={`0 0 ${SCREEN_W} 44`}>
    <Path
      d={`M0,0 C${SCREEN_W * 0.3},44 ${SCREEN_W * 0.7},0 ${SCREEN_W},44 L${SCREEN_W},44 L0,44 Z`}
      fill="#FFFFFF"
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
  const slideAnim = useRef(new Animated.Value(30)).current;

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

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
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
          `Gunakan ${biometricStatus.biometricName} untuk masuk lebih cepat?`,
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
  const bioName = biometricStatus?.biometricName || "Passkey";
  const showBiometric = biometricStatus?.isEnabled;

  return (
    // KAV membungkus seluruh layar agar header tidak ikut bergeser
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#162E6E" />

      {/* ═══ HEADER: gambar dari user ═══ */}
      <ImageBackground
        source={require("../../../assets/headerlogin.webp")}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
        resizeMode="cover"
      >
        {/* Dark overlay agar teks tetap terbaca */}
        <View style={styles.headerOverlay} />

        {/* Brand */}
        <View style={styles.headerContent}>
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
          <Text style={styles.appSubtitle}>
            Sistem Informasi Pondok Pesantren Maskumambang
          </Text>
        </View>
      </ImageBackground>

      {/* Wave */}
      <View style={styles.waveWrap}>
        <WaveDivider />
      </View>

      {/* ═══ FORM: ScrollView agar tidak tertutup keyboard ═══ */}
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={[
          styles.formContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <Text style={styles.welcomeTitle}>Selamat Datang</Text>
          <Text style={styles.welcomeSub}>
            Masuk untuk mengakses layanan siMas.
          </Text>

          {/* Error */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          {/* Username */}
          <View style={styles.inputPill}>
            <User size={19} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.inputText}
              placeholder="Masukkan username"
              placeholderTextColor="#94A3B8"
              value={identifier}
              onChangeText={(t) => {
                setIdentifier(t);
                setError("");
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.inputPill}>
            <Lock size={19} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.inputText}
              placeholder="Masukkan kata sandi"
              placeholderTextColor="#94A3B8"
              value={kataSandi}
              onChangeText={(t) => {
                setKataSandi(t);
                setError("");
              }}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity
              onPress={() => setShowPass(!showPass)}
              style={styles.eyeBtn}
            >
              {showPass ? (
                <Eye size={19} color="#94A3B8" />
              ) : (
                <EyeOff size={19} color="#94A3B8" />
              )}
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
                <ArrowRight size={19} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ATAU</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ─── PASSKEY + MODE TAMU: 1 baris 2 kolom ─── */}
          <View style={styles.bottomBtnRow}>
            {/* Passkey */}
            <TouchableOpacity
              style={styles.halfBtn}
              onPress={showBiometric ? handleBiometricLogin : undefined}
              disabled={isBioAuthenticating || isLoading}
              activeOpacity={0.85}
            >
              {isBioAuthenticating ? (
                <ActivityIndicator size="small" color="#162E6E" />
              ) : (
                <>
                  {isFaceId ? (
                    <ScanFace size={20} color="#162E6E" />
                  ) : (
                    <FingerprintPattern size={20} color="#162E6E" />
                  )}
                  <Text style={styles.halfBtnText}>Passkey</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Mode Tamu */}
            <TouchableOpacity style={[styles.halfBtn, styles.halfBtnTamu]} activeOpacity={0.8}>
              <UserCircle size={20} color="#162E6E" />
              <Text style={styles.halfBtnText}>Mode Tamu</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Maskumambang Creative Center
          </Text>
        </Animated.View>
      </ScrollView>

      {/* ═══ Modal Server (7x tap logo) ═══ */}
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
                <Text style={[styles.presetChipText, { color: "#059669" }]}>
                  🌐 Production
                </Text>
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
                <Text style={[styles.modalBtnText, { color: Colors.primary }]}>
                  Batal
                </Text>
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
    </KeyboardAvoidingView>
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
  },
  headerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(22, 46, 110, 0.35)",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoWrapper: {
    width: 68,
    height: 68,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 10,
    padding: 8,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  appName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
    marginTop: 3,
  },

  /* ─ Wave ─ */
  waveWrap: {
    backgroundColor: "#162E6E",
    marginTop: -1,
  },

  /* ─ Form ─ */
  formScroll: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  formContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    justifyContent: "center",
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#162E6E",
    marginBottom: 3,
  },
  welcomeSub: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
  },

  /* ─ Error ─ */
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12.5,
    color: "#DC2626",
    fontWeight: "600",
  },

  /* ─ Input Pill ─ */
  inputPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === "ios" ? 13 : 9,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  inputIcon: {
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 14.5,
    color: "#1E293B",
  },
  eyeBtn: {
    paddingLeft: 8,
  },

  /* ─ Login Button ─ */
  loginBtn: {
    backgroundColor: "#162E6E",
    borderRadius: 50,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 2,
    shadowColor: "#162E6E",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 7,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  /* ─ Divider ─ */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
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

  /* ─ Bottom Row: Passkey + Mode Tamu (1 baris 2 kolom) ─ */
  bottomBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  halfBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 50,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  halfBtnTamu: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  halfBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#162E6E",
  },

  /* ─ Footer ─ */
  footerText: {
    textAlign: "center",
    fontSize: 11.5,
    color: "#94A3B8",
  },

  /* ─ Modal Server ─ */
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
