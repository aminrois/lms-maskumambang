import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Receipt,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  X,
  CreditCard,
  User,
  Coins,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
  ExternalLink,
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "@/lib/api/axios";
import BuktiPembayaranModal, { type BuktiPembayaranData } from "../components/BuktiPembayaranModal";

const API_BASE = "/keuangan";

// Helper Rupiah
const formatRupiah = (val?: number | string | null): string => {
  const num = typeof val === "number" ? val : parseFloat(String(val || 0)) || 0;
  return `Rp ${num.toLocaleString("id-ID")}`;
};

// Helper Format Tanggal & Jam
const formatTanggalWaktu = (isoString?: string | null): string => {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

export default function RiwayatTransaksiIndex() {
  // ── Filters State ───────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLembagaId, setSelectedLembagaId] = useState("");
  const [selectedMetode, setSelectedMetode] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [quickDatePreset, setQuickDatePreset] = useState<string>("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 25;

  // ── Modals State ────────────────────────────────────────────
  const [selectedTrxForDetail, setSelectedTrxForDetail] = useState<any | null>(null);
  const [selectedTrxForReceipt, setSelectedTrxForReceipt] = useState<any | null>(null);

  // 1. Fetch Lembaga List
  const { data: lembagaList = [] } = useQuery({
    queryKey: ["lembaga-list"],
    queryFn: async () => {
      const res = await apiClient.get("/lembaga");
      return res.data?.data || res.data || [];
    },
  });

  // Handle Quick Date Preset
  const handleDatePreset = (preset: "hari-ini" | "7-hari" | "bulan-ini" | "semua") => {
    setQuickDatePreset(preset);
    setCurrentPage(1);

    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === "hari-ini") {
      const tgl = formatDate(today);
      setTanggalMulai(tgl);
      setTanggalAkhir(tgl);
    } else if (preset === "7-hari") {
      const past = new Date(today);
      past.setDate(today.getDate() - 7);
      setTanggalMulai(formatDate(past));
      setTanggalAkhir(formatDate(today));
    } else if (preset === "bulan-ini") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setTanggalMulai(formatDate(firstDay));
      setTanggalAkhir(formatDate(today));
    } else {
      setTanggalMulai("");
      setTanggalAkhir("");
    }
  };

  // Reset All Filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedLembagaId("");
    setSelectedMetode("Semua");
    setSelectedStatus("Semua");
    setTanggalMulai("");
    setTanggalAkhir("");
    setQuickDatePreset("semua");
    setCurrentPage(1);
  };

  // 2. Fetch Riwayat Transaksi List
  const {
    data: riwayatResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      "keuangan",
      "riwayat-transaksi",
      searchTerm,
      selectedLembagaId,
      selectedMetode,
      selectedStatus,
      tanggalMulai,
      tanggalAkhir,
      currentPage,
    ],
    queryFn: async () => {
      const res = await apiClient.get(`${API_BASE}/riwayat`, {
        params: {
          search: searchTerm || undefined,
          lembaga_id: selectedLembagaId || undefined,
          metode: selectedMetode !== "Semua" ? selectedMetode : undefined,
          status: selectedStatus !== "Semua" ? selectedStatus : undefined,
          tanggal_mulai: tanggalMulai || undefined,
          tanggal_akhir: tanggalAkhir || undefined,
          page: currentPage,
          limit,
        },
      });
      return res.data;
    },
  });

  const transaksiList: any[] = riwayatResponse?.data || [];
  const pagination = riwayatResponse?.pagination || {
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  };
  const summary = riwayatResponse?.summary || {
    total_nominal: 0,
    total_transaksi: 0,
    total_tunai: 0,
    total_non_tunai: 0,
  };

  // Format data for BuktiPembayaranModal
  const receiptData: BuktiPembayaranData | null = useMemo(() => {
    if (!selectedTrxForReceipt) return null;
    const trx = selectedTrxForReceipt;
    return {
      nomor_transaksi: trx.nomor_transaksi,
      tanggal_bayar: trx.tanggal_bayar,
      created_at: trx.created_at,
      siswa: {
        nama: trx.siswa?.nama,
        nis: trx.siswa?.nis,
        kelas: {
          nama_kelas: trx.siswa?.kelas?.nama_kelas || "-",
        },
      },
      items: (trx.items || []).map((it: any) => ({
        keterangan: it.tagihan?.nama_tagihan || it.tagihan?.pos?.nama_pos || "Tagihan Pembayaran",
        nominal: it.nominal_bayar || 0,
        nominal_total: it.tagihan?.nominal_total || undefined,
        sisa_tagihan: it.tagihan?.nominal_sisa || 0,
        is_cicilan: (it.tagihan?.nominal_sisa || 0) > 0,
      })),
      total_bayar: trx.total_bayar,
      metode_pembayaran: trx.metode_pembayaran,
      status: trx.status,
      petugas: trx.kasir_nama || "Petugas Kasir",
      catatan: trx.catatan,
    };
  }, [selectedTrxForReceipt]);

  // Ekspor ke Excel
  const handleExportExcel = () => {
    if (transaksiList.length === 0) {
      alert("Tidak ada data transaksi yang dapat diekspor.");
      return;
    }

    const excelRows = transaksiList.map((t: any, idx: number) => {
      const itemsStr = (t.items || [])
        .map(
          (it: any) =>
            `${it.tagihan?.nama_tagihan || it.tagihan?.pos?.nama_pos || "Item"} (${formatRupiah(it.nominal_bayar)})`
        )
        .join("; ");

      return {
        No: idx + 1,
        "No. Transaksi": t.nomor_transaksi,
        "Tanggal Bayar": t.tanggal_bayar,
        "Waktu Transaksi": formatTanggalWaktu(t.created_at),
        "Nama Santri": t.siswa?.nama || "-",
        NIS: t.siswa?.nis || "-",
        NISN: t.siswa?.nisn || "-",
        Lembaga: t.siswa?.kelas?.lembaga?.nama_lembaga || "-",
        Kelas: t.siswa?.kelas?.nama_kelas || "-",
        "Total Bayar (Rp)": t.total_bayar,
        "Metode Pembayaran": t.metode_pembayaran,
        "Rekening Tujuan": t.rekening_tujuan?.nama_bank ? `${t.rekening_tujuan.nama_bank} - ${t.rekening_tujuan.nomor_rekening}` : "-",
        "Petugas Kasir": t.kasir_nama || "-",
        Status: t.status,
        Catatan: t.catatan || "-",
        "Rincian Pos Pembayaran": itemsStr,
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat Transaksi");
    const tgl = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Laporan_Riwayat_Transaksi_${tgl}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* ═════════════════════════════════════════════════════════ */}
        {/* HEADER BAR                                              */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <span>Keuangan & SPP</span>
              <span>/</span>
              <span className="text-slate-600 font-semibold">Riwayat Transaksi</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#162E6E] to-[#1D4ED8] text-white flex items-center justify-center shadow-md">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Riwayat & Jurnal Transaksi
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arsip lengkap seluruh transaksi kasir loket, transfer bank santri, dan riwayat cetak bukti pembayaran.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#162E6E]" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#162E6E] hover:bg-[#122456] rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* SUMMARY STATS BANNER                                    */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Uang Masuk */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Total Uang Masuk</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {isLoading ? "..." : formatRupiah(summary.total_nominal)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Sesuai filter aktif saat ini</p>
            </div>
          </div>

          {/* Card 2: Total Transaksi */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Total Transaksi</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#162E6E] flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#162E6E] tracking-tight">
                {isLoading ? "..." : `${summary.total_transaksi} Transaksi`}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {transaksiList.length} ditampilkan pada halaman ini
              </p>
            </div>
          </div>

          {/* Card 3: Kasir Loket (Tunai) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Penerimaan Tunai</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-indigo-700 tracking-tight">
                {isLoading ? "..." : formatRupiah(summary.total_tunai)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Melalui loket kasir pesantren</p>
            </div>
          </div>

          {/* Card 4: Non-Tunai (Transfer / QRIS) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Non-Tunai (Bank / QRIS)</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-cyan-700 tracking-tight">
                {isLoading ? "..." : formatRupiah(summary.total_non_tunai)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Transfer bank & QRIS wali murid</p>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* FILTER CONTROL BAR                                      */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Filter className="w-4 h-4 text-[#162E6E]" />
              <span>Filter & Pencarian Jurnal</span>
            </div>
            {(searchTerm || selectedLembagaId || selectedMetode !== "Semua" || selectedStatus !== "Semua" || tanggalMulai || tanggalAkhir) && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Semua Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari No. TRX / Nama / NIS..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] transition-all"
              />
            </div>

            {/* 2. Filter Lembaga */}
            <div>
              <select
                value={selectedLembagaId}
                onChange={(e) => {
                  setSelectedLembagaId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] font-medium text-slate-700 transition-all"
              >
                <option value="">Semua Unit Lembaga</option>
                {lembagaList.map((lem: any) => (
                  <option key={lem.lembaga_id} value={lem.lembaga_id}>
                    {lem.nama_lembaga}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Filter Metode Pembayaran */}
            <div>
              <select
                value={selectedMetode}
                onChange={(e) => {
                  setSelectedMetode(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] font-medium text-slate-700 transition-all"
              >
                <option value="Semua">Semua Metode Pembayaran</option>
                <option value="Tunai / Loket">Tunai (Loket Kasir)</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>

            {/* 4. Filter Status */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] font-medium text-slate-700 transition-all"
              >
                <option value="Semua">Semua Status</option>
                <option value="Disetujui">Disetujui / Lunas</option>
                <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
          </div>

          {/* Date Presets & Custom Range */}
          <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Quick preset buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 font-medium mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Rentang:
              </span>
              <button
                onClick={() => handleDatePreset("semua")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  quickDatePreset === "semua"
                    ? "bg-[#162E6E] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => handleDatePreset("hari-ini")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  quickDatePreset === "hari-ini"
                    ? "bg-[#162E6E] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => handleDatePreset("7-hari")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  quickDatePreset === "7-hari"
                    ? "bg-[#162E6E] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                7 Hari Terakhir
              </button>
              <button
                onClick={() => handleDatePreset("bulan-ini")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  quickDatePreset === "bulan-ini"
                    ? "bg-[#162E6E] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Bulan Ini
              </button>
            </div>

            {/* Custom Date Pickers */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Kustom:</span>
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => {
                  setTanggalMulai(e.target.value);
                  setQuickDatePreset("custom");
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-[#162E6E]"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={tanggalAkhir}
                onChange={(e) => {
                  setTanggalAkhir(e.target.value);
                  setQuickDatePreset("custom");
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-[#162E6E]"
              />
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* TRANSAKSI DATA TABLE                                    */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Daftar Transaksi Pembayaran</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                {summary.total_transaksi} Data
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">No. Transaksi / Waktu</th>
                  <th className="py-3 px-4">Santri & Lembaga</th>
                  <th className="py-3 px-4">Item Pembayaran</th>
                  <th className="py-3 px-4">Metode & Kasir</th>
                  <th className="py-3 px-4 text-right">Total Bayar</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#162E6E]" />
                      Memuat riwayat transaksi...
                    </td>
                  </tr>
                ) : transaksiList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-400">
                      <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                      <p className="font-semibold text-slate-700">Tidak ada transaksi ditemukan</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Cobalah mengubah kata kunci pencarian atau melonggarkan filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  transaksiList.map((trx: any) => {
                    const isTunai = trx.metode_pembayaran?.toLowerCase().includes("tunai");
                    return (
                      <tr key={trx.transaksi_id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. No Transaksi & Waktu */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => setSelectedTrxForDetail(trx)}
                            className="font-mono font-bold text-[#162E6E] hover:underline block text-left"
                          >
                            {trx.nomor_transaksi}
                          </button>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <span>{trx.tanggal_bayar}</span>
                            <span className="text-slate-300">•</span>
                            <span>{formatTanggalWaktu(trx.created_at).split(",")[1] || ""}</span>
                          </div>
                        </td>

                        {/* 2. Santri & Lembaga */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{trx.siswa?.nama || "-"}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono">NIS: {trx.siswa?.nis || "-"}</span>
                            <span className="text-slate-300">•</span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                              {trx.siswa?.kelas?.lembaga?.nama_lembaga || trx.siswa?.kelas?.nama_kelas || "-"}
                            </span>
                          </div>
                        </td>

                        {/* 3. Item Pembayaran */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="space-y-1">
                            {(trx.items || []).slice(0, 2).map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                                <span className="text-slate-700 truncate">
                                  {item.tagihan?.nama_tagihan || item.tagihan?.pos?.nama_pos || "Tagihan"}
                                </span>
                                <span className="font-bold text-slate-900 whitespace-nowrap">
                                  {formatRupiah(item.nominal_bayar)}
                                </span>
                              </div>
                            ))}
                            {(trx.items || []).length > 2 && (
                              <div className="text-[10px] text-slate-400 font-semibold">
                                +{(trx.items || []).length - 2} item lainnya...
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 4. Metode & Kasir */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                isTunai
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                  : "bg-cyan-50 text-cyan-700 border border-cyan-100"
                              }`}
                            >
                              {trx.metode_pembayaran}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{trx.kasir_nama || "Petugas Kasir"}</span>
                          </div>
                        </td>

                        {/* 5. Total Bayar */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-black text-slate-900 text-sm">
                            {formatRupiah(trx.total_bayar)}
                          </div>
                        </td>

                        {/* 6. Status */}
                        <td className="py-3.5 px-4 text-center">
                          {trx.status === "Disetujui" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Lunas / Disetujui
                            </span>
                          ) : trx.status === "Menunggu Verifikasi" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Menunggu
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-3 h-3" />
                              Ditolak
                            </span>
                          )}
                        </td>

                        {/* 7. Aksi */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedTrxForReceipt(trx)}
                              className="p-1.5 text-slate-600 hover:text-[#162E6E] hover:bg-slate-100 rounded-lg transition-colors"
                              title="Cetak Bukti Pembayaran (Struk)"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSelectedTrxForDetail(trx)}
                              className="p-1.5 text-slate-600 hover:text-[#162E6E] hover:bg-slate-100 rounded-lg transition-colors"
                              title="Lihat Rincian Lengkap"
                            >
                              <Eye className="w-4 h-4" />
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

          {/* Pagination Bar */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Menampilkan{" "}
                <span className="font-bold text-slate-900">
                  {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}
                </span>{" "}
                -{" "}
                <span className="font-bold text-slate-900">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{" "}
                dari <span className="font-bold text-slate-900">{pagination.total}</span> total transaksi
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-1 font-semibold text-slate-800">
                  Halaman {pagination.page} dari {pagination.totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL DETAIL TRANSAKSI                                  */}
      {/* ═════════════════════════════════════════════════════════ */}
      {selectedTrxForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#162E6E] to-[#1D4ED8] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-bold">Rincian Transaksi</h3>
                  <p className="text-xs text-blue-100 font-mono">
                    {selectedTrxForDetail.nomor_transaksi}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrxForDetail(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Header Status & Nominal */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total Pembayaran
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {formatRupiah(selectedTrxForDetail.total_bayar)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Tanggal: {selectedTrxForDetail.tanggal_bayar} • Waktu:{" "}
                    {formatTanggalWaktu(selectedTrxForDetail.created_at)}
                  </div>
                </div>

                <div className="text-right">
                  {selectedTrxForDetail.status === "Disetujui" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Lunas / Disetujui
                    </span>
                  ) : selectedTrxForDetail.status === "Menunggu Verifikasi" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3.5 h-3.5" /> Menunggu Verifikasi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5" /> Ditolak
                    </span>
                  )}
                  <div className="text-[11px] text-slate-500 mt-1.5">
                    Metode: <span className="font-bold text-slate-800">{selectedTrxForDetail.metode_pembayaran}</span>
                  </div>
                </div>
              </div>

              {/* Santri & Lembaga Info */}
              <div className="grid grid-cols-2 gap-4 border border-slate-100 p-4 rounded-xl">
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Identitas Santri:</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedTrxForDetail.siswa?.nama || "-"}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    NIS: {selectedTrxForDetail.siswa?.nis || "-"}
                  </div>
                  <div className="text-slate-500">
                    Kelas: {selectedTrxForDetail.siswa?.kelas?.nama_kelas || "-"} (
                    {selectedTrxForDetail.siswa?.kelas?.lembaga?.nama_lembaga || "-"})
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Petugas & Penerima:</span>
                  <div className="font-bold text-slate-800">
                    Kasir: {selectedTrxForDetail.kasir_nama || "Petugas Kasir"}
                  </div>
                  {selectedTrxForDetail.rekening_tujuan && (
                    <div className="text-slate-500 mt-0.5">
                      Rekening: {selectedTrxForDetail.rekening_tujuan.nama_bank} -{" "}
                      {selectedTrxForDetail.rekening_tujuan.nomor_rekening}
                    </div>
                  )}
                  {selectedTrxForDetail.catatan && (
                    <div className="text-slate-500 mt-1 italic">
                      Catatan: "{selectedTrxForDetail.catatan}"
                    </div>
                  )}
                </div>
              </div>

              {/* Rincian Pos Pembayaran */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Item Pos Pembayaran:</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Pos Tagihan</th>
                        <th className="py-2.5 px-3 text-right">Nominal Tagihan</th>
                        <th className="py-2.5 px-3 text-right">Nominal Bayar</th>
                        <th className="py-2.5 px-3 text-right">Sisa Tagihan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedTrxForDetail.items || []).map((it: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {it.tagihan?.nama_tagihan || it.tagihan?.pos?.nama_pos || "Tagihan"}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {formatRupiah(it.tagihan?.nominal_total)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatRupiah(it.nominal_bayar)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {formatRupiah(it.tagihan?.nominal_sisa)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lampiran Bukti Transfer (Jika ada) */}
              {selectedTrxForDetail.bukti_transfer_url && (
                <div className="border border-slate-200 p-4 rounded-xl">
                  <span className="font-bold text-slate-800 block mb-2">
                    Foto Bukti Transfer Bank:
                  </span>
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedTrxForDetail.bukti_transfer_url}
                      alt="Bukti Transfer"
                      className="max-h-48 rounded-lg border border-slate-200 object-contain shadow-xs"
                    />
                    <div className="space-y-1 text-slate-600">
                      <div>
                        Bank Pengirim:{" "}
                        <span className="font-bold text-slate-800">
                          {selectedTrxForDetail.bank_pengirim || "-"}
                        </span>
                      </div>
                      <div>
                        No. Rekening:{" "}
                        <span className="font-bold text-slate-800">
                          {selectedTrxForDetail.nomor_rekening_pengirim || "-"}
                        </span>
                      </div>
                      <div>
                        Atas Nama:{" "}
                        <span className="font-bold text-slate-800">
                          {selectedTrxForDetail.atas_nama_pengirim || "-"}
                        </span>
                      </div>
                      <a
                        href={selectedTrxForDetail.bukti_transfer_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#162E6E] font-bold hover:underline mt-2"
                      >
                        Buka Gambar Ukuran Penuh <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedTrxForDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Tutup
              </button>

              <button
                onClick={() => {
                  const trx = selectedTrxForDetail;
                  setSelectedTrxForDetail(null);
                  setSelectedTrxForReceipt(trx);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#162E6E] hover:bg-[#122456] rounded-xl shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Struk Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL CETAK BUKTI PEMBAYARAN RESMI                      */}
      {/* ═════════════════════════════════════════════════════════ */}
      <BuktiPembayaranModal
        isOpen={Boolean(selectedTrxForReceipt)}
        onClose={() => setSelectedTrxForReceipt(null)}
        data={receiptData}
      />
    </div>
  );
}
