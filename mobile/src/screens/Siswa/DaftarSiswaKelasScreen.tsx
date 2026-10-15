// mobile/src/screens/Siswa/DaftarSiswaKelasScreen.tsx
// Daftar Siswa — Khusus Wali Kelas melihat dan memantau biodata seluruh siswa binaannya

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
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  Search,
  Users,
  User,
  ChevronRight,
  GraduationCap,
  Sparkles,
  X,
  Phone,
  Calendar,
  Building2,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { apiClient } from "../../api/client";
import { SwipeBackContainer } from "../../components/ui/SwipeBackContainer";
import { Card } from "../../components/ui/Card";
import { isWakaKurikulumOrAdminLembaga, canVerifikasiRpp, isDirekturRole, isKepalaSekolahRole } from "../../utils/permissions";
import { getJenjangLembagaIds, getJenjangDisplayName } from "../../utils/lembagaUtil";

interface KelasItem {
  kelas_id: number;
  nama_kelas: string;
  lembaga_id?: number;
}

interface LembagaFilterItem {
  lembaga_id: number;
  nama_lembaga: string;
  singkatan?: string;
}

interface SiswaItem {
  siswa_id: number;
  nama: string;
  nis?: string;
  nisn?: string;
  jenis_kelamin?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  foto?: string;
  kelas?: {
    kelas_id: number;
    nama_kelas: string;
    lembaga?: {
      nama_lembaga?: string;
      singkatan?: string;
    };
  };
  wali_murid?: {
    nama_lengkap?: string;
    no_hp?: string;
  };
}

export const DaftarSiswaKelasScreen = () => {
  const navigation = useNavigation<any>();
  const { user, activeRole } = useAuthStore();

  const isDirektur = isDirekturRole(activeRole || user);
  const isKepsek = isKepalaSekolahRole(activeRole || user);
  const isWakaOrAdmin = isWakaKurikulumOrAdminLembaga(activeRole || user);
  const isLeader = canVerifikasiRpp(activeRole || user);

  // Ambil lembaga_id efektif dari activeRole atau penugasan pegawai
  const effectiveLembagaId =
    activeRole?.lembaga_id ||
    activeRole?.lembaga?.lembaga_id ||
    (user as any)?.lembaga_id ||
    (user as any)?.pegawai?.pegawai_lembaga?.[0]?.lembaga_id ||
    (user as any)?.pegawai?.lembaga_id ||
    null;

  const effectiveLembagaName =
    activeRole?.lembaga?.singkatan ||
    activeRole?.lembaga?.nama_lembaga ||
    (user as any)?.lembaga?.singkatan ||
    (user as any)?.lembaga?.nama_lembaga ||
    (user as any)?.pegawai?.pegawai_lembaga?.[0]?.lembaga?.singkatan ||
    (user as any)?.pegawai?.pegawai_lembaga?.[0]?.lembaga?.nama_lembaga ||
    "";

  // State Lembaga untuk Direktur (null = belum memilih di awal, 0 = Semua Lembaga di akhir, >0 = Lembaga tertentu)
  const [lembagaList, setLembagaList] = useState<LembagaFilterItem[]>([]);
  const [selectedLembagaId, setSelectedLembagaId] = useState<number | null>(
    isDirektur ? null : effectiveLembagaId
  );

  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  // -1 = Semua Kelas di lembaga ini, >0 = kelas tertentu
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(-1);

  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [loadingKelas, setLoadingKelas] = useState(isDirektur ? false : true);
  const [loadingSiswa, setLoadingSiswa] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const pegawaiId = (user as any)?.pegawai?.pegawai_id || (user as any)?.pegawai_id;

  // IDs lembaga dalam 1 jenjang untuk kepala sekolah (misal MIPA & MIPI)
  const kepsekJenjangIds = useMemo(() => {
    return getJenjangLembagaIds(effectiveLembagaId, lembagaList);
  }, [effectiveLembagaId, lembagaList]);

  const displayJenjangTitle = useMemo(() => {
    if (isDirektur) {
      if (selectedLembagaId === 0) return "Semua Lembaga";
      if (selectedLembagaId) {
        const found = lembagaList.find((l) => l.lembaga_id === selectedLembagaId);
        return found?.singkatan || found?.nama_lembaga || "Lembaga Terpilih";
      }
      return "Pilih Lembaga";
    }
    return getJenjangDisplayName(effectiveLembagaId, effectiveLembagaName);
  }, [isDirektur, selectedLembagaId, lembagaList, effectiveLembagaId, effectiveLembagaName]);

  // 1. Fetch Daftar Lembaga
  useEffect(() => {
    apiClient
      .get("/lembaga?order=lembaga_id.asc")
      .then((res) => {
        const data = res.data?.data || res.data || [];
        if (Array.isArray(data)) setLembagaList(data);
      })
      .catch(() => {});
  }, []);

  // 2. Fetch Kelas (sesuai filter lembaga Direktur atau 1 jenjang Kepala Sekolah)
  const fetchKelasWali = useCallback(async () => {
    // Untuk Direktur: jika belum memilih lembaga (null), jangan load kelas
    if (isDirektur && selectedLembagaId === null) {
      setKelasList([]);
      setLoadingKelas(false);
      return;
    }

    try {
      setLoadingKelas(true);
      let foundClasses: KelasItem[] = [];

      if (isDirektur) {
        if (selectedLembagaId === 0) {
          // Direktur memilih "Semua Lembaga" (di tab terakhir)
          const res = await apiClient.get("/kelas?order=nama_kelas.asc&limit=200");
          const data = res.data?.data || res.data;
          if (Array.isArray(data)) foundClasses = data;
        } else if (selectedLembagaId) {
          // Direktur memilih lembaga tertentu
          const res = await apiClient.get(`/kelas?lembaga_id=${selectedLembagaId}&order=nama_kelas.asc`);
          const data = res.data?.data || res.data;
          if (Array.isArray(data)) foundClasses = data;
        }
      } else if (isKepsek && kepsekJenjangIds.length > 0) {
        // Kepala Sekolah memuat seluruh kelas dalam 1 jenjang yang dipimpin (misal MI PA & MI PI)
        const idsParam = kepsekJenjangIds.join(",");
        const res = await apiClient.get(`/kelas?lembaga_id=${idsParam}&order=nama_kelas.asc`);
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) foundClasses = data;
      } else if (effectiveLembagaId) {
        // Pimpinan / Waka lembaga tertentu
        const res = await apiClient.get(`/kelas?lembaga_id=${effectiveLembagaId}&order=nama_kelas.asc`);
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) foundClasses = data;
      }

      // Prioritas tambahan: Cek cache kelas wali
      if (foundClasses.length === 0 && !isDirektur && !isKepsek) {
        const cached = (user as any)?.pegawai?.kelas_wali;
        if (Array.isArray(cached) && cached.length > 0) {
          foundClasses = cached;
        }
      }

      // Prioritas tambahan: Cari kelas berdasarkan wali_kelas_id
      if (foundClasses.length === 0 && pegawaiId && !isDirektur && !isKepsek) {
        try {
          const res = await apiClient.get(`/kelas?wali_kelas_id=${pegawaiId}`);
          const data = res.data?.data || res.data;
          if (Array.isArray(data) && data.length > 0) {
            foundClasses = data;
          }
        } catch (_) {}
      }

      setKelasList(foundClasses);

      // Default ke Semua Kelas (-1) untuk pimpinan/direktur/kepsek/waka/admin, atau kelas pertama jika wali kelas
      if (isDirektur || isKepsek || isWakaOrAdmin || isLeader) {
        setSelectedKelasId((prev) => (prev !== null ? prev : -1));
      } else if (foundClasses.length > 0) {
        setSelectedKelasId((prev) =>
          prev && foundClasses.some((k) => k.kelas_id === prev) ? prev : foundClasses[0].kelas_id
        );
      }
    } catch (err: any) {
      console.warn("Gagal fetch kelas:", err.message);
    } finally {
      setLoadingKelas(false);
    }
  }, [pegawaiId, user, activeRole, isDirektur, selectedLembagaId, isKepsek, kepsekJenjangIds, effectiveLembagaId, isWakaOrAdmin, isLeader]);

  // 3. Fetch Siswa dalam kelas atau seluruh siswa lembaga/jenjang
  const fetchSiswa = useCallback(async () => {
    // Khusus Direktur di awal jika belum memilih lembaga
    if (isDirektur && selectedLembagaId === null) {
      if (!searchQuery.trim()) {
        setSiswaList([]);
        setLoadingSiswa(false);
        return;
      }
      // Fitur search di awal: jika mengetik sebelum pilih lembaga, cari langsung ke DB
      try {
        setLoadingSiswa(true);
        const q = encodeURIComponent(searchQuery.trim());
        const res = await apiClient.get(`/siswa?nama=ilike.%25${q}%25&limit=100&order=nama.asc`);
        const data: SiswaItem[] = res.data?.data || res.data || [];
        setSiswaList(data);
      } catch (err: any) {
        console.warn("Gagal search siswa di awal:", err.message);
      } finally {
        setLoadingSiswa(false);
      }
      return;
    }

    if (selectedKelasId === null) {
      setSiswaList([]);
      return;
    }

    try {
      setLoadingSiswa(true);
      let url = "";

      if (selectedKelasId === -1) {
        // Semua Siswa
        if (isDirektur) {
          if (selectedLembagaId === 0) {
            // Tab "Semua Lembaga" di bagian akhir
            url = `/siswa?limit=1000&order=nama.asc`;
          } else if (selectedLembagaId) {
            // Direktur filter ke lembaga tertentu
            url = `/siswa?kelas.lembaga_id=eq.${selectedLembagaId}&limit=500&order=nama.asc`;
          }
        } else if (isKepsek && kepsekJenjangIds.length > 0) {
          // Kepala Sekolah: SEMUA SISWA 1 JENJANG (Laki-laki & Perempuan, misal MI PA & MI PI)
          if (kepsekJenjangIds.length > 1) {
            url = `/siswa?kelas.lembaga_id=in.(${kepsekJenjangIds.join(",")})&limit=500&order=nama.asc`;
          } else {
            url = `/siswa?kelas.lembaga_id=eq.${kepsekJenjangIds[0]}&limit=500&order=nama.asc`;
          }
        } else if (effectiveLembagaId) {
          url = `/siswa?kelas.lembaga_id=eq.${effectiveLembagaId}&limit=500&order=nama.asc`;
        } else {
          url = `/siswa?limit=300&order=nama.asc`;
        }
      } else if (selectedKelasId > 0) {
        // Siswa per kelas tertentu
        url = `/siswa?kelas_id=${selectedKelasId}&limit=200&order=nama.asc`;
      }

      if (url) {
        const res = await apiClient.get(url);
        const data: SiswaItem[] = res.data?.data || res.data || [];
        setSiswaList(data);
      }
    } catch (err: any) {
      console.warn("Gagal fetch siswa:", err.message);
    } finally {
      setLoadingSiswa(false);
    }
  }, [selectedKelasId, isDirektur, selectedLembagaId, searchQuery, isKepsek, kepsekJenjangIds, effectiveLembagaId]);

  useEffect(() => {
    fetchKelasWali();
  }, [fetchKelasWali]);

  useEffect(() => {
    if (selectedKelasId !== null) {
      fetchSiswa();
    }
  }, [selectedKelasId, fetchSiswa]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchKelasWali();
    if (selectedKelasId) {
      await fetchSiswa();
    }
    setRefreshing(false);
  };

  const currentKelas = useMemo(() => {
    return kelasList.find((k) => k.kelas_id === selectedKelasId);
  }, [kelasList, selectedKelasId]);

  // Filtered siswa by search
  const filteredSiswa = useMemo(() => {
    if (!searchQuery.trim()) return siswaList;
    const q = searchQuery.toLowerCase();
    return siswaList.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q)) ||
        (s.nis && s.nis.toLowerCase().includes(q))
    );
  }, [siswaList, searchQuery]);

  // Gender metrics
  const genderStats = useMemo(() => {
    let lk = 0;
    let pr = 0;
    siswaList.forEach((s) => {
      const jk = (s.jenis_kelamin || "").toUpperCase();
      if (jk === "L" || jk.includes("LAKI")) lk += 1;
      else if (jk === "P" || jk.includes("PEREMPUAN")) pr += 1;
    });
    return { lk, pr, total: siswaList.length };
  }, [siswaList]);

  const handleOpenDetail = (siswaId: number, nama: string) => {
    navigation.navigate("WaliDetailSantri", {
      siswaId,
      nama,
    });
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
              <Text style={styles.headerTitle}>Daftar Siswa</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {displayJenjangTitle} •{" "}
                {selectedKelasId === -1
                  ? `Semua Siswa (${genderStats.total})`
                  : currentKelas
                  ? `Kelas ${currentKelas.nama_kelas} (${genderStats.total} Siswa)`
                  : `Total: ${genderStats.total} Siswa`}
              </Text>
            </View>

            <View style={styles.headerRightBadge}>
              <Users size={18} color="#93C5FD" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ─── 1. SEARCH & METRICS BAR (DIPERTAHANKAN DI AWAL) ─── */}
      <View style={styles.topFilterBar}>
        <View style={styles.searchBar}>
          <Search size={15} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              isDirektur && selectedLembagaId === null
                ? "Cari nama / NISN santri..."
                : "Cari nama atau NISN santri..."
            }
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={15} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Quick Gender Badges (Hanya tampil jika ada data atau lembaga dipilih) */}
        {(!isDirektur || selectedLembagaId !== null || searchQuery.trim().length > 0) && (
          <View style={styles.genderRow}>
            <View style={styles.genderBadge}>
              <Text style={styles.genderBadgeText}>Total: {genderStats.total}</Text>
            </View>
            <View style={[styles.genderBadge, { backgroundColor: "#DBEAFE" }]}>
              <Text style={[styles.genderBadgeText, { color: "#1D4ED8" }]}>L: {genderStats.lk}</Text>
            </View>
            <View style={[styles.genderBadge, { backgroundColor: "#FCE7F3" }]}>
              <Text style={[styles.genderBadgeText, { color: "#BE185D" }]}>P: {genderStats.pr}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ─── 2. SELECTOR LEMBAGA (KHUSUS DIREKTUR: SEMUA LEMBAGA DI BAGIAN TERAKHIR) ─── */}
      {isDirektur && (
        <View style={styles.lembagaSelectorBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {/* Lembaga Spesifik Terlebih Dahulu */}
            {lembagaList.map((lem) => (
              <TouchableOpacity
                key={lem.lembaga_id}
                style={[
                  styles.lembagaChip,
                  selectedLembagaId === lem.lembaga_id && styles.lembagaChipActive,
                ]}
                onPress={() => {
                  setSelectedLembagaId(lem.lembaga_id);
                  setSelectedKelasId(-1);
                }}
              >
                <Text
                  style={[
                    styles.lembagaChipText,
                    selectedLembagaId === lem.lembaga_id && styles.lembagaChipTextActive,
                  ]}
                >
                  {lem.singkatan || lem.nama_lembaga}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Tab Semua Lembaga diletakkan di BAGIAN TERAKHIR */}
            <TouchableOpacity
              style={[
                styles.lembagaChip,
                selectedLembagaId === 0 && styles.lembagaChipActive,
              ]}
              onPress={() => {
                setSelectedLembagaId(0);
                setSelectedKelasId(-1);
              }}
            >
              <Text
                style={[
                  styles.lembagaChipText,
                  selectedLembagaId === 0 && styles.lembagaChipTextActive,
                ]}
              >
                Semua Lembaga
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* ─── 3. SELECTOR KELAS (JIKA LEMBAGA SUDAH DIPILIH / BUKAN DIREKTUR) ─── */}
      {(!isDirektur || selectedLembagaId !== null) && (isWakaOrAdmin || isLeader || kelasList.length > 0) && (
        <View style={styles.classSelectorBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {/* Opsi Semua Siswa / Semua Kelas */}
            {(isDirektur || isWakaOrAdmin || isLeader) && (
              <TouchableOpacity
                style={[
                  styles.classChip,
                  selectedKelasId === -1 && styles.classChipActive,
                ]}
                onPress={() => setSelectedKelasId(-1)}
              >
                <Text
                  style={[
                    styles.classChipText,
                    selectedKelasId === -1 && styles.classChipTextActive,
                  ]}
                >
                  Semua Kelas
                </Text>
              </TouchableOpacity>
            )}

            {kelasList.map((k) => (
              <TouchableOpacity
                key={k.kelas_id}
                style={[
                  styles.classChip,
                  selectedKelasId === k.kelas_id && styles.classChipActive,
                ]}
                onPress={() => setSelectedKelasId(k.kelas_id)}
              >
                <Text
                  style={[
                    styles.classChipText,
                    selectedKelasId === k.kelas_id && styles.classChipTextActive,
                  ]}
                >
                  Kelas {k.nama_kelas}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ─── 4. STUDENT LIST ─── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isDirektur && selectedLembagaId === null && !searchQuery.trim() ? (
          /* Placeholder Ramah jika Direktur belum memilih lembaga */
          <View style={styles.initialSelectCard}>
            <View style={styles.initialIconCircle}>
              <Building2 size={36} color="#1D4ED8" />
            </View>
            <Text style={styles.initialTitle}>Pilih Lembaga Terlebih Dahulu</Text>
            <Text style={styles.initialSubtitle}>
              Silakan pilih salah satu lembaga di atas untuk memuat daftar santri dan kelas, atau gunakan kolom pencarian di atas untuk mencari santri langsung.
            </Text>
          </View>
        ) : loadingKelas || loadingSiswa ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat daftar siswa...</Text>
          </View>
        ) : filteredSiswa.length === 0 ? (
          <View style={styles.emptyCard}>
            <Users size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Siswa Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>Tidak ada siswa yang sesuai kriteria pencarian.</Text>
          </View>
        ) : (
          <View style={styles.siswaListContainer}>
            {filteredSiswa.map((item, index) => {
              const jk = (item.jenis_kelamin || "").toUpperCase();
              const isMale = jk === "L" || jk.includes("LAKI");

              return (
                <TouchableOpacity
                  key={item.siswa_id}
                  style={styles.studentCard}
                  onPress={() => handleOpenDetail(item.siswa_id, item.nama)}
                  activeOpacity={0.7}
                >
                  <View style={styles.studentCardRow}>
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
                        {item.nama.charAt(0)}
                      </Text>
                    </View>

                    {/* Information */}
                    <View style={styles.studentInfoCol}>
                      <View style={styles.nameRow}>
                        <Text style={styles.studentName} numberOfLines={1}>
                          {item.nama}
                        </Text>
                        <View
                          style={[
                            styles.genderTag,
                            { backgroundColor: isMale ? "#EFF6FF" : "#FDF2F8" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.genderTagText,
                              { color: isMale ? "#2563EB" : "#DB2777" },
                            ]}
                          >
                            {isMale ? "L" : "P"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.studentMetaText}>
                        {item.kelas?.nama_kelas ? `Kelas ${item.kelas.nama_kelas} • ` : ""}NISN: {item.nisn || "-"} • NIS: {item.nis || "-"}
                      </Text>

                      {item.wali_murid?.nama_lengkap ? (
                        <Text style={styles.waliMetaText} numberOfLines={1}>
                          Wali: {item.wali_murid.nama_lengkap}
                        </Text>
                      ) : null}
                    </View>

                    {/* Chevron Detail */}
                    <View style={styles.chevronBox}>
                      <ChevronRight size={18} color="#94A3B8" />
                    </View>
                  </View>
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
  lembagaSelectorBar: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
  },
  lembagaChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  lembagaChipActive: {
    backgroundColor: "#1D4ED8",
    borderColor: "#1D4ED8",
  },
  lembagaChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E40AF",
  },
  lembagaChipTextActive: {
    color: "#FFFFFF",
  },
  classSelectorBar: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  classChipActive: {
    backgroundColor: "#162E6E",
  },
  classChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  classChipTextActive: {
    color: "#FFFFFF",
  },
  topFilterBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: "#1E293B",
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  genderBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  initialSelectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    marginTop: 10,
    elevation: 2,
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  initialIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  initialTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  initialSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  siswaListContainer: {
    gap: 10,
  },
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  studentCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
  },
  studentInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  studentName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  genderTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  genderTagText: {
    fontSize: 11,
    fontWeight: "700",
  },
  studentMetaText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },
  waliMetaText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  chevronBox: {
    marginLeft: 8,
  },
});
