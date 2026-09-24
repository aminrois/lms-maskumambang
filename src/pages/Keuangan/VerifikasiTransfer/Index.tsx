import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = "/api/v1/keuangan";

const formatRupiah = (val: number | string) => {
  const num = typeof val === "number" ? val : parseFloat(val) || 0;
  return "Rp " + num.toLocaleString("id-ID");
};

export default function VerifikasiTransferIndex() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Menunggu Verifikasi");
  const [rejectModalTrx, setRejectModalTrx] = useState<any>(null);
  const [alasanTolak, setAlasanTolak] = useState("");

  // Fetch Transaksi
  const { data: transaksiList = [], isLoading, refetch } = useQuery({
    queryKey: ["keuangan", "verifikasi-transfer", statusFilter, searchTerm],
    queryFn: async () => {
      const params: any = { metode: "Transfer Bank" };
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await axios.get(`${API_BASE}/riwayat`, { params });
      return res.data?.data || [];
    },
  });

  // Mutation Verifikasi
  const verifikasiMutation = useMutation({
    mutationFn: async ({ transaksi_id, status, alasan_penolakan }: any) => {
      const res = await axios.patch(`${API_BASE}/transaksi/${transaksi_id}/verifikasi`, {
        status,
        alasan_penolakan,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Transaksi berhasil di-${variables.status.toLowerCase()}`);
      setRejectModalTrx(null);
      setAlasanTolak("");
      queryClient.invalidateQueries({ queryKey: ["keuangan"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal memproses verifikasi.");
    },
  });

  const handleApprove = (trx: any) => {
    if (confirm(`Setujui pembayaran ${trx.nomor_transaksi} sebesar ${formatRupiah(trx.total_bayar)}?`)) {
      verifikasiMutation.mutate({
        transaksi_id: trx.transaksi_id,
        status: "Disetujui",
      });
    }
  };

  const handleReject = () => {
    if (!rejectModalTrx) return;
    if (!alasanTolak.trim()) {
      toast.error("Alasan penolakan wajib diisi agar wali santri mengetahui.");
      return;
    }
    verifikasiMutation.mutate({
      transaksi_id: rejectModalTrx.transaksi_id,
      status: "Ditolak",
      alasan_penolakan: alasanTolak,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#162E6E] to-[#1D4ED8] flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Verifikasi Pembayaran Transfer</h1>
            <p className="text-sm text-slate-500">Persetujuan bukti transfer bank yang dikonfirmasi oleh wali santri</p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold border border-slate-200 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor transaksi atau nama santri..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="Menunggu Verifikasi">Menunggu Verifikasi (Pending)</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
            <option value="all">Semua Status</option>
          </select>
        </div>
      </div>

      {/* List Card Transaksi */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white p-12 rounded-2xl text-center text-slate-400 border border-slate-100">
            Memuat data pengajuan transfer...
          </div>
        ) : transaksiList.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center text-slate-400 border border-slate-100">
            <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">Tidak ada data transfer pada status ini.</p>
          </div>
        ) : (
          transaksiList.map((trx: any) => {
            const isPending = trx.status === "Menunggu Verifikasi";
            const isApproved = trx.status === "Disetujui";
            const isRejected = trx.status === "Ditolak";

            return (
              <div
                key={trx.transaksi_id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#162E6E]">{trx.nomor_transaksi}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-700"
                            : isPending
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {trx.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Tanggal: {trx.tanggal_bayar} • Santri: <span className="font-semibold text-slate-700">{trx.siswa?.nama} ({trx.siswa?.nis})</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-500">Total Pembayaran</div>
                    <div className="text-lg font-extrabold text-[#162E6E]">{formatRupiah(trx.total_bayar)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Rekening Tujuan:</div>
                    <div className="font-bold text-slate-800">{trx.rekening_tujuan?.nama_bank || "Bank Pesantren"}</div>
                    <div className="text-slate-600">{trx.rekening_tujuan?.nomor_rekening} a.n {trx.rekening_tujuan?.atas_nama}</div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Rekening Pengirim (Wali):</div>
                    <div className="font-bold text-slate-800">{trx.bank_pengirim || "Transfer Online"}</div>
                    <div className="text-slate-600">
                      a.n <span className="font-bold text-slate-800">{trx.atas_nama_pengirim || "-"}</span>
                      {trx.nomor_rekening_pengirim && ` (${trx.nomor_rekening_pengirim})`}
                    </div>
                  </div>
                </div>

                {/* Items breakdown */}
                {trx.items && trx.items.length > 0 && (
                  <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100">
                    <div className="text-[11px] font-bold text-blue-900 mb-1">Pos Tagihan Yang Dibayar:</div>
                    <div className="space-y-1">
                      {trx.items.map((it: any) => (
                        <div key={it.item_id} className="flex justify-between text-xs text-slate-700">
                          <span>• {it.tagihan?.nama_tagihan || `Tagihan #${it.tagihan_id}`}</span>
                          <span className="font-bold text-[#162E6E]">{formatRupiah(it.nominal_bayar)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Catatan / Alasan Tolak */}
                {trx.catatan && (
                  <div className="text-xs text-slate-600 italic">
                    Catatan Wali: "{trx.catatan}"
                  </div>
                )}
                {isRejected && trx.alasan_penolakan && (
                  <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    Alasan Penolakan: {trx.alasan_penolakan}
                  </div>
                )}

                {/* Actions Button */}
                {isPending && (
                  <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setRejectModalTrx(trx);
                        setAlasanTolak("");
                      }}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-all flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Tolak Transfer
                    </button>
                    <button
                      onClick={() => handleApprove(trx)}
                      disabled={verifikasiMutation.isPending}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Setujui & Tandai Lunas
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tolak Transaksi */}
      {rejectModalTrx && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">Tolak Konfirmasi Transfer</h3>
            <p className="text-xs text-slate-500">
              Nomor: <span className="font-bold text-slate-700">{rejectModalTrx.nomor_transaksi}</span> • Total: {formatRupiah(rejectModalTrx.total_bayar)}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Penolakan *</label>
              <textarea
                rows={3}
                placeholder="Contoh: Dana belum masuk ke rekening pesantren / bukti transfer tidak valid..."
                value={alasanTolak}
                onChange={(e) => setAlasanTolak(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setRejectModalTrx(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={verifikasiMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                {verifikasiMutation.isPending ? "Menyimpan..." : "Tolak Pembayaran"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
