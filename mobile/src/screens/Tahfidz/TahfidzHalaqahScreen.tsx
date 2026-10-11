// mobile/src/screens/Tahfidz/TahfidzHalaqahScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import {
  Users,
  Plus,
  Search,
  X,
  Edit3,
  Trash2,
  Eye,
  Check,
  UserCheck,
  Building2,
  ChevronDown,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import {
  tahfidzService,
  HalaqahItem,
  TahfidzSiswaItem,
} from "../../api/tahfidzService";

export const TahfidzHalaqahScreen = () => {
  const isFocused = useIsFocused();
  const { user, activeRole } = useAuthStore();

  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [halaqahList, setHalaqahList] = useState<HalaqahItem[]>([]);
  const [allSantriList, setAllSantriList] = useState<TahfidzSiswaItem[]>([]);
  const [masterLembagaList, setMasterLembagaList] = useState<any[]>([]);
  const [pengampuList, setPengampuList] = useState<any[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Form modal states
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editHalaqahId, setEditHalaqahId] = useState<number | null>(null);
  const [formNama, setFormNama] = useState<string>("");
  const [formLembagaId, setFormLembagaId] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<"Aktif" | "Tidak Aktif">("Aktif");
  const [formDeskripsi, setFormDeskripsi] = useState<string>("");
  const [formSelectedSiswaIds, setFormSelectedSiswaIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Picker modal states
  const [showLembagaPicker, setShowLembagaPicker] = useState<boolean>(false);
  const [showSantriPicker, setShowSantriPicker] = useState<boolean>(false);
  const [santriPickerSearch, setSantriPickerSearch] = useState<string>("");
  const [loadingSantriForm, setLoadingSantriForm] = useState<boolean>(false);

  // Detail modal
  const [detailHalaqah, setDetailHalaqah] = useState<HalaqahItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Derived values
  const teacherPegawaiId =
    (user as any)?.pegawai?.pegawai_id || (user as any)?.pegawai_id;
  const teacherName =
    (user as any)?.pegawai?.nama || (user as any)?.nama || "Ustadz Pengampu";

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [halaqahRes, santriRes, lembagaRes, pengampuRes] = await Promise.allSettled([
        tahfidzService.getHalaqahList(),
        tahfidzService.getSantriTahfidz(),
        tahfidzService.getLembagaList(),
        teacherPegawaiId
          ? tahfidzService.getPengampu({ pegawai_id: Number(teacherPegawaiId) })
          : tahfidzService.getPengampu(),
      ]);
      if (halaqahRes.status === "fulfilled") setHalaqahList(halaqahRes.value || []);
      if (santriRes.status === "fulfilled") setAllSantriList(santriRes.value || []);
      if (lembagaRes.status === "fulfilled") setMasterLembagaList(lembagaRes.value || []);
      if (pengampuRes.status === "fulfilled") setPengampuList(pengampuRes.value || []);
    } catch (err) {
      console.warn("Error fetching halaqah data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacherPegawaiId]);

  useEffect(() => {
    if (isFocused) fetchData();
  }, [isFocused, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ─── DAFTAR LEMBAGA YANG DIAMPU OLEH GURU TAHFIDZ ──────────────────────────
  const guruLembagaList = useMemo(() => {
    const map = new Map<number, { lembaga_id: number; nama: string }>();

    // 1. Dari activeRole jika guru sedang berada di konteks lembaga tertentu
    if (activeRole?.lembaga_id) {
      const lid = Number(activeRole.lembaga_id);
      const name =
        (activeRole.lembaga as any)?.nama_lembaga ||
        (activeRole.lembaga as any)?.nama ||
        activeRole.lembaga?.singkatan;
      if (name) map.set(lid, { lembaga_id: lid, nama: name });
    }

    // 2. Dari data tahfidz_pengampu (penugasan kelas guru tahfidz)
    if (Array.isArray(pengampuList)) {
      pengampuList.forEach((p: any) => {
        const lid = Number(p.lembaga_id || p.lembaga?.lembaga_id || p.kelas?.lembaga_id);
        const name =
          p.lembaga?.nama_lembaga ||
          p.lembaga?.nama ||
          p.kelas?.lembaga?.nama_lembaga ||
          p.kelas?.lembaga?.nama;
        if (lid && name) map.set(lid, { lembaga_id: lid, nama: name });
      });
    }

    // 3. Dari user.roles (role Guru Tahfidz dengan lembaga_id)
    if (user?.roles && Array.isArray(user.roles)) {
      user.roles.forEach((r: any) => {
        if (
          r.lembaga_id &&
          (r.nama_role?.toLowerCase().includes("tahfidz") ||
            r.nama_role?.toLowerCase().includes("guru"))
        ) {
          const lid = Number(r.lembaga_id);
          const name =
            r.lembaga?.nama_lembaga || r.lembaga?.nama || r.lembaga?.singkatan;
          if (name) map.set(lid, { lembaga_id: lid, nama: name });
        }
      });
    }

    // 4. Dari user.pegawai.pegawai_lembaga
    const plList = (user as any)?.pegawai?.pegawai_lembaga;
    if (Array.isArray(plList)) {
      plList.forEach((pl: any) => {
        const lid = Number(pl.lembaga_id || pl.lembaga?.lembaga_id);
        const name =
          pl.lembaga?.nama_lembaga || pl.lembaga?.nama || pl.lembaga?.singkatan;
        if (lid && name) map.set(lid, { lembaga_id: lid, nama: name });
      });
    }

    // 5. Dari data santri binaan yang sudah ada
    if (Array.isArray(allSantriList)) {
      allSantriList.forEach((s: any) => {
        const lid = Number(s.kelas?.lembaga?.lembaga_id || s.kelas?.lembaga_id);
        const name = s.kelas?.lembaga?.nama_lembaga || s.kelas?.lembaga?.nama;
        if (lid && name) map.set(lid, { lembaga_id: lid, nama: name });
      });
    }

    // 6. Dari data halaqah guru ini
    if (Array.isArray(halaqahList)) {
      halaqahList.forEach((h: any) => {
        const lid = Number(h.lembaga?.lembaga_id || (h as any).lembaga_id);
        const name = h.lembaga?.nama_lembaga || h.lembaga?.nama;
        if (lid && name) map.set(lid, { lembaga_id: lid, nama: name });
      });
    }

    // Jika ditemukan lembaga yang diampu, perkaya nama dengan masterLembagaList
    if (map.size > 0) {
      return Array.from(map.values()).map((item) => {
        const master = masterLembagaList.find(
          (m: any) => Number(m.lembaga_id) === Number(item.lembaga_id)
        );
        return {
          lembaga_id: item.lembaga_id,
          nama: master?.nama_lembaga || master?.nama || item.nama,
        };
      });
    }

    // Fallback jika belum ada data penugasan spesifik
    return masterLembagaList.map((l: any) => ({
      lembaga_id: l.lembaga_id,
      nama: l.nama_lembaga || l.nama,
    }));
  }, [activeRole, pengampuList, user, allSantriList, halaqahList, masterLembagaList]);

  // Default lembaga id untuk guru tahfidz ini
  const defaultTeacherLembagaId = useMemo(() => {
    if (activeRole?.lembaga_id) return Number(activeRole.lembaga_id);
    if (guruLembagaList.length > 0) return Number(guruLembagaList[0].lembaga_id);
    return masterLembagaList[0]?.lembaga_id ? Number(masterLembagaList[0].lembaga_id) : null;
  }, [activeRole, guruLembagaList, masterLembagaList]);

  // Objek lembaga yang terpilih di formulir
  const selectedLembagaObj = useMemo(() => {
    if (!formLembagaId) return null;
    return (
      guruLembagaList.find((l) => Number(l.lembaga_id) === Number(formLembagaId)) ||
      masterLembagaList.find((l) => Number(l.lembaga_id) === Number(formLembagaId)) ||
      null
    );
  }, [guruLembagaList, masterLembagaList, formLembagaId]);

  // Muat santri secara dinamis saat lembaga di form berubah
  useEffect(() => {
    if (formLembagaId && showFormModal) {
      let isMounted = true;
      setLoadingSantriForm(true);
      tahfidzService
        .getSantriTahfidz({ lembaga_id: Number(formLembagaId) })
        .then((res) => {
          if (!isMounted) return;
          if (Array.isArray(res) && res.length > 0) {
            setAllSantriList((prev) => {
              const map = new Map<number, TahfidzSiswaItem>();
              prev.forEach((s) => map.set(s.siswa_id, s));
              res.forEach((s) => map.set(s.siswa_id, s));
              return Array.from(map.values());
            });
          }
        })
        .catch((err) => console.warn("Fetch santri per lembaga error:", err))
        .finally(() => {
          if (isMounted) setLoadingSantriForm(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [formLembagaId, showFormModal]);

  // Filter list halaqah utama
  const filteredList = useMemo(() => {
    return halaqahList.filter((h) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        h.nama_halaqah.toLowerCase().includes(q) ||
        (h.pegawai?.nama || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || h.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [halaqahList, searchQuery, statusFilter]);

  // Santri terfilter sesuai lembaga yang dipilih & pencarian
  const filteredSantriInPicker = useMemo(() => {
    const list = formLembagaId
      ? allSantriList.filter((s: any) => {
          const sLid =
            s.kelas?.lembaga?.lembaga_id ||
            s.kelas?.lembaga_id ||
            s.lembaga_id;
          return Number(sLid) === Number(formLembagaId);
        })
      : allSantriList;

    const q = santriPickerSearch.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (s: any) =>
        s.nama?.toLowerCase().includes(q) ||
        (s.nis || "").toLowerCase().includes(q) ||
        (s.nisn || "").toLowerCase().includes(q) ||
        (s.kelas?.nama_kelas || "").toLowerCase().includes(q)
    );
  }, [allSantriList, santriPickerSearch, formLembagaId]);

  // Form Handlers
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditHalaqahId(null);
    setFormNama("");
    setFormLembagaId(defaultTeacherLembagaId);
    setFormStatus("Aktif");
    setFormDeskripsi("");
    setFormSelectedSiswaIds([]);
    setSantriPickerSearch("");
    setShowFormModal(true);
  };

  const handleOpenEdit = (h: HalaqahItem) => {
    setIsEditing(true);
    setEditHalaqahId(h.halaqah_id);
    setFormNama(h.nama_halaqah);
    const hLembagaId =
      h.lembaga?.lembaga_id ||
      (h as any).lembaga_id ||
      defaultTeacherLembagaId;
    setFormLembagaId(hLembagaId ? Number(hLembagaId) : null);
    setFormStatus(((h.status as any) || "Aktif") as "Aktif" | "Tidak Aktif");
    setFormDeskripsi(h.deskripsi || "");
    const existingSiswaIds = h.anggota?.map((a: any) => a.siswa_id || a.id) || [];
    setFormSelectedSiswaIds(existingSiswaIds);
    setSantriPickerSearch("");
    setShowFormModal(true);
  };

  const handleSaveHalaqah = async () => {
    if (!formNama.trim()) {
      Alert.alert("Peringatan", "Nama kelompok halaqoh wajib diisi.");
      return;
    }
    if (!formLembagaId) {
      Alert.alert("Peringatan", "Silakan pilih lembaga terlebih dahulu.");
      return;
    }
    if (!teacherPegawaiId) {
      Alert.alert("Peringatan", "Data ustadz pengampu tidak ditemukan.");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        nama_halaqah: formNama.trim(),
        lembaga_id: Number(formLembagaId),
        pegawai_id: Number(teacherPegawaiId),
        deskripsi: formDeskripsi.trim() || undefined,
        status: formStatus,
        siswa_ids: formSelectedSiswaIds,
      };
      if (isEditing && editHalaqahId) {
        await tahfidzService.updateHalaqah(editHalaqahId, payload);
        Alert.alert("Berhasil", "Kelompok halaqoh berhasil diperbarui.");
      } else {
        await tahfidzService.createHalaqah(payload);
        Alert.alert("Berhasil", "Kelompok halaqoh baru berhasil dibuat.");
      }
      setShowFormModal(false);
      fetchData();
    } catch (err: any) {
      console.error("Save halaqah error:", err.response?.data || err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Gagal menyimpan kelompok halaqoh.";
      Alert.alert("Gagal", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHalaqah = (h: HalaqahItem) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus kelompok halaqoh "${h.nama_halaqah}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await tahfidzService.deleteHalaqah(h.halaqah_id);
              Alert.alert("Berhasil", "Kelompok halaqoh berhasil dihapus.");
              fetchData();
            } catch (err: any) {
              const msg =
                err.response?.data?.message || "Gagal menghapus kelompok halaqoh.";
              Alert.alert("Gagal", msg);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const toggleSiswaSelection = (id: number) => {
    setFormSelectedSiswaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Kelompok Halaqoh"
        subtitle="Manajemen pembagian kelompok & santri binaan"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search & Tambah */}
        <View style={styles.topActionRow}>
          <View style={styles.searchBox}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari kelompok atau ustadz..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.tambahBtn}
            onPress={handleOpenCreate}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.tambahBtnText}>Tambah</Text>
          </TouchableOpacity>
        </View>

        {/* Status Filters */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
            {["ALL", "Aktif", "Tidak Aktif"].map((s) => {
              const isSelected = statusFilter === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setStatusFilter(s)}
                >
                  <Text
                    style={[styles.chipText, isSelected && styles.chipTextActive]}
                  >
                    {s === "ALL" ? "Semua Status" : s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Halaqah List */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat kelompok halaqoh...</Text>
          </View>
        ) : filteredList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Users size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Belum Ada Kelompok Halaqoh</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Tidak ditemukan kelompok halaqoh yang sesuai dengan pencarian."
                : "Klik tombol Tambah di atas untuk membuat kelompok halaqoh baru."}
            </Text>
          </Card>
        ) : (
          filteredList.map((h) => {
            const isAktif = h.status === "Aktif";
            const anggotaCount = h.anggota?.length || h._count?.anggota || 0;
            return (
              <Card key={h.halaqah_id} style={styles.halaqahCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.halaqahName}>{h.nama_halaqah}</Text>
                    <Text style={styles.ustadzName}>
                      Pengampu:{" "}
                      <Text style={{ fontWeight: "700" }}>
                        {h.pegawai?.nama || "Ustadz"}
                      </Text>
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isAktif ? "#ECFDF5" : "#FEF2F2",
                        borderColor: isAktif ? "#A7F3D0" : "#FECACA",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: isAktif ? "#065F46" : "#991B1B" },
                      ]}
                    >
                      {h.status || "Aktif"}
                    </Text>
                  </View>
                </View>

                {h.lembaga?.nama ? (
                  <View style={styles.lembagaRow}>
                    <Building2 size={11} color="#94A3B8" />
                    <Text style={styles.lembagaText}>{h.lembaga.nama}</Text>
                  </View>
                ) : null}

                {h.deskripsi ? (
                  <Text style={styles.deskripsiText}>{h.deskripsi}</Text>
                ) : null}

                <View style={styles.anggotaPreviewRow}>
                  <View style={styles.santriCountPill}>
                    <Users size={13} color="#2563EB" />
                    <Text style={styles.santriCountText}>
                      {anggotaCount} Santri Anggota
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => {
                      setDetailHalaqah(h);
                      setShowDetailModal(true);
                    }}
                  >
                    <Eye size={13} color="#2563EB" />
                    <Text style={styles.detailBtnText}>Lihat Santri</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtnEdit}
                    onPress={() => handleOpenEdit(h)}
                  >
                    <Edit3 size={13} color="#D97706" />
                    <Text style={styles.actionBtnEditText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtnDelete}
                    onPress={() => handleDeleteHalaqah(h)}
                  >
                    <Trash2 size={13} color="#DC2626" />
                    <Text style={styles.actionBtnDeleteText}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════
          MODAL FORM: TAMBAH / EDIT KELOMPOK HALAQOH
      ═══════════════════════════════════════════════════════════ */}
      <Modal visible={showFormModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Edit Kelompok Halaqoh" : "Tambah Kelompok Halaqoh"}
              </Text>
              <TouchableOpacity onPress={() => setShowFormModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Nama */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nama Kelompok Halaqoh *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Misal: Halaqoh Abu Bakar As-Siddiq"
                  placeholderTextColor="#94A3B8"
                  value={formNama}
                  onChangeText={setFormNama}
                />
              </View>

              {/* Lembaga - Disesuaikan dengan lembaga yang diampu */}
              <View style={styles.formGroup}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.formLabel}>Lembaga Diampu *</Text>
                  {guruLembagaList.length > 1 && (
                    <Text style={styles.pickerHintText}>
                      ({guruLembagaList.length} lembaga tersedia)
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.pickerSelector,
                    guruLembagaList.length <= 1 && styles.pickerSelectorSingle,
                  ]}
                  onPress={() => {
                    if (guruLembagaList.length > 1) {
                      setShowLembagaPicker(true);
                    }
                  }}
                  activeOpacity={guruLembagaList.length > 1 ? 0.7 : 1}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <Building2 size={16} color="#2563EB" />
                    <Text
                      style={[
                        styles.pickerSelectorText,
                        !selectedLembagaObj && { color: "#94A3B8", fontWeight: "400" },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedLembagaObj?.nama || "Pilih Lembaga Diampu"}
                    </Text>
                  </View>
                  {guruLembagaList.length > 1 ? (
                    <ChevronDown size={16} color="#64748B" />
                  ) : (
                    <View style={styles.fixedBadge}>
                      <Text style={styles.fixedBadgeText}>Diampu</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.santriHelpText}>
                  {guruLembagaList.length > 1
                    ? "Daftar santri akan otomatis menyesuaikan dengan lembaga yang dipilih."
                    : "Lembaga penugasan tahfidz yang Anda ampu."}
                </Text>
              </View>

              {/* Ustadz Pengampu - Fixed */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ustadz Pengampu</Text>
                <View style={[styles.formInput, styles.fixedField]}>
                  <Text style={styles.fixedFieldText}>{teacherName}</Text>
                  <View style={styles.fixedBadge}>
                    <Text style={styles.fixedBadgeText}>Auto</Text>
                  </View>
                </View>
              </View>

              {/* Status */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status Halaqoh</Text>
                <View style={styles.statusOptionsRow}>
                  {(["Aktif", "Tidak Aktif"] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusOptionBtn,
                        formStatus === s && styles.statusOptionActive,
                      ]}
                      onPress={() => setFormStatus(s)}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          formStatus === s && styles.statusOptionTextActive,
                        ]}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Deskripsi */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Catatan / Deskripsi (Opsional)</Text>
                <TextInput
                  style={[styles.formInput, { height: 70, textAlignVertical: "top" }]}
                  placeholder="Keterangan kelompok halaqoh..."
                  placeholderTextColor="#94A3B8"
                  value={formDeskripsi}
                  onChangeText={setFormDeskripsi}
                  multiline
                />
              </View>

              {/* Pilih Santri */}
              <View style={styles.formGroup}>
                <View style={styles.santriSelectorHeader}>
                  <Text style={styles.formLabel}>
                    Santri Anggota ({formSelectedSiswaIds.length} Terpilih)
                  </Text>
                  <TouchableOpacity
                    style={styles.kelolaSantriBtn}
                    onPress={() => {
                      setSantriPickerSearch("");
                      setShowSantriPicker(true);
                    }}
                  >
                    <UserCheck size={14} color="#2563EB" />
                    <Text style={styles.kelolaSantriText}>Pilih Santri</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.santriHelpText}>
                  {selectedLembagaObj
                    ? `Menampilkan santri dari ${selectedLembagaObj.nama}.`
                    : "Pilih lembaga terlebih dahulu untuk memfilter santri."}
                </Text>
                {formSelectedSiswaIds.length > 0 && (
                  <View style={styles.selectedSantriPreview}>
                    <Text style={styles.selectedSantriPreviewText}>
                      {formSelectedSiswaIds.length} santri dipilih
                    </Text>
                    <TouchableOpacity onPress={() => setFormSelectedSiswaIds([])}>
                      <Text style={styles.clearSantriText}>Hapus Semua</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowFormModal(false)}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveHalaqah}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Simpan Kelompok</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          PICKER MODAL: LEMBAGA DIAMPU
      ═══════════════════════════════════════════════════════════ */}
      <Modal visible={showLembagaPicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: "60%" }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Pilih Lembaga Diampu</Text>
                <Text style={styles.modalSub}>
                  Lembaga yang Anda ampu sebagai Guru Tahfidz
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowLembagaPicker(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 6 }}>
              {guruLembagaList.length === 0 ? (
                <Text style={[styles.emptySubtitle, { textAlign: "center" }]}>
                  Tidak ada lembaga yang diampu ditemukan.
                </Text>
              ) : (
                guruLembagaList.map((l) => {
                  const isSelected = Number(formLembagaId) === Number(l.lembaga_id);
                  return (
                    <TouchableOpacity
                      key={l.lembaga_id}
                      style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                      onPress={() => {
                        setFormLembagaId(Number(l.lembaga_id));
                        setFormSelectedSiswaIds([]);
                        setShowLembagaPicker(false);
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                        <Building2
                          size={18}
                          color={isSelected ? "#2563EB" : "#64748B"}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.pickerItemText,
                              isSelected && styles.pickerItemTextActive,
                            ]}
                          >
                            {l.nama}
                          </Text>
                          <Text style={styles.pickerItemSub}>
                            Lembaga Penugasan Guru
                          </Text>
                        </View>
                      </View>
                      {isSelected && <Check size={18} color="#2563EB" />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          PICKER MODAL: MULTI-SELECT SANTRI ANGGOTA
      ═══════════════════════════════════════════════════════════ */}
      <Modal visible={showSantriPicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: "88%" }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalTitle}>Pilih Santri Anggota</Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {formSelectedSiswaIds.length} santri dipilih ·{" "}
                  {selectedLembagaObj ? selectedLembagaObj.nama : "Semua"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSantriPicker(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBoxInModal}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama, kelas, atau NIS santri..."
                placeholderTextColor="#94A3B8"
                value={santriPickerSearch}
                onChangeText={setSantriPickerSearch}
              />
              {santriPickerSearch ? (
                <TouchableOpacity onPress={() => setSantriPickerSearch("")}>
                  <X size={14} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {loadingSantriForm ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={[styles.loadingText, { marginTop: 6 }]}>
                  Memuat santri {selectedLembagaObj?.nama || ""}...
                </Text>
              </View>
            ) : filteredSantriInPicker.length > 0 ? (
              <View style={styles.selectAllRow}>
                <Text style={styles.selectAllCount}>
                  {filteredSantriInPicker.length} santri tersedia
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const allIds = filteredSantriInPicker.map((s: any) => s.siswa_id);
                    const allSelected = allIds.every((id) =>
                      formSelectedSiswaIds.includes(id)
                    );
                    if (allSelected) {
                      setFormSelectedSiswaIds((prev) =>
                        prev.filter((id) => !allIds.includes(id))
                      );
                    } else {
                      setFormSelectedSiswaIds((prev) => [
                        ...new Set([...prev, ...allIds]),
                      ]);
                    }
                  }}
                >
                  <Text style={styles.selectAllBtn}>
                    {filteredSantriInPicker.every((s: any) =>
                      formSelectedSiswaIds.includes(s.siswa_id)
                    )
                      ? "Batalkan Semua"
                      : "Pilih Semua"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <FlatList
              data={filteredSantriInPicker}
              keyExtractor={(item: any) => String(item.siswa_id)}
              contentContainerStyle={{ padding: 16, paddingTop: 8 }}
              ListEmptyComponent={
                !loadingSantriForm ? (
                  <View style={[styles.emptyBox, { paddingVertical: 40 }]}>
                    <Users size={36} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>Belum Ada Santri</Text>
                    <Text style={styles.emptySubtitle}>
                      {formLembagaId
                        ? `Tidak ada santri di lembaga ${selectedLembagaObj?.nama || ""}.`
                        : "Pilih lembaga terlebih dahulu."}
                    </Text>
                  </View>
                ) : null
              }
              renderItem={({ item }: { item: any }) => {
                const isSelected = formSelectedSiswaIds.includes(item.siswa_id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.santriCheckItem,
                      isSelected && styles.santriCheckItemActive,
                    ]}
                    onPress={() => toggleSiswaSelection(item.siswa_id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.santriCheckName}>{item.nama}</Text>
                      <Text style={styles.santriCheckMeta}>
                        Kelas: {item.kelas?.nama_kelas || "-"} · NIS:{" "}
                        {item.nis || item.nisn || "-"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkBox,
                        isSelected && styles.checkBoxActive,
                      ]}
                    >
                      {isSelected && <Check size={14} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => setShowSantriPicker(false)}
              >
                <Text style={styles.saveBtnText}>
                  Selesai ({formSelectedSiswaIds.length} Terpilih)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          DETAIL MODAL: LIHAT SANTRI ANGGOTA
      ═══════════════════════════════════════════════════════════ */}
      <Modal visible={showDetailModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: "75%" }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{detailHalaqah?.nama_halaqah}</Text>
                <Text style={styles.modalSub}>
                  Pengampu: {detailHalaqah?.pegawai?.nama || "-"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {!detailHalaqah?.anggota || detailHalaqah.anggota.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Users size={36} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>Belum Ada Santri</Text>
                  <Text style={styles.emptySubtitle}>
                    Belum ada santri yang dimasukkan ke kelompok halaqoh ini.
                  </Text>
                </View>
              ) : (
                detailHalaqah.anggota.map((ang, idx) => (
                  <View key={ang.id || idx} style={styles.detailAnggotaRow}>
                    <View style={styles.anggotaNumCircle}>
                      <Text style={styles.anggotaNumText}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.anggotaItemName}>
                        {ang.siswa?.nama || "Santri"}
                      </Text>
                      <Text style={styles.anggotaItemMeta}>
                        NIS: {ang.siswa?.nis || ang.siswa?.nisn || "-"} · Kelas:{" "}
                        {(ang.siswa as any)?.kelas?.nama_kelas || "-"}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  topActionRow: { flexDirection: "row", gap: 8, marginBottom: 10, alignItems: "center" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#0F172A", padding: 0 },
  tambahBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  tambahBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  filterSection: { marginBottom: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  chipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  chipTextActive: { color: "#FFFFFF" },
  centerLoading: { paddingVertical: 40, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  emptyCard: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginTop: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#334155", marginTop: 10, textAlign: "center" },
  emptySubtitle: { fontSize: 12, color: "#64748B", textAlign: "center", marginTop: 6, lineHeight: 18, maxWidth: 260 },
  emptyBox: { alignItems: "center", paddingVertical: 32, gap: 8 },
  halaqahCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  halaqahName: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  ustadzName: { fontSize: 12, color: "#64748B", marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, marginLeft: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: "800" },
  lembagaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  lembagaText: { fontSize: 11, color: "#94A3B8" },
  deskripsiText: { fontSize: 12, color: "#64748B", marginBottom: 10, lineHeight: 16 },
  anggotaPreviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 10,
  },
  santriCountPill: { flexDirection: "row", alignItems: "center", gap: 6 },
  santriCountText: { fontSize: 12, fontWeight: "700", color: "#2563EB" },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailBtnText: { fontSize: 11, fontWeight: "700", color: "#2563EB" },
  cardActionsRow: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  actionBtnEdit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  actionBtnEditText: { fontSize: 11, fontWeight: "700", color: "#B45309" },
  actionBtnDelete: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  actionBtnDeleteText: { fontSize: 11, fontWeight: "700", color: "#DC2626" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainer: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "92%" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  modalSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  modalScroll: { padding: 16, gap: 14 },
  formGroup: { gap: 6 },
  formLabel: { fontSize: 12, fontWeight: "700", color: "#334155" },
  formInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0F172A",
  },
  fixedField: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fixedFieldText: { fontSize: 13, color: "#334155", fontWeight: "600", flex: 1 },
  fixedBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  fixedBadgeText: { fontSize: 10, fontWeight: "700", color: "#15803D" },
  pickerSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  pickerSelectorSingle: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  pickerSelectorText: { fontSize: 13, color: "#0F172A", fontWeight: "600" },
  pickerHintText: { fontSize: 11, color: "#2563EB", fontWeight: "600" },
  statusOptionsRow: { flexDirection: "row", gap: 8 },
  statusOptionBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: "#F1F5F9", alignItems: "center" },
  statusOptionActive: { backgroundColor: "#2563EB" },
  statusOptionText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  statusOptionTextActive: { color: "#FFFFFF" },
  santriSelectorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kelolaSantriBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  kelolaSantriText: { fontSize: 11, fontWeight: "700", color: "#2563EB" },
  santriHelpText: { fontSize: 11, color: "#64748B" },
  selectedSantriPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 4,
  },
  selectedSantriPreviewText: { fontSize: 12, fontWeight: "600", color: "#2563EB" },
  clearSantriText: { fontSize: 11, fontWeight: "700", color: "#DC2626" },
  modalFooter: { flexDirection: "row", padding: 16, borderTopWidth: 1, borderTopColor: "#E2E8F0", gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center" },
  cancelBtnText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  saveBtn: { flex: 2, paddingVertical: 11, borderRadius: 10, backgroundColor: "#2563EB", alignItems: "center" },
  saveBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  pickerItemActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  pickerItemText: { fontSize: 13, color: "#0F172A", fontWeight: "600" },
  pickerItemTextActive: { color: "#2563EB", fontWeight: "700" },
  pickerItemSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  searchBoxInModal: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  selectAllRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 10 },
  selectAllCount: { fontSize: 12, color: "#64748B" },
  selectAllBtn: { fontSize: 12, fontWeight: "700", color: "#2563EB" },
  santriCheckItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 10,
  },
  santriCheckItemActive: { backgroundColor: "#F8FAFF" },
  santriCheckName: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  santriCheckMeta: { fontSize: 11, color: "#64748B", marginTop: 1 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  detailAnggotaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 10,
  },
  anggotaNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  anggotaNumText: { fontSize: 11, fontWeight: "700", color: "#475569" },
  anggotaItemName: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  anggotaItemMeta: { fontSize: 11, color: "#64748B" },
});
