// src/pages/Tahfidz/Setoran/FormSetoran.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sparkles,
  BookOpen,
  ScrollText,
  Bookmark,
  CheckCircle2,
  Clock,
  User,
  Save,
  Search,
  Users,
  Zap,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  FolderClosed,
  Copy,
  SlidersHorizontal
} from "lucide-react";
import { QURAN_SURAHS } from "../../../data/quranSurahList";
import { HADITS_BOOK_PRESETS, MATAN_PRESETS, KELANCARAN_OPTIONS } from "../../../data/tahfidzPresets";
import { tahfidzService, type HalaqahItem } from "../../../lib/api/services/tahfidzService";
import { useAuthStore } from "../../../store/useAuthStore";

type KategoriHafalan = "Al-Quran" | "Hadits" | "Matan Ilmu";
type JenisSetoran = "Setoran Baru" | "Setoran Ulang" | "Ujian";
type ModeInput = "individu" | "kolosal";

interface SantriKolosalState {
  siswa_id: number;
  active: boolean;
  expanded: boolean;
  jenis_hafalan: string;
  kelancaran: string;
  durasi_menit: string;
  catatan_guru: string;
  // Al-Quran
  surat_mulai: number;
  ayat_mulai: number | string;
  surat_selesai: number;
  ayat_selesai: number | string;
  // Hadits
  kitab_hadits: string;
  custom_kitab_hadits?: string;
  hadits_no_mulai: number | string;
  hadits_no_selesai: number | string;
  // Matan Ilmu
  nama_matan: string;
  custom_nama_matan?: string;
  bait_mulai: number | string;
  bait_selesai: number | string;
}

const JENIS_PENILAIAN_OPTIONS = [
  "Setoran Baru",
  "Setoran Ulang",
  "Ujian",
  "Ziyadah",
  "Muraja'ah"
];

const FormSetoranTahfidz: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Mode Input: Individu vs Kolosal (Kelompok Halaqoh)
  const [modeInput, setModeInput] = useState<ModeInput>("kolosal");

  // Global Session Controls
  const [kategori, setKategori] = useState<KategoriHafalan>("Al-Quran");
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split("T")[0]);
  const [waktuMulai, setWaktuMulai] = useState<string>(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  });

  // State untuk Mode Individu
  const [jenisSetoranIndividu, setJenisSetoranIndividu] = useState<JenisSetoran>("Setoran Baru");
  const [durasiMenitIndividu, setDurasiMenitIndividu] = useState<string>("15");
  const [kelancaranIndividu, setKelancaranIndividu] = useState<string>("Lancar");
  const [catatanGuruIndividu, setCatatanGuruIndividu] = useState<string>("");
  const [selectedKelasId, setSelectedKelasId] = useState<string>("");
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>("");
  const [siswaSearch, setSiswaSearch] = useState<string>("");
  const [suratMulaiNoIndividu, setSuratMulaiNoIndividu] = useState<number>(1);
  const [ayatMulaiIndividu, setAyatMulaiIndividu] = useState<number>(1);
  const [suratSelesaiNoIndividu, setSuratSelesaiNoIndividu] = useState<number>(1);
  const [ayatSelesaiIndividu, setAyatSelesaiIndividu] = useState<number>(7);
  const [kitabHaditsIndividu, setKitabHaditsIndividu] = useState<string>("Hadits Arbain/Khamsin");
  const [customKitabHaditsIndividu] = useState<string>("");
  const [haditsNoMulaiIndividu, setHaditsNoMulaiIndividu] = useState<number>(1);
  const [haditsNoSelesaiIndividu, setHaditsNoSelesaiIndividu] = useState<number>(5);
  const [namaMatanIndividu, setNamaMatanIndividu] = useState<string>("Tuhfatul Athfal");
  const [customNamaMatanIndividu] = useState<string>("");
  const [baitMulaiIndividu, setBaitMulaiIndividu] = useState<number>(1);
  const [baitSelesaiIndividu, setBaitSelesaiIndividu] = useState<number>(10);

  // State untuk Mode Kolosal
  const [selectedHalaqahId, setSelectedHalaqahId] = useState<string>("");
  const [kolosalSearch, setKolosalSearch] = useState<string>("");
  const [kolosalRows, setKolosalRows] = useState<Record<number, SantriKolosalState>>({});

  // Fetch Santri Binaan (Mode Individu)
  const { data: santriList = [], isLoading: isLoadingSantri } = useQuery({
    queryKey: ["tahfidz-santri-binaan", selectedKelasId],
    queryFn: async () => {
      return await tahfidzService.getSantriTahfidz(
        selectedKelasId ? { kelas_id: Number(selectedKelasId) } : undefined
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Daftar Kelompok Halaqoh (Mode Kolosal)
  const { data: halaqahList = [], isLoading: isLoadingHalaqah } = useQuery<HalaqahItem[]>({
    queryKey: ["tahfidz-halaqah-list-setoran"],
    queryFn: async () => {
      return await tahfidzService.getHalaqahList({ status: "Aktif" });
    },
    staleTime: 5 * 60 * 1000,
  });

  // Halaqah terpilih
  const activeHalaqah = useMemo(() => {
    return halaqahList.find((h) => String(h.halaqah_id) === String(selectedHalaqahId));
  }, [halaqahList, selectedHalaqahId]);

  // Santri di dalam halaqah terpilih
  const halaqahSantriList = useMemo(() => {
    if (!activeHalaqah || !activeHalaqah.anggota) return [];
    return activeHalaqah.anggota
      .map((a) => a.siswa)
      .filter(Boolean) as any[];
  }, [activeHalaqah]);

  // Auto select halaqah pertama jika belum ada yang terpilih saat buka mode kolosal
  useEffect(() => {
    if (modeInput === "kolosal" && halaqahList.length > 0 && !selectedHalaqahId) {
      setSelectedHalaqahId(String(halaqahList[0].halaqah_id));
    }
  }, [modeInput, halaqahList, selectedHalaqahId]);

  // Inisialisasi atau update row per-santri saat halaqah berubah
  useEffect(() => {
    if (halaqahSantriList.length > 0) {
      const initialMap: Record<number, SantriKolosalState> = {};
      halaqahSantriList.forEach((s) => {
        initialMap[s.siswa_id] = {
          siswa_id: s.siswa_id,
          active: true,
          expanded: true,
          jenis_hafalan: "Setoran Baru",
          kelancaran: "Lancar",
          durasi_menit: "15",
          catatan_guru: "",
          surat_mulai: 1,
          ayat_mulai: 1,
          surat_selesai: 1,
          ayat_selesai: 7,
          kitab_hadits: "Hadits Arbain/Khamsin",
          custom_kitab_hadits: "",
          hadits_no_mulai: 1,
          hadits_no_selesai: 5,
          nama_matan: "Tuhfatul Athfal",
          custom_nama_matan: "",
          bait_mulai: 1,
          bait_selesai: 10,
        };
      });
      setKolosalRows(initialMap);
    } else {
      setKolosalRows({});
    }
  }, [halaqahSantriList]);

  // Filtered santri di kolosal berdasarkan search
  const filteredKolosalSantri = useMemo(() => {
    if (!kolosalSearch.trim()) return halaqahSantriList;
    const q = kolosalSearch.toLowerCase();
    return halaqahSantriList.filter((s: any) =>
      s.nama?.toLowerCase().includes(q) ||
      s.nisn?.toLowerCase().includes(q) ||
      s.nis?.toLowerCase().includes(q) ||
      s.kelas?.nama_kelas?.toLowerCase().includes(q)
    );
  }, [halaqahSantriList, kolosalSearch]);

  // Helper updater state santri kolosal dengan auto-centang aktif
  const updateKolosalRow = (siswa_id: number, patch: Partial<SantriKolosalState>) => {
    setKolosalRows((prev) => {
      const existing = prev[siswa_id] || {
        siswa_id,
        active: true,
        expanded: true,
        jenis_hafalan: "Setoran Baru",
        kelancaran: "Lancar",
        durasi_menit: "15",
        catatan_guru: "",
        surat_mulai: 1,
        ayat_mulai: 1,
        surat_selesai: 1,
        ayat_selesai: 7,
        kitab_hadits: "Hadits Arbain/Khamsin",
        hadits_no_mulai: 1,
        hadits_no_selesai: 5,
        nama_matan: "Tuhfatul Athfal",
        bait_mulai: 1,
        bait_selesai: 10,
      };

      return {
        ...prev,
        [siswa_id]: {
          ...existing,
          ...patch,
          // Jika patch bukan eksplisit mengubah 'active', otomatis centang active = true
          active: patch.active !== undefined ? patch.active : true,
        },
      };
    });
  };

  // Bulk Actions
  const handleCheckAll = (check: boolean) => {
    setKolosalRows((prev) => {
      const next = { ...prev };
      halaqahSantriList.forEach((s) => {
        if (next[s.siswa_id]) {
          next[s.siswa_id] = { ...next[s.siswa_id], active: check };
        }
      });
      return next;
    });
  };

  const handleExpandAll = (expand: boolean) => {
    setKolosalRows((prev) => {
      const next = { ...prev };
      halaqahSantriList.forEach((s) => {
        if (next[s.siswa_id]) {
          next[s.siswa_id] = { ...next[s.siswa_id], expanded: expand };
        }
      });
      return next;
    });
  };

  // Salin template materi dari santri pertama atau template ke seluruh santri yang tercentang
  const handleApplyTemplateToAllActive = (sourceSiswaId?: number) => {
    const source = sourceSiswaId
      ? kolosalRows[sourceSiswaId]
      : (halaqahSantriList.length > 0 ? kolosalRows[halaqahSantriList[0].siswa_id] : null);

    if (!source) {
      toast.error("Tidak ada template setoran untuk disalin.");
      return;
    }

    setKolosalRows((prev) => {
      const next = { ...prev };
      halaqahSantriList.forEach((s) => {
        if (next[s.siswa_id]?.active) {
          next[s.siswa_id] = {
            ...next[s.siswa_id],
            jenis_hafalan: source.jenis_hafalan,
            kelancaran: source.kelancaran,
            durasi_menit: source.durasi_menit,
            surat_mulai: source.surat_mulai,
            ayat_mulai: source.ayat_mulai,
            surat_selesai: source.surat_selesai,
            ayat_selesai: source.ayat_selesai,
            kitab_hadits: source.kitab_hadits,
            hadits_no_mulai: source.hadits_no_mulai,
            hadits_no_selesai: source.hadits_no_selesai,
            nama_matan: source.nama_matan,
            bait_mulai: source.bait_mulai,
            bait_selesai: source.bait_selesai,
          };
        }
      });
      return next;
    });

    toast.success("Materi setoran berhasil disalin ke seluruh santri yang aktif!");
  };

  // Hitung jumlah santri aktif
  const activeSantriCount = useMemo(() => {
    return Object.values(kolosalRows).filter((r) => r.active).length;
  }, [kolosalRows]);

  // Helpers Hitung Total Ayat untuk per-santri
  const calculateAyatTotal = (mulaiNo: number, aMulai: number, selesaiNo: number, aSelesai: number) => {
    const sMulai = QURAN_SURAHS.find((s) => s.number === Number(mulaiNo)) || QURAN_SURAHS[0];
    if (mulaiNo === selesaiNo) {
      return Math.max(1, aSelesai - aMulai + 1);
    }
    let total = sMulai.totalVerses - aMulai + 1;
    for (let i = mulaiNo + 1; i < selesaiNo; i++) {
      const s = QURAN_SURAHS.find((item) => item.number === i);
      if (s) total += s.totalVerses;
    }
    total += Number(aSelesai);
    return Math.max(1, total);
  };

  // Mutation to Submit Setoran (Kolosal / Individu)
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (modeInput === "kolosal") {
        const activeRows = Object.values(kolosalRows).filter((r) => r.active);
        if (activeRows.length === 0) {
          throw new Error("Pilih atau centang minimal 1 santri yang hadir/setor.");
        }

        const items = activeRows.map((r) => {
          const sMulai = QURAN_SURAHS.find((s) => s.number === Number(r.surat_mulai)) || QURAN_SURAHS[0];
          const sSelesai = QURAN_SURAHS.find((s) => s.number === Number(r.surat_selesai)) || QURAN_SURAHS[0];
          const totAyat = calculateAyatTotal(r.surat_mulai, Number(r.ayat_mulai), r.surat_selesai, Number(r.ayat_selesai));

          const payloadItem: any = {
            siswa_id: r.siswa_id,
            pegawai_id: user?.pegawai_id || undefined,
            kategori,
            jenis_hafalan: r.jenis_hafalan,
            tanggal,
            durasi_menit: Number(r.durasi_menit) || 15,
            kelancaran: r.kelancaran,
            catatan_guru: r.catatan_guru?.trim() || null,
          };

          if (kategori === "Al-Quran") {
            payloadItem.surat_mulai = Number(r.surat_mulai);
            payloadItem.surat_mulai_nama = sMulai.name;
            payloadItem.ayat_mulai = Number(r.ayat_mulai);
            payloadItem.surat_selesai = Number(r.surat_selesai);
            payloadItem.surat_selesai_nama = sSelesai.name;
            payloadItem.ayat_selesai = Number(r.ayat_selesai);
            payloadItem.total_ayat = totAyat;
          } else if (kategori === "Hadits") {
            const finalKitab = r.kitab_hadits === "Hadits Lainnya (Kustom)" ? r.custom_kitab_hadits : r.kitab_hadits;
            payloadItem.kitab_hadits = finalKitab || "Hadits Pilihan";
            payloadItem.hadits_no_mulai = Number(r.hadits_no_mulai);
            payloadItem.hadits_no_selesai = Number(r.hadits_no_selesai);
            payloadItem.total_hadits = Math.max(1, Number(r.hadits_no_selesai) - Number(r.hadits_no_mulai) + 1);
          } else if (kategori === "Matan Ilmu") {
            const finalMatan = r.nama_matan === "Matan Lainnya (Kustom)" ? r.custom_nama_matan : r.nama_matan;
            payloadItem.nama_matan = finalMatan || "Matan Ilmu";
            payloadItem.bait_mulai = Number(r.bait_mulai);
            payloadItem.bait_selesai = Number(r.bait_selesai);
            payloadItem.total_bait = Math.max(1, Number(r.bait_selesai) - Number(r.bait_mulai) + 1);
          }

          return payloadItem;
        });

        return await tahfidzService.createSetoranKolosal({
          items,
          tanggal,
          kategori,
        });
      } else {
        // Mode Individu
        if (!selectedSiswaId) {
          throw new Error("Pilih santri terlebih dahulu.");
        }

        const sMulai = QURAN_SURAHS.find((s) => s.number === Number(suratMulaiNoIndividu)) || QURAN_SURAHS[0];
        const sSelesai = QURAN_SURAHS.find((s) => s.number === Number(suratSelesaiNoIndividu)) || QURAN_SURAHS[0];
        const totAyat = calculateAyatTotal(suratMulaiNoIndividu, Number(ayatMulaiIndividu), suratSelesaiNoIndividu, Number(ayatSelesaiIndividu));

        const basePayload: any = {
          siswa_id: Number(selectedSiswaId),
          pegawai_id: user?.pegawai_id || undefined,
          kategori,
          jenis_hafalan: jenisSetoranIndividu,
          tanggal,
          durasi_menit: Number(durasiMenitIndividu) || 15,
          kelancaran: kelancaranIndividu,
          catatan_guru: catatanGuruIndividu.trim(),
        };

        if (kategori === "Al-Quran") {
          basePayload.surat_mulai = suratMulaiNoIndividu;
          basePayload.surat_mulai_nama = sMulai.name;
          basePayload.ayat_mulai = Number(ayatMulaiIndividu);
          basePayload.surat_selesai = suratSelesaiNoIndividu;
          basePayload.surat_selesai_nama = sSelesai.name;
          basePayload.ayat_selesai = Number(ayatSelesaiIndividu);
          basePayload.total_ayat = totAyat;
        } else if (kategori === "Hadits") {
          const finalKitab = kitabHaditsIndividu === "Hadits Lainnya (Kustom)" ? customKitabHaditsIndividu : kitabHaditsIndividu;
          basePayload.kitab_hadits = finalKitab || "Hadits Pilihan";
          basePayload.hadits_no_mulai = Number(haditsNoMulaiIndividu);
          basePayload.hadits_no_selesai = Number(haditsNoSelesaiIndividu);
          basePayload.total_hadits = Math.max(1, Number(haditsNoSelesaiIndividu) - Number(haditsNoMulaiIndividu) + 1);
        } else if (kategori === "Matan Ilmu") {
          const finalMatan = namaMatanIndividu === "Matan Lainnya (Kustom)" ? customNamaMatanIndividu : namaMatanIndividu;
          basePayload.nama_matan = finalMatan || "Matan Ilmu";
          basePayload.bait_mulai = Number(baitMulaiIndividu);
          basePayload.bait_selesai = Number(baitSelesaiIndividu);
          basePayload.total_bait = Math.max(1, Number(baitSelesaiIndividu) - Number(baitMulaiIndividu) + 1);
        }

        return await tahfidzService.createSetoran(basePayload);
      }
    },
    onSuccess: (res: any) => {
      if (modeInput === "kolosal") {
        toast.success(res?.message || `Setoran kolosal berhasil disimpan untuk ${activeSantriCount} santri!`);
      } else {
        toast.success("Catatan setoran hafalan santri berhasil disimpan!");
        setCatatanGuruIndividu("");
      }
      queryClient.invalidateQueries({ queryKey: ["tahfidz-setoran"] });
      queryClient.invalidateQueries({ queryKey: ["tahfidz-santri-binaan"] });
      queryClient.invalidateQueries({ queryKey: ["tahfidz-statistik-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Gagal menyimpan setoran.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  // Helper kelas list (Mode Individu)
  const uniqueKelasList = useMemo(() => {
    const map = new Map<number, string>();
    santriList.forEach((s: any) => {
      if (s.kelas?.kelas_id) {
        map.set(s.kelas.kelas_id, s.kelas.nama_kelas);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [santriList]);

  // Santri terpilih di individu
  const activeSiswaIndividu = useMemo(() => {
    return santriList.find((s: any) => String(s.siswa_id) === String(selectedSiswaId));
  }, [santriList, selectedSiswaId]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0d281e] via-[#164230] to-[#0d281e] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-emerald-300 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sistem Pencatatan Setoran Tahfizh & Mutun</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Input Setoran Hafalan Kolosal
            </h1>
            <p className="text-emerald-100/90 text-sm max-w-2xl leading-relaxed">
              Catat setoran seluruh santri dalam satu kelompok halaqah secara fleksibel. Bisa diisi masal atau disesuaikan mandiri per santri.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Mode Switcher Tabs */}
            <div className="bg-black/30 backdrop-blur-md p-1.5 rounded-2xl flex items-center border border-white/15">
              <button
                type="button"
                onClick={() => setModeInput("kolosal")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modeInput === "kolosal"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-900/30"
                    : "text-emerald-100 hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Mode Kolosal Halaqah</span>
              </button>
              <button
                type="button"
                onClick={() => setModeInput("individu")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modeInput === "individu"
                    ? "bg-white text-emerald-950 shadow-md"
                    : "text-emerald-100 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Per Santri (Individu)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================================= */}
        {/* MODE KOLOSAL HALAQAH */}
        {/* ========================================================================= */}
        {modeInput === "kolosal" && (
          <>
            {/* Card 1: Pengaturan Sesi Kolosal Global */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              {/* Row 1: Halaqah & Kategori Materi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih Kelompok (Halaqah): <span className="text-rose-500">*</span>
                  </label>
                  {isLoadingHalaqah ? (
                    <div className="text-xs text-slate-400 py-2">Memuat kelompok halaqah...</div>
                  ) : halaqahList.length === 0 ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                      Belum ada kelompok halaqah aktif. Silakan buat kelompok terlebih dahulu di menu <strong>Kelompok Halaqoh</strong>.
                    </div>
                  ) : (
                    <select
                      value={selectedHalaqahId}
                      onChange={(e) => setSelectedHalaqahId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-800 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all"
                    >
                      <option value="">-- Pilih Kelompok Halaqah --</option>
                      {halaqahList.map((h) => (
                        <option key={h.halaqah_id} value={h.halaqah_id}>
                          {h.nama_halaqah} ({h.pegawai?.nama || "Tanpa Ustadz"} - {h.lembaga?.singkatan || h.lembaga?.nama_lembaga || ""})
                        </option>
                      ))}
                    </select>
                  )}
                  {activeHalaqah && (
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
                      <span>Ustadz/Pengampu: <strong>{activeHalaqah.pegawai?.nama || "-"}</strong></span>
                      <span>•</span>
                      <span>Total Anggota: <strong>{halaqahSantriList.length} Santri</strong></span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kategori Materi: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as KategoriHafalan)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-800 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all"
                  >
                    <option value="Al-Quran">Al-Quran</option>
                    <option value="Hadits">Hadits</option>
                    <option value="Matan Ilmu">Matan Ilmu</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Tanggal, Waktu Mulai, & Helper text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-center pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Setoran:</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Waktu Mulai:</label>
                  <input
                    type="time"
                    value={waktuMulai}
                    onChange={(e) => setWaktuMulai(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-1 text-xs text-slate-500 italic flex items-center lg:justify-end">
                  * Centang otomatis aktif saat form diisi atau diedit.
                </div>
              </div>

              {/* Row 3: Action Bar (Centang Semua, Abaikan Semua, Bentang Semua, Tutup Semua) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCheckAll(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Centang Semua</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCheckAll(false)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Abaikan Semua</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExpandAll(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Bentang Semua</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExpandAll(false)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <FolderClosed className="w-3.5 h-3.5" />
                    <span>Tutup Semua</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplateToAllActive()}
                    title="Menyamakan surat/ayat santri #1 ke santri lainnya yang aktif"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Materi #1 ke Semua Santri Aktif</span>
                  </button>
                </div>
              </div>

              {/* Pencarian Santri di Halaqah */}
              {halaqahSantriList.length > 5 && (
                <div className="relative pt-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 mt-1" />
                  <input
                    type="text"
                    placeholder="Cari nama atau nomor induk santri di kelompok ini..."
                    value={kolosalSearch}
                    onChange={(e) => setKolosalSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              )}
            </div>

            {/* List Kartu Santri Kolosal */}
            <div className="space-y-4">
              {filteredKolosalSantri.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 space-y-2">
                  <Users className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-600">Tidak ada santri di kelompok halaqah ini.</p>
                  <p className="text-xs">Pastikan kelompok halaqah telah memiliki anggota santri aktif.</p>
                </div>
              ) : (
                filteredKolosalSantri.map((santri: any, index: number) => {
                  const sId = santri.siswa_id;
                  const rowData = kolosalRows[sId] || {
                    siswa_id: sId,
                    active: true,
                    expanded: true,
                    jenis_hafalan: "Setoran Baru",
                    kelancaran: "Lancar",
                    durasi_menit: "15",
                    catatan_guru: "",
                    surat_mulai: 1,
                    ayat_mulai: 1,
                    surat_selesai: 1,
                    ayat_selesai: 7,
                    kitab_hadits: "Hadits Arbain/Khamsin",
                    hadits_no_mulai: 1,
                    hadits_no_selesai: 5,
                    nama_matan: "Tuhfatul Athfal",
                    bait_mulai: 1,
                    bait_selesai: 10,
                  };

                  const curSurahMulai = QURAN_SURAHS.find((s) => s.number === Number(rowData.surat_mulai)) || QURAN_SURAHS[0];
                  const curSurahSelesai = QURAN_SURAHS.find((s) => s.number === Number(rowData.surat_selesai)) || QURAN_SURAHS[0];
                  const totalAyatSantri = calculateAyatTotal(
                    rowData.surat_mulai,
                    Number(rowData.ayat_mulai),
                    rowData.surat_selesai,
                    Number(rowData.ayat_selesai)
                  );

                  return (
                    <div
                      key={sId}
                      className={`bg-white rounded-2xl sm:rounded-3xl border transition-all overflow-hidden shadow-xs ${
                        rowData.active
                          ? "border-slate-300 ring-1 ring-slate-200"
                          : "border-slate-200 opacity-60 hover:opacity-100 bg-slate-50/50"
                      }`}
                    >
                      {/* Santri Card Header (Dark Theme seperti mock) */}
                      <div className="bg-[#1E232A] text-white p-3.5 sm:p-4 transition-colors flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={rowData.active}
                              onChange={(e) => updateKolosalRow(sId, { active: e.target.checked })}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                            />
                            <span className="text-xs sm:text-sm font-black tracking-wide truncate">
                              #{index + 1}. {santri.nama}
                            </span>
                          </label>

                          <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-700 text-slate-200 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            {santri.kelas?.nama_kelas || "MTs"} • {santri.status_santri || "Mukim"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 font-semibold cursor-pointer">
                            <span>Aktifkan / Hadir</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => updateKolosalRow(sId, { expanded: !rowData.expanded })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                            <span>{rowData.expanded ? "Tutup Form" : "Isi Form"}</span>
                            {rowData.expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Santri Form Content */}
                      {rowData.expanded && (
                        <div className="p-4 sm:p-6 space-y-5 bg-white">
                          {/* Row 1: Jenis Penilaian, Kelancaran, Durasi, Catatan Guru */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Penilaian</label>
                              <select
                                value={rowData.jenis_hafalan}
                                onChange={(e) => updateKolosalRow(sId, { jenis_hafalan: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white"
                              >
                                {JENIS_PENILAIAN_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Kelancaran</label>
                              <select
                                value={rowData.kelancaran}
                                onChange={(e) => updateKolosalRow(sId, { kelancaran: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white"
                              >
                                {KELANCARAN_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (menit)</label>
                              <input
                                type="number"
                                min="1"
                                max="180"
                                placeholder="15 menit"
                                value={rowData.durasi_menit}
                                onChange={(e) => updateKolosalRow(sId, { durasi_menit: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Guru</label>
                              <input
                                type="text"
                                placeholder="Catatan opsional..."
                                value={rowData.catatan_guru}
                                onChange={(e) => updateKolosalRow(sId, { catatan_guru: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white"
                              />
                            </div>
                          </div>

                          {/* Row 2: Capaian Materi Sesuai Kategori */}
                          <div className="pt-4 border-t border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Capaian Materi ({kategori})</span>
                              </span>
                              {kategori === "Al-Quran" && (
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  Total {totalAyatSantri} Ayat
                                </span>
                              )}
                            </div>

                            {/* Al-Quran Controls */}
                            {kategori === "Al-Quran" && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Dari Surat & Ayat */}
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span>Dari (Mulai):</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="sm:col-span-2">
                                      <select
                                        value={rowData.surat_mulai}
                                        onChange={(e) => {
                                          const no = Number(e.target.value);
                                          const updateObj: Partial<SantriKolosalState> = {
                                            surat_mulai: no,
                                            ayat_mulai: 1,
                                          };
                                          if (rowData.surat_selesai < no) {
                                            updateObj.surat_selesai = no;
                                            updateObj.ayat_selesai = 1;
                                          }
                                          updateKolosalRow(sId, updateObj);
                                        }}
                                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                                      >
                                        {QURAN_SURAHS.map((s) => (
                                          <option key={s.number} value={s.number}>
                                            {s.number}. {s.name} ({s.totalVerses} Ayat)
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <input
                                        type="number"
                                        min="1"
                                        max={curSurahMulai.totalVerses}
                                        placeholder="Ayat awal (1)"
                                        value={rowData.ayat_mulai}
                                        onChange={(e) => updateKolosalRow(sId, { ayat_mulai: Number(e.target.value) || 1 })}
                                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 text-center"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Sampai Surat & Ayat */}
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span>Sampai (Selesai):</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="sm:col-span-2">
                                      <select
                                        value={rowData.surat_selesai}
                                        onChange={(e) => {
                                          const no = Number(e.target.value);
                                          const sObj = QURAN_SURAHS.find((item) => item.number === no);
                                          updateKolosalRow(sId, {
                                            surat_selesai: no,
                                            ayat_selesai: sObj ? sObj.totalVerses : 7,
                                          });
                                        }}
                                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                                      >
                                        {QURAN_SURAHS.filter((s) => s.number >= rowData.surat_mulai).map((s) => (
                                          <option key={s.number} value={s.number}>
                                            {s.number}. {s.name} ({s.totalVerses} Ayat)
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <input
                                        type="number"
                                        min="1"
                                        max={curSurahSelesai.totalVerses}
                                        placeholder="Ayat akhir"
                                        value={rowData.ayat_selesai}
                                        onChange={(e) => updateKolosalRow(sId, { ayat_selesai: Number(e.target.value) || 1 })}
                                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 text-center"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Hadits Controls */}
                            {kategori === "Hadits" && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-bold text-slate-600 mb-1">Kitab Hadits</label>
                                  <select
                                    value={rowData.kitab_hadits}
                                    onChange={(e) => updateKolosalRow(sId, { kitab_hadits: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20"
                                  >
                                    {HADITS_BOOK_PRESETS.map((b) => (
                                      <option key={b.name} value={b.name}>
                                        {b.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-600 mb-1">Dari Hadits No</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={rowData.hadits_no_mulai}
                                    onChange={(e) => updateKolosalRow(sId, { hadits_no_mulai: Number(e.target.value) || 1 })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-600 mb-1">Sampai Hadits No</label>
                                  <input
                                    type="number"
                                    min={rowData.hadits_no_mulai}
                                    value={rowData.hadits_no_selesai}
                                    onChange={(e) => updateKolosalRow(sId, { hadits_no_selesai: Number(e.target.value) || 1 })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Matan Ilmu Controls */}
                            {kategori === "Matan Ilmu" && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-bold text-slate-600 mb-1">Nama Matan</label>
                                  <select
                                    value={rowData.nama_matan}
                                    onChange={(e) => updateKolosalRow(sId, { nama_matan: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20"
                                  >
                                    {MATAN_PRESETS.map((m) => (
                                      <option key={m.name} value={m.name}>
                                        {m.name} ({m.bidang})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-600 mb-1">Dari Bait No</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={rowData.bait_mulai}
                                    onChange={(e) => updateKolosalRow(sId, { bait_mulai: Number(e.target.value) || 1 })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-600 mb-1">Sampai Bait No</label>
                                  <input
                                    type="number"
                                    min={rowData.bait_mulai}
                                    value={rowData.bait_selesai}
                                    onChange={(e) => updateKolosalRow(sId, { bait_selesai: Number(e.target.value) || 1 })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Sticky Floating Bottom Bar for Kolosal Submit */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-2xl">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {activeSantriCount} dari {halaqahSantriList.length} Santri Tercentang
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Kelompok: <strong>{activeHalaqah?.nama_halaqah || "Pilih Halaqah"}</strong> • {kategori}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="submit"
                    disabled={submitMutation.isPending || activeSantriCount === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {submitMutation.isPending
                        ? "Menyimpan Setoran Kolosal..."
                        : `Simpan Setoran (${activeSantriCount} Santri)`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* MODE INDIVIDU (PER SANTRI) */}
        {/* ========================================================================= */}
        {modeInput === "individu" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Kolom Kiri: Pemilihan Target Santri & Parameter Sesi (4 Col) */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-4">
              {/* Card Pilih Santri */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-slate-800 text-sm">1. Pilih Santri</h2>
                </div>

                {/* Filter Kelas */}
                {uniqueKelasList.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Filter Kelas</label>
                    <select
                      value={selectedKelasId}
                      onChange={(e) => setSelectedKelasId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">Semua Kelas Binaan</option>
                      {uniqueKelasList.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Pencarian Santri */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cari Nama Santri</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ketik nama atau NISN..."
                      value={siswaSearch}
                      onChange={(e) => setSiswaSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* List Santri Radio */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {isLoadingSantri ? (
                    <div className="text-center py-6 text-xs text-slate-400">Memuat santri...</div>
                  ) : santriList.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">Tidak ada santri ditemukan.</div>
                  ) : (
                    santriList
                      .filter((s: any) =>
                        !siswaSearch.trim() ||
                        s.nama?.toLowerCase().includes(siswaSearch.toLowerCase()) ||
                        s.nisn?.toLowerCase().includes(siswaSearch.toLowerCase())
                      )
                      .map((siswa: any) => {
                        const isSelected = String(siswa.siswa_id) === String(selectedSiswaId);
                        return (
                          <button
                            type="button"
                            key={siswa.siswa_id}
                            onClick={() => setSelectedSiswaId(String(siswa.siswa_id))}
                            className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-emerald-50/80 border-emerald-400 shadow-xs text-emerald-950"
                                : "bg-slate-50/50 border-slate-200/60 hover:bg-slate-100/60 text-slate-700"
                            }`}
                          >
                            <div className="truncate pr-2">
                              <span className="font-bold text-xs block truncate">{siswa.nama}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {siswa.kelas?.nama_kelas || "Tanpa Kelas"} • NISN: {siswa.nisn || "-"}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </button>
                        );
                      })
                  )}
                </div>

                {/* Active Santri Info Box */}
                {activeSiswaIndividu && (
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 block">Santri Terpilih</span>
                    <p className="font-bold text-sm text-emerald-950">{activeSiswaIndividu.nama}</p>
                    <p className="text-[11px] text-emerald-800">
                      Kelas: <strong>{activeSiswaIndividu.kelas?.nama_kelas || "-"}</strong> • Lembaga: {activeSiswaIndividu.kelas?.lembaga?.singkatan || "-"}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Parameter Sesi */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-slate-800 text-sm">2. Parameter Sesi</h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Jenis Setoran</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setJenisSetoranIndividu("Setoran Baru")}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          jenisSetoranIndividu === "Setoran Baru"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Setoran Baru
                      </button>
                      <button
                        type="button"
                        onClick={() => setJenisSetoranIndividu("Setoran Ulang")}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          jenisSetoranIndividu === "Setoran Ulang"
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Muraja'ah
                      </button>
                      <button
                        type="button"
                        onClick={() => setJenisSetoranIndividu("Ujian")}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          jenisSetoranIndividu === "Ujian"
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Ujian
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Durasi (Menit)</label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={durasiMenitIndividu}
                        onChange={(e) => setDurasiMenitIndividu(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="15"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Detail Capaian & Penilaian (8 Col) */}
            <div className="lg:col-span-8 space-y-5">
              {/* Category Tabs */}
              <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setKategori("Al-Quran")}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    kategori === "Al-Quran"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/20"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Hafalan Al-Qur'an</span>
                </button>

                <button
                  type="button"
                  onClick={() => setKategori("Hadits")}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    kategori === "Hadits"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/20"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <ScrollText className="w-4 h-4" />
                  <span>Hafalan Hadits</span>
                </button>

                <button
                  type="button"
                  onClick={() => setKategori("Matan Ilmu")}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    kategori === "Matan Ilmu"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/20"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Hafalan Matan Ilmu</span>
                </button>
              </div>

              {/* Form Detail Sesuai Kategori */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                {/* 1. KONTEN AL-QUR'AN */}
                {kategori === "Al-Quran" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">Capaian Ayat Al-Qur'an</h3>
                        <p className="text-xs text-slate-400">Pilih rentang Surat dan Ayat yang disetorkan</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs border border-emerald-200">
                        Total {calculateAyatTotal(suratMulaiNoIndividu, ayatMulaiIndividu, suratSelesaiNoIndividu, ayatSelesaiIndividu)} Ayat
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Surat & Ayat Mulai */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
                        <span className="text-xs font-bold text-emerald-800 uppercase block tracking-wider">
                          📍 Dari (Mulai)
                        </span>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Surat</label>
                          <select
                            value={suratMulaiNoIndividu}
                            onChange={(e) => {
                              const no = Number(e.target.value);
                              setSuratMulaiNoIndividu(no);
                              setAyatMulaiIndividu(1);
                              if (suratSelesaiNoIndividu < no) {
                                setSuratSelesaiNoIndividu(no);
                                setAyatSelesaiIndividu(1);
                              }
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                          >
                            {QURAN_SURAHS.map((s) => (
                              <option key={s.number} value={s.number}>
                                {s.number}. {s.name} ({s.arabic}) - {s.totalVerses} Ayat
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Ayat Mulai</label>
                          <input
                            type="number"
                            min="1"
                            value={ayatMulaiIndividu}
                            onChange={(e) => setAyatMulaiIndividu(Number(e.target.value) || 1)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>

                      {/* Surat & Ayat Selesai */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
                        <span className="text-xs font-bold text-emerald-800 uppercase block tracking-wider">
                          🏁 Sampai (Selesai)
                        </span>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Surat</label>
                          <select
                            value={suratSelesaiNoIndividu}
                            onChange={(e) => {
                              const no = Number(e.target.value);
                              setSuratSelesaiNoIndividu(no);
                              const s = QURAN_SURAHS.find((item) => item.number === no);
                              if (s) setAyatSelesaiIndividu(s.totalVerses);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                          >
                            {QURAN_SURAHS.filter((s) => s.number >= suratMulaiNoIndividu).map((s) => (
                              <option key={s.number} value={s.number}>
                                {s.number}. {s.name} ({s.arabic}) - {s.totalVerses} Ayat
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Ayat Selesai</label>
                          <input
                            type="number"
                            min="1"
                            value={ayatSelesaiIndividu}
                            onChange={(e) => setAyatSelesaiIndividu(Number(e.target.value) || 1)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. KONTEN HADITS */}
                {kategori === "Hadits" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">Capaian Kitab & Nomor Hadits</h3>
                        <p className="text-xs text-slate-400">Pilih kitab hadits dan rentang nomor hadits yang disetorkan</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs border border-emerald-200">
                        Total {Math.max(1, haditsNoSelesaiIndividu - haditsNoMulaiIndividu + 1)} Hadits
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Pilihan Kitab Hadits</label>
                        <select
                          value={kitabHaditsIndividu}
                          onChange={(e) => setKitabHaditsIndividu(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          {HADITS_BOOK_PRESETS.map((b) => (
                            <option key={b.name} value={b.name}>
                              {b.name} {b.description ? `— ${b.description}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                          <label className="block text-xs font-bold text-slate-600 mb-1">Dari Hadits Nomor</label>
                          <input
                            type="number"
                            min="1"
                            value={haditsNoMulaiIndividu}
                            onChange={(e) => setHaditsNoMulaiIndividu(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                          <label className="block text-xs font-bold text-slate-600 mb-1">Sampai Hadits Nomor</label>
                          <input
                            type="number"
                            min={haditsNoMulaiIndividu}
                            value={haditsNoSelesaiIndividu}
                            onChange={(e) => setHaditsNoSelesaiIndividu(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. KONTEN MATAN ILMU */}
                {kategori === "Matan Ilmu" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">Capaian Matan Ilmu & Bait</h3>
                        <p className="text-xs text-slate-400">Pilih kitab matan ilmu dan rentang nomor bait yang disetorkan</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs border border-emerald-200">
                        Total {Math.max(1, baitSelesaiIndividu - baitMulaiIndividu + 1)} Bait
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Pilihan Matan Ilmu</label>
                        <select
                          value={namaMatanIndividu}
                          onChange={(e) => setNamaMatanIndividu(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          {MATAN_PRESETS.map((m) => (
                            <option key={m.name} value={m.name}>
                              {m.name} ({m.bidang}) {m.defaultBait ? `— ${m.defaultBait} Bait` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                          <label className="block text-xs font-bold text-slate-600 mb-1">Dari Bait Nomor</label>
                          <input
                            type="number"
                            min="1"
                            value={baitMulaiIndividu}
                            onChange={(e) => setBaitMulaiIndividu(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                          <label className="block text-xs font-bold text-slate-600 mb-1">Sampai Bait Nomor</label>
                          <input
                            type="number"
                            min={baitMulaiIndividu}
                            value={baitSelesaiIndividu}
                            onChange={(e) => setBaitSelesaiIndividu(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PENILAIAN KELANCARAN & CATATAN GURU */}
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Tingkat Kelancaran Hafalan <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {KELANCARAN_OPTIONS.map((opt) => {
                        const isSelected = kelancaranIndividu === opt.value;
                        return (
                          <button
                            type="button"
                            key={opt.value}
                            onClick={() => setKelancaranIndividu(opt.value)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                              isSelected
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                : `${opt.color} hover:opacity-80`
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Catatan Guru / Pembimbing Tahfidz
                    </label>
                    <textarea
                      rows={3}
                      value={catatanGuruIndividu}
                      onChange={(e) => setCatatanGuruIndividu(e.target.value)}
                      placeholder="Contoh: Makharijul huruf dan tajwid sangat baik. Perhatikan panjang mad di ayat 15."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all resize-none"
                    />
                  </div>
                </div>

                {/* ACTION SUBMIT INDIVIDU */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    Menyimak sebagai: <strong>{user?.username || "Guru Tahfidz"}</strong>
                  </span>

                  <button
                    type="submit"
                    disabled={submitMutation.isPending || !selectedSiswaId}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{submitMutation.isPending ? "Menyimpan Setoran..." : "Simpan Catatan Setoran"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default FormSetoranTahfidz;
