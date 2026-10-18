import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import {
  Wallet,
  Search,
  CheckCircle2,
  Printer,
  Receipt,
  ArrowLeft,
  RefreshCw,
  User,
  AlertCircle,
  Banknote,
  Coins,
  FileCheck,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { toast } from "sonner";
import BuktiPembayaranModal from "../components/BuktiPembayaranModal";

const API_BASE = "/keuangan";

// Helper Format Rupiah
const formatRupiah = (val: number | string | undefined | null) => {
  const num = typeof val === "number" ? val : parseFloat(String(val || 0)) || 0;
  return "Rp " + num.toLocaleString("id-ID");
};

// Helper Format Angka dengan Titik Ribuan (e.g. 1000000 -> 1.000.000)
const formatNumberWithDots = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null || val === "") return "";
  const cleanStr = String(val).replace(/\D/g, "");
  if (!cleanStr) return "";
  return parseInt(cleanStr, 10).toLocaleString("id-ID");
};

// Helper Terbilang Bahasa Indonesia
const angkaKeTerbilang = (nilai: number): string => {
  const bilangan = [
    "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
  ];
  if (nilai < 12) return bilangan[nilai];
  if (nilai < 20) return angkaKeTerbilang(nilai - 10) + " Belas";
  if (nilai < 100) return angkaKeTerbilang(Math.floor(nilai / 10)) + " Puluh " + angkaKeTerbilang(nilai % 10);
  if (nilai < 200) return "Seratus " + angkaKeTerbilang(nilai - 100);
  if (nilai < 1000) return angkaKeTerbilang(Math.floor(nilai / 100)) + " Ratus " + angkaKeTerbilang(nilai % 100);
  if (nilai < 2000) return "Seribu " + angkaKeTerbilang(nilai - 1000);
  if (nilai < 1000000) return angkaKeTerbilang(Math.floor(nilai / 1000)) + " Ribu " + angkaKeTerbilang(nilai % 1000);
  if (nilai < 1000000000) return angkaKeTerbilang(Math.floor(nilai / 1000000)) + " Juta " + angkaKeTerbilang(nilai % 1000000);
  if (nilai < 1000000000000) return angkaKeTerbilang(Math.floor(nilai / 1000000000)) + " Milyar " + angkaKeTerbilang(nilai % 1000000000);
  return "";
};

const terbilangRupiah = (nominal: number): string => {
  if (!nominal || nominal <= 0) return "Nol Rupiah";
  const str = angkaKeTerbilang(Math.floor(nominal)).trim();
  return (str ? str.replace(/\s+/g, " ") : "") + " Rupiah";
};

export default function LoketKasirIndex() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramSiswaId = searchParams.get("siswa_id");

  // State pencarian & pemilihan santri
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);

  // Cart: Map tagihan_id -> nominal bayar (number)
  const [cartItems, setCartItems] = useState<{ [tagihan_id: number]: number }>({});
  const [catatan, setCatatan] = useState("");
  const [uangDiterima, setUangDiterima] = useState<string>("");

  // Kuitansi Modal
  const [showKuitansiModal, setShowKuitansiModal] = useState(false);
  const [lastKuitansi, setLastKuitansi] = useState<any>(null);

  // 1. Fetch seluruh siswa untuk autocomplete & fast search
  const { data: allSiswa = [], isLoading: isLoadingSiswa } = useQuery({
    queryKey: ["siswa-all-kasir"],
    queryFn: async () => {
      const res = await apiClient.get("/siswa");
      return res.data?.data || res.data || [];
    },
  });

  // 2. Fetch tagihan untuk santri terpilih
  const {
    data: studentTagihanList = [],
    isLoading: isLoadingTagihan,
    refetch: refetchTagihan,
  } = useQuery({
    queryKey: ["keuangan", "tagihan-santri", selectedSiswa?.siswa_id],
    queryFn: async () => {
      if (!selectedSiswa?.siswa_id) return [];
      const res = await apiClient.get(`${API_BASE}/tagihan`, {
        params: { siswa_id: selectedSiswa.siswa_id },
      });
      return res.data?.data || [];
    },
    enabled: !!selectedSiswa?.siswa_id,
  });

  // 3. Auto-select santri jika ada ?siswa_id=... di URL query
  useEffect(() => {
    if (paramSiswaId && allSiswa.length > 0) {
      const targetId = parseInt(paramSiswaId, 10);
      const found = allSiswa.find((s: any) => s.siswa_id === targetId);
      if (found && (!selectedSiswa || selectedSiswa.siswa_id !== found.siswa_id)) {
        setSelectedSiswa(found);
      }
    }
  }, [paramSiswaId, allSiswa, selectedSiswa]);

  // Jika santri belum ada di allSiswa namun paramSiswaId terisi, fetch langsung detailnya
  useEffect(() => {
    if (paramSiswaId && !selectedSiswa && allSiswa.length === 0) {
      apiClient
        .get(`/siswa/${paramSiswaId}`)
        .then((res) => {
          if (res.data) {
            setSelectedSiswa(res.data.data || res.data);
          }
        })
        .catch(() => {});
    }
  }, [paramSiswaId, selectedSiswa, allSiswa]);

  // Filter daftar santri berdasarkan pencarian
  const matchedStudents = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length < 1) return [];
    const term = searchTerm.toLowerCase().trim();
    return allSiswa
      .filter((s: any) => {
        const nama = (s.nama || "").toLowerCase();
        const nis = (s.nis || "").toLowerCase();
        const kelas = (s.kelas?.nama_kelas || "").toLowerCase();
        return nama.includes(term) || nis.includes(term) || kelas.includes(term);
      })
      .slice(0, 9);
  }, [searchTerm, allSiswa]);

  // Tagihan yang belum lunas (sisa_tagihan > 0)
  const unpaidTagihan = useMemo(() => {
    return studentTagihanList.filter((t: any) => t.status !== "Lunas" && (t.sisa_tagihan || 0) > 0);
  }, [studentTagihanList]);

  // Tagihan yang sudah lunas (untuk riwayat singkat santri ini)
  const paidTagihan = useMemo(() => {
    return studentTagihanList.filter((t: any) => t.status === "Lunas");
  }, [studentTagihanList]);

  // Total Bayar di Keranjang
  const totalBayar = useMemo(() => {
    return Object.values(cartItems).reduce((acc, v) => acc + (v || 0), 0);
  }, [cartItems]);

  // Nominal Uang Diterima & Kembalian
  const nominalUangDiterima = useMemo(() => {
    const clean = uangDiterima.replace(/\D/g, "");
    return clean ? parseInt(clean, 10) : 0;
  }, [uangDiterima]);

  const kembalian = useMemo(() => {
    if (!nominalUangDiterima || nominalUangDiterima < totalBayar) return 0;
    return nominalUangDiterima - totalBayar;
  }, [nominalUangDiterima, totalBayar]);

  // Mutation Bayar Loket Kasir
  const bayarMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post(`${API_BASE}/bayar-loket`, payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success("Pembayaran loket kasir berhasil diproses & dicatat!");
      setLastKuitansi({
        ...res.data,
        siswa: selectedSiswa,
        items_detail: Object.entries(cartItems).map(([id, nominal]) => {
          const tObj = studentTagihanList.find((t: any) => t.tagihan_id === parseInt(id, 10));
          const totalTagihan = tObj?.nominal_total || nominal;
          const sisaSebelumnya = tObj?.sisa_tagihan !== undefined ? tObj.sisa_tagihan : totalTagihan;
          const sisaSetelahBayar = Math.max(0, sisaSebelumnya - nominal);
          return {
            tagihan_id: parseInt(id, 10),
            nama_tagihan: tObj?.nama_tagihan || `Tagihan #${id}`,
            nama_pos: tObj?.pos?.nama_pos || "Biaya Pendidikan",
            nominal_bayar: nominal,
            nominal_total: totalTagihan,
            sisa_tagihan: sisaSetelahBayar,
            is_cicilan: sisaSetelahBayar > 0,
          };
        }),
        nominal_diterima: nominalUangDiterima || totalBayar,
        kembalian: kembalian,
      });
      setShowKuitansiModal(true);
      setCartItems({});
      setCatatan("");
      setUangDiterima("");
      refetchTagihan();
      queryClient.invalidateQueries({ queryKey: ["keuangan"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal memproses pembayaran loket.");
    },
  });

  // Handler Pilih Santri
  const handleSelectStudent = (siswa: any) => {
    setSelectedSiswa(siswa);
    setSearchTerm("");
    setCartItems({});
    setUangDiterima("");
    setSearchParams({ siswa_id: String(siswa.siswa_id) });
  };

  // Handler Reset Santri (Kembali ke Halaman Awal Loket)
  const handleResetStudent = () => {
    setSelectedSiswa(null);
    setCartItems({});
    setUangDiterima("");
    setCatatan("");
    setSearchTerm("");
    setSearchParams({});
  };

  // Handler Pilih Semua Tagihan
  const handleSelectAllBills = () => {
    const newCart: { [id: number]: number } = {};
    unpaidTagihan.forEach((t: any) => {
      newCart[t.tagihan_id] = t.sisa_tagihan || t.nominal_total;
    });
    setCartItems(newCart);
  };

  // Handler Kosongkan Pilihan
  const handleClearAllBills = () => {
    setCartItems({});
  };

  // Handler Toggle Satuan
  const handleToggleBill = (tagihanId: number, sisaTagihan: number) => {
    if (cartItems[tagihanId] !== undefined) {
      const copy = { ...cartItems };
      delete copy[tagihanId];
      setCartItems(copy);
    } else {
      setCartItems({ ...cartItems, [tagihanId]: sisaTagihan });
    }
  };

  // Handler Perubahan Nominal Satuan
  const handleBillNominalChange = (tagihanId: number, rawInput: string, maxSisa: number) => {
    const digits = rawInput.replace(/\D/g, "");
    if (!digits) {
      setCartItems({ ...cartItems, [tagihanId]: 0 });
      return;
    }
    let val = parseInt(digits, 10);
    if (val > maxSisa) {
      val = maxSisa;
      toast.info(`Nominal dibatasi maksimal sisa tagihan (${formatRupiah(maxSisa)})`);
    }
    setCartItems({ ...cartItems, [tagihanId]: val });
  };

  // Handler Proses Pembayaran Kasir
  const handleProsesBayar = () => {
    if (!selectedSiswa) {
      toast.error("Pilih data santri terlebih dahulu.");
      return;
    }

    const items = Object.entries(cartItems)
      .filter(([_, nominal]) => nominal > 0)
      .map(([id, nominal]) => ({
        tagihan_id: parseInt(id, 10),
        nominal_bayar: nominal,
      }));

    if (items.length === 0) {
      toast.error("Pilih minimal satu tagihan dan isi nominal pembayaran.");
      return;
    }

    if (nominalUangDiterima > 0 && nominalUangDiterima < totalBayar) {
      toast.error("Uang yang diterima kurang dari total pembayaran yang dipilih.");
      return;
    }

    bayarMutation.mutate({
      siswa_id: selectedSiswa.siswa_id,
      items,
      catatan: catatan.trim() || `Diterima langsung di loket kasir pesantren`,
      tanggal_bayar: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div className="flex items-center gap-4">
          <Link
            to="/keuangan/tagihan"
            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            title="Kembali ke Matriks Tagihan"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#162E6E] to-[#1D4ED8] flex items-center justify-center text-white shadow-md">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Loket Kasir Pembayaran
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-[#162E6E] font-semibold">
                Online Real-time
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Penerimaan kas tunai, pelunasan bertahap, dan cetak kuitansi resmi santri
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastKuitansi && (
            <button
              onClick={() => setShowKuitansiModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Kuitansi Terakhir ({lastKuitansi.nomor_transaksi || "Lihat"})
            </button>
          )}

          <Link
            to="/keuangan/tagihan"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#162E6E]/10 hover:bg-[#162E6E]/20 text-[#162E6E] rounded-xl text-xs font-bold transition-all"
          >
            Matriks Tagihan
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* KONDISI 1: JIKA BELUM ADA SANTRI TERPILIH -> TAMPILKAN PENCARIAN LEBAR (POINT 2) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {!selectedSiswa ? (
        <div className="w-full bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-100 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-[#162E6E]" />
                Cari Data Santri Pembayar
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ketik nama santri, NIS, atau kelas untuk membuka loket kasir
              </p>
            </div>
            {isLoadingSiswa && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#162E6E]" /> Memuat database santri...
              </span>
            )}
          </div>

          {/* Search Box Lebar & Stabil */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Ketik minimal 1 karakter nama santri, NIS, atau kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E] transition-all"
            />
          </div>

          {/* Grid Hasil Pencarian Lebar Stabil 3 Kolom */}
          {matchedStudents.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Ditemukan {matchedStudents.length} Santri:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                {matchedStudents.map((s: any) => (
                  <button
                    key={s.siswa_id}
                    type="button"
                    onClick={() => handleSelectStudent(s)}
                    className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#162E6E] hover:bg-blue-50/40 text-left transition-all cursor-pointer group shadow-2xs w-full min-w-0"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#162E6E] text-white flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      {s.nama?.charAt(0) || "S"}
                    </div>
                    <div className="overflow-hidden flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-800 truncate group-hover:text-[#162E6E]">
                        {s.nama}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        NIS: <span className="font-mono">{s.nis || "-"}</span> • {s.kelas?.nama_kelas || "-"}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
                          {s.keterangan_asrama === "Ya" || s.keterangan_asrama === "Mukim" ? "Asrama" : "Non-Asrama"}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700">
                          {s.jenis_kelamin === "L" ? "Putra" : "Putri"}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchTerm.trim().length > 0 && matchedStudents.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              Tidak ditemukan data santri dengan kata kunci &ldquo;{searchTerm}&rdquo;
            </div>
          )}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════════ */
        /* KONDISI 2: SANTRI SUDAH TERPILIH -> TAMPILKAN GRID POS 7 COLS / 5 COLS */
        /* ═══════════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          {/* KOLOM KIRI (7 Cols): Banner Santri & Daftar Tagihan Aktif */}
          <div className="lg:col-span-7 w-full min-w-0 space-y-6">
            {/* Banner Santri Terpilih */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#162E6E] to-[#1D4ED8] text-white flex items-center justify-center font-extrabold text-base shadow-sm shrink-0">
                    {selectedSiswa.nama?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-extrabold text-slate-800">{selectedSiswa.nama}</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                        NIS: {selectedSiswa.nis || "-"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#162E6E] border border-blue-200">
                        Kelas: {selectedSiswa.kelas?.nama_kelas || "Umum"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          selectedSiswa.keterangan_asrama === "Ya" || selectedSiswa.keterangan_asrama === "Mukim"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {selectedSiswa.keterangan_asrama === "Ya" || selectedSiswa.keterangan_asrama === "Mukim"
                          ? "Santri Asrama"
                          : "Non-Asrama"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          selectedSiswa.jenis_kelamin === "L"
                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : "bg-pink-50 text-pink-700 border border-pink-200"
                        }`}
                      >
                        {selectedSiswa.jenis_kelamin === "L" ? "Putra" : "Putri"}
                      </span>
                      {selectedSiswa.kategori_santri && selectedSiswa.kategori_santri !== "Umum" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {selectedSiswa.kategori_santri}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetStudent}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#162E6E] hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all cursor-pointer shrink-0"
                >
                  Ganti Santri
                </button>
              </div>
            </div>

            {/* Daftar Tagihan Santri Terpilih */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#162E6E]" />
                    Daftar Tagihan Aktif Santri
                  </h3>
                  <p className="text-xs text-slate-500">
                    Centang tagihan yang akan dibayar dan masukkan nominal pembayaran
                  </p>
                </div>

                {unpaidTagihan.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllBills}
                      className="px-2.5 py-1 text-xs font-bold text-[#162E6E] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllBills}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  </div>
                )}
              </div>

              {isLoadingTagihan ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#162E6E]" />
                  <p>Memuat rincian tagihan santri...</p>
                </div>
              ) : unpaidTagihan.length === 0 ? (
                <div className="text-center py-10 px-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-sm text-emerald-950">
                      Alhamdulillah, Seluruh Tagihan Telah Lunas!
                    </h4>
                    <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                      Santri <strong>{selectedSiswa.nama}</strong> tidak memiliki tanggungan pembayaran aktif saat ini.
                    </p>
                  </div>
                  {paidTagihan.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {paidTagihan.length} tagihan sebelumnya telah tercatat lunas sempurna.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {unpaidTagihan.map((t: any) => {
                    const isChecked = cartItems[t.tagihan_id] !== undefined;
                    const nominalVal = cartItems[t.tagihan_id] ?? t.sisa_tagihan;

                    return (
                      <div
                        key={t.tagihan_id}
                        className={`p-4 rounded-xl border transition-all ${
                          isChecked
                            ? "bg-blue-50/50 border-[#162E6E]/50 ring-1 ring-[#162E6E]/30 shadow-2xs"
                            : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleBill(t.tagihan_id, t.sisa_tagihan)}
                              className="w-4 h-4 mt-0.5 rounded text-[#162E6E] focus:ring-[#162E6E] cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5 flex-wrap">
                                <span>{t.nama_tagihan}</span>
                                <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-slate-100 text-slate-600">
                                  {t.pos?.nama_pos || "Pos Pembayaran"}
                                </span>
                                {t.nominal_terbayar > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800">
                                    Dicicil
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                                <span>Total: {formatRupiah(t.nominal_total)}</span>
                                {t.nominal_terbayar > 0 && (
                                  <span>• Sudah Bayar: {formatRupiah(t.nominal_terbayar)}</span>
                                )}
                                <span>• Sisa: <strong className="text-rose-600">{formatRupiah(t.sisa_tagihan)}</strong></span>
                              </div>
                            </div>
                          </label>

                          {/* Input Nominal Bayar dengan Pemisah Titik (Point 4) */}
                          {isChecked && (
                            <div className="w-full sm:w-48 bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs space-y-1.5 shrink-0">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                                <span>Nominal Bayar</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCartItems({ ...cartItems, [t.tagihan_id]: t.sisa_tagihan })
                                  }
                                  className="text-[#162E6E] hover:underline cursor-pointer"
                                  title="Isi sisa tagihan penuh"
                                >
                                  Lunas Penuh
                                </button>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">Rp</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={formatNumberWithDots(nominalVal)}
                                  onChange={(e) =>
                                    handleBillNominalChange(t.tagihan_id, e.target.value, t.sisa_tagihan)
                                  }
                                  placeholder="0"
                                  className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 text-right focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]/30 focus:border-[#162E6E]"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* KOLOM KANAN (5 Cols): Keranjang Kasir, Uang Tunai, Kembalian & Proses */}
          <div className="lg:col-span-5 w-full min-w-0 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 space-y-5 sticky top-6">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-[#162E6E]" />
                  <h3 className="font-bold text-slate-800 text-sm">Ringkasan Kasir</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-[#162E6E] font-bold rounded-lg border border-blue-200">
                  Loket Tunai
                </span>
              </div>

              {/* List Item Terpilih */}
              <div className="space-y-2 min-h-[90px] max-h-52 overflow-y-auto pr-1">
                {Object.keys(cartItems).length === 0 ? (
                  <div className="text-center py-7 text-slate-400">
                    <Coins className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs">Belum ada tagihan yang dipilih dari daftar sebelah kiri.</p>
                  </div>
                ) : (
                  Object.entries(cartItems).map(([id, nominal]) => {
                    const tagihanObj = studentTagihanList.find(
                      (t: any) => t.tagihan_id === parseInt(id, 10)
                    );
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                      >
                        <div className="overflow-hidden pr-2 min-w-0">
                          <div className="font-bold text-slate-800 truncate">
                            {tagihanObj?.nama_tagihan || `Tagihan #${id}`}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {tagihanObj?.pos?.nama_pos || "Biaya Santri"}
                          </div>
                        </div>
                        <div className="font-extrabold text-[#162E6E] shrink-0">
                          {formatRupiah(nominal)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Total Kasir Box (Theme Blue #162E6E to #1D4ED8) */}
              <div className="bg-gradient-to-br from-[#162E6E] to-[#1D4ED8] text-white p-4 rounded-2xl space-y-1 shadow-md">
                <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">
                  Total Tagihan Harus Dibayar
                </div>
                <div className="text-2xl font-black">{formatRupiah(totalBayar)}</div>
                {totalBayar > 0 && (
                  <div className="text-[11px] text-blue-100/90 italic pt-0.5 truncate">
                    {terbilangRupiah(totalBayar)}
                  </div>
                )}
              </div>

              {/* Input Uang Tunai Diterima dengan Titik Ribuan (Point 4) */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  Uang Diterima dari Santri/Wali (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberWithDots(uangDiterima)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setUangDiterima(digits);
                    }}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                  />
                </div>

                {/* Pecahan Cepat (Quick Cash Chips) */}
                <div className="flex flex-wrap gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setUangDiterima(totalBayar > 0 ? String(totalBayar) : "")}
                    className="px-2 py-1 text-[10px] font-bold rounded-lg bg-blue-50 text-[#162E6E] border border-blue-200 hover:bg-blue-100 cursor-pointer"
                  >
                    Uang Pas
                  </button>
                  {[50000, 100000, 200000, 500000, 1000000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => setUangDiterima(String(nominal))}
                      className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 cursor-pointer"
                    >
                      {nominal >= 1000000 ? `${nominal / 1000000} Jt` : `${nominal / 1000} Rb`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kembalian Box */}
              {totalBayar > 0 && nominalUangDiterima > 0 && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    nominalUangDiterima >= totalBayar
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider">
                      {nominalUangDiterima >= totalBayar ? "Kembalian Kasir:" : "Uang Masih Kurang:"}
                    </div>
                    <div className="text-lg font-black mt-0.5">
                      {nominalUangDiterima >= totalBayar
                        ? formatRupiah(kembalian)
                        : formatRupiah(totalBayar - nominalUangDiterima)}
                    </div>
                  </div>
                  <div className="text-right">
                    {nominalUangDiterima >= totalBayar ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                    )}
                  </div>
                </div>
              )}

              {/* Catatan Tambahan Kasir */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Transaksi (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Diterima tunai dari wali santri di loket kantor..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]/20 focus:border-[#162E6E]"
                />
              </div>

              {/* Tombol Proses Bayar */}
              <button
                type="button"
                onClick={handleProsesBayar}
                disabled={bayarMutation.isPending || totalBayar <= 0}
                className="w-full py-3.5 bg-[#162E6E] hover:bg-[#122456] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {bayarMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Memproses Kasir...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    Simpan & Cetak Kuitansi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL BUKTI PEMBAYARAN RESMI (PROFESIONAL SESUAI REFERENSI)            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <BuktiPembayaranModal
        isOpen={showKuitansiModal}
        onClose={() => {
          setShowKuitansiModal(false);
          handleResetStudent();
        }}
        onPrintAfter={() => {
          setShowKuitansiModal(false);
          handleResetStudent();
          toast.success("Transaksi selesai dan kuitansi dicetak. Loket siap melayani santri berikutnya.");
        }}
        data={
          lastKuitansi
            ? {
                nomor_transaksi: lastKuitansi.nomor_transaksi,
                tanggal_bayar: lastKuitansi.tanggal_bayar,
                created_at: lastKuitansi.created_at,
                siswa: lastKuitansi.siswa,
                items: lastKuitansi.items_detail?.map((item: any) => ({
                  keterangan: item.nama_tagihan || item.nama_pos || "Biaya Pendidikan",
                  nominal: item.nominal_bayar,
                  nominal_total: item.nominal_total,
                  sisa_tagihan: item.sisa_tagihan,
                  is_cicilan: item.is_cicilan,
                })),
                total_bayar: lastKuitansi.total_bayar,
                metode_pembayaran: "Tunai (Loket Kasir)",
                status: lastKuitansi.items_detail?.some((it: any) => it.is_cicilan)
                  ? "SEBAGIAN (CICILAN)"
                  : "LUNAS",
                petugas: "Admin Keuangan",
                catatan: lastKuitansi.catatan,
              }
            : null
        }
      />
    </div>
  );
}
