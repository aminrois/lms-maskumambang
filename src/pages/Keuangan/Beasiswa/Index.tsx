import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  GraduationCap,
  Users,
  Search,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  Info,
  Lightbulb,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { toast } from "sonner";

const API_BASE = "/keuangan";

const formatRupiah = (val: number | string) => {
  const num = typeof val === "number" ? val : parseFloat(val as string) || 0;
  return "Rp " + num.toLocaleString("id-ID");
};

const UNIT_OPTIONS = [
  { key: "SEMUA", label: "Semua Unit", ids: [] },
  { key: "MI", label: "MI", ids: [1, 2] },
  { key: "MTs", label: "MTs", ids: [3, 4] },
  { key: "MA", label: "MA", ids: [5] },
  { key: "SMK", label: "SMK", ids: [6, 7] },
  { key: "ASRAMA_PA", label: "Asrama Putra", ids: [11] },
  { key: "ASRAMA_PI", label: "Asrama Putri", ids: [12] },
];

export default function BeasiswaIndex() {
  const queryClient = useQueryClient();

  // Active Tab: "program" (Program & Aturan) vs "penerima" (Santri Penerima)
  const [activeTab, setActiveTab] = useState<"program" | "penerima">("program");

  // Filters
  const [selectedUnit, setSelectedUnit] = useState<string>("SEMUA");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDiskonId, setFilterDiskonId] = useState<string>("");

  // Modal Program Diskon
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any | null>(null);
  const [namaDiskon, setNamaDiskon] = useState("");
  const [kodeDiskon, setKodeDiskon] = useState("");
  const [tipePotongan, setTipePotongan] = useState<"PERSEN" | "NOMINAL">("PERSEN");
  const [nilaiPotongan, setNilaiPotongan] = useState("");
  const [targetCakupan, setTargetCakupan] = useState<"GLOBAL_POS" | "SPECIFIC_SUB">("GLOBAL_POS");
  const [targetSubId, setTargetSubId] = useState<number | null>(null);
  const [keterangan, setKeterangan] = useState("");

  // Modal Tetapkan Santri
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSiswaId, setAssignSiswaId] = useState<number | null>(null);
  const [assignDiskonId, setAssignDiskonId] = useState<number | null>(null);
  const [assignCatatanSk, setAssignCatatanSk] = useState("");
  const [searchSiswaDropdownTerm, setSearchSiswaDropdownTerm] = useState("");

  // ─────────────────────────────────────────────────────────────
  // 1. DATA QUERIES
  // ─────────────────────────────────────────────────────────────

  // Fetch Program Diskon List
  const { data: diskonList = [], isLoading: isLoadingDiskon } = useQuery({
    queryKey: ["keuangan", "diskon-list"],
    queryFn: async () => {
      const res = await apiClient.get(`${API_BASE}/diskon`);
      return res.data?.data || [];
    },
  });

  // Fetch Siswa Diskon Mapping List
  const { data: siswaDiskonList = [], isLoading: isLoadingSiswaDiskon } = useQuery({
    queryKey: ["keuangan", "siswa-diskon-list"],
    queryFn: async () => {
      const res = await apiClient.get(`${API_BASE}/siswa-diskon`);
      return res.data?.data || [];
    },
  });

  // Fetch Master Data (for Sub-Komponen target selection)
  const { data: masterData } = useQuery({
    queryKey: ["keuangan", "master"],
    queryFn: async () => {
      const res = await apiClient.get(`${API_BASE}/master`);
      return res.data?.data || { pos: [] };
    },
  });

  // Fetch Siswa Dropdown for assignment
  const { data: siswaDropdown = [] } = useQuery({
    queryKey: ["siswa-dropdown-keuangan"],
    queryFn: async () => {
      const res = await apiClient.get(`/siswa`);
      return res.data?.data || res.data || [];
    },
  });

  // ─────────────────────────────────────────────────────────────
  // 2. DERIVED DATA & FILTERING
  // ─────────────────────────────────────────────────────────────

  const activeUnitConfig = UNIT_OPTIONS.find((u) => u.key === selectedUnit) || UNIT_OPTIONS[0];

  // Flatten sub components across all pos
  const allSubKomponenList = useMemo(() => {
    const pos = masterData?.pos || [];
    return pos.flatMap((p: any) =>
      (p.sub_komponen || []).map((sub: any) => ({
        ...sub,
        posNama: p.nama_pos,
      }))
    );
  }, [masterData]);

  // Filtered Siswa Diskon List
  const filteredSiswaDiskon = useMemo(() => {
    return siswaDiskonList.filter((item: any) => {
      // Unit Filter
      if (selectedUnit !== "SEMUA" && activeUnitConfig.ids.length > 0) {
        const studentLembagaId = item.siswa?.kelas?.lembaga_id;
        if (studentLembagaId && !activeUnitConfig.ids.includes(studentLembagaId)) {
          return false;
        }
      }
      // Program Filter
      if (filterDiskonId && item.diskon_id !== parseInt(filterDiskonId, 10)) {
        return false;
      }
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const namaMatch = item.siswa?.nama?.toLowerCase().includes(q);
        const nisMatch = item.siswa?.nis?.includes(q);
        const skMatch = item.catatan_sk?.toLowerCase().includes(q);
        if (!namaMatch && !nisMatch && !skMatch) return false;
      }
      return true;
    });
  }, [siswaDiskonList, selectedUnit, activeUnitConfig, filterDiskonId, searchTerm]);

  // Filtered Siswa Dropdown in Modal
  const filteredSiswaDropdown = useMemo(() => {
    if (!searchSiswaDropdownTerm.trim()) return siswaDropdown.slice(0, 30);
    const q = searchSiswaDropdownTerm.toLowerCase();
    return siswaDropdown
      .filter((s: any) => s.nama?.toLowerCase().includes(q) || s.nis?.includes(q))
      .slice(0, 30);
  }, [siswaDropdown, searchSiswaDropdownTerm]);

  // ─────────────────────────────────────────────────────────────
  // 3. MUTATIONS
  // ─────────────────────────────────────────────────────────────

  // Save Program Diskon (Create / Update)
  const saveProgramMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nama_diskon: namaDiskon,
        kode_diskon: kodeDiskon || namaDiskon.substring(0, 8).toUpperCase().replace(/\s/g, ""),
        tipe_potongan: tipePotongan,
        nilai_potongan: parseFloat(nilaiPotongan) || 0,
        target_cakupan: targetCakupan,
        target_sub_id: targetCakupan === "SPECIFIC_SUB" ? targetSubId : null,
        keterangan,
      };

      if (editingProgram) {
        const res = await apiClient.put(`${API_BASE}/diskon/${editingProgram.diskon_id}`, payload);
        return res.data;
      } else {
        const res = await apiClient.post(`${API_BASE}/diskon`, payload);
        return res.data;
      }
    },
    onSuccess: () => {
      toast.success(editingProgram ? "Program beasiswa diperbarui!" : "Program beasiswa baru berhasil dibuat!");
      setShowProgramModal(false);
      setEditingProgram(null);
      setNamaDiskon("");
      setKodeDiskon("");
      setNilaiPotongan("");
      setKeterangan("");
      queryClient.invalidateQueries({ queryKey: ["keuangan", "diskon-list"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menyimpan program beasiswa."),
  });

  // Delete Program Diskon
  const deleteProgramMutation = useMutation({
    mutationFn: async (diskon_id: number) => {
      const res = await apiClient.delete(`${API_BASE}/diskon/${diskon_id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Program beasiswa berhasil dinonaktifkan.");
      queryClient.invalidateQueries({ queryKey: ["keuangan", "diskon-list"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menonaktifkan program."),
  });

  // Assign Siswa Diskon
  const assignSiswaMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post(`${API_BASE}/siswa-diskon`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Santri berhasil ditetapkan sebagai penerima beasiswa!");
      setShowAssignModal(false);
      setAssignSiswaId(null);
      setAssignCatatanSk("");
      queryClient.invalidateQueries({ queryKey: ["keuangan", "siswa-diskon-list"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menetapkan santri."),
  });

  // Remove Siswa Diskon
  const removeSiswaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`${API_BASE}/siswa-diskon/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Penerima beasiswa berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["keuangan", "siswa-diskon-list"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menghapus santri penerima."),
  });

  // ─────────────────────────────────────────────────────────────
  // HELPER BADGES
  // ─────────────────────────────────────────────────────────────

  const renderBadgeType = (nama: string) => {
    const raw = (nama || "").toLowerCase();
    if (raw.includes("tahfidz") || raw.includes("beasiswa")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Beasiswa Prestasi
        </span>
      );
    }
    if (raw.includes("guru") || raw.includes("pegawai")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Anak Guru / Pegawai
        </span>
      );
    }
    if (raw.includes("alumni")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Alumni Pondok
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        Yatim / Dhuafa
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ═════════════════════════════════════════════════════════ */}
        {/* HEADER */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <span>Keuangan & SPP</span>
              <span>/</span>
              <span className="text-slate-600 font-semibold">Beasiswa & Keringanan</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#162E6E] to-[#1D4ED8] text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Manajemen Beasiswa & Keringanan
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur program beasiswa santri (Tahfidz, Anak Pegawai, Alumni, Dhuafa) dan tetapkan santri penerima.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2">
            {activeTab === "program" ? (
              <button
                onClick={() => {
                  setEditingProgram(null);
                  setNamaDiskon("");
                  setKodeDiskon("");
                  setTipePotongan("PERSEN");
                  setNilaiPotongan("");
                  setTargetCakupan("GLOBAL_POS");
                  setTargetSubId(null);
                  setKeterangan("");
                  setShowProgramModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah Program Beasiswa
              </button>
            ) : (
              <button
                onClick={() => {
                  setAssignSiswaId(null);
                  setAssignDiskonId(diskonList[0]?.diskon_id || null);
                  setAssignCatatanSk("");
                  setShowAssignModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tetapkan Santri Penerima
              </button>
            )}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* TABS NAVIGATION */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("program")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "program"
                  ? "bg-[#162E6E] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Award className="w-4 h-4" />
              Program & Aturan Beasiswa ({diskonList.length})
            </button>
            <button
              onClick={() => setActiveTab("penerima")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "penerima"
                  ? "bg-[#162E6E] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              Daftar Santri Penerima ({siswaDiskonList.length})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 pr-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Terintegrasi otomatis dengan mesin invoice tagihan</span>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* TAB 1: PROGRAM & ATURAN BEASISWA */}
        {/* ═════════════════════════════════════════════════════════ */}
        {activeTab === "program" && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Daftar Program Beasiswa & Aturan Potongan</h2>
                  <p className="text-xs text-slate-500">
                    Kategori potongan yang dapat ditetapkan kepada santri sesuai SK Yayasan.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Total {diskonList.length} program aktif
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Nama Program Beasiswa</th>
                      <th className="py-3 px-4">Kode</th>
                      <th className="py-3 px-4">Bentuk Potongan</th>
                      <th className="py-3 px-4">Cakupan Biaya</th>
                      <th className="py-3 px-4">Ketentuan / Persyaratan</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingDiskon ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Memuat program beasiswa...
                        </td>
                      </tr>
                    ) : diskonList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Belum ada program beasiswa yang terdaftar.
                        </td>
                      </tr>
                    ) : (
                      diskonList.map((d: any, idx: number) => {
                        const potStr =
                          d.tipe_potongan === "PERSEN"
                            ? `${d.nilai_potongan}%`
                            : formatRupiah(d.nilai_potongan);

                        return (
                          <tr key={d.diskon_id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{d.nama_diskon}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {d._count?.siswa_diskon || 0} santri terdaftar
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 text-[11px]">
                              {d.kode_diskon || "-"}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {potStr}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {d.target_cakupan === "SPECIFIC_SUB" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  Hanya: {d.target_sub?.nama_sub || "Komponen Spesifik"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  Seluruh Tagihan (Global)
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                              {d.keterangan || "-"}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Aktif
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingProgram(d);
                                    setNamaDiskon(d.nama_diskon);
                                    setKodeDiskon(d.kode_diskon || "");
                                    setTipePotongan(d.tipe_potongan);
                                    setNilaiPotongan(d.nilai_potongan.toString());
                                    setTargetCakupan(d.target_cakupan);
                                    setTargetSubId(d.target_sub_id);
                                    setKeterangan(d.keterangan || "");
                                    setShowProgramModal(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Edit Program"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Nonaktifkan program beasiswa "${d.nama_diskon}"?`)) {
                                      deleteProgramMutation.mutate(d.diskon_id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Nonaktifkan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Note box */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
              <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Ketentuan Penggabungan Beasiswa:</span>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Santri dapat menerima lebih dari satu keringanan jika memenuhi kriteria resmi yayasan (misal Beasiswa Tahfidz + Keringanan Yatim). Mesin tagihan akan otomatis memotong tagihan bulanan santri bersangkutan berdasarkan rincian biaya yang berlaku.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════ */}
        {/* TAB 2: DAFTAR SANTRI PENERIMA BEASISWA */}
        {/* ═════════════════════════════════════════════════════════ */}
        {activeTab === "penerima" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nama santri, NIS, atau SK..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-slate-50/50"
                  />
                </div>

                {/* Filter Program */}
                <select
                  value={filterDiskonId}
                  onChange={(e) => setFilterDiskonId(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white text-slate-700"
                >
                  <option value="">Semua Program Beasiswa</option>
                  {diskonList.map((d: any) => (
                    <option key={d.diskon_id} value={d.diskon_id}>
                      {d.nama_diskon}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit Lembaga Pill Switcher */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Unit:
                </span>
                {UNIT_OPTIONS.map((u) => {
                  const isActive = selectedUnit === u.key;
                  return (
                    <button
                      key={u.key}
                      onClick={() => setSelectedUnit(u.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-[#162E6E] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {u.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table Santri Penerima */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Nama Santri</th>
                      <th className="py-3 px-4">NIS</th>
                      <th className="py-3 px-4">Lembaga / Kelas</th>
                      <th className="py-3 px-4">Program Beasiswa</th>
                      <th className="py-3 px-4">Bentuk Keringanan</th>
                      <th className="py-3 px-4">Nomor SK / Catatan</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingSiswaDiskon ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Memuat data penerima beasiswa...
                        </td>
                      </tr>
                    ) : filteredSiswaDiskon.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Tidak ada santri penerima yang sesuai kriteria pencarian/filter.
                        </td>
                      </tr>
                    ) : (
                      filteredSiswaDiskon.map((sd: any, idx: number) => {
                        const potStr =
                          sd.diskon?.tipe_potongan === "PERSEN"
                            ? `${sd.diskon.nilai_potongan}%`
                            : formatRupiah(sd.diskon?.nilai_potongan || 0);

                        return (
                          <tr key={sd.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{sd.siswa?.nama || "Santri"}</div>
                              <div className="text-[11px] text-slate-400">
                                Asrama: {sd.siswa?.keterangan_asrama === "Ya" ? "Santri Mukim" : "Santri Laju"}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-slate-600 text-[11px]">
                              {sd.siswa?.nis || "-"}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                                {sd.siswa?.kelas?.nama_kelas || "Kelas -"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div>{renderBadgeType(sd.diskon?.nama_diskon || "")}</div>
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                {sd.diskon?.nama_diskon}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-emerald-800">{potStr}</span>{" "}
                              <span className="text-[10px] text-slate-400">
                                {sd.diskon?.target_cakupan === "SPECIFIC_SUB" ? "(Sub-Komponen)" : "(Total Tagihan)"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs">
                              {sd.catatan_sk ? (
                                <span className="inline-block text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                  {sd.catatan_sk}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus beasiswa santri ${sd.siswa?.nama}?`)) {
                                    removeSiswaMutation.mutate(sd.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Keringanan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="bg-slate-50/80 px-6 py-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  Menampilkan {filteredSiswaDiskon.length} santri penerima beasiswa
                </span>
                <span>Terintegrasi dengan Rekapitulasi Tagihan SPP Bulanan</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL 1: FORM TAMBAH / EDIT PROGRAM BEASISWA */}
      {/* ═════════════════════════════════════════════════════════ */}
      {showProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingProgram ? "Edit Program Beasiswa" : "Tambah Program Beasiswa Baru"}
                </h3>
                <p className="text-xs text-slate-500">Konfigurasi nilai potongan dan target alokasi biaya</p>
              </div>
              <button
                onClick={() => setShowProgramModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveProgramMutation.mutate();
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Program Beasiswa / Keringanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaDiskon}
                  onChange={(e) => setNamaDiskon(e.target.value)}
                  placeholder="Contoh: Beasiswa Tahfidz 30 Juz, Keringanan Yatim"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Program (Opsional)
                </label>
                <input
                  type="text"
                  value={kodeDiskon}
                  onChange={(e) => setKodeDiskon(e.target.value)}
                  placeholder="Contoh: TAHFIDZ30, DHUAFA"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bentuk Potongan</label>
                  <select
                    value={tipePotongan}
                    onChange={(e: any) => setTipePotongan(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white"
                  >
                    <option value="PERSEN">Persentase (%)</option>
                    <option value="NOMINAL">Nominal Flat (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nilai Potongan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={tipePotongan === "PERSEN" ? 100 : undefined}
                    value={nilaiPotongan}
                    onChange={(e) => setNilaiPotongan(e.target.value)}
                    placeholder={tipePotongan === "PERSEN" ? "100" : "300000"}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cakupan Potongan</label>
                <div className="flex items-center gap-4 text-xs mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="cakupan"
                      value="GLOBAL_POS"
                      checked={targetCakupan === "GLOBAL_POS"}
                      onChange={() => setTargetCakupan("GLOBAL_POS")}
                      className="text-[#162E6E] focus:ring-[#162E6E]"
                    />
                    <span>Seluruh Tagihan (Global)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="cakupan"
                      value="SPECIFIC_SUB"
                      checked={targetCakupan === "SPECIFIC_SUB"}
                      onChange={() => setTargetCakupan("SPECIFIC_SUB")}
                      className="text-[#162E6E] focus:ring-[#162E6E]"
                    />
                    <span>Komponen Tertentu Saja</span>
                  </label>
                </div>
              </div>

              {targetCakupan === "SPECIFIC_SUB" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Komponen Biaya yang Dipotong
                  </label>
                  <select
                    value={targetSubId || ""}
                    onChange={(e) => setTargetSubId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white"
                  >
                    <option value="">Pilih komponen biaya...</option>
                    {allSubKomponenList.map((sub: any) => (
                      <option key={sub.sub_id} value={sub.sub_id}>
                        {sub.nama_sub} (Pos: {sub.posNama}) - {formatRupiah(sub.nominal_default)}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Misal: Gratis SPP Madrasah 100%, tetapi uang makan/dapur tetap dibayar normal.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Ketentuan Syarat
                </label>
                <textarea
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Misal: Memiliki sertifikat mutqin 30 juz, SK aktif yayasan..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProgramModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveProgramMutation.isPending || !namaDiskon.trim() || !nilaiPotongan}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#162E6E] hover:bg-[#122456] disabled:opacity-50 rounded-lg shadow-xs transition-colors"
                >
                  {saveProgramMutation.isPending ? "Menyimpan..." : "Simpan Program"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL 2: FORM TETAPKAN SANTRI PENERIMA BEASISWA */}
      {/* ═════════════════════════════════════════════════════════ */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Tetapkan Santri Penerima Beasiswa</h3>
                <p className="text-xs text-slate-500">Pilih santri dan kaitkan dengan program beasiswa aktif</p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!assignSiswaId || !assignDiskonId) {
                  toast.error("Pilih santri dan program beasiswa");
                  return;
                }
                assignSiswaMutation.mutate({
                  siswa_id: assignSiswaId,
                  diskon_id: assignDiskonId,
                  catatan_sk: assignCatatanSk,
                });
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cari & Pilih Santri <span className="text-rose-500">*</span>
                </label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchSiswaDropdownTerm}
                    onChange={(e) => setSearchSiswaDropdownTerm(e.target.value)}
                    placeholder="Ketik nama atau NIS santri..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                  {filteredSiswaDropdown.length === 0 ? (
                    <div className="p-3 text-center text-slate-400">Santri tidak ditemukan</div>
                  ) : (
                    filteredSiswaDropdown.map((s: any) => {
                      const isSelected = assignSiswaId === s.siswa_id;
                      return (
                        <div
                          key={s.siswa_id}
                          onClick={() => setAssignSiswaId(s.siswa_id)}
                          className={`p-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected ? "bg-emerald-50 text-[#162E6E] font-semibold" : "hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <div>{s.nama}</div>
                            <div className="text-[10px] text-slate-400 font-mono">NIS: {s.nis}</div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#162E6E]" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Program Beasiswa / Keringanan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignDiskonId || ""}
                  onChange={(e) => setAssignDiskonId(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white"
                >
                  <option value="">Pilih program beasiswa...</option>
                  {diskonList.map((d: any) => (
                    <option key={d.diskon_id} value={d.diskon_id}>
                      {d.nama_diskon} (
                      {d.tipe_potongan === "PERSEN" ? `${d.nilai_potongan}%` : formatRupiah(d.nilai_potongan)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Surat Keputusan (SK) / Catatan Persetujuan
                </label>
                <input
                  type="text"
                  value={assignCatatanSk}
                  onChange={(e) => setAssignCatatanSk(e.target.value)}
                  placeholder="Contoh: SK Beasiswa Tahfidz No. 04/YMK/2026"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={assignSiswaMutation.isPending || !assignSiswaId || !assignDiskonId}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#162E6E] hover:bg-[#122456] disabled:opacity-50 rounded-lg shadow-xs transition-colors"
                >
                  {assignSiswaMutation.isPending ? "Menetapkan..." : "Simpan Penerima"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
