// src/pages/Tahfidz/Riwayat/RiwayatSetoran.tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  History,
  Search,
  Trash2
} from "lucide-react";
import { tahfidzService, type TahfidzSetoranItem } from "../../../lib/api/services/tahfidzService";

const RiwayatSetoranTahfidz: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters
  const [kategoriFilter, setKategoriFilter] = useState<string>("ALL");
  const [jenisFilter, setJenisFilter] = useState<string>("ALL");
  const [tanggalMulai, setTanggalMulai] = useState<string>("");
  const [tanggalAkhir, setTanggalAkhir] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination
  const [page, setPage] = useState<number>(0);
  const pageSize = 20;

  // Fetch Riwayat Setoran
  const { data, isLoading } = useQuery({
    queryKey: [
      "tahfidz-setoran",
      kategoriFilter,
      jenisFilter,
      tanggalMulai,
      tanggalAkhir,
      page,
    ],
    queryFn: async () => {
      return await tahfidzService.getSetoranList({
        kategori: kategoriFilter !== "ALL" ? kategoriFilter : undefined,
        jenis_hafalan: jenisFilter !== "ALL" ? jenisFilter : undefined,
        tanggal_mulai: tanggalMulai || undefined,
        tanggal_akhir: tanggalAkhir || undefined,
        limit: pageSize,
        offset: page * pageSize,
      });
    },
    staleTime: 30 * 1000,
  });

  const setoranList: TahfidzSetoranItem[] = data?.data || [];
  const totalCount = data?.meta?.total || 0;

  // Mutation to Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await tahfidzService.deleteSetoran(id);
    },
    onSuccess: () => {
      toast.success("Catatan setoran berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["tahfidz-setoran"] });
      queryClient.invalidateQueries({ queryKey: ["tahfidz-statistik-siswa"] });
      queryClient.invalidateQueries({ queryKey: ["tahfidz-statistik-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menghapus setoran.");
    },
  });

  // Client-side search filter
  const filteredList = setoranList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const namaSiswa = item.siswa?.nama?.toLowerCase() || "";
    const nisn = item.siswa?.nisn?.toLowerCase() || "";
    const guru = item.pegawai?.nama?.toLowerCase() || "";
    const catatan = item.catatan_guru?.toLowerCase() || "";
    const surat = (item.surat_mulai_nama || "").toLowerCase();
    const kitab = (item.kitab_hadits || "").toLowerCase();
    const matan = (item.nama_matan || "").toLowerCase();

    return (
      namaSiswa.includes(q) ||
      nisn.includes(q) ||
      guru.includes(q) ||
      catatan.includes(q) ||
      surat.includes(q) ||
      kitab.includes(q) ||
      matan.includes(q)
    );
  });

  // Render Capaian Badge / Summary
  const renderCapaianText = (item: TahfidzSetoranItem) => {
    if (item.kategori === "Al-Quran") {
      if (item.surat_mulai === item.surat_selesai) {
        return `QS. ${item.surat_mulai_nama || item.surat_mulai}: Ayat ${item.ayat_mulai} - ${item.ayat_selesai} (${item.total_ayat || 0} Ayat)`;
      }
      return `QS. ${item.surat_mulai_nama} (${item.ayat_mulai}) s/d QS. ${item.surat_selesai_nama} (${item.ayat_selesai}) — ${item.total_ayat || 0} Ayat`;
    } else if (item.kategori === "Hadits") {
      return `${item.kitab_hadits}: Hadits No. ${item.hadits_no_mulai} s/d ${item.hadits_no_selesai} (${item.total_hadits || 0} Hadits)`;
    } else if (item.kategori === "Matan Ilmu") {
      return `${item.nama_matan}: Bait No. ${item.bait_mulai} s/d ${item.bait_selesai} (${item.total_bait || 0} Bait)`;
    }
    return "-";
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#2D3748] via-[#4A5568] to-[#2D3748] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-slate-200 backdrop-blur-xs">
              <History className="w-3.5 h-3.5" />
              <span>Log Riwayat Setoran</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Riwayat & Rekapitulasi Setoran Hafalan
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Daftar seluruh catatan setoran hafalan santri (Al-Qur'an, Hadits, Matan Ilmu) yang telah disimak oleh Guru Tahfidz beserta tingkat kelancaran dan catatan evaluasi.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
            <span className="block text-[10px] text-slate-300 font-bold uppercase">Total Catatan</span>
            <span className="text-xl font-black text-white">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Kategori */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Kategori
            </label>
            <select
              value={kategoriFilter}
              onChange={(e) => {
                setKategoriFilter(e.target.value);
                setPage(0);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Al-Quran">Al-Qur'an</option>
              <option value="Hadits">Hadits</option>
              <option value="Matan Ilmu">Matan Ilmu</option>
            </select>
          </div>

          {/* Jenis Setoran */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Jenis Setoran
            </label>
            <select
              value={jenisFilter}
              onChange={(e) => {
                setJenisFilter(e.target.value);
                setPage(0);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">Semua Jenis</option>
              <option value="Setoran Baru">Setoran Baru (Ziyadah)</option>
              <option value="Setoran Ulang">Setoran Ulang (Muraja'ah)</option>
              <option value="Ujian">Ujian (Ikhtibar/Tasmi')</option>
            </select>
          </div>

          {/* Tanggal Mulai */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={tanggalMulai}
              onChange={(e) => {
                setTanggalMulai(e.target.value);
                setPage(0);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            />
          </div>

          {/* Tanggal Akhir */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={tanggalAkhir}
              onChange={(e) => {
                setTanggalAkhir(e.target.value);
                setPage(0);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            />
          </div>
        </div>

        {/* Search & Reset */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-3 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari santri, guru, surat, atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl outline-none focus:ring-2 focus:ring-slate-400/20"
            />
          </div>

          {(kategoriFilter !== "ALL" || jenisFilter !== "ALL" || tanggalMulai || tanggalAkhir || searchQuery) && (
            <button
              onClick={() => {
                setKategoriFilter("ALL");
                setJenisFilter("ALL");
                setTanggalMulai("");
                setTanggalAkhir("");
                setSearchQuery("");
                setPage(0);
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer self-end sm:self-auto"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Tabel Data Setoran */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <div className="w-10 h-10 border-4 border-slate-600 border-t-yellow-400 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">Memuat riwayat setoran...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <History className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Tidak Ada Catatan Setoran</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Belum ada riwayat setoran hafalan yang cocok dengan kriteria filter saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Tanggal & Waktu</th>
                  <th className="py-3.5 px-4">Santri & Kelas</th>
                  <th className="py-3.5 px-4">Kategori & Capaian</th>
                  <th className="py-3.5 px-4">Jenis Setoran</th>
                  <th className="py-3.5 px-4">Kelancaran</th>
                  <th className="py-3.5 px-4">Guru Penilai</th>
                  <th className="py-3.5 px-4">Catatan</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => {
                  return (
                    <tr key={item.setoran_id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Tanggal */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{item.tanggal}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.durasi_menit ? `${item.durasi_menit} Menit` : "-"}
                        </span>
                      </td>

                      {/* Santri */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{item.siswa?.nama}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.siswa?.kelas?.nama_kelas || "-"} • NISN: {item.siswa?.nisn || "-"}
                        </span>
                      </td>

                      {/* Kategori & Capaian */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {item.kategori === "Al-Quran" && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              📖 Al-Qur'an
                            </span>
                          )}
                          {item.kategori === "Hadits" && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                              📜 Hadits
                            </span>
                          )}
                          {item.kategori === "Matan Ilmu" && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                              🔖 Matan Ilmu
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-slate-800 text-xs block leading-snug">
                          {renderCapaianText(item)}
                        </span>
                      </td>

                      {/* Jenis Setoran */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.jenis_hafalan === "Setoran Baru"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {item.jenis_hafalan === "Setoran Baru" ? "✨ Ziyadah (Baru)" : "🔄 Muraja'ah (Ulang)"}
                        </span>
                      </td>

                      {/* Kelancaran */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            item.kelancaran === "Sangat Lancar"
                              ? "bg-emerald-100 text-emerald-900"
                              : item.kelancaran === "Lancar"
                              ? "bg-blue-100 text-blue-900"
                              : item.kelancaran === "Kurang Lancar"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-rose-100 text-rose-900"
                          }`}
                        >
                          {item.kelancaran}
                        </span>
                      </td>

                      {/* Guru */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 block">
                          {item.pegawai?.nama || "-"}
                        </span>
                      </td>

                      {/* Catatan */}
                      <td className="py-3.5 px-4 max-w-xs text-slate-600 text-[11px] truncate" title={item.catatan_guru || ""}>
                        {item.catatan_guru || "—"}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (confirm(`Hapus catatan setoran santri ${item.siswa?.nama}?`)) {
                              deleteMutation.mutate(item.setoran_id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Catatan Setoran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalCount > pageSize && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} dari {totalCount} setoran
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Sebelumnya
              </button>
              <span className="font-bold text-slate-700">Halaman {page + 1}</span>
              <button
                disabled={(page + 1) * pageSize >= totalCount}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiwayatSetoranTahfidz;
