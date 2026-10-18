// mobile/src/screens/Pegawai/DaftarPegawaiScreen.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  ChevronRight,
  Search,
  UserCheck,
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  Users,
  School,
  ArrowRight,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { apiClient } from "../../api/client";
import { SwipeBackContainer } from "../../components/ui/SwipeBackContainer";
import { isDirekturRole, isKepalaSekolahRole } from "../../utils/permissions";
import { getJenjangLembagaIds, getJenjangDisplayName } from "../../utils/lembagaUtil";
import { FocusAwareStatusBar } from "../../components/ui/FocusAwareStatusBar";

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
  status?: string;
  pegawai_lembaga?: Array<{
    lembaga_id: number;
    lembaga?: LembagaItem;
  }>;
  user?: {
    username?: string;
    email?: string;
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

  // Baik Direktur maupun Kepala Sekolah:
  // Halaman awal belum memilih lembaga (null), baru setelah memilih list muncul
  const [selectedLembagaId, setSelectedLembagaId] = useState<number | null>(null);
  const [selectedGender, setSelectedGender] = useState<"ALL" | "L" | "P">("ALL");

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // IDs lembaga dalam 1 jenjang untuk kepala sekolah (misal MIPA & MIPI)
  const kepsekJenjangIds = useMemo(() => {
    return getJenjangLembagaIds(kepsekLembagaId, lembagaList);
  }, [kepsekLembagaId, lembagaList]);

  // Daftar lembaga yang dapat diakses:
  // Direktur: semua lembaga
  // Kepala Sekolah: unit lembaga dalam jenjang binaannya (misal MI PA & MI PI)
  const accessibleLembagas = useMemo(() => {
    if (isDirektur) return lembagaList;
    if (isKepsek) {
      if (kepsekJenjangIds.length > 0) {
        return lembagaList.filter((l) => kepsekJenjangIds.includes(l.lembaga_id));
      }
      if (kepsekLembagaId) {
        return lembagaList.filter((l) => Number(l.lembaga_id) === Number(kepsekLembagaId));
      }
    }
    return lembagaList;
  }, [isDirektur, isKepsek, kepsekJenjangIds, kepsekLembagaId, lembagaList]);

  // Nama lembaga yang sedang terpilih
  const selectedLembagaObj = useMemo(() => {
    if (!selectedLembagaId) return null;
    return lembagaList.find((l) => Number(l.lembaga_id) === Number(selectedLembagaId)) || null;
  }, [selectedLembagaId, lembagaList]);

  const displayJenjangTitle = useMemo(() => {
    if (selectedLembagaObj) {
      return selectedLembagaObj.singkatan || selectedLembagaObj.nama_lembaga;
    }
    if (isKepsek) {
      return getJenjangDisplayName(kepsekLembagaId, kepsekLembagaName);
    }
    return "Pilih Lembaga";
  }, [selectedLembagaObj, isKepsek, kepsekLembagaId, kepsekLembagaName]);

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

  // 2. Fetch Pegawai berdasarkan lembaga yang dipilih atau search
  const fetchPegawai = useCallback(
    async (lembagaId: number | null, query: string = "") => {
      // Jika belum pilih lembaga dan belum ada kata kunci pencarian, jangan load data massal agar cepat
      if (lembagaId === null && !query.trim()) {
        setPegawaiList([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let endpoint = "/pegawai?limit=300&order=nama.asc";

        if (lembagaId !== null) {
          endpoint += `&lembaga_id=eq.${lembagaId}`;
        } else if (isKepsek && kepsekJenjangIds.length > 0) {
          endpoint += `&lembaga_id=in.(${kepsekJenjangIds.join(",")})`;
        }

        if (query.trim() && lembagaId === null) {
          endpoint += `&nama=ilike.*${encodeURIComponent(query.trim())}*`;
        }

        const res = await apiClient.get(endpoint);
        let data: PegawaiItem[] = res.data?.data || res.data || [];

        // Fallback jika endpoint langsung /pegawai?lembaga_id kosong tapi ada di /pegawai_lembaga
        if (lembagaId !== null && data.length === 0) {
          try {
            const plRes = await apiClient.get(`/pegawai_lembaga?lembaga_id=eq.${lembagaId}&limit=300`);
            const plData = plRes.data?.data || plRes.data || [];
            if (Array.isArray(plData) && plData.length > 0) {
              const pList = plData
                .map((pl: any) => pl.pegawai)
                .filter(Boolean) as PegawaiItem[];
              if (pList.length > 0) {
                data = pList;
              }
            }
          } catch (_) {}
        }

        setPegawaiList(data);
      } catch (err: any) {
        console.warn("Gagal fetch pegawai:", err.message);
      } finally {
        setLoading(false);
      }
    },
    [isDirektur, isKepsek, kepsekJenjangIds]
  );

  // Inisialisasi awal
  useEffect(() => {
    fetchLembagas();
  }, [fetchLembagas]);

  // Fetch data pegawai ketika lembaga dipilih atau search berubah (debounced)
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (selectedLembagaId !== null) {
      // Jika lembaga sudah dipilih, fetch data lembaga tersebut
      fetchPegawai(selectedLembagaId, searchQuery);
    } else if (searchQuery.trim().length >= 2) {
      // Jika belum pilih lembaga tapi mencari nama pegawai lintas lembaga
      searchTimeoutRef.current = setTimeout(() => {
        fetchPegawai(null, searchQuery);
      }, 400);
    } else {
      setPegawaiList([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [selectedLembagaId, searchQuery, fetchPegawai]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchLembagas(),
      fetchPegawai(selectedLembagaId, searchQuery),
    ]);
    setRefreshing(false);
  };

  // Filter Pegawai di Client-side (Search & Gender)
  const filteredPegawai = useMemo(() => {
    return pegawaiList.filter((p) => {
      // 1. Filter Lembaga (Validasi Ganda: pegawai_lembaga & user_roles)
      if (selectedLembagaId !== null) {
        const matchPl = p.pegawai_lembaga?.some(
          (pl) => Number(pl.lembaga_id) === Number(selectedLembagaId)
        );
        const matchUr = p.user?.user_roles?.some(
          (ur) => Number(ur.lembaga?.lembaga_id) === Number(selectedLembagaId)
        );
        if (!matchPl && !matchUr) return false;
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
  }, [pegawaiList, selectedLembagaId, selectedGender, searchQuery]);

  // Gender Stats
  const genderStats = useMemo(() => {
    let lk = 0;
    let pr = 0;
    filteredPegawai.forEach((p) => {
      const jk = (p.jenis_kelamin || "").toUpperCase();
      if (jk === "L" || jk.includes("LAKI")) lk += 1;
      else if (jk === "P" || jk.includes("PEREMPUAN")) pr += 1;
    });
    return { total: filteredPegawai.length, lk, pr };
  }, [filteredPegawai]);

  const handleCall = (phone?: string) => {
    if (!phone) return;
    const clean = phone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${clean}`).catch(() => {});
  };

  const handleEmail = (email?: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {});
  };

  const handleSelectPegawai = (item: PegawaiItem) => {
    navigation.navigate("DetailPegawai", {
      pegawaiId: item.pegawai_id,
      pegawai: item,
    });
  };

  return (
    <SwipeBackContainer style={styles.container}>
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

      {/* ─── SEARCH BAR (Utama di bagian atas) ─── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              selectedLembagaId
                ? `Cari pegawai di ${selectedLembagaObj?.singkatan || "lembaga ini"}...`
                : "Cari nama, NIP, NIG, atau jabatan pegawai..."
            }
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={{ fontSize: 13, color: "#94A3B8", fontWeight: "600", paddingHorizontal: 4 }}>
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── FILTER LEMBAGA (DIREKTUR & KEPALA SEKOLAH - Tab Semua Lembaga Dihilangkan) ─── */}
        {accessibleLembagas.length > 0 && (
          <View style={styles.filterLembagaBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 2, gap: 8 }}
            >
              {accessibleLembagas.map((lem) => {
                const isSelected = selectedLembagaId === lem.lembaga_id;
                return (
                  <TouchableOpacity
                    key={lem.lembaga_id}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => {
                      // Toggle jika diklik ulang
                      if (isSelected) {
                        setSelectedLembagaId(null);
                      } else {
                        setSelectedLembagaId(lem.lembaga_id);
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <Building2
                      size={12}
                      color={isSelected ? "#FFFFFF" : "#64748B"}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {lem.singkatan || lem.nama_lembaga}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Gender Filter Chips (Hanya tampil jika lembaga sudah dipilih atau hasil pencarian ada) */}
        {(selectedLembagaId !== null || searchQuery.trim().length > 0) && (
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
        )}
      </View>

      {/* ─── KONTEN UTAMA ─── */}
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
            <Text style={styles.loadingText}>Memuat data pegawai lembaga...</Text>
          </View>
        ) : selectedLembagaId === null && !searchQuery.trim() ? (
          /* ─── HALAMAN AWAL (BELUM MEMILIH LEMBAGA - BERLAKU UNTUK DIREKTUR & KEPALA SEKOLAH) ─── */
          <View style={styles.initialStateContainer}>
            <View style={styles.initialCardHero}>
              <View style={styles.initialIconCircle}>
                <School size={36} color="#162E6E" />
              </View>
              <Text style={styles.initialTitle}>Pilih Unit Lembaga</Text>
              <Text style={styles.initialSubtitle}>
                {isDirektur
                  ? "Silakan pilih salah satu unit lembaga di bawah untuk memuat data pegawai dan guru, atau gunakan kolom pencarian di atas untuk mencari nama langsung."
                  : "Silakan pilih salah satu unit lembaga binaan Anda di bawah untuk memuat data pegawai dan guru, atau gunakan kolom pencarian di atas untuk mencari nama langsung."}
              </Text>
            </View>

            {/* Quick Grid Lembaga Cards */}
            <Text style={styles.lembagaSectionTitle}>
              {isDirektur ? "Daftar Unit Lembaga Maskumambang" : "Unit Lembaga Binaan Anda"}
            </Text>
            <View style={styles.lembagaGrid}>
              {accessibleLembagas.map((lem) => (
                <TouchableOpacity
                  key={lem.lembaga_id}
                  style={styles.lembagaCard}
                  onPress={() => setSelectedLembagaId(lem.lembaga_id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.lembagaCardIcon}>
                    <Building2 size={20} color="#162E6E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lembagaCardTitle} numberOfLines={1}>
                      {lem.singkatan || lem.nama_lembaga}
                    </Text>
                    <Text style={styles.lembagaCardSub} numberOfLines={1}>
                      {lem.nama_lembaga}
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : filteredPegawai.length === 0 ? (
          /* ─── EMPTY STATE JIKA HASIL TIDAK DITEMUKAN ─── */
          <View style={styles.emptyCard}>
            <Users size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Pegawai Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? `Tidak ada pegawai dengan kata kunci "${searchQuery}".`
                : "Belum ada data pegawai yang terdaftar pada lembaga ini."}
            </Text>
          </View>
        ) : (
          /* ─── LIST PEGAWAI (DAPAT DIKLIK KE DETAIL) ─── */
          <View style={styles.pegawaiListContainer}>
            {filteredPegawai.map((item) => {
              const jk = (item.jenis_kelamin || "").toUpperCase();
              const isMale = jk === "L" || jk.includes("LAKI");

              // Lembaga badges
              const lembagas =
                item.pegawai_lembaga
                  ?.map((pl) => pl.lembaga?.singkatan || pl.lembaga?.nama_lembaga)
                  .filter(Boolean) || [];

              return (
                <TouchableOpacity
                  key={item.pegawai_id}
                  style={styles.pegawaiCard}
                  onPress={() => handleSelectPegawai(item)}
                  activeOpacity={0.8}
                >
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
                      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <Text style={styles.pegawaiName} numberOfLines={2}>
                          {item.nama}
                        </Text>
                        <ChevronRight size={18} color="#CBD5E1" style={{ marginTop: 2 }} />
                      </View>

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
                </TouchableOpacity>
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
  headerRightBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Search & Filter Bar */
  searchContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    paddingVertical: 0,
  },
  filterLembagaBar: {
    marginTop: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    backgroundColor: "#162E6E",
    borderColor: "#162E6E",
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#475569",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  genderChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
  },
  genderChipActive: {
    backgroundColor: "#1E293B",
  },
  genderChipMale: {
    backgroundColor: "#EFF6FF",
  },
  genderChipMaleActive: {
    backgroundColor: "#2563EB",
  },
  genderChipFemale: {
    backgroundColor: "#FDF2F8",
  },
  genderChipFemaleActive: {
    backgroundColor: "#DB2777",
  },
  genderChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  genderChipTextActive: {
    color: "#FFFFFF",
  },

  /* Scroll Content */
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centerLoading: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },

  /* Initial State (Direktur belum pilih lembaga) */
  initialStateContainer: {
    paddingTop: 4,
  },
  initialCardHero: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  initialIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  initialTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  initialSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  lembagaSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 10,
    marginLeft: 2,
  },
  lembagaGrid: {
    gap: 8,
  },
  lembagaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    gap: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  lembagaCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  lembagaCardTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  lembagaCardSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },

  /* Empty State */
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },

  /* Pegawai Cards */
  pegawaiListContainer: {
    gap: 12,
  },
  pegawaiCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: "800",
  },
  cardInfoCol: {
    flex: 1,
  },
  pegawaiName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 19,
    flex: 1,
    paddingRight: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  metaText: {
    fontSize: 11.5,
    color: "#475569",
    fontWeight: "600",
    flex: 1,
  },
  subMetaText: {
    fontSize: 10.5,
    color: "#94A3B8",
    marginTop: 2,
    fontWeight: "500",
  },
  lembagaTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 6,
  },
  lembagaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lembagaTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1E40AF",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: "60%",
  },
  contactBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
