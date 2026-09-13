import { useWaliKelasMonitoring } from "./hooks/useWaliKelasMonitoring";
import { WaliKelasHeader } from "./components/walikelas/WaliKelasHeader";
import { WaliKelasResultView } from "./components/walikelas/WaliKelasResultView";
import { Users } from "lucide-react";

export default function MonitoringWaliKelas() {
  const {
    selectedLembaga,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    isLoading,
    isStatusInfoOpen,
    setIsStatusInfoOpen,
    tanggalMulai,
    setTanggalMulai,
    tanggalAkhir,
    setTanggalAkhir,
    isWaliKelas,
    activeClassName,
    activeTeacher,
    filteredRows,
    totalPages,
    paginatedRows
  } = useWaliKelasMonitoring();

  if (isWaliKelas === false) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Belum Ada Kelas</h2>
          <p className="text-gray-500 text-sm leading-relaxed">Anda masih belum terdata sebagai Wali Kelas asuhan untuk kelas manapun di sistem.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      <WaliKelasHeader
        activeClassName={activeClassName}
        activeTeacher={activeTeacher}
      />

      <WaliKelasResultView
        activeClassName={activeClassName}
        activeTeacher={activeTeacher}
        selectedLembaga={selectedLembaga}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isStatusInfoOpen={isStatusInfoOpen}
        setIsStatusInfoOpen={setIsStatusInfoOpen}
        tanggalMulai={tanggalMulai}
        setTanggalMulai={setTanggalMulai}
        tanggalAkhir={tanggalAkhir}
        setTanggalAkhir={setTanggalAkhir}
        isLoading={isLoading}
        filteredRows={filteredRows}
        totalPages={totalPages}
        paginatedRows={paginatedRows}
      />
    </div>
  );
}
