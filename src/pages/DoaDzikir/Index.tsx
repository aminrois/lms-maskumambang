// src/pages/DoaDzikir/Index.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  BookMarked,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  BookOpen,
  SunMedium,
  Check,
  X,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/api/axios";

export interface DoaDzikirItem {
  id: number;
  judul: string;
  kategori: string;
  arab: string;
  latin?: string | null;
  arti: string;
  riwayat?: string | null;
  urutan: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const PREDEFINED_CATEGORIES = [
  "Doa Harian",
  "Dzikir Pagi & Petang",
  "KBM & Pelajaran",
  "Sholat & Wudhu",
  "Al-Qur'an & Hafalan",
  "Adab & Akhlak",
  "Lainnya",
];

export default function DoaDzikirIndex() {
  const [items, setItems] = useState<DoaDzikirItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedKategori, setSelectedKategori] = useState<string>("Semua");

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<DoaDzikirItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form Data State
  const [formData, setFormData] = useState({
    judul: "",
    kategori: "Doa Harian",
    customKategori: "",
    arab: "",
    latin: "",
    arti: "",
    riwayat: "",
    urutan: 0,
    is_active: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/doa-dzikir");
      if (res.data?.success) {
        setItems(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Gagal memuat doa & dzikir:", err);
      toast.error("Gagal memuat daftar doa & dzikir");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchKategori =
        selectedKategori === "Semua" || item.kategori === selectedKategori;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.judul.toLowerCase().includes(q) ||
        item.arti.toLowerCase().includes(q) ||
        (item.latin && item.latin.toLowerCase().includes(q)) ||
        (item.riwayat && item.riwayat.toLowerCase().includes(q));

      return matchKategori && matchSearch;
    });
  }, [items, selectedKategori, search]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.is_active).length;
    const doaHarian = items.filter((i) => i.kategori === "Doa Harian").length;
    const dzikir = items.filter((i) => i.kategori === "Dzikir Pagi & Petang").length;
    const uniqueKategori = Array.from(new Set(items.map((i) => i.kategori))).length;

    return { total, active, doaHarian, dzikir, uniqueKategori };
  }, [items]);

  // Handle Form Open
  const handleOpenAdd = () => {
    setSelectedItem(null);
    setFormData({
      judul: "",
      kategori: "Doa Harian",
      customKategori: "",
      arab: "",
      latin: "",
      arti: "",
      riwayat: "",
      urutan: items.length + 1,
      is_active: true,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: DoaDzikirItem) => {
    setSelectedItem(item);
    const isPredefined = PREDEFINED_CATEGORIES.includes(item.kategori);
    setFormData({
      judul: item.judul,
      kategori: isPredefined ? item.kategori : "Lainnya",
      customKategori: isPredefined ? "" : item.kategori,
      arab: item.arab,
      latin: item.latin || "",
      arti: item.arti,
      riwayat: item.riwayat || "",
      urutan: item.urutan,
      is_active: item.is_active,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenPreview = (item: DoaDzikirItem) => {
    setSelectedItem(item);
    setIsPreviewModalOpen(true);
  };

  const handleOpenDelete = (item: DoaDzikirItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  // Submit Form (Create / Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.judul.trim() || !formData.arab.trim() || !formData.arti.trim()) {
      toast.error("Judul, Teks Arab, dan Terjemahan wajib diisi!");
      return;
    }

    const finalKategori =
      formData.kategori === "Lainnya" && formData.customKategori.trim()
        ? formData.customKategori.trim()
        : formData.kategori;

    const payload = {
      judul: formData.judul.trim(),
      kategori: finalKategori,
      arab: formData.arab.trim(),
      latin: formData.latin.trim() || null,
      arti: formData.arti.trim(),
      riwayat: formData.riwayat.trim() || null,
      urutan: Number(formData.urutan) || 0,
      is_active: formData.is_active,
    };

    setIsSubmitting(true);
    try {
      if (selectedItem) {
        // Update
        const res = await apiClient.put(`/doa-dzikir/${selectedItem.id}`, payload);
        if (res.data?.success) {
          toast.success("Doa & Dzikir berhasil diperbarui!");
          setIsFormModalOpen(false);
          fetchData();
        }
      } else {
        // Create
        const res = await apiClient.post("/doa-dzikir", payload);
        if (res.data?.success) {
          toast.success("Doa & Dzikir baru berhasil ditambahkan!");
          setIsFormModalOpen(false);
          fetchData();
        }
      }
    } catch (err: any) {
      console.error("Gagal menyimpan doa:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.delete(`/doa-dzikir/${selectedItem.id}`);
      if (res.data?.success) {
        toast.success("Doa & Dzikir berhasil dihapus");
        setIsDeleteModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      console.error("Gagal menghapus doa:", err);
      toast.error("Gagal menghapus data");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (item: DoaDzikirItem) => {
    try {
      const res = await apiClient.put(`/doa-dzikir/${item.id}`, {
        is_active: !item.is_active,
      });
      if (res.data?.success) {
        toast.success(
          `Doa "${item.judul}" ${!item.is_active ? "diaktifkan" : "dinonaktifkan"}`
        );
        fetchData();
      }
    } catch (err) {
      toast.error("Gagal mengubah status aktif");
    }
  };

  const allCategories = useMemo(() => {
    const list = Array.from(new Set(items.map((i) => i.kategori)));
    return ["Semua", ...list];
  }, [items]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <BookMarked size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Kelola Doa & Dzikir
              </h1>
              <p className="text-sm text-slate-500">
                Kontrol isi bacaan doa harian, dzikir, dan transliterasi untuk santri & wali murid
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all hover:shadow"
          >
            <Plus size={18} />
            <span>Tambah Doa / Dzikir</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Koleksi</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
            <p className="text-[11px] text-emerald-600 font-medium">{stats.active} aktif ditampilkan</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <SunMedium size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dzikir Pagi/Petang</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.dzikir}</h3>
            <p className="text-[11px] text-slate-500">Wirid harian</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doa Harian</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.doaHarian}</h3>
            <p className="text-[11px] text-slate-500">Aktivitas sehari-hari</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Filter size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kategori</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.uniqueKategori}</h3>
            <p className="text-[11px] text-slate-500">Kelompok tema</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari judul doa, arti, latin, atau riwayat hadits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium px-2">
            Menampilkan <span className="font-bold text-slate-800">{filteredItems.length}</span> dari {items.length} doa
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedKategori(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedKategori === cat
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw size={32} className="animate-spin text-emerald-600 mb-3" />
            <p className="text-sm">Memuat data doa & dzikir...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <BookMarked size={48} className="mx-auto text-slate-300 mb-3" />
            <h4 className="text-base font-semibold text-slate-700">Tidak ada data ditemukan</h4>
            <p className="text-sm text-slate-500 mt-1">
              {search || selectedKategori !== "Semua"
                ? "Coba sesuaikan kata kunci pencarian atau filter kategori."
                : "Klik tombol Tambah Doa / Dzikir di atas untuk mulai memasukkan konten."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Urutan</th>
                  <th className="py-3.5 px-4">Judul & Kategori</th>
                  <th className="py-3.5 px-4">Teks Arab</th>
                  <th className="py-3.5 px-4">Arti & Terjemahan</th>
                  <th className="py-3.5 px-4">Sumber / Hadits</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 text-center text-slate-400 font-mono text-xs">
                      {item.urutan}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800 text-[14px]">
                        {item.judul}
                      </div>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {item.kategori}
                      </span>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <div
                        dir="rtl"
                        className="text-right font-serif text-lg text-emerald-950 font-normal leading-relaxed line-clamp-2"
                      >
                        {item.arab}
                      </div>
                      {item.latin && (
                        <div className="text-[11px] text-slate-400 italic line-clamp-1 mt-1">
                          {item.latin}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 max-w-sm">
                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                        {item.arti}
                      </p>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {item.riwayat ? (
                        <span className="text-slate-700 font-medium">{item.riwayat}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        title="Klik untuk mengubah status aktif"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                          item.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {item.is_active ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenPreview(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview Tampilan"
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit Doa"
                        >
                          <Edit2 size={17} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(item)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Doa"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODAL 1: FORM TAMBAH / EDIT
      ════════════════════════════════════════════════════════ */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <BookMarked size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {selectedItem ? "Edit Doa & Dzikir" : "Tambah Doa & Dzikir Baru"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pastikan teks Arab, transliterasi, dan arti sudah diverifikasi kebenarannya
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Judul */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Judul Doa / Dzikir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sayyidul Istighfar"
                    value={formData.judul}
                    onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    {PREDEFINED_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.kategori === "Lainnya" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Kategori Kustom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan nama kategori baru..."
                    value={formData.customKategori}
                    onChange={(e) => setFormData({ ...formData, customKategori: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Teks Arab */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Teks Arab (Berharakat) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Gunakan harakat lengkap</span>
                </div>
                <textarea
                  dir="rtl"
                  rows={3}
                  required
                  placeholder="اللَّهُمَّ..."
                  value={formData.arab}
                  onChange={(e) => setFormData({ ...formData, arab: e.target.value })}
                  className="w-full px-4 py-3 text-lg font-serif border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-50/20 text-emerald-950 leading-loose"
                />
              </div>

              {/* Teks Latin */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transliterasi Latin (Cara Membaca)
                </label>
                <textarea
                  rows={2}
                  placeholder="Allahumma anta rabbi..."
                  value={formData.latin}
                  onChange={(e) => setFormData({ ...formData, latin: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Arti / Terjemahan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Arti / Terjemahan Bahasa Indonesia <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ya Allah, Engkau adalah Tuhanku..."
                  value={formData.arti}
                  onChange={(e) => setFormData({ ...formData, arti: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Riwayat & Urutan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Riwayat / Sumber Hadits
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: HR. Bukhari no. 6306"
                    value={formData.riwayat}
                    onChange={(e) => setFormData({ ...formData, riwayat: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Urut Tampil
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.urutan}
                    onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Aktifkan dan tampilkan di aplikasi mobile santri & wali
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
                >
                  {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                  <span>{selectedItem ? "Simpan Perubahan" : "Tambah Sekarang"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL 2: PREVIEW TAMPILAN
      ════════════════════════════════════════════════════════ */}
      {isPreviewModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-300" />
                <span className="font-semibold text-sm">Preview Tampilan Bacaan</span>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-emerald-200 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {selectedItem.kategori}
                </span>
                <h3 className="text-xl font-bold text-slate-800 mt-2">
                  {selectedItem.judul}
                </h3>
              </div>

              {/* Teks Arab Card */}
              <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100/80">
                <p
                  dir="rtl"
                  className="text-right font-serif text-2xl text-emerald-950 font-medium leading-[2.2]"
                >
                  {selectedItem.arab}
                </p>
              </div>

              {/* Latin */}
              {selectedItem.latin && (
                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Transliterasi
                  </h5>
                  <p className="text-sm text-emerald-700 italic leading-relaxed">
                    "{selectedItem.latin}"
                  </p>
                </div>
              )}

              {/* Arti */}
              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Artinya:
                </h5>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  {selectedItem.arti}
                </p>
              </div>

              {/* Riwayat */}
              {selectedItem.riwayat && (
                <div className="text-xs text-slate-500 font-medium pt-1 border-t border-slate-100">
                  📖 <span className="font-semibold text-slate-700">{selectedItem.riwayat}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL 3: DELETE CONFIRMATION
      ════════════════════════════════════════════════════════ */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={26} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Hapus Doa & Dzikir?</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Apakah Anda yakin ingin menghapus{" "}
              <span className="font-semibold text-slate-700">"{selectedItem.judul}"</span>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
