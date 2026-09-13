import { useRekapSiswa } from "./hooks/useRekapSiswa";
import { RekapHeader } from "./components/rekap/RekapHeader";
import { RekapLembagaStep } from "./components/rekap/RekapLembagaStep";
import { RekapKelasStep } from "./components/rekap/RekapKelasStep";
import { RekapResultView } from "./components/rekap/RekapResultView";

export default function RekapSiswa() {
  const {
    isGlobalRole,
    isGuru,
    filter,
    step,
    setStep,
    currentPage,
    setCurrentPage,
    lembagas,
    kelases,
    isKelasGuruLoading,
    mapels,
    rekapData,
    paginatedData,
    totalPages,
    isLoading,
    isError,
    totals,
    selectedLembaga,
    selectedKelas,
    getHealthColor,
    handleFilterChange,
    handleSelectLembaga,
    handleSelectKelas
  } = useRekapSiswa();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 bg-slate-50/50 min-h-dvh">
      <RekapHeader isGuru={isGuru} />

      {step === 'select_lembaga' && (
        <RekapLembagaStep 
          lembagas={lembagas} 
          onSelectLembaga={handleSelectLembaga} 
        />
      )}

      {step === 'select_kelas' && (
        <RekapKelasStep
          isGuru={isGuru}
          isGlobalRole={isGlobalRole}
          isKelasGuruLoading={isKelasGuruLoading}
          kelases={kelases}
          selectedLembaga={selectedLembaga}
          onBack={() => setStep('select_lembaga')}
          onSelectKelas={handleSelectKelas}
        />
      )}

      {step === 'display_results' && (
        <RekapResultView
          isGlobalRole={isGlobalRole}
          filter={filter}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          mapels={mapels}
          paginatedData={paginatedData}
          rekapData={rekapData}
          totalPages={totalPages}
          isLoading={isLoading}
          isError={isError}
          totals={totals}
          selectedLembaga={selectedLembaga}
          selectedKelas={selectedKelas}
          getHealthColor={getHealthColor}
          onFilterChange={handleFilterChange}
          onBackToKelas={() => setStep('select_kelas')}
          onBackToLembaga={() => setStep('select_lembaga')}
        />
      )}
    </div>
  );
}
