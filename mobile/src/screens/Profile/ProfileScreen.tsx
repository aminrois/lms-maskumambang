// mobile/src/screens/Profile/ProfileScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Mail,
  Shield,
  Server,
  LogOut,
  ChevronRight,
  Info,
  Check,
  FingerprintPattern,
  ScanFace,
  Lock,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { APP_CONFIG, PROD_API_BASE_URL, LOCAL_API_BASE_URL } from "../../constants/config";

export const ProfileScreen = () => {
  const {
    user,
    logout,
    apiBaseUrl,
    setApiBaseUrl,
    biometricStatus,
    checkBiometricStatus,
    enableBiometric,
    disableBiometric,
  } = useAuthStore();

  const [showServerModal, setShowServerModal] = useState(false);
  const [showBioPasswordModal, setShowBioPasswordModal] = useState(false);
  const [bioConfirmPassword, setBioConfirmPassword] = useState("");
  const [bioError, setBioError] = useState("");
  const [customUrl, setCustomUrl] = useState(apiBaseUrl);

  useEffect(() => {
    checkBiometricStatus();
  }, [checkBiometricStatus]);

  const handleLogout = () => {
    Alert.alert("Konfirmasi Keluar", "Apakah Anda yakin ingin keluar dari akun ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (value) {
      if (!biometricStatus?.isSupported || !biometricStatus?.isEnrolled) {
        Alert.alert(
          "Biometrik Belum Siap",
          "Sensor sidik jari / Face ID tidak tersedia atau belum didaftarkan di pengaturan HP Anda."
        );
        return;
      }
      // Buka modal untuk konfirmasi password agar disimpan di SecureStore
      setBioConfirmPassword("");
      setBioError("");
      setShowBioPasswordModal(true);
    } else {
      Alert.alert(
        "Nonaktifkan Biometrik",
        `Apakah Anda ingin menonaktifkan login dengan ${biometricStatus?.biometricName || "Biometrik"}?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Nonaktifkan",
            style: "destructive",
            onPress: async () => {
              await disableBiometric();
              Alert.alert("Sukses", "Login biometrik telah dinonaktifkan.");
            },
          },
        ]
      );
    }
  };

  const handleConfirmEnableBiometric = async () => {
    if (!bioConfirmPassword.trim()) {
      setBioError("Harap masukkan kata sandi akun Anda saat ini.");
      return;
    }

    const identifier = user?.username || user?.email || user?.pegawai?.nig || "";
    if (!identifier) {
      setBioError("Data akun tidak valid.");
      return;
    }

    try {
      const success = await enableBiometric(identifier, bioConfirmPassword.trim());
      if (success) {
        setShowBioPasswordModal(false);
        setBioConfirmPassword("");
        Alert.alert(
          "Biometrik Aktif",
          `Login cepat dengan ${biometricStatus?.biometricName || "Biometrik"} berhasil diaktifkan untuk akun ${identifier}.`
        );
      } else {
        setBioError("Gagal mengaktifkan biometrik pada penyimpanan aman.");
      }
    } catch (err: any) {
      setBioError(err.message || "Terjadi kesalahan.");
    }
  };

  const handleSaveUrl = async () => {
    if (!customUrl.trim()) return;
    await setApiBaseUrl(customUrl.trim());
    setShowServerModal(false);
    Alert.alert("Sukses", "Alamat server berhasil diperbarui.");
  };

  const isFaceId = biometricStatus?.biometricType === "faceid";
  const bioName = biometricStatus?.biometricName || "Sidik Jari / Face ID";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="Profil Saya" subtitle="Informasi akun & pengaturan" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <User size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.userName}>
            {user?.pegawai?.nama || user?.username || "Pengguna LMS"}
          </Text>
          <Text style={styles.userRole}>{user?.roles?.[0]?.nama_role || "Guru"}</Text>

          {user?.pegawai?.nig && (
            <View style={styles.nipBadge}>
              <Text style={styles.nipText}>NIG: {user.pegawai.nig}</Text>
            </View>
          )}
        </Card>

        {/* Info Account Details */}
        <Card style={styles.menuCard}>
          <View style={styles.menuItem}>
            <View style={styles.iconCircle}>
              <Mail size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Email</Text>
              <Text style={styles.menuValue}>{user?.email || "-"}</Text>
            </View>
          </View>

          <View style={styles.menuItem}>
            <View style={styles.iconCircle}>
              <Shield size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Hak Akses / Peran</Text>
              <Text style={styles.menuValue}>{user?.roles?.map((r) => r.nama_role).join(", ") || "-"}</Text>
            </View>
          </View>
        </Card>

        {/* Keamanan & Biometrik */}
        <Text style={styles.sectionHeader}>Keamanan & Masuk Cepat</Text>
        <Card style={styles.menuCard}>
          <View style={styles.biometricRow}>
            <View style={[styles.iconCircle, { backgroundColor: "#f0fdf4" }]}>
              {isFaceId ? (
                <ScanFace size={20} color="#15803d" />
              ) : (
                <FingerprintPattern size={20} color="#15803d" />
              )}
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Login {bioName}</Text>
              <Text style={styles.menuSubLabel}>
                {biometricStatus?.isSupported
                  ? biometricStatus.isEnrolled
                    ? biometricStatus.isEnabled
                      ? `Aktif (User: ${biometricStatus.savedUsername || "Tersimpan"})`
                      : "Tersedia (Sentuh switch untuk aktifkan)"
                    : "Dukungan ada, belum didaftarkan di HP"
                  : "Tidak didukung di perangkat ini"}
              </Text>
            </View>
            <Switch
              value={!!biometricStatus?.isEnabled}
              onValueChange={handleToggleBiometric}
              disabled={!biometricStatus?.isSupported || !biometricStatus?.isEnrolled}
              trackColor={{ false: "#cbd5e1", true: "#86efac" }}
              thumbColor={biometricStatus?.isEnabled ? "#15803d" : "#f8fafc"}
            />
          </View>
        </Card>

        {/* App & Server Settings */}
        <Text style={styles.sectionHeader}>Pengaturan Sistem</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.clickableMenuItem}
            onPress={() => setShowServerModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Server size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Alamat Server API</Text>
              <Text style={styles.menuValue} numberOfLines={1}>
                {apiBaseUrl}
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.iconCircle}>
              <Info size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Versi Aplikasi</Text>
              <Text style={styles.menuValue}>
                {APP_CONFIG.appVersion} • {APP_CONFIG.schoolName}
              </Text>
            </View>
          </View>
        </Card>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            title="Keluar dari Akun"
            variant="danger"
            size="lg"
            onPress={handleLogout}
            icon={<LogOut size={18} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>

      {/* Modal Konfirmasi Password untuk Mengaktifkan Biometrik */}
      <Modal
        visible={showBioPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBioPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalBioIcon}>
              {isFaceId ? (
                <ScanFace size={36} color="#15803d" />
              ) : (
                <FingerprintPattern size={36} color="#15803d" />
              )}
            </View>

            <Text style={styles.modalTitle}>Aktifkan {bioName}</Text>
            <Text style={styles.modalSubtitle}>
              Masukkan kata sandi akun Anda untuk disimpan secara terenkripsi pada perangkat ini.
            </Text>

            {bioError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{bioError}</Text>
              </View>
            ) : null}

            <Input
              label="Kata Sandi Akun"
              placeholder="Masukkan kata sandi saat ini"
              value={bioConfirmPassword}
              onChangeText={(t) => {
                setBioConfirmPassword(t);
                setBioError("");
              }}
              isPassword
              leftIcon={<Lock size={18} color={Colors.textMuted} />}
            />

            <View style={styles.modalActions}>
              <Button
                title="Batal"
                variant="outline"
                onPress={() => setShowBioPasswordModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Aktifkan"
                onPress={handleConfirmEnableBiometric}
                icon={<Check size={16} color="#FFFFFF" />}
                style={{ flex: 1, marginLeft: 8, backgroundColor: "#15803d" }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Server Settings */}
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
              Tentukan endpoint backend API yang aktif
            </Text>

            <Input
              label="API Base URL"
              value={customUrl}
              onChangeText={setCustomUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.presetButtons}>
              <TouchableOpacity
                style={[styles.presetBtn, { backgroundColor: "#E6FBF5" }]}
                onPress={() => setCustomUrl(PROD_API_BASE_URL)}
              >
                <Text style={[styles.presetBtnText, { color: Colors.success }]}>🌐 lms2.maskumambang.ac.id</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => setCustomUrl(LOCAL_API_BASE_URL)}
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
                onPress={handleSaveUrl}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primaryDark,
    textAlign: "center",
  },
  userRole: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
    marginTop: 2,
  },
  nipBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  nipText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.primaryDark,
    marginBottom: 8,
    marginTop: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    padding: 6,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  biometricRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  clickableMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    marginRight: 8,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  menuSubLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  menuValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 2,
  },
  logoutContainer: {
    marginTop: 10,
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
  modalBioIcon: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: Colors.dangerBg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: "600",
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
    marginTop: 8,
  },
});
