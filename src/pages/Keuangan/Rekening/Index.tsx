import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Landmark,
  CreditCard,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  QrCode,
  Info,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { toast } from "sonner";

const API_BASE = "/keuangan";

export default function RekeningIndex() {
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [namaBank, setNamaBank] = useState("");
  const [nomorRekening, setNomorRekening] = useState("");
  const [atasNama, setAtasNama] = useState("YAYASAN KEBANGKITAN ISLAM MASKUMAMBANG");
  const [cabang, setCabang] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Fetch Master Data (Rekening List)
  const { data: masterData, isLoading } = useQuery({
    queryKey: ["keuangan", "master"],
    queryFn: async () => {
      const res = await apiClient.get(`${API_BASE}/master`);
      return res.data?.data || { rekening: [] };
    },
  });

  const rekeningList: any[] = masterData?.rekening || [];

  // Add Rekening Mutation
  const addRekeningMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post(`${API_BASE}/rekening`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Rekening bank yayasan berhasil didaftarkan!");
      setShowAddModal(false);
      setNamaBank("");
      setNomorRekening("");
      setCabang("");
      queryClient.invalidateQueries({ queryKey: ["keuangan", "master"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menambah rekening bank."),
  });

  // Delete Rekening Mutation
  const deleteRekeningMutation = useMutation({
    mutationFn: async (rekening_id: number) => {
      const res = await apiClient.delete(`${API_BASE}/rekening/${rekening_id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Rekening bank berhasil dinonaktifkan.");
      queryClient.invalidateQueries({ queryKey: ["keuangan", "master"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menghapus rekening."),
  });

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Nomor rekening berhasil disalin!");
    setTimeout(() => setCopiedId(null), 2000);
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
              <span className="text-slate-600 font-semibold">Rekening Yayasan</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-[#162E6E] text-white flex items-center justify-center shadow-xs">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Rekening Resmi Bendahara Yayasan
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sistem Satu Pintu — Seluruh Inflow Keuangan Pesantren Dikelola Terpusat
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Rekening Bank
          </button>
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* PRINSIP SATU PINTU BANNER CARD */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 border border-emerald-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#162E6E] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900">
                  Prinsip Satu Pintu: Seluruh Pembayaran Masuk ke Bendahara Yayasan
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#162E6E]">
                  Kebijakan Resmi Pesantren
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                Wali santri dari seluruh jenjang (MI, MTs, MA, SMK, serta Asrama Putra/Putri) melakukan transaksi pembayaran melalui nomor rekening bank resmi yayasan di bawah ini atau loket kasir pusat. Tidak ada rekening bank mandiri di tingkat unit sekolah, sehingga arus kas santri tercatat transparan dan alokasi internal ke dapur pondok maupun madrasah dipantau secara otomatis.
              </p>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* METRICS & SALURAN PEMBAYARAN */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Rekening Bank Aktif</div>
              <div className="text-lg font-extrabold text-slate-900">{rekeningList.length} Rekening</div>
              <div className="text-[11px] text-slate-500">BSI, BRI, Bank Mandiri</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#162E6E] border border-emerald-200 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Loket Kasir Pusat</div>
              <div className="text-lg font-extrabold text-slate-900">Aktif & Siap</div>
              <div className="text-[11px] text-slate-500">Penerimaan Tunai & Kuitansi</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Gateway & QRIS / VA</div>
              <div className="text-lg font-extrabold text-slate-900">Terpusat</div>
              <div className="text-[11px] text-slate-500">Terhubung ke Bank Syariah</div>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* DAFTAR REKENING BANK YAYASAN */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Daftar Rekening Bank Resmi</h2>
              <p className="text-xs text-slate-500">
                Rekening yang tampil di invoice tagihan santri dan aplikasi wali santri.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Total {rekeningList.length} rekening
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                Memuat data rekening...
              </div>
            ) : rekeningList.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                Belum ada rekening bank yang terdaftar.
              </div>
            ) : (
              rekeningList.map((rek) => (
                <div
                  key={rek.rekening_id}
                  className="bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {rek.nama_bank.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{rek.nama_bank}</div>
                        <div className="text-[11px] text-slate-400">Cabang: {rek.cabang || "Pusat"}</div>
                      </div>
                    </div>

                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Aktif
                    </span>
                  </div>

                  {/* Account Number Box */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Nomor Rekening
                      </div>
                      <div className="text-base font-mono font-bold text-slate-900 tracking-wide mt-0.5">
                        {rek.nomor_rekening}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(rek.rekening_id, rek.nomor_rekening)}
                      className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Salin Nomor Rekening"
                    >
                      {copiedId === rek.rekening_id ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="text-xs text-slate-600">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Atas Nama:</div>
                    <div className="font-bold text-slate-800 mt-0.5">{rek.atas_nama}</div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">Satu Pintu Bendahara</span>
                    <button
                      onClick={() => {
                        if (confirm(`Nonaktifkan rekening ${rek.nama_bank}?`)) {
                          deleteRekeningMutation.mutate(rek.rekening_id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Note */}
          <div className="bg-slate-50/80 px-6 py-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Nomor rekening ini akan dicantumkan secara otomatis pada Surat Tagihan dan Kuitansi Resmi Pesantren Maskumambang.
            </span>
          </div>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* MODAL: TAMBAH REKENING BANK */}
      {/* ═════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Tambah Rekening Bank Yayasan</h3>
                <p className="text-xs text-slate-500">Daftarkan rekening bank resmi untuk pembayaran santri</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addRekeningMutation.mutate({
                  nama_bank: namaBank,
                  nomor_rekening: nomorRekening,
                  atas_nama: atasNama,
                  cabang,
                });
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Bank <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaBank}
                  onChange={(e) => setNamaBank(e.target.value)}
                  placeholder="Contoh: Bank Syariah Indonesia (BSI), Bank Muamalat"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Rekening <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomorRekening}
                  onChange={(e) => setNomorRekening(e.target.value)}
                  placeholder="Contoh: 7123456789"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Atas Nama Rekening <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={atasNama}
                  onChange={(e) => setAtasNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kantor Cabang
                </label>
                <input
                  type="text"
                  value={cabang}
                  onChange={(e) => setCabang(e.target.value)}
                  placeholder="Contoh: Gresik Dukun"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addRekeningMutation.isPending || !namaBank.trim() || !nomorRekening.trim()}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#162E6E] hover:bg-[#122456] disabled:opacity-50 rounded-lg shadow-xs transition-colors"
                >
                  {addRekeningMutation.isPending ? "Menyimpan..." : "Simpan Rekening"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
