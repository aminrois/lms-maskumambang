import { useUniversalMonitoring } from "./hooks/useUniversalMonitoring";
import { UniversalHeader } from "./components/universal/UniversalHeader";
import { UniversalLembagaStep } from "./components/universal/UniversalLembagaStep";
import { UniversalKelasStep } from "./components/universal/UniversalKelasStep";
import { UniversalResultView } from "./components/universal/UniversalResultView";

export interface MonitoringKBMResponse {
  id?: number;
  jurnal_id?: number;
  nama_guru: string;
  nama_mapel: string;
  nama_kelas: string;
  kelas_id?: number;
  lembaga_id?: number;
  pertemuan_ke: number;
  lp_pertemuan_ke: number;
  status: "Tertinggal" | "Sesuai" | "Terlalu Cepat" | string;
  tanggal: string;
  tanggal_rencana?: string;
  catatan_tambahan?: string | null;
  hari?: string;
  jam?: string;
  materi?: string;
  total_hadir?: number;
  total_siswa?: number;
}

export default function MonitoringUniversal() {
  const {
    isGlobalRole,
    lembagas,
    kelases,
    selectedKelasId,
    setSelectedKelasId,
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
    step,
    setStep,
    filteredRows,
    totalPages,
    paginatedRows,
    summary,
    selectedLembaga,
    selectedKelas,
    setSelectedLembagaId
  } = useUniversalMonitoring();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      <UniversalHeader />

      {step === 'select_lembaga' && isGlobalRole && (
        <UniversalLembagaStep
          lembagas={lembagas}
          onSelectLembaga={setSelectedLembagaId}
          setStep={setStep}
        />
      )}

      {step === 'select_kelas' && (
        <UniversalKelasStep
          isGlobalRole={isGlobalRole}
          selectedLembaga={selectedLembaga}
          kelases={kelases}
          onSelectKelas={setSelectedKelasId}
          setStep={setStep}
        />
      )}

      {step === 'display_results' && (
        <UniversalResultView
          isGlobalRole={isGlobalRole}
          selectedLembaga={selectedLembaga}
          selectedKelas={selectedKelas}
          selectedKelasId={selectedKelasId}
          setSelectedKelasId={setSelectedKelasId}
          kelases={kelases}
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
          summary={summary}
          setStep={setStep}
        />
      )}
    </div>
  );
}
