// mobile/src/screens/Pegawai/DaftarPegawaiScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
  Linking,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  Search,
  UserCheck,
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  Sparkles,
  Users,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { apiClient } from "../../api/client";
import { SwipeBackContainer } from "../../components/ui/SwipeBackContainer";
import { isDirekturRole, isKepalaSekolahRole } from "../../utils/permissions";
import { getJenjangLembagaIds, getJenjangDisplayName } from "../../utils/lembagaUtil";

interface LembagaItem {
  lembaga_id: number;
  nama_lembaga: string;
  singkatan?: string;
}

interface PegawaiItem {
  pegawai_id: number;
  nama: string;
  nip?: string;
  nig?: string;
  jabatan?: string;
  jenis_kelamin?: string;
  no_hp?: string;
  email?: string;
  foto?: string;
  pegawai_lembaga?: Array<{
    lembaga_id: number;
    lembaga?: LembagaItem;
  }>;
  user?: {
    username?: string;
    user_roles?: Array<{
      role?: {
        nama_role: string;
      };
      lembaga?: LembagaItem;
    }>;
  };
}

export const DaftarPegawaiScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, activeRole } = useAuthStore();

  const isDirektur = isDirekturRole(activeRole || user);
  const isKepsek = isKepalaSekolahRole(activeRole || user);

  // Ambil lembaga_id efektif Kepala Sekolah jika bukan Direktur
  const kepsekLembagaId =
    activeRole?.lembaga_id ||
    activeRole?.lembaga?.lembaga_id ||
    (user as any)?.lembaga_id ||
    (user as any)?.pegawai?.pegawai_lembaga?.[0]?.lembaga_id ||
    (user as any)?.pegawai?.lembaga_id ||
    null;

  const kepsekLembagaName =
    activeRole?.lembaga?.singkatan ||
    activeRole?.lembaga?.nama_lembaga ||
    (user as any)?.lembaga?.singkatan ||
    (user as any)?.lembaga?.nama_lembaga ||
    (user as any)?.pegawai?.pegawai_lembaga?.[0]?.lembaga?.singkatan ||
    "";

  const [pegawaiList, setPegawaiList] = useState<PegawaiItem[]>([]);
  const [lembagaList, setLembagaList] = useState<LembagaItem[]>([]);
  // null = Semua lembaga (khusus Direktur), number = filter lembaga tertentu
  const [selectedLembagaId, setSelectedLembagaId] = useState<number | null>(
    isDirektur ? null : kepsekLembagaId
  );
  const [selectedGender, setSelectedGender] = useState<"ALL" | "L" | "P">("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // IDs lembaga dalam 1 jenjang untuk kepala sekolah (misal MIPA & MIPI)
  const kepsekJenjangIds = useMemo(() => {
    return getJenjangLembagaIds(kepsekLembagaId, lembagaList);
  }, [kepsekLembagaId, lembagaList]);

  const displayJenjangTitle = useMemo(() => {
    if (isDirektur) return "Semua Lembaga";
    return getJenjangDisplayName(kepsekLembagaId, kepsekLembagaName);
  }, [isDirektur, kepsekLembagaId, kepsekLembagaName]);

  // 1. Fetch Lembaga
  const fetchLembagas = useCallback(async () => {
    try {
      const res = await apiClient.get("/lembaga?order=lembaga_id.asc");
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setLembagaList(data);
      }
    } catch (err: any) {
      console.warn("Gagal fetch lembaga:", err.message);
    }
  }, []);

  // 2. Fetch Pegawai
  const fetchPegawai = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/pegawai?limit=500&order=nama.asc");
      const data: PegawaiItem[] = res.data?.data || res.data || [];
      setPegawaiList(data);
    } catch (err: any) {
      console.warn("Gagal fetch pegawai:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLembagas();
    fetchPegawai();
  }, [fetchLembagas, fetchPegawai]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLembagas(), fetchPegawai()]);
    setRefreshing(false);
  };

  // Filter Pegawai berdasarkan Lembaga (1 Jenjang untuk Kepsek), Gender, & Search
  const filteredPegawai = useMemo(() => {
    return pegawaiList.filter((p) => {
      // 1. Filter Lembaga
      if (isKepsek && kepsekJenjangIds.length > 0) {
        // Kepala Sekolah menampilkan pegawai yang tercatat pada 1 JENJANG yang dipimpin (Laki-laki & Perempuan, misal MIPA + MIPI)
        const matchLembaga = p.pegawai_lembaga?.some((pl) =>
          kepsekJenjangIds.includes(pl.lembaga_id)
        );
        if (!matchLembaga) return false;
      } else if (isDirektur && selectedLembagaId !== null) {
        // Direktur memilih filter lembaga tertentu
        const matchLembaga = p.pegawai_lembaga?.some(
          (pl) => pl.lembaga_id === selectedLembagaId
        );
        if (!matchLembaga) return false;
      }

      // 2. Filter Gender (L / P)
      if (selectedGender !== "ALL") {
        const jk = (p.jenis_kelamin || "").toUpperCase();
        const isMale = jk === "L" || jk.includes("LAKI");
        if (selectedGender === "L" && !isMale) return false;
        if (selectedGender === "P" && isMale) return false;
      }

      // 3. Filter Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchNama = p.nama.toLowerCase().includes(q);
      const matchNip = p.nip?.toLowerCase().includes(q);
      const matchNig = p.nig?.toLowerCase().includes(q);
      const matchJabatan = p.jabatan?.toLowerCase().includes(q);
      return matchNama || matchNip || matchNig || matchJabatan;
    });
  }, [
    pegawaiList,
    isKepsek,
    kepsekJenjangIds,
    isDirektur,
    selectedLembagaId,
    selectedGender,
    searchQuery,
  ]);

  // Gender Stats dari daftar pegawai yang relevan
  const genderStats = useMemo(() => {
    let lk = 0;
    let pr = 0;
    // Hitung berdasarkan filter lembaga yang aktif
    const pool = pegawaiList.filter((p) => {
      if (isKepsek && kepsekJenjangIds.length > 0) {
        return p.pegawai_lembaga?.some((pl) => kepsekJenjangIds.includes(pl.lembaga_id));
      }
      if (isDirektur && selectedLembagaId !== null) {
        return p.pegawai_lembaga?.some((pl) => pl.lembaga_id === selectedLembagaId);
      }
      return true;
    });

    pool.forEach((p) => {
      const jk = (p.jenis_kelamin || "").toUpperCase();
      if (jk === "L" || jk.includes("LAKI")) lk += 1;
      else if (jk === "P" || jk.includes("PEREMPUAN")) pr += 1;
    });

    return { total: pool.length, lk, pr };
  }, [pegawaiList, isKepsek, kepsekJenjangIds, isDirektur, selectedLembagaId]);

  const handleCall = (phone?: string) => {
    if (!phone) return;
    const clean = phone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${clean}`).catch(() => {});
  };

  const handleEmail = (email?: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {});
  };

  return (
    <SwipeBackContainer style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#162E6E" />
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
              <Text style={styles.headerTitle}>Data Pegawai & Guru</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {displayJenjangTitle} • {genderStats.total} Pegawai
              </Text>
            </View>

            <View style={styles.headerRightBadge}>
              <UserCheck size={18} color="#93C5FD" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ─── FILTER LEMBAGA (KHUSUS DIREKTUR) ─── */}
      {isDirektur && lembagaList.length > 0 && (
        <View style={styles.filterLembagaBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <TouchableOpacity
              style={[
                styles.chip,
                selectedLembagaId === null && styles.chipActive,
              ]}
              onPress={() => setSelectedLembagaId(null)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedLembagaId === null && styles.chipTextActive,
                ]}
              >
                Semua Lembaga
              </Text>
            </TouchableOpacity>

            {lembagaList.map((lem) => (
              <TouchableOpacity
                key={lem.lembaga_id}
                style={[
                  styles.chip,
                  selectedLembagaId === lem.lembaga_id && styles.chipActive,
                ]}
                onPress={() => setSelectedLembagaId(lem.lembaga_id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedLembagaId === lem.lembaga_id && styles.chipTextActive,
                  ]}
                >
                  {lem.singkatan || lem.nama_lembaga}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ─── SEARCH & GENDER FILTER BAR ─── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama, NIP, NIG, atau jabatan..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={{ fontSize: 13, color: "#94A3B8", fontWeight: "600" }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Gender Filter Chips */}
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderChip, selectedGender === "ALL" && styles.genderChipActive]}
            onPress={() => setSelectedGender("ALL")}
          >
            <Text
              style={[
                styles.genderChipText,
                selectedGender === "ALL" && styles.genderChipTextActive,
              ]}
            >
              Semua ({genderStats.total})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderChip,
              styles.genderChipMale,
              selectedGender === "L" && styles.genderChipMaleActive,
            ]}
            onPress={() => setSelectedGender("L")}
          >
            <Text
              style={[
                styles.genderChipText,
                { color: "#1D4ED8" },
                selectedGender === "L" && styles.genderChipTextActive,
              ]}
            >
              Laki-laki ({genderStats.lk})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderChip,
              styles.genderChipFemale,
              selectedGender === "P" && styles.genderChipFemaleActive,
            ]}
            onPress={() => setSelectedGender("P")}
          >
            <Text
              style={[
                styles.genderChipText,
                { color: "#BE185D" },
                selectedGender === "P" && styles.genderChipTextActive,
              ]}
            >
              Perempuan ({genderStats.pr})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── LIST PEGAWAI ─── */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat data pegawai...</Text>
          </View>
        ) : filteredPegawai.length === 0 ? (
          <View style={styles.emptyCard}>
            <Users size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Pegawai Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>
              Tidak ada data pegawai yang sesuai dengan pencarian atau filter lembaga ini.
            </Text>
          </View>
        ) : (
          <View style={styles.pegawaiListContainer}>
            {filteredPegawai.map((item) => {
              const jk = (item.jenis_kelamin || "").toUpperCase();
              const isMale = jk === "L" || jk.includes("LAKI");

              // Lembaga badges
              const lembagas = item.pegawai_lembaga
                ?.map((pl) => pl.lembaga?.singkatan || pl.lembaga?.nama_lembaga)
                .filter(Boolean) || [];

              return (
                <View key={item.pegawai_id} style={styles.pegawaiCard}>
                  <View style={styles.cardTopRow}>
                    {/* Avatar */}
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
                        {item.nama ? item.nama.charAt(0) : "P"}
                      </Text>
                    </View>

                    {/* Main Info */}
                    <View style={styles.cardInfoCol}>
                      <Text style={styles.pegawaiName} numberOfLines={2}>
                        {item.nama}
                      </Text>

                      {/* Jabatan & NIP */}
                      <View style={styles.metaRow}>
                        <Briefcase size={12} color="#64748B" />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {item.jabatan || "Tenaga Pendidik"}
                        </Text>
                      </View>

                      {(item.nip || item.nig) && (
                        <Text style={styles.subMetaText}>
                          {item.nip ? `NIP: ${item.nip}` : `NIG: ${item.nig}`}
                        </Text>
                      )}

                      {/* Lembaga Badges */}
                      {lembagas.length > 0 && (
                        <View style={styles.lembagaTagsRow}>
                          {lembagas.map((lem, idx) => (
                            <View key={idx} style={styles.lembagaTag}>
                              <Building2 size={10} color="#1E40AF" />
                              <Text style={styles.lembagaTagText}>{lem}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Contact Action Footer */}
                  {(item.no_hp || item.email) && (
                    <View style={styles.cardFooter}>
                      {item.no_hp ? (
                        <TouchableOpacity
                          style={styles.contactBtn}
                          onPress={() => handleCall(item.no_hp)}
                          activeOpacity={0.7}
                        >
                          <Phone size={12} color="#059669" />
                          <Text style={[styles.contactBtnText, { color: "#059669" }]}>
                            {item.no_hp}
                          </Text>
                        </TouchableOpacity>
                      ) : null}

                      {item.email ? (
                        <TouchableOpacity
                          style={styles.contactBtn}
                          onPress={() => handleEmail(item.email)}
                          activeOpacity={0.7}
                        >
                          <Mail size={12} color="#2563EB" />
                          <Text style={[styles.contactBtnText, { color: "#2563EB" }]} numberOfLines={1}>
                            {item.email}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
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
    paddingTop: Platform.OS === "android" ? 12 : 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#93C5FD",
    marginTop: 2,
  },
  headerRightBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterLembagaBar: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: "#162E6E",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
    gap: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13.5,
    color: "#1E293B",
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  genderChipActive: {
    backgroundColor: "#162E6E",
  },
  genderChipMale: {
    backgroundColor: "#EFF6FF",
  },
  genderChipMaleActive: {
    backgroundColor: "#1D4ED8",
  },
  genderChipFemale: {
    backgroundColor: "#FDF2F8",
  },
  genderChipFemaleActive: {
    backgroundColor: "#BE185D",
  },
  genderChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  genderChipTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerLoading: {
    paddingVertical: 48,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748B",
  },
  emptyCard: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  pegawaiListContainer: {
    gap: 12,
  },
  pegawaiCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
  },
  cardInfoCol: {
    flex: 1,
  },
  pegawaiName: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
    marginLeft: 4,
  },
  subMetaText: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
  },
  lembagaTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  lembagaTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    gap: 4,
  },
  lembagaTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E40AF",
  },
  cardFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
