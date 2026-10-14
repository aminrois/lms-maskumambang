// mobile/src/screens/LMS/VerifikasiLessonPlanScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {
  BookMarked,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Layers,
  Calendar,
  Eye,
  Check,
  XCircle,
  X,
  Building2,
  User,
  Filter,
  CheckCheck,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from "lucide-react-native";
import { Header } from "../../components/ui/Header";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import {
  lessonPlanService,
  LessonPlanItem,
  LessonPlanDetailItem,
  LembagaItem,
  resolveDetailStatus,
  resolvePlanStatus,
} from "../../api/lessonPlanService";
import { isDirekturRole, isKepalaSekolahRole, isSuperAdminRole } from "../../utils/permissions";

export const VerifikasiLessonPlanScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user, activeRole } = useAuthStore();

  const isDirektur = isDirekturRole(activeRole || user);
  const isSuperAdmin = isSuperAdminRole(activeRole || user);
  const isKepsek = isKepalaSekolahRole(activeRole || user);

  // Role title & scope
  const activeRoleName = activeRole?.nama_role || user?.roles?.[0]?.nama_role || "Pimpinan";
  const userLembagaId =
    activeRole?.lembaga_id ||
    activeRole?.lembaga?.lembaga_id ||
    (user as any)?.lembaga_id ||
    (user as any)?.roles?.find((r: any) => r.lembaga_id)?.lembaga_id ||
    (user as any)?.pegawai?.pegawai_lembaga?.[0]?.lembaga_id;
  const userLembagaName =
    activeRole?.lembaga?.singkatan ||
    activeRole?.lembaga?.nama_lembaga ||
    (user as any)?.lembaga?.singkatan ||
    (user as any)?.lembaga?.nama_lembaga ||
    "Unit Sekolah";

  // Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lessonPlans, setLessonPlans] = useState<LessonPlanItem[]>([]);
  const [lembagas, setLembagas] = useState<LembagaItem[]>([]);
  const [selectedLembagaFilter, setSelectedLembagaFilter] = useState<number | null>(null);

  // Filter & Search: Tab Disetujui dihilangkan, default ke "Menunggu"
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStatusTab, setSelectedStatusTab] = useState<
    "Menunggu" | "Semua" | "Revisi"
  >("Menunggu");
  const [expandedPlans, setExpandedPlans] = useState<Record<number, boolean>>({});

  // Display Limit untuk performa rendering ringan
  const [displayLimit, setDisplayLimit] = useState<number>(15);

  // Inspection Modal (Lihat Detail Dokumen Pertemuan - Lazy Loaded)
  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [inspectingPlan, setInspectingPlan] = useState<LessonPlanItem | null>(null);
  const [inspectingDetail, setInspectingDetail] = useState<LessonPlanDetailItem | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState<boolean>(false);

  // Revision Modal
  const [revisiModalVisible, setRevisiModalVisible] = useState(false);
  const [revisiTarget, setRevisiTarget] = useState<{
    type: "plan" | "detail";
    plan: LessonPlanItem;
    detail?: LessonPlanDetailItem;
  } | null>(null);
  const [revisiNote, setRevisiNote] = useState("");
  const [isSubmittingRevisi, setIsSubmittingRevisi] = useState(false);

  // Approve Modal (Konfirmasi)
  const [approveConfirmVisible, setApproveConfirmVisible] = useState(false);
  const [approveTarget, setApproveTarget] = useState<{
    type: "plan" | "detail";
    plan: LessonPlanItem;
    detail?: LessonPlanDetailItem;
  } | null>(null);
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);

  // Ambil data master lembaga untuk Direktur
  const fetchLembagas = useCallback(async () => {
    if (isDirektur || isSuperAdmin) {
      try {
        const lmbList = await lessonPlanService.getLembagas();
        setLembagas(lmbList);
      } catch (err) {
        console.warn("Gagal memuat master lembaga:", err);
      }
    }
  }, [isDirektur, isSuperAdmin]);

  // Fetch Data RPP yang terfokus dan tersaring ketat per lembaga
  const fetchData = useCallback(async () => {
    // Bagi Direktur / Super Admin:
    // Jika belum memilih lembaga, JANGAN tarik data agar tidak berat dan lag!
    if ((isDirektur || isSuperAdmin) && !selectedLembagaFilter) {
      setLessonPlans([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);

      // Tentukan target lembaga ID yang sedang aktif (baik untuk Direktur maupun Kepala Sekolah)
      const targetLembagaId =
        isDirektur || isSuperAdmin
          ? selectedLembagaFilter
          : userLembagaId || activeRole?.lembaga_id || (activeRole?.lembaga as any)?.lembaga_id;

      const params: any = {};
      if (targetLembagaId) {
        params.lembaga_id = targetLembagaId;
      }

      const plans = await lessonPlanService.getLessonPlans(params);

      // FILTER KETAT SESUAI LEMBAGA: Berlaku untuk Direktur maupun Kepala Sekolah
      let filteredPlans = plans;
      if (targetLembagaId) {
        const lidNum = Number(targetLembagaId);
        filteredPlans = plans.filter((p) => {
          const kLembaga = p.jadwal?.kelas?.lembaga_id;
          const mLembaga = p.jadwal?.mapel?.lembaga_id;
          const matchKelas =
            kLembaga !== undefined && kLembaga !== null && Number(kLembaga) === lidNum;
          const matchMapel =
            mLembaga !== undefined && mLembaga !== null && Number(mLembaga) === lidNum;
          return matchKelas || matchMapel;
        });
      }

      setLessonPlans(filteredPlans);
      setDisplayLimit(15);
    } catch (err) {
      console.warn("Error fetching Lesson Plans for verification:", err);
      Alert.alert(
        "Gagal Memuat Data",
        "Tidak dapat mengambil daftar Lesson Plan. Periksa koneksi internet Anda."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDirektur, isSuperAdmin, userLembagaId, selectedLembagaFilter, activeRole]);

  // Load awal
  useEffect(() => {
    if (isFocused) {
      fetchLembagas();
      fetchData();
    }
  }, [isFocused, fetchLembagas, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleExpand = (planId: number) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  // Metrics (dihitung dari list yang sudah terfilter lembaga)
  const stats = useMemo(() => {
    const total = lessonPlans.length;
    let approved = 0;
    let pending = 0;
    let revisi = 0;

    lessonPlans.forEach((lp) => {
      const st = resolvePlanStatus(lp);
      if (st === "Disetujui") approved++;
      else if (st.includes("Revisi")) revisi++;
      else pending++;
    });

    return { total, approved, pending, revisi };
  }, [lessonPlans]);

  // Filtered List & Sorting Prioritas (Tab Disetujui Dihilangkan)
  const sortedList = useMemo(() => {
    // 1. Filter pencarian & status tab
    const filtered = lessonPlans.filter((lp) => {
      const title = (lp.judul_rpp || "").toLowerCase();
      const guru = (lp.pegawai?.nama || "").toLowerCase();
      const mapel = (lp.jadwal?.mapel?.nama_mapel || "").toLowerCase();
      const kelas = (lp.jadwal?.kelas?.nama_kelas || "").toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        guru.includes(query) ||
        mapel.includes(query) ||
        kelas.includes(query);

      const status = resolvePlanStatus(lp);
      if (selectedStatusTab === "Revisi") {
        return matchesSearch && status.includes("Revisi");
      }
      if (selectedStatusTab === "Menunggu") {
        return (
          matchesSearch &&
          (status.includes("Menunggu") || (status !== "Disetujui" && !status.includes("Revisi")))
        );
      }
      // "Semua"
      return matchesSearch;
    });

    // 2. PRIORITASKAN YANG BUTUH PERSETUJUAN DI PALING ATAS
    return [...filtered].sort((a, b) => {
      const aStatus = resolvePlanStatus(a);
      const bStatus = resolvePlanStatus(b);

      const aNeedsAction =
        isDirektur || isSuperAdmin
          ? a.status_verifikasi_kepsek === "Disetujui" && a.status_verifikasi_direktur !== "Disetujui"
          : a.status_verifikasi_kepsek !== "Disetujui";

      const bNeedsAction =
        isDirektur || isSuperAdmin
          ? b.status_verifikasi_kepsek === "Disetujui" && b.status_verifikasi_direktur !== "Disetujui"
          : b.status_verifikasi_kepsek !== "Disetujui";

      // Yang butuh tindakan diprioritaskan paling atas
      if (aNeedsAction && !bNeedsAction) return -1;
      if (!aNeedsAction && bNeedsAction) return 1;

      // Berikutnya yang statusnya Revisi
      const aIsRevisi = aStatus.includes("Revisi");
      const bIsRevisi = bStatus.includes("Revisi");
      if (aIsRevisi && !bIsRevisi) return -1;
      if (!aIsRevisi && bIsRevisi) return 1;

      // Terakhir urutkan berdasarkan ID RPP terbaru
      return b.lesson_plan_id - a.lesson_plan_id;
    });
  }, [lessonPlans, searchQuery, selectedStatusTab, isDirektur, isSuperAdmin]);

  // List yang dirender (dibatasi displayLimit untuk performa mulus)
  const displayedList = useMemo(() => {
    return sortedList.slice(0, displayLimit);
  }, [sortedList, displayLimit]);

  // Lembaga aktif yang sedang dipilih Direktur
  const activeLembagaObj = useMemo(() => {
    if (!selectedLembagaFilter) return null;
    return lembagas.find((l) => l.lembaga_id === selectedLembagaFilter) || null;
  }, [selectedLembagaFilter, lembagas]);

  // Handle Action Trigger: Approve Single Detail
  const handleTriggerApproveDetail = (plan: LessonPlanItem, detail: LessonPlanDetailItem) => {
    if (isDirektur && !isSuperAdmin && detail.status_verifikasi_kepsek !== "Disetujui") {
      Alert.alert(
        "Belum Diverifikasi Kepala Sekolah",
        `Pertemuan Ke-${detail.pertemuan_ke} belum disetujui oleh Kepala Sekolah. Verifikasi Kepala Sekolah diperlukan terlebih dahulu sebelum disahkan Direktur.`
      );
      return;
    }

    setApproveTarget({ type: "detail", plan, detail });
    setApproveConfirmVisible(true);
  };

  // Handle Action Trigger: Approve All 16 Meetings (1 Paket)
  const handleTriggerApprovePlan = (plan: LessonPlanItem) => {
    if (isDirektur && !isSuperAdmin && plan.status_verifikasi_kepsek !== "Disetujui") {
      Alert.alert(
        "Belum Diverifikasi Kepala Sekolah",
        "RPP ini belum disetujui oleh Kepala Sekolah. Kepala Sekolah unit harus memverifikasi terlebih dahulu."
      );
      return;
    }

    setApproveTarget({ type: "plan", plan });
    setApproveConfirmVisible(true);
  };

  // Execute Approve
  const executeApprove = async () => {
    if (!approveTarget) return;
    setIsSubmittingApprove(true);
    try {
      if (approveTarget.type === "plan") {
        if (isDirektur || isSuperAdmin) {
          await lessonPlanService.verifyLessonPlanDirektur({
            p_lesson_plan_id: approveTarget.plan.lesson_plan_id,
            p_action: "Disetujui",
          });
        } else {
          await lessonPlanService.verifyLessonPlanKepsek({
            p_lesson_plan_id: approveTarget.plan.lesson_plan_id,
            p_action: "Disetujui",
          });
        }
        Alert.alert("Berhasil", "Seluruh 16 pertemuan RPP ini telah berhasil disetujui.");
      } else if (approveTarget.type === "detail" && approveTarget.detail) {
        if (isDirektur || isSuperAdmin) {
          await lessonPlanService.verifyLessonPlanDetailDirektur({
            p_detail_id: approveTarget.detail.detail_id,
            p_action: "Disetujui",
          });
        } else {
          await lessonPlanService.verifyLessonPlanDetailKepsek({
            p_detail_id: approveTarget.detail.detail_id,
            p_action: "Disetujui",
          });
        }
        Alert.alert("Berhasil", `Pertemuan Ke-${approveTarget.detail.pertemuan_ke} telah disetujui.`);
      }

      setApproveConfirmVisible(false);
      setApproveTarget(null);
      if (inspectModalVisible) setInspectModalVisible(false);
      fetchData();
    } catch (err) {
      console.error(err);
      Alert.alert("Gagal", "Gagal memproses persetujuan. Silakan coba lagi.");
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  // Handle Action Trigger: Revisi
  const handleTriggerRevisi = (
    type: "plan" | "detail",
    plan: LessonPlanItem,
    detail?: LessonPlanDetailItem
  ) => {
    const existingNote =
      isDirektur || isSuperAdmin
        ? detail ? detail.catatan_revisi_direktur : plan.catatan_revisi_direktur
        : detail ? detail.catatan_revisi_kepsek : plan.catatan_revisi_kepsek;

    setRevisiNote(existingNote || "");
    setRevisiTarget({ type, plan, detail });
    setRevisiModalVisible(true);
  };

  // Execute Revisi
  const executeRevisi = async () => {
    if (!revisiTarget) return;
    if (!revisiNote.trim()) {
      Alert.alert(
        "Catatan Revisi Diperlukan",
        "Mohon isi catatan revisi agar guru pengampu memahami bagian yang harus diperbaiki."
      );
      return;
    }

    setIsSubmittingRevisi(true);
    try {
      if (revisiTarget.type === "plan") {
        if (isDirektur || isSuperAdmin) {
          await lessonPlanService.verifyLessonPlanDirektur({
            p_lesson_plan_id: revisiTarget.plan.lesson_plan_id,
            p_action: "Revisi",
            p_catatan_revisi: revisiNote.trim(),
          });
        } else {
          await lessonPlanService.verifyLessonPlanKepsek({
            p_lesson_plan_id: revisiTarget.plan.lesson_plan_id,
            p_action: "Revisi",
            p_catatan_revisi: revisiNote.trim(),
          });
        }
        Alert.alert("Revisi Dikirim", "RPP telah dikembalikan kepada guru untuk diperbaiki sesuai catatan Anda.");
      } else if (revisiTarget.type === "detail" && revisiTarget.detail) {
        if (isDirektur || isSuperAdmin) {
          await lessonPlanService.verifyLessonPlanDetailDirektur({
            p_detail_id: revisiTarget.detail.detail_id,
            p_action: "Revisi",
            p_catatan_revisi: revisiNote.trim(),
          });
        } else {
          await lessonPlanService.verifyLessonPlanDetailKepsek({
            p_detail_id: revisiTarget.detail.detail_id,
            p_action: "Revisi",
            p_catatan_revisi: revisiNote.trim(),
          });
        }
        Alert.alert("Revisi Dikirim", `Pertemuan Ke-${revisiTarget.detail.pertemuan_ke} telah dikembalikan untuk direvisi.`);
      }

      setRevisiModalVisible(false);
      setRevisiTarget(null);
      setRevisiNote("");
      if (inspectModalVisible) setInspectModalVisible(false);
      fetchData();
    } catch (err) {
      console.error(err);
      Alert.alert("Gagal", "Gagal memproses catatan revisi. Silakan coba lagi.");
    } finally {
      setIsSubmittingRevisi(false);
    }
  };

  // Open Inspection Modal (LAZY LOAD ISI DOKUMEN ON-DEMAND)
  const openInspection = async (plan: LessonPlanItem, detail: LessonPlanDetailItem) => {
    setInspectingPlan(plan);
    setInspectingDetail(detail);
    setInspectModalVisible(true);

    // Jika detail belum memiliki field dokumen 'isi', tarik on-demand hanya untuk 1 pertemuan ini
    if (!detail.isi && detail.detail_id > 0) {
      setIsLoadingDocument(true);
      try {
        const fullDetail = await lessonPlanService.getLessonPlanDetailById(detail.detail_id);
        if (fullDetail && fullDetail.isi) {
          setInspectingDetail((prev) => (prev ? { ...prev, isi: fullDetail.isi } : fullDetail));
        }
      } catch (err) {
        console.warn("Gagal memuat dokumen lengkap pertemuan:", err);
      } finally {
        setIsLoadingDocument(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Verifikasi RPP"
        subtitle="Pemeriksaan & Pengesahan Perangkat Ajar"
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
        {/* 1. Scope & Role Banner */}
        <View style={styles.roleBanner}>
          <View style={styles.roleIconWrapper}>
            <Building2 size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.roleHeaderRow}>
              <Text style={styles.roleTitle}>{activeRoleName}</Text>
              <View style={styles.verifiedLevelBadge}>
                <Text style={styles.verifiedLevelText}>
                  {isDirektur || isSuperAdmin ? "Verifikasi Final (Tahap 2)" : "Verifikasi Awal (Tahap 1)"}
                </Text>
              </View>
            </View>
            <Text style={styles.roleSubtext}>
              {isDirektur || isSuperAdmin
                ? activeLembagaObj
                  ? `Sedang memeriksa unit: ${activeLembagaObj.nama_lembaga}`
                  : "Silakan pilih unit pendidikan di bawah untuk memeriksa RPP."
                : `Memeriksa perangkat pembelajaran guru untuk unit: ${userLembagaName}`}
            </Text>
          </View>
        </View>

        {/* ═════════════════════════════════════════════════════════════
            KHUSUS DIREKTUR / SUPER ADMIN: UNIT SELECTOR HUB
            (Ketika pertama kali buka, tampilkan pilihan lembaga agar tidak memuat seluruh database)
        ══════════════════════════════════════════════════════════════ */}
        {(isDirektur || isSuperAdmin) && selectedLembagaFilter === null ? (
          <View style={styles.unitHubContainer}>
            <View style={styles.unitHubHeader}>
              <View style={styles.unitHubIconBox}>
                <Building2 size={24} color="#1D4ED8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.unitHubTitle}>Pilih Unit Lembaga Pendidikan</Text>
                <Text style={styles.unitHubSubtitle}>
                  Pilih salah satu unit di bawah untuk memuat dan memverifikasi perangkat ajar guru secara cepat & terfokus.
                </Text>
              </View>
            </View>

            <View style={styles.unitGrid}>
              {lembagas.map((lmb) => (
                <TouchableOpacity
                  key={lmb.lembaga_id}
                  style={styles.unitCard}
                  onPress={() => setSelectedLembagaFilter(lmb.lembaga_id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.unitCardTop}>
                    <View style={styles.unitBadge}>
                      <GraduationCap size={16} color="#1D4ED8" />
                    </View>
                    <ArrowRight size={16} color="#94A3B8" />
                  </View>

                  <Text style={styles.unitName} numberOfLines={2}>
                    {lmb.nama_lembaga}
                  </Text>
                  {lmb.singkatan && (
                    <Text style={styles.unitSingkatan}>{lmb.singkatan}</Text>
                  )}

                  <View style={styles.unitCardFooter}>
                    <Text style={styles.unitCardBtnText}>Buka Verifikasi Unit ›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <>
            {/* Lembaga Active Bar & Quick Switcher untuk Direktur */}
            {(isDirektur || isSuperAdmin) && activeLembagaObj && (
              <View style={styles.activeLembagaBar}>
                <View style={styles.activeLembagaInfo}>
                  <Text style={styles.activeLembagaLabel}>UNIT AKTIF:</Text>
                  <Text style={styles.activeLembagaName} numberOfLines={1}>
                    {activeLembagaObj.nama_lembaga} ({activeLembagaObj.singkatan || "Unit"})
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.switchUnitBtn}
                  onPress={() => setSelectedLembagaFilter(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchUnitBtnText}>Ganti Unit</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 2. Metrics Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: "#EFF6FF" }]}>
                  <BookMarked size={16} color="#2563EB" />
                </View>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total RPP</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: "#FAF5FF" }]}>
                  <Clock size={16} color="#9333EA" />
                </View>
                <Text style={[styles.statValue, { color: "#9333EA" }]}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Menunggu</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: "#F0FDF4" }]}>
                  <CheckCircle2 size={16} color="#16A34A" />
                </View>
                <Text style={[styles.statValue, { color: "#16A34A" }]}>{stats.approved}</Text>
                <Text style={styles.statLabel}>Disetujui</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: "#FFF1F2" }]}>
                  <AlertCircle size={16} color="#E11D48" />
                </View>
                <Text style={[styles.statValue, { color: "#E11D48" }]}>{stats.revisi}</Text>
                <Text style={styles.statLabel}>Revisi</Text>
              </View>
            </View>

            {/* 3. Search Bar */}
            <View style={styles.searchContainer}>
              <Search size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari guru, mapel, kelas, atau judul RPP..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>

            {/* 4. Status Filter Tabs (Tab "Disetujui" Dihilangkan Sesuai Permintaan) */}
            <View style={styles.tabsContainer}>
              {(["Menunggu", "Semua", "Revisi"] as const).map((tab) => {
                const isActive = selectedStatusTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tabButton, isActive && styles.tabButtonActive]}
                    onPress={() => setSelectedStatusTab(tab)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                      {tab === "Menunggu" ? "Menunggu Verifikasi" : tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notice Prioritas */}
            <View style={styles.priorityNoticeRow}>
              <Sparkles size={13} color="#D97706" />
              <Text style={styles.priorityNoticeText}>
                RPP yang membutuhkan tindakan persetujuan diprioritaskan di urutan teratas.
              </Text>
            </View>

            {/* 5. List RPP Cards */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Memuat perangkat ajar unit terpilih...</Text>
              </View>
            ) : sortedList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FileText size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Tidak Ada Lesson Plan</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? `Tidak ditemukan RPP yang cocok dengan "${searchQuery}"`
                    : selectedStatusTab === "Menunggu"
                    ? "Alhamdulillah! Tidak ada RPP yang sedang menunggu verifikasi untuk unit ini."
                    : "Belum ada data RPP untuk filter ini."}
                </Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {displayedList.map((plan) => {
                  const planStatus = resolvePlanStatus(plan);
                  const isExpanded = !!expandedPlans[plan.lesson_plan_id];

                  // Hitung jumlah pertemuan disetujui
                  const details = plan.details || [];
                  const detailsMap = new Map<number, LessonPlanDetailItem>();
                  details.forEach((d) => detailsMap.set(d.pertemuan_ke, d));

                  const all16Details: LessonPlanDetailItem[] = Array.from(
                    { length: 16 },
                    (_, idx) => {
                      const pKe = idx + 1;
                      return (
                        detailsMap.get(pKe) || {
                          detail_id: 0,
                          lesson_plan_id: plan.lesson_plan_id,
                          pertemuan_ke: pKe,
                          materi: "Belum ditentukan",
                          topik_materi: "-",
                          status_verifikasi_kepsek: "Menunggu Verifikasi",
                          status_verifikasi_direktur: "Menunggu Verifikasi",
                        }
                      );
                    }
                  );

                  const approvedMeetingsCount = details.filter(
                    (d) =>
                      d.status_verifikasi_kepsek === "Disetujui" &&
                      d.status_verifikasi_direktur === "Disetujui"
                  ).length;

                  // Border left color
                  let borderLeftColor = "#F59E0B"; // Amber (Menunggu Kepsek)
                  let statusBadgeBg = "#FEF3C7";
                  let statusBadgeText = "#B45309";

                  if (planStatus === "Disetujui") {
                    borderLeftColor = "#10B981"; // Emerald
                    statusBadgeBg = "#D1FAE5";
                    statusBadgeText = "#065F46";
                  } else if (planStatus.includes("Revisi")) {
                    borderLeftColor = "#EF4444"; // Red
                    statusBadgeBg = "#FEE2E2";
                    statusBadgeText = "#991B1B";
                  } else if (planStatus === "Menunggu Verifikasi Direktur") {
                    borderLeftColor = "#8B5CF6"; // Purple
                    statusBadgeBg = "#EDE9FE";
                    statusBadgeText = "#5B21B6";
                  }

                  // Hak Akses Tombol "Setujui Semua (16)"
                  const isKepsekCanApproveAll =
                    !isDirektur &&
                    !isSuperAdmin &&
                    plan.status_verifikasi_kepsek !== "Disetujui";

                  const isDirekturCanApproveAll =
                    (isDirektur || isSuperAdmin) &&
                    plan.status_verifikasi_kepsek === "Disetujui" &&
                    plan.status_verifikasi_direktur !== "Disetujui";

                  const isDirekturWaitingKepsek =
                    (isDirektur || isSuperAdmin) &&
                    plan.status_verifikasi_kepsek !== "Disetujui";

                  const jadwal = plan.jadwal;
                  const kelasName = jadwal?.kelas?.nama_kelas || "Semua Kelas";
                  const mapelName =
                    jadwal?.mapel?.nama_mapel ||
                    plan.judul_rpp.split(/\s+[-–]\s+/)?.[0] ||
                    "Mata Pelajaran";
                  const guruName = plan.pegawai?.nama || "Guru Pengampu";
                  const timeRange =
                    jadwal?.jam_mulai && jadwal?.jam_selesai
                      ? `${jadwal.jam_mulai.jam_mulai} - ${jadwal.jam_selesai.jam_selesai}`
                      : null;

                  return (
                    <View
                      key={plan.lesson_plan_id}
                      style={[styles.rppCard, { borderLeftColor: borderLeftColor }]}
                    >
                      {/* Card Header Top */}
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderMain}>
                          <View style={styles.progressBadge}>
                            <Text style={styles.progressBadgeNumber}>
                              {approvedMeetingsCount}/16
                            </Text>
                            <Text style={styles.progressBadgeLabel}>Disetujui</Text>
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={styles.mapelRow}>
                              <View style={styles.mapelTag}>
                                <Text style={styles.mapelTagText} numberOfLines={1}>
                                  {mapelName}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.statusTag,
                                  { backgroundColor: statusBadgeBg },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusTagText,
                                    { color: statusBadgeText },
                                  ]}
                                >
                                  {planStatus}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.rppTitle} numberOfLines={2}>
                              {plan.judul_rpp}
                            </Text>

                            <View style={styles.metaRow}>
                              <User size={13} color="#64748B" />
                              <Text style={styles.metaGuru} numberOfLines={1}>
                                {guruName}
                              </Text>
                              <Text style={styles.metaDot}>•</Text>
                              <Layers size={13} color="#64748B" />
                              <Text style={styles.metaText}>{kelasName}</Text>
                            </View>

                            {/* Jadwal Pelaksanaan KBM */}
                            {jadwal?.hari && (
                              <View style={styles.jadwalTagRow}>
                                <View style={styles.jadwalChip}>
                                  <Calendar size={11} color="#4338CA" />
                                  <Text style={styles.jadwalChipText}>
                                    {jadwal.hari}
                                  </Text>
                                </View>
                                {timeRange && (
                                  <View style={styles.jadwalTimeChip}>
                                    <Clock size={11} color="#047857" />
                                    <Text style={styles.jadwalTimeChipText}>
                                      {timeRange}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Warning Bar untuk Direktur jika Kepsek belum menyetujui */}
                      {isDirekturWaitingKepsek && (
                        <View style={styles.direkturWarningBox}>
                          <AlertTriangle size={14} color="#B45309" />
                          <Text style={styles.direkturWarningText}>
                            Menunggu persetujuan Kepala Sekolah terlebih dahulu sebelum dapat disahkan Direktur.
                          </Text>
                        </View>
                      )}

                      {/* ═══════════════════════════════════════════════════════
                          ACTION AREA RPP (DESAIN RAPI & TERSTRUKTUR DUA BARIS)
                      ════════════════════════════════════════════════════════ */}
                      <View style={styles.cardActionArea}>
                        {/* Baris 1: Tombol Utama "Setujui Semua (16 Pertemuan)" (Full Width Hijau) */}
                        {(isKepsekCanApproveAll || isDirekturCanApproveAll) && (
                          <TouchableOpacity
                            style={styles.approveAllFullBtn}
                            onPress={() => handleTriggerApprovePlan(plan)}
                            activeOpacity={0.85}
                          >
                            <CheckCheck size={16} color="#FFFFFF" />
                            <Text style={styles.approveAllFullBtnText}>
                              Setujui Semua (16 Pertemuan)
                            </Text>
                          </TouchableOpacity>
                        )}

                        {/* Baris 2: Sejajar Dua Tombol (Minta Revisi & 16 Pertemuan) */}
                        <View style={styles.cardSubActionRow}>
                          <TouchableOpacity
                            style={styles.revisiPlanBtn}
                            onPress={() => handleTriggerRevisi("plan", plan)}
                            activeOpacity={0.8}
                          >
                            <XCircle size={15} color="#E11D48" />
                            <Text style={styles.revisiPlanBtnText}>Minta Revisi</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.expandToggleBtn,
                              isExpanded && styles.expandToggleBtnActive,
                            ]}
                            onPress={() => toggleExpand(plan.lesson_plan_id)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.expandToggleBtnText,
                                isExpanded && styles.expandToggleBtnTextActive,
                              ]}
                            >
                              {isExpanded ? "Tutup Pertemuan" : "16 Pertemuan"}
                            </Text>
                            {isExpanded ? (
                              <ChevronUp size={15} color={isExpanded ? "#1D4ED8" : "#475569"} />
                            ) : (
                              <ChevronDown size={15} color="#475569" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Sub-List 16 Pertemuan (Expandable) */}
                      {isExpanded && (
                        <View style={styles.expandedSection}>
                          <View style={styles.expandedHeader}>
                            <Text style={styles.expandedTitle}>
                              Rincian 16 Pertemuan Pembelajaran
                            </Text>
                            <Text style={styles.expandedSubtitle}>
                              Periksa isi materi & tentukan persetujuan per pertemuan
                            </Text>
                          </View>

                          <View style={styles.meetingsContainer}>
                            {all16Details.map((dt) => {
                              const dtStatus = resolveDetailStatus(dt);

                              let dtBadgeBg = "#FEF3C7";
                              let dtBadgeText = "#B45309";
                              if (dtStatus === "Disetujui") {
                                dtBadgeBg = "#D1FAE5";
                                dtBadgeText = "#065F46";
                              } else if (dtStatus.includes("Revisi")) {
                                dtBadgeBg = "#FEE2E2";
                                dtBadgeText = "#991B1B";
                              } else if (dtStatus === "Menunggu Verifikasi Direktur") {
                                dtBadgeBg = "#EDE9FE";
                                dtBadgeText = "#5B21B6";
                              }

                              const isDetailKepsekCanApprove =
                                !isDirektur &&
                                !isSuperAdmin &&
                                dt.status_verifikasi_kepsek !== "Disetujui";

                              const isDetailDirekturCanApprove =
                                (isDirektur || isSuperAdmin) &&
                                dt.status_verifikasi_kepsek === "Disetujui" &&
                                dt.status_verifikasi_direktur !== "Disetujui";

                              const isDetailWaitingKepsek =
                                (isDirektur || isSuperAdmin) &&
                                dt.status_verifikasi_kepsek !== "Disetujui";

                              return (
                                <View key={dt.pertemuan_ke} style={styles.meetingCard}>
                                  {/* Header Pertemuan */}
                                  <View style={styles.meetingCardHeader}>
                                    <View style={styles.meetingNumberBox}>
                                      <Text style={styles.meetingNumberText}>
                                        P{dt.pertemuan_ke}
                                      </Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                      <Text style={styles.meetingNumberTitle}>
                                        Pertemuan Ke-{dt.pertemuan_ke}
                                      </Text>
                                      <Text style={styles.meetingMateriText} numberOfLines={1}>
                                        {dt.materi || "Belum ada judul materi"}
                                      </Text>
                                    </View>
                                    <View
                                      style={[
                                        styles.meetingStatusBadge,
                                        { backgroundColor: dtBadgeBg },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.meetingStatusBadgeText,
                                          { color: dtBadgeText },
                                        ]}
                                      >
                                        {dtStatus}
                                      </Text>
                                    </View>
                                  </View>

                                  {/* Sub-topik */}
                                  {dt.topik_materi && dt.topik_materi !== "-" && (
                                    <View style={styles.meetingTopicBox}>
                                      <Text style={styles.meetingTopicLabel}>Sub-Topik:</Text>
                                      <Text style={styles.meetingTopicVal} numberOfLines={2}>
                                        {dt.topik_materi}
                                      </Text>
                                    </View>
                                  )}

                                  {/* Catatan Revisi Kepsek */}
                                  {dt.status_verifikasi_kepsek === "Revisi" &&
                                    dt.catatan_revisi_kepsek && (
                                      <View style={styles.revisiBox}>
                                        <AlertCircle size={13} color="#BE123C" />
                                        <View style={{ flex: 1, marginLeft: 6 }}>
                                          <Text style={styles.revisiLabel}>
                                            Catatan Revisi Kepala Sekolah:
                                          </Text>
                                          <Text style={styles.revisiContent}>
                                            "{dt.catatan_revisi_kepsek}"
                                          </Text>
                                        </View>
                                      </View>
                                    )}

                                  {/* Catatan Revisi Direktur */}
                                  {dt.status_verifikasi_direktur === "Revisi" &&
                                    dt.catatan_revisi_direktur && (
                                      <View style={styles.revisiBox}>
                                        <AlertCircle size={13} color="#BE123C" />
                                        <View style={{ flex: 1, marginLeft: 6 }}>
                                          <Text style={styles.revisiLabel}>
                                            Catatan Revisi Direktur:
                                          </Text>
                                          <Text style={styles.revisiContent}>
                                            "{dt.catatan_revisi_direktur}"
                                          </Text>
                                        </View>
                                      </View>
                                    )}

                                  {/* Notice khusus Direktur */}
                                  {isDetailWaitingKepsek && (
                                    <View style={styles.waitingKepsekNotice}>
                                      <Text style={styles.waitingKepsekNoticeText}>
                                        ⏳ Menunggu persetujuan Kepala Sekolah terlebih dahulu
                                      </Text>
                                    </View>
                                  )}

                                  {/* Tombol Aksi Pertemuan */}
                                  <View style={styles.meetingActionRow}>
                                    {/* Tombol Periksa / Lihat Dokumen */}
                                    <TouchableOpacity
                                      style={styles.inspectBtn}
                                      onPress={() => openInspection(plan, dt)}
                                      activeOpacity={0.8}
                                    >
                                      <Eye size={13} color="#1E293B" />
                                      <Text style={styles.inspectBtnText}>Periksa RPP</Text>
                                    </TouchableOpacity>

                                    {/* Tombol Setujui */}
                                    {(isDetailKepsekCanApprove || isDetailDirekturCanApprove) && (
                                      <TouchableOpacity
                                        style={styles.detailApproveBtn}
                                        onPress={() => handleTriggerApproveDetail(plan, dt)}
                                        activeOpacity={0.8}
                                      >
                                        <Check size={13} color="#FFFFFF" />
                                        <Text style={styles.detailApproveBtnText}>Setujui</Text>
                                      </TouchableOpacity>
                                    )}

                                    {/* Tombol Revisi */}
                                    <TouchableOpacity
                                      style={styles.detailRevisiBtn}
                                      onPress={() => handleTriggerRevisi("detail", plan, dt)}
                                      activeOpacity={0.8}
                                    >
                                      <X size={13} color="#E11D48" />
                                      <Text style={styles.detailRevisiBtnText}>Revisi</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Tombol Muat Lebih Banyak jika data melebihi limit */}
                {sortedList.length > displayLimit && (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    onPress={() => setDisplayLimit((prev) => prev + 15)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.loadMoreBtnText}>
                      Tampilkan Lebih Banyak (+15 RPP)
                    </Text>
                    <Text style={styles.loadMoreSubText}>
                      Menampilkan {displayedList.length} dari {sortedList.length} RPP
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ═════════════════════════════════════════════════════════════
          MODAL 1: INSPEKSI DOKUMEN RPP LENGKAP (View Mode - On Demand)
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={inspectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInspectModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.inspectModalContent}>
            {/* Modal Header */}
            <View style={styles.inspectModalHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.inspectModalTagRow}>
                  <Text style={styles.inspectModalPertemuanBadge}>
                    Pertemuan Ke-{inspectingDetail?.pertemuan_ke}
                  </Text>
                  <Text style={styles.inspectModalMapelBadge}>
                    {inspectingPlan?.jadwal?.mapel?.nama_mapel || inspectingPlan?.judul_rpp}
                  </Text>
                </View>
                <Text style={styles.inspectModalTitle} numberOfLines={1}>
                  {inspectingDetail?.materi || "Dokumen Pelaksanaan KBM"}
                </Text>
                <Text style={styles.inspectModalSub}>
                  Pengampu: {inspectingPlan?.pegawai?.nama || "-"} • Kelas:{" "}
                  {inspectingPlan?.jadwal?.kelas?.nama_kelas || "-"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseIconBtn}
                onPress={() => setInspectModalVisible(false)}
              >
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Document Body */}
            <ScrollView style={styles.inspectModalBody} showsVerticalScrollIndicator={false}>
              {/* Materi & Sub-topik */}
              <View style={styles.docSection}>
                <Text style={styles.docSectionHeader}>1. MATERI & POKOK BAHASAN</Text>
                <View style={styles.docFieldBox}>
                  <Text style={styles.docFieldLabel}>Materi Pembelajaran:</Text>
                  <Text style={styles.docFieldValue}>
                    {inspectingDetail?.materi || "(Belum ditentukan)"}
                  </Text>
                </View>
                <View style={[styles.docFieldBox, { marginTop: 8 }]}>
                  <Text style={styles.docFieldLabel}>Sub-Topik / Pokok Bahasan:</Text>
                  <Text style={styles.docFieldValue}>
                    {inspectingDetail?.topik_materi || "-"}
                  </Text>
                </View>
              </View>

              {/* Rencana KBM */}
              {inspectingDetail?.rencana_pelaksanaan_kbm && (
                <View style={styles.docSection}>
                  <Text style={styles.docSectionHeader}>2. RENCANA PELAKSANAAN KBM</Text>
                  <View style={styles.docFieldBox}>
                    <Text style={styles.docFieldValue}>
                      {inspectingDetail.rencana_pelaksanaan_kbm}
                    </Text>
                  </View>
                </View>
              )}

              {/* Dokumen Lengkap RPP (Tujuan, Langkah, Asesmen) */}
              <View style={styles.docSection}>
                <Text style={styles.docSectionHeader}>
                  3. ISI LENGKAP PERANGKAT PEMBELAJARAN (RPP)
                </Text>
                <View style={styles.docDocumentPaper}>
                  {isLoadingDocument ? (
                    <View style={styles.docLoadingBox}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={styles.docLoadingText}>Memuat teks lengkap dokumen...</Text>
                    </View>
                  ) : inspectingDetail?.isi ? (
                    <Text style={styles.docDocumentText}>{inspectingDetail.isi}</Text>
                  ) : (
                    <View style={styles.emptyDocBox}>
                      <FileText size={32} color="#94A3B8" />
                      <Text style={styles.emptyDocText}>
                        Guru belum melampirkan teks dokumen lengkap (isi markdown) untuk pertemuan ini.
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Catatan Revisi yang Sedang Berlaku */}
              {(inspectingDetail?.catatan_revisi_kepsek ||
                inspectingDetail?.catatan_revisi_direktur) && (
                <View style={styles.docSection}>
                  <Text style={[styles.docSectionHeader, { color: "#E11D48" }]}>
                    CATATAN REVISI TERAKHIR
                  </Text>
                  {inspectingDetail.catatan_revisi_kepsek && (
                    <View style={[styles.revisiBox, { marginBottom: 6 }]}>
                      <AlertCircle size={14} color="#BE123C" />
                      <View style={{ flex: 1, marginLeft: 6 }}>
                        <Text style={styles.revisiLabel}>Kepala Sekolah:</Text>
                        <Text style={styles.revisiContent}>
                          "{inspectingDetail.catatan_revisi_kepsek}"
                        </Text>
                      </View>
                    </View>
                  )}
                  {inspectingDetail.catatan_revisi_direktur && (
                    <View style={styles.revisiBox}>
                      <AlertCircle size={14} color="#BE123C" />
                      <View style={{ flex: 1, marginLeft: 6 }}>
                        <Text style={styles.revisiLabel}>Direktur:</Text>
                        <Text style={styles.revisiContent}>
                          "{inspectingDetail.catatan_revisi_direktur}"
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modal Footer Actions */}
            <View style={styles.inspectModalFooter}>
              <TouchableOpacity
                style={styles.modalRevisiBtn}
                onPress={() => {
                  if (inspectingPlan && inspectingDetail) {
                    handleTriggerRevisi("detail", inspectingPlan, inspectingDetail);
                  }
                }}
              >
                <XCircle size={16} color="#E11D48" />
                <Text style={styles.modalRevisiBtnText}>Minta Revisi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalApproveBtn}
                onPress={() => {
                  if (inspectingPlan && inspectingDetail) {
                    handleTriggerApproveDetail(inspectingPlan, inspectingDetail);
                  }
                }}
              >
                <Check size={16} color="#FFFFFF" />
                <Text style={styles.modalApproveBtnText}>Setujui Pertemuan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════
          MODAL 2: INPUT CATATAN REVISI (Wajib Isi)
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={revisiModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setRevisiModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.revisiModalContent}>
            <View style={styles.revisiModalHeader}>
              <View style={styles.revisiIconCircle}>
                <AlertCircle size={22} color="#E11D48" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.revisiModalTitle}>
                  {revisiTarget?.type === "plan"
                    ? "Minta Revisi Lesson Plan"
                    : `Revisi Pertemuan Ke-${revisiTarget?.detail?.pertemuan_ke}`}
                </Text>
                <Text style={styles.revisiModalSubtitle}>
                  Tulis instruksi perbaikan yang jelas untuk Guru
                </Text>
              </View>
              <TouchableOpacity onPress={() => setRevisiModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.revisiModalBody}>
              <Text style={styles.inputLabel}>
                Catatan Revisi <Text style={{ color: "#E11D48" }}>*</Text>
              </Text>
              <TextInput
                style={styles.revisiTextInput}
                placeholder="Contoh: Mohon lengkapi instrumen asesmen dan perjelas langkah pembelajaran pada kegiatan inti..."
                placeholderTextColor="#94A3B8"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                value={revisiNote}
                onChangeText={setRevisiNote}
              />
              <Text style={styles.revisiInputHint}>
                Guru akan menerima notifikasi dan wajib memperbaiki RPP sebelum dapat disahkan kembali.
              </Text>
            </View>

            <View style={styles.revisiModalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setRevisiModalVisible(false)}
                disabled={isSubmittingRevisi}
              >
                <Text style={styles.cancelModalBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitRevisiBtn,
                  isSubmittingRevisi && { opacity: 0.7 },
                ]}
                onPress={executeRevisi}
                disabled={isSubmittingRevisi}
              >
                {isSubmittingRevisi ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <XCircle size={16} color="#FFFFFF" />
                    <Text style={styles.submitRevisiBtnText}>Kirim Revisi</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════
          MODAL 3: KONFIRMASI PERSETUJUAN (Approve Confirmation)
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={approveConfirmVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setApproveConfirmVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.revisiModalContent}>
            <View style={styles.revisiModalHeader}>
              <View style={[styles.revisiIconCircle, { backgroundColor: "#DCFCE7" }]}>
                <CheckCircle2 size={24} color="#16A34A" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.revisiModalTitle}>Konfirmasi Persetujuan</Text>
                <Text style={styles.revisiModalSubtitle}>
                  {approveTarget?.type === "plan"
                    ? "Setujui seluruh 16 pertemuan RPP ini"
                    : `Setujui Pertemuan Ke-${approveTarget?.detail?.pertemuan_ke}`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setApproveConfirmVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.revisiModalBody}>
              <Text style={styles.confirmModalMessage}>
                {approveTarget?.type === "plan"
                  ? `Apakah Anda yakin ingin mengesahkan dan menyetujui seluruh 16 pertemuan untuk RPP "${approveTarget?.plan?.judul_rpp}"?`
                  : `Apakah Anda yakin ingin menyetujui pertemuan Ke-${approveTarget?.detail?.pertemuan_ke}: "${approveTarget?.detail?.materi || "Materi Pertemuan"}"?`}
              </Text>
              <View style={styles.confirmInfoBox}>
                <Text style={styles.confirmInfoText}>
                  {isDirektur || isSuperAdmin
                    ? "Pengesahan ini berlaku sebagai verifikasi final Direktur untuk modul pembelajaran."
                    : "Persetujuan ini akan meneruskan status RPP ke verifikasi Direktur."}
                </Text>
              </View>
            </View>

            <View style={styles.revisiModalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setApproveConfirmVisible(false)}
                disabled={isSubmittingApprove}
              >
                <Text style={styles.cancelModalBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitApproveConfirmBtn,
                  isSubmittingApprove && { opacity: 0.7 },
                ]}
                onPress={executeApprove}
                disabled={isSubmittingApprove}
              >
                {isSubmittingApprove ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.submitApproveConfirmBtnText}>Ya, Setujui</Text>
                  </>
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
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // 1. Scope & Role Banner
  roleBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  roleIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  roleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
    flexWrap: "wrap",
    gap: 4,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  verifiedLevelBadge: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  verifiedLevelText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  roleSubtext: {
    fontSize: 11.5,
    color: "#94A3B8",
    lineHeight: 16,
  },

  // Unit Selector Hub (Khusus Direktur saat baru buka)
  unitHubContainer: {
    marginTop: 6,
    marginBottom: 20,
  },
  unitHubHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    gap: 12,
  },
  unitHubIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  unitHubTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E3A8A",
  },
  unitHubSubtitle: {
    fontSize: 11,
    color: "#3B82F6",
    lineHeight: 16,
    marginTop: 2,
  },
  unitGrid: {
    gap: 10,
  },
  unitCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  unitCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  unitBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  unitName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  unitSingkatan: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  unitCardFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  unitCardBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#1D4ED8",
  },

  // Active Lembaga Bar (Saat Direktur memilih unit)
  activeLembagaBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  activeLembagaInfo: {
    flex: 1,
    marginRight: 10,
  },
  activeLembagaLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.4,
  },
  activeLembagaName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E3A8A",
    marginTop: 1,
  },
  switchUnitBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  switchUnitBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },

  // 2. Stats / Metrics
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "#F1F5F9",
    alignSelf: "center",
  },

  // 3. Search Bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1E293B",
    paddingVertical: 0,
  },

  // 4. Tabs
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#EEF2F6",
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#1D4ED8",
  },

  // Notice Prioritas
  priorityNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  priorityNoticeText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#B45309",
  },

  // Loading & Empty
  loadingContainer: {
    paddingVertical: 50,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 10,
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 36,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#334155",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },

  // List RPP
  listContainer: {
    gap: 12,
  },
  rppCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderLeftWidth: 4.5,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    padding: 14,
  },
  cardHeaderMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  progressBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  progressBadgeNumber: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  progressBadgeLabel: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#64748B",
  },
  mapelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    flexWrap: "wrap",
    gap: 6,
  },
  mapelTag: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  mapelTagText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#1D4ED8",
    textTransform: "uppercase",
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10.5,
    fontWeight: "800",
  },
  rppTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 19,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  metaGuru: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#334155",
  },
  metaDot: {
    color: "#94A3B8",
    marginHorizontal: 2,
  },
  metaText: {
    fontSize: 11.5,
    color: "#64748B",
    fontWeight: "500",
  },
  jadwalTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    flexWrap: "wrap",
  },
  jadwalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  jadwalChipText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#4338CA",
  },
  jadwalTimeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  jadwalTimeChipText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#047857",
  },

  // Warning Direktur Box
  direkturWarningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  direkturWarningText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "#B45309",
    lineHeight: 15,
  },

  // ═════════════════════════════════════════════════════════════
  // Card Action Area (Desain Rapi & Terstruktur Dua Baris)
  // ═════════════════════════════════════════════════════════════
  cardActionArea: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 8,
  },
  approveAllFullBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#16A34A",
    height: 40,
    borderRadius: 10,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  approveAllFullBtnText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  cardSubActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  revisiPlanBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFF1F2",
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },
  revisiPlanBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#E11D48",
  },
  expandToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  expandToggleBtnActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  expandToggleBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#334155",
  },
  expandToggleBtnTextActive: {
    color: "#1D4ED8",
  },

  // Expanded Meetings
  expandedSection: {
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#EEF2F6",
    padding: 12,
  },
  expandedHeader: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  expandedTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B",
  },
  expandedSubtitle: {
    fontSize: 10.5,
    color: "#64748B",
  },
  meetingsContainer: {
    gap: 8,
  },
  meetingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  meetingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  meetingNumberBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  meetingNumberText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4338CA",
  },
  meetingNumberTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#1E293B",
  },
  meetingMateriText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "500",
  },
  meetingStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  meetingStatusBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
  },
  meetingTopicBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  meetingTopicLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  meetingTopicVal: {
    fontSize: 10.5,
    color: "#334155",
    fontWeight: "600",
  },
  revisiBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF1F2",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#FFE4E6",
    marginTop: 6,
  },
  revisiLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#BE123C",
  },
  revisiContent: {
    fontSize: 10.5,
    color: "#9F1239",
    fontStyle: "italic",
    marginTop: 1,
  },
  waitingKepsekNotice: {
    backgroundColor: "#FFFBEB",
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: "#FEF3C7",
    marginTop: 6,
  },
  waitingKepsekNoticeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#B45309",
    textAlign: "center",
  },
  meetingActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  inspectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  inspectBtnText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  detailApproveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#16A34A",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  detailApproveBtnText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  detailRevisiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF1F2",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },
  detailRevisiBtnText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#E11D48",
  },

  // Load More Button
  loadMoreBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 4,
  },
  loadMoreBtnText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  loadMoreSubText: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 2,
  },

  // Modal Backdrop
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },

  // Inspection Modal Styles
  inspectModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "88%",
    overflow: "hidden",
  },
  inspectModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  inspectModalTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  inspectModalPertemuanBadge: {
    backgroundColor: "#EEF2FF",
    color: "#4338CA",
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inspectModalMapelBadge: {
    backgroundColor: "#F1F5F9",
    color: "#475569",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inspectModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  inspectModalSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  modalCloseIconBtn: {
    padding: 4,
  },
  inspectModalBody: {
    flex: 1,
    padding: 16,
  },
  docSection: {
    marginBottom: 16,
  },
  docSectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  docFieldBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  docFieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  docFieldValue: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 2,
    lineHeight: 18,
  },
  docDocumentPaper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    minHeight: 180,
  },
  docDocumentText: {
    fontSize: 12.5,
    color: "#334155",
    lineHeight: 20,
  },
  docLoadingBox: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  docLoadingText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
    fontWeight: "600",
  },
  emptyDocBox: {
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyDocText: {
    fontSize: 11.5,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  inspectModalFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F6",
    backgroundColor: "#FFFFFF",
  },
  modalRevisiBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },
  modalRevisiBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#E11D48",
  },
  modalApproveBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#16A34A",
  },
  modalApproveBtnText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // Revisi Modal Styles
  revisiModalContent: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    alignSelf: "center",
    width: "92%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  revisiModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  revisiIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
  },
  revisiModalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  revisiModalSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  revisiModalBody: {
    marginVertical: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  revisiTextInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 12,
    fontSize: 12.5,
    color: "#0F172A",
    minHeight: 90,
  },
  revisiInputHint: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 6,
    lineHeight: 14,
  },
  revisiModalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
  cancelModalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelModalBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#64748B",
  },
  submitRevisiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E11D48",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitRevisiBtnText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // Confirm Approve Modal
  confirmModalMessage: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 19,
    marginBottom: 10,
  },
  confirmInfoBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  confirmInfoText: {
    fontSize: 11,
    color: "#166534",
    lineHeight: 16,
  },
  submitApproveConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#16A34A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitApproveConfirmBtnText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
