import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Compass,
  Search,
  Users,
  GraduationCap,
  Sparkles,
  ChevronRight,
  HeartPulse,
  MessageSquare,
} from "lucide-react";
import axios from "axios";

const API_BASE = "/api/v1/guidance";

export default function GuidanceIndex() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [kelasFilter, setKelasFilter] = useState("all");

  // Fetch Kelas List for Filter
  const { data: kelasList = [] } = useQuery({
    queryKey: ["guidance-kelas-list"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/kelas");
      return res.data?.data || res.data || [];
    },
  });

  // Fetch Guidance Siswa List
  const { data: siswaList = [], isLoading } = useQuery({
    queryKey: ["guidance-siswa-list", kelasFilter, searchTerm],
    queryFn: async () => {
      const params: any = {};
      if (kelasFilter !== "all") params.kelas_id = kelasFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await axios.get(`${API_BASE}/siswa`, { params });
      return res.data?.data || [];
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#162E6E] to-[#1D4ED8] flex items-center justify-center text-white shadow-md">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Guidance & Bimbingan Konseling</h1>
            <p className="text-sm text-slate-500">Profil 360° Santri, Pemetaan Fundamental, & Sesi Konsultasi Murobbi/BK</p>
          </div>
        </div>

        <button
          onClick={() => navigate("/guidance/sesi-konseling")}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#162E6E] hover:bg-[#122456] text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          Riwayat Semua Sesi Konsultasi
        </button>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Total Santri Binaan</div>
            <div className="text-xl font-extrabold text-slate-800">{siswaList.length}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Rencana Lanjut Kuliah</div>
            <div className="text-xl font-extrabold text-slate-800">
              {siswaList.filter((s: any) => s.rencana_kuliah === "Ya").length} Santri
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Profil 360° Terisi</div>
            <div className="text-xl font-extrabold text-slate-800">
              {siswaList.filter((s: any) => s.is_profile_filled).length} Santri
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Rata-rata Skor Fundamental</div>
            <div className="text-xl font-extrabold text-slate-800">
              {siswaList.length > 0
                ? (
                    siswaList.reduce((acc: number, s: any) => acc + (s.avg_fundamental || 0), 0) /
                    siswaList.length
                  ).toFixed(1)
                : "0"} / 4.0
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama santri atau NIS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Semua Kelas</option>
            {kelasList.map((k: any) => (
              <option key={k.kelas_id} value={k.kelas_id}>
                {k.nama_kelas}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Santri Guidance List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <th className="p-4">Santri</th>
                <th className="p-4">Kelas & Lembaga</th>
                <th className="p-4 text-center">Status Profil 360°</th>
                <th className="p-4 text-center">Aspek Fundamental (1-4)</th>
                <th className="p-4">Cita-Cita & Rencana Kuliah</th>
                <th className="p-4">Konsultasi Terakhir</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-400">
                    Memuat data bimbingan santri...
                  </td>
                </tr>
              ) : siswaList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-400">
                    Tidak ditemukan data santri.
                  </td>
                </tr>
              ) : (
                siswaList.map((s: any) => {
                  const fundamentalScore = s.avg_fundamental || 0;
                  return (
                    <tr
                      key={s.siswa_id}
                      onClick={() => navigate(`/guidance/siswa/${s.siswa_id}`)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="font-bold text-slate-800 text-sm">{s.nama}</div>
                        <div className="text-[11px] text-slate-500">NIS: {s.nis}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{s.kelas}</div>
                        <div className="text-[11px] text-slate-500">{s.lembaga}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            s.is_profile_filled
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {s.is_profile_filled ? "Lengkap" : "Belum Lengkap"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-extrabold text-sm text-[#162E6E]">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          {fundamentalScore > 0 ? fundamentalScore : "-"}
                          <span className="text-[10px] text-slate-400 font-normal">/ 4.0</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{s.target_pendidikan || "-"}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{s.universitas_tujuan || "-"}</div>
                      </td>
                      <td className="p-4">
                        {s.last_konseling ? (
                          <div>
                            <div className="font-semibold text-slate-800">{s.last_konseling.tanggal_sesi}</div>
                            <div className="text-[10px] text-blue-700 font-bold">{s.last_konseling.kategori}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum ada sesi</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/guidance/siswa/${s.siswa_id}`);
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                        >
                          Detail & Konseling <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
