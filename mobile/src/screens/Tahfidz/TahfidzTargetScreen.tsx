// mobile/src/screens/Tahfidz/TahfidzTargetScreen.tsx
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {
  Target,
  Plus,
  Search,
  X,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  BookOpen,
  ScrollText,
  Bookmark,
  TrendingUp,
  Calendar,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import {
  tahfidzService,
  TahfidzSiswaItem,
  TahfidzTargetItem,
} from "../../api/tahfidzService";

export const TahfidzTargetScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [santriList, setSantriList] = useState<TahfidzSiswaItem[]>([]);
  const [targetsMap, setTargetsMap] = useState<Record<number, TahfidzTargetItem[]>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal Form (Tambah / Edit Target)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTargetId, setEditTargetId] = useState<number | null>(null);
  const [selectedSiswa, setSelectedSiswa] = useState<TahfidzSiswaItem | null>(null);

  // Form Fields - Sesuai Web (TargetSantri.tsx)
  const [formKategori, setFormKategori] = useState<"Al-Quran" | "Hadits" | "Matan Ilmu">("Al-Quran");
  const [formDeskripsi, setFormDeskripsi] = useState<string>("");
  const [formNominal, setFormNominal] = useState<string>("5");
  const [formSatuan, setFormSatuan] = useState<string>("Juz");
  const [formTanggalMulai, setFormTanggalMulai] = useState<string>(new Date().toISOString().split("T")[0]);
  const [formTanggalTarget, setFormTanggalTarget] = useState<string>("");
  const [formStatus, setFormStatus] = useState<"Aktif" | "Tercapai" | "Ditunda">("Aktif");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const teacherPegawaiId = user?.pegawai?.pegawai_id;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const santri = await tahfidzService.getSantriTahfidz({ pegawai_id: teacherPegawaiId });
      const santriArr: TahfidzSiswaItem[] = Array.isArray(santri) ? santri : [];
      setSantriList(santriArr);

      // Fetch targets for all students
      const map: Record<number, TahfidzTargetItem[]> = {};
      await Promise.allSettled(
        santriArr.map(async (s) => {
          try {
            const res = await tahfidzService.getTargetsBySiswa(s.siswa_id);
            map[s.siswa_id] = Array.isArray(res) ? res : [];
          } catch {
            map[s.siswa_id] = [];
          }
        })
      );
      setTargetsMap(map);
    } catch (err) {
      console.warn("Error fetching target data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacherPegawaiId]);

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Change Kategori (Sync satuan & default nominal like web)
  const handleKategoriChange = (cat: "Al-Quran" | "Hadits" | "Matan Ilmu") => {
    setFormKategori(cat);
    if (cat === "Al-Quran") {
      setFormSatuan("Juz");
      if (formNominal === "40" || formNominal === "50" || !formNominal) setFormNominal("5");
    } else if (cat === "Hadits") {
      setFormSatuan("Hadits");
      if (formNominal === "5" || !formNominal) setFormNominal("40");
    } else {
      setFormSatuan("Bait");
      if (formNominal === "5" || !formNominal) setFormNominal("50");
    }
  };

  // Open Form for Add
  const handleOpenAdd = (siswa: TahfidzSiswaItem) => {
    setIsEditing(false);
    setEditTargetId(null);
    setSelectedSiswa(siswa);
    setFormKategori("Al-Quran");
    setFormDeskripsi("");
    setFormNominal("5");
    setFormSatuan("Juz");
    setFormTanggalMulai(new Date().toISOString().split("T")[0]);
    setFormTanggalTarget("");
    setFormStatus("Aktif");
    setShowModal(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (siswa: TahfidzSiswaItem, target: TahfidzTargetItem) => {
    setIsEditing(true);
    setEditTargetId(target.target_id);
    setSelectedSiswa(siswa);
    setFormKategori(target.kategori);
    setFormDeskripsi(target.target_deskripsi || "");
    setFormNominal(String(target.target_nominal || 1));
    setFormSatuan(
      target.kategori === "Al-Quran"
        ? "Juz"
        : target.satuan || (target.kategori === "Hadits" ? "Hadits" : "Bait")
    );
    setFormTanggalMulai(
      target.tanggal_mulai ? target.tanggal_mulai.split("T")[0] : new Date().toISOString().split("T")[0]
    );
    setFormTanggalTarget(target.tanggal_target ? target.tanggal_target.split("T")[0] : "");
    setFormStatus(target.status || "Aktif");
    setShowModal(true);
  };

  // Save Target
  const handleSaveTarget = async () => {
    if (!selectedSiswa) return;
    const nominalNum = parseInt(formNominal, 10);
    if (isNaN(nominalNum) || nominalNum <= 0) {
      Alert.alert("Peringatan", "Target nominal harus berupa angka lebih dari 0.");
      return;
    }
    if (formKategori === "Al-Quran" && nominalNum > 30) {
      Alert.alert("Peringatan", "Target Juz Al-Qur'an maksimal 30 Juz.");
      return;
    }
    if (!formDeskripsi.trim()) {
      Alert.alert("Peringatan", "Deskripsi target hafalan wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<TahfidzTargetItem> = {
        siswa_id: selectedSiswa.siswa_id,
        kategori: formKategori,
        target_deskripsi: formDeskripsi.trim(),
        target_nominal: nominalNum,
        satuan: formSatuan,
        tanggal_mulai: formTanggalMulai,
        tanggal_target: formTanggalTarget.trim() ? formTanggalTarget.trim() : undefined,
        status: formStatus,
      };

      if (isEditing && editTargetId) {
        await tahfidzService.updateTarget(editTargetId, payload);
        Alert.alert("Berhasil", "Target hafalan berhasil diperbarui.");
      } else {
        await tahfidzService.createTarget(payload);
        Alert.alert("Berhasil", "Target hafalan baru berhasil ditambahkan.");
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Gagal menyimpan target hafalan.";
      Alert.alert("Gagal", msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Target
  const handleDeleteTarget = (targetId: number) => {
    Alert.alert(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus target hafalan ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await tahfidzService.deleteTarget(targetId);
              Alert.alert("Berhasil", "Target berhasil dihapus.");
              fetchData();
            } catch (err: any) {
              const msg = err.response?.data?.message || "Gagal menghapus target.";
              Alert.alert("Gagal", msg);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Filtered Santri
  const filteredSantri = useMemo(() => {
    if (!searchQuery.trim()) return santriList;
    const q = searchQuery.toLowerCase().trim();
    return santriList.filter(
      (s) => s.nama.toLowerCase().includes(q) || (s.nis || "").toLowerCase().includes(q)
    );
  }, [santriList, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Target Hafalan"
        subtitle="Rencana & capaian target hafalan santri binaan"
        showBack={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama atau NIS santri..."
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

        {/* Santri List with Targets */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat target santri...</Text>
          </View>
        ) : filteredSantri.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Target size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Santri Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>
              Belum ada santri binaan yang terdaftar atau sesuai kata kunci.
            </Text>
          </Card>
        ) : (
          filteredSantri.map((s) => {
            const targets = targetsMap[s.siswa_id] || [];

            return (
              <Card key={s.siswa_id} style={styles.santriCard}>
                <View style={styles.santriHeaderRow}>
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarText}>{s.nama.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.santriName}>{s.nama}</Text>
                    <Text style={styles.santriMeta}>
                      {s.kelas?.nama_kelas || "Kelas"} • NIS: {s.nis || s.nisn || "-"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.setTargetBtn}
                    onPress={() => handleOpenAdd(s)}
                    activeOpacity={0.8}
                  >
                    <Plus size={13} color="#2563EB" />
                    <Text style={styles.setTargetBtnText}>Set Target</Text>
                  </TouchableOpacity>
                </View>

                {/* Target Items List */}
                {targets.length === 0 ? (
                  <View style={styles.noTargetBox}>
                    <Text style={styles.noTargetText}>Belum ada target yang ditentukan</Text>
                  </View>
                ) : (
                  <View style={styles.targetsWrap}>
                    {targets.map((t) => {
                      const isTercapai = t.status === "Tercapai";
                      const isAktif = t.status === "Aktif";

                      return (
                        <View key={t.target_id} style={styles.targetItemCard}>
                          <View style={styles.targetItemHeader}>
                            <View style={styles.kategoriPill}>
                              <Text style={styles.kategoriPillText}>{t.kategori}</Text>
                            </View>
                            <Badge
                              label={t.status}
                              variant={isTercapai ? "success" : isAktif ? "primary" : "warning"}
                              size="sm"
                            />
                          </View>

                          <Text style={styles.targetNominalText}>
                            Target: {t.target_nominal}{" "}
                            {t.satuan ||
                              (t.kategori === "Al-Quran"
                                ? "Juz"
                                : t.kategori === "Hadits"
                                ? "Hadits"
                                : "Bait")}
                          </Text>

                          {t.target_deskripsi ? (
                            <Text style={styles.targetDeskripsiText}>
                              "{t.target_deskripsi}"
                            </Text>
                          ) : null}

                          {(t.tanggal_mulai || t.tanggal_target) && (
                            <View style={styles.targetDatesRow}>
                              <Calendar size={12} color="#64748B" />
                              <Text style={styles.targetDatesText}>
                                Mulai: {t.tanggal_mulai ? t.tanggal_mulai.split("T")[0] : "-"}
                                {t.tanggal_target
                                  ? ` • Selesai: ${t.tanggal_target.split("T")[0]}`
                                  : ""}
                              </Text>
                            </View>
                          )}

                          {/* Action Buttons */}
                          <View style={styles.targetActionsRow}>
                            <TouchableOpacity
                              style={styles.actionBtnEdit}
                              onPress={() => handleOpenEdit(s, t)}
                            >
                              <Edit3 size={12} color="#B45309" />
                              <Text style={styles.actionBtnEditText}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.actionBtnDelete}
                              onPress={() => handleDeleteTarget(t.target_id)}
                            >
                              <Trash2 size={12} color="#DC2626" />
                              <Text style={styles.actionBtnDeleteText}>Hapus</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════
          MODAL FORM: SET / EDIT TARGET (MATCHING WEB TARGETSANTRI)
      ═══════════════════════════════════════════════════════════ */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={styles.targetIconWrap}>
                  <Target size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {isEditing ? "Edit Target Hafalan" : "Target Hafalan Baru"}
                  </Text>
                  <Text style={styles.modalSub}>Santri: {selectedSiswa?.nama}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Kategori Hafalan */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kategori Hafalan</Text>
                <View style={styles.kategoriRow}>
                  {(
                    [
                      { key: "Al-Quran", label: "Al-Qur'an (Juz)" },
                      { key: "Hadits", label: "Hadits" },
                      { key: "Matan Ilmu", label: "Matan (Bait)" },
                    ] as const
                  ).map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.kategoriBtn,
                        formKategori === item.key && styles.kategoriBtnActive,
                      ]}
                      onPress={() => handleKategoriChange(item.key)}
                    >
                      <Text
                        style={[
                          styles.kategoriBtnText,
                          formKategori === item.key && styles.kategoriBtnTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Deskripsi Target */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Deskripsi Target <Text style={{ color: "#EF4444" }}>*</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={
                    formKategori === "Al-Quran"
                      ? "Contoh: Target 5 Juz (Juz 1 s/d 5) atau Target Juz 30"
                      : "Deskripsi target hafalan"
                  }
                  placeholderTextColor="#94A3B8"
                  value={formDeskripsi}
                  onChangeText={setFormDeskripsi}
                />
              </View>

              {/* Target Nominal & Satuan Parameter (2 Kolom) */}
              <View style={styles.twoColRow}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.formLabel}>
                    Jumlah Target ({formSatuan}) <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder={formKategori === "Al-Quran" ? "Contoh: 5" : "Jumlah target"}
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={formNominal}
                    onChangeText={setFormNominal}
                  />
                  {formKategori === "Al-Quran" && (
                    <Text style={styles.helperText}>Rentang 1 s/d 30 Juz</Text>
                  )}
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.formLabel}>Satuan Parameter</Text>
                  <View style={styles.fixedUnitBox}>
                    <Text style={styles.fixedUnitText}>{formSatuan}</Text>
                    <View style={styles.fixedBadge}>
                      <Text style={styles.fixedBadgeText}>Fixed</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Tanggal Mulai & Tanggal Target Selesai (2 Kolom) */}
              <View style={styles.twoColRow}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.formLabel}>
                    Tanggal Mulai <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                    value={formTanggalMulai}
                    onChangeText={setFormTanggalMulai}
                  />
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.formLabel}>Target Selesai (Opsional)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                    value={formTanggalTarget}
                    onChangeText={setFormTanggalTarget}
                  />
                </View>
              </View>

              {/* Status Target */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status Target</Text>
                <View style={styles.statusCol}>
                  {(
                    [
                      { key: "Aktif", label: "Aktif (Sedang Berjalan)" },
                      { key: "Tercapai", label: "Tercapai (Selesai)" },
                      { key: "Ditunda", label: "Ditunda" },
                    ] as const
                  ).map((st) => (
                    <TouchableOpacity
                      key={st.key}
                      style={[
                        styles.statusSelectBtn,
                        formStatus === st.key && styles.statusSelectBtnActive,
                      ]}
                      onPress={() => setFormStatus(st.key)}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          formStatus === st.key && styles.radioCircleActive,
                        ]}
                      >
                        {formStatus === st.key && <View style={styles.radioDot} />}
                      </View>
                      <Text
                        style={[
                          styles.statusSelectBtnText,
                          formStatus === st.key && styles.statusSelectBtnTextActive,
                        ]}
                      >
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveTarget}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Simpan Target</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
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
  santriCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  santriHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2563EB",
  },
  santriName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  santriMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  setTargetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  setTargetBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  noTargetBox: {
    backgroundColor: "#F8FAFC",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  noTargetText: {
    fontSize: 11,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  targetsWrap: {
    gap: 8,
    marginTop: 4,
  },
  targetItemCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  targetItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  kategoriPill: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  kategoriPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#3730A3",
  },
  targetNominalText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  targetDeskripsiText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    fontStyle: "italic",
  },
  targetActionsRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "flex-end",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  actionBtnEdit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionBtnEditText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B45309",
  },
  actionBtnDelete: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionBtnDeleteText: {
    fontSize: 10,
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
    maxHeight: "85%",
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
  kategoriRow: {
    flexDirection: "row",
    gap: 6,
  },
  kategoriBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  kategoriBtnActive: {
    backgroundColor: "#2563EB",
  },
  kategoriBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  kategoriBtnTextActive: {
    color: "#FFFFFF",
  },
  statusRow: {
    flexDirection: "row",
    gap: 6,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  statusBtnActive: {
    backgroundColor: "#2563EB",
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  targetDatesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  targetDatesText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  targetIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  twoColRow: {
    flexDirection: "row",
    gap: 10,
  },
  helperText: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
  },
  fixedUnitBox: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fixedUnitText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  fixedBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fixedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  statusCol: {
    gap: 8,
  },
  statusSelectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusSelectBtnActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#93C5FD",
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#94A3B8",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleActive: {
    borderColor: "#2563EB",
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#2563EB",
  },
  statusSelectBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  statusSelectBtnTextActive: {
    color: "#1D4ED8",
    fontWeight: "700",
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
});
