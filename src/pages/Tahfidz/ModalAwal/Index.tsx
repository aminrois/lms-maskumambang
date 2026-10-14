// src/pages/Tahfidz/ModalAwal/Index.tsx
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookMarked,
  Search,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  History,
  CheckCircle2,
  AlertCircle,
  User,
  GraduationCap,
  BookOpen,
  RefreshCw,
  X,
  Award,
} from "lucide-react";
import {
  tahfidzService,
  type SantriModalAwalData,
} from "../../../lib/api/services/tahfidzService";
import { QURAN_SURAHS } from "../../../data/quranSurahList";

const ModalAwalTahfidzIndex: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sudah" | "belum">("all");

  // Modal Dialog Form (Input / Edit Modal Awal)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [selectedSantri, setSelectedSantri] = useState<SantriModalAwalData | null>(null);

  const [formJuzAwal, setFormJuzAwal] = useState<number>(0);
  const [formSurahNo, setFormSurahNo] = useState<number | "">("");
  const [formAyat, setFormAyat] = useState<number | "">("");
  const [formHalaman, setFormHalaman] = useState<number | "">("");
  const [formTanggal, setFormTanggal] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [formKeterangan, setFormKeterangan] = useState<string>("");

  // Modal Dialog Akumulasi (Kenaikan Kelas)
  const [isAkumulasiOpen, setIsAkumulasiOpen] = useState<boolean>(false);
  const [akumulasiSantri, setAkumulasiSantri] = useState<SantriModalAwalData | null>(null);
  const [catatanKenaikan, setCatatanKenaikan] = useState<string>("");
  const [tambahJuzManual, setTambahJuzManual] = useState<string>("");

  // Modal Riwayat Akumulasi
  const [isRiwayatOpen, setIsRiwayatOpen] = useState<boolean>(false);
  const [riwayatSantri, setRiwayatSantri] = useState<SantriModalAwalData | null>(null);

  // Fetch Data Modal Awal List
  const {
    data: responseData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["tahfidz-modal-awal-list", statusFilter, searchQuery],
    queryFn: () =>
      tahfidzService.getModalAwalList({
        status_modal: statusFilter,
        search: searchQuery,
      }),
  });

  const santriList: SantriModalAwalData[] = Array.isArray(responseData?.data)
    ? responseData.data
    : [];
  const summary = responseData?.summary || {
    total_santri: 0,
    total_sudah_input: 0,
    total_belum_input: 0,
    total_modal_juz: 0,
    total_ziyadah_juz: 0,
    total_keseluruhan_juz: 0,
  };

  // Surah selected info
  const selectedSurahInfo = useMemo(() => {
    if (!formSurahNo) return null;
    return QURAN_SURAHS.find((s) => s.number === Number(formSurahNo)) || null;
  }, [formSurahNo]);

  // Open Form Dialog for Create/Edit
  const handleOpenForm = (santri: SantriModalAwalData) => {
    setSelectedSantri(santri);
    if (santri.modal_awal) {
      setFormJuzAwal(santri.modal_awal.juz_awal || 0);
      setFormSurahNo(santri.modal_awal.surah_awal_no || "");
      setFormAyat(santri.modal_awal.ayat_awal || "");
      setFormHalaman(santri.modal_awal.halaman_awal || "");
      setFormTanggal(
        santri.modal_awal.tanggal_input || new Date().toISOString().split("T")[0]
      );
      setFormKeterangan(santri.modal_awal.keterangan || "");
    } else {
      setFormJuzAwal(0);
      setFormSurahNo("");
      setFormAyat("");
      setFormHalaman("");
      setFormTanggal(new Date().toISOString().split("T")[0]);
      setFormKeterangan("");
    }
    setIsFormOpen(true);
  };

  // Open Akumulasi Dialog
  const handleOpenAkumulasi = (santri: SantriModalAwalData) => {
    setAkumulasiSantri(santri);
    setCatatanKenaikan(`Kenaikan Kelas / Semester ${new Date().getFullYear()}`);
    setTambahJuzManual(String(santri.progress?.ziyadah_juz ?? 0));
    setIsAkumulasiOpen(true);
  };

  // Open Riwayat Dialog
  const handleOpenRiwayat = (santri: SantriModalAwalData) => {
    setRiwayatSantri(santri);
    setIsRiwayatOpen(true);
  };

  // Mutation Save Modal Awal
  const saveMutation = useMutation({
    mutationFn: (payload: any) => tahfidzService.saveModalAwal(payload),
    onSuccess: (res) => {
      toast.success(res.message || "Modal awal hafalan berhasil disimpan");
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tahfidz-modal-awal-list"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan modal awal");
    },
  });

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) return;

    const surahObj = formSurahNo
      ? QURAN_SURAHS.find((s) => s.number === Number(formSurahNo))
      : null;

    saveMutation.mutate({
      siswa_id: selectedSantri.siswa_id,
      juz_awal: Number(formJuzAwal) || 0,
      surah_awal: surahObj ? surahObj.name : undefined,
      surah_awal_no: formSurahNo ? Number(formSurahNo) : undefined,
      ayat_awal: formAyat ? Number(formAyat) : undefined,
      halaman_awal: formHalaman ? Number(formHalaman) : undefined,
      keterangan: formKeterangan || undefined,
      tanggal_input: formTanggal || undefined,
    });
  };

  // Mutation Delete Modal Awal
  const deleteMutation = useMutation({
    mutationFn: (id: number) => tahfidzService.deleteModalAwal(id),
    onSuccess: () => {
      toast.success("Modal awal berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["tahfidz-modal-awal-list"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus data");
    },
  });

  const handleDeleteModal = (santri: SantriModalAwalData) => {
    if (!santri.modal_awal) return;
    if (
      window.confirm(
        `Hapus data modal awal hafalan santri "${santri.nama}"? Data hafalan setoran yang ada di sistem tidak akan terhapus.`
      )
    ) {
      deleteMutation.mutate(santri.modal_awal.modal_id);
    }
  };

  // Mutation Akumulasi Modal Awal
  const akumulasiMutation = useMutation({
    mutationFn: (payload: any) => tahfidzService.akumulasiModalAwal(payload),
    onSuccess: (res) => {
      toast.success(res.message || "Berhasil mengakumulasikan hafalan santri");
      setIsAkumulasiOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tahfidz-modal-awal-list"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal akumulasi kenaikan kelas");
    },
  });

  const handleSubmitAkumulasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!akumulasiSantri) return;

    akumulasiMutation.mutate({
      siswa_id: akumulasiSantri.siswa_id,
      catatan_kenaikan: catatanKenaikan,
      tambah_juz_manual: tambahJuzManual ? Number(tambahJuzManual) : undefined,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ═══════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <BookMarked className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Modal Awal Hafalan Santri
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-medium">
                  Tahfidz
                </span>
              </h1>
              <p className="text-emerald-100/80 text-xs sm:text-sm mt-0.5">
                Pencatatan hafalan awal bawaan santri sebelum masuk, serta pemantauan perkembangan & akumulasi saat naik kelas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          STATISTICS SUMMARY CARDS
      ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Santri</span>
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{summary.total_santri}</div>
          <span className="text-[11px] text-slate-400 mt-1">Santri binaan</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-medium">Sudah Dicatat</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{summary.total_sudah_input}</div>
          <span className="text-[11px] text-emerald-600/70 mt-1">
            {summary.total_santri > 0
              ? `${Math.round((summary.total_sudah_input / summary.total_santri) * 100)}% santri`
              : "0%"}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-sm bg-gradient-to-br from-amber-50/40 to-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-medium">Belum Dicatat</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{summary.total_belum_input}</div>
          <span className="text-[11px] text-amber-600/70 mt-1">Perlu diinput</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200/80 shadow-sm bg-gradient-to-br from-blue-50/40 to-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-xs font-medium">Modal Awal</span>
            <BookMarked className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">{summary.total_modal_juz} <span className="text-sm font-semibold text-blue-400">Juz</span></div>
          <span className="text-[11px] text-blue-600/70 mt-1">Total bawaan santri</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200/80 shadow-sm bg-gradient-to-br from-purple-50/40 to-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-xs font-medium">Setoran Sistem</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600">+{summary.total_ziyadah_juz} <span className="text-sm font-semibold text-purple-400">Juz</span></div>
          <span className="text-[11px] text-purple-600/70 mt-1">Ziyadah berjalan</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-teal-200/80 shadow-sm bg-gradient-to-br from-teal-50/40 to-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-teal-700 mb-1">
            <span className="text-xs font-medium">Total Akumulasi</span>
            <Award className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-700">{summary.total_keseluruhan_juz} <span className="text-sm font-semibold text-teal-400">Juz</span></div>
          <span className="text-[11px] text-teal-600/70 mt-1">Modal + Ziyadah</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          FILTER & SEARCH BAR
      ═══════════════════════════════════════════════════════ */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === "all"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
              }`}
          >
            Semua ({summary.total_santri})
          </button>
          <button
            onClick={() => setStatusFilter("sudah")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === "sudah"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
              }`}
          >
            Sudah Dicatat ({summary.total_sudah_input})
          </button>
          <button
            onClick={() => setStatusFilter("belum")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === "belum"
                ? "bg-white text-amber-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
              }`}
          >
            Belum Dicatat ({summary.total_belum_input})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama santri / NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          TABLE DATA VIEW
      ═══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
            <p className="text-xs">Memuat data santri tahfidz...</p>
          </div>
        ) : santriList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <BookMarked className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Tidak ada santri ditemukan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tidak ada data yang cocok dengan kriteria filter atau pencarian saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Santri</th>
                  <th className="py-3 px-4">Kelas / Halaqah</th>
                  <th className="py-3 px-4">Modal Awal Bawaan</th>
                  <th className="py-3 px-4">Hafalan Berjalan (Sistem)</th>
                  <th className="py-3 px-4">Total & Progres</th>
                  <th className="py-3 px-4 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {santriList.map((santri, idx) => {
                  const modal = santri.modal_awal;
                  const hasModal = !!modal;
                  const hasRiwayat = Array.isArray(modal?.riwayat) && modal.riwayat.length > 0;
                  const progress = santri.progress || {
                    modal_juz: 0,
                    total_ayat_ziyadah: 0,
                    ziyadah_juz: 0,
                    total_hafalan_juz: 0,
                    total_setoran: 0,
                    last_setoran: null,
                  };

                  return (
                    <tr
                      key={santri.siswa_id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Santri */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-emerald-200">
                            {santri.foto ? (
                              <img
                                src={santri.foto}
                                alt={santri.nama || "Santri"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (santri.nama || "S").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 hover:text-emerald-700 transition-colors">
                              {santri.nama || "-"}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              NIS: {santri.nis || "-"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kelas / Halaqah */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                            {santri.kelas?.nama_kelas || "Tanpa Kelas"}
                          </div>
                          {santri.halaqah ? (
                            <div className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 inline-block font-medium">
                              Halaqah: {santri.halaqah.nama_halaqah}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              Belum masuk halaqah
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Modal Awal */}
                      <td className="py-3.5 px-4">
                        {hasModal ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                                📖 {modal.juz_awal} Juz
                              </span>
                              {modal.surah_awal && (
                                <span className="text-[11px] font-medium text-slate-700">
                                  QS. {modal.surah_awal}
                                  {modal.ayat_awal ? ` : ${modal.ayat_awal}` : ""}
                                </span>
                              )}
                            </div>

                            {modal.halaman_awal && (
                              <div className="text-[11px] text-slate-500">
                                Hal. {modal.halaman_awal} mushaf
                              </div>
                            )}

                            {modal.keterangan && (
                              <div className="text-[10.5px] text-slate-400 italic line-clamp-1 max-w-xs">
                                "{modal.keterangan}"
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>Tgl: {modal.tanggal_input || "-"}</span>
                              {hasRiwayat && (
                                <button
                                  onClick={() => handleOpenRiwayat(santri)}
                                  className="text-emerald-600 font-semibold hover:underline flex items-center gap-0.5"
                                >
                                  <History className="w-3 h-3" />
                                  Riwayat ({modal.riwayat?.length})
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertCircle className="w-3 h-3" /> Belum Diinput
                            </span>
                            <div className="text-[10.5px] text-slate-400">
                              Klik Catat Modal untuk mengisi
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Hafalan Berjalan (Setoran di Sistem) */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              +{progress.ziyadah_juz} Juz
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({progress.total_ayat_ziyadah} ayat)
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {progress.total_setoran}x setoran ziyadah
                          </div>
                          {progress.last_setoran && (
                            <div className="text-[10px] text-slate-400">
                              Terakhir: {progress.last_setoran.surat_selesai_nama || "Al-Quran"} ({progress.last_setoran.tanggal})
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Total & Progres */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black text-slate-800">
                              {progress.total_hafalan_juz} / 30 Juz
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              +{progress.ziyadah_juz} Juz
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                            {/* Modal Bar */}
                            <div
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((progress.modal_juz || 0) / 30) * 100
                                )}%`,
                              }}
                              className="bg-blue-500 h-full"
                              title={`Modal: ${progress.modal_juz} Juz`}
                            />
                            {/* Ziyadah Bar */}
                            <div
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((progress.ziyadah_juz || 0) / 30) * 100
                                )}%`,
                              }}
                              className="bg-purple-500 h-full"
                              title={`Ziyadah: ${progress.ziyadah_juz} Juz`}
                            />
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                              Modal {progress.modal_juz}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                              Berjalan +{progress.ziyadah_juz}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Catat / Edit */}
                          <button
                            onClick={() => handleOpenForm(santri)}
                            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors"
                            title={hasModal ? "Edit Modal Awal" : "Input Modal Awal"}
                          >
                            {hasModal ? (
                              <Edit2 className="w-3.5 h-3.5" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Tombol Akumulasi Kenaikan Kelas */}
                          <button
                            onClick={() => handleOpenAkumulasi(santri)}
                            className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors"
                            title="Akumulasikan ke Tingkat / Kelas Berikutnya"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Hapus (jika ada modal) */}
                          {hasModal && (
                            <button
                              onClick={() => handleDeleteModal(santri)}
                              disabled={deleteMutation.isPending}
                              className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors disabled:opacity-50"
                              title="Hapus Modal Awal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODAL 1: FORM INPUT / EDIT MODAL AWAL
      ═══════════════════════════════════════════════════════ */}
      {isFormOpen && selectedSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-emerald-300" />
                  {selectedSantri.modal_awal ? "Edit Modal Awal Hafalan" : "Input Modal Awal Hafalan"}
                </h3>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Santri: <span className="font-bold text-white">{selectedSantri.nama}</span> ({selectedSantri.kelas?.nama_kelas || "Tanpa Kelas"})
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto">
              {/* Info Hafalan Awal (Juz) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jumlah Juz Awal yang Sudah Mutqin / Dihafal <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={formJuzAwal}
                    onChange={(e) => setFormJuzAwal(Math.max(0, Math.min(30, Number(e.target.value))))}
                    className="w-24 px-3 py-2 text-sm font-bold text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                  <span className="text-sm font-semibold text-slate-600">Juz</span>
                </div>
                {/* Quick Juz Selectors */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[0, 1, 2, 3, 5, 10, 15, 20, 30].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormJuzAwal(num)}
                      className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${formJuzAwal === num
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                      {num === 0 ? "0 Juz (Baru)" : `${num} Juz`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rincian Surah & Ayat Terakhir (Opsional untuk detail) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  Rincian Detail Batas Hafalan Terakhir (Opsional)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Surah Terakhir
                    </label>
                    <select
                      value={formSurahNo}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : "";
                        setFormSurahNo(val);
                        setFormAyat("");
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="">-- Pilih Surah --</option>
                      {QURAN_SURAHS.map((s) => (
                        <option key={s.number} value={s.number}>
                          {s.number}. {s.name} ({s.totalVerses} ayat)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Ayat Terakhir
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={selectedSurahInfo?.totalVerses || 286}
                      value={formAyat}
                      onChange={(e) => setFormAyat(e.target.value ? Number(e.target.value) : "")}
                      placeholder={selectedSurahInfo ? `1 - ${selectedSurahInfo.totalVerses}` : "No. Ayat"}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Halaman Mushaf (1-604)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={604}
                    value={formHalaman}
                    onChange={(e) => setFormHalaman(e.target.value ? Number(e.target.value) : "")}
                    placeholder="Contoh: 45"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Tanggal Pencatatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Pencatatan
                </label>
                <input
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Keterangan / Latar Belakang */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Asal Sekolah / Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Misal: Hafalan bawaan dari MTs Maskumambang, juz 30 lancar, juz 1 baru separuh..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saveMutation.isPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Modal Awal"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL 2: AKUMULASI KENAIKAN KELAS
      ═══════════════════════════════════════════════════════ */}
      {isAkumulasiOpen && akumulasiSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-800 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-300" />
                  Akumulasi Kenaikan Kelas / Tingkat
                </h3>
                <p className="text-xs text-blue-100/80 mt-0.5">
                  Santri: <span className="font-bold text-white">{akumulasiSantri.nama}</span>
                </p>
              </div>
              <button
                onClick={() => setIsAkumulasiOpen(false)}
                className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAkumulasi} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-2">
                <p className="font-semibold flex items-center gap-1.5 text-blue-800">
                  <Award className="w-4 h-4 text-blue-600" />
                  Bagaimana akumulasi bekerja?
                </p>
                <p className="text-blue-800/80 leading-relaxed text-[11.5px]">
                  Saat santri naik ke jenjang kelas baru, modal awal sebelumnya (
                  <strong>{(akumulasiSantri.progress?.modal_juz ?? 0)} Juz</strong>) akan
                  digabungkan dengan capaian hafalan berjalan (
                  <strong>+{tambahJuzManual || 0} Juz</strong>) menjadi modal awal baru
                  sebesar{" "}
                  <strong>
                    {Math.round(
                      (akumulasiSantri.progress?.modal_juz ?? 0) +
                      (Number(tambahJuzManual) || 0)
                    )}{" "}
                    Juz
                  </strong>
                  . Riwayat kelas sebelumnya tetap tersimpan rapi.
                </p>
              </div>

              {/* Perhitungan Visual */}
              <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Modal Lama</div>
                  <div className="text-lg font-black text-slate-800">
                    {(akumulasiSantri.progress?.modal_juz ?? 0)} <span className="text-xs">Juz</span>
                  </div>
                </div>
                <div className="flex items-center justify-center text-slate-300 font-bold text-xl">
                  +
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Tambahan Berjalan</div>
                  <div className="text-lg font-black text-purple-600">
                    +{tambahJuzManual || 0} <span className="text-xs">Juz</span>
                  </div>
                </div>
              </div>

              {/* Form Input Tambahan Juz */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Penambahan Hafalan (Juz)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={30}
                  value={tambahJuzManual}
                  onChange={(e) => setTambahJuzManual(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Default otomatis dari total setoran berjalan ({(akumulasiSantri.progress?.ziyadah_juz ?? 0)} Juz), Anda dapat menyesuaikan jika dibulatkan.
                </span>
              </div>

              {/* Catatan Kenaikan Kelas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Kenaikan Kelas / Keterangan
                </label>
                <input
                  type="text"
                  value={catatanKenaikan}
                  onChange={(e) => setCatatanKenaikan(e.target.value)}
                  placeholder="Contoh: Kenaikan ke Kelas VIII-A Tahun 2026/2027"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAkumulasiOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={akumulasiMutation.isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {akumulasiMutation.isPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Akumulasikan Sekarang"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL 3: RIWAYAT AKUMULASI KENAIKAN KELAS
      ═══════════════════════════════════════════════════════ */}
      {isRiwayatOpen && riwayatSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-400" />
                  Riwayat Akumulasi Kenaikan
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Santri: <span className="font-bold text-white">{riwayatSantri.nama}</span>
                </p>
              </div>
              <button
                onClick={() => setIsRiwayatOpen(false)}
                className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {Array.isArray(riwayatSantri.modal_awal?.riwayat) &&
                riwayatSantri.modal_awal.riwayat.length > 0 ? (
                <div className="space-y-3">
                  {riwayatSantri.modal_awal.riwayat.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          {item.keterangan || "Akumulasi Kenaikan"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.tanggal || "-"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <span>Modal Awal: <strong>{item.juz_awal_sebelumnya} Juz</strong></span>
                        <span>→</span>
                        <span className="text-emerald-700 font-bold">
                          Modal Baru: {item.juz_awal_baru} Juz (+{item.ziyadah_diperoleh} Juz)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Kelas: {item.kelas || "-"} | Pencatat: {item.diinput_oleh || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada riwayat kenaikan kelas yang tercatat.
                </div>
              )}

              <div className="pt-2 text-right">
                <button
                  onClick={() => setIsRiwayatOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalAwalTahfidzIndex;
