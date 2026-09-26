// mobile/src/screens/Guidance/GuidanceDetailScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
} from "react-native";
import {
  ChevronLeft,
  Sparkles,
  MessageSquare,
  Plus,
  Home,
  HeartPulse,
  Briefcase,
  GraduationCap,
  Share2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit3,
  Calendar,
  X,
  User,
} from "lucide-react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { guidanceService, KonselingSesi } from "../../api/guidanceService";

export const GuidanceDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { siswaId, namaSiswa } = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [siswaDetail, setSiswaDetail] = useState<any>(null);

  // Tab: 'profil' (360° Data & Fundamental) atau 'konseling'
  const [activeTab, setActiveTab] = useState<"profil" | "konseling">("profil");

  // Modal Tambah Sesi Konsultasi
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newTopik, setNewTopik] = useState("");
  const [newKategori, setNewKategori] = useState("Akademik");
  const [newKeluhan, setNewKeluhan] = useState("");
  const [newSolusi, setNewSolusi] = useState("");
  const [newStatus, setNewStatus] = useState("Dalam Pemantauan");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Modal Follow-up
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [activeFollowUpSesi, setActiveFollowUpSesi] = useState<KonselingSesi | null>(null);
  const [followUpStatus, setFollowUpStatus] = useState("Dalam Pemantauan");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!siswaId) return;
    try {
      setIsLoading(true);
      const data = await guidanceService.getSiswaDetail(siswaId);
      setSiswaDetail(data);
    } catch (err: any) {
      console.warn("Error fetching siswa detail:", err);
      Alert.alert("Gagal Memuat", "Tidak dapat mengambil data bimbingan santri.");
    } finally {
      setIsLoading(false);
    }
  }, [siswaId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleAddKonseling = async () => {
    if (!newTopik.trim() || !newKeluhan.trim()) {
      Alert.alert("Perhatian", "Topik dan keluhan masalah santri wajib diisi.");
      return;
    }
    try {
      setIsSubmittingNew(true);
      await guidanceService.createKonseling({
        siswa_id: siswaId,
        kategori: newKategori,
        topik_konseling: newTopik,
        keluhan_masalah: newKeluhan,
        solusi_kesepakatan: newSolusi,
        status_follow_up: newStatus,
      });
      setAddModalVisible(false);
      setNewTopik("");
      setNewKeluhan("");
      setNewSolusi("");
      Alert.alert("Berhasil", "Catatan sesi konsultasi berhasil disimpan.");
      fetchDetail();
    } catch (err: any) {
      Alert.alert("Gagal", err.response?.data?.message || "Gagal mencatat sesi konsultasi.");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const openFollowUp = (sesi: KonselingSesi) => {
    setActiveFollowUpSesi(sesi);
    setFollowUpStatus(sesi.status_follow_up || "Dalam Pemantauan");
    setFollowUpNotes(sesi.catatan_tindak_lanjut || "");
    setFollowUpModalVisible(true);
  };

  const handleUpdateFollowUp = async () => {
    if (!activeFollowUpSesi) return;
    try {
      setIsSubmittingFollowUp(true);
      await guidanceService.updateFollowUp(activeFollowUpSesi.konseling_id, {
        status_follow_up: followUpStatus,
        catatan_tindak_lanjut: followUpNotes,
      });
      setFollowUpModalVisible(false);
      Alert.alert("Berhasil", "Status follow-up sesi berhasil diperbarui.");
      fetchDetail();
    } catch (err: any) {
      Alert.alert("Gagal", err.response?.data?.message || "Gagal memperbarui follow-up.");
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  const fundamentalItems = [
    { key: "skor_wudhu", label: "Wudhu" },
    { key: "skor_doa_sholat", label: "Do'a Sholat" },
    { key: "skor_praktik_sholat", label: "Praktik Sholat" },
    { key: "skor_jamaah_masjid", label: "Jama'ah Masjid" },
    { key: "skor_alquran", label: "Tilawah / Al-Qur'an" },
    { key: "skor_hafalan_juz30", label: "Hafalan Juz 30" },
    { key: "skor_disiplin", label: "Disiplin Waktu" },
    { key: "skor_rapi", label: "Kerapihan Diri" },
    { key: "skor_adab", label: "Adab & Akhlak" },
  ];

  const skorConfig: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: "1: Belum Bisa", color: "#DC2626", bg: "#FEF2F2" },
    2: { label: "2: Bisa", color: "#D97706", bg: "#FFFBEB" },
    3: { label: "3: Butuh Kontrol", color: "#2563EB", bg: "#EFF6FF" },
    4: { label: "4: Mandiri & Istiqomah", color: "#16A34A", bg: "#F0FDF4" },
  };

  const g = siswaDetail?.guidance_detail || {};
  const konselingList: KonselingSesi[] = siswaDetail?.konseling_sesi || [];

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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {siswaDetail?.nama || namaSiswa || "Detail Santri"}
          </Text>
          <Text style={styles.headerSubtitle}>
            NIS: {siswaDetail?.nis || "-"} • Kelas: {siswaDetail?.kelas?.nama_kelas || "-"}
          </Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "profil" && styles.tabBtnActive]}
          onPress={() => setActiveTab("profil")}
        >
          <User size={15} color={activeTab === "profil" ? "#162E6E" : "#94A3B8"} />
          <Text style={[styles.tabBtnText, activeTab === "profil" && styles.tabBtnTextActive]}>
            Profil 360° & Fundamental
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "konseling" && styles.tabBtnActive]}
          onPress={() => setActiveTab("konseling")}
        >
          <MessageSquare size={15} color={activeTab === "konseling" ? "#162E6E" : "#94A3B8"} />
          <Text style={[styles.tabBtnText, activeTab === "konseling" && styles.tabBtnTextActive]}>
            Sesi Konseling ({konselingList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#162E6E" />
          <Text style={styles.loadingText}>Memuat detail santri...</Text>
        </View>
      ) : activeTab === "profil" ? (
        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* 1. Pemetaan 9 Aspek Fundamental */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Sparkles size={16} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Pemetaan 9 Aspek Fundamental</Text>
            </View>
            <View style={styles.fundamentalGrid}>
              {fundamentalItems.map((item) => {
                const score = g[item.key] || 1;
                const conf = skorConfig[score] || skorConfig[1];
                return (
                  <View key={item.key} style={styles.fundamentalItem}>
                    <Text style={styles.fundamentalItemLabel}>{item.label}</Text>
                    <View style={[styles.fundamentalScoreBadge, { backgroundColor: conf.bg }]}>
                      <Text style={[styles.fundamentalScoreText, { color: conf.color }]}>
                        {conf.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {g.catatan_fundamental && (
              <View style={styles.catatanBox}>
                <Text style={styles.catatanLabel}>Catatan Bimbingan Fundamental:</Text>
                <Text style={styles.catatanText}>{g.catatan_fundamental}</Text>
              </View>
            )}
          </View>

          {/* 2. Tempat Tinggal & Fasilitas */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Home size={16} color="#162E6E" />
              <Text style={styles.sectionTitle}>Tempat Tinggal & Fasilitas</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Jarak Rumah-Sekolah</Text>
              <Text style={styles.infoValue}>{g.jarak_rumah_sekolah || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Transportasi</Text>
              <Text style={styles.infoValue}>{g.transportasi || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kepemilikan Rumah</Text>
              <Text style={styles.infoValue}>{g.kepemilikan_rumah || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Daya Listrik</Text>
              <Text style={styles.infoValue}>{g.daya_listrik || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Akses Internet</Text>
              <Text style={styles.infoValue}>{g.akses_internet || "-"}</Text>
            </View>
          </View>

          {/* 3. Data Sosial & Kontak Digital */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Share2 size={16} color="#7E22CE" />
              <Text style={styles.sectionTitle}>Data Sosial & Kontak Digital</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>No HP Siswa</Text>
              <Text style={styles.infoValue}>{g.no_hp_siswa || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email Siswa</Text>
              <Text style={styles.infoValue}>{g.email_siswa || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Instagram</Text>
              <Text style={styles.infoValue}>{g.instagram || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>TikTok</Text>
              <Text style={styles.infoValue}>{g.tiktok || "-"}</Text>
            </View>
          </View>

          {/* 4. Riwayat Kesehatan & Kontak Darurat */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <HeartPulse size={16} color="#DC2626" />
              <Text style={styles.sectionTitle}>Riwayat Kesehatan & Darurat</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Merokok</Text>
              <Text style={styles.infoValue}>{g.merokok || "Tidak"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Riwayat Penyakit</Text>
              <Text style={styles.infoValue}>{g.riwayat_penyakit || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Riwayat Alergi</Text>
              <Text style={styles.infoValue}>{g.riwayat_alergi || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Asuransi Kesehatan</Text>
              <Text style={styles.infoValue}>{g.asuransi_kesehatan || "-"}</Text>
            </View>
            <View style={styles.daruratBox}>
              <Text style={styles.daruratLabel}>Kontak Darurat:</Text>
              <Text style={styles.daruratText}>
                {g.kontak_darurat_nama ? `${g.kontak_darurat_nama} (${g.kontak_darurat_hubungan || "Keluarga"}) - ${g.kontak_darurat_hp || "-"}` : "Belum diisi"}
              </Text>
            </View>
          </View>

          {/* 5. Internship & Pendidikan Lanjutan */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <GraduationCap size={16} color="#059669" />
              <Text style={styles.sectionTitle}>Pendidikan Lanjutan & Karier</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lanjut Kuliah</Text>
              <Text style={styles.infoValue}>{g.lanjut_kuliah || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Target Pendidikan</Text>
              <Text style={styles.infoValue}>{g.target_pendidikan || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Program Studi</Text>
              <Text style={styles.infoValue}>{g.prodi_pilihan || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Universitas Tujuan</Text>
              <Text style={styles.infoValue}>{g.universitas_tujuan || "-"}</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Tombol Catat Sesi Baru */}
          <TouchableOpacity
            style={styles.addKonselingBtn}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addKonselingBtnText}>Catat Sesi Konsultasi Baru</Text>
          </TouchableOpacity>

          {konselingList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MessageSquare size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Belum ada riwayat konsultasi</Text>
              <Text style={styles.emptySubtitle}>
                Gunakan tombol di atas untuk mencatat dialog atau bimbingan santri ini.
              </Text>
            </View>
          ) : (
            konselingList.map((sesi) => (
              <View key={sesi.konseling_id} style={styles.konselingCard}>
                <View style={styles.konselingCardHeader}>
                  <View style={styles.kategoriBadge}>
                    <Text style={styles.kategoriText}>{sesi.kategori}</Text>
                  </View>
                  <View style={styles.dateRow}>
                    <Calendar size={12} color="#94A3B8" />
                    <Text style={styles.dateText}>{sesi.tanggal_sesi}</Text>
                  </View>
                </View>

                <Text style={styles.konselingTopic}>{sesi.topik_konseling}</Text>

                <View style={styles.keluhanBox}>
                  <Text style={styles.keluhanLabel}>Uraian Masalah:</Text>
                  <Text style={styles.keluhanText}>{sesi.keluhan_masalah}</Text>
                </View>

                {sesi.solusi_kesepakatan && (
                  <View style={styles.solusiBox}>
                    <Text style={styles.solusiLabel}>Solusi & Kesepakatan:</Text>
                    <Text style={styles.solusiText}>{sesi.solusi_kesepakatan}</Text>
                  </View>
                )}

                {sesi.catatan_tindak_lanjut && (
                  <View style={styles.followUpBox}>
                    <Text style={styles.followUpLabel}>Catatan Tindak Lanjut / Rujukan:</Text>
                    <Text style={styles.followUpText}>{sesi.catatan_tindak_lanjut}</Text>
                  </View>
                )}

                <View style={styles.konselingCardFooter}>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Status:</Text>
                    <Text style={styles.statusValue}>{sesi.status_follow_up}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.followUpActionBtn}
                    onPress={() => openFollowUp(sesi)}
                    activeOpacity={0.8}
                  >
                    <Edit3 size={13} color="#162E6E" />
                    <Text style={styles.followUpActionText}>Follow Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal Catat Sesi Baru */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catat Sesi Konsultasi Baru</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Topik / Judul Masalah *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Konsultasi Akademik & Disiplin"
                placeholderTextColor="#94A3B8"
                value={newTopik}
                onChangeText={setNewTopik}
              />

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Keluhan / Uraian Masalah *</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={3}
                placeholder="Ceritakan pokok persoalan..."
                placeholderTextColor="#94A3B8"
                value={newKeluhan}
                onChangeText={setNewKeluhan}
              />

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Solusi & Kesepakatan</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={2}
                placeholder="Rencana aksi yang disepakati..."
                placeholderTextColor="#94A3B8"
                value={newSolusi}
                onChangeText={setNewSolusi}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAddKonseling}
                disabled={isSubmittingNew}
              >
                {isSubmittingNew ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Simpan Sesi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Follow Up */}
      <Modal
        visible={followUpModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFollowUpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Follow-Up Sesi Konsultasi</Text>
              <TouchableOpacity onPress={() => setFollowUpModalVisible(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Status Perkembangan Kasus</Text>
              <View style={styles.statusRowContainer}>
                {["Dalam Pemantauan", "Selesai", "Dirujuk ke Pihak Luar"].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.statusPill,
                      followUpStatus === st && styles.statusPillActive,
                    ]}
                    onPress={() => setFollowUpStatus(st)}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        followUpStatus === st && styles.statusPillTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                Catatan Follow-Up / Keterangan Pihak Luar
              </Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={3}
                placeholder="Tuliskan catatan tindak lanjut..."
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
                onPress={handleUpdateFollowUp}
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: "#EFF6FF",
  },
  tabBtnText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#94A3B8",
  },
  tabBtnTextActive: {
    color: "#162E6E",
    fontWeight: "800",
  },
  body: {
    flex: 1,
    padding: 16,
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
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  fundamentalGrid: {
    gap: 8,
  },
  fundamentalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
  },
  fundamentalItemLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#334155",
  },
  fundamentalScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fundamentalScoreText: {
    fontSize: 10.5,
    fontWeight: "800",
  },
  catatanBox: {
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  catatanLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 2,
  },
  catatanText: {
    fontSize: 11.5,
    color: "#1E3A8A",
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  infoLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  infoValue: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  daruratBox: {
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  daruratLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#991B1B",
    marginBottom: 2,
  },
  daruratText: {
    fontSize: 11.5,
    color: "#7F1D1D",
  },
  addKonselingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#162E6E",
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 16,
    gap: 6,
    shadowColor: "#162E6E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addKonselingBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 11.5,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
  },
  konselingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    gap: 8,
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
    fontSize: 10.5,
    color: "#94A3B8",
  },
  konselingTopic: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  keluhanBox: {
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 8,
  },
  keluhanLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 2,
  },
  keluhanText: {
    fontSize: 11,
    color: "#334155",
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
    marginBottom: 2,
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
    marginBottom: 2,
  },
  followUpText: {
    fontSize: 11,
    color: "#581C87",
  },
  konselingCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusLabel: {
    fontSize: 10.5,
    color: "#64748B",
  },
  statusValue: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#162E6E",
  },
  followUpActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    gap: 4,
  },
  followUpActionText: {
    fontSize: 10.5,
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
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalBody: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 11.5,
    color: "#0F172A",
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 10,
    fontSize: 11.5,
    color: "#0F172A",
    textAlignVertical: "top",
  },
  statusRowContainer: {
    flexDirection: "row",
    gap: 6,
  },
  statusPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  statusPillActive: {
    borderColor: "#162E6E",
    backgroundColor: "#EFF6FF",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  statusPillTextActive: {
    color: "#162E6E",
    fontWeight: "800",
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
