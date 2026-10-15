// mobile/src/screens/Profile/EditPegawaiModal.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Users,
  ShieldAlert,
  Check,
} from "lucide-react-native";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";
import { apiClient } from "../../api/client";
import { useAuthStore } from "../../store/useAuthStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface EditPegawaiModalProps {
  visible: boolean;
  onClose: () => void;
  pegawaiId: number;
  onSuccess: () => void;
}

export const EditPegawaiModal: React.FC<EditPegawaiModalProps> = ({
  visible,
  onClose,
  pegawaiId,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { updateUserPegawai } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    nig: "",
    nip: "",
    nik: "",
    nama: "",
    jenis_kelamin: "L",
    tempat_lahir: "",
    tanggal_lahir: "",
    alamat: "",
    no_hp: "",
    status: "Aktif",
    jabatan: "",
    tugas_tambahan: "",
    golongan_darah: "",
    nama_ayah: "",
    nama_ibu: "",
    jumlah_anak_laki: "0",
    jumlah_anak_perempuan: "0",
  });

  useEffect(() => {
    if (visible && pegawaiId) {
      loadPegawaiData();
    }
  }, [visible, pegawaiId]);

  const loadPegawaiData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get("/pegawai", {
        params: {
          pegawai_id: `eq.${pegawaiId}`,
        },
      });
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      if (data) {
        setFormData({
          nig: data.nig || "",
          nip: data.nip || "",
          nik: data.nik || "",
          nama: data.nama || "",
          jenis_kelamin: data.jenis_kelamin === "P" ? "P" : "L",
          tempat_lahir: data.tempat_lahir || "",
          tanggal_lahir: data.tanggal_lahir ? String(data.tanggal_lahir).split("T")[0] : "",
          alamat: data.alamat || "",
          no_hp: data.no_hp || "",
          status: data.status || "Aktif",
          jabatan: data.jabatan || "",
          tugas_tambahan: data.tugas_tambahan || "",
          golongan_darah: data.golongan_darah || "",
          nama_ayah: data.nama_ayah || "",
          nama_ibu: data.nama_ibu || "",
          jumlah_anak_laki: data.jumlah_anak_laki !== null && data.jumlah_anak_laki !== undefined ? String(data.jumlah_anak_laki) : "0",
          jumlah_anak_perempuan: data.jumlah_anak_perempuan !== null && data.jumlah_anak_perempuan !== undefined ? String(data.jumlah_anak_perempuan) : "0",
        });
      }
    } catch (err: any) {
      console.warn("Gagal memuat profil pegawai:", err);
      Alert.alert("Gagal", "Tidak dapat memuat rincian data pegawai.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nama.trim()) {
      Alert.alert("Perhatian", "Nama lengkap wajib diisi.");
      return;
    }

    try {
      setIsSaving(true);
      const payload: Record<string, any> = {
        nama: formData.nama.trim(),
        nip: formData.nip.trim() || null,
        nik: formData.nik.trim() || null,
        jenis_kelamin: formData.jenis_kelamin,
        tempat_lahir: formData.tempat_lahir.trim() || null,
        tanggal_lahir: formData.tanggal_lahir.trim() || null,
        alamat: formData.alamat.trim() || null,
        no_hp: formData.no_hp.trim() || null,
        golongan_darah: formData.golongan_darah.trim() || null,
        nama_ayah: formData.nama_ayah.trim() || null,
        nama_ibu: formData.nama_ibu.trim() || null,
        jumlah_anak_laki: parseInt(formData.jumlah_anak_laki, 10) || 0,
        jumlah_anak_perempuan: parseInt(formData.jumlah_anak_perempuan, 10) || 0,
      };

      await apiClient.patch(`/pegawai?pegawai_id=eq.${pegawaiId}`, payload);

      // Sinkronkan nama di local store
      await updateUserPegawai({ nama: formData.nama.trim() });

      Alert.alert("Berhasil", "Data profil kepegawaian Anda berhasil diperbarui.");
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Gagal menyimpan perubahan profil.";
      Alert.alert("Gagal", msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Edit Data Profil Saya</Text>
              <Text style={styles.modalSubtitle}>Perbarui informasi kepegawaian & biodata Anda</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Memuat data profil...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formScrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {/* Notice Administrator Fields */}
              <View style={styles.infoBox}>
                <ShieldAlert size={18} color="#D97706" style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.infoBoxTitle}>Identitas Kedinasan Resmi</Text>
                  <Text style={styles.infoBoxText}>
                    NIG ({formData.nig || "—"}), Jabatan ({formData.jabatan || "Pegawai"}), dan Status ({formData.status}) dikelola secara terpusat oleh administrator.
                  </Text>
                </View>
              </View>

              {/* Data Pribadi Pokok */}
              <Text style={styles.sectionTitle}>A. Identitas Pokok</Text>

              <Input
                label="Nama Lengkap *"
                placeholder="Masukkan nama lengkap dengan gelar"
                value={formData.nama}
                onChangeText={(t) => setFormData({ ...formData, nama: t })}
                leftIcon={<User size={18} color={Colors.textMuted} />}
              />

              <Input
                label="Nomor HP / WhatsApp"
                placeholder="Contoh: 081234567890"
                value={formData.no_hp}
                keyboardType="phone-pad"
                onChangeText={(t) => setFormData({ ...formData, no_hp: t })}
                leftIcon={<Phone size={18} color={Colors.textMuted} />}
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Input
                    label="NIK (No. KTP)"
                    placeholder="16 digit NIK"
                    value={formData.nik}
                    keyboardType="number-pad"
                    onChangeText={(t) => setFormData({ ...formData, nik: t })}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Input
                    label="NIP (Opsional)"
                    placeholder="Nomor NIP"
                    value={formData.nip}
                    onChangeText={(t) => setFormData({ ...formData, nip: t })}
                  />
                </View>
              </View>

              {/* Jenis Kelamin */}
              <Text style={styles.fieldLabel}>Jenis Kelamin *</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.jenis_kelamin === "L" && styles.genderButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, jenis_kelamin: "L" })}
                >
                  <Text
                    style={[
                      styles.genderText,
                      formData.jenis_kelamin === "L" && styles.genderTextActive,
                    ]}
                  >
                    Laki-laki
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.jenis_kelamin === "P" && styles.genderButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, jenis_kelamin: "P" })}
                >
                  <Text
                    style={[
                      styles.genderText,
                      formData.jenis_kelamin === "P" && styles.genderTextActive,
                    ]}
                  >
                    Perempuan
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tempat & Tanggal Lahir */}
              <View style={styles.twoCol}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Input
                    label="Tempat Lahir"
                    placeholder="Kota kelahiran"
                    value={formData.tempat_lahir}
                    onChangeText={(t) => setFormData({ ...formData, tempat_lahir: t })}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Input
                    label="Tanggal Lahir"
                    placeholder="YYYY-MM-DD"
                    value={formData.tanggal_lahir}
                    onChangeText={(t) => setFormData({ ...formData, tanggal_lahir: t })}
                    leftIcon={<Calendar size={18} color={Colors.textMuted} />}
                  />
                </View>
              </View>

              {/* Golongan Darah */}
              <Text style={styles.fieldLabel}>Golongan Darah</Text>
              <View style={styles.goldarRow}>
                {["A+", "B+", "AB+", "O+", "A", "B", "AB", "O"].map((gd) => {
                  const isSelected = formData.golongan_darah === gd;
                  return (
                    <TouchableOpacity
                      key={gd}
                      style={[styles.goldarBadge, isSelected && styles.goldarBadgeActive]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          golongan_darah: isSelected ? "" : gd,
                        })
                      }
                    >
                      <Text
                        style={[styles.goldarText, isSelected && styles.goldarTextActive]}
                      >
                        {gd}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Alamat Lengkap */}
              <Input
                label="Alamat Lengkap"
                placeholder="Alamat tempat tinggal saat ini"
                value={formData.alamat}
                multiline
                numberOfLines={3}
                onChangeText={(t) => setFormData({ ...formData, alamat: t })}
                leftIcon={<MapPin size={18} color={Colors.textMuted} />}
              />

              {/* Data Keluarga */}
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>B. Data Keluarga</Text>

              <View style={styles.twoCol}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Input
                    label="Nama Ayah Kandung"
                    placeholder="Nama ayah"
                    value={formData.nama_ayah}
                    onChangeText={(t) => setFormData({ ...formData, nama_ayah: t })}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Input
                    label="Nama Ibu Kandung"
                    placeholder="Nama ibu"
                    value={formData.nama_ibu}
                    onChangeText={(t) => setFormData({ ...formData, nama_ibu: t })}
                  />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Input
                    label="Jml Anak Laki-laki"
                    placeholder="0"
                    keyboardType="number-pad"
                    value={formData.jumlah_anak_laki}
                    onChangeText={(t) => setFormData({ ...formData, jumlah_anak_laki: t })}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Input
                    label="Jml Anak Perempuan"
                    placeholder="0"
                    keyboardType="number-pad"
                    value={formData.jumlah_anak_perempuan}
                    onChangeText={(t) => setFormData({ ...formData, jumlah_anak_perempuan: t })}
                  />
                </View>
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>
          )}

          {/* Action Buttons Footer */}
          <View
            style={[
              styles.modalFooter,
              { paddingBottom: Math.max(insets.bottom + 12, Platform.OS === "android" ? 34 : 20) },
            ]}
          >
            <Button
              title="Batal"
              variant="outline"
              onPress={onClose}
              style={{ flex: 1, marginRight: 8 }}
              disabled={isSaving}
            />
            <Button
              title={isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              onPress={handleSave}
              style={{ flex: 1.5, marginLeft: 8 }}
              disabled={isSaving || isLoading}
              icon={<Check size={18} color="#FFFFFF" />}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748B",
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  formScrollContent: {
    paddingBottom: 140,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  infoBoxTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },
  infoBoxText: {
    fontSize: 11,
    color: "#B45309",
    marginTop: 2,
    lineHeight: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 10,
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  twoCol: {
    flexDirection: "row",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
    marginTop: 4,
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
  },
  genderButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EFF6FF",
  },
  genderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  genderTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  goldarRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  goldarBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
  },
  goldarBadgeActive: {
    borderColor: "#DC2626",
    backgroundColor: "#FEE2E2",
  },
  goldarText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  goldarTextActive: {
    color: "#DC2626",
    fontWeight: "700",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
});
