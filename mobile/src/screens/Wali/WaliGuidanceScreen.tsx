// mobile/src/screens/Wali/WaliGuidanceScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from "react-native";
import {
  ChevronLeft,
  Sparkles,
  MessageSquare,
  Compass,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  HeartPulse,
  Calendar,
  User,
} from "lucide-react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { guidanceService, KonselingSesi } from "../../api/guidanceService";

export const WaliGuidanceScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { siswaId } = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [siswaDetail, setSiswaDetail] = useState<any>(null);

  const fetchDetail = useCallback(async () => {
    if (!siswaId) return;
    try {
      setIsLoading(true);
      const data = await guidanceService.getSiswaDetail(siswaId);
      setSiswaDetail(data);
    } catch (err: any) {
      console.warn("Error fetching wali guidance detail:", err);
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

  const fundamentalItems = [
    { key: "skor_wudhu", label: "1. Wudhu", desc: "Ketepatan rukun & sunnah wudhu" },
    { key: "skor_doa_sholat", label: "2. Do'a Sholat", desc: "Hafalan bacaan iftitah, ruku, sujud & tasyahud" },
    { key: "skor_praktik_sholat", label: "3. Praktik Sholat", desc: "Thuma'ninah & kekhusyukan sholat" },
    { key: "skor_jamaah_masjid", label: "4. Sholat Jama'ah", desc: "Kehadiran sholat fardhu di masjid" },
    { key: "skor_alquran", label: "5. Al-Qur'an & Tilawah", desc: "Kelancaran tajwid & makhraj" },
    { key: "skor_hafalan_juz30", label: "6. Hafalan Juz 30", desc: "Kelancaran muroja'ah hafalan juz 30" },
    { key: "skor_disiplin", label: "7. Disiplin Waktu", desc: "Kepatuhan jadwal bangun, KBM & istirahat" },
    { key: "skor_rapi", label: "8. Kerapihan Diri", desc: "Kebersihan pakaian, ranjang & asrama" },
    { key: "skor_adab", label: "9. Adab & Akhlak", desc: "Sopan santun kepada guru & sesama santri" },
  ];

  const skorConfig: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: "1: Belum Bisa", color: "#DC2626", bg: "#FEF2F2" },
    2: { label: "2: Bisa", color: "#D97706", bg: "#FFFBEB" },
    3: { label: "3: Butuh Kontrol", color: "#2563EB", bg: "#EFF6FF" },
    4: { label: "4: Mandiri & Istiqomah", color: "#16A34A", bg: "#F0FDF4" },
  };

  const g = siswaDetail?.guidance_detail || {};
  const konselingList: KonselingSesi[] = (siswaDetail?.konseling_sesi || []).filter(
    (k: any) => k.sifat_rahasia !== "Sangat Rahasia"
  );

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
          <Text style={styles.headerTitle}>Bimbingan & Karakter Santri</Text>
          <Text style={styles.headerSubtitle}>
            {siswaDetail?.nama || "Santri"} • Kelas {siswaDetail?.kelas?.nama_kelas || "-"}
          </Text>
        </View>
        <View style={styles.headerIconBox}>
          <Compass size={22} color="#FFFFFF" />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#162E6E" />
          <Text style={styles.loadingText}>Memuat catatan bimbingan ananda...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{siswaDetail?.nama?.charAt(0) || "S"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{siswaDetail?.nama}</Text>
              <Text style={styles.heroMeta}>
                NISN: {siswaDetail?.nisn || "-"} • NIS: {siswaDetail?.nis}
              </Text>
              <Text style={styles.heroLembaga}>{siswaDetail?.kelas?.lembaga?.nama_lembaga || "Pesantren Maskumambang"}</Text>
            </View>
          </View>

          {/* 1. Pemetaan 9 Aspek Fundamental */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Sparkles size={16} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Evaluasi 9 Aspek Pembiasaan Santri</Text>
                <Text style={styles.sectionSubtitle}>Penilaian bimbingan dari Murobbi / Wali Kelas</Text>
              </View>
            </View>

            <View style={styles.fundamentalList}>
              {fundamentalItems.map((item) => {
                const score = g[item.key] || 1;
                const conf = skorConfig[score] || skorConfig[1];
                return (
                  <View key={item.key} style={styles.fundamentalRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fundamentalLabel}>{item.label}</Text>
                      <Text style={styles.fundamentalDesc}>{item.desc}</Text>
                    </View>
                    <View style={[styles.scoreBadge, { backgroundColor: conf.bg }]}>
                      <Text style={[styles.scoreText, { color: conf.color }]}>{conf.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {g.catatan_fundamental && (
              <View style={styles.catatanBox}>
                <Text style={styles.catatanTitle}>Catatan Murobbi / Wali Kelas:</Text>
                <Text style={styles.catatanContent}>{g.catatan_fundamental}</Text>
              </View>
            )}
          </View>

          {/* 2. Rencana Pendidikan Lanjutan & Karier */}
          {(g.lanjut_kuliah === "Ya" || g.target_pendidikan || g.universitas_tujuan) && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconCircle, { backgroundColor: "#ECFDF5" }]}>
                  <GraduationCap size={16} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Rencana Pendidikan Lanjutan</Text>
                  <Text style={styles.sectionSubtitle}>Target studi perguruan tinggi & karier ananda</Text>
                </View>
              </View>

              <View style={styles.kuliahGrid}>
                <View style={styles.kuliahItem}>
                  <Text style={styles.kuliahLabel}>Target Jenjang</Text>
                  <Text style={styles.kuliahValue}>{g.target_pendidikan || "S1 (Sarjana)"}</Text>
                </View>
                <View style={styles.kuliahItem}>
                  <Text style={styles.kuliahLabel}>Program Studi</Text>
                  <Text style={styles.kuliahValue}>{g.prodi_pilihan || "-"}</Text>
                </View>
                <View style={styles.kuliahItem}>
                  <Text style={styles.kuliahLabel}>Universitas Tujuan</Text>
                  <Text style={styles.kuliahValue}>{g.universitas_tujuan || "-"}</Text>
                </View>
                <View style={styles.kuliahItem}>
                  <Text style={styles.kuliahLabel}>Jalur Masuk</Text>
                  <Text style={styles.kuliahValue}>{g.jalur_masuk || "-"}</Text>
                </View>
              </View>
            </View>
          )}

          {/* 3. Riwayat Konseling & Pendampingan */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: "#EFF6FF" }]}>
                <MessageSquare size={16} color="#1D4ED8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Riwayat Bimbingan & Konseling</Text>
                <Text style={styles.sectionSubtitle}>Catatan dialog dan pendampingan santri</Text>
              </View>
            </View>

            {konselingList.length === 0 ? (
              <View style={styles.emptyKonseling}>
                <Text style={styles.emptyKonselingText}>
                  Alhamdulillah, saat ini belum ada catatan kasus atau keluhan khusus untuk ananda.
                </Text>
              </View>
            ) : (
              konselingList.map((sesi) => (
                <View key={sesi.konseling_id} style={styles.konselingCard}>
                  <View style={styles.konselingCardTop}>
                    <View style={styles.kategoriBadge}>
                      <Text style={styles.kategoriText}>{sesi.kategori}</Text>
                    </View>
                    <View style={styles.dateRow}>
                      <Calendar size={12} color="#94A3B8" />
                      <Text style={styles.dateText}>{sesi.tanggal_sesi}</Text>
                    </View>
                  </View>

                  <Text style={styles.konselingTopik}>{sesi.topik_konseling}</Text>

                  {sesi.solusi_kesepakatan && (
                    <View style={styles.solusiBox}>
                      <Text style={styles.solusiLabel}>Rencana Aksi & Solusi:</Text>
                      <Text style={styles.solusiText}>{sesi.solusi_kesepakatan}</Text>
                    </View>
                  )}

                  {sesi.catatan_tindak_lanjut && (
                    <View style={styles.followUpBox}>
                      <Text style={styles.followUpLabel}>Perkembangan Tindak Lanjut:</Text>
                      <Text style={styles.followUpText}>{sesi.catatan_tindak_lanjut}</Text>
                    </View>
                  )}

                  <View style={styles.konselingFooter}>
                    <Text style={styles.statusLabel}>Status Pendampingan:</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            sesi.status_follow_up === "Selesai"
                              ? "#DCFCE7"
                              : sesi.status_follow_up === "Dirujuk ke Pihak Luar"
                              ? "#F3E8FF"
                              : "#DBEAFE",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              sesi.status_follow_up === "Selesai"
                                ? "#15803D"
                                : sesi.status_follow_up === "Dirujuk ke Pihak Luar"
                                ? "#7E22CE"
                                : "#1D4ED8",
                          },
                        ]}
                      >
                        {sesi.status_follow_up}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
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
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#CBD5E1",
    marginTop: 2,
  },
  headerIconBox: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#162E6E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  heroName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  heroMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  heroLembaga: {
    fontSize: 10.5,
    color: "#94A3B8",
    marginTop: 1,
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
    marginBottom: 12,
  },
  sectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 1,
  },
  fundamentalList: {
    gap: 8,
  },
  fundamentalRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
  },
  fundamentalLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  fundamentalDesc: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: "800",
  },
  catatanBox: {
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  catatanTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 2,
  },
  catatanContent: {
    fontSize: 11.5,
    color: "#1E3A8A",
    lineHeight: 16,
  },
  kuliahGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  kuliahItem: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
  },
  kuliahLabel: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 2,
  },
  kuliahValue: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyKonseling: {
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    alignItems: "center",
  },
  emptyKonselingText: {
    fontSize: 11.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 16,
  },
  konselingCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    gap: 6,
  },
  konselingCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kategoriBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
  },
  kategoriText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 10,
    color: "#94A3B8",
  },
  konselingTopik: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  solusiBox: {
    backgroundColor: "#F0FDF4",
    padding: 8,
    borderRadius: 8,
  },
  solusiLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#15803D",
    marginBottom: 1,
  },
  solusiText: {
    fontSize: 11,
    color: "#166534",
  },
  followUpBox: {
    backgroundColor: "#FAF5FF",
    padding: 8,
    borderRadius: 8,
  },
  followUpLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#7E22CE",
    marginBottom: 1,
  },
  followUpText: {
    fontSize: 11,
    color: "#581C87",
  },
  konselingFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F6",
  },
  statusLabel: {
    fontSize: 10,
    color: "#64748B",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
