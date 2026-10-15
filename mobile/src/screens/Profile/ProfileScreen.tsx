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
  LogOut,
  ChevronRight,
  Info,
  Check,
  FingerprintPattern,
  ScanFace,
  Lock,
  Clock,
  Pencil,
  UserCheck,
  Briefcase,
  Phone,
  MapPin,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { RoleSwitcherModal } from "../../components/RoleSwitcherModal";
import { EditPegawaiModal } from "./EditPegawaiModal";
import { APP_CONFIG } from "../../constants/config";
import { apiClient } from "../../api/client";

export const ProfileScreen = () => {
  const {
    user,
    activeRole,
    logout,
    biometricStatus,
    checkBiometricStatus,
    enableBiometric,
    disableBiometric,
    autoLogoutMinutes,
    setAutoLogoutMinutes,
  } = useAuthStore();

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBioPasswordModal, setShowBioPasswordModal] = useState(false);
  const [bioConfirmPassword, setBioConfirmPassword] = useState("");
  const [bioError, setBioError] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [pegawaiDetail, setPegawaiDetail] = useState<any>(null);

  const loadPegawaiDetail = async () => {
    if (!user?.pegawai?.pegawai_id) return;
    try {
      const res = await apiClient.get("/pegawai", {
        params: {
          pegawai_id: `eq.${user.pegawai.pegawai_id}`,
        },
      });
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      if (data) {
        setPegawaiDetail(data);
      }
    } catch (e) {
      console.warn("Gagal memuat detail pegawai:", e);
    }
  };

  useEffect(() => {
    checkBiometricStatus();
    loadPegawaiDetail();
  }, [checkBiometricStatus, user?.pegawai?.pegawai_id]);

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

  const handleSelectAutoLogout = () => {
    Alert.alert(
      "Auto Logout Keamanan",
      "Pilih durasi waktu tidak aktif sebelum aplikasi keluar otomatis demi keamanan akun Anda:",
      [
        { text: "5 Menit", onPress: () => setAutoLogoutMinutes(5) },
        { text: "15 Menit (Standar)", onPress: () => setAutoLogoutMinutes(15) },
        { text: "30 Menit", onPress: () => setAutoLogoutMinutes(30) },
        { text: "60 Menit", onPress: () => setAutoLogoutMinutes(60) },
        { text: "Batal", style: "cancel" },
      ]
    );
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
            {user?.pegawai?.nama || user?.username || "Pengguna SIMAS"}
          </Text>
          <Text style={styles.userRole}>
            {activeRole?.nama_role || user?.roles?.[0]?.nama_role || "Pengguna"}
            {activeRole?.lembaga?.singkatan ? ` • ${activeRole.lembaga.singkatan}` : ""}
          </Text>

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

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowRoleModal(true)}
            activeOpacity={user && user.roles.length > 1 ? 0.7 : 1}
            disabled={!user || user.roles.length <= 1}
          >
            <View style={styles.iconCircle}>
              <Shield size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Peran Aktif (SIMAS)</Text>
              <Text style={[styles.menuValue, user && user.roles.length > 1 && { color: "#1D4ED8", fontWeight: "bold" }]}>
                {activeRole?.nama_role || user?.roles?.[0]?.nama_role || "-"}
                {activeRole?.lembaga?.singkatan ? ` • ${activeRole.lembaga.singkatan}` : ""}
                {user && user.roles.length > 1 ? "  ▾ (Ketuk untuk ganti)" : ""}
              </Text>
            </View>
            {user && user.roles.length > 1 && (
              <ChevronRight size={18} color="#94A3B8" />
            )}
          </TouchableOpacity>
        </Card>

        {/* Data Kepegawaian Saya (Khusus Pegawai) */}
        {user?.pegawai?.pegawai_id ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Data Kepegawaian</Text>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => setShowEditModal(true)}
                activeOpacity={0.7}
              >
                <Pencil size={13} color="#1D4ED8" />
                <Text style={styles.editProfileBtnText}>Edit Profil</Text>
              </TouchableOpacity>
            </View>

            <Card style={styles.menuCard}>
              <TouchableOpacity
                style={styles.clickableMenuItem}
                onPress={() => setShowEditModal(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: "#eff6ff" }]}>
                  <UserCheck size={18} color="#2563eb" />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>Profil Biodata Lengkap</Text>
                  <Text style={styles.menuValue}>
                    {pegawaiDetail?.nama || user.pegawai.nama}
                  </Text>
                  <Text style={styles.menuSubLabel}>
                    {pegawaiDetail?.no_hp ? `HP: ${pegawaiDetail.no_hp}` : "No. HP belum diisi"} • {pegawaiDetail?.jenis_kelamin === "P" ? "Perempuan" : "Laki-laki"}
                  </Text>
                  {pegawaiDetail?.alamat && (
                    <Text style={[styles.menuSubLabel, { marginTop: 2 }]} numberOfLines={1}>
                      📍 {pegawaiDetail.alamat}
                    </Text>
                  )}
                </View>
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 16 }} />

              <View style={styles.menuItem}>
                <View style={[styles.iconCircle, { backgroundColor: "#f8fafc" }]}>
                  <Briefcase size={18} color={Colors.primary} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>Jabatan & Kedinasan</Text>
                  <Text style={styles.menuValue}>
                    {pegawaiDetail?.jabatan || user.pegawai.jabatan || "Pegawai"}
                  </Text>
                  <Text style={styles.menuSubLabel}>
                    NIG: {pegawaiDetail?.nig || user.pegawai.nig || "—"} • Status: {pegawaiDetail?.status || "Aktif"}
                  </Text>
                </View>
              </View>
            </Card>
          </>
        ) : null}

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

          <View style={{ height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 16 }} />

          <TouchableOpacity
            style={styles.clickableMenuItem}
            onPress={handleSelectAutoLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#eff6ff" }]}>
              <Clock size={18} color="#2563eb" />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Auto Logout Keamanan</Text>
              <Text style={styles.menuSubLabel}>
                Keluar otomatis setelah {autoLogoutMinutes || 15} menit tidak aktif
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* App Info */}
        <Text style={styles.sectionHeader}>Informasi Aplikasi</Text>
        <Card style={styles.menuCard}>
          <View style={styles.menuItem}>
            <View style={styles.iconCircle}>
              <Info size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Aplikasi</Text>
              <Text style={styles.menuValue}>
                {APP_CONFIG.appName} v{APP_CONFIG.appVersion} • {APP_CONFIG.schoolName}
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

      {/* Role Switcher Bottom Sheet */}
      <RoleSwitcherModal
        visible={showRoleModal}
        onClose={() => setShowRoleModal(false)}
      />

      {/* Edit Pegawai Modal */}
      {user?.pegawai?.pegawai_id ? (
        <EditPegawaiModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          pegawaiId={user.pegawai.pegawai_id}
          onSuccess={loadPegawaiDetail}
        />
      ) : null}
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.primaryDark,
    marginBottom: 8,
    marginTop: 8,
    marginLeft: 4,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  editProfileBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
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
  modalActions: {
    flexDirection: "row",
    marginTop: 8,
  },
});
