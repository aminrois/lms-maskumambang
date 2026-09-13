import { 
  ChevronLeft, ChevronRight, Loader2, Info, ChevronDown, ChevronUp, 
  Search, CheckCircle2, TrendingUp, TrendingDown, Download, AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { utils, writeFile } from "xlsx";
import { formatDateIndo } from "@/lib/utils";
import type { KELAS } from "@/types/database";
import type { MonitoringKBMResponse } from "../../Universal";

export function renderStatusBadge(status: string) {
  switch (status) {
    case "Sesuai":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sesuai
        </span>
      );
    case "Tertinggal":
    case "Terlambat":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-md">
          <TrendingDown className="w-3.5 h-3.5 text-rose-600" /> {status}
        </span>
      );
    case "Terlalu Cepat":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-md">
          <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Terlalu Cepat
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {status || "Sesuai"}
        </span>
      );
  }
}

interface UniversalResultViewProps {
  isGlobalRole: boolean;
  selectedLembaga: any;
  selectedKelas: any;
  selectedKelasId: string;
  setSelectedKelasId: (id: string) => void;
  kelases: KELAS[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  isStatusInfoOpen: boolean;
  setIsStatusInfoOpen: (open: boolean) => void;
  tanggalMulai: string;
  setTanggalMulai: (date: string) => void;
  tanggalAkhir: string;
  setTanggalAkhir: (date: string) => void;
  isLoading: boolean;
  filteredRows: MonitoringKBMResponse[];
  totalPages: number;
  paginatedRows: MonitoringKBMResponse[];
  summary: {
    terlambat: number;
    sesuai: number;
    cepat: number;
  };
  setStep: (step: 'select_lembaga' | 'select_kelas' | 'display_results') => void;
}

export function UniversalResultView({
  isGlobalRole,
  selectedLembaga,
  selectedKelas,
  selectedKelasId,
  setSelectedKelasId,
  kelases,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  currentPage,
  setCurrentPage,
  isStatusInfoOpen,
  setIsStatusInfoOpen,
  tanggalMulai,
  setTanggalMulai,
  tanggalAkhir,
  setTanggalAkhir,
  isLoading,
  filteredRows,
  totalPages,
  paginatedRows,
  summary,
  setStep
}: UniversalResultViewProps) {
  const getTglRencana = (row: any) => {
    return row?.tanggal_rencana || row?.tgl_rencana || row?.tanggal_target || row?.tgl_target || row?.tanggal_rpp || row?.rpp_tanggal || "";
  };

  const handleExportExcel = () => {
    const exportData = filteredRows.map((row, index) => {
      const rawTglRencana = getTglRencana(row);
      const formattedTglRencana = formatDateIndo(rawTglRencana);
      const formattedTglJurnal = formatDateIndo(row.tanggal);

      return {
        "No": index + 1,
        "Guru / Pendidik": row.nama_guru || "-",
        "Mata Pelajaran": row.nama_mapel || "-",
        "Kelas": row.nama_kelas || "-",
        "Hari": row.hari || "-",
        "Jam": row.jam || "-",
        "Realisasi Pertemuan": row.pertemuan_ke || 0,
        "Target RPP": row.lp_pertemuan_ke || 0,
        "Status KBM": row.status || "-",
        "Tanggal Realisasi Absensi": formattedTglJurnal,
        "Tanggal Rencana RPP": formattedTglRencana,
        "Catatan": row.catatan_tambahan || "-",
      };
    });

    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Monitoring KBM Akademik");
    const cleanLembagaName = selectedLembaga?.singkatan || selectedLembaga?.nama_lembaga || 'Monitoring';
    writeFile(workbook, `Monitoring_KBM_${cleanLembagaName}_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs / Action Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <Button
          variant="outline"
          className="rounded-xl border-slate-200 text-slate-600 bg-white"
          onClick={() => setStep('select_kelas')}
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" /> Pilih Kelas Lain
        </Button>
        {isGlobalRole && (
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-600 bg-white"
            onClick={() => setStep('select_lembaga')}
          >
            Pilih Lembaga Lain
          </Button>
        )}
        {selectedLembaga && (
          <span className="text-sm font-semibold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">
            {selectedLembaga.singkatan || selectedLembaga.nama_lembaga}
          </span>
        )}
        <span className="text-sm text-slate-400 font-medium">/</span>
        <span className="text-sm font-semibold text-slate-700">
          {selectedKelasId === "Semua" ? "Semua Kelas" : selectedKelas?.nama_kelas}
        </span>

        {/* Tombol Ekspor Excel */}
        <Button
          variant="outline"
          className="ml-auto rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer font-semibold text-xs shrink-0"
          onClick={handleExportExcel}
          disabled={filteredRows.length === 0}
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Ekspor Excel</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-emerald-50/50 border-emerald-100/80 rounded-2xl shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-800 font-medium">Sesuai Target</p>
              <p className="text-xl font-bold text-emerald-950 mt-0.5">{summary.sesuai}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/50 border-rose-100/80 rounded-2xl shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-rose-800 font-medium">Terlambat / Tertinggal</p>
              <p className="text-xl font-bold text-rose-950 mt-0.5">{summary.terlambat}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-100/80 rounded-2xl shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-amber-800 font-medium">Terlalu Cepat</p>
              <p className="text-xl font-bold text-amber-950 mt-0.5">{summary.cepat}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Date & Status Info */}
      <Card className="rounded-2xl border-slate-100 shadow-xs overflow-hidden bg-white">
        <button
          onClick={() => setIsStatusInfoOpen(!isStatusInfoOpen)}
          className="w-full p-4 flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <Info className="w-4 h-4 text-blue-600" />
            <span>Bagaimana Status KBM Ditentukan?</span>
          </div>
          {isStatusInfoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {isStatusInfoOpen && (
          <CardContent className="p-5 border-t border-slate-100 bg-white text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              Status KBM dihitung otomatis dengan membandingkan target pertemuan di RPP (Lesson Plan) dengan catatan jurnal mengajar yang sudah diisi pada periode yang dipilih:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>
                <strong>Sesuai:</strong> Tanggal pelaksanaan KBM (di jurnal) <strong>sama persis</strong> dengan tanggal rencana di RPP.
              </li>
              <li>
                <strong>Terlambat:</strong> Tanggal pelaksanaan KBM (di jurnal) <strong>melewati (lebih dari)</strong> tanggal rencana di RPP.
              </li>
              <li>
                <strong>Terlalu Cepat:</strong> Tanggal pelaksanaan KBM (di jurnal) <strong>mendahului (kurang dari)</strong> tanggal rencana di RPP.
              </li>
            </ul>
          </CardContent>
        )}
      </Card>

      {/* Filters & Data Table */}
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden bg-white">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-50/20">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-slate-800 text-base">Progress Pembelajaran</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tanggal */}
            <div className="flex items-center gap-2">
              <Input 
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="h-9 text-xs border-slate-200 rounded-xl bg-white"
              />
              <span className="text-xs text-slate-400 font-medium">s/d</span>
              <Input 
                type="date"
                value={tanggalAkhir}
                onChange={(e) => setTanggalAkhir(e.target.value)}
                className="h-9 text-xs border-slate-200 rounded-xl bg-white"
              />
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari guru, mapel, kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-xl h-9 text-xs border-slate-200 bg-white focus-visible:ring-1 focus-visible:ring-blue-600"
              />
            </div>

            {/* Filter Kelas */}
            <Select
              value={selectedKelasId}
              onValueChange={setSelectedKelasId}
            >
              <SelectTrigger className="rounded-xl h-9 border-slate-200 bg-white text-xs w-full sm:w-40 focus-visible:ring-1 focus-visible:ring-blue-600">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Semua">Semua Kelas</SelectItem>
                {kelases.map((k) => (
                  <SelectItem key={k.kelas_id} value={String(k.kelas_id)}>
                    {k.nama_kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Status */}
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="rounded-xl h-9 border-slate-200 bg-white text-xs w-full sm:w-36 focus-visible:ring-1 focus-visible:ring-blue-600">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Semua">Semua Status</SelectItem>
                <SelectItem value="Sesuai">Sesuai</SelectItem>
                <SelectItem value="Terlambat">Terlambat</SelectItem>
                <SelectItem value="Terlalu Cepat">Terlalu Cepat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium">Memuat data monitoring akademik...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-16 text-center text-slate-500 italic">
            Tidak ada data yang sesuai dengan kriteria pencarian atau filter yang dipilih.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-5 py-4">Guru / Pendidik</th>
                    <th className="px-5 py-4">Mata Pelajaran</th>
                    <th className="px-5 py-4">Kelas</th>
                    <th className="px-5 py-4">Hari</th>
                    <th className="px-5 py-4">Jam</th>
                    <th className="px-5 py-4 text-center">Jurnal Realisasi</th>
                    <th className="px-5 py-4 text-center">RPP Target</th>
                    <th className="px-5 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedRows.map((row, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-900">{row.nama_guru}</td>
                        <td className="px-5 py-4">{row.nama_mapel}</td>
                        <td className="px-5 py-4 font-medium text-slate-800">{row.nama_kelas}</td>
                        <td className="px-5 py-4 font-semibold text-slate-700">{row.hari || "—"}</td>
                        <td className="px-5 py-4 font-mono text-xs font-semibold text-blue-700">{row.jam || "—"}</td>
                        <td className="px-5 py-4 text-center font-bold text-slate-800">Pertemuan ke-{row.pertemuan_ke}</td>
                        <td className="px-5 py-4 text-center font-bold text-slate-500">Pertemuan ke-{row.lp_pertemuan_ke}</td>
                        <td className="px-5 py-4 text-center">
                          {renderStatusBadge(row.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-slate-100 p-4 space-y-3">
              {paginatedRows.map((row, idx) => (
                <div key={idx} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{row.nama_guru}</h4>
                      <p className="text-xs text-blue-600 font-semibold">{row.nama_mapel} | Kelas {row.nama_kelas}</p>
                    </div>
                    {renderStatusBadge(row.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                    <div>Hari: <strong className="text-slate-800">{row.hari || "—"}</strong></div>
                    <div>Jam: <strong className="text-blue-700 font-mono">{row.jam || "—"}</strong></div>
                    <div>Jurnal: <strong>Pert. ke-{row.pertemuan_ke}</strong></div>
                    <div>RPP Target: <strong>Pert. ke-{row.lp_pertemuan_ke}</strong></div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Menampilkan {((currentPage - 1) * 10) + 1}–{Math.min(currentPage * 10, filteredRows.length)} dari {filteredRows.length} baris data
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-8 text-xs rounded-lg"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Sebelum
                  </Button>
                  <span className="text-xs font-bold text-slate-700 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 text-xs rounded-lg"
                  >
                    Lanjut <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
