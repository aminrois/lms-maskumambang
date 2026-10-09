// src/pages/Tahfidz/Tilawah/Index.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  Sparkles,
  Calendar,
  User,
  Search,
  Filter,
  Trash2,
  Edit,
  Save,
  Clock,
  CheckCircle2,
  Award,
  TrendingUp,
  BookmarkCheck,
  ChevronRight,
  PlusCircle,
  History,
  Layers,
  Users,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import { QURAN_SURAHS } from "../../../data/quranSurahList";
import {
  calculatePagesAndStats,
  getSurahMeta,
  getPageForVerse,
} from "../../../data/quranPageMapping";
import {
  tahfidzService,
  type TahfidzTilawahItem,
} from "../../../lib/api/services/tahfidzService";
import { useAuthStore } from "../../../store/useAuthStore";
import { apiClient } from "../../../lib/api/axios";

type ActiveTab = "input" | "riwayat" | "tracker";
type ModeInput = "individu" | "kelas";

const WAKTU_TILAWAH_PRESETS = [
  "Ba'da Subuh",
  "Ba'da Dzuhur",
  "Ba'da Ashar",
  "Ba'da Maghrib",
  "Ba'da Isya",
  "Tadarus Mandiri di Rumah",
  "Tadarus Bersama di Asrama",
  "Tadarus Kelas Pagi",
];

export const TilawahSantriPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, role } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>("input");
  const [modeInput, setModeInput] = useState<ModeInput>("individu");

  // Form Input State
  const [tanggal, setTanggal] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedKelasId, setSelectedKelasId] = useState<string>("");
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>("");
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<number[]>([]);
  const [siswaSearch, setSiswaSearch] = useState<string>("");

  // Surah & Verse Coordinates
  const [suratMulaiNo, setSuratMulaiNo] = useState<number>(1);
  const [ayatMulai, setAyatMulai] = useState<number>(1);
  const [suratSelesaiNo, setSuratSelesaiNo] = useState<number>(1);
  const [ayatSelesai, setAyatSelesai] = useState<number>(7);

  // Keterangan & Penginput
  const [keterangan, setKeterangan] = useState<string>("Ba'da Maghrib");
  const [customKeterangan, setCustomKeterangan] = useState<string>("");
  
  // Default diinput_oleh based on user role
  const isWaliSantri = role === "Wali Murid" || role === "Wali" || role === "wali_murid";
  const defaultPenginputRole = isWaliSantri ? "Wali Santri" : "Wali Kelas";
  const [diinputOleh, setDiinputOleh] = useState<string>(defaultPenginputRole);
  const [penginputNama, setPenginputNama] = useState<string>(
    user?.nama || user?.username || (isWaliSantri ? "Orang Tua / Wali Santri" : "Wali Kelas")
  );

  // Filter State for Riwayat Tab
  const [filterKelasId, setFilterKelasId] = useState<string>("");
  const [filterPenginput, setFilterPenginput] = useState<string>("");
  const [filterTanggalMulai, setFilterTanggalMulai] = useState<string>("");
  const [filterTanggalAkhir, setFilterTanggalAkhir] = useState<string>("");
  const [searchRiwayat, setSearchRiwayat] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const limit = 20;

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<TahfidzTilawahItem | null>(null);

  // Fetch Kelas (Filtered by Wali Kelas if role is Wali Kelas)
  const { data: kelasList = [] } = useQuery({
    queryKey: ["kelas-tilawah-role-aware"],
    queryFn: async () => {
      return await tahfidzService.getKelasTilawah();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Santri (Filtered by Wali Kelas / Wali Murid role)
  const { data: santriList = [], isLoading: isLoadingSantri } = useQuery({
    queryKey: ["santri-tilawah-role-aware", selectedKelasId],
    queryFn: async () => {
      return await tahfidzService.getSantriTilawah(
        selectedKelasId ? { kelas_id: Number(selectedKelasId) } : undefined
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  // Auto select first class if user is Wali Kelas with 1 class
  useEffect(() => {
    if (kelasList.length === 1 && !selectedKelasId) {
      setSelectedKelasId(String(kelasList[0].kelas_id));
    }
  }, [kelasList, selectedKelasId]);

  // Auto select first santri when list is loaded in individual mode
  useEffect(() => {
    if (santriList.length > 0 && !selectedSiswaId && modeInput === "individu") {
      setSelectedSiswaId(String(santriList[0].siswa_id));
    }
  }, [santriList, selectedSiswaId, modeInput]);

  // Auto-calculate Quran page mapping in real-time
  const pageStats = useMemo(() => {
    return calculatePagesAndStats(
      Number(suratMulaiNo),
      Number(ayatMulai),
      Number(suratSelesaiNo),
      Number(ayatSelesai)
    );
  }, [suratMulaiNo, ayatMulai, suratSelesaiNo, ayatSelesai]);

  const curSurahMulaiMeta = useMemo(() => getSurahMeta(suratMulaiNo), [suratMulaiNo]);
  const curSurahSelesaiMeta = useMemo(() => getSurahMeta(suratSelesaiNo), [suratSelesaiNo]);

  // Adjust default ayat max when surah changes
  const handleSuratMulaiChange = (no: number) => {
    setSuratMulaiNo(no);
    setAyatMulai(1);
    if (no > suratSelesaiNo) {
      setSuratSelesaiNo(no);
      const meta = getSurahMeta(no);
      setAyatSelesai(meta ? meta.totalVerses : 7);
    }
  };

  const handleSuratSelesaiChange = (no: number) => {
    setSuratSelesaiNo(no);
    const meta = getSurahMeta(no);
    if (meta) {
      setAyatSelesai(meta.totalVerses);
    }
  };

  // Selected Siswa Details
  const activeSiswa = useMemo(() => {
    return santriList.find((s: any) => String(s.siswa_id) === String(selectedSiswaId));
  }, [santriList, selectedSiswaId]);

  // Filtered Siswa List for search
  const filteredSantri = useMemo(() => {
    if (!siswaSearch.trim()) return santriList;
    const q = siswaSearch.toLowerCase();
    return santriList.filter((s: any) =>
      s.nama?.toLowerCase().includes(q) ||
      s.nis?.toLowerCase().includes(q) ||
      s.nisn?.toLowerCase().includes(q) ||
      s.kelas?.nama_kelas?.toLowerCase().includes(q)
    );
  }, [santriList, siswaSearch]);

  // Handle select all students in class
  const handleSelectAllSiswa = (checked: boolean) => {
    if (checked) {
      setSelectedSiswaIds(filteredSantri.map((s: any) => s.siswa_id));
    } else {
      setSelectedSiswaIds([]);
    }
  };

  const handleToggleSiswaCheckbox = (siswaId: number) => {
    setSelectedSiswaIds((prev) =>
      prev.includes(siswaId) ? prev.filter((id) => id !== siswaId) : [...prev, siswaId]
    );
  };

  // Fetch Riwayat Tilawah List
  const {
    data: tilawahResponse,
    isLoading: isLoadingRiwayat,
    refetch: refetchRiwayat,
  } = useQuery({
    queryKey: [
      "tilawah-history-list",
      page,
      filterKelasId,
      filterPenginput,
      filterTanggalMulai,
      filterTanggalAkhir,
      searchRiwayat,
    ],
    queryFn: async () => {
      return await tahfidzService.getTilawahList({
        kelas_id: filterKelasId ? Number(filterKelasId) : undefined,
        diinput_oleh: filterPenginput || undefined,
        tanggal_mulai: filterTanggalMulai || undefined,
        tanggal_akhir: filterTanggalAkhir || undefined,
        search: searchRiwayat || undefined,
        limit,
        offset: (page - 1) * limit,
      });
    },
    staleTime: 60 * 1000,
  });

  const tilawahList: TahfidzTilawahItem[] = tilawahResponse?.data || [];
  const totalRiwayat = tilawahResponse?.meta?.total || 0;
  const totalPagesCount = Math.ceil(totalRiwayat / limit);

  // Global Aggregate Statistics
  const totalPagesRead = useMemo(() => {
    return tilawahList.reduce((acc, item) => acc + (item.total_halaman || 0), 0);
  }, [tilawahList]);

  // Create Tilawah Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const finalKeterangan =
        keterangan === "Lainnya..." ? customKeterangan : keterangan;

      const payload: any = {
        tanggal,
        surat_mulai: Number(suratMulaiNo),
        surat_mulai_nama: curSurahMulaiMeta?.name || `Surat ke-${suratMulaiNo}`,
        ayat_mulai: Number(ayatMulai),
        surat_selesai: Number(suratSelesaiNo),
        surat_selesai_nama: curSurahSelesaiMeta?.name || `Surat ke-${suratSelesaiNo}`,
        ayat_selesai: Number(ayatSelesai),
        halaman_mulai: pageStats.pageStart,
        halaman_selesai: pageStats.pageEnd,
        total_halaman: pageStats.totalPages,
        total_ayat: pageStats.totalVerses,
        keterangan: finalKeterangan,
        diinput_oleh: diinputOleh,
        penginput_nama: penginputNama,
      };

      if (modeInput === "individu") {
        if (!selectedSiswaId) {
          throw new Error("Pilih santri yang melakukan tilawah");
        }
        payload.siswa_id = Number(selectedSiswaId);
      } else {
        if (selectedSiswaIds.length === 0) {
          throw new Error("Pilih minimal satu santri di kelas ini");
        }
        payload.siswa_ids = selectedSiswaIds;
      }

      return await tahfidzService.createTilawah(payload);
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Laporan tilawah berhasil dicatat!");
      queryClient.invalidateQueries({ queryKey: ["tilawah-history-list"] });
      if (modeInput === "individu") {
        // Reset or keep date
      } else {
        setSelectedSiswaIds([]);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || "Gagal menyimpan laporan tilawah");
    },
  });

  // Delete Tilawah Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await tahfidzService.deleteTilawah(id);
    },
    onSuccess: () => {
      toast.success("Catatan tilawah berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["tilawah-history-list"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal menghapus data");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 font-sans text-slate-800">
      {/* Header Banner Modern Islamic Aesthetics */}
      <div className="bg-linear-to-r from-[#1A365D] via-[#2B6CB0] to-[#1A365D] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-500/20">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-200 backdrop-blur-xs border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Modul Tilawah & Tadarus Al-Qur'an Santri</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Pencatatan & Laporan Tilawah Harian
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              Catat aktivitas membaca Al-Qur'an santri setiap hari secara sistematis. Terkonversi otomatis ke standar 604 Halaman Mushaf Madinah dan dapat diinput oleh Wali Kelas maupun Wali Santri.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center min-w-[120px]">
              <span className="text-[10px] text-blue-200 font-bold uppercase block tracking-wider">
                Total Entri
              </span>
              <span className="text-xl font-black text-white">{totalRiwayat}</span>
              <span className="text-[10px] text-blue-200 block font-medium">Laporan</span>
            </div>
            <div className="bg-yellow-400/20 backdrop-blur-md rounded-2xl p-3.5 border border-yellow-300/30 text-center min-w-[120px]">
              <span className="text-[10px] text-yellow-200 font-bold uppercase block tracking-wider">
                Mushaf Standar
              </span>
              <span className="text-xl font-black text-white">604</span>
              <span className="text-[10px] text-yellow-200 block font-medium">Halaman Madinah</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/15 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("input")}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "input"
                ? "bg-[#FACC15] text-[#1A365D] font-black shadow-lg shadow-yellow-500/20"
                : "bg-white/10 text-blue-100 hover:bg-white/20"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Form Input Tilawah</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("riwayat")}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "riwayat"
                ? "bg-[#FACC15] text-[#1A365D] font-black shadow-lg shadow-yellow-500/20"
                : "bg-white/10 text-blue-100 hover:bg-white/20"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat & Laporan Bacaan ({totalRiwayat})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FORM INPUT TILAWAH */}
      {/* ========================================================================= */}
      {activeTab === "input" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode Selector: Input Per Santri vs Input Kelas (Kolosal) */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mode Input:</span>
              <div className="inline-flex p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setModeInput("individu")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    modeInput === "individu"
                      ? "bg-[#1A365D] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Input Per Santri (Individu / Wali Santri)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModeInput("kelas")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    modeInput === "kelas"
                      ? "bg-[#1A365D] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Input Massal Per Kelas (Wali Kelas)</span>
                </button>
              </div>
            </div>

            {/* Penginput Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Pelapor:</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <BookmarkCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>{diinputOleh}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Kolom Kiri: Pemilihan Santri / Kelas (4 Cols) */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-slate-800 text-sm">
                    {modeInput === "individu" ? "1. Pilih Santri" : "1. Pilih Santri Kelas"}
                  </h2>
                </div>

                {/* Filter Kelas */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Filter Kelas</label>
                  <select
                    value={selectedKelasId}
                    onChange={(e) => setSelectedKelasId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Semua Kelas</option>
                    {kelasList.map((k: any) => (
                      <option key={k.kelas_id} value={k.kelas_id}>
                        {k.nama_kelas} ({k.lembaga?.singkatan || ""})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pencarian Santri */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cari Nama Santri</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ketik nama atau NIS..."
                      value={siswaSearch}
                      onChange={(e) => setSiswaSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Mode Massal: Select All / Deselect All */}
                {modeInput === "kelas" && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          filteredSantri.length > 0 &&
                          selectedSiswaIds.length === filteredSantri.length
                        }
                        onChange={(e) => handleSelectAllSiswa(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 accent-blue-600 w-4 h-4"
                      />
                      <span>Pilih Semua ({selectedSiswaIds.length}/{filteredSantri.length})</span>
                    </label>
                  </div>
                )}

                {/* List Santri */}
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                  {isLoadingSantri ? (
                    <div className="text-center py-6 text-xs text-slate-400">Memuat data santri...</div>
                  ) : filteredSantri.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">Tidak ada santri ditemukan.</div>
                  ) : (
                    filteredSantri.map((siswa: any) => {
                      if (modeInput === "individu") {
                        const isSelected = String(siswa.siswa_id) === String(selectedSiswaId);
                        return (
                          <button
                            type="button"
                            key={siswa.siswa_id}
                            onClick={() => setSelectedSiswaId(String(siswa.siswa_id))}
                            className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-blue-50/90 border-blue-400 shadow-xs text-blue-950 font-bold ring-2 ring-blue-500/20"
                                : "bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            <div className="truncate pr-2">
                              <span className="font-bold text-xs block truncate">{siswa.nama}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {siswa.kelas?.nama_kelas || "MTs"} • NIS: {siswa.nis || "-"}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </button>
                        );
                      } else {
                        // Mode Massal Checkbox
                        const isChecked = selectedSiswaIds.includes(siswa.siswa_id);
                        return (
                          <label
                            key={siswa.siswa_id}
                            className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                              isChecked
                                ? "bg-blue-50/90 border-blue-300 text-blue-950 font-bold"
                                : "bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            <div className="truncate pr-2">
                              <span className="font-bold text-xs block truncate">{siswa.nama}</span>
                              <span className="text-[10px] text-slate-400 block">
                                {siswa.kelas?.nama_kelas || "MTs"}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSiswaCheckbox(siswa.siswa_id)}
                              className="rounded text-blue-600 focus:ring-blue-500 accent-blue-600 w-4 h-4"
                            />
                          </label>
                        );
                      }
                    })
                  )}
                </div>

                {/* Selected Santri Highlight Box */}
                {modeInput === "individu" && activeSiswa && (
                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-950 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-blue-600 block">Santri Terpilih</span>
                    <p className="font-bold text-sm">{activeSiswa.nama}</p>
                    <p className="text-[11px] text-blue-800">
                      Kelas: <strong>{activeSiswa.kelas?.nama_kelas || "-"}</strong> • NIS: {activeSiswa.nis || "-"}
                    </p>
                  </div>
                )}
              </div>

              {/* Tanggal & Waktu Box */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-slate-800 text-sm">2. Waktu & Sesi</h2>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Tilawah</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Sesi / Keterangan</label>
                  <select
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {WAKTU_TILAWAH_PRESETS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                    <option value="Lainnya...">Lainnya (Tulis Sendiri)...</option>
                  </select>
                </div>

                {keterangan === "Lainnya..." && (
                  <div>
                    <input
                      type="text"
                      placeholder="Contoh: Tadarus bersama di Masjid Jami'..."
                      value={customKeterangan}
                      onChange={(e) => setCustomKeterangan(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Kolom Kanan: Parameter Bacaan Al-Qur'an & Konversi Halaman (8 Cols) */}
            <div className="lg:col-span-8 space-y-5">
              {/* Card Parameter Input Al-Qur'an */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-800 text-base">3. Parameter Bacaan Al-Qur'an</h2>
                      <p className="text-xs text-slate-500">
                        Tentukan surat dan ayat mulai hingga surat dan ayat selesai
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">
                    Mushaf Madinah (604 Hal)
                  </span>
                </div>

                {/* Rentang Bacaan Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SURAT & AYAT MULAI */}
                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1A365D] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        Mulai Dari
                      </span>
                      {curSurahMulaiMeta && (
                        <span className="text-xs font-serif text-slate-500">
                          {curSurahMulaiMeta.arabic}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Surat Mulai</label>
                      <select
                        value={suratMulaiNo}
                        onChange={(e) => handleSuratMulaiChange(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {QURAN_SURAHS.map((s) => (
                          <option key={s.number} value={s.number}>
                            {s.number}. {s.name} ({s.totalVerses} Ayat) - {s.type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">Ayat Mulai</label>
                        <span className="text-[11px] text-slate-400">
                          Maks: {curSurahMulaiMeta?.totalVerses || 7} Ayat
                        </span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={curSurahMulaiMeta?.totalVerses || 7}
                        value={ayatMulai}
                        onChange={(e) => setAyatMulai(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* SURAT & AYAT SELESAI */}
                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Sampai Dengan
                      </span>
                      {curSurahSelesaiMeta && (
                        <span className="text-xs font-serif text-slate-500">
                          {curSurahSelesaiMeta.arabic}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Surat Selesai</label>
                      <select
                        value={suratSelesaiNo}
                        onChange={(e) => handleSuratSelesaiChange(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {QURAN_SURAHS.map((s) => (
                          <option key={s.number} value={s.number}>
                            {s.number}. {s.name} ({s.totalVerses} Ayat)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">Ayat Selesai</label>
                        <span className="text-[11px] text-slate-400">
                          Maks: {curSurahSelesaiMeta?.totalVerses || 7} Ayat
                        </span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={curSurahSelesaiMeta?.totalVerses || 7}
                        value={ayatSelesai}
                        onChange={(e) => setAyatSelesai(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* WIDGET KONVERSI HALAMAN OTOMATIS (LIVE PREVIEW) */}
                <div className="bg-linear-to-r from-[#1A365D] via-[#2B6CB0] to-[#1A365D] rounded-3xl p-5 text-white border border-blue-400/20 shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span className="text-xs font-bold tracking-wider uppercase text-blue-200">
                        Hasil Konversi Halaman Mushaf Standar Madinah
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-white/10 rounded-lg text-[11px] text-blue-100">
                      Otomatis
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                      <span className="text-[10px] text-blue-200 font-bold uppercase block">Halaman Mulai</span>
                      <span className="text-xl sm:text-2xl font-black text-white">Hal. {pageStats.pageStart}</span>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                      <span className="text-[10px] text-blue-200 font-bold uppercase block">Halaman Selesai</span>
                      <span className="text-xl sm:text-2xl font-black text-white">Hal. {pageStats.pageEnd}</span>
                    </div>
                    <div className="bg-[#FACC15]/20 rounded-2xl p-3 border border-yellow-400/30">
                      <span className="text-[10px] text-yellow-300 font-bold uppercase block">Total Halaman</span>
                      <span className="text-xl sm:text-2xl font-black text-yellow-300">{pageStats.totalPages} Hal</span>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                      <span className="text-[10px] text-blue-200 font-bold uppercase block">Total Ayat</span>
                      <span className="text-xl sm:text-2xl font-black text-white">{pageStats.totalVerses} Ayat</span>
                    </div>
                  </div>

                  <p className="text-xs text-blue-100 text-center italic">
                    Ringkasan Bacaan: <strong>QS. {curSurahMulaiMeta?.name} : {ayatMulai}</strong> s/d{" "}
                    <strong>QS. {curSurahSelesaiMeta?.name} : {ayatSelesai}</strong>
                  </p>
                </div>

                {/* Pelapor / Identitas Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Peran Penginput: <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={diinputOleh}
                      onChange={(e) => setDiinputOleh(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Wali Kelas">Wali Kelas</option>
                      <option value="Wali Santri">Wali Santri / Orang Tua</option>
                      <option value="Guru Tahfidz">Guru Tahfidz</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Penginput / Pelapor</label>
                    <input
                      type="text"
                      value={penginputNama}
                      onChange={(e) => setPenginputNama(e.target.value)}
                      placeholder="Nama Wali / Ustadz..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#1A365D] hover:bg-[#2B6CB0] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {createMutation.isPending
                        ? "Menyimpan Laporan Tilawah..."
                        : modeInput === "individu"
                        ? "Simpan Laporan Tilawah Santri"
                        : `Simpan Laporan (${selectedSiswaIds.length} Santri)`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RIWAYAT & LAPORAN TILAWAH */}
      {/* ========================================================================= */}
      {activeTab === "riwayat" && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Filter className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Filter Riwayat</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Kelas</label>
                <select
                  value={filterKelasId}
                  onChange={(e) => {
                    setFilterKelasId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Semua Kelas</option>
                  {kelasList.map((k: any) => (
                    <option key={k.kelas_id} value={k.kelas_id}>
                      {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Penginput</label>
                <select
                  value={filterPenginput}
                  onChange={(e) => {
                    setFilterPenginput(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Semua Penginput</option>
                  <option value="Wali Kelas">Wali Kelas</option>
                  <option value="Wali Santri">Wali Santri</option>
                  <option value="Guru Tahfidz">Guru Tahfidz</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={filterTanggalMulai}
                  onChange={(e) => {
                    setFilterTanggalMulai(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Cari Santri / Keterangan</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Nama santri, surat, dll..."
                    value={searchRiwayat}
                    onChange={(e) => {
                      setSearchRiwayat(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Nama Santri</th>
                    <th className="py-3.5 px-4">Kelas</th>
                    <th className="py-3.5 px-4">Bacaan Al-Qur'an</th>
                    <th className="py-3.5 px-4 text-center">Konversi Halaman</th>
                    <th className="py-3.5 px-4">Sesi / Catatan</th>
                    <th className="py-3.5 px-4">Pelapor</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingRiwayat ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        Memuat riwayat tilawah santri...
                      </td>
                    </tr>
                  ) : tilawahList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                        <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="font-bold text-slate-600">Belum ada riwayat tilawah ditemukan.</p>
                        <p className="text-xs">Gunakan form di atas untuk mencatat tilawah santri harian.</p>
                      </td>
                    </tr>
                  ) : (
                    tilawahList.map((item) => (
                      <tr key={item.tilawah_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                          {item.tanggal}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.siswa?.nama || "-"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                            {item.siswa?.kelas?.nama_kelas || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <span>
                            QS. {item.surat_mulai_nama} : {item.ayat_mulai} s/d QS. {item.surat_selesai_nama} : {item.ayat_selesai}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {item.total_ayat || 0} Ayat
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl font-bold text-xs">
                            <span>Hal. {item.halaman_mulai || 1} - {item.halaman_selesai || 1}</span>
                            <span className="text-[10px] text-blue-600 font-mono">({item.total_halaman || 1} Hal)</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.keterangan || "-"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              item.diinput_oleh === "Wali Santri"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {item.diinput_oleh}
                          </span>
                          {item.penginput_nama && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                              {item.penginput_nama}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Apakah Anda yakin ingin menghapus catatan tilawah ini?")) {
                                deleteMutation.mutate(item.tilawah_id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPagesCount > 1 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, totalRiwayat)} dari {totalRiwayat} data
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2">
                    {page} / {totalPagesCount}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPagesCount}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TilawahSantriPage;
