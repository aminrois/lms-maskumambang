import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  FileText,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  Eye,
  X,
  Building2,
  Table,
  List,
  Clock,
  CreditCard,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Printer,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { toast } from "sonner";
import BuktiPembayaranModal from "../components/BuktiPembayaranModal";

const API_BASE = "/keuangan";

const formatRupiah = (val: number | string) => {
  const num = typeof val === "number" ? val : parseFloat(val as string) || 0;
  return "Rp " + num.toLocaleString("id-ID");
};

const formatNumberWithDots = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null || val === "") return "";
  const cleanStr = String(val).replace(/\D/g, "");
  if (!cleanStr) return "";
  return parseInt(cleanStr, 10).toLocaleString("id-ID");
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

const NAMA_BULAN = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function TagihanSiswaIndex() {
  const queryClient = useQueryClient();

  // View Mode: 'matriks' (Matrix Spreadsheet) vs 'list' (Classic Transaction List)
  const [viewMode, setViewMode] = useState<"matriks" | "list">("matriks");

  // Filters
  const [selectedUnit, setSelectedUnit] = useState<string>("SEMUA");
  const [selectedKelasId, setSelectedKelasId] = useState<string>("all");
  const [filterBulan, setFilterBulan] = useState<number>(new Date().getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState<number>(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [posFilter, setPosFilter] = useState("all");

  // Pagination for list view
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Pagination for Matrix view (Point 2: [10], [30], [50], [100])
  const [matrixPageSize, setMatrixPageSize] = useState<number>(30);
  const [matrixCurrentPage, setMatrixCurrentPage] = useState<number>(1);

  // Student Complete History Modal State (Point 4)
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<any | null>(null);
  const [historyTab, setHistoryTab] = useState<"pos" | "transaksi">("pos");
  const [selectedTrxForReceipt, setSelectedTrxForReceipt] = useState<any | null>(null);

  // Reset matrix page when filters change
  useEffect(() => {
    setMatrixCurrentPage(1);
  }, [selectedUnit, selectedKelasId, filterBulan, filterTahun, statusFilter, posFilter, searchTerm, matrixPageSize]);

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedDetailTagihan, setSelectedDetailTagihan] = useState<any | null>(null);

  // Form Generate Otomatis (Point 1: Auto filled!)
  const [generateLembagaId, setGenerateLembagaId] = useState<string>("");
  const [generatePosId, setGeneratePosId] = useState<number | null>(null);
  const [generateBulan, setGenerateBulan] = useState(new Date().getMonth() + 1);
  const [generateTahun, setGenerateTahun] = useState(new Date().getFullYear());
  const [generateKelasId, setGenerateKelasId] = useState<string>("all");
  const [overrideNominal, setOverrideNominal] = useState<string>("");

  // Form Tambah Tagihan Manual (Point 1: Auto student filter & auto nominal!)
  const [manualLembagaId, setManualLembagaId] = useState<string>("");
  const [manualSiswaId, setManualSiswaId] = useState<number | null>(null);
  const [manualPosId, setManualPosId] = useState<number | null>(null);
  const [manualNama, setManualNama] = useState("");
  const [manualNominal, setManualNominal] = useState("");
  const [manualBulan, setManualBulan] = useState(new Date().getMonth() + 1);
  const [manualTahun, setManualTahun] = useState(new Date().getFullYear());
  const [manualKeterangan, setManualKeterangan] = useState("");
  const [manualKuota, setManualKuota] = useState<string>("");

  // Kuota Management States (Uang Pangkal Kuota 1, 2, 3)
  const [kuotaModalData, setKuotaModalData] = useState<{
    siswa: any;
    pos: any;
    existingTagihan?: any;
  } | null>(null);
  const [selectedKuota, setSelectedKuota] = useState<string>("Kuota 1");
  const [selectedKategoriSantri, setSelectedKategoriSantri] = useState<string>("Umum");
  const [customKuotaNominal, setCustomKuotaNominal] = useState<string>("");

  const isStudentAsrama = (siswa: any) => {
    return siswa?.keterangan_asrama === "Ya" || siswa?.keterangan_asrama === "Mukim";
  };

  const getUangPangkalTarif = (pos: any, asrama: string, kategori: string, kuota: string, lembagaId?: number | null) => {
    if (pos?.tarif && pos.tarif.length > 0) {
      if (lembagaId) {
        const matchedLembaga = pos.tarif.find((t: any) =>
          t.kuota === kuota &&
          t.lembaga_id === lembagaId &&
          (!t.asrama || t.asrama === asrama) &&
          (!t.kategori_santri || t.kategori_santri === kategori)
        );
        if (matchedLembaga) return matchedLembaga.nominal;
      }
      const matched = pos.tarif.find((t: any) =>
        t.kuota === kuota &&
        !t.lembaga_id &&
        (!t.asrama || t.asrama === asrama) &&
        (!t.kategori_santri || t.kategori_santri === kategori)
      );
      if (matched) return matched.nominal;
    }
    // Fallback to official matrix (Gambar 1)
    if (asrama === "Asrama") {
      if (kategori === "Alumni / Anak Guru") {
        if (kuota === "Kuota 1") return 6900000;
        if (kuota === "Kuota 2") return 8200000;
        return 9500000;
      } else {
        if (kuota === "Kuota 1") return 8400000;
        if (kuota === "Kuota 2") return 9700000;
        return 11000000;
      }
    } else {
      if (kategori === "Alumni / Anak Guru") {
        if (kuota === "Kuota 1") return 3300000;
        if (kuota === "Kuota 2") return 4400000;
        return 5500000;
      } else {
        if (kuota === "Kuota 1") return 3900000;
        if (kuota === "Kuota 2") return 5200000;
        return 6500000;
      }
    }
  };

  const getSppTarif = (pos: any, asrama: string, lembagaId?: number | null) => {
    if (pos?.tarif && pos.tarif.length > 0) {
      if (lembagaId) {
        const matched = pos.tarif.find((t: any) => t.lembaga_id === lembagaId && (!t.asrama || t.asrama === asrama));
        if (matched) return matched.nominal;
      }
      const matched = pos.tarif.find((t: any) => !t.lembaga_id && (!t.asrama || t.asrama === asrama));
      if (matched) return matched.nominal;
    }
    return asrama === "Asrama" ? 1900000 : 475000;
  };

  const getSeragamTarif = (pos: any, jk: string, lembagaId?: number | null) => {
    if (pos?.tarif && pos.tarif.length > 0) {
      if (lembagaId) {
        const matched = pos.tarif.find((t: any) => t.lembaga_id === lembagaId && (!t.jenis_kelamin || t.jenis_kelamin === jk));
        if (matched) return matched.nominal;
      }
      const matched = pos.tarif.find((t: any) => !t.lembaga_id && (!t.jenis_kelamin || t.jenis_kelamin === jk));
      if (matched) return matched.nominal;
    }
    return jk === "L" ? 1100000 : 1600000;
  };

  const getKegiatanTarif = (pos: any, lembagaId?: number | null) => {
    if (pos?.tarif && pos.tarif.length > 0) {
      if (lembagaId) {
        const matched = pos.tarif.find((t: any) => t.lembaga_id === lembagaId);
        if (matched) return matched.nominal;
      }
      const matched = pos.tarif.find((t: any) => !t.lembaga_id) || pos.tarif[0];
      if (matched) return matched.nominal;
    }
    return 2250000;
  };

  const getUjianTarif = (pos: any, lembagaId?: number | null) => {
    if (pos?.tarif && pos.tarif.length > 0) {
      if (lembagaId) {
        const matched = pos.tarif.find((t: any) => t.lembaga_id === lembagaId);
        if (matched) return matched.nominal;
      }
      const matched = pos.tarif.find((t: any) => !t.lembaga_id) || pos.tarif[0];
      if (matched) return matched.nominal;
    }
    return 500000;
  };

  // ─────────────────────────────────────────────────────────────
  // 1. DATA QUERIES
  // ─────────────────────────────────────────────────────────────

  // Fetch Master Data (Pos, Lembaga, Rekening)
  const { data: masterData } = useQuery({
    queryKey: ["keuangan", "master"],
    queryFn: async () => {
      const res = await apiClient.get(`${API_BASE}/master`);
      return res.data?.data || { pos: [], lembaga: [] };
    },
  });

  const posList: any[] = masterData?.pos || [];
  const lembagaList: any[] = masterData?.lembaga || [];

  // Fetch Kelas List
  const { data: kelasList = [] } = useQuery({
    queryKey: ["akademik", "kelas-list"],
    queryFn: async () => {
      const res = await apiClient.get(`/akademik/kelas`);
      return res.data?.data || res.data || [];
    },
  });

  // Fetch All Siswa (for Matrix rows & manual dropdown)
  const { data: allSiswa = [], isLoading: isLoadingSiswa } = useQuery({
    queryKey: ["siswa-all-keuangan"],
    queryFn: async () => {
      const res = await apiClient.get(`/siswa`);
      return res.data?.data || res.data || [];
    },
  });

  // Fetch Tagihan List (with server filtering)
  const { data: tagihanList = [], isLoading: isLoadingTagihan, isFetching } = useQuery({
    queryKey: ["keuangan", "tagihan-list", selectedUnit, selectedKelasId, filterBulan, filterTahun, statusFilter, posFilter, searchTerm],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (posFilter !== "all") params.pos_id = posFilter;
      if (selectedKelasId !== "all") params.kelas_id = selectedKelasId;
      if (filterTahun) params.tahun_periode = filterTahun;
      if (searchTerm) params.search = searchTerm;
      const res = await apiClient.get(`${API_BASE}/tagihan`, { params });
      return res.data?.data || [];
    },
  });

  // ─────────────────────────────────────────────────────────────
  // 2. DERIVED DATA & MATRIX GENERATION
  // ─────────────────────────────────────────────────────────────

  const activeUnitConfig = UNIT_OPTIONS.find((u) => u.key === selectedUnit) || UNIT_OPTIONS[0];

  // Filtered Kelas based on selected unit
  const filteredKelasList = useMemo(() => {
    if (selectedUnit === "SEMUA" || activeUnitConfig.ids.length === 0) {
      return kelasList;
    }
    return kelasList.filter((k: any) => activeUnitConfig.ids.includes(k.lembaga_id));
  }, [kelasList, selectedUnit, activeUnitConfig]);

  // Filtered Pos applicable to active unit (Matrix Columns)
  const activePosColumns = useMemo(() => {
    if (selectedUnit === "SEMUA" || activeUnitConfig.ids.length === 0) {
      return posList;
    }
    return posList.filter((p: any) => {
      const targets: number[] = p.target_lembaga_ids || [];
      if (targets.length === 0 && !p.lembaga_id) return true; // Universal
      if (targets.some((id: number) => activeUnitConfig.ids.includes(id))) return true;
      if (p.lembaga_id && activeUnitConfig.ids.includes(p.lembaga_id)) return true;
      return false;
    });
  }, [posList, selectedUnit, activeUnitConfig]);

  // Filtered Siswa (Matrix Rows)
  const filteredSiswaList = useMemo(() => {
    return allSiswa.filter((s: any) => {
      // Lembaga Filter
      if (selectedUnit !== "SEMUA" && activeUnitConfig.ids.length > 0) {
        const studentLembagaId = s.kelas?.lembaga_id;
        if (studentLembagaId && !activeUnitConfig.ids.includes(studentLembagaId)) {
          return false;
        }
      }
      // Kelas Filter
      if (selectedKelasId !== "all" && s.kelas_id !== parseInt(selectedKelasId, 10)) {
        return false;
      }
      // Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const namaMatch = s.nama?.toLowerCase().includes(q);
        const nisMatch = s.nis?.includes(q);
        if (!namaMatch && !nisMatch) return false;
      }
      return true;
    });
  }, [allSiswa, selectedUnit, activeUnitConfig, selectedKelasId, searchTerm]);

  // Map of student bills: Map<`${siswa_id}_${pos_id}`, Tagihan>
  const studentTagihanMap = useMemo(() => {
    const map = new Map<string, any>();
    tagihanList.forEach((t: any) => {
      const key = `${t.siswa_id}_${t.pos_id}`;
      // If multiple bills for same pos (e.g. across months), prefer current month or latest
      const existing = map.get(key);
      if (!existing || t.bulan === filterBulan) {
        map.set(key, t);
      }
    });
    return map;
  }, [tagihanList, filterBulan]);

  // Students for Manual Dropdown (Filtered strictly by manualLembagaId - Point 1!)
  const manualFilteredSiswa = useMemo(() => {
    if (!manualLembagaId) return allSiswa;
    const lid = parseInt(manualLembagaId, 10);
    return allSiswa.filter((s: any) => s.kelas?.lembaga_id === lid);
  }, [allSiswa, manualLembagaId]);

  // Paginated Siswa for Matrix View (Point 2)
  const totalMatrixStudents = filteredSiswaList.length;
  const totalMatrixPages = Math.max(1, Math.ceil(totalMatrixStudents / matrixPageSize));
  const paginatedSiswaList = useMemo(() => {
    const start = (matrixCurrentPage - 1) * matrixPageSize;
    return filteredSiswaList.slice(start, start + matrixPageSize);
  }, [filteredSiswaList, matrixCurrentPage, matrixPageSize]);

  // Fetch complete tagihan for selected student history (Point 4)
  const { data: studentHistoryTagihan = [], isLoading: isLoadingHistoryTagihan } = useQuery({
    queryKey: ["keuangan", "student-history-tagihan", selectedStudentForHistory?.siswa_id, filterTahun],
    queryFn: async () => {
      if (!selectedStudentForHistory?.siswa_id) return [];
      const res = await apiClient.get(`${API_BASE}/tagihan`, {
        params: { siswa_id: selectedStudentForHistory.siswa_id, tahun_periode: filterTahun },
      });
      return res.data?.data || [];
    },
    enabled: !!selectedStudentForHistory?.siswa_id,
  });

  // Fetch complete transaksi history for selected student (Point 4)
  const { data: studentHistoryTransaksi = [], isLoading: isLoadingHistoryTransaksi } = useQuery({
    queryKey: ["keuangan", "student-history-transaksi", selectedStudentForHistory?.siswa_id],
    queryFn: async () => {
      if (!selectedStudentForHistory?.siswa_id) return [];
      const res = await apiClient.get(`${API_BASE}/riwayat`, {
        params: { siswa_id: selectedStudentForHistory.siswa_id, limit: 100 },
      });
      return res.data?.data || [];
    },
    enabled: !!selectedStudentForHistory?.siswa_id,
  });

  // Summary financials for student history modal
  const historySummary = useMemo(() => {
    let totalKewajiban = 0;
    let totalTerbayar = 0;
    let totalSisa = 0;

    studentHistoryTagihan.forEach((t: any) => {
      totalKewajiban += t.nominal_total || 0;
      totalTerbayar += t.nominal_terbayar || 0;
      totalSisa += t.sisa_tagihan || 0;
    });

    return { totalKewajiban, totalTerbayar, totalSisa };
  }, [studentHistoryTagihan]);

  // ─────────────────────────────────────────────────────────────
  // 3. MUTATIONS
  // ─────────────────────────────────────────────────────────────

  // Generate Tagihan Otomatis
  const generateSppMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post(`${API_BASE}/tagihan/generate-spp`, payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Generate tagihan massal berhasil!");
      setShowGenerateModal(false);
      queryClient.invalidateQueries({ queryKey: ["keuangan", "tagihan-list"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal generate tagihan.");
    },
  });

  // Tambah Tagihan Manual
  const addTagihanMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post(`${API_BASE}/tagihan/manual`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Tagihan baru berhasil dibuat!");
      setShowManualModal(false);
      setManualSiswaId(null);
      setManualNominal("");
      setManualNama("");
      setManualKeterangan("");
      queryClient.invalidateQueries({ queryKey: ["keuangan", "tagihan-list"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal membuat tagihan.");
    },
  });

  // Set / Update Kuota Tagihan Santri Mutation (Point 1)
  const setKuotaMutation = useMutation({
    mutationFn: async (payload: { siswa_id: number; pos_id: number; kuota: string; nominal?: number; kategori_santri?: string; tahun_periode?: number }) => {
      const res = await apiClient.post(`${API_BASE}/tagihan/set-kuota`, payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Kuota tagihan santri berhasil disimpan!");
      setKuotaModalData(null);
      queryClient.invalidateQueries({ queryKey: ["keuangan", "tagihan-list"] });
      queryClient.invalidateQueries({ queryKey: ["siswa-all-keuangan"] });
      queryClient.invalidateQueries({ queryKey: ["keuangan", "student-history-tagihan"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal mengatur kuota tagihan.");
    },
  });

  // Handle open Generate Modal (Auto-fills defaults based on active unit!)
  const handleOpenGenerateModal = () => {
    const defaultPos = activePosColumns[0] || posList[0];
    setGeneratePosId(defaultPos?.pos_id || null);

    if (defaultPos) {
      if (defaultPos.kode_pos === "SPP" || defaultPos.nama_pos?.toLowerCase().includes("spp")) {
        setOverrideNominal("1900000");
      } else if (defaultPos.kode_pos === "SERAGAM" || defaultPos.nama_pos?.toLowerCase().includes("seragam")) {
        setOverrideNominal("1100000");
      } else if (defaultPos.kode_pos === "KEGIATAN" || defaultPos.nama_pos?.toLowerCase().includes("kegiatan")) {
        setOverrideNominal("2250000");
      } else if (defaultPos.kode_pos === "UJIAN" || defaultPos.nama_pos?.toLowerCase().includes("ujian")) {
        setOverrideNominal("500000");
      } else {
        const subs = defaultPos.sub_komponen || [];
        const subTotal = subs.reduce((a: number, c: any) => a + (c.nominal_default || 0), 0);
        setOverrideNominal(subTotal > 0 ? subTotal.toString() : (defaultPos.tarif?.[0]?.nominal || ""));
      }
    }

    if (selectedUnit !== "SEMUA" && activeUnitConfig.ids.length > 0) {
      setGenerateLembagaId(activeUnitConfig.ids[0].toString());
    } else {
      setGenerateLembagaId("");
    }
    setShowGenerateModal(true);
  };

  // When Pos changes in Generate Modal, auto calculate nominal
  const handleGeneratePosChange = (posId: number, targetLembagaId?: string) => {
    setGeneratePosId(posId);
    const p = posList.find((item: any) => item.pos_id === posId);
    if (!p) return;
    const lIdStr = targetLembagaId !== undefined ? targetLembagaId : generateLembagaId;
    const lId = lIdStr ? parseInt(lIdStr, 10) : null;

    if (p.kode_pos === "SPP" || p.nama_pos?.toLowerCase().includes("spp")) {
      setOverrideNominal(getSppTarif(p, "Asrama", lId).toString());
    } else if (p.kode_pos === "SERAGAM" || p.nama_pos?.toLowerCase().includes("seragam")) {
      setOverrideNominal(getSeragamTarif(p, "L", lId).toString());
    } else if (p.kode_pos === "KEGIATAN" || p.nama_pos?.toLowerCase().includes("kegiatan")) {
      setOverrideNominal(getKegiatanTarif(p, lId).toString());
    } else if (p.kode_pos === "UJIAN" || p.nama_pos?.toLowerCase().includes("ujian")) {
      setOverrideNominal(getUjianTarif(p, lId).toString());
    } else {
      const subs = p.sub_komponen || [];
      const subTotal = subs.reduce((a: number, c: any) => a + (c.nominal_default || 0), 0);
      setOverrideNominal(subTotal > 0 ? subTotal.toString() : (p.tarif?.[0]?.nominal || ""));
    }
  };

  // Handle open Manual Modal (Auto-fills defaults!)
  const handleOpenManualModal = () => {
    if (selectedUnit !== "SEMUA" && activeUnitConfig.ids.length > 0) {
      setManualLembagaId(activeUnitConfig.ids[0].toString());
    } else {
      setManualLembagaId("");
    }
    const defaultPos = activePosColumns[0] || posList[0];
    setManualPosId(defaultPos?.pos_id || null);
    const isKuota = defaultPos?.has_kuota || defaultPos?.kode_pos === "PANGKAL" || defaultPos?.nama_pos?.toLowerCase().includes("pangkal");
    if (isKuota) {
      setManualKuota("Kuota 1");
      setManualNama(`${defaultPos?.nama_pos} (Kuota 1)`);
      const tarif1 = defaultPos?.tarif?.find((t: any) => t.kuota === "Kuota 1")?.nominal || 8400000;
      setManualNominal(tarif1.toString());
    } else {
      setManualKuota("");
      setManualNama(defaultPos?.nama_pos || "");
      const subs = defaultPos?.sub_komponen || [];
      const subTotal = subs.reduce((a: number, c: any) => a + (c.nominal_default || 0), 0);
      setManualNominal(subTotal > 0 ? subTotal.toString() : (defaultPos?.tarif?.[0]?.nominal || ""));
    }
    setManualSiswaId(null);
    setShowManualModal(true);
  };

  // When Pos changes in Manual Modal, auto fill name and nominal
  const handleManualPosChange = (posId: number) => {
    setManualPosId(posId);
    const p = posList.find((item: any) => item.pos_id === posId);
    if (!p) return;

    const s = allSiswa.find((item: any) => item.siswa_id === manualSiswaId);
    const isAsr = s ? isStudentAsrama(s) : false;
    const asramaStr = isAsr ? "Asrama" : "Non-Asrama";
    const kat = s?.kategori_santri || "Umum";
    const isPutra = s ? s.jenis_kelamin === "L" : true;
    const studentLembagaId = s?.kelas?.lembaga_id;

    if (p.kode_pos === "PANGKAL" || p.has_kuota || p.nama_pos?.toLowerCase().includes("pangkal")) {
      setManualKuota("Kuota 1");
      setManualNama(`${p.nama_pos} (Kuota 1)`);
      const nom = getUangPangkalTarif(p, asramaStr, kat, "Kuota 1", studentLembagaId);
      setManualNominal(nom.toString());
    } else if (p.kode_pos === "SPP" || p.nama_pos?.toLowerCase().includes("spp")) {
      setManualKuota("");
      setManualNama(`${p.nama_pos}${s ? ` (${asramaStr})` : ""}`);
      const nom = getSppTarif(p, asramaStr, studentLembagaId);
      setManualNominal(nom.toString());
    } else if (p.kode_pos === "SERAGAM" || p.nama_pos?.toLowerCase().includes("seragam")) {
      setManualKuota("");
      setManualNama(`Seragam ${isPutra ? "Putra" : "Putri"}`);
      const nom = getSeragamTarif(p, isPutra ? "L" : "P", studentLembagaId);
      setManualNominal(nom.toString());
    } else if (p.kode_pos === "KEGIATAN" || p.nama_pos?.toLowerCase().includes("kegiatan")) {
      setManualKuota("");
      setManualNama(p.nama_pos);
      const nom = getKegiatanTarif(p, studentLembagaId);
      setManualNominal(nom.toString());
    } else if (p.kode_pos === "UJIAN" || p.nama_pos?.toLowerCase().includes("ujian")) {
      setManualKuota("");
      setManualNama(p.nama_pos);
      const nom = getUjianTarif(p, studentLembagaId);
      setManualNominal(nom.toString());
    } else {
      setManualKuota("");
      setManualNama(p.nama_pos);
      const subs = p.sub_komponen || [];
      const subTotal = subs.reduce((a: number, c: any) => a + (c.nominal_default || 0), 0);
      setManualNominal(subTotal > 0 ? subTotal.toString() : (p.tarif?.[0]?.nominal || ""));
    }
  };

  // When Siswa changes in Manual Modal, intelligently auto-fill based on demographics!
  const handleManualSiswaChange = (siswaId: number) => {
    setManualSiswaId(siswaId);
    const s = allSiswa.find((item: any) => item.siswa_id === siswaId);
    if (!s || !manualPosId) return;

    const p = posList.find((item: any) => item.pos_id === manualPosId);
    if (!p) return;

    const isAsr = isStudentAsrama(s);
    const asramaStr = isAsr ? "Asrama" : "Non-Asrama";
    const kat = s.kategori_santri || "Umum";
    const isPutra = s.jenis_kelamin === "L";
    const studentLembagaId = s?.kelas?.lembaga_id;

    if (p.kode_pos === "PANGKAL" || p.has_kuota || p.nama_pos?.toLowerCase().includes("pangkal")) {
      const kuota = manualKuota || "Kuota 1";
      const nom = getUangPangkalTarif(p, asramaStr, kat, kuota, studentLembagaId);
      setManualNominal(nom.toString());
      setManualNama(`${p.nama_pos} (${kuota})`);
    } else if (p.kode_pos === "SPP" || p.nama_pos?.toLowerCase().includes("spp")) {
      const nom = getSppTarif(p, asramaStr, studentLembagaId);
      setManualNominal(nom.toString());
      setManualNama(`${p.nama_pos} (${asramaStr})`);
    } else if (p.kode_pos === "SERAGAM" || p.nama_pos?.toLowerCase().includes("seragam")) {
      const nom = getSeragamTarif(p, isPutra ? "L" : "P", studentLembagaId);
      setManualNominal(nom.toString());
      setManualNama(`Seragam ${isPutra ? "Putra" : "Putri"}`);
    } else if (p.kode_pos === "KEGIATAN" || p.nama_pos?.toLowerCase().includes("kegiatan")) {
      const nom = getKegiatanTarif(p, studentLembagaId);
      setManualNominal(nom.toString());
      setManualNama(p.nama_pos);
    } else if (p.kode_pos === "UJIAN" || p.nama_pos?.toLowerCase().includes("ujian")) {
      const nom = getUjianTarif(p, studentLembagaId);
      setManualNominal(nom.toString());
      setManualNama(p.nama_pos);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ═════════════════════════════════════════════════════════ */}
        {/* HEADER & ACTION BUTTONS */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <span>Keuangan & SPP</span>
              <span>/</span>
              <span className="text-slate-600 font-semibold">Tagihan Santri</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-[#162E6E] text-white flex items-center justify-center shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Matriks & Rekapitulasi Tagihan Santri
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitoring status pembayaran santri lintas biaya per-lembaga & per-kelas secara menyeluruh.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-1 flex items-center shadow-2xs">
              <button
                onClick={() => setViewMode("matriks")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "matriks"
                    ? "bg-[#162E6E] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                <Table className="w-3.5 h-3.5" />
                Matriks Santri
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "list"
                    ? "bg-[#162E6E] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                <List className="w-3.5 h-3.5" />
                Daftar Tagihan
              </button>
            </div>

            {/* Quick Action: Generate Otomatis */}
            <button
              onClick={handleOpenGenerateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Generate Tagihan Otomatis
            </button>

            {/* Quick Action: Tambah Tagihan Manual */}
            <button
              onClick={handleOpenManualModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 text-[#162E6E]" />
              Tambah Tagihan Khusus
            </button>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* FILTER BAR: UNIT LEMBAGA, KELAS, PERIODE, & SEARCH */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3.5">
          {/* Top Row: Unit Lembaga Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>Unit Lembaga:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {UNIT_OPTIONS.map((u) => {
                const isActive = selectedUnit === u.key;
                return (
                  <button
                    key={u.key}
                    onClick={() => {
                      setSelectedUnit(u.key);
                      setSelectedKelasId("all");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${isActive
                        ? "bg-[#162E6E] text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                      }`}
                  >
                    {u.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Row: Kelas Filter, Bulan, Tahun, & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama santri atau NIS..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-slate-50/50"
              />
            </div>

            {/* Filter Kelas (Only shows classes for selected unit!) */}
            <div>
              <select
                value={selectedKelasId}
                onChange={(e) => setSelectedKelasId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white text-slate-700"
              >
                <option value="all">Semua Kelas ({filteredKelasList.length})</option>
                {filteredKelasList.map((k: any) => (
                  <option key={k.kelas_id} value={k.kelas_id}>
                    Kelas {k.nama_kelas} {k.lembaga?.singkatan ? `(${k.lembaga.singkatan})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Bulan Periode */}
            <div>
              <select
                value={filterBulan}
                onChange={(e) => setFilterBulan(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white text-slate-700"
              >
                {NAMA_BULAN.slice(1).map((b, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    Bulan: {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tahun */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filterTahun}
                onChange={(e) => setFilterTahun(parseInt(e.target.value, 10) || 2026)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white text-slate-700"
              />
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["keuangan", "tagihan-list"] })}
                className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                title="Refresh Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#162E6E]" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* VIEW MODE 1: MATRIKS TAGIHAN SANTRI (SPREADSHEET TABLE) */}
        {/* ═════════════════════════════════════════════════════════ */}
        {viewMode === "matriks" && (
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Matriks Tagihan Santri ({filteredSiswaList.length} Santri Terdaftar)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#162E6E]">
                    Periode {NAMA_BULAN[filterBulan]} {filterTahun}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap kolom menampilkan status tagihan santri per pos biaya.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Lunas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Cicilan / Sisa
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Belum Bayar
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="sticky left-0 z-20 bg-slate-50 py-3 px-3.5 w-12 min-w-[48px] max-w-[48px] text-center border-r border-slate-200/80">No</th>
                    <th className="sticky left-12 z-20 bg-slate-50 py-3 px-3.5 min-w-[200px] border-r border-slate-200/80 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]">Nama Santri</th>
                    <th className="py-3 px-3.5">NIS</th>
                    <th className="py-3 px-3.5">Kelas</th>

                    {/* DYNAMIC POS COLUMNS (Point 2: Tagihan A, B, C, D) */}
                    {activePosColumns.map((pos) => {
                      const isPangkal = pos.kode_pos === "PANGKAL" || pos.nama_pos?.toLowerCase().includes("pangkal");
                      const isSpp = pos.kode_pos === "SPP" || pos.nama_pos?.toLowerCase().includes("spp");
                      const isSeragam = pos.kode_pos === "SERAGAM" || pos.nama_pos?.toLowerCase().includes("seragam");
                      const isKegiatan = pos.kode_pos === "KEGIATAN" || pos.nama_pos?.toLowerCase().includes("kegiatan");
                      const isUjian = pos.kode_pos === "UJIAN" || pos.nama_pos?.toLowerCase().includes("ujian");

                      let subLabel = pos.tipe_pembayaran;
                      if (isPangkal) subLabel = "3 Kuota Bertingkat";
                      else if (isSpp) subLabel = "Asrama / Non-Asrama";
                      else if (isSeragam) subLabel = "Putra / Putri";
                      else if (isKegiatan || isUjian) subLabel = "1 Tahun";

                      return (
                        <th key={pos.pos_id} className="py-3 px-3.5 text-center min-w-[145px]">
                          <div>{pos.nama_pos}</div>
                          <div className="text-[9px] text-[#162E6E] font-medium lowercase">
                            ({subLabel})
                          </div>
                        </th>
                      );
                    })}

                    <th className="py-3 px-3.5 text-right font-bold text-slate-800">Total Tunggakan</th>
                    <th className="sticky right-0 z-20 bg-slate-50 py-3 px-3.5 text-center shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] border-l border-slate-200">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingSiswa ? (
                    <tr>
                      <td colSpan={6 + activePosColumns.length} className="py-12 text-center text-slate-400">
                        Memuat data santri & matriks tagihan...
                      </td>
                    </tr>
                  ) : filteredSiswaList.length === 0 ? (
                    <tr>
                      <td colSpan={6 + activePosColumns.length} className="py-12 text-center text-slate-400">
                        Tidak ada data santri yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedSiswaList.map((siswa: any, idx: number) => {
                      let totalTunggakanSantri = 0;
                      const rowNumber = (matrixCurrentPage - 1) * matrixPageSize + idx + 1;

                      return (
                        <tr key={siswa.siswa_id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 py-3 px-3.5 w-12 min-w-[48px] max-w-[48px] text-center text-slate-400 font-medium border-r border-slate-100">
                            {rowNumber}
                          </td>
                          <td className="sticky left-12 z-10 bg-white group-hover:bg-slate-50 py-3 px-3.5 min-w-[200px] border-r border-slate-100 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                            <div className="font-bold text-slate-900">{siswa.nama}</div>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${isStudentAsrama(siswa)
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}
                              >
                                {isStudentAsrama(siswa) ? "Asrama" : "Non-Asrama"}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${siswa.jenis_kelamin === "L"
                                    ? "bg-sky-50 text-sky-700 border border-sky-200"
                                    : "bg-pink-50 text-pink-700 border border-pink-200"
                                  }`}
                              >
                                {siswa.jenis_kelamin === "L" ? "Putra" : "Putri"}
                              </span>
                              {siswa.kategori_santri && siswa.kategori_santri !== "Umum" && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  {siswa.kategori_santri}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 font-mono text-slate-600 text-[11px]">
                            {siswa.nis}
                          </td>
                          <td className="py-3 px-3.5">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                              {siswa.kelas?.nama_kelas || "-"}
                            </span>
                          </td>

                          {/* CELL STATUS FOR EACH POS COLUMN */}
                          {activePosColumns.map((pos) => {
                            const key = `${siswa.siswa_id}_${pos.pos_id}`;
                            const tagihan = studentTagihanMap.get(key);
                            const isPangkal = pos.has_kuota || pos.kode_pos === "PANGKAL" || pos.nama_pos?.toLowerCase().includes("pangkal");
                            const isSpp = pos.kode_pos === "SPP" || pos.nama_pos?.toLowerCase().includes("spp");
                            const isSeragam = pos.kode_pos === "SERAGAM" || pos.nama_pos?.toLowerCase().includes("seragam");

                            if (!tagihan) {
                              if (isPangkal) {
                                return (
                                  <td key={pos.pos_id} className="py-3 px-3.5 text-center">
                                    <button
                                      onClick={() => {
                                        const asr = isStudentAsrama(siswa) ? "Asrama" : "Non-Asrama";
                                        const kat = siswa.kategori_santri || "Umum";
                                        setSelectedKategoriSantri(kat);
                                        setSelectedKuota("Kuota 1");
                                        const defaultTarif = getUangPangkalTarif(pos, asr, kat, "Kuota 1", siswa.kelas?.lembaga_id);
                                        setCustomKuotaNominal(defaultTarif.toString());
                                        setKuotaModalData({ siswa, pos });
                                      }}
                                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 transition-colors shadow-2xs cursor-pointer"
                                      title="Tentukan kuota uang pangkal santri ini"
                                    >
                                      Set Kuota
                                    </button>
                                  </td>
                                );
                              }
                              return (
                                <td key={pos.pos_id} className="py-3 px-3.5 text-center text-slate-300 text-xs">
                                  —
                                </td>
                              );
                            }

                            if (tagihan.status !== "Lunas") {
                              totalTunggakanSantri += tagihan.sisa_tagihan || tagihan.nominal_total || 0;
                            }

                            let detailBadge = "";
                            if (isPangkal) {
                              const k = tagihan.kuota || "Kuota 1";
                              const asr = tagihan.asrama || (isStudentAsrama(siswa) ? "Asrama" : "Non-Asrama");
                              const kat = tagihan.kategori_santri || siswa.kategori_santri || "Umum";
                              detailBadge = `${k} • ${asr} (${kat})`;
                            } else if (isSpp) {
                              const asr = tagihan.asrama || (isStudentAsrama(siswa) ? "Asrama" : "Non-Asrama");
                              detailBadge = asr;
                            } else if (isSeragam) {
                              const jk = tagihan.jenis_kelamin || siswa.jenis_kelamin;
                              detailBadge = jk === "L" ? "Seragam Putra" : "Seragam Putri";
                            } else if (tagihan.kuota) {
                              detailBadge = tagihan.kuota;
                            }

                            return (
                              <td
                                key={pos.pos_id}
                                className="py-3 px-3.5 text-center cursor-pointer"
                                onClick={() =>
                                  setSelectedDetailTagihan({
                                    ...tagihan,
                                    siswa: tagihan.siswa || siswa,
                                    siswa_id: tagihan.siswa_id || siswa.siswa_id,
                                  })
                                }
                              >
                                {tagihan.status === "Lunas" ? (
                                  <div className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 text-center">
                                    <div>Lunas</div>
                                    {detailBadge && (
                                      <div className="text-[9px] text-emerald-800 font-medium mt-0.5 whitespace-nowrap">
                                        {detailBadge}
                                      </div>
                                    )}
                                  </div>
                                ) : tagihan.status === "Sebagian" || tagihan.nominal_terbayar > 0 ? (
                                  <div className="inline-block px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 text-left">
                                    <div>
                                      Sisa {formatRupiah(tagihan.sisa_tagihan)}
                                    </div>
                                    <div className="text-[9px] text-amber-600 font-normal">
                                      Terbayar: {formatRupiah(tagihan.nominal_terbayar)}
                                    </div>
                                    {detailBadge && (
                                      <div className="text-[9px] text-amber-900 font-medium mt-0.5 flex items-center justify-between gap-1.5 whitespace-nowrap">
                                        <span>{detailBadge}</span>
                                        {isPangkal && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const kat = tagihan.kategori_santri || siswa.kategori_santri || "Umum";
                                              setSelectedKategoriSantri(kat);
                                              setSelectedKuota(tagihan.kuota || "Kuota 1");
                                              setCustomKuotaNominal((tagihan.nominal_total || 0).toString());
                                              setKuotaModalData({ siswa, pos, existingTagihan: tagihan });
                                            }}
                                            className="text-[8px] text-amber-700 hover:text-amber-900 underline font-normal cursor-pointer ml-1"
                                            title="Ubah Kuota"
                                          >
                                            Ubah
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="inline-block px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 text-left">
                                    <div>
                                      {formatRupiah(tagihan.nominal_total)}
                                    </div>
                                    {detailBadge && (
                                      <div className="text-[9px] text-rose-800 font-medium mt-0.5 flex items-center justify-between gap-1.5 whitespace-nowrap">
                                        <span>{detailBadge}</span>
                                        {isPangkal && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const kat = tagihan.kategori_santri || siswa.kategori_santri || "Umum";
                                              setSelectedKategoriSantri(kat);
                                              setSelectedKuota(tagihan.kuota || "Kuota 1");
                                              setCustomKuotaNominal((tagihan.nominal_total || 0).toString());
                                              setKuotaModalData({ siswa, pos, existingTagihan: tagihan });
                                            }}
                                            className="text-[8px] text-rose-700 hover:text-rose-900 underline font-normal cursor-pointer ml-1"
                                            title="Ubah Kuota"
                                          >
                                            Ubah
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    {tagihan.sub_items?.some((si: any) => si.nominal_diskon > 0) && (
                                      <div className="text-[9px] text-emerald-700 font-normal">
                                        Termasuk Beasiswa
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}

                          {/* TOTAL TUNGGAKAN */}
                          <td className="py-3 px-3.5 text-right font-extrabold text-slate-900">
                            {totalTunggakanSantri > 0 ? (
                              <span className="text-rose-600">{formatRupiah(totalTunggakanSantri)}</span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">Bebas Tunggakan</span>
                            )}
                          </td>

                          {/* AKSI BAYAR / DETAIL (FREEZE / STICKY RIGHT) */}
                          <td className="sticky right-0 z-10 bg-white group-hover:bg-slate-50 py-2.5 px-3 text-center shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] border-l border-slate-100 min-w-[92px]">
                            <div className="flex flex-col items-stretch gap-1 w-[76px] mx-auto">
                              <Link
                                to={`/keuangan/loket-kasir?siswa_id=${siswa.siswa_id}`}
                                className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold bg-emerald-50 hover:bg-emerald-100 text-[#162E6E] border border-emerald-200 transition-colors shadow-2xs"
                                title="Buka Kasir Loket untuk Pembayaran Santri Ini"
                              >
                                <CreditCard className="w-3 h-3 text-[#162E6E]" />
                                Bayar
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentForHistory(siswa);
                                  setHistoryTab("pos");
                                }}
                                className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shadow-2xs cursor-pointer"
                                title="Lihat Rekap & Riwayat Pembayaran Santri"
                              >
                                <Receipt className="w-3 h-3 text-blue-600" />
                                Riwayat
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

            {/* PAGINATION BAR (Point 2: [10], [30], [50], [100]) */}
            <div className="bg-slate-50/90 px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Tampilkan per halaman:</span>
                  <select
                    value={matrixPageSize}
                    onChange={(e) => {
                      setMatrixPageSize(parseInt(e.target.value, 10));
                      setMatrixCurrentPage(1);
                    }}
                    className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#162E6E]"
                  >
                    {[10, 30, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size} data
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-slate-500">
                  Menampilkan <strong className="text-slate-800 font-semibold">{totalMatrixStudents === 0 ? 0 : (matrixCurrentPage - 1) * matrixPageSize + 1}</strong> - <strong className="text-slate-800 font-semibold">{Math.min(matrixCurrentPage * matrixPageSize, totalMatrixStudents)}</strong> dari <strong className="text-slate-900 font-bold">{totalMatrixStudents}</strong> santri
                </span>
              </div>

              {/* Page Navigator */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={matrixCurrentPage <= 1}
                  onClick={() => setMatrixCurrentPage(1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Halaman Pertama"
                >
                  <ChevronsLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  type="button"
                  disabled={matrixCurrentPage <= 1}
                  onClick={() => setMatrixCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalMatrixPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalMatrixPages || Math.abs(p - matrixCurrentPage) <= 1)
                    .map((p, pIdx, pArr) => {
                      const prev = pArr[pIdx - 1];
                      const hasGap = prev && p - prev > 1;
                      return (
                        <div key={p} className="flex items-center gap-1">
                          {hasGap && <span className="px-1 text-slate-400">...</span>}
                          <button
                            type="button"
                            onClick={() => setMatrixCurrentPage(p)}
                            className={`min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs transition-colors ${matrixCurrentPage === p
                                ? "bg-[#162E6E] text-white shadow-xs"
                                : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                              }`}
                          >
                            {p}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <button
                  type="button"
                  disabled={matrixCurrentPage >= totalMatrixPages}
                  onClick={() => setMatrixCurrentPage((p) => Math.min(totalMatrixPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  type="button"
                  disabled={matrixCurrentPage >= totalMatrixPages}
                  onClick={() => setMatrixCurrentPage(totalMatrixPages)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Halaman Terakhir"
                >
                  <ChevronsRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════ */}
        {/* VIEW MODE 2: DAFTAR TRANSAKSI INDIVIDUAL (CLASSIC LIST) */}
        {/* ═════════════════════════════════════════════════════════ */}
        {viewMode === "list" && (
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Daftar Tagihan Individual Santri</h2>
                <p className="text-xs text-slate-500">Record tagihan individual lengkap dengan sub-komponen & riwayat</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
                >
                  <option value="all">Semua Status</option>
                  <option value="Lunas">Lunas</option>
                  <option value="Sebagian">Sebagian</option>
                  <option value="Belum Bayar">Belum Bayar</option>
                </select>

                <select
                  value={posFilter}
                  onChange={(e) => setPosFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
                >
                  <option value="all">Semua Pos</option>
                  {posList.map((p: any) => (
                    <option key={p.pos_id} value={p.pos_id}>
                      {p.nama_pos}
                    </option>
                  ))}
                </select>

                <span className="text-xs text-slate-400 font-medium ml-2">
                  Total {tagihanList.length} tagihan
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Tagihan</th>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Nominal Total</th>
                    <th className="py-3 px-4">Sisa Tagihan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingTagihan ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Memuat tagihan...
                      </td>
                    </tr>
                  ) : tagihanList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada tagihan yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    tagihanList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((t: any, idx: number) => (
                      <tr key={t.tagihan_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-center text-slate-400 font-medium">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{t.nama_tagihan}</div>
                          <div className="text-[11px] text-slate-400">
                            {t.pos?.nama_pos} {t.bulan ? `(${NAMA_BULAN[t.bulan]} ${t.tahun_periode})` : ""}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{t.siswa?.nama}</div>
                          <div className="text-[11px] text-slate-400 font-mono">NIS: {t.siswa?.nis}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {t.siswa?.kelas?.nama_kelas || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatRupiah(t.nominal_total)}
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-600">
                          {t.status === "Lunas" ? "Rp 0" : formatRupiah(t.sisa_tagihan)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {t.status === "Lunas" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Lunas
                            </span>
                          ) : t.status === "Sebagian" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Sebagian
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Belum Bayar
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedDetailTagihan(t)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Detail Tagihan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {tagihanList.length > itemsPerPage && (
              <div className="bg-slate-50/80 px-6 py-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>
                  Halaman {currentPage} dari {Math.ceil(tagihanList.length / itemsPerPage)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg bg-white disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  <button
                    disabled={currentPage === Math.ceil(tagihanList.length / itemsPerPage)}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg bg-white disabled:opacity-50"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL 1: GENERATE TAGIHAN OTOMATIS (POINT 1: ZERO MANUAL TYPING) */}
      {/* ═════════════════════════════════════════════════════════ */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#162E6E] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Generate Tagihan Otomatis</h3>
                  <p className="text-xs text-slate-500">Nominal & nama tagihan otomatis dari Master Tarif</p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!generatePosId) {
                  toast.error("Pilih jenis pembayaran");
                  return;
                }
                generateSppMutation.mutate({
                  pos_id: generatePosId,
                  lembaga_id: generateLembagaId || undefined,
                  kelas_id: generateKelasId === "all" ? undefined : parseInt(generateKelasId, 10),
                  bulan: generateBulan,
                  tahun_periode: generateTahun,
                  nominal: overrideNominal ? parseFloat(overrideNominal) : undefined,
                });
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Jenis Pembayaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={generatePosId || ""}
                  onChange={(e) => handleGeneratePosChange(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white font-medium"
                >
                  {posList.map((p: any) => (
                    <option key={p.pos_id} value={p.pos_id}>
                      {p.nama_pos} ({p.tipe_pembayaran})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bulan Tagihan</label>
                  <select
                    value={generateBulan}
                    onChange={(e) => setGenerateBulan(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white"
                  >
                    {NAMA_BULAN.slice(1).map((b, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Periode</label>
                  <input
                    type="number"
                    value={generateTahun}
                    onChange={(e) => setGenerateTahun(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Unit Lembaga</label>
                  <select
                    value={generateLembagaId}
                    onChange={(e) => {
                      const newLembaga = e.target.value;
                      setGenerateLembagaId(newLembaga);
                      if (generatePosId) {
                        handleGeneratePosChange(generatePosId, newLembaga);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white"
                  >
                    <option value="">Semua Unit Yang Berlaku</option>
                    {lembagaList.map((l: any) => (
                      <option key={l.lembaga_id} value={l.lembaga_id}>
                        {l.nama_lembaga} ({l.singkatan})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Kelas</label>
                  <select
                    value={generateKelasId}
                    onChange={(e) => setGenerateKelasId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white"
                  >
                    <option value="all">Semua Kelas</option>
                    {kelasList
                      .filter((k: any) => !generateLembagaId || k.lembaga_id === parseInt(generateLembagaId, 10))
                      .map((k: any) => (
                        <option key={k.kelas_id} value={k.kelas_id}>
                          Kelas {k.nama_kelas}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Automatic Demographic & Fee Explanation */}
              {(() => {
                const activeGeneratePos = posList.find((p: any) => p.pos_id === generatePosId);
                const isGenSpp = activeGeneratePos?.kode_pos === "SPP" || activeGeneratePos?.nama_pos?.toLowerCase().includes("spp");
                const isGenSeragam = activeGeneratePos?.kode_pos === "SERAGAM" || activeGeneratePos?.nama_pos?.toLowerCase().includes("seragam");
                const isGenPangkal = activeGeneratePos?.kode_pos === "PANGKAL" || activeGeneratePos?.has_kuota || activeGeneratePos?.nama_pos?.toLowerCase().includes("pangkal");
                const isGenKegiatan = activeGeneratePos?.kode_pos === "KEGIATAN" || activeGeneratePos?.nama_pos?.toLowerCase().includes("kegiatan");
                const isGenUjian = activeGeneratePos?.kode_pos === "UJIAN" || activeGeneratePos?.nama_pos?.toLowerCase().includes("ujian");
                const genLembagaNum = generateLembagaId ? parseInt(generateLembagaId, 10) : null;
                const genLembagaObj = lembagaList.find((l: any) => l.lembaga_id === genLembagaNum);

                if (isGenSpp) {
                  return (
                    <div className="bg-blue-50/90 border border-blue-200/90 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <span>🏢</span> Otomatisasi SPP Santri Sesuai Hunian:
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {genLembagaObj ? `Unit: ${genLembagaObj.singkatan}` : "Deteksi Asrama"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-blue-950 font-medium pt-0.5">
                        <div className="p-2.5 rounded-lg bg-white/80 border border-blue-100 shadow-2xs">
                          <div className="text-[10px] text-blue-600 font-bold uppercase">Santri Asrama (Mukim)</div>
                          <div className="text-sm font-extrabold text-[#162E6E]">
                            {formatRupiah(getSppTarif(activeGeneratePos, "Asrama", genLembagaNum))} / bln
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/80 border border-blue-100 shadow-2xs">
                          <div className="text-[10px] text-blue-600 font-bold uppercase">Santri Non-Asrama (Laju)</div>
                          <div className="text-sm font-extrabold text-[#162E6E]">
                            {formatRupiah(getSppTarif(activeGeneratePos, "Non-Asrama", genLembagaNum))} / bln
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-blue-800">
                        ✨ Sistem langsung mengidentifikasi data santri tanpa perlu dipisahkan manual. Santri penerima beasiswa/keringanan otomatis dipotong.
                      </p>
                    </div>
                  );
                }

                if (isGenSeragam) {
                  return (
                    <div className="bg-purple-50/90 border border-purple-200/90 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                          <span>👔</span> Otomatisasi Seragam Sesuai Jenis Kelamin:
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          {genLembagaObj ? `Unit: ${genLembagaObj.singkatan}` : "Deteksi Gender"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-purple-950 font-medium pt-0.5">
                        <div className="p-2.5 rounded-lg bg-white/80 border border-purple-100 shadow-2xs">
                          <div className="text-[10px] text-sky-700 font-bold uppercase">Santri Putra (L)</div>
                          <div className="text-sm font-extrabold text-[#162E6E]">
                            {formatRupiah(getSeragamTarif(activeGeneratePos, "L", genLembagaNum))}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/80 border border-purple-100 shadow-2xs">
                          <div className="text-[10px] text-pink-700 font-bold uppercase">Santri Putri (P)</div>
                          <div className="text-sm font-extrabold text-[#162E6E]">
                            {formatRupiah(getSeragamTarif(activeGeneratePos, "P", genLembagaNum))}
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-purple-800">
                        ✨ Tabel matriks tetap 1 kolom Seragam ringkas dengan badge Putra/Putri otomatis.
                      </p>
                    </div>
                  );
                }

                if (isGenKegiatan) {
                  return (
                    <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Biaya Kegiatan & Perlengkapan (Tahunan):</span>
                        <span className="text-sm font-extrabold text-[#162E6E]">
                          {formatRupiah(getKegiatanTarif(activeGeneratePos, genLembagaNum))}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {genLembagaObj ? `Tarif khusus unit ${genLembagaObj.nama_lembaga}.` : "Tarif flat paket perlengkapan & operasional kegiatan tahun ajaran santri."}
                      </p>
                    </div>
                  );
                }

                if (isGenUjian) {
                  return (
                    <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Biaya Ujian 1 Tahun:</span>
                        <span className="text-sm font-extrabold text-[#162E6E]">
                          {formatRupiah(getUjianTarif(activeGeneratePos, genLembagaNum))}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {genLembagaObj ? `Tarif khusus unit ${genLembagaObj.nama_lembaga}.` : "Tarif flat evaluasi pembelajaran semester & tahunan seluruh santri."}
                      </p>
                    </div>
                  );
                }

                if (isGenPangkal) {
                  return (
                    <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3.5 space-y-1">
                      <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <span>🏷️</span> Uang Pangkal Bertingkat (Matriks 12 Tarif):
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Memiliki varian tarif Asrama/Non-Asrama, Umum/Alumni, dan Kuota 1/2/3. Gunakan tombol <strong>Set Kuota</strong> di tabel matriks untuk menentukan kuota santri perorangan.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Nominal Pokok Paket:</span>
                      <span className="text-base font-extrabold text-[#162E6E]">
                        {overrideNominal ? formatRupiah(overrideNominal) : "Rp 0"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      ✨ <strong>Otomatisasi Penuh:</strong> Santri penerima Beasiswa (Tahfidz, Anak Guru, Alumni, Dhuafa) akan otomatis menerima potongan biaya tanpa dihitung manual.
                    </p>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={generateSppMutation.isPending || !generatePosId}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#162E6E] hover:bg-[#122456] disabled:opacity-50 rounded-lg shadow-xs transition-colors"
                >
                  {generateSppMutation.isPending ? "Sedang Generate..." : "⚡ Generate Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL 2: TAMBAH TAGIHAN KHUSUS / MANUAL (POINT 1 INTEGRATED) */}
      {/* ═════════════════════════════════════════════════════════ */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Buat Tagihan Khusus / Manual</h3>
                <p className="text-xs text-slate-500">Pilih lembaga agar daftar siswa tersaring secara otomatis</p>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!manualSiswaId || !manualPosId || !manualNominal) {
                  toast.error("Lengkapi seluruh data wajib");
                  return;
                }
                addTagihanMutation.mutate({
                  siswa_id: manualSiswaId,
                  pos_id: manualPosId,
                  nama_tagihan: manualNama,
                  nominal_total: parseFloat(manualNominal),
                  bulan: manualBulan,
                  tahun_periode: manualTahun,
                  keterangan: manualKeterangan,
                  kuota: manualKuota || undefined,
                });
              }}
              className="p-6 space-y-4"
            >
              {/* Filter Lembaga Siswa (Point 1: Auto-filter students!) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Filter Lembaga Siswa <span className="text-slate-400 font-normal">(Menyaring nama siswa otomatis)</span>
                </label>
                <select
                  value={manualLembagaId}
                  onChange={(e) => {
                    setManualLembagaId(e.target.value);
                    setManualSiswaId(null);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white"
                >
                  <option value="">Semua Lembaga</option>
                  {lembagaList.map((l: any) => (
                    <option key={l.lembaga_id} value={l.lembaga_id}>
                      {l.nama_lembaga} ({l.singkatan})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilih Siswa (Hanya siswa lembaga terpilih!) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Siswa <span className="text-rose-500">*</span>
                  <span className="text-slate-400 font-normal ml-1">
                    ({manualFilteredSiswa.length} siswa tersedia)
                  </span>
                </label>
                <select
                  required
                  value={manualSiswaId || ""}
                  onChange={(e) => handleManualSiswaChange(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white font-medium"
                >
                  <option value="">Pilih santri...</option>
                  {manualFilteredSiswa.map((s: any) => (
                    <option key={s.siswa_id} value={s.siswa_id}>
                      {s.nama} ({s.nis}) - {s.kelas?.nama_kelas || "Tanpa Kelas"}
                    </option>
                  ))}
                </select>
                {manualSiswaId && (() => {
                  const s = allSiswa.find((item: any) => item.siswa_id === manualSiswaId);
                  if (!s) return null;
                  return (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded font-semibold ${isStudentAsrama(s) ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-slate-100 text-slate-600"}`}>
                        {isStudentAsrama(s) ? "Santri Asrama" : "Non-Asrama"}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-semibold ${s.jenis_kelamin === "L" ? "bg-sky-50 text-sky-700" : "bg-pink-50 text-pink-700"}`}>
                        {s.jenis_kelamin === "L" ? "Putra" : "Putri"}
                      </span>
                      <span className="px-1.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-800">
                        Jalur: {s.kategori_santri || "Umum"}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Pilih Pos & Auto-fill nominal/nama */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Pembayaran (Pos) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={manualPosId || ""}
                  onChange={(e) => handleManualPosChange(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white font-medium"
                >
                  {posList.map((p: any) => (
                    <option key={p.pos_id} value={p.pos_id}>
                      {p.nama_pos} ({p.tipe_pembayaran})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilihan Kuota jika Pos Uang Pangkal */}
              {(() => {
                const selectedPos = posList.find((p: any) => p.pos_id === manualPosId);
                const isKuota = selectedPos?.has_kuota || selectedPos?.kode_pos === "PANGKAL" || selectedPos?.nama_pos?.toLowerCase().includes("pangkal");
                if (!isKuota) return null;

                return (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Pilihan Kuota Uang Pangkal <span className="text-amber-600 font-normal">(Tarif otomatis terisi)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Kuota 1", "Kuota 2", "Kuota 3"].map((k) => {
                        const isSelected = manualKuota === k;
                        const s = allSiswa.find((item: any) => item.siswa_id === manualSiswaId);
                        const asr = s ? (isStudentAsrama(s) ? "Asrama" : "Non-Asrama") : "Asrama";
                        const kat = s?.kategori_santri || "Umum";
                        const sLembagaId = s?.kelas?.lembaga_id;
                        const val = getUangPangkalTarif(selectedPos, asr, kat, k, sLembagaId);

                        return (
                          <button
                            type="button"
                            key={k}
                            onClick={() => {
                              setManualKuota(k);
                              setManualNama(`${selectedPos?.nama_pos} (${k})`);
                              setManualNominal(val.toString());
                            }}
                            className={`py-2 px-2.5 rounded-xl border text-left transition-all ${isSelected
                                ? "border-[#162E6E] bg-emerald-50 text-[#162E6E] font-bold shadow-xs"
                                : "border-slate-200 hover:border-slate-300 text-slate-700 font-medium bg-white"
                              }`}
                          >
                            <div className="text-xs font-bold">{k}</div>
                            <div className="text-[10px] text-slate-500 font-normal">
                              {formatRupiah(val)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Tagihan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualNama}
                    onChange={(e) => setManualNama(e.target.value)}
                    placeholder="Contoh: SPP Oktober 2026"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nominal Tagihan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formatNumberWithDots(manualNominal)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setManualNominal(digits);
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] font-bold text-[#162E6E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bulan Periode
                  </label>
                  <select
                    value={manualBulan}
                    onChange={(e) => setManualBulan(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white font-medium"
                  >
                    {NAMA_BULAN.slice(1).map((b, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Periode
                  </label>
                  <input
                    type="number"
                    value={manualTahun}
                    onChange={(e) => setManualTahun(parseInt(e.target.value, 10) || new Date().getFullYear())}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan Tambahan</label>
                <textarea
                  rows={2}
                  value={manualKeterangan}
                  onChange={(e) => setManualKeterangan(e.target.value)}
                  placeholder="Catatan tagihan khusus..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addTagihanMutation.isPending || !manualSiswaId || !manualNominal}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#162E6E] hover:bg-[#122456] disabled:opacity-50 rounded-lg shadow-xs transition-colors"
                >
                  {addTagihanMutation.isPending ? "Menyimpan..." : "Simpan Tagihan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL 3: DETAIL RINCIAN TAGIHAN & SUB-ITEMS */}
      {/* ═════════════════════════════════════════════════════════ */}
      {selectedDetailTagihan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selectedDetailTagihan.nama_tagihan}</h3>
                <p className="text-xs text-slate-500">
                  Santri: <span className="font-semibold text-slate-800">{selectedDetailTagihan.siswa?.nama}</span> (NIS: {selectedDetailTagihan.siswa?.nis})
                </p>
              </div>
              <button
                onClick={() => setSelectedDetailTagihan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Financial Status Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Biaya</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {formatRupiah(selectedDetailTagihan.nominal_total)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                  <div className="text-[10px] uppercase font-bold text-emerald-800">Terbayar</div>
                  <div className="text-sm font-extrabold text-emerald-700 mt-0.5">
                    {formatRupiah(selectedDetailTagihan.nominal_terbayar || 0)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200">
                  <div className="text-[10px] uppercase font-bold text-rose-800">Sisa Tunggakan</div>
                  <div className="text-sm font-extrabold text-rose-700 mt-0.5">
                    {selectedDetailTagihan.status === "Lunas"
                      ? "Rp 0"
                      : formatRupiah(selectedDetailTagihan.sisa_tagihan)}
                  </div>
                </div>
              </div>

              {/* Sub-Komponen Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Rincian Komponen Biaya & Alokasi Kas</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Komponen</th>
                        <th className="py-2 px-3">Kas</th>
                        <th className="py-2 px-3 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(!selectedDetailTagihan.sub_items || selectedDetailTagihan.sub_items.length === 0) ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-slate-400">
                            Tagihan tunggal tanpa sub-komponen
                          </td>
                        </tr>
                      ) : (
                        selectedDetailTagihan.sub_items.map((si: any) => (
                          <tr key={si.tagihan_sub_id}>
                            <td className="py-2 px-3 font-medium text-slate-800">{si.nama_sub}</td>
                            <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{si.kode_akun || "-"}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {formatRupiah(si.nominal_bersih)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Link
                to={
                  selectedDetailTagihan?.siswa_id
                    ? `/keuangan/loket-kasir?siswa_id=${selectedDetailTagihan.siswa_id}`
                    : selectedDetailTagihan?.siswa?.siswa_id
                    ? `/keuangan/loket-kasir?siswa_id=${selectedDetailTagihan.siswa.siswa_id}`
                    : "/keuangan/loket-kasir"
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#162E6E] hover:bg-[#122456] text-white shadow-xs transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Bayar di Kasir Loket
              </Link>
              <button
                onClick={() => setSelectedDetailTagihan(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL 4: SET / UBAH KUOTA UANG PANGKAL SANTRI (12-TIER MATRIX) */}
      {/* ═════════════════════════════════════════════════════════ */}
      {kuotaModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-[#162E6E] to-[#1D4ED8] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span>🏷️</span>
                  <span>{kuotaModalData.existingTagihan ? "Ubah Kuota Uang Pangkal" : "Tentukan Kuota Uang Pangkal"}</span>
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Matriks Tarif Bertingkat Santri Baru TA 2026/2027
                </p>
              </div>
              <button
                onClick={() => setKuotaModalData(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Profil Santri & Identifikasi Otomatis */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">{kuotaModalData.siswa.nama}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    NIS: {kuotaModalData.siswa.nis} • Kelas {kuotaModalData.siswa.kelas?.nama_kelas || "-"}
                    {kuotaModalData.siswa.kelas?.lembaga_id && (
                      <span className="ml-1 text-[#162E6E] font-semibold">
                        • {lembagaList.find((l: any) => l.lembaga_id === kuotaModalData.siswa.kelas?.lembaga_id)?.singkatan || `Unit ${kuotaModalData.siswa.kelas?.lembaga_id}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isStudentAsrama(kuotaModalData.siswa)
                        ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                        : "bg-slate-200 text-slate-700"
                      }`}
                  >
                    {isStudentAsrama(kuotaModalData.siswa) ? "Santri Asrama (Mukim)" : "Non-Asrama (Laju)"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {kuotaModalData.siswa.jenis_kelamin === "L" ? "Santri Putra (L)" : "Santri Putri (P)"}
                  </span>
                </div>
              </div>

              {/* Jalur Pendaftaran / Kategori Santri Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Kategori / Jalur Santri:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "Umum", label: "Umum", desc: "Jalur Pendaftar Reguler / Umum" },
                    { key: "Alumni / Anak Guru", label: "Alumni / Anak Guru", desc: "Keluarga Besar YKUI (Diskon Khusus)" },
                  ].map((kat) => {
                    const isSelected = selectedKategoriSantri === kat.key;
                    return (
                      <button
                        type="button"
                        key={kat.key}
                        onClick={() => {
                          setSelectedKategoriSantri(kat.key);
                          const asramaStr = isStudentAsrama(kuotaModalData.siswa) ? "Asrama" : "Non-Asrama";
                          const newNominal = getUangPangkalTarif(kuotaModalData.pos, asramaStr, kat.key, selectedKuota, kuotaModalData.siswa.kelas?.lembaga_id);
                          setCustomKuotaNominal(newNominal.toString());
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${isSelected
                            ? "border-[#162E6E] bg-emerald-50/70 ring-2 ring-[#162E6E]/20"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{kat.label}</span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[#162E6E]" />}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{kat.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pilihan 3 Kuota */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Pilih Kuota (Tingkatan Biaya):
                </label>
                <div className="space-y-2">
                  {[
                    { key: "Kuota 1", label: "Kuota 1", badge: "Gelombang 1" },
                    { key: "Kuota 2", label: "Kuota 2", badge: "Gelombang 2" },
                    { key: "Kuota 3", label: "Kuota 3", badge: "Gelombang 3" },
                  ].map((k) => {
                    const asramaStr = isStudentAsrama(kuotaModalData.siswa) ? "Asrama" : "Non-Asrama";
                    const nominalVal = getUangPangkalTarif(kuotaModalData.pos, asramaStr, selectedKategoriSantri, k.key, kuotaModalData.siswa.kelas?.lembaga_id);
                    const isSelected = selectedKuota === k.key;

                    return (
                      <div
                        key={k.key}
                        onClick={() => {
                          setSelectedKuota(k.key);
                          setCustomKuotaNominal(nominalVal.toString());
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isSelected
                            ? "border-[#162E6E] bg-emerald-50/80 shadow-xs ring-1 ring-[#162E6E]"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-[#162E6E] bg-[#162E6E]" : "border-slate-300"
                              }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                              <span>{k.label}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {k.badge}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {asramaStr} • {selectedKategoriSantri}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-[#162E6E]">
                            {formatRupiah(nominalVal)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nominal Tagihan Diterapkan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Tagihan Diterapkan (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberWithDots(customKuotaNominal)}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setCustomKuotaNominal(digits);
                  }}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] font-bold text-[#162E6E]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Nominal terisi otomatis sesuai status {isStudentAsrama(kuotaModalData.siswa) ? "Asrama" : "Non-Asrama"} & {selectedKategoriSantri}. Dapat diubah jika ada dispensasi khusus yayasan.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setKuotaModalData(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={setKuotaMutation.isPending || !customKuotaNominal}
                  onClick={() => {
                    setKuotaMutation.mutate({
                      siswa_id: kuotaModalData.siswa.siswa_id,
                      pos_id: kuotaModalData.pos.pos_id,
                      kuota: selectedKuota,
                      nominal: parseFloat(customKuotaNominal),
                      kategori_santri: selectedKategoriSantri,
                      tahun_periode: filterTahun,
                    });
                  }}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#162E6E] hover:bg-[#122456] rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {setKuotaMutation.isPending ? "Menyimpan..." : "Simpan & Terapkan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL 5: DETAIL HISTORY PEMBAYARAN PERSISWA (POINT 4)     */}
      {/* ═════════════════════════════════════════════════════════ */}
      {selectedStudentForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-white">
                      Buku Rekap Keuangan & Riwayat Pembayaran Santri
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      TA {filterTahun}/{filterTahun + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 flex-wrap">
                    <span className="font-semibold text-white">{selectedStudentForHistory.nama}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-300">NIS: {selectedStudentForHistory.nis}</span>
                    <span>•</span>
                    <span className="text-slate-300">Kelas: {selectedStudentForHistory.kelas?.nama_kelas || "-"}</span>
                    <span>•</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isStudentAsrama(selectedStudentForHistory) ? "bg-indigo-900/60 text-indigo-200 border border-indigo-700/50" : "bg-slate-700 text-slate-200"}`}>
                      {isStudentAsrama(selectedStudentForHistory) ? "Asrama Mukim" : "Non-Asrama"}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${selectedStudentForHistory.jenis_kelamin === "L" ? "bg-sky-900/60 text-sky-200" : "bg-pink-900/60 text-pink-200"}`}>
                      {selectedStudentForHistory.jenis_kelamin === "L" ? "Putra" : "Putri"}
                    </span>
                    {selectedStudentForHistory.kategori_santri && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-900/60 text-amber-200 border border-amber-700/50">
                        {selectedStudentForHistory.kategori_santri}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForHistory(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50/50">
              {(isLoadingHistoryTagihan || isLoadingHistoryTransaksi) ? (
                <div className="py-20 text-center text-slate-400">
                  <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-[#162E6E]" />
                  <p className="text-xs font-semibold text-slate-600">Memuat buku rekap riwayat pembayaran santri...</p>
                </div>
              ) : (
                <>
                  {/* 3 FINANCIAL SUMMARY CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Total Kewajiban Biaya
                      </div>
                      <div className="text-xl font-extrabold text-slate-900 mt-1">
                        {formatRupiah(historySummary.totalKewajiban)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Total seluruh tagihan aktif TA {filterTahun}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Total Sudah Dibayar
                      </div>
                      <div className="text-xl font-extrabold text-[#162E6E] mt-1">
                        {formatRupiah(historySummary.totalTerbayar)}
                      </div>
                      <div className="text-[11px] text-emerald-700/80 mt-0.5">
                        Lunas & terverifikasi sistem kasir
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border shadow-2xs ${historySummary.totalSisa > 0 ? "bg-rose-50/70 border-rose-200" : "bg-emerald-50/70 border-emerald-200"}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${historySummary.totalSisa > 0 ? "text-rose-800" : "text-emerald-800"}`}>
                        Sisa Tunggakan
                      </div>
                      <div className={`text-xl font-extrabold mt-1 ${historySummary.totalSisa > 0 ? "text-rose-600" : "text-[#162E6E]"}`}>
                        {historySummary.totalSisa > 0 ? formatRupiah(historySummary.totalSisa) : "Lunas (Rp 0)"}
                      </div>
                      <div className={`text-[11px] mt-0.5 ${historySummary.totalSisa > 0 ? "text-rose-700/80" : "text-emerald-700/80"}`}>
                        {historySummary.totalSisa > 0 ? "Wajib diselesaikan wali santri" : "Alhamdulillah bebas tunggakan"}
                      </div>
                    </div>
                  </div>

                  {/* TABS SWITCHER */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setHistoryTab("pos")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${historyTab === "pos"
                          ? "bg-[#162E6E] text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      <Table className="w-3.5 h-3.5" />
                      Rincian Seluruh Pos Biaya & SPP 12 Bulan
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryTab("transaksi")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${historyTab === "transaksi"
                          ? "bg-[#162E6E] text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Log Riwayat Pembayaran Kasir ({studentHistoryTransaksi.length})
                    </button>
                  </div>

                  {/* TAB 1: RINCIAN POS BIAYA LENGKAP */}
                  {historyTab === "pos" && (
                    <div className="space-y-6">
                      {/* SEKSI 1: POS NON-BULANAN (Uang Pangkal, Seragam, Kegiatan, Ujian, dll.) */}
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                        <div className="px-4 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span>🏷️</span>
                            <span>A. Pos Pembayaran Non-Bulanan (Uang Pangkal & Biaya Tahunan)</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">Sekali Bayar / Tahunan</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                                <th className="py-2.5 px-3.5">Pos Pembayaran</th>
                                <th className="py-2.5 px-3.5">Keterangan / Kategori</th>
                                <th className="py-2.5 px-3.5 text-right">Nominal Tarif</th>
                                <th className="py-2.5 px-3.5 text-right">Terbayar</th>
                                <th className="py-2.5 px-3.5 text-right">Sisa Tagihan</th>
                                <th className="py-2.5 px-3.5 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {posList
                                .filter((p: any) => p.tipe_pembayaran !== "Bulanan" && p.kode_pos !== "SPP" && !p.nama_pos?.toLowerCase().includes("spp"))
                                .map((pos: any) => {
                                  const t = studentHistoryTagihan.find((item: any) => item.pos_id === pos.pos_id && !item.bulan);
                                  const isPangkal = pos.has_kuota || pos.kode_pos === "PANGKAL" || pos.nama_pos?.toLowerCase().includes("pangkal");
                                  const isSeragam = pos.kode_pos === "SERAGAM" || pos.nama_pos?.toLowerCase().includes("seragam");

                                  let spec = "-";
                                  if (t) {
                                    spec = t.keterangan || (t.kuota ? `${t.kuota} • ${t.asrama || ""}` : pos.tipe_pembayaran);
                                  } else if (isPangkal) {
                                    spec = "Belum Di-Set Kuota";
                                  } else if (isSeragam) {
                                    spec = selectedStudentForHistory.jenis_kelamin === "L" ? "Seragam Putra" : "Seragam Putri";
                                  }

                                  const nom = t ? t.nominal_total : 0;
                                  const bayar = t ? (t.nominal_terbayar || 0) : 0;
                                  const sisa = t ? t.sisa_tagihan : 0;
                                  const status = t ? t.status : "Belum Ditetapkan";

                                  return (
                                    <tr key={pos.pos_id} className="hover:bg-slate-50/70">
                                      <td className="py-2.5 px-3.5 font-bold text-slate-800">
                                        {pos.nama_pos}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-slate-600 text-[11px]">
                                        {spec}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-right font-semibold text-slate-800">
                                        {t ? formatRupiah(nom) : "—"}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-right text-emerald-700 font-semibold">
                                        {t ? formatRupiah(bayar) : "—"}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-right font-bold text-slate-900">
                                        {t ? (
                                          sisa > 0 ? (
                                            <span className="text-rose-600">{formatRupiah(sisa)}</span>
                                          ) : (
                                            <span className="text-emerald-700">Rp 0</span>
                                          )
                                        ) : "—"}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-center">
                                        {status === "Lunas" ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            Lunas
                                          </span>
                                        ) : status === "Sebagian" ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                            Sebagian
                                          </span>
                                        ) : status === "Belum Bayar" ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                            Belum Bayar
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                            Belum Terbit
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* SEKSI 2: KARTU KONTROL SPP 12 BULAN (Bulan 1 s/d Bulan 12) */}
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                        <div className="px-4 py-3 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
                          <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <span>🏢</span>
                            <span>B. Kartu Kontrol Pembayaran SPP (12 Bulan / Periode {filterTahun})</span>
                          </div>
                          <span className="text-[10px] text-blue-700 font-semibold">
                            Status Hunian: {isStudentAsrama(selectedStudentForHistory) ? "Asrama (Mukim)" : "Non-Asrama (Laju)"}
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                                <th className="py-2.5 px-3.5 w-12 text-center">Bulan</th>
                                <th className="py-2.5 px-3.5">Nama Bulan</th>
                                <th className="py-2.5 px-3.5 text-right">Kewajiban SPP</th>
                                <th className="py-2.5 px-3.5 text-right">Terbayar</th>
                                <th className="py-2.5 px-3.5 text-right">Sisa</th>
                                <th className="py-2.5 px-3.5 text-center">Status</th>
                                <th className="py-2.5 px-3.5">Keterangan / Diskon</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {[
                                { num: 1, name: "Januari" },
                                { num: 2, name: "Februari" },
                                { num: 3, name: "Maret" },
                                { num: 4, name: "April" },
                                { num: 5, name: "Mei" },
                                { num: 6, name: "Juni" },
                                { num: 7, name: "Juli" },
                                { num: 8, name: "Agustus" },
                                { num: 9, name: "September" },
                                { num: 10, name: "Oktober" },
                                { num: 11, name: "November" },
                                { num: 12, name: "Desember" },
                              ].map((b) => {
                                const sppTagihan = studentHistoryTagihan.find(
                                  (t: any) =>
                                    (t.pos?.kode_pos === "SPP" || t.nama_tagihan?.toLowerCase().includes("spp")) &&
                                    t.bulan === b.num
                                );

                                const nom = sppTagihan?.nominal_total || 0;
                                const bayar = sppTagihan?.nominal_terbayar || 0;
                                const sisa = sppTagihan ? sppTagihan.sisa_tagihan : 0;
                                const status = sppTagihan ? sppTagihan.status : "Belum Terbit";

                                return (
                                  <tr key={b.num} className="hover:bg-slate-50/70">
                                    <td className="py-2 px-3.5 text-center font-mono text-slate-400 font-bold">
                                      {b.num}
                                    </td>
                                    <td className="py-2 px-3.5 font-bold text-slate-800">
                                      Bulan {b.name}
                                    </td>
                                    <td className="py-2 px-3.5 text-right font-semibold text-slate-800">
                                      {sppTagihan ? formatRupiah(nom) : "—"}
                                    </td>
                                    <td className="py-2 px-3.5 text-right text-emerald-700 font-semibold">
                                      {sppTagihan ? formatRupiah(bayar) : "—"}
                                    </td>
                                    <td className="py-2 px-3.5 text-right font-bold text-slate-900">
                                      {sppTagihan ? (
                                        sisa > 0 ? (
                                          <span className="text-rose-600">{formatRupiah(sisa)}</span>
                                        ) : (
                                          <span className="text-emerald-700">Rp 0</span>
                                        )
                                      ) : "—"}
                                    </td>
                                    <td className="py-2 px-3.5 text-center">
                                      {status === "Lunas" ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                          Lunas
                                        </span>
                                      ) : status === "Sebagian" ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                          Sebagian
                                        </span>
                                      ) : status === "Belum Bayar" ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                          Belum Bayar
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                                          Belum Terbit
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3.5 text-slate-500 text-[11px]">
                                      {sppTagihan?.keterangan || (sppTagihan?.sub_items?.some((si: any) => si.nominal_diskon > 0) ? "Potongan beasiswa aktif" : "-")}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: LOG RIWAYAT TRANSAKSI KASIR */}
                  {historyTab === "transaksi" && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                      <div className="px-4 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Receipt className="w-4 h-4 text-[#162E6E]" />
                          <span>Log Riwayat Pembayaran & Kuitansi Terbit</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Total: {studentHistoryTransaksi.length} transaksi
                        </span>
                      </div>

                      {studentHistoryTransaksi.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                          <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <p className="text-xs font-semibold text-slate-600">Belum ada riwayat transaksi</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Transaksi pembayaran yang dilakukan di loket kasir atau via transfer akan otomatis tercatat di sini.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                                <th className="py-2.5 px-3.5 w-32">No. Transaksi</th>
                                <th className="py-2.5 px-3.5 w-28">Tgl & Metode</th>
                                <th className="py-2.5 px-3.5 min-w-[340px]">Rincian Item & Status Tunggakan</th>
                                <th className="py-2.5 px-3.5 text-right w-28">Total Bayar</th>
                                <th className="py-2.5 px-3.5 text-center w-24">Status</th>
                                <th className="py-2.5 px-3.5 text-center w-28">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {studentHistoryTransaksi.map((trx: any) => (
                                <tr key={trx.transaksi_id} className="hover:bg-slate-50/70 align-top">
                                  <td className="py-3 px-3.5 font-mono font-bold text-[#162E6E]">
                                    {trx.nomor_transaksi}
                                  </td>
                                  <td className="py-3 px-3.5 text-slate-700">
                                    <div>{trx.tanggal_bayar || "-"}</div>
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[10px]">
                                      {trx.metode_pembayaran}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3.5">
                                    <div className="space-y-2">
                                      {trx.items?.map((it: any, itemIdx: number) => {
                                        const tagihan = it.tagihan;
                                        const nominalBayar = it.nominal_bayar || 0;
                                        const totalTagihan = tagihan?.nominal_total || nominalBayar;
                                        const sisaTagihan = tagihan?.sisa_tagihan ?? Math.max(0, totalTagihan - (tagihan?.nominal_terbayar || nominalBayar));
                                        const isLunas = sisaTagihan <= 0 || tagihan?.status === "Lunas";

                                        return (
                                          <div
                                            key={itemIdx}
                                            className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200 space-y-1.5 shadow-2xs"
                                          >
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                                                  {tagihan?.pos?.nama_pos || "Tagihan"}
                                                </span>
                                                <span>{tagihan?.nama_tagihan || "Item Tagihan"}</span>
                                              </div>
                                              {isLunas ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                  Lunas
                                                </span>
                                              ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                  Cicilan (Sebagian)
                                                </span>
                                              )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1.5 border-t border-slate-200/80">
                                              <div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Tagihan:</div>
                                                <div className="font-semibold text-slate-700">{formatRupiah(totalTagihan)}</div>
                                              </div>
                                              <div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">Dibayar Transaksi Ini:</div>
                                                <div className="font-extrabold text-[#162E6E]">{formatRupiah(nominalBayar)}</div>
                                              </div>
                                              <div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">Sisa Tunggakan:</div>
                                                <div className={`font-extrabold ${isLunas ? "text-emerald-700" : "text-rose-600"}`}>
                                                  {isLunas ? "Rp 0 (Lunas)" : formatRupiah(sisaTagihan)}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}

                                      {trx.catatan && (
                                        <div className="text-[11px] text-slate-600 italic bg-amber-50/70 p-2 rounded-lg border border-amber-200/80">
                                          <span className="font-bold text-amber-900 not-italic">Catatan Kasir:</span> {trx.catatan}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3.5 text-right font-black text-[#162E6E] text-sm">
                                    {formatRupiah(trx.total_bayar)}
                                  </td>
                                  <td className="py-3 px-3.5 text-center">
                                    <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      {trx.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedTrxForReceipt(trx)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#162E6E] hover:bg-[#122456] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                                      title="Lihat & Cetak Kuitansi Resmi"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      Lihat Struk
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-200/80 border border-slate-300 rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                Cetak Rekap Santri
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForHistory(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-200/80 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <Link
                  to={`/keuangan/loket-kasir?siswa_id=${selectedStudentForHistory.siswa_id}`}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#162E6E] hover:bg-[#122456] rounded-xl shadow-xs transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Bayar di Loket Kasir
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL STRUK / BUKTI PEMBAYARAN RESMI DARI RIWAYAT SISWA  */}
      {/* ═════════════════════════════════════════════════════════ */}
      <BuktiPembayaranModal
        isOpen={!!selectedTrxForReceipt}
        onClose={() => setSelectedTrxForReceipt(null)}
        data={
          selectedTrxForReceipt
            ? {
                nomor_transaksi: selectedTrxForReceipt.nomor_transaksi,
                tanggal_bayar: selectedTrxForReceipt.tanggal_bayar,
                created_at: selectedTrxForReceipt.created_at,
                siswa: selectedStudentForHistory || selectedTrxForReceipt.siswa,
                items: selectedTrxForReceipt.items?.map((it: any) => {
                  const tagihan = it.tagihan;
                  const total = tagihan?.nominal_total;
                  const sisa = tagihan?.sisa_tagihan;
                  const isCicilan = sisa !== undefined && sisa > 0;
                  return {
                    keterangan: tagihan?.nama_tagihan || tagihan?.pos?.nama_pos || "Biaya Pendidikan",
                    nominal: it.nominal_bayar,
                    nominal_total: total,
                    sisa_tagihan: sisa,
                    is_cicilan: isCicilan,
                  };
                }),
                total_bayar: selectedTrxForReceipt.total_bayar,
                metode_pembayaran: selectedTrxForReceipt.metode_pembayaran || "Tunai (Loket Kasir)",
                status: selectedTrxForReceipt.items?.some((it: any) => it.tagihan?.sisa_tagihan > 0)
                  ? "SEBAGIAN (CICILAN)"
                  : (selectedTrxForReceipt.status === "Sebagian" ? "SEBAGIAN (CICILAN)" : (selectedTrxForReceipt.status || "LUNAS")),
                petugas: "Admin Keuangan",
                catatan: selectedTrxForReceipt.catatan,
              }
            : null
        }
      />

    </div>
  );
}
