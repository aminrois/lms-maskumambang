// mobile/src/screens/Guidance/GuidanceHomeScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import {
  Compass,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit3,
  User,
  GraduationCap,
  Calendar,
  X,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { guidanceService, SiswaGuidanceItem, KonselingSesi } from "../../api/guidanceService";

export const GuidanceHomeScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<"siswa" | "konseling">("siswa");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [siswaList, setSiswaList] = useState<SiswaGuidanceItem[]>([]);
  const [konselingList, setKonselingList] = useState<KonselingSesi[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Modal Follow-up
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [activeFollowUpSesi, setActiveFollowUpSesi] = useState<KonselingSesi | null>(null);
  const [followUpStatus, setFollowUpStatus] = useState("Dalam Pemantauan");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [siswaData, konselingData] = await Promise.all([
        guidanceService.getSiswaList().catch(() => []),
        guidanceService.getKonselingList().catch(() => []),
      ]);
      setSiswaList(siswaData);
      setKonselingList(konselingData);
    } catch (err: any) {
      console.warn("Error fetching guidance data:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredSiswa = siswaList.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.nama.toLowerCase().includes(q) ||
      s.nis.toLowerCase().includes(q) ||
      s.kelas.toLowerCase().includes(q)
    );
  });

  const filteredKonseling = konselingList.filter((k) => {
    const matchesSearch =
      searchQuery === "" ||
      k.topik_konseling.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.keluhan_masalah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.siswa?.nama || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === "all" || k.status_follow_up === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const openFollowUp = (sesi: KonselingSesi) => {
    setActiveFollowUpSesi(sesi);
    setFollowUpStatus(sesi.status_follow_up || "Dalam Pemantauan");
    setFollowUpNotes(sesi.catatan_tindak_lanjut || "");
    setFollowUpModalVisible(true);
  };

  const submitFollowUp = async () => {
    if (!activeFollowUpSesi) return;
    try {
      setIsSubmittingFollowUp(true);
      await guidanceService.updateFollowUp(activeFollowUpSesi.konseling_id, {
        status_follow_up: followUpStatus,
        catatan_tindak_lanjut: followUpNotes,
      });
      setFollowUpModalVisible(false);
      Alert.alert("Berhasil", "Status follow-up sesi konsultasi berhasil diperbarui.");
      fetchData();
    } catch (err: any) {
      Alert.alert("Gagal", err.response?.data?.message || "Gagal memperbarui status follow-up.");
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Selesai":
        return (
          <View style={[styles.statusBadge, { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" }]}>
            <CheckCircle2 size={12} color="#15803D" />
            <Text style={[styles.statusBadgeText, { color: "#15803D" }]}>Selesai</Text>
          </View>
        );
      case "Dirujuk ke Pihak Luar":
      case "Perlu Rujukan Lanjut":
        return (
          <View style={[styles.statusBadge, { backgroundColor: "#F3E8FF", borderColor: "#D8B4FE" }]}>
            <ExternalLink size={12} color="#7E22CE" />
            <Text style={[styles.statusBadgeText, { color: "#7E22CE" }]}>Dirujuk ke Pihak Luar</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, { backgroundColor: "#DBEAFE", borderColor: "#93C5FD" }]}>
            <Clock size={12} color="#1D4ED8" />
            <Text style={[styles.statusBadgeText, { color: "#1D4ED8" }]}>Dalam Pemantauan</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#162E6E" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Bimbingan & Konseling</Text>
            <Text style={styles.headerSubtitle}>Profil 360° & Pemantauan Santri Binaan</Text>
          </View>
          <View style={styles.headerIconBox}>
            <Compass size={22} color="#FFFFFF" />
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "siswa" && styles.tabButtonActive]}
            onPress={() => setActiveTab("siswa")}
            activeOpacity={0.85}
          >
            <Sparkles size={16} color={activeTab === "siswa" ? "#162E6E" : "#94A3B8"} />
            <Text style={[styles.tabText, activeTab === "siswa" && styles.tabTextActive]}>
              Santri Binaan ({siswaList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "konseling" && styles.tabButtonActive]}
            onPress={() => setActiveTab("konseling")}
            activeOpacity={0.85}
          >
            <MessageSquare size={16} color={activeTab === "konseling" ? "#162E6E" : "#94A3B8"} />
            <Text style={[styles.tabText, activeTab === "konseling" && styles.tabTextActive]}>
              Sesi Konseling ({konselingList.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === "siswa"
                ? "Cari nama santri, NIS, atau kelas..."
                : "Cari topik atau keluhan masalah..."
            }
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {activeTab === "konseling" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScrollView}
            contentContainerStyle={styles.filterRow}
          >
            {[
              { id: "all", label: "Semua Status" },
              { id: "Dalam Pemantauan", label: "Dalam Pemantauan" },
              { id: "Selesai", label: "Selesai" },
              { id: "Dirujuk ke Pihak Luar", label: "Dirujuk ke Pihak Luar" },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterChip,
                  selectedStatusFilter === f.id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedStatusFilter(f.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatusFilter === f.id && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#162E6E" />
          <Text style={styles.loadingText}>Memuat data bimbingan santri...</Text>
        </View>
      ) : activeTab === "siswa" ? (
        <FlatList
          data={filteredSiswa}
          keyExtractor={(item) => item.siswa_id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <User size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Tidak ada santri binaan</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? "Hasil pencarian tidak ditemukan." : "Belum ada santri yang diampu."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.siswaCard}
              onPress={() =>
                navigation.navigate("GuidanceDetail", {
                  siswaId: item.siswa_id,
                  namaSiswa: item.nama,
                })
              }
              activeOpacity={0.85}
            >
              <View style={styles.siswaCardTop}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{item.nama.charAt(0)}</Text>
                </View>
                <View style={styles.siswaInfo}>
                  <Text style={styles.siswaName} numberOfLines={1}>
                    {item.nama}
                  </Text>
                  <Text style={styles.siswaMeta}>
                    NIS: {item.nis} • Kelas: {item.kelas}
                  </Text>
                  <Text style={styles.siswaLembaga}>{item.lembaga}</Text>
                </View>
                <ChevronRight size={18} color="#CBD5E1" />
              </View>

              <View style={styles.siswaCardDivider} />

              <View style={styles.siswaCardBottom}>
                {/* Skor Fundamental */}
                <View style={styles.bottomStat}>
                  <Text style={styles.bottomStatLabel}>9 Aspek Fundamental:</Text>
                  <View style={styles.fundamentalPill}>
                    <Sparkles size={12} color="#F59E0B" />
                    <Text style={styles.fundamentalScore}>
                      {item.avg_fundamental > 0 ? `${item.avg_fundamental}/4.0` : "Belum dinilai"}
                    </Text>
                  </View>
                </View>

                {/* Info Kuliah/Lanjutan */}
                <View style={styles.bottomStat}>
                  <Text style={styles.bottomStatLabel}>Rencana Kuliah:</Text>
                  <Text style={styles.kuliahText} numberOfLines={1}>
                    {item.universitas_tujuan !== "-" ? item.universitas_tujuan : item.rencana_kuliah}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={filteredKonseling}
          keyExtractor={(item) => item.konseling_id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageSquare size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Belum ada sesi konsultasi</Text>
              <Text style={styles.emptySubtitle}>
                Catatan konseling santri binaan akan muncul di sini.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.konselingCard}>
              <View style={styles.konselingCardHeader}>
                <View style={styles.kategoriBadge}>
                  <Text style={styles.kategoriText}>{item.kategori}</Text>
                </View>
                <View style={styles.dateRow}>
                  <Calendar size={12} color="#94A3B8" />
                  <Text style={styles.dateText}>{item.tanggal_sesi}</Text>
                </View>
              </View>

              <Text style={styles.konselingTopic}>{item.topik_konseling}</Text>

              {item.siswa && (
                <View style={styles.santriRow}>
                  <User size={13} color="#162E6E" />
                  <Text style={styles.santriName}>
                    {item.siswa.nama} ({item.siswa.nis} - {item.siswa.kelas?.nama_kelas || "-"})
                  </Text>
                </View>
              )}

              <View style={styles.keluhanBox}>
                <Text style={styles.keluhanLabel}>Uraian Masalah:</Text>
                <Text style={styles.keluhanText}>{item.keluhan_masalah}</Text>
              </View>

              {item.solusi_kesepakatan && (
                <View style={styles.solusiBox}>
                  <Text style={styles.solusiLabel}>Solusi & Kesepakatan:</Text>
                  <Text style={styles.solusiText}>{item.solusi_kesepakatan}</Text>
                </View>
              )}

              {item.catatan_tindak_lanjut && (
                <View style={styles.followUpBox}>
                  <Text style={styles.followUpLabel}>Catatan Tindak Lanjut / Rujukan:</Text>
                  <Text style={styles.followUpText}>{item.catatan_tindak_lanjut}</Text>
                </View>
              )}

              <View style={styles.konselingCardFooter}>
                {renderStatusBadge(item.status_follow_up)}

                <TouchableOpacity
                  style={styles.followUpBtn}
                  onPress={() => openFollowUp(item)}
                  activeOpacity={0.8}
                >
                  <Edit3 size={13} color="#162E6E" />
                  <Text style={styles.followUpBtnText}>Follow Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal Follow Up Murobbi */}
      <Modal
        visible={followUpModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFollowUpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Follow-Up Sesi Konsultasi</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {activeFollowUpSesi?.topik_konseling}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setFollowUpModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Pilih Status Perkembangan *</Text>
              <View style={styles.statusOptionsContainer}>
                {[
                  { id: "Dalam Pemantauan", label: "Dalam Pemantauan", desc: "Masih observasi", color: "#1D4ED8", bg: "#EFF6FF" },
                  { id: "Selesai", label: "Selesai", desc: "Kasus tuntas", color: "#15803D", bg: "#F0FDF4" },
                  { id: "Dirujuk ke Pihak Luar", label: "Dirujuk ke Pihak Luar", desc: "Dilempar ke pihak luar", color: "#7E22CE", bg: "#FAF5FF" },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.statusOption,
                      followUpStatus === opt.id && {
                        borderColor: opt.color,
                        backgroundColor: opt.bg,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setFollowUpStatus(opt.id)}
                  >
                    <Text
                      style={[
                        styles.statusOptionTitle,
                        followUpStatus === opt.id && { color: opt.color, fontWeight: "800" },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.statusOptionDesc}>{opt.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                Catatan Follow-Up / Keterangan Pihak Luar *
              </Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder={
                  followUpStatus === "Dirujuk ke Pihak Luar"
                    ? "Tuliskan keterangan pihak luar (Dokter, Psikolog, Orang Tua Khusus, dll)..."
                    : followUpStatus === "Selesai"
                    ? "Tuliskan ringkasan evaluasi kasus yang telah selesai..."
                    : "Tuliskan perkembangan bimbingan santri..."
                }
                placeholderTextColor="#94A3B8"
                value={followUpNotes}
                onChangeText={setFollowUpNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setFollowUpModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={submitFollowUp}
                disabled={isSubmittingFollowUp}
              >
                {isSubmittingFollowUp ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Simpan Follow-Up</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
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
    fontSize: 18,
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
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    padding: 4,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#94A3B8",
  },
  tabTextActive: {
    color: "#162E6E",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#1E293B",
  },
  filterScrollView: {
    marginTop: 8,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#162E6E",
    borderColor: "#162E6E",
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
  },
  siswaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  siswaCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#162E6E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  siswaInfo: {
    flex: 1,
  },
  siswaName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  siswaMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  siswaLembaga: {
    fontSize: 10.5,
    color: "#94A3B8",
    marginTop: 1,
  },
  siswaCardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  siswaCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bottomStat: {
    flex: 1,
  },
  bottomStatLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 3,
  },
  fundamentalPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  fundamentalScore: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  kuliahText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#162E6E",
  },
  konselingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: 10,
  },
  konselingCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kategoriBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
  },
  kategoriText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  konselingTopic: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  santriRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  santriName: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#162E6E",
  },
  keluhanBox: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  keluhanLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  keluhanText: {
    fontSize: 11.5,
    color: "#334155",
    lineHeight: 16,
  },
  solusiBox: {
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  solusiLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#15803D",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  solusiText: {
    fontSize: 11.5,
    color: "#166534",
    lineHeight: 16,
  },
  followUpBox: {
    backgroundColor: "#FAF5FF",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F3E8FF",
  },
  followUpLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#7E22CE",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  followUpText: {
    fontSize: 11.5,
    color: "#581C87",
    lineHeight: 16,
  },
  konselingCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  followUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    gap: 4,
  },
  followUpBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#162E6E",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
    paddingBottom: 12,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
  },
  modalBody: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  statusOptionsContainer: {
    gap: 8,
  },
  statusOption: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  statusOptionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  statusOptionDesc: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    color: "#0F172A",
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#162E6E",
    alignItems: "center",
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
