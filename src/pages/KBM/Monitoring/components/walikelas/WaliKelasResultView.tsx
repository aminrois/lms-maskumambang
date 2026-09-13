import {
  Info, ChevronDown, ChevronUp, Search, 
  BookOpen, Loader2, ChevronLeft, ChevronRight, Download,
  CheckCircle2, TrendingDown, TrendingUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { utils, writeFile } from "xlsx";
import { formatDateIndo } from "@/lib/utils";
import type { MonitoringKBMResponse } from "../../Universal";

interface WaliKelasResultViewProps {
  activeClassName: string;
  activeTeacher: string;
  selectedLembaga: any;
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
}

export function renderStatusBadge(status: string) {
  switch (status) {
    case "Sesuai":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider rounded-md border border-emerald-200 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sesuai
        </span>
      );
    case "Tertinggal":
    case "Terlambat":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 text-[11px] font-bold uppercase tracking-wider rounded-md border border-red-200 shrink-0">
          <TrendingDown className="w-3.5 h-3.5 text-red-600" /> {status}
        </span>
      );
    case "Terlalu Cepat":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wider rounded-md border border-amber-200 shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Terlalu Cepat
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider rounded-md border border-emerald-200 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {status || "Sesuai"}
        </span>
      );
  }
}

export function WaliKelasResultView({
  activeClassName,
  activeTeacher,
  selectedLembaga,
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
  paginatedRows
}: WaliKelasResultViewProps) {
  const ITEMS_PER_PAGE = 10;

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
        "Mata Pelajaran": row.nama_mapel || "-",
        "Guru Pengajar": row.nama_guru || "-",
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
    utils.book_append_sheet(workbook, worksheet, "Pantau KBM Wali Kelas");
    const cleanClassName = activeClassName ? activeClassName.replace(/\s+/g, '_') : 'Wali_Kelas';
    writeFile(workbook, `Pantau_KBM_${cleanClassName}_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">{activeClassName}</h2>
              {selectedLembaga && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {selectedLembaga.singkatan || selectedLembaga.nama_lembaga}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Wali Kelas: <strong className="text-slate-700">{activeTeacher}</strong>
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="h-10 rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer font-semibold text-xs shrink-0 self-start md:self-auto"
          onClick={handleExportExcel}
          disabled={filteredRows.length === 0}
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Ekspor Excel</span>
        </Button>
      </div>

      {/* Info Status Accordion */}
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

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari mapel atau guru..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs border-slate-200 rounded-xl"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl border-slate-200 h-10 text-xs font-medium">
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

        <div className="flex items-center gap-2">
          <Input 
            type="date"
            value={tanggalMulai}
            onChange={(e) => setTanggalMulai(e.target.value)}
            className="h-10 text-xs border-slate-200 rounded-xl"
          />
          <span className="text-xs text-slate-400 font-medium shrink-0">s/d</span>
          <Input 
            type="date"
            value={tanggalAkhir}
            onChange={(e) => setTanggalAkhir(e.target.value)}
            className="h-10 text-xs border-slate-200 rounded-xl"
          />
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 text-xs uppercase font-bold">
              <tr>
                <th className="px-5 py-4">Mata Pelajaran</th>
                <th className="px-5 py-4">Guru</th>
                <th className="px-5 py-4">Hari</th>
                <th className="px-5 py-4">Jam</th>
                <th className="px-5 py-4 text-center">Pertemuan Real / RPP</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4">Tanggal Jurnal</th>
                <th className="px-5 py-4">Tanggal Rencana RPP</th>
                <th className="px-5 py-4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <span className="font-medium text-sm">Memuat monitoring kelas asuhan...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500 italic">
                    Tidak ada data monitoring untuk kelas ini.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, index) => (
                  <tr key={row.id ?? `${row.nama_mapel}-${index}`} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                        <BookOpen size={16} />
                      </div>
                      <span className="font-bold text-slate-800">{row.nama_mapel}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold">{row.nama_guru}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {row.hari || "—"}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-blue-700">
                      {row.jam || "—"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="inline-flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                        <span className="font-bold text-blue-600">{row.pertemuan_ke}</span>
                        <span className="text-slate-300">/</span>
                        <span className="font-bold text-purple-600">{row.lp_pertemuan_ke}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {renderStatusBadge(row.status)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-semibold">
                      {row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-semibold">
                      {getTglRencana(row) ? new Date(getTglRencana(row)).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}
                    </td>
                    <td className="px-5 py-4 max-w-xs truncate text-xs text-slate-500" title={row.catatan_tambahan || ""}>
                      {row.catatan_tambahan || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden p-4 divide-y divide-slate-100 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span>Memuat monitoring...</span>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-8 text-center text-slate-500 italic">
              Tidak ada data monitoring untuk kelas ini.
            </div>
          ) : (
            paginatedRows.map((row, index) => (
              <div key={row.id ?? `${row.nama_mapel}-${index}`} className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{row.nama_mapel}</h4>
                      <p className="text-xs text-slate-600 font-semibold">Guru: {row.nama_guru}</p>
                    </div>
                  </div>
                  {renderStatusBadge(row.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                  <div>Hari: <strong className="text-slate-800">{row.hari || "—"}</strong></div>
                  <div>Jam: <strong className="text-blue-700 font-mono">{row.jam || "—"}</strong></div>
                  <div>Realisasi: <strong>Pert. ke-{row.pertemuan_ke}</strong></div>
                  <div>Target RPP: <strong>Pert. ke-{row.lp_pertemuan_ke}</strong></div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 bg-slate-50/50 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredRows.length)} dari {filteredRows.length} baris data
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
      </div>
    </div>
  );
}
