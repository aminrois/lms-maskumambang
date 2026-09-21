// src/pages/Tahfidz/Penugasan/Index.tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UserCheck,
  Plus,
  Trash2,
  Building,
  GraduationCap,
  Users,
  Search
} from "lucide-react";
import { tahfidzService, type TahfidzPengampuItem } from "../../../lib/api/services/tahfidzService";
import { restClient } from "../../../lib/api/axios";
import { useAuthStore } from "../../../store/useAuthStore";

const PenugasanTahfidz: React.FC = () => {
  const queryClient = useQueryClient();
  const { lembaga_id } = useAuthStore();

  const [selectedLembaga, setSelectedLembaga] = useState<string>(lembaga_id ? String(lembaga_id) : "ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formPegawaiId, setFormPegawaiId] = useState("");
  const [formLembagaId, setFormLembagaId] = useState("");
  const [formKelasId, setFormKelasId] = useState("");

  // 1. Fetch Lembaga List
  const { data: lembagas = [] } = useQuery({
    queryKey: ["lembaga-list"],
    queryFn: async () => {
      const res = await restClient.get("/lembaga");
      return res.data || [];
    },
  });

  // 2. Fetch Pegawai List (Guru / Guru Tahfidz)
  const { data: pegawais = [] } = useQuery({
    queryKey: ["pegawai-list", formLembagaId],
    queryFn: async () => {
      const res = await restClient.get("/pegawai", {
        params: formLembagaId ? { lembaga_id: formLembagaId } : undefined,
      });
      return res.data || [];
    },
  });

  // 3. Fetch Kelas List for Selected Lembaga in Form
  const { data: kelases = [] } = useQuery({
    queryKey: ["kelas-list", formLembagaId],
    queryFn: async () => {
      if (!formLembagaId) return [];
      const res = await restClient.get(`/kelas?lembaga_id=eq.${formLembagaId}`);
      return res.data || [];
    },
    enabled: !!formLembagaId,
  });

  // 4. Fetch Penugasan Data
  const { data: pengampuList = [], isLoading } = useQuery<TahfidzPengampuItem[]>({
    queryKey: ["tahfidz-pengampu", selectedLembaga],
    queryFn: async () => {
      return await tahfidzService.getPengampu(
        selectedLembaga !== "ALL" ? { lembaga_id: Number(selectedLembaga) } : undefined
      );
    },
  });

  // 5. Mutation: Assign
  const assignMutation = useMutation({
    mutationFn: async () => {
      return await tahfidzService.assignPengampu({
        pegawai_id: Number(formPegawaiId),
        lembaga_id: Number(formLembagaId),
        kelas_id: Number(formKelasId),
      });
    },
    onSuccess: () => {
      toast.success("Penugasan Guru Tahfidz berhasil disimpan!");
      setIsModalOpen(false);
      setFormPegawaiId("");
      setFormKelasId("");
      queryClient.invalidateQueries({ queryKey: ["tahfidz-pengampu"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Gagal menyimpan penugasan.");
    },
  });

  // 6. Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await tahfidzService.deletePengampu(id);
    },
    onSuccess: () => {
      toast.success("Penugasan berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["tahfidz-pengampu"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menghapus penugasan.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPegawaiId || !formLembagaId || !formKelasId) {
      toast.error("Semua field formulir penugasan wajib dipilih.");
      return;
    }
    assignMutation.mutate();
  };

  const filteredList = pengampuList.filter((item) => {
    const guruNama = item.pegawai?.nama?.toLowerCase() || "";
    const kelasNama = item.kelas?.nama_kelas?.toLowerCase() || "";
    const lembagaNama = (item.lembaga?.singkatan || item.lembaga?.nama_lembaga || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return guruNama.includes(query) || kelasNama.includes(query) || lembagaNama.includes(query);
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#1e2f65] via-[#2A4080] to-[#1e2f65] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-yellow-300 backdrop-blur-xs">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Otoritas Direktur & Super Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Penugasan Guru Tahfidz
            </h1>
            <p className="text-slate-200 text-sm max-w-2xl leading-relaxed">
              Tentukan Guru Tahfidz pengampu untuk setiap kelas atau halaqah santri. Guru yang ditugaskan akan memiliki kontrol penuh atas aktivitas hafalan santri di kelas tersebut.
            </p>
          </div>

          <button
            onClick={() => {
              if (selectedLembaga !== "ALL") {
                setFormLembagaId(selectedLembaga);
              }
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#FACC15] hover:bg-yellow-300 text-[#1e2f65] font-black rounded-2xl shadow-lg shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all text-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Tugaskan Guru ke Kelas</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Building className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedLembaga}
            onChange={(e) => setSelectedLembaga(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Semua Lembaga Pendidikan</option>
            {lembagas.map((l: any) => (
              <option key={l.lembaga_id} value={l.lembaga_id}>
                {l.singkatan || l.nama_lembaga}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari guru atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Grid List Penugasan */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-yellow-400 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">Memuat penugasan Guru Tahfidz...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-bold text-slate-800 text-base">Belum Ada Penugasan Guru Tahfidz</h3>
            <p className="text-xs text-slate-500">
              Silakan klik tombol "Tugaskan Guru ke Kelas" di atas untuk menghubungkan Guru Tahfidz dengan kelas santri.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => {
            const jmlSantri = item.kelas?.siswa?.length || 0;
            return (
              <div
                key={item.pengampu_id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      🏛️ {item.lembaga?.singkatan || item.lembaga?.nama_lembaga}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus penugasan ${item.pegawai?.nama} di kelas ${item.kelas?.nama_kelas}?`)) {
                          deleteMutation.mutate(item.pengampu_id);
                        }
                      }}
                      className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Penugasan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {item.pegawai?.nama || "Guru Tahfidz"}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      NIG: {item.pegawai?.nig || "-"} • {item.pegawai?.jabatan || "Pengajar"}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Kelas Diampu</span>
                        <span className="text-xs font-bold text-slate-800">{item.kelas?.nama_kelas}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100/80 text-emerald-800 rounded-lg">
                      {jmlSantri} Santri
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Status: <strong className="text-emerald-600">Aktif Mengampu</strong></span>
                  <span>{new Date(item.created_at).toLocaleDateString("id-ID")}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form Penugasan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-yellow-400 text-blue-950 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Tugaskan Guru Tahfidz</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pilih Lembaga */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lembaga Pendidikan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formLembagaId}
                  onChange={(e) => {
                    setFormLembagaId(e.target.value);
                    setFormKelasId("");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="">-- Pilih Lembaga --</option>
                  {lembagas.map((l: any) => (
                    <option key={l.lembaga_id} value={l.lembaga_id}>
                      {l.nama_lembaga} ({l.singkatan})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilih Guru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Guru / Pengajar Tahfidz <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formPegawaiId}
                  onChange={(e) => setFormPegawaiId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="">-- Pilih Guru / Pegawai --</option>
                  {pegawais.map((p: any) => (
                    <option key={p.pegawai_id} value={p.pegawai_id}>
                      {p.nama} ({p.nig || p.jabatan || "Guru"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilih Kelas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kelas / Halaqah Santri <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  disabled={!formLembagaId}
                  value={formKelasId}
                  onChange={(e) => setFormKelasId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium disabled:opacity-50"
                >
                  <option value="">-- {formLembagaId ? "Pilih Kelas" : "Pilih Lembaga Terlebih Dahulu"} --</option>
                  {kelases.map((k: any) => (
                    <option key={k.kelas_id} value={k.kelas_id}>
                      {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={assignMutation.isPending}
                  className="px-5 py-2.5 bg-[#1e2f65] hover:bg-[#2A4080] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-900/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {assignMutation.isPending ? "Menyimpan..." : "Simpan Penugasan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenugasanTahfidz;
