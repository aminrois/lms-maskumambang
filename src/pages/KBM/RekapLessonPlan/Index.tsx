// src/pages/KBM/RekapLessonPlan/Index.tsx
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowUpRight,
  Eye,
  Building2,
  UserX,
  X,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getLessonPlanMonitoringRekap,
  type GuruLessonPlanRekapItem,
} from "@/lib/api/services/kbmService";
import { restClient } from "@/lib/api/axios";

const RekapLessonPlanPage: React.FC = () => {
  const navigate = useNavigate();

  const [selectedLembagaId, setSelectedLembagaId] = useState<string>("");
  const [targetPertemuan, setTargetPertemuan] = useState<number>(16);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGuruDetail, setSelectedGuruDetail] = useState<GuruLessonPlanRekapItem | null>(null);

  // Fetch daftar lembaga
  const { data: lembagaList = [] } = useQuery({
    queryKey: ["rekap-lp-lembaga-list"],
    queryFn: async () => {
      const res = await restClient.get("/lembaga");
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Rekap Monitoring Lesson Plan
  const {
    data: monitoringData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["rekap-lesson-plan-data", selectedLembagaId, targetPertemuan],
    queryFn: async () => {
      return await getLessonPlanMonitoringRekap({
        lembaga_id: selectedLembagaId || undefined,
        target_pertemuan: targetPertemuan,
      });
    },
    staleTime: 60 * 1000,
  });

  const summary = monitoringData?.summary || {
    total_guru: 0,
    total_lengkap: 0,
    total_sebagian: 0,
    total_belum_buat: 0,
    persentase_kepatuhan: 0,
    total_menunggu_verifikasi: 0,
    target_pertemuan: 16,
  };

  const rekapLembaga = monitoringData?.rekap_per_lembaga || [];
  const guruList = monitoringData?.guru_rekap || [];

  // Filter guru berdasarkan status dan search
  const filteredGuruList = useMemo(() => {
    return guruList.filter((g) => {
      // Filter status
      if (filterStatus === "BELUM_BUAT" && g.status_kepatuhan !== "Belum Buat") return false;
      if (filterStatus === "SEBAGIAN" && g.status_kepatuhan !== "Sebagian") return false;
      if (filterStatus === "LENGKAP" && g.status_kepatuhan !== "Lengkap") return false;

      // Filter search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = g.nama?.toLowerCase().includes(q);
        const matchNip = g.nip?.toLowerCase().includes(q) || g.nig?.toLowerCase().includes(q);
        const matchMapel = g.mapel_diampu?.some((m) => m.toLowerCase().includes(q));
        const matchLembaga = g.lembaga_list?.some((l) => l.toLowerCase().includes(q));
        if (!matchNama && !matchNip && !matchMapel && !matchLembaga) return false;
      }

      return true;
    });
  }, [guruList, filterStatus, searchQuery]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 font-sans text-slate-800">
      {/* Header Banner Modern Islamic / Navy Tone */}
      <div className="bg-linear-to-r from-[#1A365D] via-[#2B6CB0] to-[#1A365D] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-500/20">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 backdrop-blur-xs rounded-full text-xs font-semibold text-blue-200 border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Pengawasan & Evaluasi Pembelajaran Guru</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                <FileText className="w-7 h-7 text-yellow-300 shrink-0" />
                <span>Rekap Lesson Plan Guru</span>
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
                Laporan detail pengawasan penyusunan RPP per pertemuan semester, deteksi guru yang belum pernah membuat lesson plan (0 RPP), dan pantau persetujuan Direktur.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
                <span>Refresh Data</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/kbm/lesson-plan")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FACC15] hover:bg-yellow-300 text-[#1A365D] font-black rounded-2xl shadow-lg shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all text-xs cursor-pointer"
              >
                <span>Buka Modul RPP</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Filters Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/15">
            {/* Filter Lembaga */}
            <div>
              <label className="block text-[11px] font-bold text-blue-200 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-200" />
                <span>Unit Lembaga</span>
              </label>
              <select
                value={selectedLembagaId}
                onChange={(e) => setSelectedLembagaId(e.target.value)}
                className="w-full bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-medium outline-none focus:ring-2 focus:ring-yellow-300"
              >
                <option value="" className="text-slate-800">Semua Lembaga ({lembagaList.length})</option>
                {lembagaList.map((lem: any) => (
                  <option key={lem.lembaga_id} value={lem.lembaga_id} className="text-slate-800">
                    {lem.nama_lembaga} {lem.singkatan ? `(${lem.singkatan})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Pertemuan */}
            <div>
              <label className="block text-[11px] font-bold text-blue-200 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-200" />
                <span>Target Pertemuan Semester</span>
              </label>
              <select
                value={targetPertemuan}
                onChange={(e) => setTargetPertemuan(Number(e.target.value))}
                className="w-full bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-medium outline-none focus:ring-2 focus:ring-yellow-300"
              >
                <option value={12} className="text-slate-800">12 Pertemuan (Efektif Pendek)</option>
                <option value={14} className="text-slate-800">14 Pertemuan</option>
                <option value={16} className="text-slate-800">16 Pertemuan (Standar 1 Semester)</option>
                <option value={18} className="text-slate-800">18 Pertemuan (Semester Penuh)</option>
              </select>
            </div>

            {/* Filter Status Kepatuhan */}
            <div>
              <label className="block text-[11px] font-bold text-blue-200 mb-1 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-200" />
                <span>Status Kepatuhan Guru</span>
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-medium outline-none focus:ring-2 focus:ring-yellow-300"
              >
                <option value="ALL" className="text-slate-800">Semua Status Guru</option>
                <option value="BELUM_BUAT" className="text-slate-800">🚨 Belum Buat (0 RPP)</option>
                <option value="SEBAGIAN" className="text-slate-800">⏳ Sedang Berjalan (Sebagian)</option>
                <option value="LENGKAP" className="text-slate-800">✅ Lengkap (≥ {targetPertemuan} Pertemuan)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Alert Belum Pernah Buat */}
        <Card
          onClick={() => setFilterStatus(filterStatus === "BELUM_BUAT" ? "ALL" : "BELUM_BUAT")}
          className={`border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
            filterStatus === "BELUM_BUAT"
              ? "border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20"
              : "border-rose-100 bg-white hover:bg-rose-50/30"
          }`}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>Belum Buat (0 RPP)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-rose-700">
                  {summary.total_belum_buat}
                </span>
                <span className="text-xs font-semibold text-rose-600">Guru</span>
              </div>
              <p className="text-[10px] text-rose-500 font-medium">Perlu tindak lanjut / teguran</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <UserX className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Sedang Berjalan (Sebagian) */}
        <Card
          onClick={() => setFilterStatus(filterStatus === "SEBAGIAN" ? "ALL" : "SEBAGIAN")}
          className={`border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
            filterStatus === "SEBAGIAN"
              ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20"
              : "border-amber-100 bg-white hover:bg-amber-50/30"
          }`}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Sebagian Pertemuan</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-700">
                  {summary.total_sebagian}
                </span>
                <span className="text-xs font-semibold text-amber-600">Guru</span>
              </div>
              <p className="text-[10px] text-amber-600 font-medium">&lt; {targetPertemuan} pertemuan</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Lengkap */}
        <Card
          onClick={() => setFilterStatus(filterStatus === "LENGKAP" ? "ALL" : "LENGKAP")}
          className={`border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
            filterStatus === "LENGKAP"
              ? "border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20"
              : "border-emerald-100 bg-white hover:bg-emerald-50/30"
          }`}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>RPP Lengkap</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                  {summary.total_lengkap}
                </span>
                <span className="text-xs font-semibold text-emerald-600">Guru</span>
              </div>
              <p className="text-[10px] text-emerald-600 font-medium">≥ {targetPertemuan} pertemuan tuntas</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Kepatuhan Keseluruhan */}
        <Card
          onClick={() => setFilterStatus("ALL")}
          className={`border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
            filterStatus === "ALL"
              ? "border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20"
              : "border-blue-100 bg-white hover:bg-blue-50/30"
          }`}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Kepatuhan Total</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-blue-950">
                  {summary.persentase_kepatuhan}%
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  ({summary.total_lengkap}/{summary.total_guru} Guru)
                </span>
              </div>
              <p className="text-[10px] text-blue-600 font-medium">
                {summary.total_menunggu_verifikasi} RPP Menunggu Approval
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Kepatuhan per Unit Lembaga */}
      {rekapLembaga.length > 0 && !selectedLembagaId && (
        <Card className="border-slate-200/80 shadow-xs rounded-3xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Tingkat Kepatuhan Lesson Plan per Unit Lembaga</span>
              </span>
              <span className="text-xs font-normal text-slate-400">
                Target: {targetPertemuan} Pertemuan
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rekapLembaga.map((lem) => (
                <div
                  key={lem.lembaga_id}
                  onClick={() => setSelectedLembagaId(String(lem.lembaga_id))}
                  className="p-4 bg-slate-50/70 hover:bg-slate-100/80 transition-all rounded-2xl border border-slate-200/70 space-y-3 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs group-hover:text-blue-600 transition-colors">
                        {lem.nama_lembaga}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {lem.total_guru} Guru Terdaftar
                      </span>
                    </div>
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                        lem.persentase >= 80
                          ? "bg-emerald-100 text-emerald-800"
                          : lem.persentase >= 50
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {lem.persentase}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${lem.total_guru > 0 ? (lem.lengkap / lem.total_guru) * 100 : 0}%` }}
                      className="bg-emerald-500 h-full"
                      title={`Lengkap: ${lem.lengkap}`}
                    />
                    <div
                      style={{ width: `${lem.total_guru > 0 ? (lem.sebagian / lem.total_guru) * 100 : 0}%` }}
                      className="bg-amber-400 h-full"
                      title={`Sebagian: ${lem.sebagian}`}
                    />
                    <div
                      style={{ width: `${lem.total_guru > 0 ? (lem.belum / lem.total_guru) * 100 : 0}%` }}
                      className="bg-rose-500 h-full"
                      title={`Belum Buat: ${lem.belum}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span className="text-emerald-700 font-bold">Lengkap: {lem.lengkap}</span>
                    <span className="text-amber-700 font-bold">Sebagian: {lem.sebagian}</span>
                    <span className="text-rose-700 font-bold">Belum: {lem.belum}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabel Detail Pengawasan Guru */}
      <Card className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Detail Pengawasan & Kepatuhan Guru ({filteredGuruList.length} Guru)</span>
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {filterStatus === "BELUM_BUAT"
                  ? "Menampilkan guru yang belum membuat lesson plan sama sekali (0 RPP)"
                  : filterStatus === "SEBAGIAN"
                  ? "Menampilkan guru yang baru menyusun sebagian pertemuan"
                  : filterStatus === "LENGKAP"
                  ? "Menampilkan guru yang telah lengkap menyusun seluruh target pertemuan"
                  : "Menampilkan seluruh guru aktif di lembaga"}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama guru, NIP, mapel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Nama Guru & Lembaga</th>
                  <th className="py-3.5 px-4">Mapel & Kelas Diampu</th>
                  <th className="py-3.5 px-4 text-center">Status Kepatuhan</th>
                  <th className="py-3.5 px-4 text-center">Realisasi Pertemuan</th>
                  <th className="py-3.5 px-4">Keterangan Pertemuan Belum Dibuat</th>
                  <th className="py-3.5 px-4 text-center">Approval Direktur</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      Memuat data pengawasan lesson plan...
                    </td>
                  </tr>
                ) : filteredGuruList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                      <FileText className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-600">Tidak ada data guru ditemukan.</p>
                      <p className="text-xs">Coba sesuaikan filter atau kata kunci pencarian.</p>
                    </td>
                  </tr>
                ) : (
                  filteredGuruList.map((g) => {
                    const isBelum = g.status_kepatuhan === "Belum Buat";
                    const isLengkap = g.status_kepatuhan === "Lengkap";

                    return (
                      <tr
                        key={g.pegawai_id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isBelum ? "bg-rose-50/30" : ""
                        }`}
                      >
                        {/* Nama Guru */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-xs">{g.nama}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            NIP: {g.nip || g.nig} • {g.jabatan || "Guru"}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {g.lembaga_list.map((lem, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200/60 rounded text-[9px] font-bold"
                              >
                                {lem}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Mapel & Kelas Diampu */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 max-w-xs truncate">
                            {g.mapel_diampu.length > 0 ? g.mapel_diampu.join(", ") : "-"}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Kelas: {g.kelas_diampu.length > 0 ? g.kelas_diampu.join(", ") : "-"}
                          </div>
                        </td>

                        {/* Status Kepatuhan */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                              isBelum
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : isLengkap
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {isBelum && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                            {isLengkap && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {!isBelum && !isLengkap && <Clock className="w-3 h-3 text-amber-600" />}
                            <span>{g.status_kepatuhan}</span>
                          </span>
                        </td>

                        {/* Realisasi Pertemuan */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="font-black text-xs text-slate-800">
                            {g.total_pertemuan_dibuat} / {targetPertemuan}{" "}
                            <span className="text-[10px] font-normal text-slate-400">Pertemuan</span>
                          </div>
                          <div className="w-24 bg-slate-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                            <div
                              style={{ width: `${g.persentase}%` }}
                              className={`h-full rounded-full ${
                                isLengkap
                                  ? "bg-emerald-500"
                                  : isBelum
                                  ? "bg-rose-500"
                                  : "bg-amber-500"
                              }`}
                            />
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                            {g.persentase}% tercapai
                          </span>
                        </td>

                        {/* Pertemuan Belum Dibuat */}
                        <td className="py-3.5 px-4">
                          {isBelum ? (
                            <span className="text-xs font-bold text-rose-600 block">
                              ⚠️ Belum ada RPP sama sekali (1 s/d {targetPertemuan})
                            </span>
                          ) : isLengkap ? (
                            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Semua pertemuan sudah tersusun</span>
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-[11px] font-bold text-amber-800 block">
                                Belum: Pertemuan {g.pertemuan_belum_dibuat.slice(0, 8).join(", ")}
                                {g.pertemuan_belum_dibuat.length > 8 ? "..." : ""}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                Sudah dibuat: Pertemuan {g.pertemuan_dibuat.join(", ")}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Approval Direktur */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {g.total_rpp === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">-</span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md font-bold text-[10px] block">
                                {g.verifikasi_direktur.disetujui} Disetujui
                              </span>
                              {g.verifikasi_direktur.menunggu > 0 && (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold text-[10px] block">
                                  {g.verifikasi_direktur.menunggu} Menunggu
                                </span>
                              )}
                              {g.verifikasi_direktur.revisi > 0 && (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-md font-bold text-[10px] block">
                                  {g.verifikasi_direktur.revisi} Revisi
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedGuruDetail(g)}
                            className="p-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                            title="Lihat Detail Pengawasan Guru"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Detail Lesson Plan Guru */}
      {selectedGuruDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-linear-to-r from-[#1A365D] to-[#2B6CB0] text-white flex items-center justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 rounded-full text-[10px] font-bold text-blue-200">
                  <span>Detail RPP Guru</span>
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {selectedGuruDetail.nama}
                </h3>
                <p className="text-xs text-blue-200">
                  NIP: {selectedGuruDetail.nip || selectedGuruDetail.nig} • {selectedGuruDetail.primary_lembaga}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGuruDetail(null)}
                className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs text-slate-700">
              {/* Summary Guru */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Status Kepatuhan</span>
                  <span
                    className={`font-black text-xs ${
                      selectedGuruDetail.status_kepatuhan === "Lengkap"
                        ? "text-emerald-700"
                        : selectedGuruDetail.status_kepatuhan === "Belum Buat"
                        ? "text-rose-700"
                        : "text-amber-700"
                    }`}
                  >
                    {selectedGuruDetail.status_kepatuhan}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Realisasi</span>
                  <span className="font-black text-xs text-slate-800">
                    {selectedGuruDetail.total_pertemuan_dibuat} / {targetPertemuan} Pertemuan
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total RPP Dokumen</span>
                  <span className="font-black text-xs text-blue-700">
                    {selectedGuruDetail.total_rpp} Dokumen
                  </span>
                </div>
              </div>

              {/* Matrix Pertemuan 1 s/d target */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs">
                  Matriks Pertemuan Semester (1 s/d {targetPertemuan}):
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {Array.from({ length: targetPertemuan }, (_, i) => i + 1).map((no) => {
                    const isDibuat = selectedGuruDetail.pertemuan_dibuat.includes(no);
                    return (
                      <div
                        key={no}
                        className={`p-2 rounded-xl text-center border font-mono font-bold text-xs transition-all ${
                          isDibuat
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : "bg-rose-50 border-rose-300 text-rose-700"
                        }`}
                        title={isDibuat ? `Pertemuan ${no} (Sudah Dibuat)` : `Pertemuan ${no} (Belum Dibuat)`}
                      >
                        <div className="text-[9px] text-slate-400">P-{no}</div>
                        <div>{isDibuat ? "✓" : "✗"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Daftar RPP yang telah diinput */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span>Daftar Dokumen RPP yang Tersimpan:</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {selectedGuruDetail.lesson_plans.length} Dokumen
                  </span>
                </h4>

                {selectedGuruDetail.lesson_plans.length === 0 ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700 space-y-1">
                    <AlertTriangle className="w-5 h-5 mx-auto text-rose-600" />
                    <p className="font-bold text-xs">Guru ini belum pernah membuat RPP sama sekali.</p>
                    <p className="text-[11px] text-rose-600">
                      Silakan hubungi atau kirimkan notifikasi evaluasi kepada guru bersangkutan.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedGuruDetail.lesson_plans.map((lp) => (
                      <div
                        key={lp.lesson_plan_id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{lp.judul_rpp}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              lp.status_verifikasi_direktur === "Disetujui"
                                ? "bg-emerald-100 text-emerald-800"
                                : lp.status_verifikasi_direktur === "Revisi"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {lp.status_verifikasi_direktur || "Menunggu Verifikasi"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Mencakup Pertemuan:{" "}
                          <strong>
                            {lp.pertemuan_list.length > 0 ? lp.pertemuan_list.join(", ") : "-"}
                          </strong>{" "}
                          ({lp.total_detail} Sesi)
                        </div>
                        {lp.catatan_revisi_direktur && (
                          <div className="p-2 bg-rose-100/60 text-rose-800 rounded-lg text-[10px]">
                            <strong>Catatan Revisi Direktur:</strong> {lp.catatan_revisi_direktur}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedGuruDetail(null)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedGuruDetail(null);
                  navigate(`/kbm/lesson-plan`);
                }}
                className="px-5 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Verifikasi di Modul RPP</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RekapLessonPlanPage;
