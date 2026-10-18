import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  FileText,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Building2,
  Receipt,
  Printer,
  ChevronRight,
  RefreshCw,
  Phone,
  CreditCard,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import BuktiPembayaranModal from "../components/BuktiPembayaranModal";

const API_BASE = "/keuangan";

// Helper Rupiah
const formatRupiah = (val?: number | string | null): string => {
  const num = typeof val === "number" ? val : parseFloat(String(val || 0)) || 0;
  return `Rp ${num.toLocaleString("id-ID")}`;
};

export default function KeuanganDashboardIndex() {
  const [selectedLembagaId, setSelectedLembagaId] = useState<string>("");
  const [selectedTrxForReceipt, setSelectedTrxForReceipt] = useState<any | null>(null);

  // 1. Fetch Lembaga List
  const { data: lembagaList = [] } = useQuery({
    queryKey: ["lembaga-list"],
    queryFn: async () => {
      const res = await apiClient.get("/lembaga");
      return res.data?.data || res.data || [];
    },
  });

  // 2. Fetch Dashboard Summary
  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    refetch: refetchSummary,
    isFetching,
  } = useQuery({
    queryKey: ["keuangan", "dashboard-summary", selectedLembagaId],
    queryFn: async () => {
      const res = await apiClient.get(`${API_BASE}/summary`, {
        params: {
          lembaga_id: selectedLembagaId || undefined,
        },
      });
      return res.data?.data || res.data || {};
    },
  });

  // Calculations
  const totalPenerimaan = summaryData?.total_penerimaan || 0;
  const totalTunggakan = summaryData?.total_tunggakan || 0;
  const totalKewajiban = totalPenerimaan + totalTunggakan;
  const realisasiPersen = totalKewajiban > 0 ? Math.round((totalPenerimaan / totalKewajiban) * 100) : 0;
  const penerimaanHariIni = summaryData?.penerimaan_hari_ini || 0;
  const countTransaksiHariIni = summaryData?.count_transaksi_hari_ini || 0;
  const countSantriMenunggak = summaryData?.count_santri_menunggak || 0;
  const pendingTransferCount = summaryData?.transaksi_menunggu_verifikasi || 0;

  const breakdownPos = summaryData?.breakdown_pos || [];
  const distribusiKas = summaryData?.distribusi_kas || [];
  const topTunggakanSantri = summaryData?.top_tunggakan_santri || [];
  const transaksiTerbaru = summaryData?.transaksi_terbaru || [];

  // Summary of all Pos
  const posSummary = useMemo(() => {
    let tagihan = 0;
    let terbayar = 0;
    let sisa = 0;
    breakdownPos.forEach((p: any) => {
      tagihan += p.total_tagihan || 0;
      terbayar += p.total_terbayar || 0;
      sisa += p.total_sisa || 0;
    });
    const pct = tagihan > 0 ? Math.round((terbayar / tagihan) * 100) : 0;
    return { tagihan, terbayar, sisa, pct };
  }, [breakdownPos]);

  return (
    <div className="p-6 space-y-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
      {/* ═════════════════════════════════════════════════════════ */}
      {/* HEADER BAR: TITLE, FILTER, & ACTION SHORTCUTS           */}
      {/* ═════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#162E6E] to-[#1D4ED8] flex items-center justify-center text-white shadow-md">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Dashboard Keuangan
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-[#162E6E] font-semibold">
                Satu Pintu
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Ikhtisar penerimaan kas, monitoring tunggakan santri, dan distribusi dana terpusat
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Filter Unit Lembaga */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Building2 className="w-4 h-4 text-slate-500" />
            <select
              value={selectedLembagaId}
              onChange={(e) => setSelectedLembagaId(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">Semua Unit (Yayasan)</option>
              {lembagaList.map((l: any) => (
                <option key={l.lembaga_id} value={l.lembaga_id}>
                  {l.nama_lembaga} {l.singkatan ? `(${l.singkatan})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetchSummary()}
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-[#162E6E]" : ""}`} />
          </button>

          {/* Shortcut: Buka Loket Kasir */}
          <Link
            to="/keuangan/loket-kasir"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#162E6E] hover:bg-[#122456] text-white shadow-xs transition-colors"
          >
            <Wallet className="w-4 h-4" />
            Buka Kasir Loket
          </Link>

          {/* Shortcut: Tagihan Santri */}
          <Link
            to="/keuangan/tagihan"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            Matriks Tagihan
          </Link>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* TOP 4 KPI CARDS                                         */}
      {/* ═════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Penerimaan Kas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Kas Terkumpul
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#162E6E] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {isLoadingSummary ? "..." : formatRupiah(totalPenerimaan)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="inline-block px-1.5 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-[#162E6E]">
                {realisasiPersen}%
              </span>
              <span>Realisasi dari target</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Sisa Tunggakan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sisa Tunggakan
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600 tracking-tight">
              {isLoadingSummary ? "..." : formatRupiah(totalTunggakan)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{countSantriMenunggak}</span>
              <span>Santri belum melunasi</span>
            </div>
          </div>
        </div>

        {/* Card 3: Kas Harian Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Penerimaan Hari Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {isLoadingSummary ? "..." : formatRupiah(penerimaanHariIni)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{countTransaksiHariIni}</span>
              <span>Transaksi dilayani hari ini</span>
            </div>
          </div>
        </div>

        {/* Card 4: Menunggu Verifikasi Transfer */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Verifikasi Transfer
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700 tracking-tight">
              {isLoadingSummary ? "..." : `${pendingTransferCount} Transaksi`}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-slate-500">Bukti transfer baru</span>
              <Link
                to="/keuangan/verifikasi-transfer"
                className="font-bold text-[#162E6E] hover:underline flex items-center gap-0.5"
              >
                Periksa <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* SECTION 1: REALISASI PER POS PEMBAYARAN                  */}
      {/* ═════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#162E6E]"></span>
              Realisasi Penerimaan per Jenis Pembayaran
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Target total kewajiban dan progres dana terkumpul tiap pos biaya pendidikan
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            Total Pos: <span className="text-[#162E6E] font-bold">{breakdownPos.length} Pos Tagihan</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Jenis Tagihan (Pos)</th>
                <th className="py-3 px-4 w-28 text-center">Tipe</th>
                <th className="py-3 px-4 text-right">Target Tagihan</th>
                <th className="py-3 px-4 text-right">Terbayar</th>
                <th className="py-3 px-4 text-right">Sisa Tunggakan</th>
                <th className="py-3 px-4 w-48">Progres Realisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {breakdownPos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada data pos tagihan aktif pada filter ini.
                  </td>
                </tr>
              ) : (
                breakdownPos.map((pos: any, idx: number) => {
                  const pct = pos.persentase || 0;
                  return (
                    <tr key={pos.pos_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{pos.nama_pos}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Kode: {pos.kode_pos || "-"}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {pos.tipe_pembayaran}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        {formatRupiah(pos.total_tagihan)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(pos.total_terbayar)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-rose-600">
                        {pos.total_sisa > 0 ? formatRupiah(pos.total_sisa) : <span className="text-emerald-700">Lunas</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct >= 80 ? "bg-[#162E6E]" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-800 w-9 text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {breakdownPos.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <tr>
                  <td colSpan={3} className="py-3 px-4 uppercase text-slate-700">
                    Total Keseluruhan
                  </td>
                  <td className="py-3 px-4 text-right text-slate-900 font-extrabold">
                    {formatRupiah(posSummary.tagihan)}
                  </td>
                  <td className="py-3 px-4 text-right text-[#162E6E] font-extrabold">
                    {formatRupiah(posSummary.terbayar)}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-600 font-extrabold">
                    {formatRupiah(posSummary.sisa)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-black bg-blue-100 text-[#162E6E]">
                      {posSummary.pct}% Tercapai
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* SECTION 2: ALOKASI KAS MASUK (DISTRIBUSI KE UNIT / DAPUR)*/}
      {/* ═════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span>
              Distribusi Kas Masuk ke Kas Unit / Dapur (Penerimaan Terpusat)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Alokasi dana kas masuk yang didistribusikan ke unit madrasah, dapur pondok, dan sarpras
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            Satu Pintu Bendahara
          </span>
        </div>

        {distribusiKas.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Belum ada rincian alokasi kas internal untuk unit ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {distribusiKas.map((kas: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:shadow-xs transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{kas.nama_kas}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-[#162E6E]">
                    {kas.persentase}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Kas Diterima</div>
                    <div className="font-extrabold text-[#162E6E]">{formatRupiah(kas.terbayar)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-medium">Total Alokasi</div>
                    <div className="font-semibold text-slate-700">{formatRupiah(kas.total_alokasi)}</div>
                  </div>
                </div>

                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#162E6E] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, kas.persentase || 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* SECTION 3: BOTTOM OPERATIONAL WIDGETS (2 COLUMNS)       */}
      {/* ═════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Santri dengan Tunggakan Terbesar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Santri dengan Tunggakan Terbesar
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar santri prioritas untuk koordinasi tagihan dengan wali murid
                </p>
              </div>
              <Link
                to="/keuangan/tagihan"
                className="text-xs font-bold text-[#162E6E] hover:underline flex items-center gap-0.5"
              >
                Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {topTunggakanSantri.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Tidak ada santri yang memiliki tunggakan.
                </div>
              ) : (
                topTunggakanSantri.map((s: any) => (
                  <div key={s.siswa_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">{s.nama}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>NIS: {s.nis}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-700">{s.kelas}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-rose-600">
                          {formatRupiah(s.total_tunggakan)}
                        </div>
                        {s.no_hp_wali && s.no_hp_wali !== "-" ? (
                          <a
                            href={`https://wa.me/${s.no_hp_wali.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#162E6E] hover:underline flex items-center justify-end gap-1 mt-0.5 font-medium"
                          >
                            <Phone className="w-2.5 h-2.5" /> {s.no_hp_wali}
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400">No HP -</span>
                        )}
                      </div>

                      <Link
                        to={`/keuangan/loket-kasir?siswa_id=${s.siswa_id}`}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#162E6E] transition-colors"
                        title="Bayar di Loket Kasir"
                      >
                        <CreditCard className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Transaksi Kasir Terkini */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#162E6E]" />
                  Aktivitas Transaksi Kasir Terkini
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pembayaran tunai di loket kasir & transfer bank terbaru
                </p>
              </div>
              <Link
                to="/keuangan/loket-kasir"
                className="text-xs font-bold text-[#162E6E] hover:underline flex items-center gap-0.5"
              >
                Buka Kasir <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {transaksiTerbaru.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada transaksi pembayaran yang tercatat.
                </div>
              ) : (
                transaksiTerbaru.map((trx: any) => (
                  <div key={trx.transaksi_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {trx.siswa?.nama || "Santri"}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600">
                          {trx.siswa?.kelas?.nama_kelas || "-"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {trx.nomor_transaksi} • {trx.tanggal_bayar} • {trx.metode_pembayaran}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right font-extrabold text-xs text-[#162E6E]">
                        {formatRupiah(trx.total_bayar)}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTrxForReceipt(trx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="Lihat Bukti Pembayaran Resmi"
                      >
                        <Printer className="w-3 h-3 text-slate-500" />
                        Struk
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL BUKTI PEMBAYARAN RESMI                            */}
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
                siswa: selectedTrxForReceipt.siswa,
                items: selectedTrxForReceipt.items?.map((it: any) => ({
                  keterangan: it.tagihan?.nama_tagihan || it.tagihan?.pos?.nama_pos || "Biaya Pendidikan",
                  nominal: it.nominal_bayar,
                  nominal_total: it.tagihan?.nominal_total,
                  sisa_tagihan: it.tagihan?.sisa_tagihan,
                  is_cicilan: it.tagihan?.sisa_tagihan > 0,
                })),
                total_bayar: selectedTrxForReceipt.total_bayar,
                metode_pembayaran: selectedTrxForReceipt.metode_pembayaran || "Tunai (Loket Kasir)",
                status: selectedTrxForReceipt.items?.some((it: any) => it.tagihan?.sisa_tagihan > 0)
                  ? "SEBAGIAN (CICILAN)"
                  : (selectedTrxForReceipt.status || "LUNAS"),
                petugas: "Admin Keuangan",
                catatan: selectedTrxForReceipt.catatan,
              }
            : null
        }
      />
    </div>
  );
}
