import { useState, useEffect } from "react";
import {
  Users, Clock, Download, RefreshCw, Search, School, BarChart3,
  Eye, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRekapJamGuru } from "./hooks/useRekapJamGuru";
import { DetailJadwalGuruModal } from "./components/DetailJadwalGuruModal";

export default function RekapJamGuru() {
  const {
    lembagas,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedLembagaFilter,
    setSelectedLembagaFilter,
    sortBy,
    setSortBy,
    rekapData,
    summaryStats,
    selectedGuruDetail,
    isDetailModalOpen,
    handleOpenDetail,
    handleCloseDetail,
    handleExportExcel,
    refetch,
  } = useRekapJamGuru();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedLembagaFilter, sortBy]);

  const totalData = rekapData.length;
  const totalPages = Math.ceil(totalData / itemsPerPage) || 1;
  const paginatedData = rekapData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Header Utama */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
              Monitoring Akademik & Penggajian
            </span>
            <span className="text-xs text-slate-400 font-medium">• Lintas Lembaga</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Rekap Beban Jam Mengajar Guru
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Akumulasi jam mengajar (JP) per guru di seluruh unit/lembaga yayasan berdasarkan jadwal aktif.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="rounded-2xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer h-10 text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span>Sinkron Jadwal</span>
          </Button>

          <Button
            onClick={handleExportExcel}
            disabled={rekapData.length === 0}
            className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow cursor-pointer h-10 text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel (Payroll)</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards / Ringkasan Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50/70 to-white border-blue-100/80 rounded-3xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Total Guru Terjadwal</p>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900">{summaryStats.totalGuru}</h3>
              <p className="text-[11px] text-slate-500">Pendidik aktif di seluruh unit</p>
            </div>
            <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-sm">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50/70 to-white border-emerald-100/80 rounded-3xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Beban Mengajar</p>
              <h3 className="text-2xl md:text-3xl font-black text-emerald-950">
                {summaryStats.totalSemuaJP} <span className="text-sm font-semibold text-emerald-700">JP</span>
              </h3>
              <p className="text-[11px] text-slate-500">Akumulasi seluruh lembaga</p>
            </div>
            <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-sm">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50/70 to-white border-purple-100/80 rounded-3xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Rata-rata Beban</p>
              <h3 className="text-2xl md:text-3xl font-black text-purple-950">
                {summaryStats.avgJP} <span className="text-sm font-semibold text-purple-700">JP / Guru</span>
              </h3>
              <p className="text-[11px] text-slate-500">Beban rata-rata per pendidik</p>
            </div>
            <div className="p-3.5 bg-purple-600 text-white rounded-2xl shadow-sm">
              <BarChart3 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar Filter & Matriks Table */}
      <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white">
        <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama guru, NIP, mapel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-2xl h-10 text-xs border-slate-200 bg-white focus-visible:ring-1 focus-visible:ring-emerald-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Lembaga */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Lembaga:</span>
              <Select value={selectedLembagaFilter} onValueChange={setSelectedLembagaFilter}>
                <SelectTrigger className="w-40 rounded-2xl h-10 border-slate-200 bg-white text-xs font-semibold">
                  <SelectValue placeholder="Semua Lembaga" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="Semua">Semua Lembaga</SelectItem>
                  {lembagas.map((lem) => (
                    <SelectItem key={lem.lembaga_id} value={String(lem.lembaga_id)}>
                      {lem.singkatan || lem.nama_lembaga}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Urutkan:</span>
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className="w-44 rounded-2xl h-10 border-slate-200 bg-white text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="jam_desc">Jam Tertinggi ↓</SelectItem>
                  <SelectItem value="jam_asc">Jam Terendah ↑</SelectItem>
                  <SelectItem value="nama_asc">Nama Guru A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabel Rekap Matriks */}
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-semibold text-slate-600">Menghitung akumulasi jam mengajar guru...</p>
          </div>
        ) : rekapData.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <School className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-base font-bold text-slate-700">Tidak ada data jadwal ditemukan</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Pastikan jadwal pelajaran masing-masing lembaga sudah diinput/diupload pada menu Jadwal Pelajaran.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full text-sm text-left text-slate-600 border-separate border-spacing-0">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold tracking-wider">
                <tr className="border-b border-slate-100">
                  {/* FREEZE KIRI: No & Guru */}
                  <th className="sticky left-0 z-20 bg-slate-50 px-3 py-4 text-center w-12 min-w-[48px] border-b border-slate-200">
                    No
                  </th>
                  <th className="sticky left-[48px] z-20 bg-slate-50 px-5 py-4 min-w-[220px] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)] border-r border-b border-slate-200">
                    Guru / Pendidik
                  </th>

                  {/* KOLOM TENGAH (SCROLLABLE): Tiap Lembaga & Cakupan */}
                  {lembagas.map((lem) => (
                    <th key={lem.lembaga_id} className="px-4 py-4 text-center min-w-[100px] border-b border-slate-200">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200/60 font-black">
                        {lem.singkatan || lem.nama_lembaga}
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-4 text-center min-w-[100px] border-b border-slate-200">
                    Cakupan
                  </th>

                  {/* FREEZE KANAN: Total Beban & Aksi */}
                  <th className="sticky right-[96px] z-20 bg-emerald-50 text-emerald-900 border-l border-b border-emerald-200 min-w-[130px] text-center shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                    Total Beban
                  </th>
                  <th className="sticky right-0 z-20 bg-slate-50 px-4 py-4 text-center min-w-[96px] border-b border-slate-200">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedData.map((guru, idx) => {
                  const itemNo = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr key={guru.pegawai_id} className="group hover:bg-blue-50/20 transition-colors">
                      {/* FREEZE KIRI: No & Guru */}
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-3 py-4 text-center font-medium text-slate-400 text-xs border-b border-slate-100">
                        {itemNo}
                      </td>

                      <td className="sticky left-[48px] z-10 bg-white group-hover:bg-slate-50 px-5 py-4 min-w-[220px] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)] border-r border-b border-slate-100">
                        <div className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors cursor-pointer" onClick={() => handleOpenDetail(guru)}>
                          {guru.nama_guru}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {guru.nip !== "—" ? `NIP: ${guru.nip}` : "Non-NIP"}
                        </div>
                      </td>

                      {/* Kolom Tiap Lembaga */}
                      {lembagas.map((lem) => {
                        const jp = guru.jam_per_lembaga[lem.lembaga_id] || 0;
                        return (
                          <td key={lem.lembaga_id} className="px-4 py-4 text-center border-b border-slate-100">
                            {jp > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                                {jp} JP
                              </span>
                            ) : (
                              <span className="text-slate-300 font-medium text-xs">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Info Cakupan Kelas & Mapel */}
                      <td className="px-4 py-4 text-center text-xs text-slate-600 font-medium border-b border-slate-100">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-slate-800 font-bold">{guru.total_kelas} Kelas</span>
                          <span className="text-[11px] text-slate-400">{guru.total_mapel} Mapel</span>
                        </div>
                      </td>

                      {/* FREEZE KANAN: Total Beban Jam Mengajar */}
                      <td className="sticky right-[96px] z-10 bg-emerald-50/90 group-hover:bg-emerald-100/70 border-l border-b border-emerald-200 px-4 py-4 text-center font-black text-sm shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white shadow-2xs font-extrabold text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          {guru.total_jp} JP
                        </span>
                      </td>

                      {/* FREEZE KANAN: Tombol Aksi Detail */}
                      <td className="sticky right-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-4 text-center min-w-[96px] border-b border-slate-100">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetail(guru)}
                          className="rounded-xl border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 text-xs h-8 px-2.5 font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          <span>Rincian</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination & Page Size Toolbar */}
        {totalData > 0 && (
          <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-600 gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-slate-500 font-medium">Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {[10, 15, 20, 25, 50, 100].map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
              <span className="text-slate-500">
                per halaman • Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, totalData)}–{Math.min(currentPage * itemsPerPage, totalData)} dari {totalData} guru
              </span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl h-8 px-3 text-xs font-semibold bg-white border-slate-200"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Sebelumnya
                </Button>
                <span className="px-3 py-1 font-bold text-xs bg-white border border-slate-200 rounded-xl text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl h-8 px-3 text-xs font-semibold bg-white border-slate-200"
                >
                  Selanjutnya
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modal Detail Jadwal Guru */}
      <DetailJadwalGuruModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        guru={selectedGuruDetail}
        lembagas={lembagas}
      />
    </div>
  );
}
