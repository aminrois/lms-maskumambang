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
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {
  Users,
  Plus,
  Search,
  X,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Check,
  AlertTriangle,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import {
  tahfidzService,
  HalaqahItem,
  TahfidzSiswaItem,
} from "../../api/tahfidzService";

export const TahfidzHalaqahScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [halaqahList, setHalaqahList] = useState<HalaqahItem[]>([]);
  const [guruList, setGuruList] = useState<any[]>([]);
  const [allSantriList, setAllSantriList] = useState<TahfidzSiswaItem[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Form Modal (Tambah / Edit) states
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editHalaqahId, setEditHalaqahId] = useState<number | null>(null);
  const [formNama, setFormNama] = useState<string>("");
  const [formUstadzId, setFormUstadzId] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<"Aktif" | "Tidak Aktif">("Aktif");
  const [formDeskripsi, setFormDeskripsi] = useState<string>("");
  const [formSelectedSiswaIds, setFormSelectedSiswaIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal selector helpers
  const [showUstadzPicker, setShowUstadzPicker] = useState<boolean>(false);
  const [showSantriPicker, setShowSantriPicker] = useState<boolean>(false);
  const [santriPickerSearch, setSantriPickerSearch] = useState<string>("");

  // Detail Modal
  const [detailHalaqah, setDetailHalaqah] = useState<HalaqahItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  const teacherPegawaiId = user?.pegawai?.pegawai_id;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [halaqahRes, guruRes, santriRes] = await Promise.allSettled([
        tahfidzService.getHalaqahList(),
        tahfidzService.getGuruTahfidzList(),
        tahfidzService.getSantriTahfidz(),
      ]);

      if (halaqahRes.status === "fulfilled") {
        setHalaqahList(halaqahRes.value || []);
      }
      if (guruRes.status === "fulfilled") {
        setGuruList(guruRes.value || []);
      }
      if (santriRes.status === "fulfilled") {
        setAllSantriList(santriRes.value || []);
      }
    } catch (err) {
      console.warn("Error fetching halaqah data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Open Form for Create
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditHalaqahId(null);
    setFormNama("");
    setFormUstadzId(teacherPegawaiId || (guruList[0]?.pegawai_id ?? null));
    setFormStatus("Aktif");
    setFormDeskripsi("");
    setFormSelectedSiswaIds([]);
    setShowFormModal(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (h: HalaqahItem) => {
    setIsEditing(true);
    setEditHalaqahId(h.halaqah_id);
    setFormNama(h.nama_halaqah);
    setFormUstadzId(h.pegawai?.pegawai_id || null);
    setFormStatus((h.status as any) || "Aktif");
    setFormDeskripsi(h.deskripsi || "");
    const existingSiswaIds = h.anggota?.map((a) => a.siswa_id) || [];
    setFormSelectedSiswaIds(existingSiswaIds);
    setShowFormModal(true);
  };

  // Save Form (Create or Update)
  const handleSaveHalaqah = async () => {
    if (!formNama.trim()) {
      Alert.alert("Peringatan", "Nama kelompok halaqoh wajib diisi.");
      return;
    }
    if (!formUstadzId) {
      Alert.alert("Peringatan", "Silakan pilih ustadz pengampu.");
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing && editHalaqahId) {
        await tahfidzService.updateHalaqah(editHalaqahId, {
          nama_halaqah: formNama.trim(),
          pegawai_id: formUstadzId,
          status: formStatus,
          deskripsi: formDeskripsi.trim(),
          siswa_ids: formSelectedSiswaIds,
        });
        Alert.alert("Berhasil", "Kelompok halaqoh berhasil diperbarui.");
      } else {
        await tahfidzService.createHalaqah({
          nama_halaqah: formNama.trim(),
          pegawai_id: formUstadzId,
          status: formStatus,
          deskripsi: formDeskripsi.trim(),
          siswa_ids: formSelectedSiswaIds,
        });
        Alert.alert("Berhasil", "Kelompok halaqoh baru berhasil dibuat.");
      }
      setShowFormModal(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Gagal menyimpan kelompok halaqoh.";
      Alert.alert("Gagal", msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Halaqah
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
              const msg = err.response?.data?.message || "Gagal menghapus kelompok halaqoh.";
              Alert.alert("Gagal", msg);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return halaqahList.filter((h) => {
      const q = searchQuery.toLowerCase().trim();
      const nama = h.nama_halaqah.toLowerCase();
      const ustadz = (h.pegawai?.nama || "").toLowerCase();
      const matchSearch = !q || nama.includes(q) || ustadz.includes(q);

      const matchStatus =
        statusFilter === "ALL" || h.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [halaqahList, searchQuery, statusFilter]);

  // Santri selection toggle
  const toggleSiswaSelection = (id: number) => {
    setFormSelectedSiswaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Filtered Santri in Picker
  const filteredSantriInPicker = useMemo(() => {
    if (!santriPickerSearch.trim()) return allSantriList;
    const q = santriPickerSearch.toLowerCase().trim();
    return allSantriList.filter(
      (s) => s.nama.toLowerCase().includes(q) || (s.nis || "").toLowerCase().includes(q)
    );
  }, [allSantriList, santriPickerSearch]);

  const selectedUstadzObj = guruList.find((g) => g.pegawai_id === formUstadzId);

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Action & Search Bar */}
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {["ALL", "Aktif", "Tidak Aktif"].map((s) => {
              const isSelected = statusFilter === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setStatusFilter(s)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
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
                      Pengampu: <Text style={{ fontWeight: "700" }}>{h.pegawai?.nama || "Ustadz"}</Text>
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

                {h.deskripsi ? (
                  <Text style={styles.deskripsiText}>{h.deskripsi}</Text>
                ) : null}

                {/* Anggota Preview */}
                <View style={styles.anggotaPreviewRow}>
                  <View style={styles.santriCountPill}>
                    <Users size={13} color="#2563EB" />
                    <Text style={styles.santriCountText}>{anggotaCount} Santri Anggota</Text>
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

                {/* Card Actions (Edit & Hapus) */}
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
              {/* Nama Halaqah */}
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

              {/* Ustadz Pengampu */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ustadz Pengampu *</Text>
                <TouchableOpacity
                  style={styles.pickerSelector}
                  onPress={() => setShowUstadzPicker(true)}
                >
                  <Text style={styles.pickerSelectorText}>
                    {selectedUstadzObj?.nama || "Pilih Ustadz Pengampu"}
                  </Text>
                  <ChevronDown size={16} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Status */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status Halaqoh</Text>
                <View style={styles.statusOptionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.statusOptionBtn,
                      formStatus === "Aktif" && styles.statusOptionActive,
                    ]}
                    onPress={() => setFormStatus("Aktif")}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        formStatus === "Aktif" && styles.statusOptionTextActive,
                      ]}
                    >
                      Aktif
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusOptionBtn,
                      formStatus === "Tidak Aktif" && styles.statusOptionActive,
                    ]}
                    onPress={() => setFormStatus("Tidak Aktif")}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        formStatus === "Tidak Aktif" && styles.statusOptionTextActive,
                      ]}
                    >
                      Tidak Aktif
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Deskripsi */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Catatan / Deskripsi (Opsional)</Text>
                <TextInput
                  style={[styles.formInput, { height: 60 }]}
                  placeholder="Keterangan kelompok halaqoh..."
                  placeholderTextColor="#94A3B8"
                  value={formDeskripsi}
                  onChangeText={setFormDeskripsi}
                  multiline
                />
              </View>

              {/* Pilih Santri Anggota */}
              <View style={styles.formGroup}>
                <View style={styles.santriSelectorHeader}>
                  <Text style={styles.formLabel}>
                    Santri Anggota ({formSelectedSiswaIds.length} Terpilih)
                  </Text>
                  <TouchableOpacity
                    style={styles.kelolaSantriBtn}
                    onPress={() => setShowSantriPicker(true)}
                  >
                    <UserCheck size={14} color="#2563EB" />
                    <Text style={styles.kelolaSantriText}>Pilih Santri</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.santriHelpText}>
                  Santri yang dipilih akan dimasukkan ke dalam kelompok halaqoh ini.
                </Text>
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
          PICKER MODAL: PILIH USTADZ PENGAMPU
      ═══════════════════════════════════════════════════════════ */}
      <Modal visible={showUstadzPicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: "70%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Ustadz Pengampu</Text>
              <TouchableOpacity onPress={() => setShowUstadzPicker(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {guruList.map((g) => (
                <TouchableOpacity
                  key={g.pegawai_id}
                  style={[
                    styles.pickerItem,
                    formUstadzId === g.pegawai_id && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setFormUstadzId(g.pegawai_id);
                    setShowUstadzPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      formUstadzId === g.pegawai_id && styles.pickerItemTextActive,
                    ]}
                  >
                    {g.nama}
                  </Text>
                  {formUstadzId === g.pegawai_id && (
                    <Check size={16} color="#2563EB" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          PICKER MODAL: MULTI-SELECT SANTRI ANGGOTA
      ═══════════════════════════════════════════════════════════ */}
      <Modal visible={showSantriPicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: "85%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Santri Anggota</Text>
              <TouchableOpacity onPress={() => setShowSantriPicker(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBoxInModal}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama santri..."
                placeholderTextColor="#94A3B8"
                value={santriPickerSearch}
                onChangeText={setSantriPickerSearch}
              />
            </View>

            <FlatList
              data={filteredSantriInPicker}
              keyExtractor={(item) => String(item.siswa_id)}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
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
                        {item.kelas?.nama_kelas || "Kelas"} • NIS: {item.nis || item.nisn || "-"}
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
                      <Text style={styles.anggotaItemName}>{ang.siswa?.nama || "Santri"}</Text>
                      <Text style={styles.anggotaItemMeta}>
                        NIS: {ang.siswa?.nis || ang.siswa?.nisn || "-"} • Kelas:{" "}
                        {ang.siswa?.kelas?.nama_kelas || "-"}
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
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  topActionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    alignItems: "center",
  },
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
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
  },
  tambahBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  tambahBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  filterSection: {
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  chipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
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
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 260,
  },
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
    marginBottom: 6,
  },
  halaqahName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  ustadzName: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  deskripsiText: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 10,
    lineHeight: 16,
  },
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
  santriCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  santriCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
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
  actionBtnEditText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
  },
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
  actionBtnDeleteText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  modalScroll: {
    padding: 16,
    gap: 14,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
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
  pickerSelectorText: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600",
  },
  statusOptionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusOptionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  statusOptionActive: {
    backgroundColor: "#2563EB",
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  statusOptionTextActive: {
    color: "#FFFFFF",
  },
  santriSelectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kelolaSantriBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  kelolaSantriText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  santriHelpText: {
    fontSize: 11,
    color: "#64748B",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  pickerItemActive: {
    backgroundColor: "#EFF6FF",
  },
  pickerItemText: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "500",
  },
  pickerItemTextActive: {
    color: "#2563EB",
    fontWeight: "700",
  },
  searchBoxInModal: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  santriCheckItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  santriCheckItemActive: {
    backgroundColor: "#F8FAFC",
  },
  santriCheckName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  santriCheckMeta: {
    fontSize: 11,
    color: "#64748B",
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  detailAnggotaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 10,
  },
  anggotaNumCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  anggotaNumText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  anggotaItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  anggotaItemMeta: {
    fontSize: 11,
    color: "#64748B",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
});
