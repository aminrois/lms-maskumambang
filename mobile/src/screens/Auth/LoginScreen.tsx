// mobile/src/screens/Auth/LoginScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Lock,
  User,
  Server,
  Check,
  FingerprintPattern,
  ScanFace,
} from "lucide-react-native";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { APP_CONFIG, PROD_API_BASE_URL, LOCAL_API_BASE_URL } from "../../constants/config";

export const LoginScreen = () => {
  const [identifier, setIdentifier] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [error, setError] = useState("");
  const [showServerModal, setShowServerModal] = useState(false);
  const [isBioAuthenticating, setIsBioAuthenticating] = useState(false);

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
  const [customUrlInput, setCustomUrlInput] = useState(apiBaseUrl);

  useEffect(() => {
    const initBiometrics = async () => {
      const status = await checkBiometricStatus();
      if (status.isEnabled && status.savedUsername) {
        setIdentifier(status.savedUsername);
      }
    };
    initBiometrics();
  }, [checkBiometricStatus]);

  const handleLogin = async () => {
    if (!identifier.trim() || !kataSandi.trim()) {
      setError("Harap isi username/email/NIP dan kata sandi.");
      return;
    }

    try {
      setError("");
      await login(identifier.trim(), kataSandi);

      // Jika biometrik didukung tapi belum aktif, tawarkan kepada user
      if (
        biometricStatus?.isSupported &&
        biometricStatus?.isEnrolled &&
        !biometricStatus?.isEnabled
      ) {
        Alert.alert(
          `Aktifkan ${biometricStatus.biometricName}?`,
          `Apakah Anda ingin menggunakan ${biometricStatus.biometricName} untuk masuk lebih cepat di kemudian hari?`,
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
        "Gagal masuk. Periksa kembali kredensial atau koneksi server Anda.";
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

  const handleSaveServerUrl = async () => {
    if (!customUrlInput.trim()) return;
    await setApiBaseUrl(customUrlInput.trim());
    setShowServerModal(false);
    Alert.alert("Sukses", "Alamat server berhasil diperbarui.");
  };

  const isFaceId = biometricStatus?.biometricType === "faceid";
  const bioName = biometricStatus?.biometricName || "Sidik Jari / Face ID";

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Brand */}
          <View style={styles.brandContainer}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>MASDICO</Text>
            <Text style={styles.schoolName}>Maskumambang Digital Ecosystem</Text>
            <View style={styles.taglineBadge}>
              <Text style={styles.taglineText}>Satu Aplikasi, Banyak Manfaat untuk Masa Depan</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>


            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Username"
              placeholder="Masukkan username"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                setError("");
              }}
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<User size={20} color={Colors.textMuted} />}
            />

            <Input
              label="Password"
              placeholder="Masukkan kata sandi"
              value={kataSandi}
              onChangeText={(text) => {
                setKataSandi(text);
                setError("");
              }}
              isPassword
              leftIcon={<Lock size={20} color={Colors.textMuted} />}
            />

            <Button
              title="Login"
              onPress={handleLogin}
              loading={isLoading && !isBioAuthenticating}
              size="lg"
              style={styles.loginBtn}
            />

            {/* Biometric Login Button — di bawah button Login */}
            {biometricStatus?.isEnabled && (
              <View style={styles.biometricSection}>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>atau</Text>
                  <View style={styles.dividerLine} />
                </View>

                {biometricStatus.savedUsername ? (
                  <Text style={styles.biometricHint}>
                    Masuk sebagai <Text style={{ fontWeight: "800" }}>{biometricStatus.savedUsername}</Text>
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={styles.biometricBtn}
                  onPress={handleBiometricLogin}
                  disabled={isBioAuthenticating || isLoading}
                  activeOpacity={0.8}
                >
                  {isBioAuthenticating ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <>
                      {isFaceId ? (
                        <ScanFace size={22} color={Colors.primary} />
                      ) : (
                        <FingerprintPattern size={22} color={Colors.primary} />
                      )}
                      <Text style={styles.biometricBtnText}>Masuk dengan {bioName}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Server Settings Link */}
            <TouchableOpacity
              onPress={() => setShowServerModal(true)}
              style={styles.serverConfigBtn}
              activeOpacity={0.7}
            >
              <Server size={14} color={Colors.textSub} />
              <Text style={styles.serverConfigText}>
                Server: {apiBaseUrl.replace(/https?:\/\//, "").slice(0, 24)}...
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Maskumambang Creative Center
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Pengaturan Server URL */}
      <Modal
        visible={showServerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowServerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pengaturan Server API</Text>
            <Text style={styles.modalSubtitle}>
              Tentukan alamat endpoint backend API LMS
            </Text>

            <Input
              label="API Base URL"
              placeholder="http://192.168.1.100:3000/api"
              value={customUrlInput}
              onChangeText={setCustomUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.presetButtons}>
              <TouchableOpacity
                style={[styles.presetBtn, { backgroundColor: "#E6FBF5" }]}
                onPress={() => setCustomUrlInput(PROD_API_BASE_URL)}
              >
                <Text style={[styles.presetBtnText, { color: Colors.success }]}>🌐 lms2.maskumambang.ac.id</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => setCustomUrlInput(LOCAL_API_BASE_URL)}
              >
                <Text style={styles.presetBtnText}>💻 Local Dev</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Batal"
                variant="outline"
                onPress={() => setShowServerModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Simpan"
                onPress={handleSaveServerUrl}
                icon={<Check size={16} color="#FFFFFF" />}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#162E6E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  appName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#162E6E",
    letterSpacing: 2,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : undefined,
  },
  schoolName: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#475569",
    marginTop: 4,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  taglineBadge: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  taglineText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
    letterSpacing: 0.2,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primaryDark,
  },
  formSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: Colors.dangerBg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: "600",
  },
  biometricSection: {
    marginTop: 4,
  },
  biometricHint: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  biometricBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    backgroundColor: Colors.primaryLight,
  },
  biometricBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#cbd5e1",
  },
  dividerText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  loginBtn: {
    marginTop: 8,
  },
  serverConfigBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    gap: 6,
  },
  serverConfigText: {
    fontSize: 11,
    color: Colors.textSub,
    fontWeight: "600",
  },
  footerText: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  presetButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  modalActions: {
    flexDirection: "row",
  },
});
