import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Search,
  ChevronLeft,
  ExternalLink,
  Edit3,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
import { restClient } from "../../lib/api/axios";
import { toast } from "sonner";

const API_BASE = "/guidance";

export default function SesiKonselingIndex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // State Modal Follow-Up
  const [followUpModalData, setFollowUpModalData] = useState<{
    isOpen: boolean;
    sesi: any | null;
    status_follow_up: string;
    catatan_tindak_lanjut: string;
    solusi_kesepakatan: string;
  }>({
    isOpen: false,
    sesi: null,
    status_follow_up: "Dalam Pemantauan",
    catatan_tindak_lanjut: "",
    solusi_kesepakatan: "",
  });

  const { data: sesiList = [], isLoading } = useQuery({
    queryKey: ["all-konseling-sesi", kategoriFilter, statusFilter, searchTerm],
    queryFn: async () => {
      const params: any = {};
      if (kategoriFilter !== "all") params.kategori = kategoriFilter;
      if (statusFilter !== "all") params.status_follow_up = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await restClient.get(`${API_BASE}/konseling`, { params });
      return res.data?.data || [];
    },
  });

  // Mutation Update Follow Up
  const updateFollowUpMutation = useMutation({
    mutationFn: async ({
      konseling_id,
      status_follow_up,
      catatan_tindak_lanjut,
      solusi_kesepakatan,
    }: {
      konseling_id: number;
      status_follow_up: string;
      catatan_tindak_lanjut: string;
      solusi_kesepakatan: string;
    }) => {
      const res = await restClient.patch(`${API_BASE}/konseling/${konseling_id}`, {
        status_follow_up,
        catatan_tindak_lanjut,
        solusi_kesepakatan,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Status follow-up berhasil diperbarui!");
      setFollowUpModalData({
        isOpen: false,
        sesi: null,
        status_follow_up: "Dalam Pemantauan",
        catatan_tindak_lanjut: "",
        solusi_kesepakatan: "",
      });
      queryClient.invalidateQueries({ queryKey: ["all-konseling-sesi"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal memperbarui status follow-up.");
    },
  });

  const openFollowUpModal = (sesi: any) => {
    setFollowUpModalData({
      isOpen: true,
      sesi,
      status_follow_up: sesi.status_follow_up || "Dalam Pemantauan",
      catatan_tindak_lanjut: sesi.catatan_tindak_lanjut || "",
      solusi_kesepakatan: sesi.solusi_kesepakatan || "",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Selesai":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
          </span>
        );
      case "Dirujuk ke Pihak Luar":
      case "Perlu Rujukan Lanjut":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <ExternalLink className="w-3.5 h-3.5" /> Dirujuk ke Pihak Luar
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1D4ED8] border border-blue-200">
            <Clock className="w-3.5 h-3.5" /> Dalam Pemantauan
          </span>
        );
    }
  };

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
            <p className="text-sm text-slate-500">Log konseling, catatan dialog empat mata, dan pemantauan follow-up santri</p>
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

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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
            <option value="Dirujuk ke Pihak Luar">Dirujuk ke Pihak Luar</option>
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

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(sesi.tanggal_sesi).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span>Konselor/Murobbi: <strong className="text-slate-700">{sesi.pegawai?.nama || "Murobbi"}</strong></span>
                  <button
                    onClick={() => navigate(`/guidance/siswa/${sesi.siswa_id}`)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all"
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
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{sesi.keluhan_masalah}</p>
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-1">
                  <span className="font-bold text-emerald-800 uppercase text-[10px]">Solusi & Rencana Aksi:</span>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{sesi.solusi_kesepakatan || "Belum ada rencana tindak lanjut."}</p>
                </div>
              </div>

              {sesi.catatan_tindak_lanjut && (
                <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 text-xs">
                  <span className="font-bold text-purple-900 block mb-1">Catatan Follow-Up & Perkembangan Kasus:</span>
                  <p className="text-slate-700 whitespace-pre-wrap">{sesi.catatan_tindak_lanjut}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Status:</span>
                  {getStatusBadge(sesi.status_follow_up)}
                  <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 font-medium">
                    {sesi.sifat_rahasia}
                  </span>
                </div>

                {/* Tombol Follow Up */}
                <button
                  onClick={() => openFollowUpModal(sesi)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-[#162E6E] text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Follow Up / Update Status
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── MODAL FOLLOW-UP SESI KONSULTASI ─────────────────────────── */}
      {followUpModalData.isOpen && followUpModalData.sesi && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">Follow-Up Sesi Konsultasi</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Santri: <strong className="text-slate-700">{followUpModalData.sesi.siswa?.nama}</strong> • Topik: <strong className="text-slate-700">{followUpModalData.sesi.topik_konseling}</strong>
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Pilih Status Perkembangan Kasus *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { value: "Dalam Pemantauan", label: "Dalam Pemantauan", desc: "Masih observasi", color: "border-blue-300 text-blue-800 bg-blue-50/50" },
                    { value: "Selesai", label: "Selesai", desc: "Kasus tuntas", color: "border-emerald-300 text-emerald-800 bg-emerald-50/50" },
                    { value: "Dirujuk ke Pihak Luar", label: "Dirujuk ke Pihak Luar", desc: "Dilempar ke pihak eksternal", color: "border-purple-300 text-purple-800 bg-purple-50/50" },
                  ].map((opt) => {
                    const isSelected = followUpModalData.status_follow_up === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFollowUpModalData({ ...followUpModalData, status_follow_up: opt.value })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? `${opt.color} ring-2 ring-blue-500 shadow-sm font-bold`
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-bold text-xs">{opt.label}</span>
                        <span className="text-[10px] text-slate-400 mt-1">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Follow-Up / Keterangan Pihak Luar *
                </label>
                <textarea
                  rows={4}
                  placeholder={
                    followUpModalData.status_follow_up === "Dirujuk ke Pihak Luar"
                      ? "Jelaskan alasan dan kepada pihak luar mana santri dirujuk (misal: Dokter Spesialis RS Islam, Psikolog Luar, Orang Tua Khusus, dll)..."
                      : followUpModalData.status_follow_up === "Selesai"
                      ? "Tuliskan ringkasan hasil akhir dan evaluasi bahwa masalah santri telah terselesaikan..."
                      : "Tuliskan catatan perkembangan dan jadwal pemantauan lanjutan bersama santri..."
                  }
                  value={followUpModalData.catatan_tindak_lanjut}
                  onChange={(e) => setFollowUpModalData({ ...followUpModalData, catatan_tindak_lanjut: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162E6E]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Solusi & Kesepakatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Tambahkan kesepakatan baru jika ada..."
                  value={followUpModalData.solusi_kesepakatan}
                  onChange={(e) => setFollowUpModalData({ ...followUpModalData, solusi_kesepakatan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setFollowUpModalData({ ...followUpModalData, isOpen: false })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  updateFollowUpMutation.mutate({
                    konseling_id: followUpModalData.sesi.konseling_id,
                    status_follow_up: followUpModalData.status_follow_up,
                    catatan_tindak_lanjut: followUpModalData.catatan_tindak_lanjut,
                    solusi_kesepakatan: followUpModalData.solusi_kesepakatan,
                  });
                }}
                disabled={updateFollowUpMutation.isPending}
                className="px-4 py-2 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
              >
                {updateFollowUpMutation.isPending ? "Menyimpan..." : "Simpan Follow Up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
