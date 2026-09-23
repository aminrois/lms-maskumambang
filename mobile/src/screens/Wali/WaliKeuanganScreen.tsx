// mobile/src/screens/Wali/WaliKeuanganScreen.tsx
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
  Wallet,
  CreditCard,
  QrCode,
  Receipt,
  Sparkles,
  User,
  ShieldCheck,
  Building,
} from "lucide-react-native";
import { waliService } from "../../api/waliService";
import { SwipeBackContainer } from "../../components/ui/SwipeBackContainer";

export const WaliKeuanganScreen = () => {
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
              <Text style={styles.headerTitle}>Keuangan & Tagihan</Text>
              <Text style={styles.headerSubtitle}>
                Layanan Pembayaran Digital Santri
              </Text>
            </View>

            <View style={styles.headerRightBadge}>
              <Wallet size={18} color="#C7D2FE" />
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
        {/* Info Santri Bar */}
        <View style={styles.santriInfoBar}>
          <View style={styles.santriAvatar}>
            <Text style={styles.santriAvatarText}>{activeAnak?.nama?.charAt(0) || "S"}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.santriName}>{activeAnak?.nama || "Santri"}</Text>
            <Text style={styles.santriMeta}>
              Kelas {activeAnak?.kelas?.nama_kelas || "-"} • NIS: {activeAnak?.nis || "-"}
            </Text>
          </View>
          <View style={styles.soonPill}>
            <Text style={styles.soonPillText}>SOON</Text>
          </View>
        </View>

        {/* Hero Card Coming Soon */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <CreditCard size={36} color="#4F46E5" />
          </View>
          <Text style={styles.heroTitle}>Sistem Pembayaran Online Terpadu</Text>
          <Text style={styles.heroDesc}>
            Layanan keuangan santri Pesantren Maskumambang sedang dalam tahap integrasi payment gateway perbankan nasional.
          </Text>
          <View style={styles.heroBadge}>
            <Sparkles size={14} color="#4F46E5" />
            <Text style={styles.heroBadgeText}>Segera Hadir di Aplikasi</Text>
          </View>
        </View>

        {/* Feature List Preview */}
        <Text style={styles.sectionTitle}>Fitur Keuangan yang Akan Datang</Text>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconBox, { backgroundColor: "#EFF6FF" }]}>
            <CreditCard size={20} color="#2563EB" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.featureTitle}>Pembayaran SPP & Tagihan Bulanan</Text>
            <Text style={styles.featureSub}>
              Bayar SPP santri secara instan menggunakan Virtual Account (BSI, Mandiri, BRI, BCA) dan QRIS 24/7.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconBox, { backgroundColor: "#F0FDF4" }]}>
            <QrCode size={20} color="#16A34A" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.featureTitle}>E-Wallet & Uang Saku Santri</Text>
            <Text style={styles.featureSub}>
              Isi ulang uang saku santri untuk transaksi nontunai (cashless) di kantin dan koperasi pesantren.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconBox, { backgroundColor: "#FAF5FF" }]}>
            <Receipt size={20} color="#7E22CE" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.featureTitle}>Riwayat & Kuitansi Pembayaran Resmi</Text>
            <Text style={styles.featureSub}>
              Akses riwayat tagihan yang telah lunas dan unduh bukti transaksi resmi PDF langsung dari aplikasi.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconBox, { backgroundColor: "#FEF3C7" }]}>
            <ShieldCheck size={20} color="#D97706" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.featureTitle}>Infaq & Donasi Pengembangan</Text>
            <Text style={styles.featureSub}>
              Salurkan infaq pembangunan sarana dan beasiswa santri dengan laporan transparan dan amanah.
            </Text>
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
  santriInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  santriAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#162E6E",
    alignItems: "center",
    justifyContent: "center",
  },
  santriAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  santriName: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  santriMeta: {
    color: "#64748B",
    fontSize: 11.5,
    marginTop: 2,
  },
  soonPill: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  soonPillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  heroCard: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  heroIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  heroTitle: {
    color: "#1E1B4B",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  heroDesc: {
    color: "#4338CA",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  heroBadgeText: {
    color: "#4F46E5",
    fontSize: 11.5,
    fontWeight: "800",
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  featureSub: {
    color: "#64748B",
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 3,
  },
});
