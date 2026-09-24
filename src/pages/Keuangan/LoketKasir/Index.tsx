import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  Search,
  CheckCircle2,
  AlertCircle,
  Printer,
  Receipt,
  User,
  Plus,
  Trash2,
  CreditCard,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = "/api/v1/keuangan";

const formatRupiah = (val: number | string) => {
  const num = typeof val === "number" ? val : parseFloat(val) || 0;
  return "Rp " + num.toLocaleString("id-ID");
};

export default function LoketKasirIndex() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);
  const [cartItems, setCartItems] = useState<{ [tagihan_id: number]: number }>({});
  const [catatan, setCatatan] = useState("");
  const [lastKuitansi, setLastKuitansi] = useState<any>(null);

  // Cari Santri & Tagihan
  const { data: tagihanData = [], isLoading: loadingTagihan } = useQuery({
    queryKey: ["keuangan", "tagihan-kasir", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const res = await axios.get(`${API_BASE}/tagihan`, {
        params: { search: searchTerm },
      });
      return res.data?.data || [];
    },
    enabled: searchTerm.length >= 2,
  });

  // Kelompokkan siswa dari hasil search
  const matchedStudents = React.useMemo(() => {
    const map = new Map<number, any>();
    tagihanData.forEach((t: any) => {
      if (t.siswa && !map.has(t.siswa_id)) {
        map.set(t.siswa_id, t.siswa);
      }
    });
    return Array.from(map.values());
  }, [tagihanData]);

  // Tagihan siswa yang dipilih
  const activeStudentTagihan = React.useMemo(() => {
    if (!selectedSiswa) return [];
    return tagihanData.filter((t: any) => t.siswa_id === selectedSiswa.siswa_id && t.status !== "Lunas");
  }, [tagihanData, selectedSiswa]);

  // Total Bayar di Cart
  const totalBayar = React.useMemo(() => {
    return Object.values(cartItems).reduce((acc, v) => acc + (v || 0), 0);
  }, [cartItems]);

  // Mutation Bayar Loket
  const bayarMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post(`${API_BASE}/bayar-loket`, payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success("Pembayaran loket kasir berhasil disimpan!");
      setLastKuitansi(res.data);
      setCartItems({});
      setCatatan("");
      queryClient.invalidateQueries({ queryKey: ["keuangan"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal memproses pembayaran loket.");
    },
  });

  const handleProsesBayar = () => {
    if (!selectedSiswa) {
      toast.error("Pilih santri terlebih dahulu.");
      return;
    }
    const items = Object.entries(cartItems)
      .filter(([_, nominal]) => nominal > 0)
      .map(([id, nominal]) => ({
        tagihan_id: parseInt(id, 10),
        nominal_bayar: nominal,
      }));

    if (items.length === 0) {
      toast.error("Pilih dan masukkan nominal tagihan yang akan dibayar.");
      return;
    }

    bayarMutation.mutate({
      siswa_id: selectedSiswa.siswa_id,
      items,
      catatan,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#162E6E] to-[#1D4ED8] flex items-center justify-center text-white shadow-md">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Loket Kasir Pembayaran</h1>
            <p className="text-sm text-slate-500">Penerimaan kas tunai & cetak kuitansi resmi santri</p>
          </div>
        </div>

        {lastKuitansi && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            Cetak Kuitansi Terakhir ({lastKuitansi.nomor_transaksi})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Cari Santri & Tagihan (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card Pencarian */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <label className="block text-sm font-bold text-slate-700">1. Cari Data Santri (Nama / NIS)</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Ketik minimal 2 huruf nama atau NIS santri..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E] transition-all"
              />
            </div>

            {/* List Hasil Pencarian Santri */}
            {matchedStudents.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {matchedStudents.map((s: any) => {
                  const isSelected = selectedSiswa?.siswa_id === s.siswa_id;
                  return (
                    <button
                      key={s.siswa_id}
                      onClick={() => {
                        setSelectedSiswa(s);
                        setCartItems({});
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-blue-50/80 border-[#1D4ED8] ring-2 ring-[#1D4ED8]/20"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#162E6E] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {s.nama?.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-xs text-slate-800 truncate">{s.nama}</div>
                        <div className="text-[11px] text-slate-500">NIS: {s.nis} • {s.kelas?.nama_kelas || "-"}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card Tagihan Santri Terpilih */}
          {selectedSiswa && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800">2. Daftar Tagihan Aktif: {selectedSiswa.nama}</h3>
                  <p className="text-xs text-slate-500">Centang atau isi nominal pembayaran tagihan</p>
                </div>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">
                  {selectedSiswa.kelas?.nama_kelas || "Aktif"}
                </span>
              </div>

              {activeStudentTagihan.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-600">Alhamdulillah, seluruh tagihan santri ini telah lunas!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeStudentTagihan.map((t: any) => {
                    const isChecked = cartItems[t.tagihan_id] !== undefined;
                    const currentVal = cartItems[t.tagihan_id] || t.sisa_tagihan;

                    return (
                      <div
                        key={t.tagihan_id}
                        className={`p-4 rounded-xl border transition-all ${
                          isChecked ? "bg-blue-50/50 border-blue-300 ring-1 ring-blue-300" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCartItems({ ...cartItems, [t.tagihan_id]: t.sisa_tagihan });
                                } else {
                                  const copy = { ...cartItems };
                                  delete copy[t.tagihan_id];
                                  setCartItems(copy);
                                }
                              }}
                              className="w-4 h-4 rounded text-[#162E6E] focus:ring-[#162E6E]"
                            />
                            <div>
                              <div className="font-bold text-sm text-slate-800">{t.nama_tagihan}</div>
                              <div className="text-xs text-slate-500">
                                Total: {formatRupiah(t.nominal_total)} • Sisa: <span className="text-rose-600 font-semibold">{formatRupiah(t.sisa_tagihan)}</span>
                              </div>
                            </div>
                          </label>

                          {/* Input Nominal Pembayaran */}
                          {isChecked && (
                            <div className="w-40">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nominal Bayar</label>
                              <input
                                type="number"
                                value={currentVal}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setCartItems({ ...cartItems, [t.tagihan_id]: val });
                                }}
                                max={t.sisa_tagihan}
                                className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-[#162E6E]"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Keranjang Pembayaran & Proses Kasir (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6 sticky top-6">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#162E6E]" />
                <h3 className="font-bold text-slate-800">Ringkasan Pembayaran Kasir</h3>
              </div>
              <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg">Tunai / Loket</span>
            </div>

            {/* List Tagihan Terpilih */}
            <div className="space-y-3 min-h-[120px]">
              {Object.keys(cartItems).length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-xs">Belum ada tagihan yang dipilih dari daftar sebelah kiri.</p>
                </div>
              ) : (
                Object.entries(cartItems).map(([id, nominal]) => {
                  const tagihanObj = tagihanData.find((t: any) => t.tagihan_id === parseInt(id, 10));
                  return (
                    <div key={id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{tagihanObj?.nama_tagihan || `Tagihan #${id}`}</div>
                        <div className="text-slate-500 text-[11px]">{tagihanObj?.pos?.nama_pos}</div>
                      </div>
                      <div className="font-bold text-[#162E6E] text-sm">{formatRupiah(nominal)}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Catatan Transaksi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan Kasir (Opsional)</label>
              <textarea
                rows={2}
                placeholder="Contoh: Diterima tunai dari wali santri di kantor pesantren..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]"
              />
            </div>

            {/* Total Kasir Box */}
            <div className="bg-gradient-to-br from-[#162E6E] to-[#1E3A8A] text-white p-5 rounded-2xl space-y-2 shadow-md">
              <div className="text-xs text-blue-200 uppercase font-bold tracking-wider">Total Kas Masuk</div>
              <div className="text-3xl font-extrabold">{formatRupiah(totalBayar)}</div>
            </div>

            {/* Tombol Proses */}
            <button
              onClick={handleProsesBayar}
              disabled={bayarMutation.isPending || totalBayar <= 0}
              className="w-full py-3.5 bg-[#162E6E] hover:bg-[#122456] disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {bayarMutation.isPending ? "Memproses..." : "Simpan & Cetak Kuitansi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
