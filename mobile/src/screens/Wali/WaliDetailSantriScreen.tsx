// mobile/src/screens/Wali/WaliDetailSantriScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from "react-native";
import {
  ChevronLeft,
  User,
  School,
  Home,
  Users,
  Phone,
  HeartPulse,
  Award,
  Calendar,
  MapPin,
  ShieldCheck,
} from "lucide-react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { guidanceService } from "../../api/guidanceService";

export const WaliDetailSantriScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { siswaId } = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [siswa, setSiswa] = useState<any>(null);

  const fetchDetail = useCallback(async () => {
    if (!siswaId) return;
    try {
      setIsLoading(true);
      const data = await guidanceService.getSiswaDetail(siswaId);
      setSiswa(data);
    } catch (err: any) {
      console.warn("Error fetching detail santri:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [siswaId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetail();
  };

  const g = siswa?.guidance_detail || {};
  const k = siswa?.kelas || {};
  const wali = siswa?.wali_murid || {};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#162E6E" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ChevronLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Detail Data Santri</Text>
          <Text style={styles.headerSubtitle}>Profil Lengkap & Biodata Resmi Santri</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#162E6E" />
          <Text style={styles.loadingText}>Memuat biodata lengkap ananda...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Hero Profile Card with Big Photo */}
          <View style={styles.heroCard}>
            <View style={styles.photoWrapper}>
              {siswa?.foto ? (
                <Image source={{ uri: siswa.foto }} style={styles.photoImg} resizeMode="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoInitial}>{siswa?.nama?.charAt(0) || "S"}</Text>
                </View>
              )}
              <View style={styles.activeStatusBadge}>
                <ShieldCheck size={12} color="#FFFFFF" />
                <Text style={styles.activeStatusText}>Santri Aktif</Text>
              </View>
            </View>

            <Text style={styles.heroNama}>{siswa?.nama}</Text>
            <Text style={styles.heroNisn}>
              NISN: <Text style={{ fontWeight: "800", color: "#162E6E" }}>{siswa?.nisn || "-"}</Text> • NIS: <Text style={{ fontWeight: "800", color: "#162E6E" }}>{siswa?.nis || "-"}</Text>
            </Text>

            {/* Badges Lembaga & Kelas */}
            <View style={styles.badgesRow}>
              <View style={[styles.pillBadge, { backgroundColor: "#EFF6FF" }]}>
                <School size={12} color="#1D4ED8" />
                <Text style={[styles.pillBadgeText, { color: "#1D4ED8" }]}>
                  {k.lembaga?.nama_lembaga || "Pesantren"}
                </Text>
              </View>
              <View style={[styles.pillBadge, { backgroundColor: "#F0FDF4" }]}>
                <Award size={12} color="#15803D" />
                <Text style={[styles.pillBadgeText, { color: "#15803D" }]}>
                  Kelas: {k.nama_kelas || "-"}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 1: Identitas Pribadi */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <User size={16} color="#162E6E" />
              </View>
              <Text style={styles.sectionTitle}>A. Identitas Pribadi Santri</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Lengkap</Text>
              <Text style={styles.infoValue}>{siswa?.nama || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>NISN</Text>
              <Text style={styles.infoValue}>{siswa?.nisn || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>NIS</Text>
              <Text style={styles.infoValue}>{siswa?.nis || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>NIK Santri</Text>
              <Text style={styles.infoValue}>{siswa?.nik || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tempat, Tgl Lahir</Text>
              <Text style={styles.infoValue}>
                {siswa?.tempat_lahir || "-"}, {siswa?.tanggal_lahir || "-"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Jenis Kelamin</Text>
              <Text style={styles.infoValue}>
                {siswa?.jenis_kelamin === "L" || siswa?.jenis_kelamin === "Laki-laki" ? "Laki-laki" : "Perempuan"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Agama</Text>
              <Text style={styles.infoValue}>{siswa?.agama || "Islam"}</Text>
            </View>
          </View>

          {/* Section 2: Kelembagaan & Asrama */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: "#ECFDF5" }]}>
                <Home size={16} color="#059669" />
              </View>
              <Text style={styles.sectionTitle}>B. Akademik & Asrama Santri</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lembaga Pendidikan</Text>
              <Text style={styles.infoValue}>{k.lembaga?.nama_lembaga || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kelas Terdaftar</Text>
              <Text style={styles.infoValue}>{k.nama_kelas || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Wali Kelas</Text>
              <Text style={styles.infoValue}>{k.wali_kelas?.nama || "Guru Wali Kelas"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Asrama / Kobong</Text>
              <Text style={styles.infoValue}>{siswa?.asrama || "Asrama Putra / Putri Maskumambang"}</Text>
            </View>
          </View>

          {/* Section 3: Data Orang Tua / Wali */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: "#FAF5FF" }]}>
                <Users size={16} color="#7E22CE" />
              </View>
              <Text style={styles.sectionTitle}>C. Data Orang Tua / Wali Santri</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Ayah</Text>
              <Text style={styles.infoValue}>{siswa?.nama_ayah || wali?.nama_ayah || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Ibu</Text>
              <Text style={styles.infoValue}>{siswa?.nama_ibu || wali?.nama_ibu || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Wali</Text>
              <Text style={styles.infoValue}>{wali?.nama || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nomor HP / WA</Text>
              <Text style={styles.infoValue}>{wali?.no_hp || siswa?.no_hp_ortu || "-"}</Text>
            </View>
            <View style={styles.alamatBox}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                <MapPin size={12} color="#64748B" />
                <Text style={styles.alamatLabel}>Alamat Domisili:</Text>
              </View>
              <Text style={styles.alamatValue}>
                {siswa?.alamat || wali?.alamat || "Alamat belum tercatat di sistem."}
              </Text>
            </View>
          </View>

          {/* Section 4: Kontak Darurat & Kesehatan */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: "#FEF2F2" }]}>
                <HeartPulse size={16} color="#DC2626" />
              </View>
              <Text style={styles.sectionTitle}>D. Kontak Darurat & Penanganan Medis</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Asuransi Kesehatan</Text>
              <Text style={styles.infoValue}>{g.asuransi_kesehatan || "BPJS Kesehatan"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Riwayat Alergi / Penyakit</Text>
              <Text style={styles.infoValue}>{g.riwayat_alergi || g.riwayat_penyakit || "Tidak ada"}</Text>
            </View>
            <View style={styles.daruratBox}>
              <Text style={styles.daruratTitle}>Kontak Darurat Asrama:</Text>
              <Text style={styles.daruratContent}>
                {g.kontak_darurat_nama ? `${g.kontak_darurat_nama} (${g.kontak_darurat_hubungan || "Keluarga"}) - ${g.kontak_darurat_hp || "-"}` : "Orang Tua / Wali Murid"}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#162E6E",
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#CBD5E1",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 10,
  },
  body: {
    flex: 1,
    padding: 16,
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  photoWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  photoImg: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#162E6E",
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: "#162E6E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#EFF6FF",
  },
  photoInitial: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  activeStatusBadge: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  activeStatusText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  heroNama: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  heroNisn: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  pillBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 10,
    marginBottom: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  infoLabel: {
    fontSize: 11.5,
    color: "#64748B",
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
    maxWidth: "58%",
    textAlign: "right",
  },
  alamatBox: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  alamatLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#64748B",
  },
  alamatValue: {
    fontSize: 11.5,
    color: "#334155",
    lineHeight: 16,
  },
  daruratBox: {
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  daruratTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#991B1B",
    marginBottom: 2,
  },
  daruratContent: {
    fontSize: 11.5,
    color: "#7F1D1D",
  },
});
