// mobile/src/screens/Wali/WaliLmsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  GraduationCap,
  BookOpen,
  User,
  Building,
  School,
  IdCard,
  ShieldCheck,
  Award,
} from "lucide-react-native";
import { waliService } from "../../api/waliService";
import { SwipeBackContainer } from "../../components/ui/SwipeBackContainer";

export const WaliLmsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialSiswaId = route.params?.siswaId || null;

  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(initialSiswaId);
  const [refreshing, setRefreshing] = useState(false);

  // Query Daftar Anak
  const { data: daftarAnak = [], refetch: refetchAnak } = useQuery({
    queryKey: ["wali-daftar-anak"],
    queryFn: () => waliService.getDaftarAnak(),
    staleTime: 5 * 60 * 1000,
  });

  const activeSiswaId = selectedSiswaId || (daftarAnak.length > 0 ? daftarAnak[0].siswa_id : null);

  const activeAnak = useMemo(
    () => daftarAnak.find((a) => a.siswa_id === activeSiswaId) || daftarAnak[0],
    [daftarAnak, activeSiswaId]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchAnak();
    setRefreshing(false);
  };

  return (
    <SwipeBackContainer style={styles.container}>
      {/* ═══════════════════════════════════════════════════════
          TOP HEADER
      ════════════════════════════════════════════════════════ */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.topNavRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle}>LMS & Akademik</Text>
              <Text style={styles.headerSubtitle}>
                Data Santri & Kurikulum Pesantren
              </Text>
            </View>

            <View style={styles.headerRightBadge}>
              <GraduationCap size={18} color="#6EE7B7" />
            </View>
          </View>

          {/* Santri Switcher Strip */}
          {daftarAnak.length > 1 && (
            <View style={styles.santriSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {daftarAnak.map((anak) => {
                  const isSelected = anak.siswa_id === activeSiswaId;
                  return (
                    <TouchableOpacity
                      key={anak.siswa_id}
                      style={[styles.santriChip, isSelected && styles.santriChipActive]}
                      onPress={() => setSelectedSiswaId(anak.siswa_id)}
                      activeOpacity={0.8}
                    >
                      <User size={13} color={isSelected ? "#FFFFFF" : "#CBD5E1"} />
                      <Text
                        style={[styles.santriChipText, isSelected && styles.santriChipTextActive]}
                      >
                        {anak.nama}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </View>

      {/* ═══════════════════════════════════════════════════════
          CONTENT BODY
      ════════════════════════════════════════════════════════ */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#162E6E"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Info */}
        <View style={styles.bannerBox}>
          <View style={styles.bannerIconCircle}>
            <GraduationCap size={24} color="#059669" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.bannerTitle}>Learning Management System</Text>
            <Text style={styles.bannerSub}>
              Sistem KBM dan kurikulum terpadu Pondok Pesantren Maskumambang Dukun Gresik.
            </Text>
          </View>
        </View>

        {/* Section 1: Profil Identitas Santri */}
        <Text style={styles.sectionTitle}>Identitas Akademik Santri</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Nama Lengkap</Text>
            <Text style={styles.cardVal}>{activeAnak?.nama || "-"}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>NIS (Nomor Induk Siswa)</Text>
            <Text style={styles.cardVal}>{activeAnak?.nis || "-"}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>NISN</Text>
            <Text style={styles.cardVal}>{activeAnak?.nisn || "-"}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Lembaga Pendidikan</Text>
            <Text style={styles.cardVal}>
              {activeAnak?.kelas?.lembaga?.nama_lembaga || "Pesantren Maskumambang"}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Kelas Saat Ini</Text>
            <Text style={[styles.cardVal, { color: "#2563EB" }]}>
              {activeAnak?.kelas?.nama_kelas || "-"}
            </Text>
          </View>
          <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.cardLabel}>Status Keaktifan</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{activeAnak?.status || "Aktif"}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Kurikulum & Pembelajaran */}
        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Kurikulum & Layanan KBM</Text>
        <View style={styles.card}>
          <View style={styles.kbmFeatureItem}>
            <View style={[styles.kbmIcon, { backgroundColor: "#EFF6FF" }]}>
              <BookOpen size={18} color="#2563EB" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.kbmTitle}>Kurikulum Kepesantrenan & Formal</Text>
              <Text style={styles.kbmSub}>
                Integrasi materi kitab turots salaf, tahfidz Al-Qur'an, dan kurikulum kementerian nasional.
              </Text>
            </View>
          </View>

          <View style={styles.kbmFeatureItem}>
            <View style={[styles.kbmIcon, { backgroundColor: "#F0FDF4" }]}>
              <Award size={18} color="#16A34A" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.kbmTitle}>Penilaian & Rapor Santri</Text>
              <Text style={styles.kbmSub}>
                Rekapitulasi tugas harian, ujian tengah semester, dan penilaian akhir berbasis digital.
              </Text>
            </View>
          </View>

          <View style={[styles.kbmFeatureItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.kbmIcon, { backgroundColor: "#FAF5FF" }]}>
              <ShieldCheck size={18} color="#7E22CE" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.kbmTitle}>Monitoring Terpadu Wali Santri</Text>
              <Text style={styles.kbmSub}>
                Wali murid dapat memantau kehadiran harian, perkembangan hafalan, dan materi belajar secara berkala.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SwipeBackContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#162E6E",
    paddingBottom: 16,
  },
  headerSafe: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 10 : 4,
  },
  topNavRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#93C5FD",
    fontSize: 11.5,
    fontWeight: "500",
    marginTop: 1,
  },
  headerRightBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  santriSelector: {
    marginTop: 14,
  },
  santriChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  santriChipActive: {
    backgroundColor: "#2563EB",
  },
  santriChipText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },
  santriChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  scrollContent: {
    padding: 16,
  },
  bannerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  bannerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    color: "#065F46",
    fontSize: 14,
    fontWeight: "800",
  },
  bannerSub: {
    color: "#047857",
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cardLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
  },
  cardVal: {
    color: "#0F172A",
    fontSize: 12.5,
    fontWeight: "700",
    maxWidth: "55%",
    textAlign: "right",
  },
  statusBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "800",
  },
  kbmFeatureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  kbmIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  kbmTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  kbmSub: {
    color: "#64748B",
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
});
