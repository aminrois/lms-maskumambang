import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Search,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";
import axios from "axios";

const API_BASE = "/api/v1/guidance";

export default function SesiKonselingIndex() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: sesiList = [], isLoading } = useQuery({
    queryKey: ["all-konseling-sesi", kategoriFilter, statusFilter, searchTerm],
    queryFn: async () => {
      const params: any = {};
      if (kategoriFilter !== "all") params.kategori = kategoriFilter;
      if (statusFilter !== "all") params.status_follow_up = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await axios.get(`${API_BASE}/konseling`, { params });
      return res.data?.data || [];
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/guidance")}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#162E6E] to-[#1D4ED8] flex items-center justify-center text-white shadow-md">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Riwayat Sesi Konsultasi & BK</h1>
            <p className="text-sm text-slate-500">Log konseling, catatan dialog empat mata, dan follow-up santri</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari topik masalah, nama santri, atau keluhan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Semua Kategori</option>
            {["Akademik", "Karakter & Kedisiplinan", "Sosial & Emosional", "Keluarga", "Karier & Studi Lanjut", "Kesehatan", "Lainnya"].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Semua Status Follow-Up</option>
            <option value="Dalam Pemantauan">Dalam Pemantauan</option>
            <option value="Selesai">Selesai</option>
            <option value="Perlu Rujukan Lanjut">Perlu Rujukan Lanjut</option>
          </select>
        </div>
      </div>

      {/* List Sesi Konseling */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white p-12 rounded-2xl text-center text-slate-400 border border-slate-100">
            Memuat data sesi konsultasi...
          </div>
        ) : sesiList.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center text-slate-400 border border-slate-100">
            <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">Tidak ada sesi konsultasi yang ditemukan.</p>
          </div>
        ) : (
          sesiList.map((sesi: any) => (
            <div
              key={sesi.konseling_id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3 border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-blue-50 text-[#1D4ED8] text-xs font-bold rounded-lg">
                    {sesi.kategori}
                  </span>
                  <h3 className="font-bold text-base text-slate-800">{sesi.topik_konseling}</h3>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Tanggal: <strong className="text-slate-700">{sesi.tanggal_sesi}</strong></span>
                  <span>Konselor: <strong className="text-slate-700">{sesi.pegawai?.nama || "Guru BK"}</strong></span>
                  <button
                    onClick={() => navigate(`/guidance/siswa/${sesi.siswa_id}`)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    Buka Profil <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Santri Info */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="text-slate-400">Santri:</span>
                <span className="font-bold text-[#162E6E]">{sesi.siswa?.nama}</span>
                <span className="text-slate-400">({sesi.siswa?.nis} - {sesi.siswa?.kelas?.nama_kelas || "-"})</span>
              </div>

              {/* Keluhan & Solusi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-600 uppercase text-[10px]">Uraian Masalah:</span>
                  <p className="text-slate-800 leading-relaxed">{sesi.keluhan_masalah}</p>
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-1">
                  <span className="font-bold text-emerald-800 uppercase text-[10px]">Solusi & Rencana Aksi:</span>
                  <p className="text-slate-800 leading-relaxed">{sesi.solusi_kesepakatan || "Belum ada rencana tindak lanjut."}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500">
                  Status Tindak Lanjut: <strong className="text-blue-800">{sesi.status_follow_up}</strong>
                </span>
                <span className="text-slate-500">
                  Sifat: <strong className="text-slate-700">{sesi.sifat_rahasia}</strong>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
