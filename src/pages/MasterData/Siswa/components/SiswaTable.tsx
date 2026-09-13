import { useState, useRef } from "react";
import { Loader2, Eye, Trash2, AlertCircle, GraduationCap } from "lucide-react";
import type { SiswaUI } from "../hooks/useSiswaData";

interface SiswaTableProps {
  isLoading: boolean;
  paginatedData: SiswaUI[];
  currentPage: number;
  itemsPerPage: number;
  canUpdate: boolean;
  canDelete: boolean;
  isBulkMode?: boolean;
  selectedIds?: (number | string)[];
  onToggleSelect?: (id: number | string) => void;
  onToggleSelectAllCurrentPage?: () => void;
  onEdit: (siswa: SiswaUI) => void;
  onDelete: (siswa: SiswaUI) => void;
  onDetail: (siswa: SiswaUI) => void;
}

export default function SiswaTable({
  isLoading,
  paginatedData,
  currentPage,
  itemsPerPage,
  canUpdate,
  canDelete,
  isBulkMode = false,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAllCurrentPage,
  onEdit: _onEdit,
  onDelete,
  onDetail
}: SiswaTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [colWidths, setColWidths] = useState<number[]>([
    50,  // No
    170, // Nama Lengkap
    100, // Panggilan
    100, // NIS
    100, // NISN
    120, // NIK
    120, // No KK
    120, // No Akta
    90,  // JK
    100, // Tempat Lahir
    110, // Tgl Lahir
    90,  // Agama
    100, // Kewarganegaraan
    90,  // Thn Masuk
    120, // Asal Sekolah
    120, // No UN
    60,  // RT
    60,  // RW
    100, // Desa
    100, // Kecamatan
    100, // Kab/Kota
    100, // Provinsi
    150, // Alamat
    90,  // Kode Pos
    150, // Keterangan Asrama
    100, // Kelas
    100, // Lembaga
    170, // Wali Murid
    90,  // Status
    160  // Aksi
  ]);

  const startResize = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[index];
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const aksiWidth = (canUpdate || canDelete) ? 160 : 0;
    const checkboxWidth = isBulkMode ? 48 : 0;
    const noWidth = 50;

    // Batas maksimum kolom Nama (index 1) agar garis kanan tidak melebihi/menembus batas kolom Aksi
    const maxNamaWidth = Math.max(120, containerWidth - checkboxWidth - noWidth - aksiWidth - 24);
    const maxAllowedWidth = index === 1 ? maxNamaWidth : Math.max(200, containerWidth - 200);

    const doDrag = (moveEvent: MouseEvent) => {
      const diffX = moveEvent.clientX - startX;
      setColWidths((prev) => {
        const next = [...prev];
        next[index] = Math.min(maxAllowedWidth, Math.max(40, startWidth + diffX));
        return next;
      });
    };

    const stopDrag = () => {
      window.removeEventListener("mousemove", doDrag);
      window.removeEventListener("mouseup", stopDrag);
    };

    window.addEventListener("mousemove", doDrag);
    window.addEventListener("mouseup", stopDrag);
  };

  if (!isLoading && paginatedData.length === 0) {
    return (
      <div className="bg-white border rounded-xl shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-base font-semibold text-gray-700">Data Tidak Ada</p>
      </div>
    );
  }

  const headers = [
    { label: "No", alignment: "text-center" },
    { label: "Nama Lengkap", alignment: "text-left" },
    { label: "Panggilan", alignment: "text-left" },
    { label: "NIS", alignment: "text-left" },
    { label: "NISN", alignment: "text-left" },
    { label: "NIK", alignment: "text-left" },
    { label: "KK", alignment: "text-left" },
    { label: "No Akta", alignment: "text-left" },
    { label: "Jenis Kelamin", alignment: "text-left" },
    { label: "Tempat Lahir", alignment: "text-left" },
    { label: "Tanggal Lahir", alignment: "text-left" },
    { label: "Agama", alignment: "text-left" },
    { label: "Kewarganegaraan", alignment: "text-left" },
    { label: "Tahun Masuk", alignment: "text-center" },
    { label: "Asal Sekolah", alignment: "text-left" },
    { label: "No UN Sebelumnya", alignment: "text-left" },
    { label: "RT", alignment: "text-center" },
    { label: "RW", alignment: "text-center" },
    { label: "Desa", alignment: "text-left" },
    { label: "Kecamatan", alignment: "text-left" },
    { label: "Kab/Kota", alignment: "text-left" },
    { label: "Provinsi", alignment: "text-left" },
    { label: "Alamat", alignment: "text-left" },
    { label: "Kode Pos", alignment: "text-left" },
    { label: "Keterangan Asrama", alignment: "text-left" },
    { label: "Kelas", alignment: "text-left" },
    { label: "Lembaga", alignment: "text-center" },
    { label: "Wali Murid", alignment: "text-left" },
    { label: "Status", alignment: "text-left" },
    ...((canUpdate || canDelete) ? [{ label: "Aksi", alignment: "text-center" }] : [])
  ];

  const totalWidth = colWidths.slice(0, headers.length).reduce((sum, w) => sum + w, 0) + (isBulkMode ? 48 : 0);

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto" ref={containerRef}>
          <table 
            className="text-left table-fixed min-w-full"
            style={{ width: totalWidth }}
          >
            <thead className="bg-gray-50/50 border-b text-xs uppercase text-gray-500 font-semibold tracking-wider select-none">
              <tr>
                {isBulkMode && (
                  <th className="w-12 px-4 py-4 text-center sticky left-0 z-20 bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <input
                      type="checkbox"
                      checked={paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item.id))}
                      onChange={onToggleSelectAllCurrentPage}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Pilih seluruh siswa di halaman ini"
                    />
                  </th>
                )}
                {headers.map((header, index) => (
                  <th
                    key={index}
                    style={{ width: colWidths[index] }}
                    className={`px-6 py-4 whitespace-nowrap truncate ${header.alignment} ${index === 1 ? `sticky ${isBulkMode ? 'left-12' : 'left-0'} z-20 bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]` : header.label === 'Aksi' ? 'sticky right-0 z-25 bg-gray-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]' : 'relative'}`}
                    title={header.label}
                  >
                    {header.label}
                    {index < headers.length && (
                      <div
                        onMouseDown={(e) => startResize(index, e)}
                        className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                        title="Tarik untuk mengubah ukuran kolom"
                      >
                        <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={headers.length + (isBulkMode ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-3">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                      <span>Memuat data siswa...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + (isBulkMode ? 1 : 0)} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada siswa ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((siswa, index) => {
                  const isSelected = selectedIds.includes(siswa.id);
                  const isEvenRow = index % 2 === 1;
                  const rowBg = isSelected 
                    ? "bg-rose-50/70 hover:bg-rose-100/70" 
                    : (isEvenRow ? "bg-gray-100/80 hover:bg-gray-200/80" : "bg-white hover:bg-gray-50/70");
                  
                  const stickyBg = isSelected
                    ? "bg-rose-50 group-hover/row:bg-rose-100"
                    : (isEvenRow ? "bg-gray-100 group-hover/row:bg-gray-200" : "bg-white group-hover/row:bg-gray-50");

                  return (
                    <tr key={siswa.id} className={`group/row transition-colors ${rowBg}`}>
                      {isBulkMode && (
                        <td className={`w-12 px-4 py-4 text-center sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${stickyBg}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelect?.(siswa.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 text-gray-500 truncate">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className={`px-6 py-4 font-bold text-gray-800 truncate max-w-100 sticky ${isBulkMode ? 'left-12' : 'left-0'} z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${stickyBg}`} title={siswa.nama}>{siswa.nama}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.panggilan || ""}>{siswa.raw.panggilan || "—"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.nis}>{siswa.nis}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.nisn}>{siswa.nisn}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.nik || ""}>{siswa.raw.nik || "—"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.no_kk || ""}>{siswa.raw.no_kk || "—"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.no_akta_kelahiran || ""}>{siswa.raw.no_akta_kelahiran || "—"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}>{siswa.raw.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.tempat_lahir || ""}>{siswa.raw.tempat_lahir || "—"}</td>
                      <td 
                        className="px-6 py-4 text-gray-700 truncate" 
                        title={siswa.raw.tanggal_lahir ? new Date(siswa.raw.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ""}
                      >
                        {siswa.raw.tanggal_lahir ? new Date(siswa.raw.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.agama || ""}>{siswa.raw.agama || "—"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.kewarganegaraan || ""}>{siswa.raw.kewarganegaraan || "—"}</td>
                      <td className="px-6 py-4 text-center text-gray-700 truncate" title={String(siswa.raw.tahun_masuk || "")}>{siswa.raw.tahun_masuk || "—"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.asal_sekolah || ""}>{siswa.raw.asal_sekolah || "—"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.no_un_sebelumnya || ""}>{siswa.raw.no_un_sebelumnya || "—"}</td>
                      <td className="px-6 py-4 text-center text-gray-700 truncate" title={siswa.raw.rt || ""}>{siswa.raw.rt || "—"}</td>
                      <td className="px-6 py-4 text-center text-gray-700 truncate" title={siswa.raw.rw || ""}>{siswa.raw.rw || "—"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.desa_kelurahan || ""}>{siswa.raw.desa_kelurahan || "—"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.kecamatan || ""}>{siswa.raw.kecamatan || "—"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.kabupaten_kota || ""}>{siswa.raw.kabupaten_kota || "—"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.provinsi || ""}>{siswa.raw.provinsi || "—"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.alamat || ""}>{siswa.raw.alamat || "—"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.kode_pos || ""}>{siswa.raw.kode_pos || "—"}</td>
                      <td className="px-6 py-4 text-gray-700 truncate" title={siswa.raw.keterangan_asrama || ""}>{siswa.raw.keterangan_asrama || "—"}</td>
                      <td className="px-6 py-4 text-gray-600 truncate" title={siswa.kelas}>{siswa.kelas}</td>
                      <td className="px-6 py-4 text-center truncate">
                        <span className="inline-block whitespace-nowrap bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase border border-indigo-100 tracking-wider">
                          {siswa.lembaga}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 truncate" title={siswa.waliMurid}>{siswa.waliMurid}</td>
                      <td className="px-6 py-4 truncate">
                        <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-bold ${siswa.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : siswa.status === 'Alumni'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                          {siswa.status}
                        </span>
                      </td>
                      {(canUpdate || canDelete) && (
                        <td className={`px-6 py-4 text-center truncate sticky right-0 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] ${stickyBg}`}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onDetail(siswa)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                              Lihat
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => onDelete(siswa)}
                                className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-2xs"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile List View */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 bg-white border rounded-xl shadow-sm flex flex-col items-center">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-2" />
            Memuat data siswa...
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white border rounded-xl shadow-sm">
            Tidak ada siswa ditemukan.
          </div>
        ) : (
          paginatedData.map((siswa, index) => {
            const isSelected = selectedIds.includes(siswa.id);
            return (
              <div key={siswa.id} className={`border rounded-xl p-4 shadow-sm space-y-3 transition-colors ${isSelected ? "bg-rose-50/80 border-rose-200" : "bg-white"}`}>
                <div className="flex items-start justify-between gap-3 border-b pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {isBulkMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect?.(siswa.id)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                    )}
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0 border border-blue-100">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-800 truncate text-base">{siswa.nama}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        NIS: {siswa.nis || "—"} | NISN: {siswa.nisn || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-gray-400 shrink-0">
                    #{(currentPage - 1) * itemsPerPage + index + 1}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    siswa.status === 'Aktif'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : siswa.status === 'Alumni'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    {siswa.status}
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold uppercase border border-indigo-100">
                    {siswa.lembaga}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold border border-gray-200">
                    Kelas: {siswa.kelas}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
                  <button
                    onClick={() => onDetail(siswa)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    title="Lihat Detail"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Lihat</span>
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => onDelete(siswa)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                      title="Hapus Siswa"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
