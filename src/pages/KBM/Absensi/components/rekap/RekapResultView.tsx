import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Calendar, Users, FileText, CheckCircle2, XCircle, Download, HeartPulse, Info, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { utils, writeFile } from "xlsx";

interface RekapResultViewProps {
  isGlobalRole: boolean;
  isGuru?: boolean;
  filter: any;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  mapels: any[];
  paginatedData: any[];
  rekapData: any[];
  rekapDisiplinGuru?: {
    totalSesi: number;
    tepatWaktu: number;
    terlambat: number;
    terlaluCepat: number;
    belumAdaStatus: number;
    persenTepatWaktu: string;
    sessionList: Array<{
      jurnal_id: number;
      tanggal: string;
      pertemuan_ke: number;
      status: 'Tepat Waktu' | 'Terlambat' | 'Terlalu Cepat' | 'Belum Ditentukan';
      waktu_input: string;
      guru_nama: string;
      mapel_nama: string;
      rentang_jam: string;
      catatan?: string;
    }>;
  };
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
  isGuru,
  filter,
  currentPage,
  setCurrentPage,
  mapels,
  paginatedData,
  rekapData,
  rekapDisiplinGuru,
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
  const [showDisiplinDetails, setShowDisiplinDetails] = useState(false);
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
              className="text-xs border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white py-1.5 px-3 font-medium text-slate-700"
            >
              {!isGuru && <option value="">Semua Mapel</option>}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Rata-rata Kehadiran</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{totals.avgKehadiran}%</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Total Sakit</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{totals.totalSakit}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Total Izin</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{totals.totalIzin}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Total Alpha</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{totals.totalAlpha}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Total Dispensasi</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{totals.totalDispen}</h3>
          </div>
        </div>
      </div>

      {/* Monitoring Kedisiplinan Guru Pengampu */}
      {rekapDisiplinGuru && rekapDisiplinGuru.totalSesi > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-[#FACC15]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">Monitoring Kedisiplinan Guru Pengampu</h3>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-2 py-0.5 rounded-md">
                    Disiplin KBM
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Evaluasi ketepatan waktu pengisian absensi & jurnal mengajar terhadap jadwal kelas.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDisiplinDetails(!showDisiplinDetails)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
            >
              <span>{showDisiplinDetails ? "Sembunyikan Rincian" : "Lihat Rincian Sesi"}</span>
              {showDisiplinDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/70 border-b border-slate-100">
            <div className="p-4 text-center">
              <span className="text-xs font-semibold text-slate-500 block">Total Pertemuan</span>
              <span className="text-lg font-bold text-slate-800 mt-0.5 block">{rekapDisiplinGuru.totalSesi} Sesi</span>
            </div>
            <div className="p-4 text-center bg-emerald-50/40">
              <span className="text-xs font-semibold text-emerald-700 block">Tepat Waktu</span>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className="text-lg font-bold text-emerald-700">{rekapDisiplinGuru.tepatWaktu}</span>
                <span className="text-xs font-semibold text-emerald-600">({rekapDisiplinGuru.persenTepatWaktu}%)</span>
              </div>
            </div>
            <div className="p-4 text-center bg-rose-50/40">
              <span className="text-xs font-semibold text-rose-700 block">Terlambat</span>
              <span className="text-lg font-bold text-rose-700 mt-0.5 block">{rekapDisiplinGuru.terlambat} Sesi</span>
            </div>
            <div className="p-4 text-center bg-amber-50/40">
              <span className="text-xs font-semibold text-amber-700 block">Terlalu Cepat</span>
              <span className="text-lg font-bold text-amber-700 mt-0.5 block">{rekapDisiplinGuru.terlaluCepat} Sesi</span>
            </div>
          </div>

          {/* Detailed Session History */}
          {showDisiplinDetails && (
            <div className="p-5 animate-in fade-in duration-200">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Pertemuan</th>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Mata Pelajaran & Guru</th>
                      <th className="px-4 py-3 text-center">Jadwal Kelas</th>
                      <th className="px-4 py-3 text-center">Waktu Input</th>
                      <th className="px-4 py-3 text-center">Status Kedisiplinan</th>
                      <th className="px-4 py-3">Keterangan / Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rekapDisiplinGuru.sessionList.map((session, idx) => (
                      <tr key={session.jurnal_id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                          Pertemuan ke-{session.pertemuan_ke || idx + 1}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {session.tanggal}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{session.mapel_nama}</div>
                          <div className="text-slate-500 text-[11px]">{session.guru_nama}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-slate-600 whitespace-nowrap">
                          {session.rentang_jam} WIB
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-medium text-slate-700 whitespace-nowrap">
                          {session.waktu_input !== '-' ? `${session.waktu_input} WIB` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {session.status === 'Tepat Waktu' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tepat Waktu
                            </span>
                          ) : session.status === 'Terlambat' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] bg-rose-100 text-rose-800 border border-rose-300">
                              <XCircle className="w-3 h-3 text-rose-600" /> Terlambat
                            </span>
                          ) : session.status === 'Terlalu Cepat' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Terlalu Cepat
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">
                              {session.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px] max-w-xs truncate">
                          {session.catatan || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

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
