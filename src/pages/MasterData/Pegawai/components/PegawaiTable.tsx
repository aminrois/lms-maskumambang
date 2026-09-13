import { useState, useRef } from "react";
import { Eye, Trash2, User, AlertCircle } from "lucide-react";
import type { PegawaiUI } from "../hooks/usePegawaiData";

interface PegawaiTableProps {
  data: PegawaiUI[];
  startIndex: number;
  canUpdate: boolean;
  canDelete: boolean;
  isBulkMode?: boolean;
  selectedIds?: (number | string)[];
  onToggleSelect?: (id: number | string) => void;
  onToggleSelectAllCurrentPage?: () => void;
  onViewDetail: (pegawai: PegawaiUI) => void;
  onEdit: (pegawai: PegawaiUI) => void;
  onDelete: (pegawai: PegawaiUI) => void;
}

export default function PegawaiTable({
  data,
  startIndex,
  canUpdate,
  canDelete,
  isBulkMode = false,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAllCurrentPage,
  onViewDetail,
  onEdit: _onEdit,
  onDelete
}: PegawaiTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [colWidths, setColWidths] = useState<number[]>([
    50,  // 0: No
    170, // 1: Nama Pegawai
    100, // 2: NIG
    100, // 3: NIP
    130, // 4: NIK
    120, // 5: Jenis Kelamin
    120, // 6: Tempat Lahir
    130, // 7: Tanggal Lahir
    100, // 8: Tahun Lahir
    80,  // 9: Umur
    250, // 10: Alamat
    120, // 11: No HP
    120, // 12: Jabatan
    150, // 13: Tugas Tambahan
    100, // 14: Lembaga
    60,  // 15: Jumlah Anak - L
    60,  // 16: Jumlah Anak - P
    100, // 17: Nama Orang Tua - Ayah
    100, // 18: Nama Orang Tua - Ibu
    90,  // 19: Gol Darah
    90,  // 20: Status
    160  // 21: Aksi
  ]);

  const startResize = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[index];
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const aksiWidth = (canUpdate || canDelete) ? 160 : 0;
    const checkboxWidth = isBulkMode ? 48 : 0;
    const noWidth = 50;

    // Batas maksimum kolom Nama Pegawai (index 1) agar garis kanan tidak melebihi/menembus batas kolom Aksi
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

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-base font-semibold text-gray-700">Data Tidak Ada</p>
      </div>
    );
  }

  const numColumns = (canUpdate || canDelete) ? 22 : 21;
  const totalWidth = colWidths.slice(0, numColumns).reduce((sum, w) => sum + w, 0) + (isBulkMode ? 48 : 0);

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto" ref={containerRef}>
          <table 
            className="text-sm text-left table-fixed min-w-full"
            style={{ width: totalWidth }}
          >
            <thead className="bg-gray-50 border-b text-gray-600 font-semibold select-none text-xs uppercase tracking-wider">
              <tr>
                {isBulkMode && (
                  <th rowSpan={2} className="w-12 px-4 py-3 text-center border-r border-b border-gray-200 sticky left-0 z-20 bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <input
                      type="checkbox"
                      checked={data.length > 0 && data.every(item => selectedIds.includes(item.id))}
                      onChange={onToggleSelectAllCurrentPage}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Pilih seluruh pegawai di halaman ini"
                    />
                  </th>
                )}
                <th
                  rowSpan={2}
                  style={{ width: colWidths[0] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-center border-r border-b border-gray-200"
                  title="No"
                >
                  No
                  <div
                    onMouseDown={(e) => startResize(0, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[1] }}
                  className={`px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200 sticky ${isBulkMode ? 'left-12' : 'left-0'} z-20 bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}
                  title="Nama Pegawai"
                >
                  Nama Pegawai
                  <div
                    onMouseDown={(e) => startResize(1, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[2] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200"
                  title="NIG"
                >
                  NIG
                  <div
                    onMouseDown={(e) => startResize(2, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[3] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200"
                  title="NIP"
                >
                  NIP
                  <div
                    onMouseDown={(e) => startResize(3, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[4] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200"
                  title="NIK"
                >
                  NIK
                  <div
                    onMouseDown={(e) => startResize(4, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[5] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200"
                  title="Jenis Kelamin"
                >
                  Jenis Kelamin
                  <div
                    onMouseDown={(e) => startResize(5, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[6] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200"
                  title="Tempat Lahir"
                >
                  Tempat Lahir
                  <div
                    onMouseDown={(e) => startResize(6, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[7] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200"
                  title="Tanggal Lahir"
                >
                  Tanggal Lahir
                  <div
                    onMouseDown={(e) => startResize(7, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[8] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200"
                  title="Tahun Lahir"
                >
                  Tahun Lahir
                  <div
                    onMouseDown={(e) => startResize(8, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[9] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200"
                  title="Umur"
                >
                  Umur
                  <div
                    onMouseDown={(e) => startResize(9, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[10] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200"
                  title="Alamat"
                >
                  Alamat
                  <div
                    onMouseDown={(e) => startResize(10, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[11] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200"
                  title="No HP"
                >
                  No HP
                  <div
                    onMouseDown={(e) => startResize(11, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[12] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200"
                  title="Jabatan"
                >
                  Jabatan
                  <div
                    onMouseDown={(e) => startResize(12, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[13] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200"
                  title="Tugas Tambahan"
                >
                  Tugas Tambahan
                  <div
                    onMouseDown={(e) => startResize(13, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[14] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200"
                  title="Lembaga"
                >
                  Lembaga
                  <div
                    onMouseDown={(e) => startResize(14, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  colSpan={2}
                  className="px-4 py-2 text-center font-bold text-gray-700 border-r border-b border-gray-200 bg-blue-50/30 whitespace-nowrap"
                >
                  Jumlah Anak
                </th>
                <th
                  colSpan={2}
                  className="px-4 py-2 text-center font-bold text-gray-700 border-r border-b border-gray-200 bg-blue-50/30 whitespace-nowrap"
                >
                  Nama Orang Tua
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[19] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-left border-r border-b border-gray-200"
                  title="Gol Darah"
                >
                  Gol Darah
                  <div
                    onMouseDown={(e) => startResize(19, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  rowSpan={2}
                  style={{ width: colWidths[20] }}
                  className="relative px-4 py-3 whitespace-nowrap truncate text-center border-r border-b border-gray-200"
                  title="Status"
                >
                  Status
                  <div
                    onMouseDown={(e) => startResize(20, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                {(canUpdate || canDelete) && (
                  <th
                    rowSpan={2}
                    style={{ width: colWidths[21] }}
                    className="sticky right-0 z-25 px-4 py-3 whitespace-nowrap truncate text-center border-r border-b border-gray-200 bg-gray-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                    title="Aksi"
                  >
                    Aksi
                    <div
                      onMouseDown={(e) => startResize(21, e)}
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                    >
                      <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                    </div>
                  </th>
                )}
              </tr>
              <tr>
                <th
                  style={{ width: colWidths[15] }}
                  className="relative px-4 py-2 text-center text-xs font-semibold text-gray-600 border-r border-b border-gray-200 bg-gray-50/50 whitespace-nowrap"
                  title="L"
                >
                  L
                  <div
                    onMouseDown={(e) => startResize(15, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  style={{ width: colWidths[16] }}
                  className="relative px-4 py-2 text-center text-xs font-semibold text-gray-600 border-r border-b border-gray-200 bg-gray-50/50 whitespace-nowrap"
                  title="P"
                >
                  P
                  <div
                    onMouseDown={(e) => startResize(16, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  style={{ width: colWidths[17] }}
                  className="relative px-4 py-2 text-center text-xs font-semibold text-gray-600 border-r border-b border-gray-200 bg-gray-50/50 whitespace-nowrap"
                  title="Ayah"
                >
                  Ayah
                  <div
                    onMouseDown={(e) => startResize(17, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th
                  style={{ width: colWidths[18] }}
                  className="relative px-4 py-2 text-center text-xs font-semibold text-gray-600 border-r border-b border-gray-200 bg-gray-50/50 whitespace-nowrap"
                  title="Ibu"
                >
                  Ibu
                  <div
                    onMouseDown={(e) => startResize(18, e)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none hover:bg-blue-300/40 active:bg-blue-500/60 border-r border-gray-300/30 group/resize flex items-center justify-center z-5"
                  >
                    <div className="w-px h-3 bg-gray-300 opacity-0 group-hover/resize:opacity-100 transition-opacity" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((pegawai, index) => {
                const isSelected = selectedIds.includes(pegawai.id);
                const isEvenRow = index % 2 === 1;
                const rowBg = isSelected 
                  ? "bg-rose-50/70 hover:bg-rose-100/70" 
                  : (isEvenRow ? "bg-gray-100/80 hover:bg-gray-200/80" : "bg-white hover:bg-gray-50/70");
                
                const stickyBg = isSelected
                  ? "bg-rose-50 group-hover/row:bg-rose-100"
                  : (isEvenRow ? "bg-gray-100 group-hover/row:bg-gray-200" : "bg-white group-hover/row:bg-gray-50");

                return (
                  <tr key={pegawai.id} className={`group/row transition-colors ${rowBg}`}>
                    {isBulkMode && (
                      <td className={`w-12 px-4 py-3 text-center border-r border-gray-100 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${stickyBg}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect?.(pegawai.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-center text-gray-500 truncate">{startIndex + index + 1}</td>
                    <td className={`px-4 py-3 font-semibold text-gray-900 truncate max-w-100 sticky ${isBulkMode ? 'left-12' : 'left-0'} z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${stickyBg}`} title={pegawai.nama}>{pegawai.nama}</td>
                  <td className="px-4 py-3 text-gray-900 truncate" title={pegawai.nig || ""}>{pegawai.nig || "—"}</td>
                  <td className="px-4 py-3 text-gray-900 truncate" title={pegawai.nip || ""}>{pegawai.nip || "—"}</td>
                  <td className="px-4 py-3 text-gray-900 truncate" title={pegawai.raw.nik || ""}>{pegawai.raw.nik || "—"}</td>
                  <td className="px-4 py-3 text-gray-900 truncate" title={pegawai.jenisKelamin}>{pegawai.jenisKelamin}</td>
                  <td className="px-4 py-3 text-gray-900 truncate" title={pegawai.raw.tempat_lahir || ""}>{pegawai.raw.tempat_lahir || "—"}</td>
                  <td 
                    className="px-4 py-3 text-gray-900 truncate"
                    title={pegawai.raw.tanggal_lahir ? new Date(pegawai.raw.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ""}
                  >
                    {pegawai.raw.tanggal_lahir ? new Date(pegawai.raw.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-900 truncate" title={pegawai.raw.tanggal_lahir ? String(new Date(pegawai.raw.tanggal_lahir).getFullYear()) : "—"}>
                    {pegawai.raw.tanggal_lahir ? new Date(pegawai.raw.tanggal_lahir).getFullYear() : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-900 truncate" title={(() => {
                    if (!pegawai.raw.tanggal_lahir) return "—";
                    const birth = new Date(pegawai.raw.tanggal_lahir);
                    if (isNaN(birth.getTime())) return "—";
                    const now = new Date();
                    let age = now.getFullYear() - birth.getFullYear();
                    const m = now.getMonth() - birth.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                    return age >= 0 ? `${age} thn` : "—";
                  })()}>
                    {(() => {
                      if (!pegawai.raw.tanggal_lahir) return "—";
                      const birth = new Date(pegawai.raw.tanggal_lahir);
                      if (isNaN(birth.getTime())) return "—";
                      const now = new Date();
                      let age = now.getFullYear() - birth.getFullYear();
                      const m = now.getMonth() - birth.getMonth();
                      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                      return age >= 0 ? `${age} thn` : "—";
                    })()}
                  </td>
                  <td className="px-4 py-3 text-gray-900 truncate" title={pegawai.raw.alamat || ""}>{pegawai.raw.alamat || "—"}</td>
                  <td className="px-4 py-3 text-gray-900 truncate" title={pegawai.raw.no_hp || ""}>{pegawai.raw.no_hp || "—"}</td>
                  <td className="px-4 py-3 text-gray-900 truncate" title={pegawai.jabatan}>{pegawai.jabatan}</td>
                  <td className="px-4 py-3 text-gray-900 truncate" title={pegawai.raw.tugas_tambahan || ""}>{pegawai.raw.tugas_tambahan || "—"}</td>
                  <td className="px-4 py-3 truncate">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${pegawai.lembagaList === "Global"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                      {pegawai.lembagaList}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-900 truncate" title={pegawai.raw.jumlah_anak_laki !== null && pegawai.raw.jumlah_anak_laki !== undefined ? String(pegawai.raw.jumlah_anak_laki) : "—"}>
                    {pegawai.raw.jumlah_anak_laki !== null && pegawai.raw.jumlah_anak_laki !== undefined ? pegawai.raw.jumlah_anak_laki : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-900 truncate" title={pegawai.raw.jumlah_anak_perempuan !== null && pegawai.raw.jumlah_anak_perempuan !== undefined ? String(pegawai.raw.jumlah_anak_perempuan) : "—"}>
                    {pegawai.raw.jumlah_anak_perempuan !== null && pegawai.raw.jumlah_anak_perempuan !== undefined ? pegawai.raw.jumlah_anak_perempuan : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-900 truncate" title={pegawai.raw.nama_ayah || ""}>{pegawai.raw.nama_ayah || "—"}</td>
                  <td className="px-4 py-3 text-gray-900 truncate" title={pegawai.raw.nama_ibu || ""}>{pegawai.raw.nama_ibu || "—"}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900 truncate" title={pegawai.raw.golongan_darah || ""}>{pegawai.raw.golongan_darah || "—"}</td>
                  <td className="px-4 py-3 text-center truncate">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${pegawai.status === "Aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                      {pegawai.status}
                    </span>
                  </td>
                  {(canUpdate || canDelete) && (
                    <td className={`px-4 py-3 text-center truncate sticky right-0 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] ${stickyBg}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewDetail(pegawai)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs"
                          title="Lihat Detail & Info Akun"
                        >
                          <Eye className="w-4 h-4" />
                          Lihat
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => onDelete(pegawai)}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-2xs"
                            title="Hapus Pegawai"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden space-y-3 mt-6">
        {data.map((pegawai, index) => {
          const isSelected = selectedIds.includes(pegawai.id);
          return (
            <div
              key={pegawai.id}
              className={`border rounded-xl p-4 shadow-sm space-y-3 transition-colors ${isSelected ? "bg-rose-50/80 border-rose-200" : "bg-white"}`}
            >
              {/* Header Card (Nama, NIG & Index) */}
              <div className="flex items-start justify-between gap-3 border-b pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {isBulkMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect?.(pegawai.id)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                  )}
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 border border-blue-200">
                    <User className="w-5 h-5" />
                  </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 truncate text-base">{pegawai.nama}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <span>NIG: {pegawai.nig || "—"}</span>
                    {pegawai.nip && <span>| NIP: {pegawai.nip}</span>}
                  </div>
                </div>
              </div>
              <div className="text-xs font-semibold text-gray-400 shrink-0">
                #{startIndex + index + 1}
              </div>
            </div>

            {/* Badges & Info Ringkas */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                pegawai.status === "Aktif"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {pegawai.status}
              </span>

              <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium text-xs ${
                pegawai.lembagaList === "Global"
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                {pegawai.lembagaList}
              </span>

              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold border border-gray-200">
                {pegawai.jabatan}
              </span>
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => onViewDetail(pegawai)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                title="Lihat Detail"
              >
                <Eye className="w-4 h-4" />
                <span>Lihat</span>
              </button>
              {canDelete && (
                <button
                  onClick={() => onDelete(pegawai)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  title="Hapus Pegawai"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </>
  );
}
