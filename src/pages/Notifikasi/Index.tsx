import { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Search,
  Edit2,
  Trash2,
  SendHorizonal,
  RefreshCw,
  X,
  CheckCircle2,
  XCircle,
  Users,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/api/axios";

export interface NotifikasiItem {
  id: number;
  judul: string;
  isi: string;
  kategori: string;
  target_role: string;
  is_active: boolean;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

const KATEGORI_LIST = ["Umum", "Akademik", "Asrama", "Kegiatan", "Darurat"];
const TARGET_ROLE_LIST = ["semua", "Guru", "Wali Murid", "Wali Kelas"];

const KATEGORI_CONFIG: Record<string, { color: string; bg: string }> = {
  Umum:     { color: "#1D4ED8", bg: "#EFF6FF" },
  Akademik: { color: "#15803D", bg: "#F0FDF4" },
  Asrama:   { color: "#7C3AED", bg: "#F5F3FF" },
  Kegiatan: { color: "#D97706", bg: "#FFFBEB" },
  Darurat:  { color: "#DC2626", bg: "#FEF2F2" },
};

const emptyForm = { judul: "", isi: "", kategori: "Umum", target_role: "semua", is_active: true };

export default function NotifikasiIndex() {
  const [items, setItems] = useState<NotifikasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Semua");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<NotifikasiItem | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/notifikasi/admin");
      setItems(res.data.data || []);
    } catch {
      toast.error("Gagal memuat data notifikasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = items.filter((n) => {
    const q = search.toLowerCase();
    const matchSearch = n.judul.toLowerCase().includes(q) || n.isi.toLowerCase().includes(q);
    const matchKat = selectedKategori === "Semua" || n.kategori === selectedKategori;
    return matchSearch && matchKat;
  });

  const openCreate = () => { setEditItem(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (item: NotifikasiItem) => {
    setEditItem(item);
    setForm({ judul: item.judul, isi: item.isi, kategori: item.kategori, target_role: item.target_role, is_active: item.is_active });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.judul.trim() || !form.isi.trim()) { toast.error("Judul dan isi wajib diisi"); return; }
    try {
      setSaving(true);
      if (editItem) { await apiClient.put(`/notifikasi/${editItem.id}`, form); toast.success("Notifikasi diperbarui"); }
      else { await apiClient.post("/notifikasi", form); toast.success("Notifikasi dibuat"); }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus notifikasi ini?")) return;
    try { setDeleting(id); await apiClient.delete(`/notifikasi/${id}`); toast.success("Dihapus"); fetchData(); }
    catch { toast.error("Gagal menghapus"); }
    finally { setDeleting(null); }
  };

  const handleToggle = async (item: NotifikasiItem) => {
    try { await apiClient.put(`/notifikasi/${item.id}`, { is_active: !item.is_active }); fetchData(); }
    catch { toast.error("Gagal ubah status"); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 shadow-lg shadow-blue-200">
            <Bell size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Manajemen Notifikasi</h1>
            <p className="text-sm text-gray-500">Kelola notifikasi push untuk pengguna aplikasi mobile</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm">
            <Plus size={16} /> Buat Notifikasi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: items.length, cls: "text-blue-600 bg-blue-50" },
          { label: "Aktif", value: items.filter(i => i.is_active).length, cls: "text-green-600 bg-green-50" },
          { label: "Nonaktif", value: items.filter(i => !i.is_active).length, cls: "text-gray-500 bg-gray-50" },
          { label: "Darurat", value: items.filter(i => i.kategori === "Darurat").length, cls: "text-red-600 bg-red-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.cls} rounded-xl p-4`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Cari notifikasi..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["Semua", ...KATEGORI_LIST].map((k) => (
            <button key={k} onClick={() => setSelectedKategori(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${selectedKategori === k ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <RefreshCw size={18} className="animate-spin" /><span className="text-sm">Memuat data...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Bell size={40} className="mb-3 text-gray-300" />
            <p className="text-sm font-semibold">Belum ada notifikasi</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Judul & Isi", "Kategori", "Target", "Status", "Dibuat", "Aksi"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => {
                const cfg = KATEGORI_CONFIG[item.kategori] || KATEGORI_CONFIG["Umum"];
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-gray-900 truncate">{item.judul}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.isi}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        <Users size={11} />
                        {item.target_role === "semua" ? "Semua" : item.target_role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(item)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors ${item.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                        {item.is_active ? <><CheckCircle2 size={11} />Aktif</> : <><XCircle size={11} />Nonaktif</>}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100"><Bell size={16} className="text-blue-600" /></div>
                <div>
                  <h2 className="font-bold text-gray-900 text-base">{editItem ? "Edit Notifikasi" : "Buat Notifikasi Baru"}</h2>
                  <p className="text-xs text-gray-500">Akan tampil di aplikasi mobile pengguna</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Judul <span className="text-red-500">*</span></label>
                <input type="text" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  placeholder="Contoh: Jadwal Ujian Semester Ganjil"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Isi Notifikasi <span className="text-red-500">*</span></label>
                <textarea value={form.isi} onChange={(e) => setForm({ ...form, isi: e.target.value })}
                  placeholder="Tulis isi notifikasi lengkap di sini..." rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kategori</label>
                  <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {KATEGORI_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Target Penerima</label>
                  <select value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {TARGET_ROLE_LIST.map((r) => <option key={r} value={r}>{r === "semua" ? "Semua Pengguna" : r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 cursor-pointer" />
                <label htmlFor="is_active" className="text-sm text-gray-700 cursor-pointer select-none">
                  <span className="font-semibold">Aktifkan</span> — tampil di aplikasi mobile
                </label>
              </div>
              {form.kategori === "Darurat" && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle size={15} className="text-red-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700"><strong>Kategori Darurat</strong> ditampilkan dengan prioritas tertinggi di aplikasi mobile.</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">Batal</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-60">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <SendHorizonal size={14} />}
                {editItem ? "Perbarui" : "Publikasikan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
