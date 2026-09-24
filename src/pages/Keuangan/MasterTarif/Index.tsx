import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Building2,
  Plus,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = "/api/v1/keuangan";

const formatRupiah = (val: number | string) => {
  const num = typeof val === "number" ? val : parseFloat(val) || 0;
  return "Rp " + num.toLocaleString("id-ID");
};

export default function MasterTarifIndex() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pos" | "rekening">("pos");

  // Modals
  const [showAddPosModal, setShowAddPosModal] = useState(false);
  const [showAddTarifModal, setShowAddTarifModal] = useState(false);
  const [showAddRekeningModal, setShowAddRekeningModal] = useState(false);

  // Form Pos
  const [posNama, setPosNama] = useState("");
  const [posKode, setPosKode] = useState("");
  const [posTipe, setPosTipe] = useState("Bulanan");
  const [posDeskripsi, setPosDeskripsi] = useState("");

  // Form Tarif
  const [tarifPosId, setTarifPosId] = useState<number | null>(null);
  const [tarifNama, setTarifNama] = useState("");
  const [tarifKuota, setTarifKuota] = useState("");
  const [tarifNominal, setTarifNominal] = useState("");

  // Form Rekening
  const [rekBank, setRekBank] = useState("");
  const [rekNomor, setRekNomor] = useState("");
  const [rekAn, setRekAn] = useState("");
  const [rekCabang, setRekCabang] = useState("");

  // Fetch Master Data
  const { data: masterData } = useQuery({
    queryKey: ["keuangan", "master"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/master`);
      return res.data?.data || { pos: [], rekening: [] };
    },
  });

  const posList = masterData?.pos || [];
  const rekeningList = masterData?.rekening || [];

  // Mutation Tambah Pos
  const addPosMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post(`${API_BASE}/pos`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Pos pembayaran baru berhasil ditambahkan!");
      setShowAddPosModal(false);
      setPosNama("");
      setPosKode("");
      setPosDeskripsi("");
      queryClient.invalidateQueries({ queryKey: ["keuangan", "master"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menambah pos pembayaran.");
    },
  });

  // Mutation Tambah Tarif
  const addTarifMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post(`${API_BASE}/tarif`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Tarif pembayaran berhasil ditambahkan!");
      setShowAddTarifModal(false);
      setTarifNama("");
      setTarifKuota("");
      setTarifNominal("");
      queryClient.invalidateQueries({ queryKey: ["keuangan", "master"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menambah tarif.");
    },
  });

  // Mutation Tambah Rekening
  const addRekeningMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post(`${API_BASE}/rekening`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Rekening bank pesantren berhasil ditambahkan!");
      setShowAddRekeningModal(false);
      setRekBank("");
      setRekNomor("");
      setRekAn("");
      setRekCabang("");
      queryClient.invalidateQueries({ queryKey: ["keuangan", "master"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menambah rekening.");
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#162E6E] to-[#1D4ED8] flex items-center justify-center text-white shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Master Tarif & Pos Keuangan</h1>
            <p className="text-sm text-slate-500">Konfigurasi pos pembayaran, tarif kuota 1/2/3, dan rekening resmi bank</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "pos" ? (
            <button
              onClick={() => setShowAddPosModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Tambah Pos Pembayaran
            </button>
          ) : (
            <button
              onClick={() => setShowAddRekeningModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Tambah Rekening Bank
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("pos")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "pos"
              ? "bg-[#162E6E] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Pos & Tarif Pembayaran ({posList.length})
        </button>
        <button
          onClick={() => setActiveTab("rekening")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "rekening"
              ? "bg-[#162E6E] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Rekening Resmi Bank Pesantren ({rekeningList.length})
        </button>
      </div>

      {/* TAB 1: POS & TARIF */}
      {activeTab === "pos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posList.map((p: any) => (
            <div key={p.pos_id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-800">{p.nama_pos}</h3>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                      {p.kode_pos}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{p.deskripsi || "Tanpa deskripsi"}</p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg">
                  Tipe: {p.tipe_pembayaran}
                </span>
              </div>

              {/* Tarif Sublist */}
              <div className="space-y-2 border-t pt-3 border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Tarif & Kuota Terdaftar:</span>
                  <button
                    onClick={() => {
                      setTarifPosId(p.pos_id);
                      setTarifNama("");
                      setTarifKuota("");
                      setTarifNominal("");
                      setShowAddTarifModal(true);
                    }}
                    className="text-[11px] font-bold text-[#1D4ED8] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tambah Tarif
                  </button>
                </div>

                {p.tarif?.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-2">Belum ada tarif khusus</div>
                ) : (
                  p.tarif?.map((t: any) => (
                    <div key={t.tarif_id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{t.nama_tarif}</div>
                        {t.kuota && <div className="text-[11px] text-amber-700 font-semibold">{t.kuota}</div>}
                      </div>
                      <div className="font-extrabold text-[#162E6E] text-sm">
                        {formatRupiah(t.nominal)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: REKENING BANK */}
      {activeTab === "rekening" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rekeningList.map((r: any) => (
            <div key={r.rekening_id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#162E6E] flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">{r.nama_bank}</h3>
                  <p className="text-[11px] text-slate-500">{r.cabang || "Kantor Pusat"}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Nomor Rekening:</div>
                <div className="text-base font-extrabold text-slate-900 tracking-wider mt-0.5">{r.nomor_rekening}</div>
              </div>

              <div className="text-xs text-slate-600">
                Atas Nama: <span className="font-bold text-slate-800">{r.atas_nama}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Pos */}
      {showAddPosModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">Tambah Pos Pembayaran</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pos *</label>
                <input
                  type="text"
                  placeholder="Contoh: SPP Bulanan / Uang Pangkal"
                  value={posNama}
                  onChange={(e) => setPosNama(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Pos (Singkatan)</label>
                <input
                  type="text"
                  placeholder="Contoh: SPP / PANGKAL"
                  value={posKode}
                  onChange={(e) => setPosKode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Pembayaran</label>
                <select
                  value={posTipe}
                  onChange={(e) => setPosTipe(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Bulanan">Bulanan (SPP per bulan)</option>
                  <option value="Bebas">Bebas / Fleksibel (Uang Pangkal bisa dicicil)</option>
                  <option value="Tahunan">Tahunan (Kegiatan 1 tahun sekali)</option>
                  <option value="Sekali">Sekali (Seragam siswa baru)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan pos..."
                  value={posDeskripsi}
                  onChange={(e) => setPosDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowAddPosModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => addPosMutation.mutate({ nama_pos: posNama, kode_pos: posKode, tipe_pembayaran: posTipe, deskripsi: posDeskripsi })}
                disabled={addPosMutation.isPending || !posNama}
                className="px-4 py-2 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-bold rounded-xl"
              >
                {addPosMutation.isPending ? "Menyimpan..." : "Simpan Pos"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Tarif */}
      {showAddTarifModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">Tambah Tarif Pembayaran</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Tarif *</label>
                <input
                  type="text"
                  placeholder="Contoh: Uang Pangkal Kuota 1 / SPP MTs"
                  value={tarifNama}
                  onChange={(e) => setTarifNama(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kuota / Gelombang (Opsional)</label>
                <select
                  value={tarifKuota}
                  onChange={(e) => setTarifKuota(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="">-- Tanpa Kuota --</option>
                  <option value="Kuota 1">Kuota 1 (Gelombang 1 / Early Bird)</option>
                  <option value="Kuota 2">Kuota 2 (Gelombang 2 / Reguler)</option>
                  <option value="Kuota 3">Kuota 3 (Gelombang 3)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  placeholder="Contoh: 12000000"
                  value={tarifNominal}
                  onChange={(e) => setTarifNominal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#162E6E]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowAddTarifModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() =>
                  addTarifMutation.mutate({
                    pos_id: tarifPosId,
                    nama_tarif: tarifNama,
                    kuota: tarifKuota || null,
                    nominal: tarifNominal,
                  })
                }
                disabled={addTarifMutation.isPending || !tarifNama || !tarifNominal}
                className="px-4 py-2 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-bold rounded-xl"
              >
                {addTarifMutation.isPending ? "Menyimpan..." : "Simpan Tarif"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Rekening */}
      {showAddRekeningModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">Tambah Rekening Bank Pesantren</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bank *</label>
                <input
                  type="text"
                  placeholder="Contoh: Bank Syariah Indonesia (BSI)"
                  value={rekBank}
                  onChange={(e) => setRekBank(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening *</label>
                <input
                  type="text"
                  placeholder="Contoh: 7123456789"
                  value={rekNomor}
                  onChange={(e) => setRekNomor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Atas Nama *</label>
                <input
                  type="text"
                  placeholder="Contoh: YAYASAN MASKUMAMBANG"
                  value={rekAn}
                  onChange={(e) => setRekAn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cabang (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Gresik Dukun"
                  value={rekCabang}
                  onChange={(e) => setRekCabang(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowAddRekeningModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() =>
                  addRekeningMutation.mutate({
                    nama_bank: rekBank,
                    nomor_rekening: rekNomor,
                    atas_nama: rekAn,
                    cabang: rekCabang,
                  })
                }
                disabled={addRekeningMutation.isPending || !rekBank || !rekNomor || !rekAn}
                className="px-4 py-2 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-bold rounded-xl"
              >
                {addRekeningMutation.isPending ? "Menyimpan..." : "Simpan Rekening"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
