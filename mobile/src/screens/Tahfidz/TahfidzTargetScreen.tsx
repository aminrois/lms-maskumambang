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
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import {
  tahfidzService,
  TahfidzSiswaItem,
} from "../../api/tahfidzService";

interface TargetItemData {
  target_id: number;
  siswa_id: number;
  kategori: "Al-Quran" | "Hadits" | "Matan Ilmu";
  target_nominal: number;
  target_deskripsi?: string;
  status: "Aktif" | "Tercapai" | "Ditunda";
}

export const TahfidzTargetScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [santriList, setSantriList] = useState<TahfidzSiswaItem[]>([]);
  const [targetsMap, setTargetsMap] = useState<Record<number, TargetItemData[]>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal Form (Tambah / Edit Target)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTargetId, setEditTargetId] = useState<number | null>(null);
  const [selectedSiswa, setSelectedSiswa] = useState<TahfidzSiswaItem | null>(null);

  // Form Fields
  const [formKategori, setFormKategori] = useState<"Al-Quran" | "Hadits" | "Matan Ilmu">("Al-Quran");
  const [formNominal, setFormNominal] = useState<string>("1");
  const [formDeskripsi, setFormDeskripsi] = useState<string>("");
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
      const map: Record<number, TargetItemData[]> = {};
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

  // Open Form for Add
  const handleOpenAdd = (siswa: TahfidzSiswaItem) => {
    setIsEditing(false);
    setEditTargetId(null);
    setSelectedSiswa(siswa);
    setFormKategori("Al-Quran");
    setFormNominal("1");
    setFormDeskripsi("");
    setFormStatus("Aktif");
    setShowModal(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (siswa: TahfidzSiswaItem, target: TargetItemData) => {
    setIsEditing(true);
    setEditTargetId(target.target_id);
    setSelectedSiswa(siswa);
    setFormKategori(target.kategori);
    setFormNominal(String(target.target_nominal || 1));
    setFormDeskripsi(target.target_deskripsi || "");
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

    try {
      setSubmitting(true);
      if (isEditing && editTargetId) {
        await tahfidzService.updateTarget(editTargetId, {
          kategori: formKategori,
          target_nominal: nominalNum,
          target_deskripsi: formDeskripsi.trim(),
          status: formStatus,
        });
        Alert.alert("Berhasil", "Target hafalan berhasil diperbarui.");
      } else {
        await tahfidzService.createTarget({
          siswa_id: selectedSiswa.siswa_id,
          kategori: formKategori,
          target_nominal: nominalNum,
          target_deskripsi: formDeskripsi.trim(),
          status: formStatus,
        });
        Alert.alert("Berhasil", "Target hafalan baru berhasil ditambahkan.");
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Gagal menyimpan target hafalan.";
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
                            {t.kategori === "Al-Quran"
                              ? "Juz"
                              : t.kategori === "Hadits"
                              ? "Hadits"
                              : "Bait"}
                          </Text>

                          {t.target_deskripsi ? (
                            <Text style={styles.targetDeskripsiText}>
                              "{t.target_deskripsi}"
                            </Text>
                          ) : null}

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
          MODAL FORM: SET / EDIT TARGET
      ═══════════════════════════════════════════════════════════ */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {isEditing ? "Edit Target Santri" : "Tambah Target Baru"}
                </Text>
                <Text style={styles.modalSub}>Santri: {selectedSiswa?.nama}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Kategori */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kategori Hafalan</Text>
                <View style={styles.kategoriRow}>
                  {(["Al-Quran", "Hadits", "Matan Ilmu"] as const).map((k) => (
                    <TouchableOpacity
                      key={k}
                      style={[
                        styles.kategoriBtn,
                        formKategori === k && styles.kategoriBtnActive,
                      ]}
                      onPress={() => setFormKategori(k)}
                    >
                      <Text
                        style={[
                          styles.kategoriBtnText,
                          formKategori === k && styles.kategoriBtnTextActive,
                        ]}
                      >
                        {k}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Target Nominal */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Target Jumlah (
                  {formKategori === "Al-Quran"
                    ? "Juz"
                    : formKategori === "Hadits"
                    ? "Hadits"
                    : "Bait"}
                  ) *
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Misal: 2"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={formNominal}
                  onChangeText={setFormNominal}
                />
              </View>

              {/* Deskripsi */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Keterangan / Rincian Target</Text>
                <TextInput
                  style={[styles.formInput, { height: 60 }]}
                  placeholder="Misal: Target Juz 30 & 29 s/d Akhir Semester"
                  placeholderTextColor="#94A3B8"
                  value={formDeskripsi}
                  onChangeText={setFormDeskripsi}
                  multiline
                />
              </View>

              {/* Status */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status Target</Text>
                <View style={styles.statusRow}>
                  {(["Aktif", "Tercapai", "Ditunda"] as const).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusBtn,
                        formStatus === st && styles.statusBtnActive,
                      ]}
                      onPress={() => setFormStatus(st)}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          formStatus === st && styles.statusBtnTextActive,
                        ]}
                      >
                        {st}
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
  statusBtnTextActive: {
    color: "#FFFFFF",
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
