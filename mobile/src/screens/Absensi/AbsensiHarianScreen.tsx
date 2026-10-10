// mobile/src/screens/Absensi/AbsensiHarianScreen.tsx
// Absensi Harian — khusus Wali Kelas
// Referensi web: https://lms2.maskumambang.ac.id/kbm/absensi/harian

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  Save,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  CheckCheck,
  Building,
  RefreshCw,
  FileText,
  Lock,
  LockOpen,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/useAuthStore";
import { apiClient } from "../../api/client";
import { isWaliKelasRole } from "../../utils/permissions";
import { SingleDatePickerModal } from "../../components/ui/SingleDatePickerModal";

export type AttendanceStatus = "Hadir" | "Sakit" | "Izin" | "Alpha" | "Dispen";

interface SiswaItem {
  siswa_id: number;
  nama: string;
  nis?: string;
  nisn?: string;
}

interface KelasItem {
  kelas_id: number;
  nama_kelas: string;
  tingkat?: string | number;
  lembaga_id?: number;
  lembaga?: {
    nama_lembaga?: string;
    singkatan?: string;
  };
}

const STATUS_OPTIONS: { label: string; value: AttendanceStatus; color: string; bg: string; Icon: any }[] = [
  { label: "Hadir", value: "Hadir", color: "#16a34a", bg: "#dcfce7", Icon: CheckCircle2 },
  { label: "Sakit", value: "Sakit", color: "#d97706", bg: "#fef3c7", Icon: Clock },
  { label: "Izin", value: "Izin", color: "#2563eb", bg: "#dbeafe", Icon: AlertCircle },
  { label: "Alpha", value: "Alpha", color: "#dc2626", bg: "#fee2e2", Icon: XCircle },
  { label: "Dispen", value: "Dispen", color: "#7c3aed", bg: "#ede9fe", Icon: FileText },
];

export const AbsensiHarianScreen = () => {
  const navigation = useNavigation<any>();
  const { user, activeRole } = useAuthStore();

  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [attendance, setAttendance] = useState<{ [key: number]: AttendanceStatus }>({});
  const [catatan, setCatatan] = useState<{ [key: number]: string }>({});

  const [isLocked, setIsLocked] = useState(false);
  const [loadingKelas, setLoadingKelas] = useState(true);
  const [loadingSiswa, setLoadingSiswa] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const pegawaiId = (user as any)?.pegawai?.pegawai_id || (user as any)?.pegawai_id;

  // 1. Fetch Daftar Kelas yang diampu oleh Wali Kelas
  const fetchKelasWali = useCallback(async () => {
    try {
      setLoadingKelas(true);
      let foundClasses: KelasItem[] = [];

      // Prioritas 1: Dari user.pegawai.kelas_wali (jika sudah ada di profil)
      const cachedKelasWali = (user as any)?.pegawai?.kelas_wali;
      if (Array.isArray(cachedKelasWali) && cachedKelasWali.length > 0) {
        foundClasses = cachedKelasWali;
      }

      // Prioritas 2: Fetch dari server dengan filter wali_kelas_id
      if (foundClasses.length === 0 && pegawaiId) {
        try {
          const res = await apiClient.get(`/kelas?wali_kelas_id=eq.${pegawaiId}`);
          const data = res.data?.data || res.data;
          if (Array.isArray(data) && data.length > 0) {
            foundClasses = data;
          }
        } catch (_) {}
      }

      // Prioritas 3: Fallback fetch semua kelas dan filter secara lokal jika perlu
      if (foundClasses.length === 0) {
        try {
          const res = await apiClient.get("/kelas");
          const allData = res.data?.data || res.data;
          if (Array.isArray(allData)) {
            const matched = allData.filter(
              (k: any) => k.wali_kelas_id === pegawaiId || k.wali_kelas?.pegawai_id === pegawaiId
            );
            if (matched.length > 0) {
              foundClasses = matched;
            } else if (allData.length > 0 && isWaliKelasRole(activeRole || user)) {
              // Jika data belum terlink wali_kelas_id tapi role adalah Wali Kelas
              foundClasses = allData.slice(0, 5);
            }
          }
        } catch (_) {}
      }

      setKelasList(foundClasses);
      if (foundClasses.length > 0) {
        setSelectedKelasId((prev) => (prev && foundClasses.some((k) => k.kelas_id === prev) ? prev : foundClasses[0].kelas_id));
      }
    } catch (err) {
      console.warn("Error fetching kelas wali:", err);
    } finally {
      setLoadingKelas(false);
    }
  }, [pegawaiId, user, activeRole]);

  // 2. Fetch Siswa & Data Absensi yang ada
  const fetchSiswaDanAbsensi = useCallback(async () => {
    if (!selectedKelasId) {
      setSiswaList([]);
      return;
    }

    try {
      setLoadingSiswa(true);
      // Fetch siswa dalam kelas ini
      const resSiswa = await apiClient.get(`/siswa?kelas_id=${selectedKelasId}&limit=200`);
      const sData: SiswaItem[] = resSiswa.data?.data || resSiswa.data || [];
      setSiswaList(sData);

      // Default status semua hadir
      const initialAtt: { [key: number]: AttendanceStatus } = {};
      sData.forEach((s) => {
        initialAtt[s.siswa_id] = "Hadir";
      });

      let foundExistingRecords = false;

      // Fetch absensi yang sudah tercatat pada tanggal terpilih (sinkron dengan format PostgREST / web)
      if (sData.length > 0) {
        try {
          const siswaIds = sData.map((s) => s.siswa_id).join(",");
          let absData: any[] = [];

          // 1. Coba endpoint PostgREST standar web: /absensi_harian?tanggal=eq.YYYY-MM-DD&siswa_id=in.(...)
          try {
            const resWeb = await apiClient.get(
              `/absensi_harian?tanggal=eq.${selectedDate}&siswa_id=in.(${siswaIds})`
            );
            absData = resWeb.data?.data || resWeb.data || [];
          } catch (_) {}

          // 2. Coba endpoint /absensi_harian?tanggal=YYYY-MM-DD
          if (!Array.isArray(absData) || absData.length === 0) {
            try {
              const resTable = await apiClient.get(`/absensi_harian?tanggal=${selectedDate}`);
              absData = resTable.data?.data || resTable.data || [];
            } catch (_) {}
          }

          // 3. Coba endpoint /kbm/absensi-harian?tanggal=YYYY-MM-DD&kelas_id=...
          if (!Array.isArray(absData) || absData.length === 0) {
            try {
              const resKbm = await apiClient.get(
                `/kbm/absensi-harian?tanggal=${selectedDate}&kelas_id=${selectedKelasId}`
              );
              absData = resKbm.data?.data || resKbm.data || [];
            } catch (_) {}
          }

          if (Array.isArray(absData) && absData.length > 0) {
            const catatanMap: { [key: number]: string } = {};
            absData.forEach((item: any) => {
              if (item.siswa_id && initialAtt[item.siswa_id] !== undefined) {
                foundExistingRecords = true;
                const raw = (item.status || "").trim();
                const st = raw.toLowerCase() === "alfa" ? "Alpha" : raw;
                initialAtt[item.siswa_id] = (st || "Hadir") as AttendanceStatus;
                if (item.keterangan) catatanMap[item.siswa_id] = item.keterangan;
              }
            });
            setCatatan(catatanMap);
          }
        } catch (errAbs) {
          console.warn("Gagal load absensi existing:", errAbs);
        }
      }

      setAttendance(initialAtt);
      // Auto lock jika data absensi hari ini sudah ada (sinkron dengan web)
      setIsLocked(foundExistingRecords);
    } catch (err) {
      console.warn("Error fetching siswa/absensi:", err);
    } finally {
      setLoadingSiswa(false);
    }
  }, [selectedKelasId, selectedDate]);

  useEffect(() => {
    fetchKelasWali();
  }, [fetchKelasWali]);

  useEffect(() => {
    if (selectedKelasId) {
      fetchSiswaDanAbsensi();
    }
  }, [selectedKelasId, selectedDate, fetchSiswaDanAbsensi]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchKelasWali();
    if (selectedKelasId) {
      await fetchSiswaDanAbsensi();
    }
    setRefreshing(false);
  };

  const currentKelas = useMemo(() => {
    return kelasList.find((k) => k.kelas_id === selectedKelasId);
  }, [kelasList, selectedKelasId]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const isToday = useMemo(() => selectedDate === todayStr, [selectedDate, todayStr]);

  const formattedToday = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const formattedDate = useMemo(() => {
    const d = new Date(selectedDate);
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  const setStatus = (siswaId: number, status: AttendanceStatus) => {
    if (!isToday) {
      Alert.alert(
        "Mode Hanya Lihat (Arsip Tanggal)",
        `Presensi hanya dapat diisi untuk HARI INI (${formattedToday}). Anda sedang membuka arsip tanggal ${formattedDate}. Silakan klik tombol 'Hari Ini' untuk mengisi absensi.`
      );
      return;
    }
    if (isLocked) {
      Alert.alert(
        "Absensi Terkunci",
        "Data absensi hari ini sudah tersimpan dan dikunci. Klik tombol 'Edit Ulang' di banner atas jika ingin mengubah kehadiran siswa."
      );
      return;
    }
    setAttendance((prev) => ({ ...prev, [siswaId]: status }));
  };

  const handleTandaiSemuaHadir = () => {
    if (!isToday) {
      Alert.alert(
        "Mode Hanya Lihat",
        `Fitur ini hanya dapat digunakan pada presensi hari ini (${formattedToday}).`
      );
      return;
    }
    if (isLocked) {
      Alert.alert(
        "Absensi Terkunci",
        "Data absensi hari ini sudah dikunci. Klik tombol 'Edit Ulang' di banner atas untuk membuka kunci."
      );
      return;
    }
    const nextAtt: { [key: number]: AttendanceStatus } = {};
    siswaList.forEach((s) => {
      nextAtt[s.siswa_id] = "Hadir";
    });
    setAttendance(nextAtt);
  };

  // Ubah tanggal navigasi (hari ini / kemarin / besok)
  const shiftDate = (days: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split("T")[0]);
  };

  const handleSimpan = async () => {
    if (!isToday) {
      Alert.alert(
        "Tidak Dapat Menyimpan",
        `Presensi hanya dapat diinput dan disimpan pada hari ini (${formattedToday}) untuk mencegah salah tanggal input. Anda sedang membuka arsip tanggal ${formattedDate}.`
      );
      return;
    }

    if (!selectedKelasId || siswaList.length === 0) {
      Alert.alert("Perhatian", "Tidak ada daftar siswa untuk disimpan.");
      return;
    }

    setSubmitting(true);
    const entries = siswaList.map((s) => ({
      siswa_id: s.siswa_id,
      tanggal: selectedDate,
      status: attendance[s.siswa_id] || "Hadir",
    }));

    try {
      // 1. Simpan ke /absensi_harian (persis seperti yang dilakukan oleh website)
      await apiClient.post("/absensi_harian", entries, {
        headers: { Prefer: "return=representation,resolution=merge-duplicates" },
        params: { on_conflict: "siswa_id,tanggal" },
      });

      setIsLocked(true);
      Alert.alert(
        "Berhasil",
        `Data absensi harian kelas ${currentKelas?.nama_kelas || ""} berhasil disimpan & dikunci!`
      );
    } catch (err: any) {
      // Fallback ke /kbm/absensi-harian
      try {
        await apiClient.post("/kbm/absensi-harian", {
          kelas_id: selectedKelasId,
          tanggal: selectedDate,
          data: entries,
        });
        setIsLocked(true);
        Alert.alert(
          "Berhasil",
          `Data absensi harian kelas ${currentKelas?.nama_kelas || ""} berhasil disimpan & dikunci!`
        );
      } catch (fallbackErr: any) {
        const msg =
          fallbackErr.response?.data?.message ||
          err.response?.data?.message ||
          "Gagal menyimpan absensi. Periksa koneksi internet.";
        Alert.alert("Gagal Simpan", msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSiswa = useMemo(() => {
    return siswaList.filter(
      (s) =>
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nis && s.nis.includes(searchQuery))
    );
  }, [siswaList, searchQuery]);

  const stats = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = {
      Hadir: 0,
      Sakit: 0,
      Izin: 0,
      Alpha: 0,
      Dispen: 0,
    };
    Object.values(attendance).forEach((s) => {
      if (s in counts) counts[s]++;
    });
    return counts;
  }, [attendance]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* ─── HEADER ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Absensi Harian</Text>
          <Text style={styles.headerSub}>
            {currentKelas ? currentKelas.nama_kelas : "Wali Kelas"}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.saveHeaderBtn, (submitting || loadingSiswa || siswaList.length === 0) && { opacity: 0.6 }]}
          onPress={handleSimpan}
          disabled={submitting || loadingSiswa || siswaList.length === 0}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Save size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* ─── CLASS SELECTOR (Jika memiliki beberapa kelas) ─── */}
      {kelasList.length > 1 && (
        <View style={styles.classPickerRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {kelasList.map((k) => (
              <TouchableOpacity
                key={k.kelas_id}
                style={[
                  styles.classChip,
                  selectedKelasId === k.kelas_id && styles.classChipActive,
                ]}
                onPress={() => setSelectedKelasId(k.kelas_id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.classChipText,
                    selectedKelasId === k.kelas_id && styles.classChipTextActive,
                  ]}
                >
                  {k.nama_kelas}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ─── DATE BAR ─── */}
      <View style={styles.dateBar}>
        <TouchableOpacity style={styles.dateNavBtn} onPress={() => shiftDate(-1)} activeOpacity={0.7}>
          <ChevronLeft size={18} color="#475569" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateInfoCenter}
          onPress={() => setShowDatePickerModal(true)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Calendar size={14} color="#162E6E" />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          {isToday ? (
            <View style={styles.todayBadge}>
              <Text style={styles.todayText}>Hari Ini</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: "#EFF6FF", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={styles.resetTodayText}>Pilih Tanggal</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateNavBtn} onPress={() => shiftDate(1)} activeOpacity={0.7}>
          <ChevronRight size={18} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* ─── STATS SUMMARY CARD ─── */}
      <View style={styles.statsCardWrapper}>
        <View style={styles.statsRow}>
          {STATUS_OPTIONS.map((opt) => (
            <View key={opt.value} style={[styles.statBox, { backgroundColor: opt.bg }]}>
              <Text style={[styles.statNum, { color: opt.color }]}>{stats[opt.value] || 0}</Text>
              <Text style={[styles.statLabel, { color: opt.color }]}>{opt.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ─── SEARCH & QUICK ACTION BAR ─── */}
      <View style={styles.actionBar}>
        <View style={styles.searchBox}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama / NIS siswa..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.quickHadirBtn, !isToday && { opacity: 0.6 }]}
          onPress={handleTandaiSemuaHadir}
          activeOpacity={0.8}
        >
          <CheckCheck size={14} color="#16a34a" />
          <Text style={styles.quickHadirText}>Semua Hadir</Text>
        </TouchableOpacity>
      </View>

      {/* ─── BANNER MODE HANYA LIHAT (JIKA BUKAN HARI INI) ─── */}
      {!isToday && !loadingSiswa && siswaList.length > 0 && (
        <View style={styles.notTodayBanner}>
          <View style={styles.notTodayIconBox}>
            <AlertCircle size={16} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Text style={styles.notTodayBannerTitle}>Mode Hanya Lihat (Arsip Tanggal)</Text>
            </View>
            <Text style={styles.notTodayBannerSubtitle}>
              Presensi hanya dapat diisi pada hari ini ({formattedToday}) untuk mencegah salah input tanggal.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notTodayResetBtn}
            onPress={() => setSelectedDate(todayStr)}
            activeOpacity={0.8}
          >
            <Text style={styles.notTodayResetText}>Ke Hari Ini</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── BANNER AUTO-LOCK (SINKRON DENGAN WEBSITE) ─── */}
      {isToday && isLocked && !loadingSiswa && siswaList.length > 0 && (
        <View style={styles.lockBanner}>
          <View style={styles.lockIconBox}>
            <Lock size={16} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Text style={styles.lockTitle}>Absensi Tersimpan & Dikunci</Text>
              <CheckCircle2 size={13} color="#059669" />
            </View>
            <Text style={styles.lockSubtitle}>
              Data absensi untuk kelas {currentKelas?.nama_kelas} pada tanggal {formattedDate} telah tersimpan. Klik &quot;Edit Ulang&quot; jika perlu koreksi.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.unlockBtn}
            onPress={() => {
              setIsLocked(false);
              Alert.alert(
                "Mode Edit Dibuka",
                "Kunci absensi telah dibuka. Silakan sesuaikan kehadiran siswa lalu simpan kembali."
              );
            }}
            activeOpacity={0.8}
          >
            <LockOpen size={13} color="#059669" />
            <Text style={styles.unlockBtnText}>Edit Ulang</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── MAIN CONTENT LIST ─── */}
      {loadingKelas || loadingSiswa ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#162E6E" />
          <Text style={styles.loadingText}>Memuat data kehadiran siswa...</Text>
        </View>
      ) : kelasList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Building size={48} color="#94a3b8" />
          <Text style={styles.emptyTitle}>Belum Ada Kelas Terhubung</Text>
          <Text style={styles.emptySubtitle}>
            Akun Anda berstatus Wali Kelas, namun belum terhubung dengan kelas aktif tahun ajaran ini. Silakan hubungi admin sekolah.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchKelasWali} activeOpacity={0.8}>
            <RefreshCw size={15} color="#FFFFFF" />
            <Text style={styles.retryText}>Muat Ulang</Text>
          </TouchableOpacity>
        </View>
      ) : siswaList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users size={48} color="#94a3b8" />
          <Text style={styles.emptyTitle}>Tidak Ada Siswa</Text>
          <Text style={styles.emptySubtitle}>
            Belum ada data santri/siswa yang terdaftar di kelas {currentKelas?.nama_kelas}.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#162E6E"]} />
          }
        >
          <View style={styles.countInfo}>
            <Text style={styles.countText}>
              Menampilkan {filteredSiswa.length} dari {siswaList.length} siswa
            </Text>
          </View>

          {filteredSiswa.map((siswa, index) => {
            const currentStatus = attendance[siswa.siswa_id] || "Hadir";
            return (
              <View key={siswa.siswa_id} style={styles.studentCard}>
                <View style={styles.studentCardHeader}>
                  <View style={styles.studentIndexBadge}>
                    <Text style={styles.studentIndexText}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {siswa.nama}
                    </Text>
                    {siswa.nis && <Text style={styles.studentNis}>NIS: {siswa.nis}</Text>}
                  </View>
                </View>

                {/* Status Toggle Buttons */}
                <View style={styles.statusButtonsRow}>
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = currentStatus === opt.value;
                    const IconComponent = opt.Icon;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.statusBtn,
                          isSelected && { backgroundColor: opt.color, borderColor: opt.color },
                          !isToday && !isSelected && { opacity: 0.65 },
                        ]}
                        onPress={() => setStatus(siswa.siswa_id, opt.value)}
                        activeOpacity={0.7}
                      >
                        <IconComponent
                          size={13}
                          color={isSelected ? "#FFFFFF" : "#64748b"}
                          style={{ marginRight: 3 }}
                        />
                        <Text
                          style={[
                            styles.statusBtnText,
                            isSelected && { color: "#FFFFFF", fontWeight: "700" },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Keterangan input jika bukan hadir */}
                {currentStatus !== "Hadir" && (
                  <View style={styles.noteInputWrapper}>
                    <TextInput
                      style={[styles.noteInput, !isToday && { color: "#64748B" }]}
                      placeholder={`Keterangan ${currentStatus}...`}
                      placeholderTextColor="#94a3b8"
                      value={catatan[siswa.siswa_id] || ""}
                      editable={isToday && !isLocked}
                      onChangeText={(val) => setCatatan((prev) => ({ ...prev, [siswa.siswa_id]: val }))}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Floating Save Button di Bawah */}
      {siswaList.length > 0 && !loadingSiswa && (
        <View style={styles.bottomBar}>
          {!isToday ? (
            <TouchableOpacity
              style={[styles.bottomSaveBtn, { backgroundColor: "#64748B" }]}
              onPress={() =>
                Alert.alert(
                  "Mode Hanya Lihat",
                  `Pengisian presensi hanya dapat dilakukan untuk Hari Ini (${formattedToday}). Anda sedang melihat arsip tanggal ${formattedDate}. Silakan klik tombol 'Hari Ini' untuk mengisi absensi.`
                )
              }
              activeOpacity={0.85}
            >
              <Lock size={18} color="#FFFFFF" />
              <Text style={styles.bottomSaveText}>Mode Hanya Lihat (Bukan Hari Ini)</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.bottomSaveBtn,
                isLocked && { backgroundColor: "#059669" },
                submitting && { opacity: 0.7 },
              ]}
              onPress={isLocked ? () => setIsLocked(false) : handleSimpan}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : isLocked ? (
                <>
                  <Lock size={18} color="#FFFFFF" />
                  <Text style={styles.bottomSaveText}>Tersimpan & Terkunci (Buka untuk Edit)</Text>
                </>
              ) : (
                <>
                  <Save size={18} color="#FFFFFF" />
                  <Text style={styles.bottomSaveText}>Simpan Absensi Harian</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ─── TANGGAL PICKER MODAL (KALENDER VISUAL HP) ─── */}
      <SingleDatePickerModal
        visible={showDatePickerModal}
        onClose={() => setShowDatePickerModal(false)}
        value={selectedDate}
        onSelect={(d) => setSelectedDate(d)}
        title="Pilih Tanggal Absensi"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#162E6E",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 12,
    color: "#93C5FD",
    marginTop: 1,
  },
  saveHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  classPickerRow: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  classChipActive: {
    backgroundColor: "#162E6E",
    borderColor: "#162E6E",
  },
  classChipText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  classChipTextActive: {
    color: "#FFFFFF",
  },
  dateBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  dateNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  dateInfoCenter: {
    alignItems: "center",
  },
  dateText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  todayBadge: {
    marginTop: 2,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 8,
  },
  todayText: {
    fontSize: 10,
    color: "#16A34A",
    fontWeight: "600",
  },
  resetTodayText: {
    fontSize: 10,
    color: "#2563EB",
    marginTop: 2,
    textDecorationLine: "underline",
  },
  statsCardWrapper: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  statBox: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  statNum: {
    fontSize: 14,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
  },
  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 38,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: "#1E293B",
    paddingVertical: 0,
  },
  quickHadirBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    gap: 4,
  },
  quickHadirText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
  },
  list: {
    flex: 1,
  },
  countInfo: {
    marginBottom: 8,
  },
  countText: {
    fontSize: 11,
    color: "#64748B",
  },
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  studentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  studentIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  studentIndexText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#162E6E",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  studentNis: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  statusButtonsRow: {
    flexDirection: "row",
    gap: 6,
  },
  statusBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  noteInputWrapper: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  noteInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: "#1E293B",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748B",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#162E6E",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  retryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  bottomSaveBtn: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  bottomSaveText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  lockBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    gap: 10,
  },
  lockIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  lockTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  lockSubtitle: {
    fontSize: 11,
    color: "#047857",
    marginTop: 2,
    lineHeight: 15,
  },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6EE7B7",
    gap: 4,
  },
  unlockBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  notTodayBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
    gap: 10,
  },
  notTodayIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
  notTodayBannerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },
  notTodayBannerSubtitle: {
    fontSize: 11,
    color: "#B45309",
    marginTop: 2,
    lineHeight: 15,
  },
  notTodayResetBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  notTodayResetText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
  },
});
