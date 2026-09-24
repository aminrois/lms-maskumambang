// mobile/src/screens/Wali/WaliKeuanganScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Wallet,
  CreditCard,
  Receipt,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Copy,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Layers,
  Calendar,
  X,
  Send,
  HelpCircle,
  ShieldCheck,
  Check,
} from "lucide-react-native";
import { keuanganService, TagihanItem, RekeningPesantren, PembayaranTransaksi } from "../../api/keuanganService";
import { SwipeBackContainer } from "../../components/ui/SwipeBackContainer";

// Helper format Rupiah
const formatRupiah = (val: number | string | undefined | null) => {
  const num = typeof val === "number" ? val : parseFloat(val as string) || 0;
  return "Rp " + num.toLocaleString("id-ID");
};

export const WaliKeuanganScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const initialSiswaId = route.params?.siswaId || null;

  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(initialSiswaId);
  const [activeTab, setActiveTab] = useState<"tagihan" | "transfer" | "riwayat" | "rekening">("tagihan");
  const [activeKategoriFilter, setActiveKategoriFilter] = useState<"all" | "pangkal" | "spp" | "kegiatan" | "seragam">("all");

  // Modal State
  const [selectedKuitansi, setSelectedKuitansi] = useState<PembayaranTransaksi | null>(null);
  const [cicilanModalVisible, setCicilanModalVisible] = useState(false);
  const [targetTagihanCicilan, setTargetTagihanCicilan] = useState<TagihanItem | null>(null);
  const [nominalCicilanInput, setNominalCicilanInput] = useState("");

  // Transfer Form State
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [bankPengirim, setBankPengirim] = useState("");
  const [noRekPengirim, setNoRekPengirim] = useState("");
  const [namaPengirim, setNamaPengirim] = useState("");
  const [selectedTagihanIds, setSelectedTagihanIds] = useState<{ [tagihan_id: number]: number }>({});
  const [catatanTransfer, setCatatanTransfer] = useState("");

  // Fetch Data Keuangan Wali
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["keuangan-wali", selectedSiswaId],
    queryFn: () => keuanganService.getKeuanganWali(selectedSiswaId || undefined),
    staleTime: 2 * 60 * 1000,
  });

  const siswaList = data?.siswaList || [];
  const currentSiswaId = selectedSiswaId || data?.selectedSiswaId || siswaList[0]?.siswa_id;
  const currentSiswa = useMemo(
    () => siswaList.find((s) => s.siswa_id === currentSiswaId) || siswaList[0],
    [siswaList, currentSiswaId]
  );

  const ringkasan = data?.ringkasan || {
    total_tunggakan: 0,
    total_terbayar: 0,
    status_spp_bulan_ini: "Belum Ada",
  };

  const kategori = data?.kategori || {
    uang_pangkal: [],
    spp: [],
    kegiatan: [],
    seragam: [],
    lainnya: [],
  };

  const riwayatTransaksi = data?.riwayat_transaksi || [];
  const rekeningList = data?.rekening_pesantren || [];

  // Mutation Ajukan Transfer
  const mutationAjukan = useMutation({
    mutationFn: (payload: any) => keuanganService.ajukanTransfer(payload),
    onSuccess: (res) => {
      Alert.alert(
        "Konfirmasi Berhasil",
        "Bukti pembayaran Anda telah dikirim dan sedang menunggu verifikasi staf keuangan pesantren.",
        [{ text: "OK", onPress: () => setActiveTab("riwayat") }]
      );
      setSelectedTagihanIds({});
      setBankPengirim("");
      setNoRekPengirim("");
      setNamaPengirim("");
      setCatatanTransfer("");
      queryClient.invalidateQueries({ queryKey: ["keuangan-wali"] });
    },
    onError: (err: any) => {
      Alert.alert("Gagal Mengirim", err.response?.data?.message || err.message || "Terjadi kesalahan.");
    },
  });

  // Handle Submit Form Transfer
  const handleSubmitTransfer = () => {
    if (!currentSiswaId) {
      Alert.alert("Perhatian", "Pilih santri terlebih dahulu.");
      return;
    }
    if (!selectedBankId) {
      Alert.alert("Perhatian", "Pilih rekening bank tujuan transfer pesantren.");
      return;
    }

    const items = Object.entries(selectedTagihanIds)
      .filter(([_, nominal]) => nominal > 0)
      .map(([id, nominal]) => ({
        tagihan_id: parseInt(id, 10),
        nominal_bayar: nominal,
      }));

    if (items.length === 0) {
      Alert.alert("Perhatian", "Pilih minimal 1 tagihan yang ingin dibayar.");
      return;
    }

    if (!namaPengirim.trim()) {
      Alert.alert("Perhatian", "Nama pemilik rekening pengirim wajib diisi.");
      return;
    }

    mutationAjukan.mutate({
      siswa_id: currentSiswaId,
      items,
      rekening_tujuan_id: selectedBankId,
      bank_pengirim: bankPengirim.trim() || undefined,
      nomor_rekening_pengirim: noRekPengirim.trim() || undefined,
      atas_nama_pengirim: namaPengirim.trim(),
      catatan: catatanTransfer.trim() || undefined,
    });
  };

  // Quick Bayar ke Tab Transfer
  const handleQuickPay = (tagihan: TagihanItem, customNominal?: number) => {
    const payAmount = customNominal || tagihan.sisa_tagihan;
    setSelectedTagihanIds({ [tagihan.tagihan_id]: payAmount });
    if (rekeningList.length > 0 && !selectedBankId) {
      setSelectedBankId(rekeningList[0].rekening_id);
    }
    setActiveTab("transfer");
  };

  // Hitung total transfer yang dipilih
  const totalPilihanTransfer = useMemo(() => {
    return Object.values(selectedTagihanIds).reduce((acc, val) => acc + (val || 0), 0);
  }, [selectedTagihanIds]);

  return (
    <SwipeBackContainer style={styles.container}>
      {/* ═══════════════════════════════════════════════════════
          TOP HEADER: DEEP NAVY PESANTREN THEME
      ════════════════════════════════════════════════════════ */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.topNavRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle}>Keuangan & Tagihan</Text>
              <Text style={styles.headerSubtitle}>
                Layanan Pembayaran Digital Santri
              </Text>
            </View>

            <View style={styles.headerRightBadge}>
              <Wallet size={18} color="#93C5FD" />
            </View>
          </View>

          {/* Santri Switcher Strip (Jika anak > 1) */}
          {siswaList.length > 1 && (
            <View style={styles.santriSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {siswaList.map((anak) => {
                  const isSelected = anak.siswa_id === currentSiswaId;
                  return (
                    <TouchableOpacity
                      key={anak.siswa_id}
                      style={[styles.santriChip, isSelected && styles.santriChipActive]}
                      onPress={() => setSelectedSiswaId(anak.siswa_id)}
                      activeOpacity={0.8}
                    >
                      <User size={13} color={isSelected ? "#FFFFFF" : "#93C5FD"} />
                      <Text
                        style={[styles.santriChipText, isSelected && styles.santriChipTextActive]}
                      >
                        {anak.nama}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Navigation Sub-Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === "tagihan" && styles.tabItemActive]}
              onPress={() => setActiveTab("tagihan")}
              activeOpacity={0.8}
            >
              <CreditCard size={15} color={activeTab === "tagihan" ? "#FFFFFF" : "#93C5FD"} />
              <Text style={[styles.tabText, activeTab === "tagihan" && styles.tabTextActive]}>
                Tagihan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === "transfer" && styles.tabItemActive]}
              onPress={() => setActiveTab("transfer")}
              activeOpacity={0.8}
            >
              <Send size={15} color={activeTab === "transfer" ? "#FFFFFF" : "#93C5FD"} />
              <Text style={[styles.tabText, activeTab === "transfer" && styles.tabTextActive]}>
                Bayar Transfer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === "riwayat" && styles.tabItemActive]}
              onPress={() => setActiveTab("riwayat")}
              activeOpacity={0.8}
            >
              <Receipt size={15} color={activeTab === "riwayat" ? "#FFFFFF" : "#93C5FD"} />
              <Text style={[styles.tabText, activeTab === "riwayat" && styles.tabTextActive]}>
                Riwayat & Kuitansi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === "rekening" && styles.tabItemActive]}
              onPress={() => setActiveTab("rekening")}
              activeOpacity={0.8}
            >
              <Building2 size={15} color={activeTab === "rekening" ? "#FFFFFF" : "#93C5FD"} />
              <Text style={[styles.tabText, activeTab === "rekening" && styles.tabTextActive]}>
                Rekening
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* ═══════════════════════════════════════════════════════
          CONTENT BODY
      ════════════════════════════════════════════════════════ */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} colors={["#162E6E"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Santri Info Banner */}
        <View style={styles.santriInfoBar}>
          <View style={styles.santriAvatar}>
            <Text style={styles.santriAvatarText}>{currentSiswa?.nama?.charAt(0) || "S"}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.santriName}>{currentSiswa?.nama || "Santri"}</Text>
            <Text style={styles.santriMeta}>
              Kelas: {currentSiswa?.kelas || "-"} • NIS: {currentSiswa?.nis || "-"}
            </Text>
          </View>
          <View style={styles.santriBadge}>
            <ShieldCheck size={14} color="#162E6E" />
            <Text style={styles.santriBadgeText}>Santri Aktif</Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════
            TAB 1: TAGIHAN AKTIF
        ════════════════════════════════════════════════════════ */}
        {activeTab === "tagihan" && (
          <View>
            {/* Overview Summary Cards */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Total Tunggakan</Text>
                  <Text style={[styles.summaryValue, { color: ringkasan.total_tunggakan > 0 ? "#DC2626" : "#16A34A" }]}>
                    {formatRupiah(ringkasan.total_tunggakan)}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: ringkasan.total_tunggakan > 0 ? "#FEF2F2" : "#F0FDF4" }]}>
                    {ringkasan.total_tunggakan > 0 ? (
                      <AlertCircle size={12} color="#DC2626" />
                    ) : (
                      <CheckCircle2 size={12} color="#16A34A" />
                    )}
                    <Text style={[styles.statusBadgeText, { color: ringkasan.total_tunggakan > 0 ? "#DC2626" : "#16A34A" }]}>
                      {ringkasan.total_tunggakan > 0 ? "Ada Tagihan Belum Lunas" : "Semua Tagihan Lunas"}
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Total Terbayar</Text>
                  <Text style={[styles.summaryValue, { color: "#162E6E" }]}>
                    {formatRupiah(ringkasan.total_terbayar)}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: "#EFF6FF" }]}>
                    <CheckCircle2 size={12} color="#1D4ED8" />
                    <Text style={[styles.statusBadgeText, { color: "#1D4ED8" }]}>
                      Terverifikasi Kasir
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Filter Category Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillsScroll}>
              <TouchableOpacity
                style={[styles.filterPill, activeKategoriFilter === "all" && styles.filterPillActive]}
                onPress={() => setActiveKategoriFilter("all")}
              >
                <Text style={[styles.filterPillText, activeKategoriFilter === "all" && styles.filterPillTextActive]}>
                  Semua Pos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, activeKategoriFilter === "pangkal" && styles.filterPillActive]}
                onPress={() => setActiveKategoriFilter("pangkal")}
              >
                <Text style={[styles.filterPillText, activeKategoriFilter === "pangkal" && styles.filterPillTextActive]}>
                  Uang Pangkal ({kategori.uang_pangkal.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, activeKategoriFilter === "spp" && styles.filterPillActive]}
                onPress={() => setActiveKategoriFilter("spp")}
              >
                <Text style={[styles.filterPillText, activeKategoriFilter === "spp" && styles.filterPillTextActive]}>
                  SPP Bulanan ({kategori.spp.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, activeKategoriFilter === "kegiatan" && styles.filterPillActive]}
                onPress={() => setActiveKategoriFilter("kegiatan")}
              >
                <Text style={[styles.filterPillText, activeKategoriFilter === "kegiatan" && styles.filterPillTextActive]}>
                  Kegiatan & Ujian ({kategori.kegiatan.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, activeKategoriFilter === "seragam" && styles.filterPillActive]}
                onPress={() => setActiveKategoriFilter("seragam")}
              >
                <Text style={[styles.filterPillText, activeKategoriFilter === "seragam" && styles.filterPillTextActive]}>
                  Seragam ({kategori.seragam.length})
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* 1. SECTION: UANG PANGKAL (BISA DICICIL) */}
            {(activeKategoriFilter === "all" || activeKategoriFilter === "pangkal") && kategori.uang_pangkal.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionIconBox, { backgroundColor: "#EFF6FF" }]}>
                    <Layers size={18} color="#1D4ED8" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.sectionHeading}>1. Uang Pangkal (DSP / Gedung)</Text>
                    <Text style={styles.sectionSubheading}>Dapat dicicil dengan nominal fleksibel</Text>
                  </View>
                </View>

                {kategori.uang_pangkal.map((item) => {
                  const percent = Math.min(100, Math.round((item.nominal_terbayar / item.nominal_total) * 100)) || 0;
                  const isLunas = item.status === "Lunas";

                  return (
                    <View key={item.tagihan_id} style={styles.tagihanCard}>
                      <View style={styles.cardTopRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle}>{item.nama_tagihan}</Text>
                          <Text style={styles.cardKeterangan}>{item.keterangan || "Tagihan Uang Pangkal Santri"}</Text>
                        </View>
                        <View style={[styles.tagihanStatusPill, isLunas ? styles.pillLunas : (item.nominal_terbayar > 0 ? styles.pillSebagian : styles.pillBelum)]}>
                          <Text style={[styles.tagihanStatusText, isLunas ? styles.textLunas : (item.nominal_terbayar > 0 ? styles.textSebagian : styles.textBelum)]}>
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      {/* Progress Bar Cicilan */}
                      <View style={styles.progressContainer}>
                        <View style={styles.progressLabels}>
                          <Text style={styles.progressLabelLeft}>Progress Pembayaran ({percent}%)</Text>
                          <Text style={styles.progressLabelRight}>Total: {formatRupiah(item.nominal_total)}</Text>
                        </View>
                        <View style={styles.progressBarTrack}>
                          <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
                        </View>
                        <View style={styles.progressBottomRow}>
                          <Text style={styles.progressTerbayar}>Terbayar: {formatRupiah(item.nominal_terbayar)}</Text>
                          <Text style={styles.progressSisa}>Sisa: {formatRupiah(item.sisa_tagihan)}</Text>
                        </View>
                      </View>

                      {!isLunas && (
                        <View style={styles.cardActionRow}>
                          <TouchableOpacity
                            style={styles.btnCicilBebas}
                            onPress={() => {
                              setTargetTagihanCicilan(item);
                              setNominalCicilanInput("");
                              setCicilanModalVisible(true);
                            }}
                            activeOpacity={0.8}
                          >
                            <PlusCircle size={15} color="#162E6E" />
                            <Text style={styles.btnCicilBebasText}>Input Nominal Cicilan</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.btnBayarLunas}
                            onPress={() => handleQuickPay(item)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.btnBayarLunasText}>Bayar Penuh</Text>
                            <ArrowRight size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* 2. SECTION: SPP BULANAN */}
            {(activeKategoriFilter === "all" || activeKategoriFilter === "spp") && kategori.spp.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionIconBox, { backgroundColor: "#FEF3C7" }]}>
                    <Calendar size={18} color="#D97706" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.sectionHeading}>2. SPP & Iuran Bulanan</Text>
                    <Text style={styles.sectionSubheading}>Tagihan rutin per bulan santri</Text>
                  </View>
                </View>

                {kategori.spp.map((item) => {
                  const isLunas = item.status === "Lunas";

                  return (
                    <View key={item.tagihan_id} style={styles.sppItemRow}>
                      <View style={[styles.sppStatusIndicator, { backgroundColor: isLunas ? "#16A34A" : "#DC2626" }]} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.sppTitle}>{item.nama_tagihan}</Text>
                        <Text style={styles.sppNominal}>{formatRupiah(item.nominal_total)}</Text>
                        {item.jatuh_tempo && (
                          <Text style={styles.sppTempo}>Jatuh Tempo: {item.jatuh_tempo}</Text>
                        )}
                      </View>

                      <View style={{ alignItems: "flex-end" }}>
                        <View style={[styles.tagihanStatusPill, isLunas ? styles.pillLunas : styles.pillBelum]}>
                          <Text style={[styles.tagihanStatusText, isLunas ? styles.textLunas : styles.textBelum]}>
                            {item.status}
                          </Text>
                        </View>

                        {!isLunas && (
                          <TouchableOpacity
                            style={styles.btnBayarSppSmall}
                            onPress={() => handleQuickPay(item)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.btnBayarSppText}>Bayar</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* 3. SECTION: KEGIATAN & UJIAN */}
            {(activeKategoriFilter === "all" || activeKategoriFilter === "kegiatan") && kategori.kegiatan.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionIconBox, { backgroundColor: "#F3E8FF" }]}>
                    <Sparkles size={18} color="#7E22CE" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.sectionHeading}>3. Kegiatan & Ujian Tahunan</Text>
                    <Text style={styles.sectionSubheading}>Biaya PAS, PAT, PHBI & Ekstrakurikuler</Text>
                  </View>
                </View>

                {kategori.kegiatan.map((item) => {
                  const isLunas = item.status === "Lunas";

                  return (
                    <View key={item.tagihan_id} style={styles.tagihanCard}>
                      <View style={styles.cardTopRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle}>{item.nama_tagihan}</Text>
                          <Text style={styles.cardNominalLarge}>{formatRupiah(item.nominal_total)}</Text>
                        </View>
                        <View style={[styles.tagihanStatusPill, isLunas ? styles.pillLunas : styles.pillBelum]}>
                          <Text style={[styles.tagihanStatusText, isLunas ? styles.textLunas : styles.textBelum]}>
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      {!isLunas && (
                        <TouchableOpacity
                          style={[styles.btnBayarLunas, { marginTop: 12 }]}
                          onPress={() => handleQuickPay(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.btnBayarLunasText}>Bayar Tagihan Ini</Text>
                          <ArrowRight size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* 4. SECTION: SERAGAM & PERLENGKAPAN */}
            {(activeKategoriFilter === "all" || activeKategoriFilter === "seragam") && kategori.seragam.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionIconBox, { backgroundColor: "#ECFDF5" }]}>
                    <ShieldCheck size={18} color="#059669" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.sectionHeading}>4. Seragam & Perlengkapan Santri</Text>
                    <Text style={styles.sectionSubheading}>Paket seragam santri baru</Text>
                  </View>
                </View>

                {kategori.seragam.map((item) => {
                  const isLunas = item.status === "Lunas";

                  return (
                    <View key={item.tagihan_id} style={styles.tagihanCard}>
                      <View style={styles.cardTopRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle}>{item.nama_tagihan}</Text>
                          <Text style={styles.cardNominalLarge}>{formatRupiah(item.nominal_total)}</Text>
                        </View>
                        <View style={[styles.tagihanStatusPill, isLunas ? styles.pillLunas : styles.pillBelum]}>
                          <Text style={[styles.tagihanStatusText, isLunas ? styles.textLunas : styles.textBelum]}>
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      {!isLunas && (
                        <TouchableOpacity
                          style={[styles.btnBayarLunas, { marginTop: 12 }]}
                          onPress={() => handleQuickPay(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.btnBayarLunasText}>Bayar Seragam</Text>
                          <ArrowRight size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB 2: KONFIRMASI BAYAR TRANSFER
        ════════════════════════════════════════════════════════ */}
        {activeTab === "transfer" && (
          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <Text style={styles.formHeading}>Form Konfirmasi Transfer Bank</Text>
              <Text style={styles.formSubheading}>
                Pilih rekening bank tujuan pesantren & centang tagihan yang telah ditransfer
              </Text>

              {/* 1. Pilih Rekening Pesantren */}
              <Text style={styles.inputSectionLabel}>1. Pilih Rekening Bank Pesantren Tujuan:</Text>
              {rekeningList.map((rek) => {
                const isSelected = selectedBankId === rek.rekening_id;
                return (
                  <TouchableOpacity
                    key={rek.rekening_id}
                    style={[styles.bankSelectCard, isSelected && styles.bankSelectCardActive]}
                    onPress={() => setSelectedBankId(rek.rekening_id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.bankSelectHeader}>
                      <Building2 size={18} color={isSelected ? "#1D4ED8" : "#64748B"} />
                      <Text style={[styles.bankSelectName, isSelected && styles.bankSelectNameActive]}>
                        {rek.nama_bank}
                      </Text>
                      {isSelected && <CheckCircle2 size={18} color="#1D4ED8" />}
                    </View>
                    <Text style={styles.bankSelectNomor}>{rek.nomor_rekening}</Text>
                    <Text style={styles.bankSelectAn}>a.n {rek.atas_nama}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* 2. Pilih Tagihan Yang Dibayar */}
              <Text style={[styles.inputSectionLabel, { marginTop: 18 }]}>2. Pilih Tagihan Yang Dibayar:</Text>
              {[...kategori.uang_pangkal, ...kategori.spp, ...kategori.kegiatan, ...kategori.seragam]
                .filter((t) => t.status !== "Lunas")
                .map((t) => {
                  const isChecked = Boolean(selectedTagihanIds[t.tagihan_id]);
                  const currentNominal = selectedTagihanIds[t.tagihan_id] || t.sisa_tagihan;

                  return (
                    <View key={t.tagihan_id} style={[styles.tagihanCheckItem, isChecked && styles.tagihanCheckItemActive]}>
                      <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => {
                          if (isChecked) {
                            const copy = { ...selectedTagihanIds };
                            delete copy[t.tagihan_id];
                            setSelectedTagihanIds(copy);
                          } else {
                            setSelectedTagihanIds({ ...selectedTagihanIds, [t.tagihan_id]: t.sisa_tagihan });
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxActive]}>
                          {isChecked && <Check size={14} color="#FFFFFF" />}
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.checkTitle}>{t.nama_tagihan}</Text>
                          <Text style={styles.checkSisa}>Sisa: {formatRupiah(t.sisa_tagihan)}</Text>
                        </View>
                      </TouchableOpacity>

                      {isChecked && t.pos.kode_pos === "PANGKAL" && (
                        <View style={styles.customNominalBox}>
                          <Text style={styles.customNominalLabel}>Nominal yang dibayar kali ini (Rp):</Text>
                          <TextInput
                            style={styles.customNominalInput}
                            keyboardType="numeric"
                            value={String(currentNominal)}
                            onChangeText={(val) => {
                              const num = parseFloat(val.replace(/[^0-9]/g, "")) || 0;
                              setSelectedTagihanIds({ ...selectedTagihanIds, [t.tagihan_id]: num });
                            }}
                          />
                        </View>
                      )}
                    </View>
                  );
                })}

              {/* 3. Info Rekening Pengirim */}
              <Text style={[styles.inputSectionLabel, { marginTop: 18 }]}>3. Data Pengirim Transfer:</Text>

              <Text style={styles.formInputLabel}>Nama Pemilik Rekening Pengirim *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Contoh: Muhammad Fulan (Wali)"
                placeholderTextColor="#94A3B8"
                value={namaPengirim}
                onChangeText={setNamaPengirim}
              />

              <Text style={styles.formInputLabel}>Nama Bank Pengirim (Opsional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Contoh: BCA / BSI / BRI"
                placeholderTextColor="#94A3B8"
                value={bankPengirim}
                onChangeText={setBankPengirim}
              />

              <Text style={styles.formInputLabel}>Catatan Tambahan (Opsional)</Text>
              <TextInput
                style={[styles.formInput, { height: 70, textAlignVertical: "top" }]}
                placeholder="Contoh: Transfer via Mobile Banking pukul 09.30 WIB"
                placeholderTextColor="#94A3B8"
                multiline
                value={catatanTransfer}
                onChangeText={setCatatanTransfer}
              />

              {/* Total Summary */}
              <View style={styles.totalBayarBox}>
                <Text style={styles.totalBayarLabel}>Total Yang Akan Dikonfirmasi:</Text>
                <Text style={styles.totalBayarValue}>{formatRupiah(totalPilihanTransfer)}</Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.btnSubmitTransfer, mutationAjukan.isPending && { opacity: 0.7 }]}
                onPress={handleSubmitTransfer}
                disabled={mutationAjukan.isPending}
                activeOpacity={0.8}
              >
                {mutationAjukan.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={18} color="#FFFFFF" />
                    <Text style={styles.btnSubmitTransferText}>Kirim Konfirmasi Transfer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB 3: RIWAYAT TRANSAKSI & KUITANSI
        ════════════════════════════════════════════════════════ */}
        {activeTab === "riwayat" && (
          <View style={styles.riwayatContainer}>
            {riwayatTransaksi.length === 0 ? (
              <View style={styles.emptyCard}>
                <Receipt size={40} color="#94A3B8" />
                <Text style={styles.emptyTitle}>Belum Ada Riwayat Pembayaran</Text>
                <Text style={styles.emptySubtitle}>
                  Transaksi pembayaran yang dilakukan di loket atau via transfer akan tercatat di sini.
                </Text>
              </View>
            ) : (
              riwayatTransaksi.map((trx) => {
                const isApproved = trx.status === "Disetujui";
                const isPending = trx.status === "Menunggu Verifikasi";
                const isRejected = trx.status === "Ditolak";

                return (
                  <View key={trx.transaksi_id} style={styles.riwayatCard}>
                    <View style={styles.riwayatTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.riwayatNo}>{trx.nomor_transaksi}</Text>
                        <Text style={styles.riwayatDate}>{trx.tanggal_bayar} • {trx.metode_pembayaran}</Text>
                      </View>
                      <View
                        style={[
                          styles.trxStatusPill,
                          isApproved && styles.pillLunas,
                          isPending && styles.pillSebagian,
                          isRejected && styles.pillBelum,
                        ]}
                      >
                        <Text
                          style={[
                            styles.trxStatusText,
                            isApproved && styles.textLunas,
                            isPending && styles.textSebagian,
                            isRejected && styles.textBelum,
                          ]}
                        >
                          {trx.status}
                        </Text>
                      </View>
                    </View>

                    {/* Breakdown items */}
                    {trx.items && trx.items.length > 0 && (
                      <View style={styles.trxItemsContainer}>
                        {trx.items.map((it) => (
                          <View key={it.item_id} style={styles.trxItemRow}>
                            <Text style={styles.trxItemName}>
                              {it.tagihan?.nama_tagihan || `Tagihan #${it.tagihan_id}`}
                            </Text>
                            <Text style={styles.trxItemNominal}>{formatRupiah(it.nominal_bayar)}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.riwayatDivider} />

                    <View style={styles.riwayatBottomRow}>
                      <View>
                        <Text style={styles.riwayatTotalLabel}>Total Pembayaran</Text>
                        <Text style={styles.riwayatTotalVal}>{formatRupiah(trx.total_bayar)}</Text>
                      </View>

                      {isApproved && (
                        <TouchableOpacity
                          style={styles.btnLihatKuitansi}
                          onPress={() => setSelectedKuitansi(trx)}
                          activeOpacity={0.8}
                        >
                          <Receipt size={14} color="#162E6E" />
                          <Text style={styles.btnLihatKuitansiText}>Kuitansi Digital</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB 4: MASTER REKENING RESMI PESANTREN
        ════════════════════════════════════════════════════════ */}
        {activeTab === "rekening" && (
          <View style={styles.rekeningContainer}>
            <View style={styles.infoRekeningBanner}>
              <ShieldCheck size={20} color="#162E6E" />
              <Text style={styles.infoRekeningBannerText}>
                Hanya lakukan transfer ke rekening resmi Yayasan Pondok Pesantren Maskumambang berikut untuk menghindari penipuan.
              </Text>
            </View>

            {rekeningList.map((rek) => (
              <View key={rek.rekening_id} style={styles.rekeningCard}>
                <View style={styles.rekCardHeader}>
                  <Building2 size={20} color="#162E6E" />
                  <Text style={styles.rekBankName}>{rek.nama_bank}</Text>
                  {rek.cabang && <Text style={styles.rekCabang}>({rek.cabang})</Text>}
                </View>

                <View style={styles.rekNumberBox}>
                  <Text style={styles.rekNumberText}>{rek.nomor_rekening}</Text>
                  <TouchableOpacity
                    style={styles.btnCopy}
                    onPress={() => Alert.alert("Tersalin", `Nomor rekening ${rek.nomor_rekening} siap digunakan.`)}
                  >
                    <Copy size={15} color="#162E6E" />
                    <Text style={styles.btnCopyText}>Salin</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.rekAtasNama}>Atas Nama: <Text style={{ fontWeight: "700" }}>{rek.atas_nama}</Text></Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════
          MODAL 1: INPUT NOMINAL CICILAN BEBAS
      ════════════════════════════════════════════════════════ */}
      <Modal
        visible={cicilanModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCicilanModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Input Nominal Cicilan</Text>
              <TouchableOpacity onPress={() => setCicilanModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {targetTagihanCicilan && (
              <View>
                <Text style={styles.modalTagihanName}>{targetTagihanCicilan.nama_tagihan}</Text>
                <Text style={styles.modalSisa}>Sisa Tagihan: {formatRupiah(targetTagihanCicilan.sisa_tagihan)}</Text>

                <Text style={[styles.formInputLabel, { marginTop: 14 }]}>Masukkan Jumlah Pembayaran (Rp):</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  placeholder="Contoh: 1500000"
                  placeholderTextColor="#94A3B8"
                  value={nominalCicilanInput}
                  onChangeText={setNominalCicilanInput}
                  autoFocus
                />

                {/* Preset Fast Pills */}
                <View style={styles.presetPillsRow}>
                  {[500000, 1000000, 2000000, 5000000].map((amt) => {
                    if (amt > targetTagihanCicilan.sisa_tagihan) return null;
                    return (
                      <TouchableOpacity
                        key={amt}
                        style={styles.presetPill}
                        onPress={() => setNominalCicilanInput(String(amt))}
                      >
                        <Text style={styles.presetPillText}>{formatRupiah(amt)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={styles.btnModalLanjut}
                  onPress={() => {
                    const num = parseFloat(nominalCicilanInput.replace(/[^0-9]/g, "")) || 0;
                    if (num <= 0) {
                      Alert.alert("Perhatian", "Nominal cicilan harus lebih dari 0");
                      return;
                    }
                    if (num > targetTagihanCicilan.sisa_tagihan) {
                      Alert.alert("Perhatian", "Nominal cicilan tidak boleh melebihi sisa tagihan");
                      return;
                    }
                    setCicilanModalVisible(false);
                    handleQuickPay(targetTagihanCicilan, num);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnModalLanjutText}>Lanjut ke Pembayaran</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL 2: KUITANSI DIGITAL RESMI
      ════════════════════════════════════════════════════════ */}
      <Modal
        visible={Boolean(selectedKuitansi)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedKuitansi(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.kuitansiModalContainer}>
            <View style={styles.kuitansiModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kuitansiOrgTitle}>PONDOK PESANTREN MASKUMAMBANG</Text>
                <Text style={styles.kuitansiOrgSubtitle}>Kuitansi Resmi Pembayaran Digital</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedKuitansi(null)}>
                <X size={22} color="#162E6E" />
              </TouchableOpacity>
            </View>

            {selectedKuitansi && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
                <View style={styles.kuitansiBox}>
                  <View style={styles.kuitansiRow}>
                    <Text style={styles.kLabel}>No. Transaksi</Text>
                    <Text style={styles.kValBold}>{selectedKuitansi.nomor_transaksi}</Text>
                  </View>
                  <View style={styles.kuitansiRow}>
                    <Text style={styles.kLabel}>Tanggal</Text>
                    <Text style={styles.kVal}>{selectedKuitansi.tanggal_bayar}</Text>
                  </View>
                  <View style={styles.kuitansiRow}>
                    <Text style={styles.kLabel}>Metode Bayar</Text>
                    <Text style={styles.kVal}>{selectedKuitansi.metode_pembayaran}</Text>
                  </View>
                  <View style={styles.kuitansiRow}>
                    <Text style={styles.kLabel}>Nama Santri</Text>
                    <Text style={styles.kValBold}>{currentSiswa?.nama || "-"}</Text>
                  </View>
                  <View style={styles.kuitansiRow}>
                    <Text style={styles.kLabel}>NIS / Kelas</Text>
                    <Text style={styles.kVal}>{currentSiswa?.nis || "-"} / {currentSiswa?.kelas || "-"}</Text>
                  </View>

                  <View style={styles.kuitansiDivider} />

                  <Text style={styles.kuitansiItemHeader}>Rincian Pos Pembayaran:</Text>
                  {selectedKuitansi.items?.map((it) => (
                    <View key={it.item_id} style={styles.kuitansiItemRow}>
                      <Text style={styles.kItemName}>{it.tagihan?.nama_tagihan || `Tagihan #${it.tagihan_id}`}</Text>
                      <Text style={styles.kItemVal}>{formatRupiah(it.nominal_bayar)}</Text>
                    </View>
                  ))}

                  <View style={styles.kuitansiDivider} />

                  <View style={styles.kuitansiTotalRow}>
                    <Text style={styles.kTotalLabel}>TOTAL DITERIMA</Text>
                    <Text style={styles.kTotalVal}>{formatRupiah(selectedKuitansi.total_bayar)}</Text>
                  </View>

                  <View style={styles.stampBox}>
                    <CheckCircle2 size={32} color="#16A34A" />
                    <Text style={styles.stampText}>LUNAS / VERIFIED</Text>
                    <Text style={styles.stampDate}>Sistem Keuangan Maskumambang</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.btnCloseKuitansi}
                  onPress={() => setSelectedKuitansi(null)}
                >
                  <Text style={styles.btnCloseKuitansiText}>Tutup Kuitansi</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SwipeBackContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FE",
  },
  header: {
    backgroundColor: "#162E6E",
    paddingBottom: 12,
  },
  headerSafe: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 10 : 4,
  },
  topNavRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17.5,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#93C5FD",
    fontSize: 11.5,
    fontWeight: "500",
    marginTop: 1,
  },
  headerRightBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  santriSelector: {
    marginTop: 12,
  },
  santriChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginRight: 8,
  },
  santriChipActive: {
    backgroundColor: "#1D4ED8",
  },
  santriChipText: {
    fontSize: 12,
    color: "#93C5FD",
    fontWeight: "600",
    marginLeft: 6,
  },
  santriChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    padding: 3,
    marginTop: 14,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: "#1D4ED8",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#93C5FD",
    marginLeft: 4,
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
  },
  santriInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  santriAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#162E6E",
    alignItems: "center",
    justifyContent: "center",
  },
  santriAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  santriName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  santriMeta: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
  },
  santriBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  santriBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#162E6E",
    marginLeft: 4,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
  },
  summaryCol: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 4,
  },
  filterPillsScroll: {
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: "#162E6E",
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#475569",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  sectionContainer: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1E293B",
  },
  sectionSubheading: {
    fontSize: 11,
    color: "#64748B",
  },
  tagihanCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  cardKeterangan: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  cardNominalLarge: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#162E6E",
    marginTop: 4,
  },
  tagihanStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillLunas: {
    backgroundColor: "#DCFCE7",
  },
  pillSebagian: {
    backgroundColor: "#FEF3C7",
  },
  pillBelum: {
    backgroundColor: "#FEE2E2",
  },
  tagihanStatusText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  textLunas: {
    color: "#16A34A",
  },
  textSebagian: {
    color: "#D97706",
  },
  textBelum: {
    color: "#DC2626",
  },
  progressContainer: {
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabelLeft: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#475569",
  },
  progressLabelRight: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#1D4ED8",
    borderRadius: 4,
  },
  progressBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressTerbayar: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
  },
  progressSisa: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  cardActionRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  btnCicilBebas: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnCicilBebasText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#162E6E",
    marginLeft: 6,
  },
  btnBayarLunas: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#162E6E",
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnBayarLunasText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#FFFFFF",
    marginRight: 6,
  },
  sppItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  sppStatusIndicator: {
    width: 4,
    height: 38,
    borderRadius: 2,
  },
  sppTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  sppNominal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#162E6E",
    marginTop: 1,
  },
  sppTempo: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  btnBayarSppSmall: {
    backgroundColor: "#162E6E",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  btnBayarSppText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  formContainer: {
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  formHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },
  formSubheading: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 12,
  },
  inputSectionLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#162E6E",
    marginBottom: 8,
  },
  bankSelectCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  bankSelectCardActive: {
    borderColor: "#1D4ED8",
    backgroundColor: "#EFF6FF",
  },
  bankSelectHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  bankSelectName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginLeft: 8,
    flex: 1,
  },
  bankSelectNameActive: {
    color: "#1D4ED8",
  },
  bankSelectNomor: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 6,
  },
  bankSelectAn: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  tagihanCheckItem: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  tagihanCheckItemActive: {
    borderColor: "#93C5FD",
    backgroundColor: "#F0F9FF",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBoxActive: {
    backgroundColor: "#1D4ED8",
    borderColor: "#1D4ED8",
  },
  checkTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  checkSisa: {
    fontSize: 11,
    fontWeight: "600",
    color: "#DC2626",
  },
  customNominalBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  customNominalLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 4,
  },
  customNominalInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  formInputLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#475569",
    marginTop: 10,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12.5,
    color: "#1E293B",
  },
  totalBayarBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  totalBayarLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#162E6E",
  },
  totalBayarValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  btnSubmitTransfer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#162E6E",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
    gap: 8,
  },
  btnSubmitTransferText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  riwayatContainer: {
    marginBottom: 20,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 11.5,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
  riwayatCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  riwayatTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  riwayatNo: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  riwayatDate: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  trxStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  trxStatusText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  trxItemsContainer: {
    marginTop: 8,
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 6,
  },
  trxItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  trxItemName: {
    fontSize: 11,
    color: "#475569",
  },
  trxItemNominal: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E293B",
  },
  riwayatDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 10,
  },
  riwayatBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  riwayatTotalLabel: {
    fontSize: 10.5,
    color: "#64748B",
  },
  riwayatTotalVal: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#162E6E",
  },
  btnLihatKuitansi: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  btnLihatKuitansiText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#162E6E",
  },
  rekeningContainer: {
    marginBottom: 20,
  },
  infoRekeningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 12,
  },
  infoRekeningBannerText: {
    fontSize: 11.5,
    color: "#162E6E",
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  rekeningCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  rekCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  rekBankName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#162E6E",
    marginLeft: 8,
  },
  rekCabang: {
    fontSize: 11.5,
    color: "#64748B",
    marginLeft: 4,
  },
  rekNumberBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  rekNumberText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: 1,
  },
  btnCopy: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  btnCopyText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#162E6E",
  },
  rekAtasNama: {
    fontSize: 12,
    color: "#475569",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },
  modalTagihanName: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#162E6E",
  },
  modalSisa: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
    marginTop: 2,
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#1D4ED8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  presetPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  presetPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#162E6E",
  },
  btnModalLanjut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#162E6E",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  btnModalLanjutText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  kuitansiModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    width: "100%",
    maxHeight: "85%",
  },
  kuitansiModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 10,
  },
  kuitansiOrgTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#162E6E",
  },
  kuitansiOrgSubtitle: {
    fontSize: 11,
    color: "#64748B",
  },
  kuitansiBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  kuitansiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  kLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  kVal: {
    fontSize: 11,
    color: "#1E293B",
  },
  kValBold: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  kuitansiDivider: {
    height: 1,
    backgroundColor: "#CBD5E1",
    marginVertical: 8,
  },
  kuitansiItemHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 4,
  },
  kuitansiItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  kItemName: {
    fontSize: 11,
    color: "#1E293B",
  },
  kItemVal: {
    fontSize: 11,
    fontWeight: "700",
    color: "#162E6E",
  },
  kuitansiTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 8,
    borderRadius: 6,
  },
  kTotalLabel: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#162E6E",
  },
  kTotalVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  stampBox: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
  },
  stampText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#16A34A",
    marginTop: 4,
  },
  stampDate: {
    fontSize: 10,
    color: "#15803D",
    marginTop: 1,
  },
  btnCloseKuitansi: {
    backgroundColor: "#162E6E",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 14,
  },
  btnCloseKuitansiText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
