import React from "react";
import { ChevronLeft, ChevronRight, Loader2, Calendar, Users, FileText, CheckCircle2, XCircle, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { utils, writeFile } from "xlsx";

interface RekapResultViewProps {
  isGlobalRole: boolean;
  filter: any;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  mapels: any[];
  paginatedData: any[];
  rekapData: any[];
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  totals: {
    totalHadir: number;
    totalSakit: number;
    totalIzin: number;
    totalAlpha: number;
    totalDispen: number;
    avgKehadiran: string;
  };
  selectedLembaga: any;
  selectedKelas: any;
  getHealthColor: (perc: number) => string;
  onFilterChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  onBackToKelas: () => void;
  onBackToLembaga: () => void;
}

export function RekapResultView({
  isGlobalRole,
  filter,
  currentPage,
  setCurrentPage,
  mapels,
  paginatedData,
  rekapData,
  totalPages,
  isLoading,
  isError,
  totals,
  selectedLembaga,
  selectedKelas,
  getHealthColor,
  onFilterChange,
  onBackToKelas,
  onBackToLembaga
}: RekapResultViewProps) {
  const handleExportExcel = () => {
    const selectedMapelObj = mapels.find((m: any) => String(m.mapel_id) === String(filter.mapel_id));
    const mapelNama = selectedMapelObj ? selectedMapelObj.nama_mapel : "Semua Mapel";

    const exportData = rekapData.map((row: any, idx: number) => {
      const total = (Number(row.total_hadir) || 0) + (Number(row.total_sakit) || 0) + (Number(row.total_izin) || 0) + (Number(row.total_alpha) || 0) + (Number(row.total_dispen) || 0);
      const perc = total > 0 ? ((Number(row.total_hadir) || 0) / total) * 100 : 0;

      return {
        "No": idx + 1,
        "NIS": row.nis || "-",
        "Nama Siswa": row.nama || "Siswa",
        "Kelas": row.kelas_nama || selectedKelas?.nama_kelas || "-",
        "Mata Pelajaran": mapelNama,
        "Hadir": Number(row.total_hadir) || 0,
        "Sakit": Number(row.total_sakit) || 0,
        "Izin": Number(row.total_izin) || 0,
        "Alpha": Number(row.total_alpha) || 0,
        "Dispen": Number(row.total_dispen) || 0,
        "Persentase Kehadiran (%)": Number(perc.toFixed(1))
      };
    });

    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Rekap Absensi Mapel");
    
    const cleanKelasName = selectedKelas?.nama_kelas ? selectedKelas.nama_kelas.replace(/\s+/g, '_') : 'Kelas';
    writeFile(workbook, `Rekap_Absensi_Mapel_${cleanKelasName}_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Action Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-600 bg-white"
            onClick={onBackToKelas}
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" /> Pilih Kelas Lain
          </Button>
          {isGlobalRole && (
            <Button
              variant="outline"
              className="rounded-xl border-slate-200 text-slate-600 bg-white"
              onClick={onBackToLembaga}
            >
              Pilih Lembaga Lain
            </Button>
          )}
          {selectedLembaga && (
            <span className="text-sm font-semibold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
              Lembaga: {selectedLembaga.singkatan || selectedLembaga.nama_lembaga}
            </span>
          )}
          {selectedKelas && (
            <span className="text-sm font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg">
              Kelas: {selectedKelas.nama_kelas}
            </span>
          )}
        </div>

        {/* Inline filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mapel:</span>
            <select
              name="mapel_id"
              value={filter.mapel_id || ''}
              onChange={onFilterChange}
              className="text-xs border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white py-1.5 px-3"
            >
              <option value="">Semua Mapel</option>
              {mapels.map((m: any) => (
                <option key={m.mapel_id} value={m.mapel_id}>{m.nama_mapel}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Periode:</span>
            <input
              type="date"
              name="tanggal_mulai"
              value={filter.tanggal_mulai}
              onChange={onFilterChange}
              className="text-xs border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white py-1 px-2"
            />
            <span className="text-xs text-slate-400">-</span>
            <input
              type="date"
              name="tanggal_akhir"
              value={filter.tanggal_akhir}
              onChange={onFilterChange}
              className="text-xs border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white py-1 px-2"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Rata-rata Kehadiran</p>
            <h3 className="text-2xl font-bold text-gray-900">{totals.avgKehadiran}%</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Alpha</p>
            <h3 className="text-2xl font-bold text-gray-900">{totals.totalAlpha}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Sakit / Izin</p>
            <h3 className="text-2xl font-bold text-gray-900">{totals.totalSakit + totals.totalIzin}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Dispensasi</p>
            <h3 className="text-2xl font-bold text-gray-900">{totals.totalDispen}</h3>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            Rekap Kehadiran Siswa
          </h2>

          <Button
            variant="outline"
            className="h-9 rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer font-semibold text-xs shrink-0 self-start sm:self-auto"
            onClick={handleExportExcel}
            disabled={rekapData.length === 0}
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Ekspor Excel</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p className="text-sm font-medium">Mengambil data rekapitulasi...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-500">
            Terjadi kesalahan saat mengambil data rekapitulasi absensi.
          </div>
        ) : rekapData.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="font-medium text-gray-600">Tidak ada data absensi</p>
            <p className="text-sm mt-1">Belum ada catatan kehadiran untuk rentang waktu dan filter yang dipilih.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Siswa</th>
                  <th className="px-6 py-4 font-semibold text-center">Hadir</th>
                  <th className="px-6 py-4 font-semibold text-center">Sakit</th>
                  <th className="px-6 py-4 font-semibold text-center">Izin</th>
                  <th className="px-6 py-4 font-semibold text-center">Alpha</th>
                  <th className="px-6 py-4 font-semibold text-center">Dispen</th>
                  <th className="px-6 py-4 font-semibold text-center">% Hadir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((row: any, idx: number) => {
                  const total = (Number(row.total_hadir) || 0) + (Number(row.total_sakit) || 0) + (Number(row.total_izin) || 0) + (Number(row.total_alpha) || 0) + (Number(row.total_dispen) || 0);
                  const perc = total > 0 ? ((Number(row.total_hadir) || 0) / total) * 100 : 0;

                  return (
                    <tr key={row.siswa_id || idx} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{row.nama || 'Siswa'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">NIS: {row.nis || '-'} {row.kelas_nama ? `| ${row.kelas_nama}` : ''}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-emerald-600">{row.total_hadir || 0}</td>
                      <td className="px-6 py-4 text-center font-medium text-amber-600">{row.total_sakit || 0}</td>
                      <td className="px-6 py-4 text-center font-medium text-blue-600">{row.total_izin || 0}</td>
                      <td className="px-6 py-4 text-center font-medium text-rose-600">{row.total_alpha || 0}</td>
                      <td className="px-6 py-4 text-center font-medium text-purple-600">{row.total_dispen || 0}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getHealthColor(perc)}`}>
                          {perc.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rekapData.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Menampilkan {((currentPage - 1) * 10) + 1}–{Math.min(currentPage * 10, rekapData.length)} dari {rekapData.length} data
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
