import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Building2,
  Plus,
  Trash2,
  Edit3,
  Coins,
  X,
  Info,
  Check,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { toast } from "sonner";

const API_BASE = "/keuangan";

const formatRupiah = (val: number | string) => {
  const num = typeof val === "number" ? val : parseFloat(val as string) || 0;
  return "Rp " + num.toLocaleString("id-ID");
};

// Unit Lembaga Filter Options matching Maskumambang
const UNIT_OPTIONS = [
  { key: "SEMUA", label: "Semua Unit", ids: [] },
  { key: "MI", label: "MI", ids: [1, 2] },
  { key: "MTs", label: "MTs", ids: [3, 4] },
  { key: "MA", label: "MA", ids: [5] },
  { key: "SMK", label: "SMK", ids: [6, 7] },
  { key: "ASRAMA_PA", label: "Asrama Putra", ids: [11] },
  { key: "ASRAMA_PI", label: "Asrama Putri", ids: [12] },
];

export default function MasterTarifIndex() {
  const queryClient = useQueryClient();

  // Unit filter
  const [selectedUnit, setSelectedUnit] = useState<string>("SEMUA");

  // Selected Pos for Sub-Komponen inspection
  const [selectedPosId, setSelectedPosId] = useState<number | null>(null);

  // Modal / Form States
  const [showAddPosModal, setShowAddPosModal] = useState(false);
  const [editingPos, setEditingPos] = useState<any | null>(null);
  const [posNama, setPosNama] = useState("");
  const [posTipe, setPosTipe] = useState("Bulanan");
  const [posDeskripsi, setPosDeskripsi] = useState("");
  const [posTargetLembagaIds, setPosTargetLembagaIds] = useState<number[]>([]);
  const [editingTargetLembagaIds, setEditingTargetLembagaIds] = useState<number[]>([]);
  const [posHasKuota, setPosHasKuota] = useState(false);
  const [editingHasKuota, setEditingHasKuota] = useState(false);

  // Kuota Edit Modal / State in Master Tarif
  const [editingTarifKuota, setEditingTarifKuota] = useState<any | null>(null);
  const [tarifKuotaNominal, setTarifKuotaNominal] = useState("");

  // Lembaga Selection for Tarif Preview & Copy
  const [tarifLembagaId, setTarifLembagaId] = useState<number | null>(null);
  const [showCopyTarifModal, setShowCopyTarifModal] = useState(false);
  const [copyTargetLembagaIds, setCopyTargetLembagaIds] = useState<number[]>([]);

  // Sub-Komponen Modal
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [subNama, setSubNama] = useState("");
  const [subNominal, setSubNominal] = useState("");
  const [subKodeAkun, setSubKodeAkun] = useState("Kas MTs");
  const [subUrutan, setSubUrutan] = useState("1");

  // ─────────────────────────────────────────────────────────────
  // 1. DATA QUERIES
  // ─────────────────────────────────────────────────────────────

  const { data: masterData, isLoading } = useQuery({
    queryKey: ["keuangan", "master"],
    queryFn: async () => {
      const res = await apiClient.get(`${API_BASE}/master`);
      return res.data?.data || { pos: [], rekening: [], lembaga: [] };
    },
  });

  const posList: any[] = masterData?.pos || [];
  const lembagaList: any[] = masterData?.lembaga || [];

  // ─────────────────────────────────────────────────────────────
  // 2. DERIVED DATA & FILTERING
  // ─────────────────────────────────────────────────────────────

  const activeUnitConfig = UNIT_OPTIONS.find((u) => u.key === selectedUnit) || UNIT_OPTIONS[0];

  // Filtered Pos based on selected unit
  const filteredPosList = useMemo(() => {
    if (selectedUnit === "SEMUA" || activeUnitConfig.ids.length === 0) {
      return posList;
    }
    return posList.filter((p) => {
      const targetIds: number[] = p.target_lembaga_ids || [];
      // Universal fees apply to all
      if (targetIds.length === 0 && !p.lembaga_id) return true;
      // If array matches
      if (targetIds.some((id: number) => activeUnitConfig.ids.includes(id))) return true;
      // Single fallback
      if (p.lembaga_id && activeUnitConfig.ids.includes(p.lembaga_id)) return true;
      return false;
    });
  }, [posList, selectedUnit, activeUnitConfig]);

  // Active selected Pos for Rincian Kas breakdown
  const activePos = useMemo(() => {
    if (selectedPosId) {
      const found = posList.find((p) => p.pos_id === selectedPosId);
      if (found) return found;
    }
    // Default to SPP Bulanan (pos_id: 2) or first item
    const spp = posList.find((p) => p.pos_id === 2 || p.nama_pos?.toLowerCase().includes("spp"));
    return spp || filteredPosList[0] || posList[0] || null;
  }, [posList, selectedPosId, filteredPosList]);

  // Total amount of active Pos
  const activePosTotal = useMemo(() => {
    if (!activePos) return 0;
    const subs = activePos.sub_komponen || [];
    if (subs.length > 0) {
      return subs.reduce((acc: number, curr: any) => acc + (parseFloat(curr.nominal_default) || 0), 0);
    }
    const tarifs = activePos.tarif || [];
    if (tarifs.length > 0) {
      return parseFloat(tarifs[0].nominal) || 0;
    }
    return 0;
  }, [activePos]);

  // ─────────────────────────────────────────────────────────────
  // 3. MUTATIONS
  // ─────────────────────────────────────────────────────────────

  // Add Pos
  const addPosMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post(`${API_BASE}/pos`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Jenis pembayaran baru berhasil ditambahkan!");
      setShowAddPosModal(false);
      setPosNama("");
      setPosDeskripsi("");
      setPosTipe("Bulanan");
      setPosTargetLembagaIds([]);
      queryClient.invalidateQueries({ queryKey: ["keuangan", "master"] });
      if (data?.data?.pos_id) setSelectedPosId(data.data.pos_id);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menambah pos."),
  });

  // Update Pos
  const updatePosMutation = useMutation({
    mutationFn: async ({ pos_id, payload }: any) => {
      const res = await apiClient.put(`${API_BASE}/pos/${pos_id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Jenis pembayaran berhasil diperbarui!");
      setEditingPos(null);
      queryClient.invalidateQueries({ queryKey: ["keuangan", "master"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal memperbarui pos."),
  });

  // Delete Pos
  const deletePosMutation = useMutation({
    mutationFn: async (pos_id: number) => {
      const res = await apiClient.delete(`${API_BASE}/pos/${pos_id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Jenis pembayaran berhasil dinonaktifkan.");
      queryClient.invalidateQueries({ queryKey: ["keuangan", "master"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menghapus pos."),
  });

  // Helper lookup tarif by demography & lembaga
  const findTarifForPos = (pos: any, opts: {
    kuota?: string;
    asrama?: string;
    kategori_santri?: string;
    jenis_kelamin?: string;
    lembaga_id?: number | null;
  }) => {
    if (!pos?.tarif || pos.tarif.length === 0) return null;
    if (opts.lembaga_id) {
      const matched = pos.tarif.find((t: any) =>
        t.lembaga_id === opts.lembaga_id &&
        (!opts.kuota || t.kuota === opts.kuota) &&
        (!opts.asrama || t.asrama === opts.asrama) &&
        (!opts.kategori_santri || t.kategori_santri === opts.kategori_santri) &&
        (!opts.jenis_kelamin || t.jenis_kelamin === opts.jenis_kelamin)
      );
      if (matched) return { tarif: matched, isCustom: true };
    }
    const defaultMatched = pos.tarif.find((t: any) =>
      !t.lembaga_id &&
      (!opts.kuota || t.kuota === opts.kuota) &&
      (!opts.asrama || t.asrama === opts.asrama) &&
      (!opts.kategori_santri || t.kategori_santri === opts.kategori_santri) &&
      (!opts.jenis_kelamin || t.jenis_kelamin === opts.jenis_kelamin)
    );
    if (defaultMatched) return { tarif: defaultMatched, isCustom: false };

    if (opts.kuota) {
      const kuotaMatched = pos.tarif.find((t: any) => t.kuota === opts.kuota);
      if (kuotaMatched) return { tarif: kuotaMatched, isCustom: false };
    }
    return null;
  };

  // Save / Update Tarif (Bertingkat / Asrama / Gender / Kuota / Lembaga)
  const saveTarifKuotaMutation = useMutation({
    mutationFn: async (payload: {
      tarif_id?: number;
      pos_id: number;
      lembaga_id?: number | null;
      nama_tarif: string;
      nominal: number;
      kuota?: string;
      asrama?: string;
      kategori_santri?: string;
      jenis_kelamin?: string;
    }) => {
      // POST /keuangan/tarif will upsert based on pos_id, lembaga_id, kuota, asrama, kategori_santri, jenis_kelamin
      const res = await apiClient.post(`${API_BASE}/tarif`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Tarif berhasil diperbarui!");
      setEditingTarifKuota(null);
      queryClient.invalidateQueries({ queryKey: ["keuangan", "master"] });
      queryClient.invalidateQueries({ queryKey: ["keuangan", "tagihan-list"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan tarif.");
    },
  });

  // Salin Tarif ke Lembaga Lain
  const copyTarifMutation = useMutation({
    mutationFn: async (payload: {
      pos_id: number;
      source_lembaga_id: number | null;
      target_lembaga_ids: number[];
    }) => {
      const res = await apiClient.post(`${API_BASE}/tarif/copy`, payload);
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success(res.message || "Tarif berhasil disalin ke lembaga terpilih!");
      setShowCopyTarifModal(false);
      setCopyTargetLembagaIds([]);
      queryClient.invalidateQueries({ queryKey: ["keuangan", "master"] });
      queryClient.invalidateQueries({ queryKey: ["keuangan", "tagihan-list"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyalin tarif.");
    },
  });

  // Add / Edit Sub-Komponen
  const saveSubMutation = useMutation({
    mutationFn: async () => {
      if (!activePos) throw new Error("Pilih jenis pembayaran terlebih dahulu");
      const payload = {
        nama_sub: subNama,
        nominal_default: parseFloat(subNominal) || 0,
        kode_akun: subKodeAkun,
        urutan: parseInt(subUrutan, 10) || 1,
      };

      if (editingSub) {
        const res = await apiClient.put(`${API_BASE}/sub/${editingSub.sub_id}`, payload);
        return res.data;
      } else {
        const res = await apiClient.post(`${API_BASE}/pos/${activePos.pos_id}/sub`, payload);
        return res.data;
      }
    },
    onSuccess: () => {
      toast.success(editingSub ? "Komponen biaya diperbarui!" : "Komponen biaya berhasil ditambahkan!");
      setShowSubModal(false);
      setEditingSub(null);
      setSubNama("");
      setSubNominal("");
      queryClient.invalidateQueries({ queryKey: ["keuangan", "master"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menyimpan komponen biaya."),
  });

  // Delete Sub-Komponen
  const deleteSubMutation = useMutation({
    mutationFn: async (sub_id: number) => {
      const res = await apiClient.delete(`${API_BASE}/sub/${sub_id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Komponen biaya berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["keuangan", "master"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menghapus komponen biaya."),
  });

  // Helper Badge Kas
  const renderKasBadge = (kodeAkun: string | null) => {
    const raw = (kodeAkun || "").toLowerCase();
    if (raw.includes("mts")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          Kas MTs
        </span>
      );
    }
    if (raw.includes("dapur") || raw.includes("makan")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Kas Dapur Asrama
        </span>
      );
    }
    if (raw.includes("asrama") || raw.includes("pondok") || raw.includes("listrik")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Kas Pondok
        </span>
      );
    }
    if (raw.includes("ma")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Kas MA
        </span>
      );
    }
    if (raw.includes("smk")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
          Kas SMK
        </span>
      );
    }
    if (raw.includes("mi")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
          Kas MI
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {kodeAkun || "Kas Yayasan"}
      </span>
    );
  };

  const getFrequencySuffix = (tipe: string) => {
    const t = (tipe || "").toLowerCase();
    if (t.includes("bulan")) return "/ bulan";
    if (t.includes("tahun")) return "/ tahun";
    if (t.includes("bebas") || t.includes("cicil")) return "/ paket cicilan";
    return "/ sekali bayar";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ═════════════════════════════════════════════════════════ */}
        {/* HEADER & TOP UNIT SWITCHER */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <span>Keuangan & SPP</span>
              <span>/</span>
              <span className="text-slate-600 font-semibold">Jenis Pembayaran & Tarif</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-[#162E6E] text-white flex items-center justify-center shadow-xs">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Jenis Pembayaran & Tarif Paket Biaya
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola biaya pokok madrasah & asrama, susun rincian sub-komponen, dan pantau alokasi kas internal.
                </p>
              </div>
            </div>
          </div>

          {/* Unit Lembaga Filter Switcher */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-xs flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 text-amber-600 text-xs font-bold">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Unit:</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {UNIT_OPTIONS.map((u) => {
                const isActive = selectedUnit === u.key;
                return (
                  <button
                    key={u.key}
                    onClick={() => setSelectedUnit(u.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${isActive
                      ? "bg-[#162E6E] text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                  >
                    {u.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>



        {/* ═════════════════════════════════════════════════════════ */}
        {/* BAGIAN 1: TABEL JENIS PEMBAYARAN (POS UTAMA) */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Daftar Jenis Pembayaran Utama</h2>
              <p className="text-xs text-slate-500">
                Pilih salah satu jenis biaya untuk meninjau dan mengelola struktur rincian sub-komponennya.
              </p>
            </div>

            <button
              onClick={() => {
                setPosNama("");
                setPosTipe("Bulanan");
                setPosDeskripsi("");
                if (selectedUnit !== "SEMUA" && activeUnitConfig.ids.length > 0) {
                  setPosTargetLembagaIds([...activeUnitConfig.ids]);
                } else {
                  setPosTargetLembagaIds([]);
                }
                setShowAddPosModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Jenis Biaya
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Jenis Biaya</th>
                  <th className="py-3 px-4">Tipe Pembayaran</th>
                  <th className="py-3 px-4">Unit Lembaga</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4 text-center">Rincian Komponen</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Memuat jenis pembayaran...
                    </td>
                  </tr>
                ) : filteredPosList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada jenis pembayaran untuk unit ini.
                    </td>
                  </tr>
                ) : (
                  filteredPosList.map((pos, idx) => {
                    const isSelected = activePos?.pos_id === pos.pos_id;
                    const subCount = pos.sub_komponen?.length || 0;

                    return (
                      <tr
                        key={pos.pos_id}
                        onClick={() => setSelectedPosId(pos.pos_id)}
                        className={`cursor-pointer transition-colors ${isSelected ? "bg-emerald-50/70 font-medium" : "hover:bg-slate-50/70"
                          }`}
                      >
                        <td className="py-3 px-4 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {pos.nama_pos}
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#162E6E] text-white">
                                Terpilih
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Kode: {pos.kode_pos}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                            {pos.tipe_pembayaran}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {(() => {
                            const targetIds: number[] = pos.target_lembaga_ids && pos.target_lembaga_ids.length > 0
                              ? pos.target_lembaga_ids
                              : (pos.lembaga_id ? [pos.lembaga_id] : []);

                            if (targetIds.length === 0) {
                              return (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                  Semua Unit (Universal)
                                </span>
                              );
                            }

                            if (targetIds.length === lembagaList.length && lembagaList.length > 0) {
                              return (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  Semua Unit ({targetIds.length})
                                </span>
                              );
                            }

                            return (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {targetIds.map((lid: number) => {
                                  const l = lembagaList.find((item: any) => item.lembaga_id === lid);
                                  return (
                                    <span
                                      key={lid}
                                      className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200"
                                    >
                                      {l?.singkatan || l?.nama_lembaga || `Unit ${lid}`}
                                    </span>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs">
                          {pos.deskripsi || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {subCount} Komponen
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Aktif
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingPos(pos);
                                const existingIds = pos.target_lembaga_ids && pos.target_lembaga_ids.length > 0
                                  ? [...pos.target_lembaga_ids]
                                  : (pos.lembaga_id ? [pos.lembaga_id] : []);
                                setEditingTargetLembagaIds(existingIds);
                                setEditingHasKuota(!!pos.has_kuota);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Jenis Biaya"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus jenis biaya "${pos.nama_pos}"?`)) {
                                  deletePosMutation.mutate(pos.pos_id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus"
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

          <div className="bg-slate-50/80 px-6 py-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Total {filteredPosList.length} jenis pembayaran terdaftar
            </span>
            <span>Klik baris tabel untuk meninjau rincian biaya di bawah</span>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* BAGIAN 2: STRUKTUR RINCIAN BIAYA & ALOKASI KAS (KOMPONEN) */}
        {/* ═════════════════════════════════════════════════════════ */}
        {activePos && (
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#162E6E]"></span>
                  <h2 className="text-base font-bold text-slate-900">
                    Struktur Rincian Biaya: {activePos.nama_pos}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pembagian kas internal per-komponen (Kas Madrasah MTs/MA, Dapur Asrama, Pondok, Sarpras).
                </p>
              </div>

              {/* Highlight Total Paket Card */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl px-5 py-3 flex items-center gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Total Tarif Paket
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-1">
                    <span>{formatRupiah(activePosTotal)}</span>
                    <span className="text-xs font-normal text-slate-500">
                      {getFrequencySuffix(activePos.tipe_pembayaran)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════ */}
            {/* TAMPILAN MATRIKS TARIF BERTINGKAT & DEMOGRAFI PER-LEMBAGA */}
            {/* ═════════════════════════════════════════════════════════ */}
            {/* UNIT SELECTOR FOR TARIF & SALIN BUTTON */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <Building2 className="w-4 h-4 text-[#162E6E]" />
                <span className="text-xs font-bold text-slate-700">Unit Lembaga untuk Tarif:</span>
                <select
                  value={tarifLembagaId || ""}
                  onChange={(e) => setTarifLembagaId(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#162E6E]"
                >
                  <option value="">Default Yayasan (Universal)</option>
                  {lembagaList.map((l: any) => (
                    <option key={l.lembaga_id} value={l.lembaga_id}>
                      {l.nama_lembaga} ({l.singkatan || `ID: ${l.lembaga_id}`})
                    </option>
                  ))}
                </select>
                {tarifLembagaId ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Mode Unit: {lembagaList.find((l: any) => l.lembaga_id === tarifLembagaId)?.singkatan || `Unit ${tarifLembagaId}`}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Mode Universal Yayasan
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setCopyTargetLembagaIds([]);
                  setShowCopyTarifModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#162E6E] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs shrink-0"
              >
                <span>📋</span>
                Salin Tarif {tarifLembagaId ? (lembagaList.find((l: any) => l.lembaga_id === tarifLembagaId)?.singkatan || "Unit Ini") : "Default"} ke Unit Lain
              </button>
            </div>

            {(() => {
              const isPangkal = activePos.has_kuota || activePos.kode_pos === "PANGKAL" || activePos.nama_pos?.toLowerCase().includes("pangkal");
              const isSpp = activePos.kode_pos === "SPP" || activePos.nama_pos?.toLowerCase().includes("spp");
              const isSeragam = activePos.kode_pos === "SERAGAM" || activePos.nama_pos?.toLowerCase().includes("seragam");
              const isKegiatan = activePos.kode_pos === "KEGIATAN" || activePos.nama_pos?.toLowerCase().includes("kegiatan");
              const isUjian = activePos.kode_pos === "UJIAN" || activePos.nama_pos?.toLowerCase().includes("ujian");
              const activeLembagaObj = lembagaList.find((l: any) => l.lembaga_id === tarifLembagaId);

              if (isPangkal) {
                return (
                  <div className="bg-amber-50/50 border border-amber-200/90 rounded-2xl p-5 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-200/70 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                          <span>🏷️</span> Matriks 12 Tarif Uang Pangkal Bertingkat {activeLembagaObj ? `(${activeLembagaObj.singkatan})` : "(Default Yayasan)"}
                        </h3>
                        <p className="text-xs text-amber-800/80 mt-0.5">
                          Tabel matriks tagihan tetap 1 kolom Uang Pangkal, nominal otomatis menyesuaikan Asrama/Non-Asrama, Unit Lembaga & Jalur Umum/Alumni.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 shrink-0">
                        12 Kombinasi Tarif
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* GRUP 1: SANTRI ASRAMA (MUKIM) */}
                      <div className="bg-white border border-indigo-200 rounded-xl p-4 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                          <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                            A. Santri Asrama (Mukim)
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            Mukim Pondok
                          </span>
                        </div>

                        {/* Sub-Jalur: Umum */}
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            1. Jalur Umum
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {["Kuota 1", "Kuota 2", "Kuota 3"].map((k) => {
                              const res = findTarifForPos(activePos, {
                                kuota: k,
                                asrama: "Asrama",
                                kategori_santri: "Umum",
                                lembaga_id: tarifLembagaId,
                              });
                              const defNom = k === "Kuota 1" ? 8400000 : k === "Kuota 2" ? 9700000 : 11000000;
                              const nom = res?.tarif ? res.tarif.nominal : defNom;
                              const isCustom = res?.isCustom || false;

                              return (
                                <div key={k} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 relative group">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] font-bold text-slate-800">{k}</span>
                                      {tarifLembagaId && (
                                        <span className={`text-[8px] font-semibold px-1 py-0.5 rounded ${isCustom ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                                          {isCustom ? "Khusus" : "Default"}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => {
                                        setEditingTarifKuota({
                                          tarif_id: isCustom ? res?.tarif?.tarif_id : undefined,
                                          pos_id: activePos.pos_id,
                                          lembaga_id: tarifLembagaId,
                                          nama_tarif: res?.tarif?.nama_tarif || `Uang Pangkal ${k} (Asrama - Umum)`,
                                          kuota: k,
                                          asrama: "Asrama",
                                          kategori_santri: "Umum",
                                          nominal: nom,
                                        });
                                        setTarifKuotaNominal(nom.toString());
                                      }}
                                      className="p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200"
                                      title="Edit Tarif"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="text-xs font-extrabold text-[#162E6E] mt-1">
                                    {formatRupiah(nom)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Sub-Jalur: Alumni / Anak Guru */}
                        <div className="space-y-2 pt-1">
                          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
                            <span>2. Jalur Alumni YKUI / Anak Guru</span>
                            <span className="text-[9px] font-normal lowercase">(diskon khusus)</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {["Kuota 1", "Kuota 2", "Kuota 3"].map((k) => {
                              const res = findTarifForPos(activePos, {
                                kuota: k,
                                asrama: "Asrama",
                                kategori_santri: "Alumni / Anak Guru",
                                lembaga_id: tarifLembagaId,
                              });
                              const defNom = k === "Kuota 1" ? 6900000 : k === "Kuota 2" ? 8200000 : 9500000;
                              const nom = res?.tarif ? res.tarif.nominal : defNom;
                              const isCustom = res?.isCustom || false;

                              return (
                                <div key={k} className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/60 relative group">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] font-bold text-amber-900">{k}</span>
                                      {tarifLembagaId && (
                                        <span className={`text-[8px] font-semibold px-1 py-0.5 rounded ${isCustom ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                                          {isCustom ? "Khusus" : "Default"}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => {
                                        setEditingTarifKuota({
                                          tarif_id: isCustom ? res?.tarif?.tarif_id : undefined,
                                          pos_id: activePos.pos_id,
                                          lembaga_id: tarifLembagaId,
                                          nama_tarif: res?.tarif?.nama_tarif || `Uang Pangkal ${k} (Asrama - Alumni/Anak Guru)`,
                                          kuota: k,
                                          asrama: "Asrama",
                                          kategori_santri: "Alumni / Anak Guru",
                                          nominal: nom,
                                        });
                                        setTarifKuotaNominal(nom.toString());
                                      }}
                                      className="p-0.5 rounded text-amber-600 hover:text-amber-900 hover:bg-amber-100"
                                      title="Edit Tarif"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="text-xs font-extrabold text-[#162E6E] mt-1">
                                    {formatRupiah(nom)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* GRUP 2: SANTRI NON-ASRAMA (LAJU) */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                            B. Santri Non-Asrama (Laju)
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            Santri Laju
                          </span>
                        </div>

                        {/* Sub-Jalur: Umum */}
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            1. Jalur Umum
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {["Kuota 1", "Kuota 2", "Kuota 3"].map((k) => {
                              const res = findTarifForPos(activePos, {
                                kuota: k,
                                asrama: "Non-Asrama",
                                kategori_santri: "Umum",
                                lembaga_id: tarifLembagaId,
                              });
                              const defNom = k === "Kuota 1" ? 3900000 : k === "Kuota 2" ? 5200000 : 6500000;
                              const nom = res?.tarif ? res.tarif.nominal : defNom;
                              const isCustom = res?.isCustom || false;

                              return (
                                <div key={k} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 relative group">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] font-bold text-slate-800">{k}</span>
                                      {tarifLembagaId && (
                                        <span className={`text-[8px] font-semibold px-1 py-0.5 rounded ${isCustom ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                                          {isCustom ? "Khusus" : "Default"}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => {
                                        setEditingTarifKuota({
                                          tarif_id: isCustom ? res?.tarif?.tarif_id : undefined,
                                          pos_id: activePos.pos_id,
                                          lembaga_id: tarifLembagaId,
                                          nama_tarif: res?.tarif?.nama_tarif || `Uang Pangkal ${k} (Non-Asrama - Umum)`,
                                          kuota: k,
                                          asrama: "Non-Asrama",
                                          kategori_santri: "Umum",
                                          nominal: nom,
                                        });
                                        setTarifKuotaNominal(nom.toString());
                                      }}
                                      className="p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200"
                                      title="Edit Tarif"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="text-xs font-extrabold text-[#162E6E] mt-1">
                                    {formatRupiah(nom)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Sub-Jalur: Alumni / Anak Guru */}
                        <div className="space-y-2 pt-1">
                          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
                            <span>2. Jalur Alumni YKUI / Anak Guru</span>
                            <span className="text-[9px] font-normal lowercase">(diskon khusus)</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {["Kuota 1", "Kuota 2", "Kuota 3"].map((k) => {
                              const res = findTarifForPos(activePos, {
                                kuota: k,
                                asrama: "Non-Asrama",
                                kategori_santri: "Alumni / Anak Guru",
                                lembaga_id: tarifLembagaId,
                              });
                              const defNom = k === "Kuota 1" ? 3300000 : k === "Kuota 2" ? 4400000 : 5500000;
                              const nom = res?.tarif ? res.tarif.nominal : defNom;
                              const isCustom = res?.isCustom || false;

                              return (
                                <div key={k} className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/60 relative group">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] font-bold text-amber-900">{k}</span>
                                      {tarifLembagaId && (
                                        <span className={`text-[8px] font-semibold px-1 py-0.5 rounded ${isCustom ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                                          {isCustom ? "Khusus" : "Default"}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => {
                                        setEditingTarifKuota({
                                          tarif_id: isCustom ? res?.tarif?.tarif_id : undefined,
                                          pos_id: activePos.pos_id,
                                          lembaga_id: tarifLembagaId,
                                          nama_tarif: res?.tarif?.nama_tarif || `Uang Pangkal ${k} (Non-Asrama - Alumni/Anak Guru)`,
                                          kuota: k,
                                          asrama: "Non-Asrama",
                                          kategori_santri: "Alumni / Anak Guru",
                                          nominal: nom,
                                        });
                                        setTarifKuotaNominal(nom.toString());
                                      }}
                                      className="p-0.5 rounded text-amber-600 hover:text-amber-900 hover:bg-amber-100"
                                      title="Edit Tarif"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="text-xs font-extrabold text-[#162E6E] mt-1">
                                    {formatRupiah(nom)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (isSpp) {
                return (
                  <div className="bg-blue-50/50 border border-blue-200/90 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
                          <span>🏢</span> Tarif SPP Berdasarkan Hunian {activeLembagaObj ? `(${activeLembagaObj.singkatan})` : "(Default Yayasan)"}
                        </h3>
                        <p className="text-xs text-blue-800/80 mt-0.5">
                          Sistem otomatis menerapkan tarif ke santri saat generate tagihan berdasarkan lembaga dan data hunian santri.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {["Asrama", "Non-Asrama"].map((asr) => {
                        const res = findTarifForPos(activePos, {
                          asrama: asr,
                          lembaga_id: tarifLembagaId,
                        });
                        const defNom = asr === "Asrama" ? 1900000 : 475000;
                        const nom = res?.tarif ? res.tarif.nominal : defNom;
                        const isCustom = res?.isCustom || false;

                        return (
                          <div key={asr} className="bg-white border border-blue-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${asr === "Asrama" ? "bg-indigo-100 text-indigo-900" : "bg-slate-100 text-slate-800"}`}>
                                  {asr === "Asrama" ? "Santri Asrama (Mukim)" : "Santri Non-Asrama (Laju)"}
                                </span>
                                {tarifLembagaId && (
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isCustom ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-600"}`}>
                                    {isCustom ? `Khusus ${activeLembagaObj?.singkatan}` : "Default Yayasan"}
                                  </span>
                                )}
                              </div>
                              <div className="text-lg font-extrabold text-[#162E6E] mt-1.5">
                                {formatRupiah(nom)} <span className="text-xs font-normal text-slate-500">/ bulan</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setEditingTarifKuota({
                                  tarif_id: isCustom ? res?.tarif?.tarif_id : undefined,
                                  pos_id: activePos.pos_id,
                                  lembaga_id: tarifLembagaId,
                                  nama_tarif: res?.tarif?.nama_tarif || `SPP ${asr} ${activeLembagaObj?.singkatan || ""}`.trim(),
                                  asrama: asr,
                                  nominal: nom,
                                });
                                setTarifKuotaNominal(nom.toString());
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                              title="Ubah Tarif SPP"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (isSeragam) {
                return (
                  <div className="bg-purple-50/50 border border-purple-200/90 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
                          <span>👔</span> Tarif Seragam Berdasarkan Jenis Kelamin {activeLembagaObj ? `(${activeLembagaObj.singkatan})` : "(Default Yayasan)"}
                        </h3>
                        <p className="text-xs text-purple-800/80 mt-0.5">
                          Tabel matriks tagihan tetap 1 kolom Seragam, nominal otomatis menyesuaikan unit lembaga dan jenis kelamin santri.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { jk: "L", label: "Seragam Putra", defNom: 1100000, color: "bg-sky-100 text-sky-900 border-sky-200" },
                        { jk: "P", label: "Seragam Putri", defNom: 1600000, color: "bg-pink-100 text-pink-900 border-pink-200" },
                      ].map((item) => {
                        const res = findTarifForPos(activePos, {
                          jenis_kelamin: item.jk,
                          lembaga_id: tarifLembagaId,
                        });
                        const nom = res?.tarif ? res.tarif.nominal : item.defNom;
                        const isCustom = res?.isCustom || false;

                        return (
                          <div key={item.jk} className="bg-white border border-purple-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${item.color}`}>
                                  {item.label} ({item.jk})
                                </span>
                                {tarifLembagaId && (
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isCustom ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-600"}`}>
                                    {isCustom ? `Khusus ${activeLembagaObj?.singkatan}` : "Default Yayasan"}
                                  </span>
                                )}
                              </div>
                              <div className="text-lg font-extrabold text-[#162E6E] mt-1.5">
                                {formatRupiah(nom)}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setEditingTarifKuota({
                                  tarif_id: isCustom ? res?.tarif?.tarif_id : undefined,
                                  pos_id: activePos.pos_id,
                                  lembaga_id: tarifLembagaId,
                                  nama_tarif: res?.tarif?.nama_tarif || `${item.label} ${activeLembagaObj?.singkatan || ""}`.trim(),
                                  jenis_kelamin: item.jk,
                                  nominal: nom,
                                });
                                setTarifKuotaNominal(nom.toString());
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                              title="Ubah Tarif Seragam"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (isKegiatan || isUjian || (!isPangkal && !isSpp && !isSeragam)) {
                const res = findTarifForPos(activePos, {
                  lembaga_id: tarifLembagaId,
                });
                const defNom = isKegiatan ? 2250000 : (isUjian ? 500000 : 0);
                const nom = res?.tarif ? res.tarif.nominal : defNom;
                const isCustom = res?.isCustom || false;

                return (
                  <div className="bg-emerald-50/50 border border-emerald-200/90 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                          <span>📋</span> Tarif {activePos.nama_pos} {activeLembagaObj ? `(${activeLembagaObj.singkatan})` : "(Default Yayasan)"}
                        </h3>
                        <p className="text-xs text-emerald-800/80 mt-0.5">
                          Atur tarif khusus untuk tiap unit lembaga atau gunakan tarif universal yayasan.
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCustom ? "bg-emerald-200 text-emerald-900 border border-emerald-300" : "bg-slate-200 text-slate-700"}`}>
                        {isCustom ? `Khusus Unit: ${activeLembagaObj?.singkatan}` : "Default Yayasan"}
                      </span>
                    </div>

                    <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-700">
                          Tarif Berlaku {activeLembagaObj ? `(${activeLembagaObj.nama_lembaga})` : "(Default Yayasan)"}
                        </span>
                        <div className="text-xl font-extrabold text-[#162E6E] mt-1">
                          {formatRupiah(nom)}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingTarifKuota({
                            tarif_id: isCustom ? res?.tarif?.tarif_id : undefined,
                            pos_id: activePos.pos_id,
                            lembaga_id: tarifLembagaId,
                            nama_tarif: res?.tarif?.nama_tarif || `${activePos.nama_pos} ${activeLembagaObj?.singkatan || ""}`.trim(),
                            nominal: nom,
                          });
                          setTarifKuotaNominal(nom.toString());
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Ubah Tarif {activeLembagaObj?.singkatan || ""}</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return null;
            })()}

            {/* Sub-Komponen Table */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Urutan</th>
                    <th className="py-3 px-4">Komponen Biaya</th>
                    <th className="py-3 px-4">Nominal Biaya (Rp)</th>
                    <th className="py-3 px-4">Alokasi Kas Internal</th>
                    <th className="py-3 px-4 text-center">Porsi (%)</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!activePos.sub_komponen || activePos.sub_komponen.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada rincian komponen biaya pada paket ini. Klik tombol di bawah untuk menambahkan.
                      </td>
                    </tr>
                  ) : (
                    activePos.sub_komponen.map((sub: any, idx: number) => {
                      const porsi = activePosTotal > 0
                        ? Math.round((sub.nominal_default / activePosTotal) * 100)
                        : 0;

                      return (
                        <tr key={sub.sub_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-400 font-mono font-medium">
                            {sub.urutan || idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {sub.nama_sub}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                            {formatRupiah(sub.nominal_default)}
                          </td>
                          <td className="py-3 px-4">
                            {renderKasBadge(sub.kode_akun)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                              {porsi}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingSub(sub);
                                  setSubNama(sub.nama_sub);
                                  setSubNominal(sub.nominal_default.toString());
                                  setSubKodeAkun(sub.kode_akun || "Kas MTs");
                                  setSubUrutan(sub.urutan?.toString() || "1");
                                  setShowSubModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit Komponen"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus komponen "${sub.nama_sub}"?`)) {
                                    deleteSubMutation.mutate(sub.sub_id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Summary Total Row */}
                  {activePos.sub_komponen && activePos.sub_komponen.length > 0 && (
                    <tr className="bg-slate-50/90 font-bold text-slate-900 border-t border-slate-200">
                      <td colSpan={2} className="py-3 px-4 text-right font-bold text-slate-700">
                        Total Paket Keseluruhan:
                      </td>
                      <td className="py-3 px-4 text-base font-extrabold text-[#162E6E]">
                        {formatRupiah(activePosTotal)}
                      </td>
                      <td colSpan={3} className="py-3 px-4 text-slate-500 font-normal text-xs">
                        {getFrequencySuffix(activePos.tipe_pembayaran)} — 100% dialokasikan ke kas internal
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Sub-Komponen Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Komponen ini otomatis dipakai saat sistem men-generate Surat Tagihan (Invoice) santri.
              </span>
              <button
                onClick={() => {
                  setEditingSub(null);
                  setSubNama("");
                  setSubNominal("");
                  setSubKodeAkun("Kas MTs");
                  setSubUrutan((activePos.sub_komponen?.length ? activePos.sub_komponen.length + 1 : 1).toString());
                  setShowSubModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah Komponen Biaya
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL: TAMBAH / EDIT POS UTAMA */}
      {/* ═════════════════════════════════════════════════════════ */}
      {(showAddPosModal || editingPos) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingPos ? "Edit Jenis Pembayaran" : "Tambah Jenis Pembayaran Baru"}
                </h3>
                <p className="text-xs text-slate-500">Pos induk penerimaan dana pesantren</p>
              </div>
              <button
                onClick={() => {
                  setShowAddPosModal(false);
                  setEditingPos(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingPos) {
                  updatePosMutation.mutate({
                    pos_id: editingPos.pos_id,
                    payload: {
                      nama_pos: editingPos.nama_pos,
                      tipe_pembayaran: editingPos.tipe_pembayaran,
                      deskripsi: editingPos.deskripsi,
                      target_lembaga_ids: editingTargetLembagaIds,
                      lembaga_id: editingTargetLembagaIds.length > 0 ? editingTargetLembagaIds[0] : null,
                      has_kuota: editingHasKuota,
                    },
                  });
                } else {
                  addPosMutation.mutate({
                    nama_pos: posNama,
                    tipe_pembayaran: posTipe,
                    deskripsi: posDeskripsi,
                    target_lembaga_ids: posTargetLembagaIds,
                    lembaga_id: posTargetLembagaIds.length > 0 ? posTargetLembagaIds[0] : null,
                    has_kuota: posHasKuota,
                  });
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Jenis Biaya <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingPos ? editingPos.nama_pos : posNama}
                  onChange={(e) =>
                    editingPos
                      ? setEditingPos({ ...editingPos, nama_pos: e.target.value })
                      : setPosNama(e.target.value)
                  }
                  placeholder="Contoh: SPP Bulanan, Uang Gedung/Pangkal, Daftar Ulang"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipe Pembayaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editingPos ? editingPos.tipe_pembayaran : posTipe}
                  onChange={(e) =>
                    editingPos
                      ? setEditingPos({ ...editingPos, tipe_pembayaran: e.target.value })
                      : setPosTipe(e.target.value)
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white"
                >
                  <option value="Bulanan">Bulanan</option>
                  <option value="Bebas">Bebas / Cicilan</option>
                  <option value="Tahunan">Tahunan</option>
                  <option value="Sekali">Sekali Bayar</option>
                </select>
              </div>

              {/* Multi-Select Unit Lembaga */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Unit Lembaga Penerap <span className="text-slate-400 font-normal">(Bisa pilih lebih dari 1 unit)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingPos) {
                        setEditingTargetLembagaIds((prev) =>
                          prev.length === lembagaList.length ? [] : lembagaList.map((l: any) => l.lembaga_id)
                        );
                      } else {
                        setPosTargetLembagaIds((prev) =>
                          prev.length === lembagaList.length ? [] : lembagaList.map((l: any) => l.lembaga_id)
                        );
                      }
                    }}
                    className="text-[11px] font-semibold text-[#162E6E] hover:underline"
                  >
                    {(editingPos ? editingTargetLembagaIds : posTargetLembagaIds).length === lembagaList.length
                      ? "Kosongkan (Universal)"
                      : "Pilih Semua Unit"}
                  </button>
                </div>

                <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>
                      {(() => {
                        const count = (editingPos ? editingTargetLembagaIds : posTargetLembagaIds).length;
                        if (count === 0) return "🌐 Universal: Berlaku untuk seluruh unit lembaga & asrama";
                        if (count === lembagaList.length) return "✅ Seluruh Unit Terpilih (10 Lembaga)";
                        return `📌 ${count} unit lembaga terpilih`;
                      })()}
                    </span>
                    {(editingPos ? editingTargetLembagaIds : posTargetLembagaIds).length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (editingPos) setEditingTargetLembagaIds([]);
                          else setPosTargetLembagaIds([]);
                        }}
                        className="text-[10px] text-rose-600 hover:underline"
                      >
                        Reset ke Universal
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {lembagaList.map((l: any) => {
                      const isSelected = (editingPos ? editingTargetLembagaIds : posTargetLembagaIds).includes(l.lembaga_id);
                      return (
                        <button
                          type="button"
                          key={l.lembaga_id}
                          onClick={() => {
                            if (editingPos) {
                              setEditingTargetLembagaIds((prev) =>
                                isSelected ? prev.filter((id) => id !== l.lembaga_id) : [...prev, l.lembaga_id]
                              );
                            } else {
                              setPosTargetLembagaIds((prev) =>
                                isSelected ? prev.filter((id) => id !== l.lembaga_id) : [...prev, l.lembaga_id]
                              );
                            }
                          }}
                          className={`px-2.5 py-2 rounded-lg text-left text-xs transition-all flex items-center justify-between border ${isSelected
                            ? "bg-[#162E6E] text-white border-[#162E6E] shadow-xs font-semibold"
                            : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                            }`}
                        >
                          <span className="truncate pr-1">{l.singkatan || l.nama_lembaga}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hasKuotaCheckbox"
                  checked={editingPos ? !!editingHasKuota : posHasKuota}
                  onChange={(e) => {
                    if (editingPos) setEditingHasKuota(e.target.checked);
                    else setPosHasKuota(e.target.checked);
                  }}
                  className="rounded border-slate-300 text-[#162E6E] focus:ring-[#162E6E]"
                />
                <label htmlFor="hasKuotaCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Aktifkan Pilihan Kuota / Tarif Bertingkat (misal: Kuota 1, 2, 3 untuk Uang Pangkal)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan</label>
                <textarea
                  rows={2}
                  value={editingPos ? (editingPos.deskripsi || "") : posDeskripsi}
                  onChange={(e) =>
                    editingPos
                      ? setEditingPos({ ...editingPos, deskripsi: e.target.value })
                      : setPosDeskripsi(e.target.value)
                  }
                  placeholder="Penjelasan ringkas tentang alokasi biaya ini..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPosModal(false);
                    setEditingPos(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addPosMutation.isPending || updatePosMutation.isPending}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#162E6E] hover:bg-[#122456] disabled:opacity-50 rounded-lg shadow-xs transition-colors"
                >
                  {addPosMutation.isPending || updatePosMutation.isPending ? "Menyimpan..." : "Simpan Pos"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL: TAMBAH / EDIT SUB-KOMPONEN */}
      {/* ═════════════════════════════════════════════════════════ */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingSub ? "Edit Komponen Biaya" : "Tambah Komponen Biaya"}
                </h3>
                <p className="text-xs text-slate-500">
                  Paket: <span className="font-semibold text-emerald-800">{activePos?.nama_pos}</span>
                </p>
              </div>
              <button
                onClick={() => setShowSubModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveSubMutation.mutate();
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Komponen Biaya <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subNama}
                  onChange={(e) => setSubNama(e.target.value)}
                  placeholder="Contoh: SPP Madrasah, Uang Makan & Dapur Pondok"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={subNominal}
                  onChange={(e) => setSubNominal(e.target.value)}
                  placeholder="Contoh: 400000"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alokasi Kas Internal
                </label>
                <select
                  value={subKodeAkun}
                  onChange={(e) => setSubKodeAkun(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white"
                >
                  <option value="Kas MTs">Kas MTs</option>
                  <option value="Kas MA">Kas MA</option>
                  <option value="Kas MI">Kas MI</option>
                  <option value="Kas SMK">Kas SMK</option>
                  <option value="Kas Dapur Asrama">Kas Dapur Asrama</option>
                  <option value="Kas Pondok">Kas Pondok</option>
                  <option value="Kas Sarpras">Kas Sarpras Yayasan</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pos akun buku kas internal yayasan yang menerima porsi dana ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Urutan Tampilan</label>
                <input
                  type="number"
                  min="1"
                  value={subUrutan}
                  onChange={(e) => setSubUrutan(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveSubMutation.isPending || !subNama.trim() || !subNominal}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#162E6E] hover:bg-[#122456] disabled:opacity-50 rounded-lg shadow-xs transition-colors"
                >
                  {saveSubMutation.isPending ? "Menyimpan..." : "Simpan Komponen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL EDIT TARIF KUOTA */}
      {/* ═════════════════════════════════════════════════════════ */}
      {editingTarifKuota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingTarifKuota.kuota ? `Ubah Tarif ${editingTarifKuota.kuota}` : `Ubah ${editingTarifKuota.nama_tarif}`}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingTarifKuota.nama_tarif}
                </p>
              </div>
              <button
                onClick={() => setEditingTarifKuota(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveTarifKuotaMutation.mutate({
                  tarif_id: editingTarifKuota.tarif_id,
                  pos_id: editingTarifKuota.pos_id,
                  lembaga_id: editingTarifKuota.lembaga_id,
                  nama_tarif: editingTarifKuota.nama_tarif,
                  kuota: editingTarifKuota.kuota,
                  asrama: editingTarifKuota.asrama,
                  kategori_santri: editingTarifKuota.kategori_santri,
                  jenis_kelamin: editingTarifKuota.jenis_kelamin,
                  nominal: parseFloat(tarifKuotaNominal),
                });
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit Lembaga Penerap
                </label>
                <select
                  value={editingTarifKuota.lembaga_id || ""}
                  onChange={(e) =>
                    setEditingTarifKuota({
                      ...editingTarifKuota,
                      lembaga_id: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white font-medium"
                >
                  <option value="">Default Yayasan (Universal)</option>
                  {lembagaList.map((l: any) => (
                    <option key={l.lembaga_id} value={l.lembaga_id}>
                      {l.nama_lembaga} ({l.singkatan || `ID: ${l.lembaga_id}`})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Pilih unit tertentu untuk menetapkan tarif spesifik lembaga tersebut, atau Default Yayasan untuk berlaku umum.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Tarif (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={tarifKuotaNominal}
                  onChange={(e) => setTarifKuotaNominal(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] font-bold text-[#162E6E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTarifKuota(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveTarifKuotaMutation.isPending || !tarifKuotaNominal}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#162E6E] hover:bg-[#122456] rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {saveTarifKuotaMutation.isPending ? "Menyimpan..." : "Simpan Tarif"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL: SALIN TARIF KE LEMBAGA LAIN */}
      {/* ═════════════════════════════════════════════════════════ */}
      {showCopyTarifModal && activePos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>📋</span> Salin Tarif ke Lembaga Lain
                </h3>
                <p className="text-xs text-slate-500">
                  Paket: <span className="font-semibold text-emerald-800">{activePos.nama_pos}</span>
                </p>
              </div>
              <button
                onClick={() => setShowCopyTarifModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <span className="font-bold">Sumber Tarif: </span>
                {tarifLembagaId
                  ? (lembagaList.find((l: any) => l.lembaga_id === tarifLembagaId)?.nama_lembaga || `Unit ${tarifLembagaId}`)
                  : "Default Yayasan (Universal)"}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Pilih Lembaga Tujuan yang Mengadopsi Tarif Ini:
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-3">
                  {lembagaList
                    .filter((l: any) => l.lembaga_id !== tarifLembagaId)
                    .map((l: any) => {
                      const checked = copyTargetLembagaIds.includes(l.lembaga_id);
                      return (
                        <label
                          key={l.lembaga_id}
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCopyTargetLembagaIds([...copyTargetLembagaIds, l.lembaga_id]);
                              } else {
                                setCopyTargetLembagaIds(copyTargetLembagaIds.filter((id) => id !== l.lembaga_id));
                              }
                            }}
                            className="rounded border-slate-300 text-[#162E6E] focus:ring-[#162E6E]"
                          />
                          <span>{l.nama_lembaga}</span>
                          <span className="text-[10px] text-slate-400">({l.singkatan || `ID: ${l.lembaga_id}`})</span>
                        </label>
                      );
                    })}
                </div>
                <div className="flex items-center justify-between pt-1.5 text-[11px] text-slate-500">
                  <button
                    type="button"
                    onClick={() => {
                      const allOtherIds = lembagaList
                        .filter((l: any) => l.lembaga_id !== tarifLembagaId)
                        .map((l: any) => l.lembaga_id);
                      setCopyTargetLembagaIds(allOtherIds);
                    }}
                    className="text-[#162E6E] font-semibold hover:underline"
                  >
                    Pilih Semua Unit
                  </button>
                  <span>{copyTargetLembagaIds.length} unit terpilih</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCopyTarifModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={copyTarifMutation.isPending || copyTargetLembagaIds.length === 0}
                  onClick={() => {
                    copyTarifMutation.mutate({
                      pos_id: activePos.pos_id,
                      source_lembaga_id: tarifLembagaId,
                      target_lembaga_ids: copyTargetLembagaIds,
                    });
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#162E6E] hover:bg-[#122456] rounded-lg shadow-xs disabled:opacity-50"
                >
                  {copyTarifMutation.isPending ? "Menyalin..." : "Salin & Terapkan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
