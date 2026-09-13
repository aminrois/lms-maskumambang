import { useState, useRef } from "react";
import { Users, Eye, Trash2, Loader2, AlertCircle } from "lucide-react";
import type { WALI_MURID } from "../../../../types/database";

interface WaliMuridTableProps {
  isLoading: boolean;
  paginatedData: WALI_MURID[];
  currentPage: number;
  itemsPerPage: number;
  canUpdate: boolean;
  canDelete: boolean;
  isBulkMode?: boolean;
  selectedIds?: (number | string)[];
  onToggleSelect?: (id: number | string) => void;
  onToggleSelectAllCurrentPage?: () => void;
  onOpenPilihSiswa: (wali: WALI_MURID) => void;
  onViewDetail: (wali: WALI_MURID) => void;
  onEdit: (wali: WALI_MURID) => void;
  onDelete: (wali: WALI_MURID) => void;
}

export default function WaliMuridTable({
  isLoading,
  paginatedData,
  currentPage,
  itemsPerPage,
  canUpdate: _canUpdate,
  canDelete,
  isBulkMode = false,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAllCurrentPage,
  onOpenPilihSiswa,
  onViewDetail,
  onEdit: _onEdit,
  onDelete
}: WaliMuridTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [colWidths, setColWidths] = useState<number[]>([
    50,  // No
    170, // Nama Wali
    130, // NIK Wali
    120, // No HP Wali
    100, // Nama Ayah
    130, // NIK Ayah
    120, // No HP Ayah
    120, // Pekerjaan Ayah
    120, // Pendidikan Ayah
    130, // Penghasilan Ayah
    100, // Status Ayah
    100, // Nama Ibu
    130, // NIK Ibu
    120, // No HP Ibu
    120, // Pekerjaan Ibu
    120, // Pendidikan Ibu
    130, // Penghasilan Ibu
    100, // Status Ibu
    250, // Alamat
    130, // Wali dari Siswa
    160  // Aksi
  ]);

  const startResize = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[index];
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const aksiWidth = 160;
    const checkboxWidth = isBulkMode ? 48 : 0;
    const noWidth = 50;

    // Batas maksimum kolom Nama Wali (index 1) agar garis kanan tidak melebihi/menembus batas kolom Aksi
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
      <div className="bg-white border rounded-xl shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-3 mt-6">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-base font-semibold text-gray-700">Data Tidak Ada</p>
      </div>
    );
  }

  const headers = [
    { label: "No", alignment: "text-center" },
    { label: "Nama Wali", alignment: "text-left" },
    { label: "NIK Wali", alignment: "text-left" },
    { label: "No HP Wali", alignment: "text-left" },
    { label: "Nama Ayah", alignment: "text-left" },
    { label: "NIK Ayah", alignment: "text-left" },
    { label: "No HP Ayah", alignment: "text-left" },
    { label: "Pekerjaan Ayah", alignment: "text-left" },
    { label: "Pendidikan Ayah", alignment: "text-left" },
    { label: "Penghasilan Ayah", alignment: "text-left" },
    { label: "Status Ayah", alignment: "text-center" },
    { label: "Nama Ibu", alignment: "text-left" },
    { label: "NIK Ibu", alignment: "text-left" },
    { label: "No HP Ibu", alignment: "text-left" },
    { label: "Pekerjaan Ibu", alignment: "text-left" },
    { label: "Pendidikan Ibu", alignment: "text-left" },
    { label: "Penghasilan Ibu", alignment: "text-left" },
    { label: "Status Ibu", alignment: "text-center" },
    { label: "Alamat", alignment: "text-left" },
    { label: "Wali dari Siswa", alignment: "text-left" },
    { label: "Aksi", alignment: "text-center" }
  ];

  const totalWidth = colWidths.slice(0, headers.length).reduce((sum, w) => sum + w, 0) + (isBulkMode ? 48 : 0);

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block bg-white border rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto" ref={containerRef}>
          <table 
            className="text-left table-fixed min-w-full"
            style={{ width: totalWidth }}
          >
            <thead className="bg-gray-50/50 border-b text-xs uppercase text-gray-500 font-semibold tracking-wider select-none">
              <tr>
                {isBulkMode && (
                  <th className="w-12 px-4 py-4 text-center border-r border-gray-200 sticky left-0 z-20 bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <input
                      type="checkbox"
                      checked={paginatedData.length > 0 && paginatedData.every((item: any) => selectedIds.includes(item.id || item.wali_id))}
                      onChange={onToggleSelectAllCurrentPage}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Pilih seluruh wali murid di halaman ini"
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
                  <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-3">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                      <span>Memuat data wali murid...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada wali murid ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((wali: any, index: number) => {
                  const isSelected = selectedIds.includes(wali.id || wali.wali_id);
                  const isEvenRow = index % 2 === 1;
                  const rowBg = isSelected 
                    ? "bg-rose-50/70 hover:bg-rose-100/70" 
                    : (isEvenRow ? "bg-gray-100/80 hover:bg-gray-200/80" : "bg-white hover:bg-gray-50/70");
                  
                  const stickyBg = isSelected
                    ? "bg-rose-50 group-hover/row:bg-rose-100"
                    : (isEvenRow ? "bg-gray-100 group-hover/row:bg-gray-200" : "bg-white group-hover/row:bg-gray-50");

                  return (
                    <tr key={wali.wali_id || wali.id} className={`group/row transition-colors ${rowBg}`}>
                      {isBulkMode && (
                        <td className={`w-12 px-4 py-4 text-center border-r border-gray-100 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${stickyBg}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelect?.(wali.id || wali.wali_id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 text-gray-500 truncate">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className={`px-6 py-4 max-w-100 sticky ${isBulkMode ? 'left-12' : 'left-0'} z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${stickyBg}`}>
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-gray-800 truncate" title={wali.nama_wali}>{wali.nama_wali}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 truncate" title={wali.nik_wali || ""}>{wali.nik_wali || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 truncate" title={wali.no_hp_wali || ""}>{wali.no_hp_wali || "—"}</td>
                    <td className="px-6 py-4 text-gray-600 truncate" title={wali.nama_ayah || ""}>{wali.nama_ayah || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 truncate" title={wali.nik_ayah || ""}>{wali.nik_ayah || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 truncate" title={wali.no_hp_ayah || ""}>{wali.no_hp_ayah || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 truncate" title={wali.pekerjaan_ayah || ""}>{wali.pekerjaan_ayah || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 truncate" title={wali.pendidikan_ayah || ""}>{wali.pendidikan_ayah || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 truncate" title={wali.penghasilan_ayah || ""}>{wali.penghasilan_ayah || "—"}</td>
                    <td className="px-6 py-4 text-center text-gray-700 truncate" title={wali.status_ayah || ""}>{wali.status_ayah || "—"}</td>
                    <td className="px-6 py-4 text-gray-600 truncate" title={wali.nama_ibu || ""}>{wali.nama_ibu || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 truncate" title={wali.nik_ibu || ""}>{wali.nik_ibu || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 truncate" title={wali.no_hp_ibu || ""}>{wali.no_hp_ibu || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 truncate" title={wali.pekerjaan_ibu || ""}>{wali.pekerjaan_ibu || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 truncate" title={wali.pendidikan_ibu || ""}>{wali.pendidikan_ibu || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 truncate" title={wali.penghasilan_ibu || ""}>{wali.penghasilan_ibu || "—"}</td>
                    <td className="px-6 py-4 text-center text-gray-700 truncate" title={wali.status_ibu || ""}>{wali.status_ibu || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 truncate" title={wali.alamat || ""}>{wali.alamat || "—"}</td>
                    <td className="px-6 py-4 truncate">
                      {wali.siswa && wali.siswa.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => onOpenPilihSiswa(wali)}
                          className="inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 transition-colors cursor-pointer"
                          title="Atur Siswa"
                        >
                          {wali.siswa.length} Siswa
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenPilihSiswa(wali)}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors cursor-pointer"
                        >
                          Pilih Siswa
                        </button>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-center truncate sticky right-0 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] ${stickyBg}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewDetail(wali)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs"
                          title="Lihat Detail & Akun"
                        >
                          <Eye className="w-4 h-4" />
                          Lihat
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => onDelete(wali)}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-2xs"
                            title="Hapus Wali Murid"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden space-y-3 mt-6">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-gray-500 font-medium">Memuat data wali murid...</span>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white border rounded-xl shadow-sm">
            Tidak ada data wali murid yang ditemukan.
          </div>
        ) : (
          paginatedData.map((wali: any, index: number) => {
            const isSelected = selectedIds.includes(wali.id || wali.wali_id);
            return (
              <div
                key={wali.wali_id || wali.id}
                className={`border rounded-xl p-4 shadow-sm space-y-3 transition-colors ${isSelected ? "bg-rose-50/80 border-rose-200" : "bg-white"}`}
              >
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3 border-b pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {isBulkMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect?.(wali.id || wali.wali_id)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                    )}
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 border border-blue-200">
                      <Users className="w-5 h-5" />
                    </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 truncate text-base">{wali.nama_wali}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      <span>NIK: {wali.nik_wali || "—"}</span>
                      {wali.no_hp_wali && <span>| HP: {wali.no_hp_wali}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-gray-400 shrink-0">
                  #{(currentPage - 1) * itemsPerPage + index + 1}
                </div>
              </div>

              {/* Data Ringkas (Ayah, Ibu, Siswa) */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-0.5">Nama Ayah</span>
                  <div className="font-medium text-gray-700 truncate">{wali.nama_ayah || "—"}</div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-0.5">Nama Ibu</span>
                  <div className="font-medium text-gray-700 truncate">{wali.nama_ibu || "—"}</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <div>
                  {wali.siswa && wali.siswa.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onOpenPilihSiswa(wali)}
                      className="inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 transition-colors cursor-pointer"
                      title="Atur Siswa"
                    >
                      {wali.siswa.length} Siswa
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenPilihSiswa(wali)}
                      className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors cursor-pointer"
                    >
                      Pilih Siswa
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onViewDetail(wali)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    title="Lihat Detail & Akun"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Lihat</span>
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => onDelete(wali)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                      title="Hapus Wali Murid"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>
    </>
  );
}
