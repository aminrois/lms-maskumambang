// mobile/src/screens/Auth/LoginScreen.tsx
import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GraduationCap, Lock, User, Server, Check } from "lucide-react-native";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { APP_CONFIG, PROD_API_BASE_URL, DEFAULT_API_BASE_URL } from "../../constants/config";

export const LoginScreen = () => {
  const [identifier, setIdentifier] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [error, setError] = useState("");
  const [showServerModal, setShowServerModal] = useState(false);

  const { login, isLoading, apiBaseUrl, setApiBaseUrl } = useAuthStore();
  const [customUrlInput, setCustomUrlInput] = useState(apiBaseUrl);

  const handleLogin = async () => {
    if (!identifier.trim() || !kataSandi.trim()) {
      setError("Harap isi username/email/NIP dan kata sandi.");
      return;
    }

    try {
      setError("");
      await login(identifier.trim(), kataSandi);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Gagal masuk. Periksa kembali kredensial atau koneksi server Anda.";
      setError(msg);
      Alert.alert("Gagal Masuk", msg);
    }
  };

  const handleSaveServerUrl = async () => {
    if (!customUrlInput.trim()) return;
    await setApiBaseUrl(customUrlInput.trim());
    setShowServerModal(false);
    Alert.alert("Sukses", "Alamat server berhasil diperbarui.");
  };

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
            <View style={styles.logoCircle}>
              <GraduationCap size={44} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <Text style={styles.appName}>{APP_CONFIG.appName}</Text>
            <Text style={styles.schoolName}>{APP_CONFIG.schoolName}</Text>
            <View style={styles.taglineBadge}>
              <Text style={styles.taglineText}>Sistem Akademik & KBM Terpadu</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Selamat Datang</Text>
            <Text style={styles.formSubtitle}>
              Masuk dengan akun Guru, Pegawai, atau Siswa
            </Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Username / Email / NIP / NISN"
              placeholder="Masukkan username atau NIP"
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
              label="Kata Sandi"
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
              title="Masuk ke Aplikasi"
              onPress={handleLogin}
              loading={isLoading}
              size="lg"
              style={styles.loginBtn}
            />

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
            © {new Date().getFullYear()} LMS Maskumambang • Versi {APP_CONFIG.appVersion}
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
                style={styles.presetBtn}
                onPress={() => setCustomUrlInput(PROD_API_BASE_URL)}
              >
                <Text style={styles.presetBtnText}>Production VPS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => setCustomUrlInput(DEFAULT_API_BASE_URL)}
              >
                <Text style={styles.presetBtnText}>Local Dev</Text>
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
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  schoolName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSub,
    marginTop: 4,
  },
  taglineBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
  },
  taglineText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
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
