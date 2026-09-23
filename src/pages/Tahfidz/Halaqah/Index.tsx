// src/pages/Tahfidz/Halaqah/Index.tsx
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Plus, Search, RefreshCw, Trash2, Edit3, Eye,
  X, Zap, CheckCircle2, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { tahfidzService, type HalaqahItem } from "../../../lib/api/services/tahfidzService";
import { apiClient } from "../../../lib/api/axios";

const getInitials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const STATUS_COLORS: Record<string, string> = {
  Aktif: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Tidak Aktif": "bg-red-100 text-red-700 border-red-200",
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${color}`}>
      {label}
    </span>
  );
}

const KelompokHalaqahPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [lembagaId, setLembagaId] = useState<string>("");
  const [tahunId, setTahunId] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showKolosalModal, setShowKolosalModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editTarget, setEditTarget] = useState<HalaqahItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<HalaqahItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HalaqahItem | null>(null);

  const { data: lembagaList = [] } = useQuery<any[]>({
    queryKey: ["lembaga-list"],
    queryFn: async () => {
      const res = await apiClient.get("/lembaga");
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: tahunList = [] } = useQuery<any[]>({
    queryKey: ["tahun-ajaran-list"],
    queryFn: async () => {
      const res = await apiClient.get("/tahun-ajaran");
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const activeTahunId = useMemo(() => {
    const active = (tahunList as any[]).find((t) => t.is_active);
    return active?.tahun_id?.toString() || "";
  }, [tahunList]);

  const { data: guruList = [] } = useQuery<any[]>({
    queryKey: ["guru-tahfidz-list", lembagaId],
    queryFn: () => tahfidzService.getGuruTahfidzList(lembagaId ? { lembaga_id: Number(lembagaId) } : undefined),
    staleTime: 30000,
  });

  const { data: santriAll = [] } = useQuery<any[]>({
    queryKey: ["santri-all-halaqah", lembagaId],
    queryFn: () => tahfidzService.getSantriTahfidz(lembagaId ? { lembaga_id: Number(lembagaId) } : undefined),
    staleTime: 30000,
  });

  const { data: halaqahList = [], isLoading, refetch } = useQuery<HalaqahItem[]>({
    queryKey: ["halaqah-list", lembagaId, tahunId, statusFilter],
    queryFn: () => tahfidzService.getHalaqahList({
      lembaga_id: lembagaId ? Number(lembagaId) : undefined,
      tahun_id: tahunId ? Number(tahunId) : undefined,
      status: statusFilter || undefined,
    }),
    staleTime: 15000,
  });

  const filteredList = useMemo(() => {
    if (!search.trim()) return halaqahList;
    const q = search.toLowerCase();
    return halaqahList.filter(
      (h) => h.nama_halaqah.toLowerCase().includes(q) || h.pegawai?.nama?.toLowerCase().includes(q)
    );
  }, [halaqahList, search]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tahfidzService.deleteHalaqah(id),
    onSuccess: () => {
      toast.success("Kelompok halaqoh berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["halaqah-list"] });
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menghapus"),
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#103426] via-[#1A4D38] to-[#103426] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-emerald-300">
              <Users className="w-3.5 h-3.5" />
              <span>Manajemen Kelompok Tahfidz</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Kelompok Halaqoh</h1>
            <p className="text-emerald-100 text-sm max-w-xl leading-relaxed">
              Atur pembagian santri ke dalam kelompok halaqoh dan tentukan ustadz pengampu untuk setiap kelompok.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
            <span className="block text-[10px] text-emerald-200 font-bold uppercase">Total Kelompok</span>
            <span className="text-2xl font-black">{halaqahList.length}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex flex-wrap gap-2 flex-1">
          <select value={lembagaId} onChange={(e) => setLembagaId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 min-w-[130px]">
            <option value="">Semua Lembaga</option>
            {(lembagaList as any[]).map((l) => <option key={l.lembaga_id} value={l.lembaga_id}>{l.nama_lembaga || l.nama}</option>)}
          </select>
          <select value={tahunId} onChange={(e) => setTahunId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 min-w-[130px]">
            <option value="">Semua Tahun</option>
            {(tahunList as any[]).map((t) => <option key={t.tahun_id} value={t.tahun_id}>{t.nama_tahun || t.nama} {t.is_active ? "(Aktif)" : ""}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20">
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Cari nama kelompok / ustadz..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => refetch()} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowKolosalModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm">
            <Zap className="w-4 h-4" /> Kolosal
          </button>
          <button onClick={() => { setEditTarget(null); setShowFormModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Tambah Kelompok
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Memuat data kelompok halaqoh...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
          <Users className="w-12 h-12 opacity-30" />
          <p className="text-sm font-semibold">Belum ada kelompok halaqoh</p>
          <button onClick={() => { setEditTarget(null); setShowFormModal(true); }}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors">
            <Plus className="w-4 h-4" /> Buat Kelompok Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((h) => (
            <HalaqahCard key={h.halaqah_id} halaqah={h}
              onView={(h) => { setDetailTarget(h); setShowDetailDrawer(true); }}
              onEdit={(h) => { setEditTarget(h); setShowFormModal(true); }}
              onDelete={(h) => { setDeleteTarget(h); setShowDeleteConfirm(true); }} />
          ))}
        </div>
      )}

      {showFormModal && (
        <HalaqahFormModal initial={editTarget} guruList={guruList as any[]} lembagaList={lembagaList as any[]}
          santriAll={santriAll as any[]}
          onClose={() => { setShowFormModal(false); setEditTarget(null); }}
          onSuccess={() => { setShowFormModal(false); setEditTarget(null); queryClient.invalidateQueries({ queryKey: ["halaqah-list"] }); }} />
      )}

      {showKolosalModal && (
        <KolosalModal guruList={guruList as any[]} lembagaList={lembagaList as any[]} tahunList={tahunList as any[]}
          santriAll={santriAll as any[]} activeLembagaId={lembagaId} activeTahunId={tahunId || activeTahunId}
          onClose={() => setShowKolosalModal(false)}
          onSuccess={() => { setShowKolosalModal(false); queryClient.invalidateQueries({ queryKey: ["halaqah-list"] }); }} />
      )}

      {showDetailDrawer && detailTarget && (
        <DetailDrawer halaqah={detailTarget} onClose={() => { setShowDetailDrawer(false); setDetailTarget(null); }} />
      )}

      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-slate-800 text-lg">Hapus Kelompok?</h3>
              <p className="text-sm text-slate-500">Kelompok <strong>"{deleteTarget.nama_halaqah}"</strong> beserta seluruh data anggotanya akan dihapus permanen.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">Batal</button>
              <button onClick={() => deleteMutation.mutate(deleteTarget.halaqah_id)} disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-60">
                {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function HalaqahCard({ halaqah, onView, onEdit, onDelete }: { halaqah: HalaqahItem; onView: (h: HalaqahItem) => void; onEdit: (h: HalaqahItem) => void; onDelete: (h: HalaqahItem) => void }) {
  const jumlahAnggota = halaqah._count?.anggota ?? halaqah.anggota?.length ?? 0;
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-slate-800 text-sm leading-snug truncate">{halaqah.nama_halaqah}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{halaqah.lembaga?.nama || "-"} • {halaqah.tahun_ajaran?.nama || "-"}</p>
          </div>
          <Badge label={halaqah.status} color={STATUS_COLORS[halaqah.status] || "bg-slate-100 text-slate-600 border-slate-200"} />
        </div>
        <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
            {getInitials(halaqah.pegawai?.nama || "U")}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ustadz Pengampu</p>
            <p className="font-bold text-xs text-slate-800 truncate">
              {halaqah.pegawai?.nama || "-"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-700">{jumlahAnggota} Santri</span>
          </div>
          {halaqah.deskripsi && <p className="text-[10px] text-slate-400 italic truncate max-w-[140px]">{halaqah.deskripsi}</p>}
        </div>
        {halaqah.anggota && halaqah.anggota.length > 0 && (
          <div className="flex items-center">
            {halaqah.anggota.slice(0, 5).map((a, i) => (
              <div key={a.id} style={{ zIndex: 5 - i, marginLeft: i === 0 ? 0 : "-8px" }}
                className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 border-2 border-white flex items-center justify-center text-[9px] font-black shadow-sm" title={a.siswa?.nama}>
                {getInitials(a.siswa?.nama || "?")}
              </div>
            ))}
            {jumlahAnggota > 5 && (
              <div style={{ marginLeft: "-8px", zIndex: 0 }}
                className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 border-2 border-white flex items-center justify-center text-[9px] font-black">
                +{jumlahAnggota - 5}
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2 pt-1 border-t border-slate-100">
          <button onClick={() => onView(halaqah)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-semibold transition-colors border border-slate-100">
            <Eye className="w-3.5 h-3.5" /> Detail
          </button>
          <button onClick={() => onEdit(halaqah)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-xs font-semibold transition-colors border border-slate-100">
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={() => onDelete(halaqah)} className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors border border-slate-100">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function HalaqahFormModal({ initial, guruList, lembagaList, santriAll, onClose, onSuccess }: {
  initial: HalaqahItem | null; guruList: any[]; lembagaList: any[]; santriAll: any[]; onClose: () => void; onSuccess: () => void;
}) {
  const isEdit = !!initial;
  const [nama, setNama] = useState(initial?.nama_halaqah || "");
  const [lembagaId, setLembagaId] = useState(initial?.lembaga_id?.toString() || "");
  const [pegawaiId, setPegawaiId] = useState(initial?.pegawai_id?.toString() || "");
  const [deskripsi, setDeskripsi] = useState(initial?.deskripsi || "");
  const [status, setStatus] = useState(initial?.status || "Aktif");
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<number[]>(initial?.anggota?.map((a) => a.siswa_id) || []);
  const [santriSearch, setSantriSearch] = useState("");

  const filteredSantri = useMemo(() => {
    const list = lembagaId
      ? santriAll.filter((s: any) => s.kelas?.lembaga?.lembaga_id === Number(lembagaId) || s.kelas?.lembaga_id === Number(lembagaId))
      : santriAll;
    const q = santriSearch.toLowerCase().trim();
    if (!q) return list;
    return list.filter((s: any) => s.nama?.toLowerCase().includes(q) || s.nis?.toLowerCase().includes(q) || s.nisn?.toLowerCase().includes(q));
  }, [santriAll, santriSearch, lembagaId]);

  const toggleSiswa = (siswa_id: number) =>
    setSelectedSiswaIds((prev) => prev.includes(siswa_id) ? prev.filter((id) => id !== siswa_id) : [...prev, siswa_id]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!nama.trim() || !lembagaId || !pegawaiId) throw new Error("Nama kelompok, lembaga, dan ustadz pengampu wajib diisi");
      const payload = {
        nama_halaqah: nama.trim(),
        lembaga_id: Number(lembagaId),
        pegawai_id: Number(pegawaiId),
        deskripsi: deskripsi.trim() || undefined,
        status,
        siswa_ids: selectedSiswaIds,
      };
      if (isEdit && initial) return tahfidzService.updateHalaqah(initial.halaqah_id, payload);
      return tahfidzService.createHalaqah(payload);
    },
    onSuccess: () => { toast.success(isEdit ? "Kelompok halaqoh berhasil diperbarui" : "Kelompok halaqoh berhasil dibuat"); onSuccess(); },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message || "Gagal menyimpan"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="font-black text-slate-800">{isEdit ? "Edit Kelompok Halaqoh" : "Tambah Kelompok Halaqoh"}</h2>
            <p className="text-xs text-slate-500">Isi informasi kelompok dan pilih anggota santri</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Nama Kelompok *</label>
              <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="misal: Halaqah Al-Fatih..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Lembaga *</label>
              <select value={lembagaId} onChange={(e) => setLembagaId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50">
                <option value="">-- Pilih Lembaga --</option>
                {lembagaList.map((l) => <option key={l.lembaga_id} value={l.lembaga_id}>{l.nama_lembaga || l.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Ustadz Pengampu *</label>
              <select value={pegawaiId} onChange={(e) => setPegawaiId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50">
                <option value="">-- Pilih Ustadz --</option>
                {guruList.map((g) => <option key={g.pegawai_id} value={g.pegawai_id}>{g.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as "Aktif" | "Tidak Aktif")} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50">
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Deskripsi (Opsional)</label>
              <textarea rows={2} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Catatan tentang kelompok ini..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 resize-none" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-600">Pilih Anggota Santri</label>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">{selectedSiswaIds.length} terpilih</span>
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Cari santri..." value={santriSearch} onChange={(e) => setSantriSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
              {filteredSantri.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">Tidak ada santri ditemukan</div>
              ) : filteredSantri.map((s: any) => {
                const isSelected = selectedSiswaIds.includes(s.siswa_id);
                return (
                  <button key={s.siswa_id} type="button" onClick={() => toggleSiswa(s.siswa_id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-slate-100 last:border-b-0 ${isSelected ? "bg-emerald-50" : "hover:bg-slate-50"}`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-emerald-600 border-emerald-600" : "border-slate-300"}`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{s.nama}</p>
                      <p className="text-[10px] text-slate-400">{s.kelas?.nama_kelas || "-"} • {s.nisn || "-"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedSiswaIds.length > 0 && (
              <button type="button" onClick={() => setSelectedSiswaIds([])} className="mt-2 text-[11px] text-red-500 font-semibold hover:underline">Hapus semua pilihan</button>
            )}
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">Batal</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !nama.trim() || !lembagaId || !pegawaiId}
            className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-colors disabled:opacity-50">
            {mutation.isPending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Kelompok"}
          </button>
        </div>
      </div>
    </div>
  );
}

function KolosalModal({ guruList, lembagaList, tahunList, santriAll, activeLembagaId, activeTahunId, onClose, onSuccess }: {
  guruList: any[]; lembagaList: any[]; tahunList: any[]; santriAll: any[]; activeLembagaId: string; activeTahunId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [lembagaId, setLembagaId] = useState(activeLembagaId || "");
  const [tahunId, setTahunId] = useState(activeTahunId || "");
  const [prefixNama, setPrefixNama] = useState("Halaqah");
  const [selectedGuruIds, setSelectedGuruIds] = useState<number[]>([]);
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<number[]>([]);
  const [santriSearch, setSantriSearch] = useState("");
  const [guruSearch, setGuruSearch] = useState("");

  const filteredSantri = useMemo(() => {
    const list = lembagaId ? santriAll.filter((s: any) => s.kelas?.lembaga?.lembaga_id === Number(lembagaId) || s.kelas?.lembaga_id === Number(lembagaId)) : santriAll;
    const q = santriSearch.toLowerCase().trim();
    if (!q) return list;
    return list.filter((s: any) => s.nama?.toLowerCase().includes(q) || s.nisn?.includes(q));
  }, [santriAll, lembagaId, santriSearch]);

  const filteredGuru = useMemo(() => {
    const q = guruSearch.toLowerCase().trim();
    if (!q) return guruList;
    return guruList.filter((g: any) => g.nama?.toLowerCase().includes(q));
  }, [guruList, guruSearch]);

  const previewDistribusi = useMemo(() => {
    if (selectedGuruIds.length === 0 || selectedSiswaIds.length === 0) return [];
    const buckets: { guru: any; santri: number[] }[] = selectedGuruIds.map((gId) => ({ guru: guruList.find((g) => g.pegawai_id === gId), santri: [] }));
    selectedSiswaIds.forEach((sId, i) => { buckets[i % selectedGuruIds.length].santri.push(sId); });
    return buckets;
  }, [selectedGuruIds, selectedSiswaIds, guruList]);

  const mutation = useMutation({
    mutationFn: () => tahfidzService.createKolosalHalaqah({
      mode: "distribusi_otomatis",
      lembaga_id: Number(lembagaId),
      tahun_id: tahunId ? Number(tahunId) : undefined,
      pegawai_ids: selectedGuruIds,
      siswa_ids: selectedSiswaIds,
      prefix_nama: prefixNama.trim() || "Halaqah",
    }),
    onSuccess: (res: any) => { toast.success(res.message || "Kelompok halaqoh kolosal berhasil dibuat!"); onSuccess(); },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message || "Gagal membuat kolosal"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center"><Zap className="w-5 h-5" /></div>
              <div>
                <h2 className="font-black text-lg">Buat Kelompok Kolosal</h2>
                <p className="text-amber-100 text-xs">Distribusi otomatis santri ke beberapa ustadz sekaligus</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="overflow-y-auto p-6 flex-1 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Lembaga *</label>
              <select value={lembagaId} onChange={(e) => setLembagaId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none bg-slate-50">
                <option value="">-- Pilih --</option>
                {lembagaList.map((l) => <option key={l.lembaga_id} value={l.lembaga_id}>{l.nama_lembaga || l.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Tahun Ajaran</label>
              <select value={tahunId} onChange={(e) => setTahunId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none bg-slate-50">
                <option value="">-- Pilih --</option>
                {tahunList.map((t) => <option key={t.tahun_id} value={t.tahun_id}>{t.nama_tahun || t.nama} {t.is_active ? "(Aktif)" : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Prefix Nama</label>
              <input value={prefixNama} onChange={(e) => setPrefixNama(e.target.value)} placeholder="Halaqah" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none bg-slate-50" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-600">Ustadz Pengampu</label>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg">{selectedGuruIds.length} dipilih</span>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="Cari ustadz..." value={guruSearch} onChange={(e) => setGuruSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none" />
              </div>
              <div className="border border-slate-200 rounded-2xl max-h-52 overflow-y-auto">
                {filteredGuru.map((g: any) => {
                  const isSel = selectedGuruIds.includes(g.pegawai_id);
                  return (
                    <button key={g.pegawai_id} type="button" onClick={() => setSelectedGuruIds((prev) => isSel ? prev.filter((x) => x !== g.pegawai_id) : [...prev, g.pegawai_id])}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-slate-100 last:border-b-0 ${isSel ? "bg-amber-50" : "hover:bg-slate-50"}`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isSel ? "bg-amber-500 border-amber-500" : "border-slate-300"}`}>
                        {isSel && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 truncate">{g.nama}</p>
                    </button>
                  );
                })}
                {filteredGuru.length === 0 && <div className="py-6 text-center text-xs text-slate-400">Tidak ada ustadz</div>}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-600">Daftar Santri</label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">{selectedSiswaIds.length} dipilih</span>
                  <button type="button" onClick={() => setSelectedSiswaIds(filteredSantri.map((s: any) => s.siswa_id))} className="text-[10px] font-bold text-blue-600 hover:underline">Pilih Semua</button>
                </div>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="Cari santri..." value={santriSearch} onChange={(e) => setSantriSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none" />
              </div>
              <div className="border border-slate-200 rounded-2xl max-h-52 overflow-y-auto">
                {filteredSantri.map((s: any) => {
                  const isSel = selectedSiswaIds.includes(s.siswa_id);
                  return (
                    <button key={s.siswa_id} type="button" onClick={() => setSelectedSiswaIds((prev) => isSel ? prev.filter((x) => x !== s.siswa_id) : [...prev, s.siswa_id])}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-slate-100 last:border-b-0 ${isSel ? "bg-emerald-50" : "hover:bg-slate-50"}`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isSel ? "bg-emerald-600 border-emerald-600" : "border-slate-300"}`}>
                        {isSel && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{s.nama}</p>
                        <p className="text-[10px] text-slate-400">{s.kelas?.nama_kelas || "-"}</p>
                      </div>
                    </button>
                  );
                })}
                {filteredSantri.length === 0 && <div className="py-6 text-center text-xs text-slate-400">{lembagaId ? "Tidak ada santri di lembaga ini" : "Pilih lembaga dahulu"}</div>}
              </div>
            </div>
          </div>
          {previewDistribusi.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-slate-700 mb-3">Preview Distribusi ({selectedSiswaIds.length} santri → {selectedGuruIds.length} kelompok)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {previewDistribusi.map((b, i) => (
                  <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                    <p className="text-xs font-bold text-amber-800 truncate">{prefixNama} - {b.guru?.nama || "Ustadz"}</p>
                    <p className="text-[11px] text-amber-600 mt-0.5">{b.santri.length} santri</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">Batal</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !lembagaId || selectedGuruIds.length === 0 || selectedSiswaIds.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            {mutation.isPending ? "Membuat..." : `Buat ${selectedGuruIds.length} Kelompok`}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailDrawer({ halaqah, onClose }: { halaqah: HalaqahItem; onClose: () => void }) {
  const { data: detail, isLoading } = useQuery<HalaqahItem>({
    queryKey: ["halaqah-detail", halaqah.halaqah_id],
    queryFn: () => tahfidzService.getHalaqahDetail(halaqah.halaqah_id),
    staleTime: 10000,
  });
  const h = detail || halaqah;
  const anggota = h.anggota || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-[#103426] to-[#1A4D38] p-6 text-white shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-1">Detail Kelompok</p>
              <h2 className="font-black text-xl leading-snug">{h.nama_halaqah}</h2>
              <p className="text-emerald-200 text-xs mt-1">{h.lembaga?.nama} • {h.tahun_ajaran?.nama}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors shrink-0"><X className="w-4 h-4" /></button>
          </div>
          <div className="mt-4 flex items-center gap-3 p-3 bg-white/10 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-black text-sm shrink-0">
              {getInitials(h.pegawai?.nama || "U")}
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Ustadz Pengampu</p>
              <p className="font-bold text-sm">{h.pegawai?.nama || "-"}</p>
              {h.pegawai?.no_hp && <p className="text-[11px] text-emerald-200">{h.pegawai.no_hp}</p>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 shrink-0">
          <div className="p-4 text-center">
            <p className="text-2xl font-black text-emerald-700">{anggota.length}</p>
            <p className="text-[11px] text-slate-500 font-medium">Total Santri</p>
          </div>
          <div className="p-4 text-center">
            <Badge label={h.status} color={STATUS_COLORS[h.status] || ""} />
            <p className="text-[11px] text-slate-500 font-medium mt-1">Status</p>
          </div>
        </div>
        <div className="flex-1 p-5">
          <h3 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" /> Daftar Anggota Santri
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : anggota.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">Belum ada anggota</div>
          ) : (
            <div className="space-y-2">
              {anggota.map((a, idx) => {
                const siswa = a.siswa;
                const lastSetoran = siswa?.tahfidz_setoran?.[0];
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 w-5 text-right shrink-0">{idx + 1}</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                      {getInitials(siswa?.nama || "?")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-800 truncate">{siswa?.nama || "-"}</p>
                      <p className="text-[10px] text-slate-400">{siswa?.kelas?.nama_kelas || "-"} • {siswa?.nis || "-"}</p>
                      {lastSetoran && <p className="text-[10px] text-emerald-600 font-medium">Setoran terakhir: {lastSetoran.tanggal}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KelompokHalaqahPage;
