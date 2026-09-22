// src/pages/Tahfidz/Target/TargetSantri.tsx
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Target,
  Plus,
  User,
  Trash2,
  Edit2,
  BookOpen,
  ScrollText,
  Bookmark,
  Search,
  BarChart3,
  Flame,
  Calendar,
  Sparkles,
  History,
} from "lucide-react";
import { tahfidzService, type TahfidzTargetItem } from "../../../lib/api/services/tahfidzService";

const formatSetoranDetail = (s: any) => {
  if (!s) return "Belum ada setoran";
  if (s.kategori === "Al-Quran") {
    const surat = s.surat_mulai_nama || (s.surat_mulai ? `Surat ${s.surat_mulai}` : "Al-Qur'an");
    const ayat = s.ayat_mulai && s.ayat_selesai && s.ayat_mulai !== s.ayat_selesai
      ? `Ayat ${s.ayat_mulai}-${s.ayat_selesai}`
      : s.ayat_mulai ? `Ayat ${s.ayat_mulai}` : "";
    return `QS. ${surat}${ayat ? ` : ${ayat}` : ""} (${s.total_ayat || 0} Ayat)`;
  }
  if (s.kategori === "Hadits") {
    const no = s.hadits_no_mulai && s.hadits_no_selesai && s.hadits_no_mulai !== s.hadits_no_selesai
      ? `No. ${s.hadits_no_mulai}-${s.hadits_no_selesai}`
      : s.hadits_no_mulai ? `No. ${s.hadits_no_mulai}` : "";
    return `${s.kitab_hadits || "Hadits"}${no ? ` (${no})` : ""}`;
  }
  if (s.kategori === "Matan Ilmu") {
    const bait = s.bait_mulai && s.bait_selesai && s.bait_mulai !== s.bait_selesai
      ? `Bait ${s.bait_mulai}-${s.bait_selesai}`
      : s.bait_mulai ? `Bait ${s.bait_mulai}` : "";
    return `${s.nama_matan || "Matan"}${bait ? ` (${bait})` : ""}`;
  }
  return `${s.kategori || "Setoran"}`;
};

const TargetSantriTahfidz: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedKelasId, setSelectedKelasId] = useState<string>("");
  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [chartCategory, setChartCategory] = useState<"all" | "Al-Quran" | "Hadits" | "Matan Ilmu">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTarget, setEditingTarget] = useState<TahfidzTargetItem | null>(null);

  // Form State
  const [formKategori, setFormKategori] = useState<"Al-Quran" | "Hadits" | "Matan Ilmu">("Al-Quran");
  const [formDeskripsi, setFormDeskripsi] = useState<string>("");
  const [formNominal, setFormNominal] = useState<string>("5");
  const [formSatuan, setFormSatuan] = useState<string>("Juz");
  const [formTanggalMulai, setFormTanggalMulai] = useState<string>(new Date().toISOString().split("T")[0]);
  const [formTanggalTarget, setFormTanggalTarget] = useState<string>("");
  const [formStatus, setFormStatus] = useState<"Aktif" | "Tercapai" | "Ditunda">("Aktif");

  // Fetch Santri Binaan
  const { data: santriList = [], isLoading: isLoadingSantri } = useQuery({
    queryKey: ["tahfidz-santri-target", selectedKelasId],
    queryFn: async () => {
      return await tahfidzService.getSantriTahfidz(
        selectedKelasId ? { kelas_id: Number(selectedKelasId) } : undefined
      );
    },
  });

  // Extract unique classes
  const uniqueKelasList = useMemo(() => {
    const map = new Map<number, string>();
    santriList.forEach((s: any) => {
      if (s.kelas?.kelas_id) {
        map.set(s.kelas.kelas_id, s.kelas.nama_kelas);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [santriList]);

  // Set default selected siswa
  React.useEffect(() => {
    if (santriList.length > 0 && selectedSiswaId === null) {
      setSelectedSiswaId(santriList[0].siswa_id);
    }
  }, [santriList, selectedSiswaId]);

  // Fetch Statistik & Progres Siswa Terpilih
  const { data: statistikData, isLoading: isLoadingStatistik } = useQuery({
    queryKey: ["tahfidz-statistik-siswa", selectedSiswaId],
    queryFn: async () => {
      if (!selectedSiswaId) return null;
      return await tahfidzService.getStatistikSiswa(selectedSiswaId);
    },
    enabled: !!selectedSiswaId,
  });

  // Mutations for Target CRUD
  const saveTargetMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSiswaId) throw new Error("Pilih santri terlebih dahulu.");
      const payload: Partial<TahfidzTargetItem> = {
        siswa_id: selectedSiswaId,
        kategori: formKategori,
        target_deskripsi: formDeskripsi.trim(),
        target_nominal: Number(formNominal),
        satuan: formSatuan,
        tanggal_mulai: formTanggalMulai,
        tanggal_target: formTanggalTarget || undefined,
        status: formStatus,
      };

      if (editingTarget) {
        return await tahfidzService.updateTarget(editingTarget.target_id, payload);
      } else {
        return await tahfidzService.createTarget(payload);
      }
    },
    onSuccess: () => {
      toast.success(editingTarget ? "Target hafalan berhasil diperbarui!" : "Target hafalan berhasil ditambahkan!");
      setIsModalOpen(false);
      setEditingTarget(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["tahfidz-statistik-siswa", selectedSiswaId] });
      queryClient.invalidateQueries({ queryKey: ["tahfidz-santri-target"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menyimpan target.");
    },
  });

  const deleteTargetMutation = useMutation({
    mutationFn: async (id: number) => {
      return await tahfidzService.deleteTarget(id);
    },
    onSuccess: () => {
      toast.success("Target berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["tahfidz-statistik-siswa", selectedSiswaId] });
      queryClient.invalidateQueries({ queryKey: ["tahfidz-santri-target"] });
    },
  });

  const resetForm = () => {
    setFormKategori("Al-Quran");
    setFormDeskripsi("");
    setFormNominal("5");
    setFormSatuan("Juz");
    setFormTanggalMulai(new Date().toISOString().split("T")[0]);
    setFormTanggalTarget("");
    setFormStatus("Aktif");
  };

  const openAddModal = () => {
    setEditingTarget(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (target: TahfidzTargetItem) => {
    setEditingTarget(target);
    setFormKategori(target.kategori);
    setFormDeskripsi(target.target_deskripsi);
    setFormNominal(String(target.target_nominal));
    setFormSatuan(target.kategori === "Al-Quran" ? "Juz" : target.satuan);
    setFormTanggalMulai(target.tanggal_mulai);
    setFormTanggalTarget(target.tanggal_target || "");
    setFormStatus(target.status);
    setIsModalOpen(true);
  };

  const filteredSantri = useMemo(() => {
    if (!searchQuery.trim()) return santriList;
    const q = searchQuery.toLowerCase();
    return santriList.filter((s: any) =>
      s.nama?.toLowerCase().includes(q) ||
      s.nisn?.toLowerCase().includes(q) ||
      s.nis?.toLowerCase().includes(q)
    );
  }, [santriList, searchQuery]);

  // Filtered timeline data for chart
  const filteredTimeline = useMemo(() => {
    const raw = statistikData?.timelineChart || [];
    return raw.map((item: any) => {
      let val = 0;
      if (chartCategory === "all") val = (item.quran_ayat || 0) + (item.hadits_count || 0) + (item.matan_bait || 0);
      else if (chartCategory === "Al-Quran") val = item.quran_ayat || 0;
      else if (chartCategory === "Hadits") val = item.hadits_count || 0;
      else if (chartCategory === "Matan Ilmu") val = item.matan_bait || 0;
      return {
        ...item,
        displayVal: val,
      };
    });
  }, [statistikData?.timelineChart, chartCategory]);

  const maxChartValue = useMemo(() => {
    if (filteredTimeline.length === 0) return 10;
    const max = Math.max(...filteredTimeline.map((t: any) => t.displayVal || 0));
    return Math.max(10, Math.ceil(max * 1.2));
  }, [filteredTimeline]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#1A365D] via-[#2B6CB0] to-[#1A365D] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-200 backdrop-blur-xs">
              <Target className="w-3.5 h-3.5" />
              <span>Target & Capaian Hafalan Santri</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Target Kustom & Visualisasi Grafik
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              Tentukan target capaian hafalan untuk setiap santri secara individual (Al-Qur'an dalam <strong>Juz</strong>, Hadits, & Matan). Pantau kemajuan progres grafik hafalan secara berkala.
            </p>
          </div>

          <button
            onClick={openAddModal}
            disabled={!selectedSiswaId}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#FACC15] hover:bg-yellow-300 text-[#1A365D] font-black rounded-2xl shadow-lg shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all text-sm shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Target Santri</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sisi Kiri: Daftar Santri (4 Col) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Daftar Santri Binaan
              </h2>
              <span className="text-xs font-bold text-slate-400 font-mono">
                {filteredSantri.length} Santri
              </span>
            </div>

            {/* Filter Kelas */}
            {uniqueKelasList.length > 0 && (
              <select
                value={selectedKelasId}
                onChange={(e) => setSelectedKelasId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold outline-none"
              >
                <option value="">Semua Kelas</option>
                {uniqueKelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama santri..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* List Santri */}
            <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
              {isLoadingSantri ? (
                <div className="text-center py-8 text-xs text-slate-400">Memuat data santri...</div>
              ) : filteredSantri.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">Santri tidak ditemukan.</div>
              ) : (
                filteredSantri.map((s: any) => {
                  const isSelected = s.siswa_id === selectedSiswaId;
                  const activeTargetCount = s.tahfidz_target?.length || 0;
                  const lastSetoran = s.tahfidz_setoran?.[0];
                  return (
                    <button
                      type="button"
                      key={s.siswa_id}
                      onClick={() => setSelectedSiswaId(s.siswa_id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? "bg-blue-50/90 border-blue-400 shadow-xs text-blue-950 ring-2 ring-blue-500/20"
                          : "bg-slate-50/50 border-slate-200/60 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="truncate pr-2">
                          <span className="font-bold text-xs block truncate">{s.nama}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {s.kelas?.nama_kelas || "-"} • NISN: {s.nisn || "-"}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            activeTargetCount > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200/80 text-slate-600"
                          }`}
                        >
                          {activeTargetCount} Target
                        </span>
                      </div>

                      {/* Info Hafalan Terakhir */}
                      <div className="flex items-center gap-1.5 text-[10px] bg-white/90 px-2.5 py-1.5 rounded-xl border border-slate-200/60 text-slate-600 truncate">
                        <span className="font-bold text-emerald-700 shrink-0">📖 Terakhir:</span>
                        <span className="truncate font-medium text-slate-700">
                          {formatSetoranDetail(lastSetoran)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sisi Kanan: Detail Target & Progres Grafik Siswa (8 Col) */}
        <div className="lg:col-span-8 space-y-5">
          {isLoadingStatistik ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-yellow-400 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Memuat grafik dan target santri...</p>
            </div>
          ) : !statistikData ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
              <p className="text-xs text-slate-400">Pilih santri di panel kiri untuk melihat target & grafik progres.</p>
            </div>
          ) : (
            <>
              {/* Profile Card & Quick Stats */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-lg">
                      {statistikData.siswa?.nama?.charAt(0) || "S"}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">{statistikData.siswa?.nama}</h2>
                      <p className="text-xs text-slate-400 font-mono">
                        Kelas: <strong>{statistikData.siswa?.kelas?.nama_kelas || "-"}</strong> • NISN: {statistikData.siswa?.nisn || "-"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={openAddModal}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold border border-blue-200 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Set Target Baru</span>
                  </button>
                </div>

                {/* Banner Informasi Hafalan Terakhir */}
                {(() => {
                  const lastSetoran = statistikData.recentSetoran?.[0] || statistikData.siswa?.tahfidz_setoran?.[0];
                  return (
                    <div className="p-4 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-blue-50/80 rounded-2xl border border-emerald-200/70 shadow-xs space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                            <Sparkles className="w-3 h-3" /> Hafalan Terakhir
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {lastSetoran ? lastSetoran.kategori : "Belum Ada Setoran"}
                          </span>
                        </div>
                        {lastSetoran && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(lastSetoran.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                            <span className="text-slate-300">•</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                              {lastSetoran.kelancaran || "Lancar"}
                            </span>
                          </div>
                        )}
                      </div>

                      {lastSetoran ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-emerald-100">
                          <div className="space-y-0.5">
                            <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                              <span>📖</span> {formatSetoranDetail(lastSetoran)}
                            </p>
                            {lastSetoran.catatan_guru && (
                              <p className="text-xs text-slate-500 italic">
                                "{lastSetoran.catatan_guru}"
                              </p>
                            )}
                          </div>
                          <div className="text-left sm:text-right shrink-0 bg-white/70 px-3 py-1.5 rounded-xl border border-emerald-100">
                            <span className="text-[11px] text-slate-600 font-medium block">
                              Penyimak: <strong>{lastSetoran.pegawai?.nama || "Guru Tahfidz"}</strong>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Jenis: <strong className="text-blue-700">{lastSetoran.jenis_hafalan || "Setoran Baru"}</strong>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          Santri ini belum memiliki riwayat setoran hafalan yang tercatat di sistem.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Counter Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-700 mb-1">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Al-Qur'an</span>
                    </div>
                    <span className="text-lg font-black text-emerald-950">
                      {statistikData.summary?.totalJuzQuranZiyadah ?? Number((((statistikData.summary?.totalAyatQuranZiyadah || 0) / 6236) * 30).toFixed(2))} <span className="text-xs font-bold text-emerald-700">Juz</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 block">
                      ({statistikData.summary?.totalAyatQuranZiyadah || 0} Ayat Disetorkan)
                    </span>
                  </div>

                  <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                      <ScrollText className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Hadits</span>
                    </div>
                    <span className="text-lg font-black text-blue-950">
                      {statistikData.summary?.totalHaditsZiyadah || 0}
                    </span>
                    <span className="text-[10px] text-blue-700 block">Hadits Disetorkan</span>
                  </div>

                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-700 mb-1">
                      <Bookmark className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Matan</span>
                    </div>
                    <span className="text-lg font-black text-amber-950">
                      {statistikData.summary?.totalBaitMatanZiyadah || 0}
                    </span>
                    <span className="text-[10px] text-amber-700 block">Bait Disetorkan</span>
                  </div>

                  <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-100">
                    <div className="flex items-center gap-2 text-purple-700 mb-1">
                      <Flame className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Sesi</span>
                    </div>
                    <span className="text-lg font-black text-purple-950">
                      {statistikData.summary?.totalSetoran || 0}
                    </span>
                    <span className="text-[10px] text-purple-700 block">
                      ({statistikData.summary?.totalSetoranBaru || 0} Ziyadah)
                    </span>
                  </div>
                </div>
              </div>

              {/* Daftar Target Aktif Santri */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  Target Hafalan Santri
                </h3>

                {statistikData.targets?.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <p className="text-xs text-slate-500 font-medium">Santri ini belum memiliki target hafalan.</p>
                    <button
                      onClick={openAddModal}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      + Pasang target hafalan sekarang
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {statistikData.targets.map((tgt: TahfidzTargetItem) => {
                      let achievedDisplay = "";
                      let percentage = 0;

                      if (tgt.kategori === "Al-Quran") {
                        const totalAyat = statistikData.summary?.totalAyatQuranZiyadah || 0;
                        const achievedJuz =
                          statistikData.summary?.totalJuzQuranZiyadah ??
                          Number(((totalAyat / 6236) * 30).toFixed(2));
                        const targetJuz = tgt.target_nominal || 1;
                        percentage = Math.min(
                          100,
                          Math.round((achievedJuz / targetJuz) * 100)
                        );
                        achievedDisplay = `${achievedJuz} Juz (${totalAyat} Ayat) / ${targetJuz} Juz`;
                      } else if (tgt.kategori === "Hadits") {
                        const achievedHadits = statistikData.summary?.totalHaditsZiyadah || 0;
                        const targetHadits = tgt.target_nominal || 1;
                        percentage = Math.min(
                          100,
                          Math.round((achievedHadits / targetHadits) * 100)
                        );
                        achievedDisplay = `${achievedHadits} / ${targetHadits} Hadits`;
                      } else {
                        const achievedBait = statistikData.summary?.totalBaitMatanZiyadah || 0;
                        const targetBait = tgt.target_nominal || 1;
                        percentage = Math.min(
                          100,
                          Math.round((achievedBait / targetBait) * 100)
                        );
                        achievedDisplay = `${achievedBait} / ${targetBait} Bait`;
                      }

                      return (
                        <div
                          key={tgt.target_id}
                          className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold">
                                  {tgt.kategori}
                                </span>
                                <h4 className="font-bold text-xs text-slate-900">{tgt.target_deskripsi}</h4>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                Mulai: {tgt.tanggal_mulai} {tgt.tanggal_target ? `• Target: ${tgt.tanggal_target}` : ""}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => openEditModal(tgt)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Edit Target"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Hapus target hafalan ini?")) {
                                    deleteTargetMutation.mutate(tgt.target_id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hapus Target"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-slate-600">
                                Tercapai: <strong>{achievedDisplay}</strong>
                              </span>
                              <span className="text-emerald-600">{percentage}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                  percentage >= 100
                                    ? "bg-emerald-500"
                                    : percentage >= 50
                                    ? "bg-blue-500"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Visualisasi Grafik Timeline Riwayat Setoran */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      Grafik Aktivitas & Tren Setoran Santri
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pantau volume hafalan santri yang disetorkan pada setiap tanggal
                    </p>
                  </div>

                  {/* Filter Kategori Grafik */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setChartCategory("all")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        chartCategory === "all" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartCategory("Al-Quran")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        chartCategory === "Al-Quran" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Al-Qur'an
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartCategory("Hadits")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        chartCategory === "Hadits" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Hadits
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartCategory("Matan Ilmu")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        chartCategory === "Matan Ilmu" ? "bg-amber-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Matan
                    </button>
                  </div>
                </div>

                {filteredTimeline.length === 0 ? (
                  <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                    <p className="text-xs text-slate-500 font-medium">Belum ada aktivitas setoran pada timeline grafik.</p>
                    <p className="text-[11px] text-slate-400">Setoran baru santri akan langsung muncul secara otomatis di grafik ini.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Visual Bar Chart per Tanggal */}
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-end gap-3 h-48 pt-8 px-2 overflow-x-auto pb-2 border-b border-slate-200">
                        {filteredTimeline.map((t: any, idx: number) => {
                          const val = t.displayVal || 0;
                          const heightPct = Math.min(100, Math.max(10, Math.round((val / maxChartValue) * 100)));
                          const dateObj = new Date(t.tanggal);
                          const formattedDate = dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

                          return (
                            <div
                              key={idx}
                              className="flex flex-col items-center gap-1 min-w-[52px] shrink-0 group relative cursor-pointer"
                            >
                              {/* Value Label above bar */}
                              <span className="text-[10px] font-black text-slate-700 bg-white px-1.5 py-0.5 rounded-md shadow-xs border border-slate-100 group-hover:scale-110 transition-transform">
                                {val}
                              </span>

                              {/* Tooltip Hover */}
                              <div className="absolute -top-16 bg-slate-900 text-white text-[11px] p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl border border-slate-700">
                                <p className="font-bold text-yellow-300">{formattedDate}</p>
                                <p className="text-[10px] text-slate-200">
                                  Al-Qur'an: {t.quran_ayat || 0} Ayat • Hadits: {t.hadits_count || 0} • Matan: {t.matan_bait || 0}
                                </p>
                              </div>

                              {/* The Bar */}
                              <div className="w-full flex items-end justify-center h-32">
                                <div
                                  style={{ height: `${heightPct}%` }}
                                  className={`w-7 rounded-t-xl transition-all shadow-xs group-hover:brightness-110 ${
                                    chartCategory === "Al-Quran"
                                      ? "bg-gradient-to-t from-emerald-600 to-teal-400"
                                      : chartCategory === "Hadits"
                                      ? "bg-gradient-to-t from-blue-600 to-indigo-400"
                                      : chartCategory === "Matan Ilmu"
                                      ? "bg-gradient-to-t from-amber-600 to-yellow-400"
                                      : "bg-gradient-to-t from-blue-600 via-indigo-500 to-emerald-400"
                                  }`}
                                />
                              </div>

                              {/* X Axis Label */}
                              <span className="text-[10px] font-semibold text-slate-600 mt-1 whitespace-nowrap">
                                {formattedDate}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap items-center justify-center gap-5 text-[11px] text-slate-600 pt-3">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-3 h-3 rounded-md bg-emerald-500" /> Al-Qur'an (Ayat)
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-3 h-3 rounded-md bg-blue-500" /> Hadits
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-3 h-3 rounded-md bg-amber-500" /> Matan Ilmu (Bait)
                        </span>
                      </div>
                    </div>

                    {/* Riwayat 10 Setoran Terakhir */}
                    {statistikData.recentSetoran && statistikData.recentSetoran.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-blue-600" />
                          Riwayat Setoran Terbaru Santri
                        </h4>

                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {statistikData.recentSetoran.map((s: any) => (
                            <div
                              key={s.setoran_id}
                              className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    s.kategori === "Al-Quran"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : s.kategori === "Hadits"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {s.kategori}
                                  </span>
                                  <span className="font-bold text-slate-800 truncate">
                                    {formatSetoranDetail(s)}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400">
                                  {new Date(s.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} • Disimak oleh: {s.pegawai?.nama || "Guru"}
                                </p>
                              </div>

                              <div className="text-right shrink-0 space-y-0.5">
                                <span className="inline-block px-2 py-0.5 bg-white border border-slate-200 text-emerald-700 font-bold rounded text-[10px]">
                                  {s.kelancaran || "Lancar"}
                                </span>
                                <span className="block text-[9px] text-slate-400">
                                  {s.jenis_hafalan || "Setoran Baru"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Tambah / Edit Target */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingTarget ? "Edit Target Hafalan" : "Target Hafalan Baru"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveTargetMutation.mutate();
              }}
              className="space-y-4"
            >
              {/* Kategori */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Hafalan</label>
                <select
                  value={formKategori}
                  onChange={(e) => {
                    const cat = e.target.value as any;
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
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="Al-Quran">Al-Qur'an (Parameter Target: Juz)</option>
                  <option value="Hadits">Hadits (Parameter Target: Hadits)</option>
                  <option value="Matan Ilmu">Matan Ilmu (Parameter Target: Bait)</option>
                </select>
              </div>

              {/* Deskripsi Target */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Target <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  placeholder={formKategori === "Al-Quran" ? "Contoh: Target 5 Juz (Juz 1 s/d 5) atau Target Juz 30" : "Deskripsi target hafalan"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Target Nominal & Satuan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah Target ({formSatuan}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formKategori === "Al-Quran" ? 30 : 10000}
                    value={formNominal}
                    onChange={(e) => setFormNominal(e.target.value)}
                    placeholder={formKategori === "Al-Quran" ? "Contoh: 5" : "Jumlah target"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {formKategori === "Al-Quran" && (
                    <p className="text-[10px] text-slate-400 mt-0.5">Rentang 1 s/d 30 Juz</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan Parameter</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{formSatuan}</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">Fixed</span>
                  </div>
                </div>
              </div>

              {/* Tanggal Mulai & Tanggal Target */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={formTanggalMulai}
                    onChange={(e) => setFormTanggalMulai(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Selesai (Opsional)</label>
                  <input
                    type="date"
                    value={formTanggalTarget}
                    onChange={(e) => setFormTanggalTarget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Target</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="Aktif">Aktif (Sedang Berjalan)</option>
                  <option value="Tercapai">Tercapai (Selesai)</option>
                  <option value="Ditunda">Ditunda</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveTargetMutation.isPending}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-900/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saveTargetMutation.isPending ? "Menyimpan..." : "Simpan Target"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetSantriTahfidz;
