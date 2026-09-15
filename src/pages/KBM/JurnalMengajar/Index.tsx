import { useJurnalMengajarList } from "./hooks/useJurnalMengajarList";
import { JurnalHeader } from "./components/list/JurnalHeader";
import { JurnalSearch } from "./components/list/JurnalSearch";
import { JurnalList } from "./components/list/JurnalList";
import { JurnalDeleteModal } from "./components/list/JurnalDeleteModal";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertTriangle, BookOpen, Layers } from "lucide-react";

export default function KbmJurnalMengajar() {
  const navigate = useNavigate();
  const {
    role,
    canDelete,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    tanggalMulai,
    setTanggalMulai,
    tanggalAkhir,
    setTanggalAkhir,
    isDirector,
    lembagaList,
    selectedLembagaId,
    setSelectedLembagaId,
    filteredKelasList,
    selectedKelasId,
    setSelectedKelasId,
    isDeleteOpen,
    setIsDeleteOpen,
    selectedJurnal,
    isDeleting,
    isLoading,
    totalPages,
    paginatedData,
    summary,
    confirmDelete,
    executeDelete
  } = useJurnalMengajarList();

  const isGuruOnly = role === 'Guru';

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 relative">
      {/* Header & Filter Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <JurnalHeader />
        <JurnalSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          tanggalMulai={tanggalMulai}
          setTanggalMulai={setTanggalMulai}
          tanggalAkhir={tanggalAkhir}
          setTanggalAkhir={setTanggalAkhir}
          isDirector={isDirector}
          lembagaList={lembagaList}
          selectedLembagaId={selectedLembagaId}
          setSelectedLembagaId={setSelectedLembagaId}
          filteredKelasList={filteredKelasList}
          selectedKelasId={selectedKelasId}
          setSelectedKelasId={setSelectedKelasId}
        />
      </div>

      {/* Summary Cards - Sembunyikan untuk role Guru (hanya tampilkan untuk Direktur/Wali Kelas) */}
      {!isGuruOnly && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Sesi Jadwal</p>
              <h3 className="text-xl font-bold text-slate-800 mt-0.5">{summary.totalSesi} Sesi</h3>
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-emerald-200/80 bg-linear-to-br from-emerald-50/40 to-white shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700">Sudah Mengajar & Absensi</p>
              <h3 className="text-xl font-bold text-emerald-800 mt-0.5">{summary.totalSudahMengajar} Sesi</h3>
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-rose-200/90 bg-linear-to-br from-rose-50/50 to-white shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-700">Belum Mengajar / Absensi</p>
              <h3 className="text-xl font-bold text-rose-800 mt-0.5">{summary.totalBelumMengajar} Sesi</h3>
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Tingkat Kepatuhan</p>
              <h3 className="text-xl font-bold text-blue-700 mt-0.5">{summary.persentase}%</h3>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Filter Status Sesi */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 flex-wrap">
        <button
          type="button"
          onClick={() => {
            setStatusFilter('Semua');
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'Semua'
              ? 'bg-[#243B7A] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {isGuruOnly ? `Semua Jurnal (${summary.totalSesi})` : `Semua Sesi (${summary.totalSesi})`}
        </button>

        {!isGuruOnly && (
          <>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Sudah');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Sudah'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/70'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sudah Mengajar ({summary.totalSudahMengajar})
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('Belum');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Belum'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100/70'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Belum Mengajar ({summary.totalBelumMengajar})
            </button>
          </>
        )}
      </div>

      {/* List Sesi KBM & Jurnal */}
      <JurnalList
        isLoading={isLoading}
        filteredData={paginatedData}
        paginatedData={paginatedData}
        canDelete={canDelete}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        itemsPerPage={8}
        onConfirmDelete={confirmDelete}
        onViewDetail={(id) => navigate(`/kbm/jurnal-mengajar/${id}`)}
      />

      <JurnalDeleteModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        selectedJurnal={selectedJurnal}
        isPending={isDeleting}
        onDelete={executeDelete}
      />
    </div>
  );
}

