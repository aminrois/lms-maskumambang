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
  Search,
  Edit2,
  X,
  BookOpen,
  Phone,
  Hash,
  Key,
  User,
  CheckCircle,
  XCircle,
  ChevronRight,
  ClipboardList,
  UserCog,
} from "lucide-react";
import {
  tahfidzService,
  type TahfidzPengampuItem,
  type GuruTahfidzItem,
} from "../../../lib/api/services/tahfidzService";
import { restClient } from "../../../lib/api/axios";
import { useAuthStore } from "../../../store/useAuthStore";

type Tab = "penugasan" | "guru";

// ─── MODAL: Tambah / Edit Penugasan ───────────────────────────────────────────
interface PenugasanModalProps {
  mode: "add" | "edit";
  item?: TahfidzPengampuItem;
  initialLembagaId?: string;
  lembagas: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const PenugasanModal: React.FC<PenugasanModalProps> = ({
  mode,
  item,
  initialLembagaId,
  lembagas,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [lembagaId, setLembagaId] = useState(
    item?.lembaga_id
      ? String(item.lembaga_id)
      : initialLembagaId && initialLembagaId !== "ALL"
      ? initialLembagaId
      : ""
  );
  const [pegawaiId, setPegawaiId] = useState(
    item?.pegawai_id ? String(item.pegawai_id) : ""
  );
  const [kelasId, setKelasId] = useState(
    item?.kelas_id ? String(item.kelas_id) : ""
  );

  const { data: pegawais = [], isLoading: loadingPegawai } = useQuery({
    queryKey: ["pegawai-list", lembagaId],
    queryFn: async () => {
      if (!lembagaId) return [];
      const res = await restClient.get("/pegawai", {
        params: {
          lembaga_id: `eq.${lembagaId}`,
          status: "eq.Aktif",
          order: "nama.asc",
        },
      });
      return res.data || [];
    },
    enabled: !!lembagaId,
  });

  const { data: kelases = [], isLoading: loadingKelas } = useQuery({
    queryKey: ["kelas-list", lembagaId],
    queryFn: async () => {
      if (!lembagaId) return [];
      const res = await restClient.get(`/kelas?lembaga_id=eq.${lembagaId}&order=nama_kelas.asc`);
      return res.data || [];
    },
    enabled: !!lembagaId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (mode === "add") {
        return tahfidzService.assignPengampu({
          pegawai_id: Number(pegawaiId),
          lembaga_id: Number(lembagaId),
          kelas_id: Number(kelasId),
        });
      } else {
        return tahfidzService.updatePengampu(item!.pengampu_id, {
          pegawai_id: Number(pegawaiId),
          lembaga_id: Number(lembagaId),
          kelas_id: Number(kelasId),
        });
      }
    },
    onSuccess: () => {
      toast.success(
        mode === "add"
          ? "Penugasan berhasil disimpan!"
          : "Penugasan berhasil diperbarui!"
      );
      queryClient.invalidateQueries({ queryKey: ["tahfidz-pengampu"] });
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || err.message || "Gagal menyimpan penugasan."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pegawaiId || !lembagaId || !kelasId) {
      toast.error("Semua field wajib dipilih.");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 text-blue-950 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {mode === "add" ? "Tugaskan Guru ke Kelas" : "Edit Penugasan"}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lembaga Pendidikan <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={lembagaId}
              onChange={(e) => {
                setLembagaId(e.target.value);
                setPegawaiId("");
                setKelasId("");
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Guru / Pengajar Tahfidz <span className="text-rose-500">*</span>
            </label>
            <select
              required
              disabled={!lembagaId || loadingPegawai}
              value={pegawaiId}
              onChange={(e) => setPegawaiId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium disabled:opacity-50"
            >
              <option value="">
                {!lembagaId
                  ? "-- Pilih Lembaga Terlebih Dahulu --"
                  : loadingPegawai
                  ? "-- Memuat daftar guru... --"
                  : pegawais.length === 0
                  ? "-- Tidak ada guru di lembaga ini --"
                  : "-- Pilih Guru / Pegawai --"}
              </option>
              {pegawais.map((p: any) => (
                <option key={p.pegawai_id} value={p.pegawai_id}>
                  {p.nama} {p.nig ? `(${p.nig})` : ""} {p.jabatan ? `• ${p.jabatan}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Kelas / Halaqah Santri <span className="text-rose-500">*</span>
            </label>
            <select
              required
              disabled={!lembagaId || loadingKelas}
              value={kelasId}
              onChange={(e) => setKelasId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium disabled:opacity-50"
            >
              <option value="">
                {!lembagaId
                  ? "-- Pilih Lembaga Terlebih Dahulu --"
                  : loadingKelas
                  ? "-- Memuat daftar kelas... --"
                  : kelases.length === 0
                  ? "-- Tidak ada kelas di lembaga ini --"
                  : "-- Pilih Kelas --"}
              </option>
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
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending || !pegawaiId || !kelasId}
              className="px-5 py-2.5 bg-[#1e2f65] hover:bg-[#2A4080] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-900/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saveMutation.isPending ? "Menyimpan..." : "Simpan Penugasan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── MODAL: Tambah / Edit Guru Tahfidz ────────────────────────────────────────
interface GuruModalProps {
  mode: "add" | "edit";
  item?: GuruTahfidzItem;
  lembagas: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const GuruModal: React.FC<GuruModalProps> = ({
  mode,
  item,
  lembagas,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [nama, setNama] = useState(item?.nama || "");
  const [nig, setNig] = useState(item?.nig || "");
  const [jenisKelamin, setJenisKelamin] = useState(item?.jenis_kelamin || "L");
  const [noHp, setNoHp] = useState(item?.no_hp || "");
  const [jabatan, setJabatan] = useState(item?.jabatan || "Guru Tahfidz");
  const [status, setStatus] = useState(item?.status || "Aktif");
  const [lembagaId, setLembagaId] = useState(
    item?.pegawai_lembaga?.[0]?.lembaga.lembaga_id
      ? String(item.pegawai_lembaga[0].lembaga.lembaga_id)
      : ""
  );
  const [username, setUsername] = useState(item?.user?.username || "");
  const [password, setPassword] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        nama, nig, jenis_kelamin: jenisKelamin, no_hp: noHp, jabatan,
        lembaga_id: lembagaId ? Number(lembagaId) : undefined,
        username: username || undefined,
        password: password || undefined,
      };
      if (mode === "add") {
        return tahfidzService.createGuruTahfidz(payload);
      } else {
        if (mode === "edit") payload.status = status;
        return tahfidzService.updateGuruTahfidz(item!.pegawai_id, payload);
      }
    },
    onSuccess: () => {
      toast.success(
        mode === "add"
          ? "Guru Tahfidz berhasil ditambahkan!"
          : "Data Guru Tahfidz berhasil diperbarui!"
      );
      queryClient.invalidateQueries({ queryKey: ["guru-tahfidz-list"] });
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || err.message || "Gagal menyimpan data."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !nig) {
      toast.error("Nama dan NIG wajib diisi.");
      return;
    }
    saveMutation.mutate();
  };

  const inputCls =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <UserCog className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {mode === "add" ? "Tambah Guru Tahfidz" : "Edit Data Guru Tahfidz"}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Ustadz Ahmad Fauzi"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                NIG <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  value={nig}
                  onChange={(e) => setNig(e.target.value)}
                  placeholder="Nomor Induk Guru"
                  className={inputCls + " pl-8"}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Kelamin</label>
              <select value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} className={inputCls}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">No. HP / WA</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className={inputCls + " pl-8"}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Jabatan</label>
              <input
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Guru Tahfidz"
                className={inputCls}
              />
            </div>

            {mode === "edit" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                  <option value="Aktif">Aktif</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              </div>
            )}

            <div className={mode === "edit" ? "" : "col-span-2"}>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Lembaga</label>
              <select value={lembagaId} onChange={(e) => setLembagaId(e.target.value)} className={inputCls}>
                <option value="">-- Pilih Lembaga --</option>
                {lembagas.map((l: any) => (
                  <option key={l.lembaga_id} value={l.lembaga_id}>
                    {l.singkatan || l.nama_lembaga}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Akun Login */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" /> Akun Login (Opsional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Username</label>
                <div className="relative">
                  <User className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 pl-7"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {mode === "edit" ? "Password Baru" : "Password"}
                </label>
                <div className="relative">
                  <Key className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "edit" ? "Kosongkan jika tidak diubah" : "Min. 8 karakter"}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 pl-7"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-900/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saveMutation.isPending ? "Menyimpan..." : mode === "add" ? "Tambah Guru" : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const PenugasanTahfidz: React.FC = () => {
  const queryClient = useQueryClient();
  const { lembaga_id } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>("penugasan");
  const [selectedLembaga, setSelectedLembaga] = useState<string>(
    lembaga_id ? String(lembaga_id) : "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Penugasan modal
  const [penugasanModal, setPenugasanModal] = useState<{ open: boolean; mode: "add" | "edit"; item?: TahfidzPengampuItem }>({ open: false, mode: "add" });

  // Guru modal
  const [guruModal, setGuruModal] = useState<{ open: boolean; mode: "add" | "edit"; item?: GuruTahfidzItem }>({ open: false, mode: "add" });

  // Fetch Lembaga List
  const { data: lembagas = [] } = useQuery({
    queryKey: ["lembaga-list"],
    queryFn: async () => {
      const res = await restClient.get("/lembaga");
      return res.data || [];
    },
  });

  // Fetch Penugasan Data
  const { data: pengampuList = [], isLoading: loadingPengampu } = useQuery<TahfidzPengampuItem[]>({
    queryKey: ["tahfidz-pengampu", selectedLembaga],
    queryFn: async () => {
      return await tahfidzService.getPengampu(
        selectedLembaga !== "ALL" ? { lembaga_id: Number(selectedLembaga) } : undefined
      );
    },
  });

  // Fetch Guru Tahfidz List
  const { data: guruList = [], isLoading: loadingGuru } = useQuery<GuruTahfidzItem[]>({
    queryKey: ["guru-tahfidz-list", selectedLembaga],
    queryFn: async () => {
      return await tahfidzService.getGuruTahfidzList(
        selectedLembaga !== "ALL" ? { lembaga_id: Number(selectedLembaga) } : undefined
      );
    },
    enabled: activeTab === "guru",
  });

  // Delete Penugasan
  const deletePengampuMutation = useMutation({
    mutationFn: (id: number) => tahfidzService.deletePengampu(id),
    onSuccess: () => {
      toast.success("Penugasan berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["tahfidz-pengampu"] });
    },
    onError: (err: any) => toast.error(err.message || "Gagal menghapus."),
  });

  // Delete Guru
  const deleteGuruMutation = useMutation({
    mutationFn: (id: number) => tahfidzService.deleteGuruTahfidz(id),
    onSuccess: () => {
      toast.success("Guru Tahfidz berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["guru-tahfidz-list"] });
    },
    onError: (err: any) => toast.error(err.message || "Gagal menghapus."),
  });

  const filteredPengampu = pengampuList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.pegawai?.nama?.toLowerCase().includes(q) ||
      item.kelas?.nama_kelas?.toLowerCase().includes(q) ||
      (item.lembaga?.singkatan || item.lembaga?.nama_lembaga || "").toLowerCase().includes(q)
    );
  });

  const filteredGuru = guruList.filter((guru) => {
    const q = searchQuery.toLowerCase();
    return (
      guru.nama?.toLowerCase().includes(q) ||
      guru.nig?.toLowerCase().includes(q) ||
      guru.jabatan?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#1e2f65] via-[#2A4080] to-[#1e2f65] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute right-20 -bottom-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-xl" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-yellow-300 backdrop-blur-xs">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Otoritas Direktur &amp; Super Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Manajemen Guru Tahfidz
            </h1>
            <p className="text-slate-200 text-sm max-w-2xl leading-relaxed">
              Kelola data Guru Tahfidz dan penugasan kelas / halaqah santri dari satu tempat.
            </p>
          </div>

          <button
            onClick={() => {
              if (activeTab === "penugasan") {
                setPenugasanModal({ open: true, mode: "add" });
              } else {
                setGuruModal({ open: true, mode: "add" });
              }
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#FACC15] hover:bg-yellow-300 text-[#1e2f65] font-black rounded-2xl shadow-lg shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all text-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>{activeTab === "penugasan" ? "Tugaskan Guru ke Kelas" : "Tambah Guru Tahfidz"}</span>
          </button>
        </div>
      </div>

      {/* Tabs + Filter */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* Tab Pills */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("penugasan")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "penugasan"
                ? "bg-[#1e2f65] text-white shadow-md shadow-blue-900/20"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Penugasan Kelas
            {pengampuList.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === "penugasan" ? "bg-white/20 text-white" : "bg-slate-300 text-slate-600"}`}>
                {pengampuList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("guru")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "guru"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            <UserCog className="w-3.5 h-3.5" />
            Data Guru Tahfidz
            {guruList.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === "guru" ? "bg-white/20 text-white" : "bg-slate-300 text-slate-600"}`}>
                {guruList.length}
              </span>
            )}
          </button>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Building className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedLembaga}
              onChange={(e) => setSelectedLembaga(e.target.value)}
              className="w-full sm:w-60 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
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
              placeholder={activeTab === "penugasan" ? "Cari guru atau kelas..." : "Cari nama atau NIG..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* ─── TAB: PENUGASAN KELAS ─────────────────────────────────────────── */}
      {activeTab === "penugasan" && (
        <>
          {loadingPengampu ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-yellow-400 rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500">Memuat penugasan Guru Tahfidz...</p>
            </div>
          ) : filteredPengampu.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-bold text-slate-800 text-base">Belum Ada Penugasan</h3>
                <p className="text-xs text-slate-500">
                  Klik tombol "Tugaskan Guru ke Kelas" untuk menghubungkan Guru Tahfidz dengan kelas santri.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPengampu.map((item) => {
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
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPenugasanModal({ open: true, mode: "edit", item })}
                            className="text-slate-300 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Penugasan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus penugasan ${item.pegawai?.nama} di kelas ${item.kelas?.nama_kelas}?`)) {
                                deletePengampuMutation.mutate(item.pengampu_id);
                              }
                            }}
                            className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Penugasan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
        </>
      )}

      {/* ─── TAB: DATA GURU TAHFIDZ ───────────────────────────────────────── */}
      {activeTab === "guru" && (
        <>
          {loadingGuru ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-yellow-400 rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500">Memuat data Guru Tahfidz...</p>
            </div>
          ) : filteredGuru.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 space-y-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <UserCog className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-bold text-slate-800 text-base">Belum Ada Guru Tahfidz</h3>
                <p className="text-xs text-slate-500">
                  Klik tombol "Tambah Guru Tahfidz" untuk menambahkan guru baru ke sistem.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-bold text-slate-600 whitespace-nowrap">Nama Guru</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-600 whitespace-nowrap">NIG</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-600 whitespace-nowrap">Jabatan</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-600 whitespace-nowrap">Lembaga</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-600 whitespace-nowrap">Kelas Diampu</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-600 whitespace-nowrap">Akun</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-600 whitespace-nowrap">Status</th>
                      <th className="text-right px-4 py-3 font-bold text-slate-600 whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGuru.map((guru) => {
                      const totalSantri = guru.tahfidz_pengampu?.reduce(
                        (sum, p) => sum + (p.kelas.siswa?.length || 0),
                        0
                      ) ?? 0;
                      const kelasList = guru.tahfidz_pengampu?.map((p) => p.kelas.nama_kelas).join(", ") || "-";
                      const lembagaNama = guru.pegawai_lembaga?.[0]?.lembaga.singkatan || guru.pegawai_lembaga?.[0]?.lembaga.nama_lembaga || "-";
                      const hasAkun = !!guru.user?.username;

                      return (
                        <tr key={guru.pegawai_id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                                {guru.nama.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{guru.nama}</p>
                                {guru.no_hp && (
                                  <p className="text-[10px] text-slate-400">{guru.no_hp}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500">{guru.nig || "-"}</td>
                          <td className="px-4 py-3 text-slate-600">{guru.jabatan || "Guru Tahfidz"}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-semibold text-[10px]">
                              {lembagaNama}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {guru.tahfidz_pengampu && guru.tahfidz_pengampu.length > 0 ? (
                              <div className="space-y-1">
                                <p className="text-slate-700 font-medium leading-tight max-w-[160px] truncate" title={kelasList}>
                                  {kelasList}
                                </p>
                                <p className="text-[10px] text-slate-400">{totalSantri} santri total</p>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Belum ditugaskan</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {hasAkun ? (
                              <div className="flex items-center gap-1.5 text-emerald-700">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span className="font-mono font-semibold">{guru.user!.username}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <XCircle className="w-3.5 h-3.5" />
                                <span className="italic">Belum ada</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                guru.status === "Aktif"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {guru.status || "Aktif"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setGuruModal({ open: true, mode: "edit", item: guru })}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus data Guru Tahfidz "${guru.nama}"? Semua penugasan halaqah guru ini juga akan dihapus.`)) {
                                    deleteGuruMutation.mutate(guru.pegawai_id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPenugasanModal({ open: true, mode: "add" })}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Tambah Penugasan"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Footer summary */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  <BookOpen className="w-3 h-3 inline mr-1" />
                  Total <strong>{filteredGuru.length}</strong> Guru Tahfidz terdaftar
                </span>
                <span>
                  Total santri dibimbing:{" "}
                  <strong>
                    {filteredGuru.reduce(
                      (sum, g) =>
                        sum +
                        (g.tahfidz_pengampu?.reduce((s, p) => s + (p.kelas.siswa?.length || 0), 0) ?? 0),
                      0
                    )}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── MODALS ──────────────────────────────────────────────────────── */}
      {penugasanModal.open && (
        <PenugasanModal
          mode={penugasanModal.mode}
          item={penugasanModal.item}
          initialLembagaId={selectedLembaga}
          lembagas={lembagas}
          onClose={() => setPenugasanModal({ open: false, mode: "add" })}
          onSuccess={() => setPenugasanModal({ open: false, mode: "add" })}
        />
      )}
      {guruModal.open && (
        <GuruModal
          mode={guruModal.mode}
          item={guruModal.item}
          lembagas={lembagas}
          onClose={() => setGuruModal({ open: false, mode: "add" })}
          onSuccess={() => setGuruModal({ open: false, mode: "add" })}
        />
      )}
    </div>
  );
};

export default PenugasanTahfidz;
