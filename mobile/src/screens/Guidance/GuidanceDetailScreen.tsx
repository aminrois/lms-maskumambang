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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
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
  Save,
  ShieldCheck,
  Check,
} from "lucide-react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { guidanceService, KonselingSesi, GuidanceDetail } from "../../api/guidanceService";

export const GuidanceDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { siswaId, namaSiswa } = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [siswaDetail, setSiswaDetail] = useState<any>(null);

  // Tab: 'profil' (360° Data & Fundamental) atau 'konseling'
  const [activeTab, setActiveTab] = useState<"profil" | "konseling">("profil");

  // Form State Editable Guidance Detail
  const [formData, setFormData] = useState<GuidanceDetail>({
    jarak_rumah_sekolah: "",
    transportasi: "Motor",
    kepemilikan_rumah: "Milik Sendiri",
    daya_listrik: "1.300 VA",
    sumber_air: "Sumur Bor",
    akses_internet: "Wifi",
    perangkat_belajar: "Ada",

    no_hp_siswa: "",
    email_siswa: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    twitter_x: "",

    merokok: "Tidak",
    riwayat_penyakit: "",
    riwayat_alergi: "",
    riwayat_operasi: "",
    gangguan_kesehatan: "",
    dalam_masa_pengobatan: "",
    asuransi_kesehatan: "BPJS Kesehatan",
    kontak_darurat_nama: "",
    kontak_darurat_hubungan: "",
    kontak_darurat_hp: "",

    internship_nama: "",
    internship_alamat: "",
    internship_bidang: "",
    internship_divisi: "",
    internship_kompetensi: "",

    lanjut_kuliah: "Ya",
    target_pendidikan: "S1 (Sarjana)",
    prodi_pilihan: "",
    universitas_tujuan: "",
    persiapan: "",
    sumber_biaya: "Orang Tua / Mandiri",
    jalur_masuk: "SNBT / UTBK",
    dukungan_diharapkan: "",

    skor_wudhu: 3,
    skor_doa_sholat: 3,
    skor_praktik_sholat: 3,
    skor_jamaah_masjid: 3,
    skor_alquran: 3,
    skor_hafalan_juz30: 3,
    skor_disiplin: 3,
    skor_rapi: 3,
    skor_adab: 3,
    catatan_fundamental: "",
  });

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
      if (data?.guidance_detail) {
        setFormData((prev) => ({
          ...prev,
          ...data.guidance_detail,
          internship_nama: data.guidance_detail.internship_nama || data.guidance_detail.internship_instansi || "",
          prodi_pilihan: data.guidance_detail.prodi_pilihan || data.guidance_detail.prodi_tujuan || "",
          persiapan: data.guidance_detail.persiapan || data.guidance_detail.persiapan_kuliah || "",
        }));
      }
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

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [fetchDetail])
  );

  const updateField = (key: keyof GuidanceDetail, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async () => {
    if (!siswaId) return;
    try {
      setIsSaving(true);
      await guidanceService.saveSiswaDetail(siswaId, formData);
      Alert.alert("Berhasil", "Pembaruan profil 360° & aspek fundamental santri berhasil disimpan!");
      fetchDetail();
    } catch (err: any) {
      Alert.alert("Gagal Menyimpan", err.response?.data?.message || "Terjadi kesalahan saat menyimpan data santri.");
    } finally {
      setIsSaving(false);
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
    { key: "skor_wudhu" as keyof GuidanceDetail, label: "1. Wudhu", desc: "Ketepatan rukun, sunnah & tertib wudhu" },
    { key: "skor_doa_sholat" as keyof GuidanceDetail, label: "2. Do'a Sholat", desc: "Hafalan bacaan iftitah, ruku, sujud & tasyahud" },
    { key: "skor_praktik_sholat" as keyof GuidanceDetail, label: "3. Praktik Sholat", desc: "Thuma'ninah & kekhusyukan gerakan sholat" },
    { key: "skor_jamaah_masjid" as keyof GuidanceDetail, label: "4. Sholat Jama'ah", desc: "Kedisiplinan hadir sholat 5 waktu di masjid" },
    { key: "skor_alquran" as keyof GuidanceDetail, label: "5. Al-Qur'an & Tilawah", desc: "Kelancaran tajwid, makhraj & tilawah harian" },
    { key: "skor_hafalan_juz30" as keyof GuidanceDetail, label: "6. Hafalan Juz 30", desc: "Kelancaran hafalan juz amma & muroja'ah" },
    { key: "skor_disiplin" as keyof GuidanceDetail, label: "7. Disiplin Waktu", desc: "Kepatuhan jadwal bangun, KBM & istirahat" },
    { key: "skor_rapi" as keyof GuidanceDetail, label: "8. Kerapihan Diri", desc: "Kerapihan pakaian, lemari & kamar asrama" },
    { key: "skor_adab" as keyof GuidanceDetail, label: "9. Adab & Akhlak", desc: "Sopan santun kepada guru, murobbi & kawan" },
  ];

  const skorConfig: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: "1: Belum Bisa", color: "#DC2626", bg: "#FEF2F2" },
    2: { label: "2: Bisa", color: "#D97706", bg: "#FFFBEB" },
    3: { label: "3: Butuh Kontrol", color: "#2563EB", bg: "#EFF6FF" },
    4: { label: "4: Mandiri & Istiqomah", color: "#16A34A", bg: "#F0FDF4" },
  };

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
            Kelas: {siswaDetail?.kelas?.nama_kelas || "-"} ({siswaDetail?.kelas?.lembaga?.nama_lembaga || "-"})
          </Text>
        </View>

        {activeTab === "profil" && (
          <TouchableOpacity
            style={styles.saveTopBtn}
            onPress={handleSaveProfile}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={15} color="#FFFFFF" />
                <Text style={styles.saveTopBtnText}>Simpan</Text>
              </>
            )}
          </TouchableOpacity>
        )}
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
          <Text style={styles.loadingText}>Memuat data lengkap santri...</Text>
        </View>
      ) : activeTab === "profil" ? (
        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 60 }}>
          {/* ═══════════════════════════════════════════════════════
              SEKSI A: PEMETAAN 9 ASPEK FUNDAMENTAL (EDITABLE)
          ════════════════════════════════════════════════════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: "#FEF3C7" }]}>
                <Sparkles size={16} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>A. Pemetaan 9 Aspek Fundamental</Text>
                <Text style={styles.sectionSubtitle}>Pilih skor evaluasi pembiasaan santri (Skala 1 - 4)</Text>
              </View>
            </View>

            <View style={styles.fundamentalGrid}>
              {fundamentalItems.map((item) => {
                const currentScore = Number(formData[item.key]) || 1;
                const conf = skorConfig[currentScore] || skorConfig[1];
                return (
                  <View key={item.key} style={styles.fundamentalEditCard}>
                    <View style={styles.fundamentalTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fundamentalItemLabel}>{item.label}</Text>
                        <Text style={styles.fundamentalItemDesc}>{item.desc}</Text>
                      </View>
                      <View style={[styles.fundamentalScoreBadge, { backgroundColor: conf.bg }]}>
                        <Text style={[styles.fundamentalScoreText, { color: conf.color }]}>
                          {conf.label}
                        </Text>
                      </View>
                    </View>

                    {/* Button Selector 1 - 4 */}
                    <View style={styles.scoreSelectorRow}>
                      {[1, 2, 3, 4].map((num) => {
                        const isSelected = currentScore === num;
                        const btnConf = skorConfig[num];
                        return (
                          <TouchableOpacity
                            key={num}
                            style={[
                              styles.scoreBtn,
                              isSelected && {
                                backgroundColor: btnConf.bg,
                                borderColor: btnConf.color,
                                borderWidth: 2,
                              },
                            ]}
                            onPress={() => updateField(item.key, num)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.scoreBtnText,
                                isSelected && { color: btnConf.color, fontWeight: "900" },
                              ]}
                            >
                              {num}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.inputLabel}>Catatan Bimbingan Fundamental Murobbi:</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={3}
                placeholder="Tuliskan catatan perkembangan pembiasaan ibadah / adab santri..."
                placeholderTextColor="#94A3B8"
                value={formData.catatan_fundamental || ""}
                onChangeText={(val) => updateField("catatan_fundamental", val)}
              />
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════
              SEKSI B: TEMPAT TINGGAL & FASILITAS (EDITABLE)
          ════════════════════════════════════════════════════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: "#EFF6FF" }]}>
                <Home size={16} color="#162E6E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>B. Tempat Tinggal & Fasilitas Santri</Text>
                <Text style={styles.sectionSubtitle}>Mobilitas, sarana belajar & kondisi rumah</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Jarak Rumah ke Sekolah</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: 5 km / 500 meter"
              placeholderTextColor="#94A3B8"
              value={formData.jarak_rumah_sekolah || ""}
              onChangeText={(val) => updateField("jarak_rumah_sekolah", val)}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Moda Transportasi</Text>
            <View style={styles.pillSelectorRow}>
              {["Motor", "Mobil", "Jalan Kaki", "Antar Jemput", "Lainnya"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.pillOption,
                    formData.transportasi === opt && styles.pillOptionActive,
                  ]}
                  onPress={() => updateField("transportasi", opt)}
                >
                  <Text
                    style={[
                      styles.pillOptionText,
                      formData.transportasi === opt && styles.pillOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Kepemilikan Rumah</Text>
            <View style={styles.pillSelectorRow}>
              {["Milik Sendiri", "Kontrak"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.pillOption,
                    formData.kepemilikan_rumah === opt && styles.pillOptionActive,
                  ]}
                  onPress={() => updateField("kepemilikan_rumah", opt)}
                >
                  <Text
                    style={[
                      styles.pillOptionText,
                      formData.kepemilikan_rumah === opt && styles.pillOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Daya Listrik Rumah</Text>
            <View style={styles.pillSelectorRow}>
              {["450 VA", "900 VA", "1.300 VA", "2.200 VA", "3.500 VA+"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.pillOption,
                    formData.daya_listrik === opt && styles.pillOptionActive,
                  ]}
                  onPress={() => updateField("daya_listrik", opt)}
                >
                  <Text
                    style={[
                      styles.pillOptionText,
                      formData.daya_listrik === opt && styles.pillOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Sumber Air Minum</Text>
            <View style={styles.pillSelectorRow}>
              {["Sumur Bor", "PDAM / PAM"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.pillOption,
                    formData.sumber_air === opt && styles.pillOptionActive,
                  ]}
                  onPress={() => updateField("sumber_air", opt)}
                >
                  <Text
                    style={[
                      styles.pillOptionText,
                      formData.sumber_air === opt && styles.pillOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Akses Internet</Text>
            <View style={styles.pillSelectorRow}>
              {["Wifi", "Paket Data", "Paket Data + Wifi", "Tidak Ada"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.pillOption,
                    formData.akses_internet === opt && styles.pillOptionActive,
                  ]}
                  onPress={() => updateField("akses_internet", opt)}
                >
                  <Text
                    style={[
                      styles.pillOptionText,
                      formData.akses_internet === opt && styles.pillOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════
              SEKSI C: DATA SOSIAL & DIGITAL (EDITABLE)
          ════════════════════════════════════════════════════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: "#FAF5FF" }]}>
                <Share2 size={16} color="#7E22CE" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>C. Data Sosial & Kontak Digital</Text>
                <Text style={styles.sectionSubtitle}>Nomor kontak pribadi & akun media sosial</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>No HP / WhatsApp Santri</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: 08123456789"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={formData.no_hp_siswa || ""}
              onChangeText={(val) => updateField("no_hp_siswa", val)}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Email Santri</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: santri@gmail.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email_siswa || ""}
              onChangeText={(val) => updateField("email_siswa", val)}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Instagram</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: @username"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              value={formData.instagram || ""}
              onChangeText={(val) => updateField("instagram", val)}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>TikTok</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: @username_tiktok"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              value={formData.tiktok || ""}
              onChangeText={(val) => updateField("tiktok", val)}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Facebook</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nama akun Facebook"
              placeholderTextColor="#94A3B8"
              value={formData.facebook || ""}
              onChangeText={(val) => updateField("facebook", val)}
            />
          </View>

          {/* ═══════════════════════════════════════════════════════
              SEKSI D: RIWAYAT KESEHATAN & DARURAT (EDITABLE)
          ════════════════════════════════════════════════════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: "#FEF2F2" }]}>
                <HeartPulse size={16} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>D. Riwayat Kesehatan & Kontak Darurat</Text>
                <Text style={styles.sectionSubtitle}>Kesiapsiagaan penanganan medis asrama</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Perokok</Text>
            <View style={styles.pillSelectorRow}>
              {["Tidak", "Ya"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.pillOption,
                    formData.merokok === opt && styles.pillOptionActive,
                  ]}
                  onPress={() => updateField("merokok", opt)}
                >
                  <Text
                    style={[
                      styles.pillOptionText,
                      formData.merokok === opt && styles.pillOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Riwayat Penyakit</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Asma, Maag kronis (kosongkan bila tidak ada)"
              placeholderTextColor="#94A3B8"
              value={formData.riwayat_penyakit || ""}
              onChangeText={(val) => updateField("riwayat_penyakit", val)}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Riwayat Alergi</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Alergi udang, debu, obat tertentu"
              placeholderTextColor="#94A3B8"
              value={formData.riwayat_alergi || ""}
              onChangeText={(val) => updateField("riwayat_alergi", val)}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Asuransi Kesehatan</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: BPJS Kesehatan / Asuransi Swasta"
              placeholderTextColor="#94A3B8"
              value={formData.asuransi_kesehatan || ""}
              onChangeText={(val) => updateField("asuransi_kesehatan", val)}
            />

            {/* Kontak Darurat */}
            <View style={styles.daruratEditCard}>
              <Text style={styles.daruratCardTitle}>Kontak Darurat Kesehatan:</Text>

              <Text style={[styles.inputLabel, { marginTop: 6 }]}>Nama Kontak Darurat</Text>
              <TextInput
                style={styles.textInputWhite}
                placeholder="Nama Lengkap"
                placeholderTextColor="#94A3B8"
                value={formData.kontak_darurat_nama || ""}
                onChangeText={(val) => updateField("kontak_darurat_nama", val)}
              />

              <Text style={[styles.inputLabel, { marginTop: 8 }]}>Hubungan Keluarga</Text>
              <TextInput
                style={styles.textInputWhite}
                placeholder="Contoh: Paman / Kakak Kandung / Bibi"
                placeholderTextColor="#94A3B8"
                value={formData.kontak_darurat_hubungan || ""}
                onChangeText={(val) => updateField("kontak_darurat_hubungan", val)}
              />

              <Text style={[styles.inputLabel, { marginTop: 8 }]}>Nomor HP Darurat</Text>
              <TextInput
                style={styles.textInputWhite}
                placeholder="Contoh: 081298765432"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={formData.kontak_darurat_hp || ""}
                onChangeText={(val) => updateField("kontak_darurat_hp", val)}
              />
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════
              SEKSI E: INTERNSHIP & PRAKTIK DAKWAH (EDITABLE)
          ════════════════════════════════════════════════════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: "#FEF3C7" }]}>
                <Briefcase size={16} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>E. Rencana Internship & Praktik Dakwah</Text>
                <Text style={styles.sectionSubtitle}>Proyeksi magang, dakwah & keahlian santri</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Nama Instansi Tujuan</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: RSI Gresik / Lazisnu / Bank Syariah"
              placeholderTextColor="#94A3B8"
              value={formData.internship_nama || ""}
              onChangeText={(val) => updateField("internship_nama", val)}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Alamat / Kota Instansi</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Kota / Alamat instansi"
              placeholderTextColor="#94A3B8"
              value={formData.internship_alamat || ""}
              onChangeText={(val) => updateField("internship_alamat", val)}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Bidang Instansi</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Pendidikan / Kesehatan / Keuangan"
              placeholderTextColor="#94A3B8"
              value={formData.internship_bidang || ""}
              onChangeText={(val) => updateField("internship_bidang", val)}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Kompetensi yang Ingin Dikembangkan</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={2}
              placeholder="Uraikan keahlian yang ingin dipelajari..."
              placeholderTextColor="#94A3B8"
              value={formData.internship_kompetensi || ""}
              onChangeText={(val) => updateField("internship_kompetensi", val)}
            />
          </View>

          {/* ═══════════════════════════════════════════════════════
              SEKSI F: PENDIDIKAN LANJUTAN & KULIAH (EDITABLE)
          ════════════════════════════════════════════════════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: "#ECFDF5" }]}>
                <GraduationCap size={16} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>F. Rencana Pendidikan Lanjutan (Kuliah)</Text>
                <Text style={styles.sectionSubtitle}>Arah studi perguruan tinggi & karier santri</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Rencana Lanjut Kuliah</Text>
            <View style={styles.pillSelectorRow}>
              {["Ya", "Tidak"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.pillOption,
                    formData.lanjut_kuliah === opt && styles.pillOptionActive,
                  ]}
                  onPress={() => updateField("lanjut_kuliah", opt)}
                >
                  <Text
                    style={[
                      styles.pillOptionText,
                      formData.lanjut_kuliah === opt && styles.pillOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Target Jenjang Pendidikan</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: S1 / D4 / Ma'had Aly / Al-Azhar"
              placeholderTextColor="#94A3B8"
              value={formData.target_pendidikan || ""}
              onChangeText={(val) => updateField("target_pendidikan", val)}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Program Studi Pilihan</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Teknik Informatika / Kedokteran / Tafsir"
              placeholderTextColor="#94A3B8"
              value={formData.prodi_pilihan || ""}
              onChangeText={(val) => updateField("prodi_pilihan", val)}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Universitas / Kampus Tujuan</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: ITS Surabaya / UIN Malang / UI"
              placeholderTextColor="#94A3B8"
              value={formData.universitas_tujuan || ""}
              onChangeText={(val) => updateField("universitas_tujuan", val)}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Persiapan yang Dilakukan</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Bimbel UTBK, Kursus Bahasa Arab"
              placeholderTextColor="#94A3B8"
              value={formData.persiapan || ""}
              onChangeText={(val) => updateField("persiapan", val)}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Jalur Masuk</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: SNBP / SNBT / Beasiswa PBSB / Mandiri"
              placeholderTextColor="#94A3B8"
              value={formData.jalur_masuk || ""}
              onChangeText={(val) => updateField("jalur_masuk", val)}
            />
          </View>

          {/* ── TOMBOL SIMPAN DI BAGIAN PALING BAWAH ───────────────── */}
          <TouchableOpacity
            style={styles.saveBottomBtn}
            onPress={handleSaveProfile}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveBottomBtnText}>Simpan Perubahan Data Santri</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Tombol Catat Sesi Baru */}
          <TouchableOpacity
            style={styles.addKonselingBtn}
            onPress={() =>
              navigation.navigate("GuidanceCatatSesi", {
                siswaId: siswaId,
                namaSiswa: siswaDetail?.nama || namaSiswa,
                namaKelas: siswaDetail?.kelas?.nama_kelas,
                namaLembaga: siswaDetail?.kelas?.lembaga?.nama_lembaga,
              })
            }
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
                    <View
                      style={[
                        styles.statusBadgeSmall,
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
                          styles.statusBadgeTextSmall,
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
      <Modal
        visible={followUpModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFollowUpModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setFollowUpModalVisible(false);
            }}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Follow-Up Sesi Konsultasi</Text>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setFollowUpModalVisible(false);
                }}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
                onPress={() => {
                  Keyboard.dismiss();
                  setFollowUpModalVisible(false);
                }}
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
        </KeyboardAvoidingView>
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
    marginRight: 10,
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
  saveTopBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  saveTopBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#FFFFFF",
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
    alignItems: "center",
    justifyContent: "center",
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
  fundamentalGrid: {
    gap: 10,
  },
  fundamentalEditCard: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  fundamentalTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fundamentalItemLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  fundamentalItemDesc: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  fundamentalScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fundamentalScoreText: {
    fontSize: 10,
    fontWeight: "800",
  },
  scoreSelectorRow: {
    flexDirection: "row",
    gap: 8,
  },
  scoreBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 12,
    color: "#0F172A",
  },
  textInputWhite: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECDD3",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
    fontSize: 11.5,
    color: "#0F172A",
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: "#0F172A",
    textAlignVertical: "top",
  },
  pillSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pillOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pillOptionActive: {
    backgroundColor: "#162E6E",
    borderColor: "#162E6E",
  },
  pillOptionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  pillOptionTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  daruratEditCard: {
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  daruratCardTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#9F1239",
  },
  saveBottomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#162E6E",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#162E6E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 6,
  },
  saveBottomBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
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
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeTextSmall: {
    fontSize: 10,
    fontWeight: "700",
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
  modalDismissArea: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 18,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalBody: {
    maxHeight: 320,
    marginBottom: 12,
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
