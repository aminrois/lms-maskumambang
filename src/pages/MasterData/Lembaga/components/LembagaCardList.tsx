import { Pencil, Trash2 } from "lucide-react";
import type { LembagaUI } from "../hooks/useLembagaData";

interface LembagaCardListProps {
  paginatedData: LembagaUI[];
  canUpdate: boolean;
  canDelete: boolean;
  dataPegawaiAll: any[];
  onEdit: (lembaga: LembagaUI) => void;
  onDelete: (lembaga: LembagaUI) => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalData: number;
  setCurrentPage: (val: number | ((prev: number) => number)) => void;
}

export default function LembagaCardList({
  paginatedData,
  canUpdate,
  canDelete,
  dataPegawaiAll,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  itemsPerPage,
  totalData,
  setCurrentPage
}: LembagaCardListProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedData.length === 0 ? (
          <div className="col-span-full p-12 text-center text-gray-500 bg-white border rounded-xl shadow-sm">
            Tidak ada lembaga ditemukan.
          </div>
        ) : (
          paginatedData.filter(l => l.id != null).map((lembaga) => (
            <div
              key={lembaga.id ?? lembaga.namaLengkap}
              className="bg-white rounded-xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full"
            >
              <div>
                {/* Header: Logo Icon & Name */}
                <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-100 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xl shadow-inner shrink-0 border border-blue-100">
                    {lembaga.singkatan.substring(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-gray-800 truncate" title={lembaga.singkatan}>
                      {lembaga.singkatan}
                    </h3>
                    <p className="text-xs text-gray-500 truncate" title={lembaga.namaLengkap}>
                      {lembaga.namaLengkap}
                    </p>
                  </div>
                </div>

                {/* Pejabat Section */}
                <div className="space-y-2 mb-4 bg-gray-50/50 p-3 rounded-lg border border-gray-100 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-semibold uppercase">Kepala Sekolah</span>
                    <p className="text-gray-900 font-bold truncate max-w-40">
                      {dataPegawaiAll.find((p: any) => p.pegawai_id === lembaga.raw?.kepala_sekolah_id)?.nama ||
                        (lembaga.raw?.kepala_sekolah_id ? `ID: ${lembaga.raw.kepala_sekolah_id}` : "—")}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-semibold uppercase">Waka Kurikulum</span>
                    <p className="text-gray-900 font-bold truncate max-w-40">
                      {dataPegawaiAll.find((p: any) => p.pegawai_id === lembaga.raw?.kurikulum_id)?.nama ||
                        (lembaga.raw?.kurikulum_id ? `ID: ${lembaga.raw.kurikulum_id}` : "—")}
                    </p>
                  </div>
                </div>
                
                {/* Statistik Section */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-center">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">Siswa</span>
                    <span className="text-sm font-bold text-gray-700">{lembaga.statistik.siswa}</span>
                  </div>
                  <div className="text-center border-l border-r border-gray-200/60">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">Guru</span>
                    <span className="text-sm font-bold text-gray-700">{lembaga.statistik.guru}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">Kelas</span>
                    <span className="text-sm font-bold text-gray-700">{lembaga.statistik.kelas}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions Grid */}
              {(canUpdate || canDelete) && (
                <div className="pt-3.5 mt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                  {canUpdate ? (
                    <button
                      onClick={() => onEdit(lembaga)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                      title="Edit Lembaga"
                    >
                      <Pencil className="w-3.5 h-3.5 shrink-0" />
                      <span>Edit</span>
                    </button>
                  ) : <div />}
                  {canDelete ? (
                    <button
                      onClick={() => onDelete(lembaga)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Lembaga"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Hapus</span>
                    </button>
                  ) : <div />}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border shadow-sm gap-4 mt-6">
          <div className="text-sm text-gray-500">
            Menampilkan {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, totalData)} dari {totalData} data
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Sebelumnya
            </button>
            <div className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </>
  );
}
