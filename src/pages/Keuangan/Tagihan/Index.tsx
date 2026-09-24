import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = "/api/v1/keuangan";

const formatRupiah = (val: number | string) => {
  const num = typeof val === "number" ? val : parseFloat(val) || 0;
  return "Rp " + num.toLocaleString("id-ID");
};

export default function TagihanSiswaIndex() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [posFilter, setPosFilter] = useState("all");

  // Modals
  const [showGenerateSppModal, setShowGenerateSppModal] = useState(false);
  const [showAddTagihanModal, setShowAddTagihanModal] = useState(false);

  // Form Generate SPP
  const [sppBulan, setSppBulan] = useState(new Date().getMonth() + 1);
  const [sppTahun, setSppTahun] = useState(new Date().getFullYear());
  const [sppNominal, setSppNominal] = useState(950000);

  // Form Tambah Tagihan Manual
  const [manualSiswaId, setManualSiswaId] = useState<number | null>(null);
  const [manualPosId, setManualPosId] = useState<number | null>(null);
  const [manualNama, setManualNama] = useState("");
  const [manualNominal, setManualNominal] = useState("");
  const [manualKeterangan, setManualKeterangan] = useState("");

  // Fetch Master Pos & Tarif
  const { data: masterData } = useQuery({
    queryKey: ["keuangan", "master"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/master`);
      return res.data?.data || {};
    },
  });

  const posList = masterData?.pos || [];

  // Fetch Tagihan Siswa
  const { data: tagihanList = [], isLoading, refetch } = useQuery({
    queryKey: ["keuangan", "tagihan-list", statusFilter, posFilter, searchTerm],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (posFilter !== "all") params.pos_id = posFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await axios.get(`${API_BASE}/tagihan`, { params });
      return res.data?.data || [];
    },
  });

  // Fetch Siswa List untuk dropdown manual tagihan
  const { data: siswaDropdown = [] } = useQuery({
    queryKey: ["siswa-dropdown"],
    queryFn: async () => {
      const res = await axios.get(`/api/v1/siswa`);
      return res.data?.data || res.data || [];
    },
  });

  // Mutation Generate SPP
  const generateSppMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post(`${API_BASE}/tagihan/generate-spp`, payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Generate tagihan SPP berhasil.");
      setShowGenerateSppModal(false);
      queryClient.invalidateQueries({ queryKey: ["keuangan"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal generate tagihan SPP.");
    },
  });

  // Mutation Tambah Tagihan Manual
  const addTagihanMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post(`${API_BASE}/tagihan/manual`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Tagihan baru berhasil dibuat!");
      setShowAddTagihanModal(false);
      setManualSiswaId(null);
      setManualNominal("");
      setManualNama("");
      setManualKeterangan("");
      queryClient.invalidateQueries({ queryKey: ["keuangan"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal membuat tagihan.");
    },
  });

  const handleGenerateSpp = () => {
    const sppPos = posList.find((p: any) => p.kode_pos === "SPP") || posList[0];
    if (!sppPos) {
      toast.error("Pos pembayaran SPP belum terkonfigurasi.");
      return;
    }
    generateSppMutation.mutate({
      pos_id: sppPos.pos_id,
      bulan: sppBulan,
      tahun_periode: sppTahun,
      nominal: sppNominal,
    });
  };

  const handleSaveManualTagihan = () => {
    if (!manualSiswaId || !manualPosId || !manualNominal) {
      toast.error("Semua data bertanda bintang wajib diisi.");
      return;
    }
    addTagihanMutation.mutate({
      siswa_id: manualSiswaId,
      pos_id: manualPosId,
      nama_tagihan: manualNama,
      nominal_total: manualNominal,
      keterangan: manualKeterangan,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#162E6E] to-[#1D4ED8] flex items-center justify-center text-white shadow-md">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Tagihan Santri</h1>
            <p className="text-sm text-slate-500">Kelola tagihan SPP bulanan, Uang Pangkal Kuota 1/2/3, Kegiatan & Seragam</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowGenerateSppModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Generate SPP Massal
          </button>

          <button
            onClick={() => setShowAddTagihanModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Tagihan Santri
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama santri, NIS, atau tagihan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="Belum Bayar">Belum Bayar</option>
            <option value="Sebagian">Sebagian (Cicilan)</option>
            <option value="Lunas">Lunas</option>
          </select>

          {/* Pos Filter */}
          <select
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Semua Pos Pembayaran</option>
            {posList.map((p: any) => (
              <option key={p.pos_id} value={p.pos_id}>
                {p.nama_pos}
              </option>
            ))}
          </select>

          <button
            onClick={() => refetch()}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Tagihan */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <th className="p-4">Santri</th>
                <th className="p-4">Pos & Nama Tagihan</th>
                <th className="p-4 text-right">Total Tagihan</th>
                <th className="p-4 text-right">Terbayar</th>
                <th className="p-4 text-right">Sisa Tunggakan</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Jatuh Tempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-400">
                    Memuat data tagihan santri...
                  </td>
                </tr>
              ) : tagihanList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-400">
                    Tidak ditemukan data tagihan sesuai filter.
                  </td>
                </tr>
              ) : (
                tagihanList.map((t: any) => {
                  const isLunas = t.status === "Lunas";
                  const isSebagian = t.status === "Sebagian";

                  return (
                    <tr key={t.tagihan_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{t.siswa?.nama || "-"}</div>
                        <div className="text-[11px] text-slate-500">
                          NIS: {t.siswa?.nis} • {t.siswa?.kelas?.nama_kelas || "-"}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{t.nama_tagihan}</div>
                        <div className="text-[11px] text-slate-500">{t.pos?.nama_pos}</div>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-800">
                        {formatRupiah(t.nominal_total)}
                      </td>
                      <td className="p-4 text-right font-bold text-emerald-600">
                        {formatRupiah(t.nominal_terbayar)}
                      </td>
                      <td className="p-4 text-right font-bold text-rose-600">
                        {formatRupiah(t.sisa_tagihan)}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isLunas
                              ? "bg-emerald-50 text-emerald-700"
                              : isSebagian
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-[11px]">
                        {t.jatuh_tempo || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Generate SPP Massal */}
      {showGenerateSppModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">Generate Tagihan SPP Massal</h3>
            <p className="text-xs text-slate-500">
              Sistem akan otomatis membuat tagihan SPP untuk seluruh santri berstatus aktif.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bulan SPP</label>
                <select
                  value={sppBulan}
                  onChange={(e) => setSppBulan(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map(
                    (b, i) => i > 0 && <option key={i} value={i}>{b}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Periode</label>
                <input
                  type="number"
                  value={sppTahun}
                  onChange={(e) => setSppTahun(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal SPP Default (Rp)</label>
                <input
                  type="number"
                  value={sppNominal}
                  onChange={(e) => setSppNominal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowGenerateSppModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleGenerateSpp}
                disabled={generateSppMutation.isPending}
                className="px-4 py-2 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-bold rounded-xl"
              >
                {generateSppMutation.isPending ? "Menjalankan..." : "Generate Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Tambah Tagihan Manual (Uang Pangkal Kuota 1/2/3, dll) */}
      {showAddTagihanModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">Tambah Tagihan Santri</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Santri *</label>
                <select
                  value={manualSiswaId || ""}
                  onChange={(e) => setManualSiswaId(parseInt(e.target.value, 10) || null)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="">-- Pilih Santri --</option>
                  {siswaDropdown.map((s: any) => (
                    <option key={s.siswa_id} value={s.siswa_id}>
                      {s.nama} ({s.nis}) - {s.kelas?.nama_kelas || "-"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Pos Pembayaran *</label>
                <select
                  value={manualPosId || ""}
                  onChange={(e) => {
                    const pid = parseInt(e.target.value, 10);
                    setManualPosId(pid);
                    const selected = posList.find((p: any) => p.pos_id === pid);
                    if (selected) {
                      setManualNama(selected.nama_pos);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="">-- Pilih Pos --</option>
                  {posList.map((p: any) => (
                    <option key={p.pos_id} value={p.pos_id}>
                      {p.nama_pos} ({p.kode_pos})
                    </option>
                  ))}
                </select>
              </div>

              {/* Preset Kuota jika Uang Pangkal */}
              {posList.find((p: any) => p.pos_id === manualPosId)?.kode_pos === "PANGKAL" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Pilih Kuota / Gelombang Tarif:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { kuota: "Kuota 1", nominal: 12000000, label: "Kuota 1 (12 Juta)" },
                      { kuota: "Kuota 2", nominal: 13500000, label: "Kuota 2 (13.5 Juta)" },
                      { kuota: "Kuota 3", nominal: 15000000, label: "Kuota 3 (15 Juta)" },
                    ].map((k) => (
                      <button
                        key={k.kuota}
                        type="button"
                        onClick={() => {
                          setManualNama(`Uang Pangkal (${k.kuota})`);
                          setManualNominal(String(k.nominal));
                        }}
                        className="p-2 text-center rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-[11px] font-bold text-blue-800"
                      >
                        {k.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Tagihan *</label>
                <input
                  type="text"
                  placeholder="Contoh: Uang Pangkal (Kuota 1)"
                  value={manualNama}
                  onChange={(e) => setManualNama(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Tagihan (Rp) *</label>
                <input
                  type="number"
                  placeholder="Contoh: 12000000"
                  value={manualNominal}
                  onChange={(e) => setManualNominal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#162E6E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  placeholder="Catatan tambahan..."
                  value={manualKeterangan}
                  onChange={(e) => setManualKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowAddTagihanModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleSaveManualTagihan}
                disabled={addTagihanMutation.isPending}
                className="px-4 py-2 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-bold rounded-xl"
              >
                {addTagihanMutation.isPending ? "Menyimpan..." : "Simpan Tagihan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
