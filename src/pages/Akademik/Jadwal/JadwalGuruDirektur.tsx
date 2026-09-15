import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Clock, User, Building, Search, 
  RotateCcw, ChevronLeft, ChevronRight, Loader2, Eye, CalendarDays, BookOpen, ArrowLeft
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useJadwalGuruDirektur } from "./hooks/useJadwalGuruDirektur";

export const JadwalGuruDirektur: React.FC = () => {
  const navigate = useNavigate();
  const {
    isLoading,
    lembagaList,
    selectedLembagaId,
    setSelectedLembagaId,
    searchTerm,
    setSearchTerm,
    filteredGroups,
    paginatedGroups,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    selectedTeacher,
    setSelectedTeacher,
    refetch
  } = useJadwalGuruDirektur();

  const handleReset = () => {
    setSelectedLembagaId("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hariOrder = ["Sabtu", "Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  // Group selected teacher's schedules by day
  const groupedModalJadwals = React.useMemo(() => {
    if (!selectedTeacher || !selectedTeacher.jadwals) return {};
    const acc: Record<string, typeof selectedTeacher.jadwals> = {};
    selectedTeacher.jadwals.forEach((j) => {
      const h = j.hari || "Lainnya";
      if (!acc[h]) acc[h] = [];
      acc[h].push(j);
    });
    return acc;
  }, [selectedTeacher]);

  const sortedModalHari = React.useMemo(() => {
    return Object.keys(groupedModalJadwals).sort((a, b) => hariOrder.indexOf(a) - hariOrder.indexOf(b));
  }, [groupedModalJadwals]);

  // --- VIEW 2: FULL PAGE DETAIL JADWAL GURU ---
  if (selectedTeacher) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 bg-[#F4F7FE] min-h-dvh font-sans">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setSelectedTeacher(null)}
            className="h-10 rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-semibold text-xs shrink-0 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali ke Daftar Guru</span>
          </Button>
        </div>

        {/* Teacher Profile Card Header */}
        <Card className="bg-white border-slate-200/90 rounded-2xl shadow-2xs">
          <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl border border-blue-100 shrink-0">
                <User className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#2B3674]">{selectedTeacher.nama_guru}</h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>Lembaga: <strong className="text-blue-700 font-bold">{selectedTeacher.singkatan_lembaga}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Kelas: <strong className="text-slate-800 font-bold">{selectedTeacher.kelas_display}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100/60 px-3 py-1.5 rounded-xl uppercase">
                Total {selectedTeacher.jadwals.length} Sesi Mengajar
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Day Cards View */}
        <div className="space-y-6">
          {sortedModalHari.length === 0 ? (
            <Card className="bg-white border-slate-200/90 rounded-2xl shadow-2xs p-12 text-center text-slate-500 italic">
              Belum ada rincian sesi jadwal mengajar untuk guru ini.
            </Card>
          ) : (
            sortedModalHari.map((hari) => {
              const sessions = groupedModalJadwals[hari];
              return (
                <div key={hari} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-800 text-xs uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        HARI {hari.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                      {sessions.length} Sesi Mengajar
                    </span>
                  </div>

                  {/* Sessions Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sessions.map((j, i) => (
                      <div 
                        key={i} 
                        className="bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/20 p-4 rounded-xl shadow-2xs transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs bg-indigo-100/80 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200/50">
                              Jam {i + 1}
                            </span>
                            <span className="font-mono text-xs font-bold text-blue-600">
                              {j.jam_mulai_display}–{j.jam_selesai_display}
                            </span>
                          </div>
                          <span className="font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md text-xs shadow-2xs">
                            Kelas {j.nama_kelas}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-[#2B3674] text-sm leading-snug" title={j.mapel_nama}>
                            {j.mapel_nama}
                          </h4>
                          {j.ruangan && (
                            <p className="text-xs text-slate-500 font-medium mt-1">
                              Ruangan: {j.ruangan}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/akademik/jadwal/akademik')}
            className="w-full sm:w-auto h-10 rounded-xl border-blue-200 text-blue-700 bg-blue-50/60 hover:bg-blue-100 flex items-center gap-2 cursor-pointer font-bold text-xs"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Ke Halaman Jadwal Pelajaran Kelas</span>
          </Button>

          <Button
            onClick={() => setSelectedTeacher(null)}
            className="w-full sm:w-auto h-10 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs px-6 cursor-pointer"
          >
            Tutup / Kembali
          </Button>
        </div>
      </div>
    );
  }

  // --- VIEW 1: DAFTAR GURU TABLE PAGE ---
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 bg-[#F4F7FE] min-h-dvh font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xs border border-slate-100 shrink-0">
            <Clock className="w-6 h-6 text-[#243B7A]" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#2B3674] tracking-tight uppercase">Jadwal Guru (Direktur)</h1>
            <p className="text-[#A3AED0] text-[13px] font-medium mt-1">Daftar Pengampuan Kelas & Jadwal Mengajar Guru Lintas Lembaga</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="self-start md:self-auto h-10 rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-semibold text-xs shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-100 rounded-2xl shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Guru</p>
              <p className="text-xl font-bold text-[#2B3674] mt-0.5">{filteredGroups.length} Guru</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 rounded-2xl shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Guru Berjadwal</p>
              <p className="text-xl font-bold text-[#2B3674] mt-0.5">
                {filteredGroups.filter(g => g.has_kelas).length} Guru
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 rounded-2xl shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lembaga Terdaftar</p>
              <p className="text-xl font-bold text-[#2B3674] mt-0.5">
                {new Set(filteredGroups.flatMap(g => g.lembaga_ids)).size} Lembaga
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Filter Lembaga */}
          <div className="w-full sm:w-56">
            <Select 
              value={selectedLembagaId === "" ? "all" : String(selectedLembagaId)} 
              onValueChange={(val) => setSelectedLembagaId(val === "all" ? "" : Number(val))}
            >
              <SelectTrigger className="w-full rounded-xl border-slate-200 h-10 text-xs font-semibold bg-slate-50/50">
                <SelectValue placeholder="Semua Lembaga" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Semua Lembaga</SelectItem>
                {lembagaList.map((lem) => (
                  <SelectItem key={lem.lembaga_id} value={String(lem.lembaga_id)}>
                    {lem.singkatan || lem.nama_lembaga}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama guru atau kelas..."
              className="pl-9 w-full rounded-xl border-slate-200 h-10 text-xs font-medium bg-slate-50/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {(selectedLembagaId !== "" || searchTerm !== "") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-semibold gap-1.5 h-9 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filter
          </Button>
        )}
      </div>

      {/* Main Table Data */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-700 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 w-16 text-center">No</th>
                <th className="px-6 py-4">Guru Pengampu</th>
                <th className="px-6 py-4">Lembaga</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4 text-center w-44">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <span className="font-semibold text-sm">Memuat daftar pengampuan guru...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CalendarDays className="w-10 h-10 text-slate-300 mb-1" />
                      <span className="font-semibold text-slate-700">Tidak ada guru ditemukan</span>
                      <span className="text-xs text-slate-400">Cobalah untuk menyesuaikan pencarian atau filter lembaga.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedGroups.map((row, idx) => {
                  const numberNo = (currentPage - 1) * itemsPerPage + idx + 1;

                  return (
                    <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* 1. No */}
                      <td className="px-6 py-4 text-center font-semibold text-slate-500 text-xs">
                        {numberNo}
                      </td>

                      {/* 2. Guru Pengampu */}
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                          {row.nama_guru.charAt(0)}
                        </div>
                        <span className="font-bold text-[#2B3674]">{row.nama_guru}</span>
                      </td>

                      {/* 3. Lembaga */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100/60 uppercase">
                          {row.singkatan_lembaga}
                        </span>
                      </td>

                      {/* 4. Kelas */}
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {row.has_kelas ? (
                          <span className="font-semibold text-slate-800">
                            {row.kelas_display}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs font-normal">
                            Tidak ada kelas
                          </span>
                        )}
                      </td>

                      {/* 5. Aksi */}
                      <td className="px-6 py-4 text-center">
                        {row.has_kelas ? (
                          <Button
                            size="sm"
                            onClick={() => setSelectedTeacher(row)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 mx-auto cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Jadwal</span>
                          </Button>
                        ) : (
                          <span className="inline-block text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            Tidak ada kelas
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden divide-y divide-slate-100 p-4 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-xs font-semibold">Memuat data guru...</span>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="py-12 text-center text-slate-500 italic text-xs">
              Tidak ada guru ditemukan.
            </div>
          ) : (
            paginatedGroups.map((row, idx) => {
              const numberNo = (currentPage - 1) * itemsPerPage + idx + 1;
              return (
                <div key={row.id} className="pt-3 first:pt-0 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {numberNo}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{row.nama_guru}</h4>
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
                          {row.singkatan_lembaga}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Kelas: <strong className="text-slate-800">{row.kelas_display}</strong></span>
                    {row.has_kelas ? (
                      <Button
                        size="sm"
                        onClick={() => setSelectedTeacher(row)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] h-7 px-2.5 rounded-md flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Lihat Jadwal</span>
                      </Button>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
                        Tidak ada kelas
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 border-t border-slate-100 gap-4">
            <div className="text-xs font-medium text-slate-500">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredGroups.length)} dari {filteredGroups.length} guru
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 text-xs font-semibold rounded-lg"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Sebelum
              </Button>
              <div className="flex items-center px-3 py-1 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg">
                {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 text-xs font-semibold rounded-lg"
              >
                Lanjut <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JadwalGuruDirektur;
