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
  Search
} from "lucide-react";
import { QURAN_SURAHS } from "../../../data/quranSurahList";
import { HADITS_BOOK_PRESETS, MATAN_PRESETS, KELANCARAN_OPTIONS } from "../../../data/tahfidzPresets";
import { tahfidzService } from "../../../lib/api/services/tahfidzService";
import { useAuthStore } from "../../../store/useAuthStore";

type KategoriHafalan = "Al-Quran" | "Hadits" | "Matan Ilmu";
type JenisSetoran = "Setoran Baru" | "Setoran Ulang" | "Ujian";

const FormSetoranTahfidz: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Kategori Tab
  const [kategori, setKategori] = useState<KategoriHafalan>("Al-Quran");
  const [jenisSetoran, setJenisSetoran] = useState<JenisSetoran>("Setoran Baru");
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split("T")[0]);
  const [durasiMenit, setDurasiMenit] = useState<string>("15");
  const [kelancaran, setKelancaran] = useState<string>("Lancar");
  const [catatanGuru, setCatatanGuru] = useState<string>("");

  // Santri Selection
  const [selectedKelasId, setSelectedKelasId] = useState<string>("");
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>("");
  const [siswaSearch, setSiswaSearch] = useState<string>("");

  // 1. Specific State: Al-Qur'an
  const [suratMulaiNo, setSuratMulaiNo] = useState<number>(1);
  const [ayatMulai, setAyatMulai] = useState<number>(1);
  const [suratSelesaiNo, setSuratSelesaiNo] = useState<number>(1);
  const [ayatSelesai, setAyatSelesai] = useState<number>(7);

  // 2. Specific State: Hadits
  const [kitabHadits, setKitabHadits] = useState<string>("Hadits Arbain/Khamsin");
  const [customKitabHadits, setCustomKitabHadits] = useState<string>("");
  const [haditsNoMulai, setHaditsNoMulai] = useState<number>(1);
  const [haditsNoSelesai, setHaditsNoSelesai] = useState<number>(5);

  // 3. Specific State: Matan Ilmu
  const [namaMatan, setNamaMatan] = useState<string>("Tuhfatul Athfal");
  const [customNamaMatan, setCustomNamaMatan] = useState<string>("");
  const [baitMulai, setBaitMulai] = useState<number>(1);
  const [baitSelesai, setBaitSelesai] = useState<number>(10);

  // Fetch Santri Binaan
  const { data: santriList = [], isLoading: isLoadingSantri } = useQuery({
    queryKey: ["tahfidz-santri-binaan", selectedKelasId],
    queryFn: async () => {
      return await tahfidzService.getSantriTahfidz(
        selectedKelasId ? { kelas_id: Number(selectedKelasId) } : undefined
      );
    },
  });

  // Extract unique classes from santriList
  const uniqueKelasList = useMemo(() => {
    const map = new Map<number, string>();
    santriList.forEach((s: any) => {
      if (s.kelas?.kelas_id) {
        map.set(s.kelas.kelas_id, s.kelas.nama_kelas);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [santriList]);

  // Selected Siswa Details
  const activeSiswa = useMemo(() => {
    return santriList.find((s: any) => String(s.siswa_id) === String(selectedSiswaId));
  }, [santriList, selectedSiswaId]);

  // Surah Reference Helpers
  const currentSurahMulai = useMemo(() => {
    return QURAN_SURAHS.find((s) => s.number === Number(suratMulaiNo)) || QURAN_SURAHS[0];
  }, [suratMulaiNo]);

  const currentSurahSelesai = useMemo(() => {
    return QURAN_SURAHS.find((s) => s.number === Number(suratSelesaiNo)) || QURAN_SURAHS[0];
  }, [suratSelesaiNo]);

  // Calculated Totals
  const calculatedTotalAyat = useMemo(() => {
    if (suratMulaiNo === suratSelesaiNo) {
      return Math.max(1, ayatSelesai - ayatMulai + 1);
    }
    // Jika beda surat
    let total = currentSurahMulai.totalVerses - ayatMulai + 1;
    for (let i = suratMulaiNo + 1; i < suratSelesaiNo; i++) {
      const s = QURAN_SURAHS.find((item) => item.number === i);
      if (s) total += s.totalVerses;
    }
    total += ayatSelesai;
    return total;
  }, [suratMulaiNo, suratSelesaiNo, ayatMulai, ayatSelesai, currentSurahMulai]);

  const calculatedTotalHadits = useMemo(() => {
    return Math.max(1, haditsNoSelesai - haditsNoMulai + 1);
  }, [haditsNoMulai, haditsNoSelesai]);

  const calculatedTotalBait = useMemo(() => {
    return Math.max(1, baitSelesai - baitMulai + 1);
  }, [baitMulai, baitSelesai]);

  // Filtered Siswa Dropdown
  const filteredSantri = useMemo(() => {
    if (!siswaSearch.trim()) return santriList;
    const q = siswaSearch.toLowerCase();
    return santriList.filter((s: any) =>
      s.nama?.toLowerCase().includes(q) ||
      s.nisn?.toLowerCase().includes(q) ||
      s.nis?.toLowerCase().includes(q)
    );
  }, [santriList, siswaSearch]);

  // Auto select first santri if not selected
  useEffect(() => {
    if (santriList.length > 0 && !selectedSiswaId) {
      setSelectedSiswaId(String(santriList[0].siswa_id));
    }
  }, [santriList, selectedSiswaId]);

  // Mutation to Submit Setoran
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSiswaId) {
        throw new Error("Pilih santri terlebih dahulu.");
      }

      let payload: any = {
        siswa_id: Number(selectedSiswaId),
        pegawai_id: user?.pegawai_id || undefined,
        kategori,
        jenis_hafalan: jenisSetoran,
        tanggal,
        durasi_menit: Number(durasiMenit) || 15,
        kelancaran,
        catatan_guru: catatanGuru.trim(),
      };

      if (kategori === "Al-Quran") {
        payload.surat_mulai = suratMulaiNo;
        payload.surat_mulai_nama = currentSurahMulai.name;
        payload.ayat_mulai = Number(ayatMulai);
        payload.surat_selesai = suratSelesaiNo;
        payload.surat_selesai_nama = currentSurahSelesai.name;
        payload.ayat_selesai = Number(ayatSelesai);
        payload.total_ayat = calculatedTotalAyat;
      } else if (kategori === "Hadits") {
        const finalKitab = kitabHadits === "Hadits Lainnya (Kustom)" ? customKitabHadits : kitabHadits;
        payload.kitab_hadits = finalKitab || "Hadits Pilihan";
        payload.hadits_no_mulai = Number(haditsNoMulai);
        payload.hadits_no_selesai = Number(haditsNoSelesai);
        payload.total_hadits = calculatedTotalHadits;
      } else if (kategori === "Matan Ilmu") {
        const finalMatan = namaMatan === "Matan Lainnya (Kustom)" ? customNamaMatan : namaMatan;
        payload.nama_matan = finalMatan || "Matan Ilmu";
        payload.bait_mulai = Number(baitMulai);
        payload.bait_selesai = Number(baitSelesai);
        payload.total_bait = calculatedTotalBait;
      }

      return await tahfidzService.createSetoran(payload);
    },
    onSuccess: () => {
      toast.success("Catatan setoran hafalan santri berhasil disimpan!");
      setCatatanGuru("");
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

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#103426] via-[#1A4D38] to-[#103426] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-emerald-300 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sistem Pencatatan Setoran Santri</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Input Setoran Hafalan Santri
            </h1>
            <p className="text-emerald-100 text-sm max-w-2xl leading-relaxed">
              Catat setoran hafalan harian santri secara mudah dan terstruktur, mulai dari <strong>Al-Qur'an (114 Surat)</strong>, <strong>Hadits Pilihan</strong>, hingga <strong>Matan Ilmu</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <span className="block text-[10px] text-emerald-200 font-bold uppercase">Santri Binaan</span>
              <span className="text-xl font-black text-white">{santriList.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING STICKY SANTRI TERPILIH (Tampilan Mobile / HP) */}
      {activeSiswa && (
        <div className="sticky top-2 z-30 lg:hidden bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-emerald-300 shadow-lg shadow-emerald-950/10 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                {activeSiswa.nama.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                    Santri Terpilih
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate">
                    {activeSiswa.kelas?.nama_kelas || "-"} ({activeSiswa.kelas?.lembaga?.singkatan || "-"})
                  </span>
                </div>
                <p className="font-bold text-xs sm:text-sm text-slate-900 truncate leading-snug">
                  {activeSiswa.nama}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("pilih-santri-section");
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="shrink-0 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-xl border border-emerald-200 transition-colors cursor-pointer"
            >
              Ganti
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Pemilihan Santri & Informasi Sesi (4 Col) - Sticky di Desktop */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-4">
          {/* Card Pilih Santri */}
          <div id="pilih-santri-section" className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
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
                  onChange={(e) => {
                    setSelectedKelasId(e.target.value);
                  }}
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

            {/* List Santri Radio / Selection */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {isLoadingSantri ? (
                <div className="text-center py-6 text-xs text-slate-400">Memuat santri...</div>
              ) : filteredSantri.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">Tidak ada santri ditemukan.</div>
              ) : (
                filteredSantri.map((siswa: any) => {
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
            {activeSiswa && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Santri Terpilih</span>
                <p className="font-bold text-sm text-emerald-950">{activeSiswa.nama}</p>
                <p className="text-[11px] text-emerald-800">
                  Kelas: <strong>{activeSiswa.kelas?.nama_kelas || "-"}</strong> • Lembaga: {activeSiswa.kelas?.lembaga?.singkatan || "-"}
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
              {/* Jenis Setoran */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Jenis Setoran</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setJenisSetoran("Setoran Baru")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      jenisSetoran === "Setoran Baru"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    ✨ Setoran Baru (Ziyadah)
                  </button>
                  <button
                    type="button"
                    onClick={() => setJenisSetoran("Setoran Ulang")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      jenisSetoran === "Setoran Ulang"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    🔄 Setoran Ulang (Muraja'ah)
                  </button>
                  <button
                    type="button"
                    onClick={() => setJenisSetoran("Ujian")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      jenisSetoran === "Ujian"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    📝 Ujian (Ikhtibar/Tasmi')
                  </button>
                </div>
              </div>

              {/* Tanggal & Durasi */}
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
                    value={durasiMenit}
                    onChange={(e) => setDurasiMenit(e.target.value)}
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
                    Total {calculatedTotalAyat} Ayat
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
                        value={suratMulaiNo}
                        onChange={(e) => {
                          const no = Number(e.target.value);
                          setSuratMulaiNo(no);
                          setAyatMulai(1);
                          if (suratSelesaiNo < no) {
                            setSuratSelesaiNo(no);
                            setAyatSelesai(1);
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
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Ayat Mulai (Max: {currentSurahMulai.totalVerses})
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={currentSurahMulai.totalVerses}
                        value={ayatMulai}
                        onChange={(e) => setAyatMulai(Number(e.target.value))}
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
                        value={suratSelesaiNo}
                        onChange={(e) => {
                          const no = Number(e.target.value);
                          setSuratSelesaiNo(no);
                          const s = QURAN_SURAHS.find((item) => item.number === no);
                          if (s) setAyatSelesai(s.totalVerses);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        {QURAN_SURAHS.filter((s) => s.number >= suratMulaiNo).map((s) => (
                          <option key={s.number} value={s.number}>
                            {s.number}. {s.name} ({s.arabic}) - {s.totalVerses} Ayat
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Ayat Selesai (Max: {currentSurahSelesai.totalVerses})
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={currentSurahSelesai.totalVerses}
                        value={ayatSelesai}
                        onChange={(e) => setAyatSelesai(Number(e.target.value))}
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
                    Total {calculatedTotalHadits} Hadits
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Pilihan Kitab Hadits</label>
                    <select
                      value={kitabHadits}
                      onChange={(e) => setKitabHadits(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {HADITS_BOOK_PRESETS.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name} {b.description ? `— ${b.description}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {kitabHadits === "Hadits Lainnya (Kustom)" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nama Kitab Hadits Kustom</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Hadits Adab Al-Mufrad"
                        value={customKitabHadits}
                        onChange={(e) => setCustomKitabHadits(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Dari Hadits Nomor</label>
                      <input
                        type="number"
                        min="1"
                        value={haditsNoMulai}
                        onChange={(e) => setHaditsNoMulai(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Sampai Hadits Nomor</label>
                      <input
                        type="number"
                        min={haditsNoMulai}
                        value={haditsNoSelesai}
                        onChange={(e) => setHaditsNoSelesai(Number(e.target.value))}
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
                    Total {calculatedTotalBait} Bait
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Pilihan Matan Ilmu</label>
                    <select
                      value={namaMatan}
                      onChange={(e) => setNamaMatan(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {MATAN_PRESETS.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name} ({m.bidang}) {m.defaultBait ? `— ${m.defaultBait} Bait` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {namaMatan === "Matan Lainnya (Kustom)" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nama Matan Kustom</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Matan Al-Ajrumiyyah Bab Kalam"
                        value={customNamaMatan}
                        onChange={(e) => setCustomNamaMatan(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Dari Bait / Materi Nomor</label>
                      <input
                        type="number"
                        min="1"
                        value={baitMulai}
                        onChange={(e) => setBaitMulai(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Sampai Bait / Materi Nomor</label>
                      <input
                        type="number"
                        min={baitMulai}
                        value={baitSelesai}
                        onChange={(e) => setBaitSelesai(Number(e.target.value))}
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
                    const isSelected = kelancaran === opt.value;
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setKelancaran(opt.value)}
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
                  value={catatanGuru}
                  onChange={(e) => setCatatanGuru(e.target.value)}
                  placeholder="Contoh: Makharijul huruf dan tajwid sangat baik. Perhatikan panjang mad wajib di ayat 15."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            {/* ACTION SUBMIT */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Menyimak sebagai: <strong>{user?.username || "Guru Tahfidz"}</strong>
              </span>

              <button
                type="submit"
                disabled={submitMutation.isPending || !selectedSiswaId}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{submitMutation.isPending ? "Menyimpan Setoran..." : "Simpan Catatan Setoran"}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FormSetoranTahfidz;
