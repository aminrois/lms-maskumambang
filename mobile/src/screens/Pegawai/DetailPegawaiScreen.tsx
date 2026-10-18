// mobile/src/screens/Pegawai/DetailPegawaiScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  User,
  Briefcase,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Award,
  Users,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  School,
  IdCard,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { apiClient } from "../../api/client";
import { FocusAwareStatusBar } from "../../components/ui/FocusAwareStatusBar";

interface DetailPegawaiData {
  pegawai_id: number;
  nama: string;
  nig?: string;
  nip?: string;
  nik?: string;
  jenis_kelamin?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  no_hp?: string;
  status?: string;
  jabatan?: string;
  tugas_tambahan?: string;
  jumlah_anak_laki?: number;
  jumlah_anak_perempuan?: number;
  nama_ayah?: string;
  nama_ibu?: string;
  golongan_darah?: string;
  pegawai_lembaga?: Array<{
    lembaga_id: number;
    lembaga?: {
      lembaga_id: number;
      nama_lembaga: string;
      singkatan?: string;
    };
  }>;
  user?: {
    username?: string;
    email?: string;
    user_roles?: Array<{
      role?: {
        nama_role: string;
      };
      lembaga?: {
        lembaga_id: number;
        nama_lembaga: string;
        singkatan?: string;
      };
    }>;
  };
  kelas_wali?: Array<{
    kelas_id: number;
    nama_kelas: string;
    lembaga?: {
      nama_lembaga: string;
      singkatan?: string;
    };
  }>;
}

export const DetailPegawaiScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { pegawaiId, pegawai: initialPegawai } = route.params || {};

  const [pegawai, setPegawai] = useState<DetailPegawaiData | null>(initialPegawai || null);
  const [loading, setLoading] = useState(!initialPegawai);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetail = useCallback(async () => {
    const targetId = pegawaiId || initialPegawai?.pegawai_id;
    if (!targetId) return;

    try {
      if (!initialPegawai) setLoading(true);

      let fetchedPegawai: any = null;

      // 1. Coba query lengkap dengan relasi (select nested)
      try {
        const res = await apiClient.get("/pegawai", {
          params: {
            pegawai_id: `eq.${targetId}`,
            select: "*,pegawai_lembaga(lembaga_id,lembaga(lembaga_id,nama_lembaga,singkatan)),kelas_wali(kelas_id,nama_kelas,lembaga(singkatan))",
          },
        });
        const rawData = res.data?.data || res.data;
        fetchedPegawai = Array.isArray(rawData) ? rawData[0] : rawData;
      } catch (_) {
        // Fallback jika query relasi nested tidak didukung
        try {
          const resSimple = await apiClient.get("/pegawai", {
            params: { pegawai_id: `eq.${targetId}` },
          });
          const rawDataSimple = resSimple.data?.data || resSimple.data;
          fetchedPegawai = Array.isArray(rawDataSimple) ? rawDataSimple[0] : rawDataSimple;
        } catch (_) {}
      }

      if (fetchedPegawai && typeof fetchedPegawai === "object") {
        // 2. Fallback pegawai_lembaga jika relasi belum terisi
        if (!fetchedPegawai.pegawai_lembaga || fetchedPegawai.pegawai_lembaga.length === 0) {
          try {
            const plRes = await apiClient.get("/pegawai_lembaga", {
              params: {
                pegawai_id: `eq.${targetId}`,
                select: "lembaga_id,lembaga(lembaga_id,nama_lembaga,singkatan)",
              },
            });
            const plData = plRes.data?.data || plRes.data || [];
            if (Array.isArray(plData) && plData.length > 0) {
              fetchedPegawai.pegawai_lembaga = plData;
            }
          } catch (_) {}
        }

        // 3. Fallback kelas_wali jika data wali kelas belum terisi
        if (!fetchedPegawai.kelas_wali || fetchedPegawai.kelas_wali.length === 0) {
          try {
            const kwRes = await apiClient.get("/kelas", {
              params: {
                wali_kelas_id: `eq.${targetId}`,
                select: "kelas_id,nama_kelas,lembaga(singkatan,nama_lembaga)",
              },
            });
            const kwData = kwRes.data?.data || kwRes.data || [];
            if (Array.isArray(kwData) && kwData.length > 0) {
              fetchedPegawai.kelas_wali = kwData;
            }
          } catch (_) {}
        }

        // 4. Ambil akun user & hak akses jika ada user_id
        if (fetchedPegawai.user_id) {
          try {
            const [userRes, roleRes] = await Promise.allSettled([
              apiClient.get("/user", {
                params: {
                  user_id: `eq.${fetchedPegawai.user_id}`,
                  select: "username,email",
                },
              }),
              apiClient.get("/user_role", {
                params: {
                  user_id: `eq.${fetchedPegawai.user_id}`,
                  select: "role(nama_role),lembaga(singkatan,nama_lembaga)",
                },
              }),
            ]);

            const userData =
              userRes.status === "fulfilled"
                ? Array.isArray(userRes.value.data)
                  ? userRes.value.data[0]
                  : userRes.value.data
                : null;
            const userRoles =
              roleRes.status === "fulfilled"
                ? Array.isArray(roleRes.value.data)
                  ? roleRes.value.data
                  : [roleRes.value.data]
                : [];

            fetchedPegawai.user = {
              username: userData?.username || fetchedPegawai.user?.username || "",
              email: userData?.email || fetchedPegawai.user?.email || "",
              user_roles: userRoles.filter(Boolean),
            };
          } catch (_) {}
        }

        setPegawai((prev) => ({ ...(prev || {}), ...fetchedPegawai }));
      }
    } catch (err: any) {
      console.warn("Gagal memuat detail pegawai:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pegawaiId, initialPegawai]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetail();
  };

  const handleCall = (phone?: string) => {
    if (!phone) return;
    const clean = phone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${clean}`).catch(() => {});
  };

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return;
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.substring(1);
    }
    Linking.openURL(`https://wa.me/${clean}`).catch(() => {});
  };

  const handleEmail = (email?: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {});
  };

  const formatTanggalIndo = (tgl?: string) => {
    if (!tgl) return "-";
    try {
      const d = new Date(tgl);
      if (isNaN(d.getTime())) return tgl;
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (_) {
      return tgl;
    }
  };

  const getUmur = (tgl?: string) => {
    if (!tgl) return null;
    try {
      const birth = new Date(tgl);
      if (isNaN(birth.getTime())) return null;
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
      return age >= 0 ? `${age} tahun` : null;
    } catch (_) {
      return null;
    }
  };

  const jk = (pegawai?.jenis_kelamin || "").toUpperCase();
  const isMale = jk === "L" || jk.includes("LAKI");
  const isAktif = (pegawai?.status || "Aktif").toLowerCase() === "aktif";

  // Lembaga daftar
  const lembagas =
    pegawai?.pegawai_lembaga
      ?.map((pl) => pl.lembaga?.nama_lembaga || pl.lembaga?.singkatan)
      .filter(Boolean) || [];

  return (
    <View style={styles.container}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#162E6E" />

      {/* ─── HEADER ─── */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Detail Pegawai</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {pegawai?.nama || "Informasi Profil & Kepegawaian"}
              </Text>
            </View>

            <View style={styles.headerRightPlaceholder} />
          </View>
        </SafeAreaView>
      </View>

      {loading && !pegawai ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#162E6E" />
          <Text style={styles.loadingText}>Memuat detail data pegawai...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 36 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#162E6E"]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* ─── HERO PROFILE CARD ─── */}
          <View style={styles.heroCard}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: isMale ? "#DBEAFE" : "#FCE7F3" },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  { color: isMale ? "#1D4ED8" : "#BE185D" },
                ]}
              >
                {pegawai?.nama ? pegawai.nama.charAt(0) : "P"}
              </Text>
            </View>

            <Text style={styles.heroName}>{pegawai?.nama}</Text>

            <Text style={styles.heroJabatan}>
              {pegawai?.jabatan || "Tenaga Pendidik & Kependidikan"}
            </Text>

            <View style={styles.heroBadgesRow}>
              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  isAktif ? styles.statusBadgeAktif : styles.statusBadgeNonAktif,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isAktif ? "#10B981" : "#EF4444" },
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: isAktif ? "#065F46" : "#991B1B" },
                  ]}
                >
                  {pegawai?.status || "Aktif"}
                </Text>
              </View>

              {/* Gender Badge */}
              <View style={styles.genderBadge}>
                <User size={11} color="#64748B" />
                <Text style={styles.genderBadgeText}>
                  {isMale ? "Laki-laki" : "Perempuan"}
                </Text>
              </View>
            </View>

            {/* Quick Contact Buttons */}
            <View style={styles.quickContactRow}>
              {pegawai?.no_hp && (
                <>
                  <TouchableOpacity
                    style={[styles.quickBtn, styles.quickBtnCall]}
                    onPress={() => handleCall(pegawai.no_hp)}
                    activeOpacity={0.8}
                  >
                    <Phone size={14} color="#FFFFFF" />
                    <Text style={styles.quickBtnText}>Telepon</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickBtn, styles.quickBtnWa]}
                    onPress={() => handleWhatsApp(pegawai.no_hp)}
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={14} color="#FFFFFF" />
                    <Text style={styles.quickBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                </>
              )}

              {(pegawai?.user?.email || (pegawai as any)?.email) && (
                <TouchableOpacity
                  style={[styles.quickBtn, styles.quickBtnEmail]}
                  onPress={() =>
                    handleEmail(pegawai?.user?.email || (pegawai as any)?.email)
                  }
                  activeOpacity={0.8}
                >
                  <Mail size={14} color="#FFFFFF" />
                  <Text style={styles.quickBtnText}>Email</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ─── SECTION 1: INFORMASI KEPEGAWAIAN ─── */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <Briefcase size={16} color="#162E6E" />
              <Text style={styles.sectionTitle}>Informasi Kepegawaian</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Jabatan Utama</Text>
              <Text style={styles.infoValue}>{pegawai?.jabatan || "-"}</Text>
            </View>

            {pegawai?.tugas_tambahan ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tugas Tambahan</Text>
                <Text style={styles.infoValue}>{pegawai.tugas_tambahan}</Text>
              </View>
            ) : null}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nomor Induk Pegawai (NIP)</Text>
              <Text style={styles.infoValueBold}>{pegawai?.nip || "-"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nomor Induk Guru (NIG)</Text>
              <Text style={styles.infoValueBold}>{pegawai?.nig || "-"}</Text>
            </View>

            {pegawai?.nik ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nomor Induk Kependudukan (NIK)</Text>
                <Text style={styles.infoValue}>{pegawai.nik}</Text>
              </View>
            ) : null}

            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.infoLabel}>Unit Lembaga Bertugas</Text>
              <View style={styles.lembagaTagsContainer}>
                {lembagas.length > 0 ? (
                  lembagas.map((lem, idx) => (
                    <View key={idx} style={styles.lembagaPill}>
                      <Building2 size={12} color="#1E40AF" />
                      <Text style={styles.lembagaPillText}>{lem}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.infoValue}>-</Text>
                )}
              </View>
            </View>

            {pegawai?.kelas_wali && pegawai.kelas_wali.length > 0 && (
              <View style={[styles.infoRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F1F5F9" }]}>
                <Text style={styles.infoLabel}>Wali Kelas</Text>
                <View style={styles.lembagaTagsContainer}>
                  {pegawai.kelas_wali.map((kw, idx) => (
                    <View key={idx} style={[styles.lembagaPill, { backgroundColor: "#FEF3C7" }]}>
                      <School size={12} color="#D97706" />
                      <Text style={[styles.lembagaPillText, { color: "#92400E" }]}>
                        {kw.nama_kelas} {kw.lembaga?.singkatan ? `(${kw.lembaga.singkatan})` : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* ─── SECTION 2: BIODATA PRIBADI & KONTAK ─── */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <User size={16} color="#162E6E" />
              <Text style={styles.sectionTitle}>Biodata Pribadi & Kontak</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nomor WhatsApp / HP</Text>
              <TouchableOpacity
                onPress={() => handleCall(pegawai?.no_hp)}
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Phone size={13} color="#059669" />
                <Text style={[styles.infoValue, { color: "#059669", fontWeight: "700" }]}>
                  {pegawai?.no_hp || "-"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>
                {pegawai?.user?.email || (pegawai as any)?.email || "-"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tempat, Tanggal Lahir</Text>
              <Text style={styles.infoValue}>
                {pegawai?.tempat_lahir || pegawai?.tanggal_lahir
                  ? `${pegawai.tempat_lahir ? pegawai.tempat_lahir + ", " : ""}${formatTanggalIndo(pegawai.tanggal_lahir)}${getUmur(pegawai.tanggal_lahir) ? ` (${getUmur(pegawai.tanggal_lahir)})` : ""}`
                  : "-"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Golongan Darah</Text>
              <Text style={styles.infoValue}>{pegawai?.golongan_darah || "-"}</Text>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.infoLabel}>Alamat Tinggal</Text>
              <Text style={styles.infoValue}>{pegawai?.alamat || "-"}</Text>
            </View>
          </View>

          {/* ─── SECTION 3: INFORMASI KELUARGA ─── */}
          {(pegawai?.nama_ayah ||
            pegawai?.nama_ibu ||
            pegawai?.jumlah_anak_laki !== undefined ||
            pegawai?.jumlah_anak_perempuan !== undefined) && (
            <View style={styles.cardSection}>
              <View style={styles.sectionHeader}>
                <Users size={16} color="#162E6E" />
                <Text style={styles.sectionTitle}>Informasi Keluarga</Text>
              </View>

              {pegawai?.nama_ayah ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nama Ayah</Text>
                  <Text style={styles.infoValue}>{pegawai.nama_ayah}</Text>
                </View>
              ) : null}

              {pegawai?.nama_ibu ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nama Ibu</Text>
                  <Text style={styles.infoValue}>{pegawai.nama_ibu}</Text>
                </View>
              ) : null}

              <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.infoLabel}>Jumlah Tanggungan Anak</Text>
                <Text style={styles.infoValue}>
                  {pegawai?.jumlah_anak_laki || 0} Laki-laki,{" "}
                  {pegawai?.jumlah_anak_perempuan || 0} Perempuan
                </Text>
              </View>
            </View>
          )}

          {/* ─── SECTION 4: AKUN SISTEM (siMas) ─── */}
          {pegawai?.user && (
            <View style={styles.cardSection}>
              <View style={styles.sectionHeader}>
                <Shield size={16} color="#162E6E" />
                <Text style={styles.sectionTitle}>Akun Sistem siMas</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Username Login</Text>
                <Text style={styles.infoValueBold}>{pegawai.user.username || "-"}</Text>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.infoLabel}>Hak Akses / Peran Sistem</Text>
                <View style={styles.lembagaTagsContainer}>
                  {pegawai.user.user_roles && pegawai.user.user_roles.length > 0 ? (
                    pegawai.user.user_roles.map((ur, idx) => (
                      <View key={idx} style={[styles.lembagaPill, { backgroundColor: "#EEF2FF" }]}>
                        <Award size={12} color="#4338CA" />
                        <Text style={[styles.lembagaPillText, { color: "#3730A3" }]}>
                          {ur.role?.nama_role || "User"}{" "}
                          {ur.lembaga?.singkatan ? `(${ur.lembaga.singkatan})` : ""}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.infoValue}>Guru / Tenaga Pendidik</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#162E6E",
    paddingBottom: 14,
  },
  headerSafe: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 8 : 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: "#93C5FD",
    marginTop: 1,
  },
  headerRightPlaceholder: {
    width: 38,
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "900",
  },
  heroName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 4,
  },
  heroJabatan: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  heroBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeAktif: {
    backgroundColor: "#D1FAE5",
  },
  statusBadgeNonAktif: {
    backgroundColor: "#FEE2E2",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  genderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  genderBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  quickContactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
  },
  quickBtnCall: {
    backgroundColor: "#2563EB",
  },
  quickBtnWa: {
    backgroundColor: "#059669",
  },
  quickBtnEmail: {
    backgroundColor: "#7C3AED",
  },
  quickBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  /* Card Sections */
  cardSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  infoRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  infoLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "500",
  },
  infoValueBold: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "700",
  },
  lembagaTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  lembagaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lembagaPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },
});
