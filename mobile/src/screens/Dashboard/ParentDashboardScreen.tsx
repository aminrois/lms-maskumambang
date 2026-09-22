// mobile/src/screens/Dashboard/ParentDashboardScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  Clock,
  Compass,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  MapPin,
  X,
  Star,
  FileText,
} from "lucide-react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { waliService } from "../../api/waliService";
import {
  INDONESIAN_CITIES,
  CityLocation,
  calculatePrayerTimes,
} from "../../utils/prayerAndQibla";

const HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

const getNamaHariIni = () => {
  const dayIndex = new Date().getDay();
  const map = [6, 0, 1, 2, 3, 4, 5];
  return HARI_ORDER[map[dayIndex]];
};

const formatTanggal = (dateStr?: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const kelancaranColor: Record<string, { bg: string; text: string }> = {
  Lancar: { bg: "#DCFCE7", text: "#16A34A" },
  Sedang: { bg: "#FEF9C3", text: "#B45309" },
  Terbata: { bg: "#FEE2E2", text: "#DC2626" },
  "Terbata-bata": { bg: "#FEE2E2", text: "#DC2626" },
};

export const ParentDashboardScreen = () => {
  const { user } = useAuthStore();
  const [selectedCity, setSelectedCity] = useState<CityLocation>(INDONESIAN_CITIES[0]);
  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(null);
  const [showCityPickerModal, setShowCityPickerModal] = useState(false);
  const [showSholatModal, setShowSholatModal] = useState(false);
  const [showKiblatModal, setShowKiblatModal] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [activeTab, setActiveTab] = useState<"hafalan" | "presensi" | "jadwal">("hafalan");

  const {
    data: daftarAnak = [],
    isLoading: isLoadingAnak,
    refetch: refetchAnak,
    isRefetching,
  } = useQuery({
    queryKey: ["wali-daftar-anak"],
    queryFn: () => waliService.getDaftarAnak(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (daftarAnak.length > 0 && selectedSiswaId === null) {
      setSelectedSiswaId(daftarAnak[0].siswa_id);
    }
  }, [daftarAnak, selectedSiswaId]);

  const {
    data: perkembangan,
    isLoading: isLoadingPerkembangan,
    refetch: refetchPerkembangan,
  } = useQuery({
    queryKey: ["wali-perkembangan-anak", selectedSiswaId],
    queryFn: () => (selectedSiswaId ? waliService.getPerkembanganAnak(selectedSiswaId) : null),
    enabled: !!selectedSiswaId,
    staleTime: 2 * 60 * 1000,
  });

  const onRefresh = async () => {
    await Promise.all([refetchAnak(), refetchPerkembangan()]);
  };

  const prayerData = useMemo(() => calculatePrayerTimes(selectedCity), [selectedCity]);
  const qiblaAngle = (prayerData.qiblaBearing - deviceHeading + 360) % 360;
  const isQiblaAligned = Math.abs(qiblaAngle) < 4 || Math.abs(qiblaAngle - 360) < 4;

  const activeAnak = useMemo(
    () => daftarAnak.find((a) => a.siswa_id === selectedSiswaId) || daftarAnak[0],
    [daftarAnak, selectedSiswaId]
  );

  const rekap = perkembangan?.presensi?.rekap30Hari;
  const totalHari = (rekap?.hadir || 0) + (rekap?.izin || 0) + (rekap?.sakit || 0) + (rekap?.alpa || 0);
  const persentaseHadir = totalHari > 0 ? Math.round(((rekap?.hadir || 0) / totalHari) * 100) : 0;
  const totalSetoran = perkembangan?.tahfidz?.summary?.totalSetoran || 0;
  const totalJuz = perkembangan?.tahfidz?.summary?.totalJuzZiyadah || 0;
  const hariIni = getNamaHariIni();

  const jadwalHariIni = useMemo(() => {
    if (!perkembangan?.jadwalPelajaran) return [];
    return perkembangan.jadwalPelajaran.filter((j: any) => j.hari === hariIni);
  }, [perkembangan, hariIni]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerGreeting}>Assalamu'alaikum,</Text>
            <Text style={styles.headerName}>{user?.username || "Wali Murid"}</Text>
          </View>
          <TouchableOpacity style={styles.headerLocationBtn} onPress={() => setShowCityPickerModal(true)}>
            <MapPin size={12} color="#6EE7B7" />
            <Text style={styles.headerLocationText}>{selectedCity.name}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.prayerStrip} onPress={() => setShowSholatModal(true)} activeOpacity={0.85}>
          <View style={styles.prayerStripLeft}>
            <Clock size={13} color="#10B981" />
            <Text style={styles.prayerStripText}>
              {prayerData.nextPrayer.name}: {prayerData.nextPrayer.time} WIB
            </Text>
            <View style={styles.prayerCountdownBadge}>
              <Text style={styles.prayerCountdownText}>{prayerData.nextPrayer.countdown}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowKiblatModal(true)}>
            <Compass size={15} color="#A7F3D0" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={["#10B981"]} />
        }
      >
        {/* Pilihan Anak */}
        {daftarAnak.length > 1 && (
          <View style={styles.childSelectorRow}>
            <Text style={styles.childSelectorLabel}>Pantau Ananda:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {daftarAnak.map((anak) => {
                const isSelected = anak.siswa_id === selectedSiswaId;
                return (
                  <TouchableOpacity
                    key={anak.siswa_id}
                    style={[styles.childPill, isSelected && styles.childPillActive]}
                    onPress={() => setSelectedSiswaId(anak.siswa_id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.childPillDot, isSelected && styles.childPillDotActive]}>
                      <Text style={[styles.childPillDotText, isSelected && { color: "#FFFFFF" }]}>
                        {anak.nama.charAt(0)}
                      </Text>
                    </View>
                    <Text style={[styles.childPillText, isSelected && styles.childPillTextActive]}>
                      {anak.panggilan || anak.nama.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Kartu Profil Santri */}
        {isLoadingAnak ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.loadingText}>Memuat data ananda...</Text>
          </View>
        ) : activeAnak ? (
          <View style={styles.santriCard}>
            <View style={styles.santriAvatar}>
              <Text style={styles.santriAvatarLetter}>{activeAnak.nama.charAt(0)}</Text>
            </View>
            <View style={styles.santriInfo}>
              <Text style={styles.santriName}>{activeAnak.nama}</Text>
              <Text style={styles.santriNisn}>NISN: {activeAnak.nisn || "-"}</Text>
              <View style={styles.santriMetaRow}>
                <View style={styles.santriMetaBadge}>
                  <BookOpen size={10} color="#7C3AED" />
                  <Text style={styles.santriMetaBadgeText}>
                    {activeAnak.kelas?.nama_kelas || "Kelas -"}
                  </Text>
                </View>
                <View style={[styles.santriMetaBadge, { backgroundColor: "#F0FDF4", borderColor: "#DCFCE7" }]}>
                  <Text style={[styles.santriMetaBadgeText, { color: "#16A34A" }]}>
                    {activeAnak.kelas?.lembaga?.nama_lembaga || "Maskumambang"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Ringkasan Statistik */}
        {!isLoadingPerkembangan && (
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: "#F0FDF4" }]}>
              <TrendingUp size={16} color="#16A34A" />
              <Text style={[styles.statNumber, { color: "#16A34A" }]}>{persentaseHadir}%</Text>
              <Text style={styles.statLabel}>Kehadiran</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: "#EDE9FE" }]}>
              <Star size={16} color="#7C3AED" />
              <Text style={[styles.statNumber, { color: "#7C3AED" }]}>{totalSetoran}×</Text>
              <Text style={styles.statLabel}>Setoran</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: "#FFF7ED" }]}>
              <BookOpen size={16} color="#EA580C" />
              <Text style={[styles.statNumber, { color: "#EA580C" }]}>{totalJuz} Juz</Text>
              <Text style={styles.statLabel}>Ziyadah</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: "#EFF6FF" }]}>
              <Calendar size={16} color="#2563EB" />
              <Text style={[styles.statNumber, { color: "#2563EB" }]}>{jadwalHariIni.length}</Text>
              <Text style={styles.statLabel}>Pelajaran Hari Ini</Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(["hafalan", "presensi", "jadwal"] as const).map((tab) => {
            const labels = { hafalan: "📖 Hafalan", presensi: "📅 Presensi", jadwal: "🗓️ Jadwal" };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TAB: HAFALAN */}
        {activeTab === "hafalan" && (
          <View style={styles.tabContent}>
            {isLoadingPerkembangan ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color="#7C3AED" />
                <Text style={styles.loadingText}>Memuat riwayat hafalan...</Text>
              </View>
            ) : (
              <>
                <View style={styles.hafalanSummaryCard}>
                  <View style={styles.hafalanSummaryItem}>
                    <Text style={styles.hafalanSumLabel}>Total Ziyadah</Text>
                    <Text style={styles.hafalanSumValue}>
                      {perkembangan?.tahfidz?.summary?.totalAyatZiyadah || 0} Ayat
                    </Text>
                    <Text style={styles.hafalanSumSub}>
                      ≈ {perkembangan?.tahfidz?.summary?.totalJuzZiyadah || 0} Juz
                    </Text>
                  </View>
                  <View style={styles.hafalanSumDivider} />
                  <View style={styles.hafalanSummaryItem}>
                    <Text style={styles.hafalanSumLabel}>Total Setoran</Text>
                    <Text style={styles.hafalanSumValue}>{totalSetoran} Kali</Text>
                    <Text style={styles.hafalanSumSub}>Seluruh jenis</Text>
                  </View>
                </View>

                <Text style={styles.subSectionTitle}>Riwayat Setoran Terakhir</Text>
                {perkembangan?.tahfidz?.recentSetoran && perkembangan.tahfidz.recentSetoran.length > 0 ? (
                  perkembangan.tahfidz.recentSetoran.slice(0, 5).map((s: any, idx: number) => {
                    const kColor = kelancaranColor[s.kelancaran || "Lancar"] || kelancaranColor["Lancar"];
                    const jenisLabel =
                      s.jenis_hafalan === "Setoran Baru"
                        ? "🆕 Ziyadah"
                        : s.jenis_hafalan === "Setoran Ulang"
                        ? "🔁 Muraja'ah"
                        : "📝 Ujian";
                    const namaHafalan =
                      s.kategori === "Al-Quran"
                        ? `${s.surat_mulai_nama || "Al-Qur'an"} Ayat ${s.ayat_mulai || 1}–${s.ayat_selesai || 7}`
                        : s.kategori === "Hadits"
                        ? `Hadits ke-${s.hadits_mulai || 1}–${s.hadits_selesai || 1}`
                        : s.nama_bait || "Setoran";
                    return (
                      <View key={idx} style={styles.setoranCard}>
                        <View style={styles.setoranCardTop}>
                          <View style={styles.setoranCardLeft}>
                            <Text style={styles.setoranSurat}>{namaHafalan}</Text>
                            <Text style={styles.setoranJenis}>
                              {jenisLabel} • Ustadz: {s.pegawai?.nama || "-"}
                            </Text>
                          </View>
                          <View style={[styles.kelancaranBadge, { backgroundColor: kColor.bg }]}>
                            <Text style={[styles.kelancaranBadgeText, { color: kColor.text }]}>
                              {s.kelancaran || "Lancar"}
                            </Text>
                          </View>
                        </View>
                        {s.catatan_guru ? (
                          <View style={styles.catatanBox}>
                            <FileText size={11} color="#64748B" />
                            <Text style={styles.catatanText}>"{s.catatan_guru}"</Text>
                          </View>
                        ) : null}
                        <Text style={styles.setoranTanggal}>{formatTanggal(s.tanggal)}</Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyBox}>
                    <BookOpen size={28} color="#CBD5E1" />
                    <Text style={styles.emptyText}>Belum ada catatan setoran hafalan.</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* TAB: PRESENSI */}
        {activeTab === "presensi" && (
          <View style={styles.tabContent}>
            {isLoadingPerkembangan ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.loadingText}>Memuat data presensi...</Text>
              </View>
            ) : (
              <>
                <View style={styles.todayStatusCard}>
                  <Text style={styles.todayStatusLabel}>Status Kehadiran Hari Ini</Text>
                  {perkembangan?.presensi?.hariIni ? (
                    <View style={styles.todayStatusRow}>
                      {perkembangan.presensi.hariIni.status === "Hadir" ? (
                        <CheckCircle2 size={20} color="#16A34A" />
                      ) : perkembangan.presensi.hariIni.status === "Alpa" ? (
                        <XCircle size={20} color="#DC2626" />
                      ) : (
                        <AlertCircle size={20} color="#D97706" />
                      )}
                      <Text style={styles.todayStatusValue}>
                        {perkembangan.presensi.hariIni.status}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.todayStatusRow}>
                      <AlertCircle size={20} color="#94A3B8" />
                      <Text style={[styles.todayStatusValue, { color: "#94A3B8" }]}>Belum ada data</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.subSectionTitle}>Rekapitulasi 30 Hari Terakhir</Text>
                <View style={styles.presensiGrid}>
                  {[
                    { label: "Hadir", val: rekap?.hadir || 0, bg: "#F0FDF4", color: "#16A34A" },
                    { label: "Izin", val: rekap?.izin || 0, bg: "#FEF9C3", color: "#CA8A04" },
                    { label: "Sakit", val: rekap?.sakit || 0, bg: "#EFF6FF", color: "#2563EB" },
                    { label: "Alpa", val: rekap?.alpa || 0, bg: "#FEF2F2", color: "#DC2626" },
                  ].map((item) => (
                    <View key={item.label} style={[styles.presensiBox, { backgroundColor: item.bg }]}>
                      <Text style={[styles.presensiNumber, { color: item.color }]}>{item.val}</Text>
                      <Text style={styles.presensiLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.progressCard}>
                  <View style={styles.progressCardHeader}>
                    <Text style={styles.progressCardTitle}>Tingkat Kehadiran</Text>
                    <Text
                      style={[
                        styles.progressCardPct,
                        {
                          color:
                            persentaseHadir >= 80 ? "#16A34A" : persentaseHadir >= 60 ? "#CA8A04" : "#DC2626",
                        },
                      ]}
                    >
                      {persentaseHadir}%
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${persentaseHadir}%` as any,
                          backgroundColor:
                            persentaseHadir >= 80 ? "#16A34A" : persentaseHadir >= 60 ? "#F59E0B" : "#EF4444",
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressCardSub}>
                    {persentaseHadir >= 80
                      ? "✅ Kehadiran sangat baik — pertahankan!"
                      : persentaseHadir >= 60
                      ? "⚠️ Kehadiran cukup — perlu ditingkatkan."
                      : "❌ Kehadiran rendah — harap diperhatikan."}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* TAB: JADWAL */}
        {activeTab === "jadwal" && (
          <View style={styles.tabContent}>
            {isLoadingPerkembangan ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color="#7C3AED" />
                <Text style={styles.loadingText}>Memuat jadwal pelajaran...</Text>
              </View>
            ) : (
              <>
                {jadwalHariIni.length > 0 && (
                  <>
                    <View style={styles.todayScheduleBadge}>
                      <Calendar size={12} color="#FFFFFF" />
                      <Text style={styles.todayScheduleBadgeText}>Jadwal Hari Ini — {hariIni}</Text>
                    </View>
                    {jadwalHariIni.map((j: any, idx: number) => (
                      <View key={idx} style={[styles.jadwalCard, { borderLeftColor: "#2563EB" }]}>
                        <View style={styles.jadwalCardLeft}>
                          <Text style={styles.jadwalMapel}>
                            {j.mapel?.nama_mapel || j.mata_pelajaran?.nama_mapel || "Pelajaran"}
                          </Text>
                          <Text style={styles.jadwalGuru}>Ustadz/ah: {j.pegawai?.nama || "-"}</Text>
                        </View>
                        <View style={styles.jadwalTimeBadge}>
                          <Clock size={10} color="#2563EB" />
                          <Text style={styles.jadwalTimeText}>{j.jam_mulai?.jam_mulai || "-"}</Text>
                        </View>
                      </View>
                    ))}
                    <View style={styles.dividerLine} />
                  </>
                )}

                <Text style={styles.subSectionTitle}>Seluruh Jadwal Pelajaran</Text>
                {perkembangan?.jadwalPelajaran && perkembangan.jadwalPelajaran.length > 0 ? (
                  HARI_ORDER.map((hari) => {
                    const jadwalHari = perkembangan.jadwalPelajaran.filter((j: any) => j.hari === hari);
                    if (jadwalHari.length === 0) return null;
                    const isToday = hari === hariIni;
                    return (
                      <View key={hari} style={styles.jadwalHariGroup}>
                        <View style={[styles.jadwalHariHeader, isToday && styles.jadwalHariHeaderToday]}>
                          <Text style={[styles.jadwalHariLabel, isToday && styles.jadwalHariLabelToday]}>
                            {hari}
                            {isToday ? " • Hari Ini" : ""}
                          </Text>
                        </View>
                        {jadwalHari.map((j: any, idx: number) => (
                          <View key={idx} style={styles.jadwalItem}>
                            <View style={styles.jadwalItemDot} />
                            <View style={styles.jadwalItemContent}>
                              <Text style={styles.jadwalMapelSmall}>
                                {j.mapel?.nama_mapel || j.mata_pelajaran?.nama_mapel || "Pelajaran"}
                              </Text>
                              <Text style={styles.jadwalGuruSmall}>{j.pegawai?.nama || "-"}</Text>
                            </View>
                            <Text style={styles.jadwalTimeSmall}>{j.jam_mulai?.jam_mulai || "-"}</Text>
                          </View>
                        ))}
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyBox}>
                    <Calendar size={28} color="#CBD5E1" />
                    <Text style={styles.emptyText}>Jadwal pelajaran belum tersedia.</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL JADWAL SHOLAT */}
      <Modal
        visible={showSholatModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSholatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Clock size={18} color="#059669" />
                <View>
                  <Text style={styles.modalTitle}>Jadwal Sholat</Text>
                  <Text style={styles.modalSub}>{selectedCity.name}, {selectedCity.province}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowSholatModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.sholatHeroBox}>
                <Text style={styles.sholatHeroLabel}>Sholat Selanjutnya</Text>
                <Text style={styles.sholatHeroPrayer}>{prayerData.nextPrayer.name}</Text>
                <Text style={styles.sholatHeroTime}>{prayerData.nextPrayer.time} WIB</Text>
                <View style={styles.sholatCountdownBadge}>
                  <Clock size={12} color="#6EE7B7" />
                  <Text style={styles.sholatCountdownText}>{prayerData.nextPrayer.countdown}</Text>
                </View>
              </View>
              <View style={styles.sholatTable}>
                {Object.entries(prayerData.times).map(([key, val]) => (
                  <View key={key} style={styles.sholatTableRow}>
                    <Text style={styles.sholatTableName}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                    <Text style={styles.sholatTableTime}>{val} WIB</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL ARAH KIBLAT */}
      <Modal
        visible={showKiblatModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowKiblatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Compass size={18} color="#EA580C" />
                <View>
                  <Text style={styles.modalTitle}>Arah Kiblat</Text>
                  <Text style={styles.modalSub}>Dari: {selectedCity.name}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowKiblatModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ alignItems: "center", paddingVertical: 14 }}>
              <View style={[styles.qiblaDegreeBadge, isQiblaAligned && styles.qiblaDegreeBadgeAligned]}>
                <Text style={[styles.qiblaDegreeNum, isQiblaAligned && { color: "#FFFFFF" }]}>
                  {prayerData.qiblaBearing}°
                </Text>
                <Text style={[styles.qiblaDegreeLbl, isQiblaAligned && { color: "#FFFFFF" }]}>
                  {isQiblaAligned ? "✅ Arah Kiblat Tepat!" : "Arahkan jarum ke Ka'bah"}
                </Text>
              </View>
              <View style={styles.compassContainer}>
                <View style={styles.compassDial}>
                  <Text style={[styles.cardinalPoint, { top: 10, color: "#DC2626", fontWeight: "700" }]}>U</Text>
                  <Text style={[styles.cardinalPoint, { right: 12 }]}>T</Text>
                  <Text style={[styles.cardinalPoint, { bottom: 10 }]}>S</Text>
                  <Text style={[styles.cardinalPoint, { left: 12 }]}>B</Text>
                  <View style={[styles.compassNeedle, { transform: [{ rotate: `${qiblaAngle}deg` }] }]}>
                    <View style={[styles.needleTop, isQiblaAligned && { backgroundColor: "#16A34A" }]} />
                    <Text style={{ fontSize: 20 }}>🕋</Text>
                  </View>
                  <View style={styles.compassCenter} />
                </View>
              </View>
              <View style={styles.headingBtnRow}>
                <TouchableOpacity
                  style={styles.headingBtn}
                  onPress={() => setDeviceHeading((prev) => (prev - 15 + 360) % 360)}
                >
                  <Text style={styles.headingBtnText}>◀ -15°</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.headingBtn, { backgroundColor: "#059669" }]}
                  onPress={() => setDeviceHeading(Math.round(prayerData.qiblaBearing))}
                >
                  <Text style={[styles.headingBtnText, { color: "#FFFFFF" }]}>🎯 Tepat Kiblat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headingBtn}
                  onPress={() => setDeviceHeading((prev) => (prev + 15) % 360)}
                >
                  <Text style={styles.headingBtnText}>+15° ▶</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.qiblaInfoRow}>
                <View style={styles.qiblaInfoItem}>
                  <Text style={styles.qiblaInfoLabel}>Jarak ke Ka'bah</Text>
                  <Text style={styles.qiblaInfoValue}>±{prayerData.distanceKaaba.toLocaleString("id-ID")} KM</Text>
                </View>
                <View style={styles.qiblaInfoItem}>
                  <Text style={styles.qiblaInfoLabel}>Koordinat</Text>
                  <Text style={styles.qiblaInfoValue}>
                    {selectedCity.latitude.toFixed(2)}°, {selectedCity.longitude.toFixed(2)}°
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL PILIH KOTA */}
      <Modal
        visible={showCityPickerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCityPickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: "72%" }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MapPin size={18} color="#2563EB" />
                <Text style={styles.modalTitle}>Pilih Lokasi</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCityPickerModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
              {INDONESIAN_CITIES.map((city) => {
                const isActive = city.id === selectedCity.id;
                return (
                  <TouchableOpacity
                    key={city.id}
                    style={[styles.cityItem, isActive && styles.cityItemActive]}
                    onPress={() => {
                      setSelectedCity(city);
                      setShowCityPickerModal(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.cityItemName, isActive && { color: "#2563EB" }]}>{city.name}</Text>
                      <Text style={styles.cityItemProv}>{city.province}</Text>
                    </View>
                    {isActive && <CheckCircle2 size={18} color="#2563EB" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#0F382A",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerGreeting: { fontSize: 11.5, color: "#6EE7B7", fontWeight: "500" },
  headerName: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginTop: 2, letterSpacing: -0.3 },
  headerLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  headerLocationText: { fontSize: 11, color: "#A7F3D0", fontWeight: "500" },
  prayerStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  prayerStripLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  prayerStripText: { fontSize: 11.5, color: "#FFFFFF", fontWeight: "500" },
  prayerCountdownBadge: { backgroundColor: "#10B981", paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8 },
  prayerCountdownText: { fontSize: 10, color: "#FFFFFF", fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  childSelectorRow: { marginBottom: 14 },
  childSelectorLabel: { fontSize: 11, fontWeight: "600", color: "#64748B", marginBottom: 8 },
  childPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  childPillActive: { backgroundColor: "#0F382A", borderColor: "#0F382A" },
  childPillDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  childPillDotActive: { backgroundColor: "#10B981" },
  childPillDotText: { fontSize: 10, fontWeight: "700", color: "#475569" },
  childPillText: { fontSize: 12, fontWeight: "500", color: "#334155" },
  childPillTextActive: { color: "#FFFFFF" },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 18,
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  loadingText: { fontSize: 12, color: "#64748B" },
  santriCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  santriAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  santriAvatarLetter: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
  santriInfo: { flex: 1 },
  santriName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  santriNisn: { fontSize: 11, color: "#64748B", marginTop: 2 },
  santriMetaRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  santriMetaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EDE9FE",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  santriMetaBadgeText: { fontSize: 10, fontWeight: "600", color: "#7C3AED" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  statBox: { flex: 1, borderRadius: 14, padding: 10, alignItems: "center", gap: 3 },
  statNumber: { fontSize: 14, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { fontSize: 9, color: "#64748B", textAlign: "center", fontWeight: "500" },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabBtnActive: { backgroundColor: "#0F382A", borderColor: "#0F382A" },
  tabBtnText: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  tabBtnTextActive: { color: "#FFFFFF" },
  tabContent: {},
  subSectionTitle: { fontSize: 12, fontWeight: "600", color: "#475569", marginBottom: 10, marginTop: 4 },
  hafalanSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  hafalanSummaryItem: { flex: 1, alignItems: "center" },
  hafalanSumLabel: { fontSize: 10.5, color: "#64748B", fontWeight: "500" },
  hafalanSumValue: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginTop: 4 },
  hafalanSumSub: { fontSize: 10, color: "#94A3B8", marginTop: 2 },
  hafalanSumDivider: { width: 1, backgroundColor: "#E2E8F0", marginVertical: 4 },
  setoranCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
  },
  setoranCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  setoranCardLeft: { flex: 1 },
  setoranSurat: { fontSize: 13.5, fontWeight: "700", color: "#0F172A" },
  setoranJenis: { fontSize: 11, color: "#64748B", marginTop: 3 },
  kelancaranBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  kelancaranBadgeText: { fontSize: 10.5, fontWeight: "700" },
  catatanBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  catatanText: { fontSize: 11, color: "#475569", flex: 1, fontStyle: "italic" },
  setoranTanggal: { fontSize: 10, color: "#94A3B8", marginTop: 6, textAlign: "right" },
  todayStatusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  todayStatusLabel: { fontSize: 11, color: "#64748B", fontWeight: "600", marginBottom: 8 },
  todayStatusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  todayStatusValue: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  presensiGrid: { flexDirection: "row", gap: 8, marginBottom: 14 },
  presensiBox: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center" },
  presensiNumber: { fontSize: 22, fontWeight: "800" },
  presensiLabel: { fontSize: 10, color: "#64748B", marginTop: 2, fontWeight: "500" },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  progressCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  progressCardTitle: { fontSize: 12.5, fontWeight: "600", color: "#334155" },
  progressCardPct: { fontSize: 18, fontWeight: "800" },
  progressBarBg: { height: 8, backgroundColor: "#E2E8F0", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: 8, borderRadius: 4 },
  progressCardSub: { fontSize: 11, color: "#64748B", marginTop: 10 },
  todayScheduleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  todayScheduleBadgeText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  jadwalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 3,
  },
  jadwalCardLeft: { flex: 1 },
  jadwalMapel: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  jadwalGuru: { fontSize: 11, color: "#64748B", marginTop: 2 },
  jadwalTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  jadwalTimeText: { fontSize: 11, fontWeight: "600", color: "#2563EB" },
  dividerLine: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 14 },
  jadwalHariGroup: { marginBottom: 12 },
  jadwalHariHeader: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  jadwalHariHeaderToday: { backgroundColor: "#EFF6FF" },
  jadwalHariLabel: { fontSize: 11.5, fontWeight: "700", color: "#475569" },
  jadwalHariLabelToday: { color: "#2563EB" },
  jadwalItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, paddingHorizontal: 4 },
  jadwalItemDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#CBD5E1" },
  jadwalItemContent: { flex: 1 },
  jadwalMapelSmall: { fontSize: 12.5, fontWeight: "600", color: "#0F172A" },
  jadwalGuruSmall: { fontSize: 10.5, color: "#64748B" },
  jadwalTimeSmall: { fontSize: 11, color: "#64748B", fontWeight: "500" },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
    marginBottom: 10,
  },
  emptyText: { fontSize: 12.5, color: "#94A3B8", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  modalSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  modalCloseBtn: { padding: 6, borderRadius: 8, backgroundColor: "#F1F5F9" },
  sholatHeroBox: {
    backgroundColor: "#0F382A",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginBottom: 14,
  },
  sholatHeroLabel: { fontSize: 11, color: "#6EE7B7", fontWeight: "500" },
  sholatHeroPrayer: { fontSize: 24, fontWeight: "800", color: "#FFFFFF", marginTop: 4 },
  sholatHeroTime: { fontSize: 18, color: "#A7F3D0", fontWeight: "600", marginTop: 2 },
  sholatCountdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  sholatCountdownText: { fontSize: 12, color: "#FFFFFF", fontWeight: "600" },
  sholatTable: { gap: 2 },
  sholatTableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sholatTableName: { fontSize: 13, fontWeight: "600", color: "#334155" },
  sholatTableTime: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  qiblaDegreeBadge: {
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  qiblaDegreeBadgeAligned: { backgroundColor: "#059669", borderColor: "#047857" },
  qiblaDegreeNum: { fontSize: 28, fontWeight: "800", color: "#EA580C" },
  qiblaDegreeLbl: { fontSize: 12, color: "#EA580C", marginTop: 2 },
  compassContainer: { alignItems: "center", marginBottom: 16 },
  compassDial: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cardinalPoint: { position: "absolute", fontSize: 13, fontWeight: "600", color: "#475569" },
  compassNeedle: {
    position: "absolute",
    alignItems: "center",
    height: 160,
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  needleTop: { width: 8, height: 60, borderRadius: 4, backgroundColor: "#EA580C" },
  compassCenter: { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: "#334155" },
  headingBtnRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  headingBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center" },
  headingBtnText: { fontSize: 11, fontWeight: "600", color: "#334155" },
  qiblaInfoRow: { flexDirection: "row", gap: 12, width: "100%" },
  qiblaInfoItem: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  qiblaInfoLabel: { fontSize: 10, color: "#64748B", fontWeight: "500" },
  qiblaInfoValue: { fontSize: 13, fontWeight: "700", color: "#0F172A", marginTop: 3 },
  cityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  cityItemActive: { backgroundColor: "#EFF6FF" },
  cityItemName: { fontSize: 13.5, fontWeight: "600", color: "#0F172A" },
  cityItemProv: { fontSize: 11, color: "#64748B", marginTop: 2 },
});
