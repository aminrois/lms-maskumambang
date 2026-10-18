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
  StatusBar,
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
  Mail,
  GraduationCap,
  School,
  Building2,
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
    no_kk: "",
    nama: "",
    jenis_kelamin: "L",
    tempat_lahir: "",
    tanggal_lahir: "",
    alamat: "",
    no_hp: "",
    email: "",
    status: "Aktif",
    jabatan: "",
    tugas_tambahan: "",
    golongan_darah: "",
    nama_ayah: "",
    nama_ibu: "",
    nama_pasangan: "",
    jumlah_anak_laki: "0",
    jumlah_anak_perempuan: "0",

    // Riwayat Pendidikan Formal
    pendidikan_tk_nama: "",
    pendidikan_tk_tahun_masuk: "",
    pendidikan_tk_tahun_lulus: "",

    pendidikan_sd_nama: "",
    pendidikan_sd_tahun_masuk: "",
    pendidikan_sd_tahun_lulus: "",

    pendidikan_smp_nama: "",
    pendidikan_smp_tahun_masuk: "",
    pendidikan_smp_tahun_lulus: "",

    pendidikan_sma_nama: "",
    pendidikan_sma_tahun_masuk: "",
    pendidikan_sma_tahun_lulus: "",

    // Perguruan Tinggi
    pt_jenjang: "",
    pt_universitas: "",
    pt_fakultas: "",
    pt_jurusan: "",
    pt_prodi: "",
    pt_tahun_masuk: "",
    pt_tahun_lulus: "",
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
          no_kk: data.no_kk || "",
          nama: data.nama || "",
          jenis_kelamin: data.jenis_kelamin === "P" ? "P" : "L",
          tempat_lahir: data.tempat_lahir || "",
          tanggal_lahir: data.tanggal_lahir ? String(data.tanggal_lahir).split("T")[0] : "",
          alamat: data.alamat || "",
          no_hp: data.no_hp || "",
          email: data.email || "",
          status: data.status || "Aktif",
          jabatan: data.jabatan || "",
          tugas_tambahan: data.tugas_tambahan || "",
          golongan_darah: data.golongan_darah || "",
          nama_ayah: data.nama_ayah || "",
          nama_ibu: data.nama_ibu || "",
          nama_pasangan: data.nama_pasangan || "",
          jumlah_anak_laki: data.jumlah_anak_laki !== null && data.jumlah_anak_laki !== undefined ? String(data.jumlah_anak_laki) : "0",
          jumlah_anak_perempuan: data.jumlah_anak_perempuan !== null && data.jumlah_anak_perempuan !== undefined ? String(data.jumlah_anak_perempuan) : "0",

          pendidikan_tk_nama: data.pendidikan_tk_nama || "",
          pendidikan_tk_tahun_masuk: data.pendidikan_tk_tahun_masuk || "",
          pendidikan_tk_tahun_lulus: data.pendidikan_tk_tahun_lulus || "",

          pendidikan_sd_nama: data.pendidikan_sd_nama || "",
          pendidikan_sd_tahun_masuk: data.pendidikan_sd_tahun_masuk || "",
          pendidikan_sd_tahun_lulus: data.pendidikan_sd_tahun_lulus || "",

          pendidikan_smp_nama: data.pendidikan_smp_nama || "",
          pendidikan_smp_tahun_masuk: data.pendidikan_smp_tahun_masuk || "",
          pendidikan_smp_tahun_lulus: data.pendidikan_smp_tahun_lulus || "",

          pendidikan_sma_nama: data.pendidikan_sma_nama || "",
          pendidikan_sma_tahun_masuk: data.pendidikan_sma_tahun_masuk || "",
          pendidikan_sma_tahun_lulus: data.pendidikan_sma_tahun_lulus || "",

          pt_jenjang: data.pt_jenjang || "",
          pt_universitas: data.pt_universitas || "",
          pt_fakultas: data.pt_fakultas || "",
          pt_jurusan: data.pt_jurusan || "",
          pt_prodi: data.pt_prodi || "",
          pt_tahun_masuk: data.pt_tahun_masuk || "",
          pt_tahun_lulus: data.pt_tahun_lulus || "",
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
        no_kk: formData.no_kk.trim() || null,
        email: formData.email.trim() || null,
        nama_pasangan: formData.nama_pasangan.trim() || null,
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

        pendidikan_tk_nama: formData.pendidikan_tk_nama.trim() || null,
        pendidikan_tk_tahun_masuk: formData.pendidikan_tk_tahun_masuk.trim() || null,
        pendidikan_tk_tahun_lulus: formData.pendidikan_tk_tahun_lulus.trim() || null,

        pendidikan_sd_nama: formData.pendidikan_sd_nama.trim() || null,
        pendidikan_sd_tahun_masuk: formData.pendidikan_sd_tahun_masuk.trim() || null,
        pendidikan_sd_tahun_lulus: formData.pendidikan_sd_tahun_lulus.trim() || null,

        pendidikan_smp_nama: formData.pendidikan_smp_nama.trim() || null,
        pendidikan_smp_tahun_masuk: formData.pendidikan_smp_tahun_masuk.trim() || null,
        pendidikan_smp_tahun_lulus: formData.pendidikan_smp_tahun_lulus.trim() || null,

        pendidikan_sma_nama: formData.pendidikan_sma_nama.trim() || null,
        pendidikan_sma_tahun_masuk: formData.pendidikan_sma_tahun_masuk.trim() || null,
        pendidikan_sma_tahun_lulus: formData.pendidikan_sma_tahun_lulus.trim() || null,

        pt_jenjang: formData.pt_jenjang.trim() || null,
        pt_universitas: formData.pt_universitas.trim() || null,
        pt_fakultas: formData.pt_fakultas.trim() || null,
        pt_jurusan: formData.pt_jurusan.trim() || null,
        pt_prodi: formData.pt_prodi.trim() || null,
        pt_tahun_masuk: formData.pt_tahun_masuk.trim() || null,
        pt_tahun_lulus: formData.pt_tahun_lulus.trim() || null,
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
        <StatusBar barStyle="light-content" backgroundColor="#162E6E" />
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
              {/* ─── SEKSI 1: BIODATA & IDENTITAS ─── */}
              <View style={styles.sectionHeaderBox}>
                <View style={[styles.sectionIconBadge, { backgroundColor: "#DBEAFE" }]}>
                  <User size={16} color="#1D4ED8" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.sectionHeaderTitle}>1. Biodata & Identitas</Text>
                  <Text style={styles.sectionHeaderSub}>Informasi data pribadi dan kontak resmi</Text>
                </View>
              </View>

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

                  <Input
                    label="Email Pegawai"
                    placeholder="Contoh: nama@domain.com"
                    value={formData.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={(t) => setFormData({ ...formData, email: t })}
                    leftIcon={<Mail size={18} color={Colors.textMuted} />}
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
                        label="No. Kartu Keluarga"
                        placeholder="16 digit No. KK"
                        value={formData.no_kk}
                        keyboardType="number-pad"
                        onChangeText={(t) => setFormData({ ...formData, no_kk: t })}
                      />
                    </View>
                  </View>

                  <Input
                    label="NIP (Opsional)"
                    placeholder="Nomor NIP pegawai"
                    value={formData.nip}
                    onChangeText={(t) => setFormData({ ...formData, nip: t })}
                  />

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
                    placeholder="Alamat domisili saat ini"
                    value={formData.alamat}
                    multiline
                    numberOfLines={3}
                    onChangeText={(t) => setFormData({ ...formData, alamat: t })}
                    leftIcon={<MapPin size={18} color={Colors.textMuted} />}
                  />

              {/* ─── SEKSI 2: DATA KELUARGA ─── */}
              <View style={[styles.sectionHeaderBox, { marginTop: 18 }]}>
                <View style={[styles.sectionIconBadge, { backgroundColor: "#E0E7FF" }]}>
                  <Users size={16} color="#4338CA" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.sectionHeaderTitle}>2. Data Keluarga</Text>
                  <Text style={styles.sectionHeaderSub}>Informasi pasangan, orang tua, dan susunan keluarga</Text>
                </View>
              </View>
                  <View style={styles.pasanganBox}>
                    <Text style={styles.pasanganBoxTitle}>Nama Pasangan (Istri / Suami)</Text>
                    <Text style={styles.pasanganBoxDesc}>
                      Isi nama lengkap istri atau suami jika sudah berkeluarga.
                    </Text>
                    <Input
                      placeholder="Masukkan nama lengkap pasangan"
                      value={formData.nama_pasangan}
                      onChangeText={(t) => setFormData({ ...formData, nama_pasangan: t })}
                      leftIcon={<Heart size={18} color="#2563EB" />}
                    />
                  </View>

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

              {/* ─── SEKSI 3: RIWAYAT PENDIDIKAN ─── */}
              <View style={[styles.sectionHeaderBox, { marginTop: 18 }]}>
                <View style={[styles.sectionIconBadge, { backgroundColor: "#D1FAE5" }]}>
                  <GraduationCap size={16} color="#059669" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.sectionHeaderTitle}>3. Riwayat Pendidikan</Text>
                  <Text style={styles.sectionHeaderSub}>Pendidikan formal dasar hingga perguruan tinggi</Text>
                </View>
              </View>

                  <Text style={styles.sectionTitle}>Pendidikan Dasar & Menengah</Text>

                  {/* TK / RA */}
                  <View style={styles.eduCardBox}>
                    <Text style={styles.eduCardTitle}>TK / RA</Text>
                    <Input
                      placeholder="Nama TK / RA"
                      value={formData.pendidikan_tk_nama}
                      onChangeText={(t) => setFormData({ ...formData, pendidikan_tk_nama: t })}
                    />
                    <View style={styles.twoCol}>
                      <View style={{ flex: 1, marginRight: 6 }}>
                        <Input
                          placeholder="Tahun Masuk"
                          value={formData.pendidikan_tk_tahun_masuk}
                          keyboardType="number-pad"
                          onChangeText={(t) => setFormData({ ...formData, pendidikan_tk_tahun_masuk: t })}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 6 }}>
                        <Input
                          placeholder="Tahun Lulus"
                          value={formData.pendidikan_tk_tahun_lulus}
                          keyboardType="number-pad"
                          onChangeText={(t) => setFormData({ ...formData, pendidikan_tk_tahun_lulus: t })}
                        />
                      </View>
                    </View>
                  </View>

                  {/* SD / MI */}
                  <View style={styles.eduCardBox}>
                    <Text style={styles.eduCardTitle}>SD / MI</Text>
                    <Input
                      placeholder="Nama SD / MI"
                      value={formData.pendidikan_sd_nama}
                      onChangeText={(t) => setFormData({ ...formData, pendidikan_sd_nama: t })}
                    />
                    <View style={styles.twoCol}>
                      <View style={{ flex: 1, marginRight: 6 }}>
                        <Input
                          placeholder="Tahun Masuk"
                          value={formData.pendidikan_sd_tahun_masuk}
                          keyboardType="number-pad"
                          onChangeText={(t) => setFormData({ ...formData, pendidikan_sd_tahun_masuk: t })}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 6 }}>
                        <Input
                          placeholder="Tahun Lulus"
                          value={formData.pendidikan_sd_tahun_lulus}
                          keyboardType="number-pad"
                          onChangeText={(t) => setFormData({ ...formData, pendidikan_sd_tahun_lulus: t })}
                        />
                      </View>
                    </View>
                  </View>

                  {/* SMP / MTs */}
                  <View style={styles.eduCardBox}>
                    <Text style={styles.eduCardTitle}>SMP / MTs</Text>
                    <Input
                      placeholder="Nama SMP / MTs"
                      value={formData.pendidikan_smp_nama}
                      onChangeText={(t) => setFormData({ ...formData, pendidikan_smp_nama: t })}
                    />
                    <View style={styles.twoCol}>
                      <View style={{ flex: 1, marginRight: 6 }}>
                        <Input
                          placeholder="Tahun Masuk"
                          value={formData.pendidikan_smp_tahun_masuk}
                          keyboardType="number-pad"
                          onChangeText={(t) => setFormData({ ...formData, pendidikan_smp_tahun_masuk: t })}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 6 }}>
                        <Input
                          placeholder="Tahun Lulus"
                          value={formData.pendidikan_smp_tahun_lulus}
                          keyboardType="number-pad"
                          onChangeText={(t) => setFormData({ ...formData, pendidikan_smp_tahun_lulus: t })}
                        />
                      </View>
                    </View>
                  </View>

                  {/* SMA / MA / SMK */}
                  <View style={styles.eduCardBox}>
                    <Text style={styles.eduCardTitle}>SMA / MA / SMK</Text>
                    <Input
                      placeholder="Nama SMA / MA / SMK"
                      value={formData.pendidikan_sma_nama}
                      onChangeText={(t) => setFormData({ ...formData, pendidikan_sma_nama: t })}
                    />
                    <View style={styles.twoCol}>
                      <View style={{ flex: 1, marginRight: 6 }}>
                        <Input
                          placeholder="Tahun Masuk"
                          value={formData.pendidikan_sma_tahun_masuk}
                          keyboardType="number-pad"
                          onChangeText={(t) => setFormData({ ...formData, pendidikan_sma_tahun_masuk: t })}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 6 }}>
                        <Input
                          placeholder="Tahun Lulus"
                          value={formData.pendidikan_sma_tahun_lulus}
                          keyboardType="number-pad"
                          onChangeText={(t) => setFormData({ ...formData, pendidikan_sma_tahun_lulus: t })}
                        />
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Perguruan Tinggi</Text>

                  <View style={styles.eduCardBox}>
                    <Text style={styles.fieldLabel}>Jenjang Pendidikan</Text>
                    <View style={styles.jenjangRow}>
                      {["S1", "S2", "S3", "D3", "D4"].map((jj) => {
                        const isSelected = formData.pt_jenjang === jj;
                        return (
                          <TouchableOpacity
                            key={jj}
                            style={[styles.jenjangButton, isSelected && styles.jenjangButtonActive]}
                            onPress={() =>
                              setFormData({
                                ...formData,
                                pt_jenjang: isSelected ? "" : jj,
                              })
                            }
                          >
                            <Text style={[styles.jenjangText, isSelected && styles.jenjangTextActive]}>
                              {jj}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Input
                      label="Nama Universitas / Institut"
                      placeholder="Contoh: Universitas Indonesia"
                      value={formData.pt_universitas}
                      onChangeText={(t) => setFormData({ ...formData, pt_universitas: t })}
                    />

                    <View style={styles.twoCol}>
                      <View style={{ flex: 1, marginRight: 6 }}>
                        <Input
                          label="Fakultas"
                          placeholder="Contoh: Tarbiyah"
                          value={formData.pt_fakultas}
                          onChangeText={(t) => setFormData({ ...formData, pt_fakultas: t })}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 6 }}>
                        <Input
                          label="Jurusan"
                          placeholder="Contoh: PAI"
                          value={formData.pt_jurusan}
                          onChangeText={(t) => setFormData({ ...formData, pt_jurusan: t })}
                        />
                      </View>
                    </View>

                    <Input
                      label="Program Studi"
                      placeholder="Contoh: Pendidikan Agama Islam"
                      value={formData.pt_prodi}
                      onChangeText={(t) => setFormData({ ...formData, pt_prodi: t })}
                    />

                    <View style={styles.twoCol}>
                      <View style={{ flex: 1, marginRight: 6 }}>
                        <Input
                          label="Tahun Masuk"
                          placeholder="YYYY"
                          value={formData.pt_tahun_masuk}
                          keyboardType="number-pad"
                          onChangeText={(t) => setFormData({ ...formData, pt_tahun_masuk: t })}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 6 }}>
                        <Input
                          label="Tahun Lulus"
                          placeholder="YYYY"
                          value={formData.pt_tahun_lulus}
                          keyboardType="number-pad"
                          onChangeText={(t) => setFormData({ ...formData, pt_tahun_lulus: t })}
                        />
                      </View>
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
  sectionHeaderBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 3,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#162E6E",
    fontWeight: "700",
  },
  pasanganBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  pasanganBoxTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 2,
  },
  pasanganBoxDesc: {
    fontSize: 11,
    color: "#3B82F6",
    marginBottom: 8,
  },
  eduCardBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  eduCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#162E6E",
    marginBottom: 6,
  },
  jenjangRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  jenjangButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  jenjangButtonActive: {
    borderColor: "#162E6E",
    backgroundColor: "#EFF6FF",
  },
  jenjangText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  jenjangTextActive: {
    color: "#162E6E",
    fontWeight: "700",
  },
});
