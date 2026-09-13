import { useRekapAbsensiHarian } from "../hooks/useRekapAbsensiHarian";
import { RekapLembagaStep } from "@/pages/KBM/Absensi/components/rekap/RekapLembagaStep";
import { RekapKelasStep } from "@/pages/KBM/Absensi/components/rekap/RekapKelasStep";
import { RekapResultViewHarian } from "../components/RekapResultViewHarian";
import { FileText } from "lucide-react";

export default function RekapAbsensiHarianIndex() {
  const {
    isGlobalRole,
    isGuru,
    step,
    setStep,
    hasMultipleClasses,
    lembagas,
    kelases,
    isKelasLoading,
    rekapData,
    isLoading,
    isError,
    selectedLembaga,
    selectedKelas,
    tanggalMulai,
    setTanggalMulai,
    tanggalAkhir,
    setTanggalAkhir,
    currentPage,
    setCurrentPage,
    paginatedData,
    totalPages,
    totals,
    getHealthColor,
    handleSelectLembaga,
    handleSelectKelas
  } = useRekapAbsensiHarian();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 bg-slate-50/50 min-h-dvh">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
            <FileText className="w-6 h-6 text-orange-600" />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-[#2B3674] uppercase">REKAP KEHADIRAN HARIAN</h1>
            <p className="text-[#A3AED0] text-sm mt-1">Laporan rekapitulasi kehadiran per kelas</p>
        </div>
      </div>

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
          isKelasGuruLoading={isKelasLoading}
          kelases={kelases}
          selectedLembaga={selectedLembaga}
          onBack={() => setStep('select_lembaga')}
          onSelectKelas={handleSelectKelas}
        />
      )}

      {step === 'display_results' && (
        <RekapResultViewHarian
          rekapData={rekapData}
          paginatedData={paginatedData}
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totals={totals}
          isLoading={isLoading}
          isError={isError}
          selectedLembaga={selectedLembaga}
          selectedKelas={selectedKelas}
          tanggalMulai={tanggalMulai}
          tanggalAkhir={tanggalAkhir}
          setTanggalMulai={setTanggalMulai}
          setTanggalAkhir={setTanggalAkhir}
          onBackToKelas={() => setStep('select_kelas')}
          getHealthColor={getHealthColor}
          hasMultipleClasses={hasMultipleClasses}
        />
      )}
    </div>
  );
}
