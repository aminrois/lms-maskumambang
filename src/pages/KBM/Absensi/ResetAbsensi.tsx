// src/pages/KBM/Absensi/ResetAbsensi.tsx

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Layers,
  KeyRound,
  Trash2,
  Info
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { getLembagas, getKelas } from "@/lib/api/services/masterService";
import { getMataPelajarans } from "@/lib/api/services/akademikService";
import { resetAbsensi } from "@/lib/api/services/rpcService";

export default function ResetAbsensi() {
  const { role } = useAuthStore();
  const queryClient = useQueryClient();

  // State Filter
  const [resetType, setResetType] = useState<"mapel" | "harian" | "all">("mapel");
  const [selectedLembaga, setSelectedLembaga] = useState<string>("");
  const [selectedKelas, setSelectedKelas] = useState<string>("");
  const [selectedMapel, setSelectedMapel] = useState<string>("");
  const [selectedPertemuan, setSelectedPertemuan] = useState<string>("");
  const [selectedTanggal, setSelectedTanggal] = useState<string>("");

  // State Modal Konfirmasi PIN
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [resetResult, setResetResult] = useState<any>(null);

  // Fetch Master Data
  const { data: lembagas = [] } = useQuery({
    queryKey: ["master", "lembagas"],
    queryFn: async () => await getLembagas({ order: "nama_lembaga.asc" })
  });

  const { data: allKelas = [] } = useQuery({
    queryKey: ["master", "kelas", selectedLembaga],
    queryFn: async () => {
      const params: Record<string, any> = { order: "nama_kelas.asc" };
      if (selectedLembaga) {
        params.lembaga_id = `eq.${selectedLembaga}`;
      }
      return await getKelas(params);
    }
  });

  const { data: allMapels = [] } = useQuery({
    queryKey: ["master", "mapels", selectedLembaga],
    queryFn: async () => {
      const params: Record<string, any> = { order: "nama_mapel.asc" };
      if (selectedLembaga) {
        params.lembaga_id = `eq.${selectedLembaga}`;
      }
      return await getMataPelajarans(params);
    }
  });

  // Mutation Reset
  const mutation = useMutation({
    mutationFn: async () => {
      if (pinInput.trim() !== "1859") {
        throw new Error("PIN konfirmasi salah! Masukkan PIN yang benar.");
      }

      return await resetAbsensi({
        pin: pinInput.trim(),
        type: resetType,
        lembaga_id: selectedLembaga ? Number(selectedLembaga) : null,
        kelas_id: selectedKelas ? Number(selectedKelas) : null,
        mapel_id: selectedMapel ? Number(selectedMapel) : null,
        pertemuan_ke: selectedPertemuan ? Number(selectedPertemuan) : null,
        tanggal: selectedTanggal ? selectedTanggal : null
      });
    },
    onSuccess: (data) => {
      setResetResult(data);
      toast.success("Reset absensi berhasil dieksekusi!");
      // Invalidate queries yang berhubungan dengan absensi, jurnal, rekap, dan monitoring
      queryClient.invalidateQueries({ queryKey: ["kbm"] });
      queryClient.invalidateQueries({ queryKey: ["monitoring"] });
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
      queryClient.invalidateQueries({ queryKey: ["master-data"] });
      queryClient.invalidateQueries();
      setIsModalOpen(false);
      setPinInput("");
      setPinError("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err?.message || "Gagal melakukan reset absensi.";
      setPinError(msg);
      toast.error(msg);
    }
  });

  const handleOpenConfirm = () => {
    setPinInput("");
    setPinError("");
    setIsModalOpen(true);
  };

  const handleExecuteReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() !== "1859") {
      setPinError("PIN konfirmasi salah! PIN harus 1859.");
      return;
    }
    setPinError("");
    mutation.mutate();
  };

  const isDirekturOrSuperAdmin = role === "Direktur" || role === "Super Admin";

  if (!isDirekturOrSuperAdmin) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-sm text-slate-500">
          Menu Reset Absensi hanya dapat diakses oleh Direktur atau Super Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 shrink-0">
            <RotateCcw className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#2B3674] uppercase">RESET DATA ABSENSI</h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                Direktur Only
              </span>
            </div>
            <p className="text-[#A3AED0] text-sm mt-0.5">
              Kelola pembukaan kunci (unlock) dan pembersihan data absensi serta jurnal mengajar
            </p>
          </div>
        </div>
      </div>

      {/* Warning Box */}
      <Card className="border-rose-200 bg-linear-to-r from-rose-50/90 via-red-50/40 to-slate-50 shadow-xs">
        <CardContent className="p-4 sm:p-5 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs sm:text-sm text-rose-950">
            <h3 className="font-bold text-rose-900 text-sm sm:text-base">
              Peringatan Keamanan Tindakan Reset
            </h3>
            <p className="text-rose-800 leading-relaxed text-xs">
              Mereset absensi akan <strong>menghapus data kehadiran siswa & jurnal mengajar</strong> pada parameter terpilih. Pertemuan yang sebelumnya terkunci di portal guru akan <strong>terbuka kembali (unlocked)</strong> sehingga guru dapat mengisi ulang absensi. Aksi ini memerlukan <strong>PIN Konfirmasi: 1859</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Form Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Pengaturan Reset */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" /> 1. Pilih Jenis Absensi yang Akan Direset
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih cakupan data absensi yang ingin dihapus / dibuka kembali kuncinya
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setResetType("mapel")}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      resetType === "mapel"
                        ? "border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-800">Absensi Mapel</div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Reset absensi per mata pelajaran & jurnal (membuka lock pertemuan)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetType("harian")}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      resetType === "harian"
                        ? "border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-800">Absensi Harian</div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Reset data absensi harian kelas oleh wali kelas
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetType("all")}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      resetType === "all"
                        ? "border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-800">Semua Absensi</div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Reset Mapel & Harian sekaligus sesuai filter
                    </div>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" /> 2. Tentukan Filter Sasaran Reset (Opsional)
                </h2>
                <p className="text-xs text-slate-500">
                  Kosongkan filter (Semua) jika ingin mereset seluruh data, atau tentukan filter spesifik di bawah ini:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Lembaga */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Lembaga
                    </label>
                    <select
                      value={selectedLembaga}
                      onChange={(e) => {
                        setSelectedLembaga(e.target.value);
                        setSelectedKelas("");
                        setSelectedMapel("");
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="">Semua Lembaga</option>
                      {lembagas.map((l: any) => (
                        <option key={l.lembaga_id} value={l.lembaga_id}>
                          {l.nama_lembaga}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kelas */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Kelas
                    </label>
                    <select
                      value={selectedKelas}
                      onChange={(e) => setSelectedKelas(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="">Semua Kelas</option>
                      {allKelas.map((k: any) => (
                        <option key={k.kelas_id} value={k.kelas_id}>
                          {k.nama_kelas}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mapel (Khusus jika reset Mapel / All) */}
                  {resetType !== "harian" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Mata Pelajaran
                      </label>
                      <select
                        value={selectedMapel}
                        onChange={(e) => setSelectedMapel(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      >
                        <option value="">Semua Mata Pelajaran</option>
                        {allMapels.map((m: any) => (
                          <option key={m.mapel_id} value={m.mapel_id}>
                            {m.nama_mapel}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Pertemuan Ke (Khusus jika reset Mapel / All) */}
                  {resetType !== "harian" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Pertemuan Ke-
                      </label>
                      <select
                        value={selectedPertemuan}
                        onChange={(e) => setSelectedPertemuan(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      >
                        <option value="">Semua Pertemuan (1 - 16) — Reset Total Mulai dari 0</option>
                        {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num}>
                            Pertemuan {num} Saja
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Tanggal */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tanggal Spesifik (Opsional)
                    </label>
                    <Input
                      type="date"
                      value={selectedTanggal}
                      onChange={(e) => setSelectedTanggal(e.target.value)}
                      className="bg-white border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={handleOpenConfirm}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-6 py-2.5 font-bold flex items-center gap-2 shadow-sm shadow-rose-600/30 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Mulai Eksekusi Reset Absensi
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Ringkasan & Hasil */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm rounded-2xl bg-slate-50/50">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" /> Ringkasan Parameter Reset
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">Jenis Reset:</span>
                  <strong className="text-slate-800 uppercase">
                    {resetType === "mapel"
                      ? "Absensi Mapel"
                      : resetType === "harian"
                      ? "Absensi Harian"
                      : "Semua Absensi"}
                  </strong>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">Lembaga:</span>
                  <strong className="text-slate-800">
                    {selectedLembaga
                      ? lembagas.find((l: any) => String(l.lembaga_id) === String(selectedLembaga))?.nama_lembaga || selectedLembaga
                      : "Semua Lembaga"}
                  </strong>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">Kelas:</span>
                  <strong className="text-slate-800">
                    {selectedKelas
                      ? allKelas.find((k: any) => String(k.kelas_id) === String(selectedKelas))?.nama_kelas || selectedKelas
                      : "Semua Kelas"}
                  </strong>
                </div>

                {resetType !== "harian" && (
                  <>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Mata Pelajaran:</span>
                      <strong className="text-slate-800">
                        {selectedMapel
                          ? allMapels.find((m: any) => String(m.mapel_id) === String(selectedMapel))?.nama_mapel || selectedMapel
                          : "Semua Mapel"}
                      </strong>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Pertemuan:</span>
                      <strong className="text-slate-800">
                        {selectedPertemuan ? `Pertemuan ${selectedPertemuan}` : "Semua Pertemuan"}
                      </strong>
                    </div>
                  </>
                )}

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Tanggal:</span>
                  <strong className="text-slate-800">
                    {selectedTanggal || "Semua Tanggal"}
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Hasil Reset Terakhir */}
          {resetResult && (
            <Card className="border-emerald-200 bg-emerald-50/60 shadow-xs rounded-2xl">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Reset Terakhir Sukses
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  {resetResult.message}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi PIN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Konfirmasi PIN Keamanan</h3>
              <p className="text-xs text-slate-500">
                Masukkan PIN otoritas Direktur untuk memproses penghapusan dan reset data absensi.
              </p>
            </div>

            <form onSubmit={handleExecuteReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                  PIN Konfirmasi (4 Digit)
                </label>
                <Input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="Masukkan PIN"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError("");
                  }}
                  className="text-center text-xl tracking-widest font-mono font-bold h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                />
                {pinError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5 text-center">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-[11px] text-rose-700 leading-relaxed">
                ⚠️ Tindakan ini akan langsung menghapus data di database dan membuka kunci pertemuan terkait di portal guru.
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setPinInput("");
                    setPinError("");
                  }}
                  className="flex-1 rounded-xl"
                  disabled={mutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending || !pinInput}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  {mutation.isPending ? "Memproses..." : "Konfirmasi & Reset"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
