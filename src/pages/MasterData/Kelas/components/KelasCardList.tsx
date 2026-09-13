import { Users, Pencil, Trash2 } from "lucide-react";
import type { KelasUI } from "../hooks/useKelasData";

interface KelasCardListProps {
  paginatedKelas: KelasUI[];
  canUpdate: boolean;
  canDelete: boolean;
  onLihatSiswa: (id: number) => void;
  onEdit: (kelas: KelasUI) => void;
  onDelete: (kelas: KelasUI) => void;
  // Pagination Props
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalData: number;
  setCurrentPage: (val: number | ((prev: number) => number)) => void;
}

export default function KelasCardList({
  paginatedKelas,
  canUpdate,
  canDelete,
  onLihatSiswa,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  itemsPerPage,
  totalData,
  setCurrentPage
}: KelasCardListProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedKelas.map((kelas) => (
          <div
            key={kelas.id}
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between h-full"
          >
            <div>
              {/* Header: Lembaga Badge on Top, Full Width Title Below */}
              <div className="mb-4 pb-3 border-b border-gray-100 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-block whitespace-nowrap px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-100">
                    {kelas.lembaga}
                  </span>
                  {kelas.tahunAjaran && (
                    <span className="inline-flex items-center whitespace-nowrap px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold uppercase tracking-wider rounded-md border border-amber-100">
                      {kelas.semester === 'Ganjil' ? 'GANJIL' : kelas.semester === 'Genap' ? 'GENAP' : 'SMT ?'} • {kelas.tahunAjaran}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 leading-snug wrap-break-word" title={kelas.nama}>
                  {kelas.nama}
                </h3>
              </div>

              {/* Info Fields */}
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">
                    Wali Kelas
                  </span>
                  <div className="text-sm font-medium text-gray-700 truncate" title={kelas.waliKelas}>
                    {kelas.waliKelas}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">
                    Jumlah Siswa
                  </span>
                  <div className="text-sm font-medium text-gray-700">
                    {kelas.jumlahSiswa} Siswa
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons Grid */}
            <div className="pt-3.5 mt-4 border-t border-gray-100 flex items-center justify-between gap-1.5">
              <button
                onClick={() => onLihatSiswa(kelas.id)}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                title="Lihat Daftar Siswa"
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Siswa</span>
              </button>
              {canUpdate && (
                <button
                  onClick={() => onEdit(kelas)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                  title="Edit Kelas"
                >
                  <Pencil className="w-3.5 h-3.5 shrink-0" />
                  <span>Edit</span>
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(kelas)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Kelas"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          </div>
        ))}
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
