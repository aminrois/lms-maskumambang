import { useState } from "react";
import { useLessonPlanList } from "./hooks/useLessonPlanList";
import { LessonPlanHeader } from "./components/list/LessonPlanHeader";
import { LessonPlanFilters } from "./components/list/LessonPlanFilters";
import { LessonPlanList } from "./components/list/LessonPlanList";
import { LessonPlanDeleteModal } from "./components/list/LessonPlanDeleteModal";
import { LessonPlanReviewModals } from "./components/list/LessonPlanReviewModals";
import { LessonPlanPertemuanEditPage } from "./components/list/LessonPlanPertemuanEditPage";
import { LessonPlanTemplateConfigPage } from "./components/template/LessonPlanTemplateConfigPage";
import { Card, CardContent } from "@/components/ui/card";
import { Info, ChevronDown, ChevronUp, UploadCloud, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

export default function LessonPlanGuru() {
  const {
    activeTab,
    setActiveTab,
    tabs,
    lessonPlans,
    isLoading,
    role,
    canVerify,
    isDeleteOpen,
    setIsDeleteOpen,
    expandedPlans,
    toggleExpand,
    selectedPlan,
    isDeleting,
    isApproveModalOpen,
    setIsApproveModalOpen,
    isRevisiModalOpen,
    setIsRevisiModalOpen,
    isApproveAllModalOpen,
    setIsApproveAllModalOpen,
    isApprovingAll,
    eligiblePlansToApprove,
    handleOpenSetujuiSemua,
    executeVerifyAll,
    isResetVerifikasiModalOpen,
    setIsResetVerifikasiModalOpen,
    isResettingVerifikasi,
    executeResetVerifikasi,
    revisiNote,
    setRevisiNote,
    isVerifying,
    handleVerifyAction,
    executeDelete,
    executeVerify,
    // Per-Meeting Verification
    selectedDetailForVerify,
    isDetailApproveModalOpen,
    setIsDetailApproveModalOpen,
    isDetailRevisiModalOpen,
    setIsDetailRevisiModalOpen,
    detailRevisiNote,
    setDetailRevisiNote,
    isVerifyingDetail,
    handleVerifyDetailAction,
    executeVerifyDetail,
    handleExport,
    handleImportClick,
    processImport,
    fileInputRef,
    filteredLessonPlans,
    isPertemuanModalOpen,
    setIsPertemuanModalOpen,
    selectedPertemuan,
    setSelectedPertemuan,
    selectedPlanForPertemuan,
    setSelectedPlanForPertemuan,
    isSavingPertemuan,
    handleOpenPertemuan,
    handleSavePertemuan,
    activeTahunAjaran,
    searchQuery,
    setSearchQuery,
    kelasFilter,
    setKelasFilter,
    mapelFilter,
    setMapelFilter,
    pertemuanFilter,
    setPertemuanFilter,
    kelasOptions,
    mapelOptions,
    executeKirimVerifikasi,
    isSendingVerification,
    getAlokasiWaktuForPlan,
    getLembagaNamaForPlan,
    getJadwalInfoForPlan,
    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedLessonPlans,
    PAGE_SIZE_OPTIONS,
  } = useLessonPlanList();

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isTemplateConfigOpen, setIsTemplateConfigOpen] = useState(false);

  // Informasi kelas & mapel diekstrak langsung dari judul_rpp ("Nama Mapel - Nama Kelas")
  const extractedMapel = selectedPlanForPertemuan?.judul_rpp?.split(/\s+[-–]\s+/)?.[0] || selectedPlanForPertemuan?.nama_mapel || "Mata Pelajaran";
  const extractedKelas = selectedPlanForPertemuan?.judul_rpp?.split(/\s+[-–]\s+/)?.[1] || "Kelas";
  
  const dynamicLembagaNama = selectedPlanForPertemuan ? getLembagaNamaForPlan(selectedPlanForPertemuan) : "Pondok Pesantren Maskumambang";

  const dynamicAlokasiWaktu = selectedPlanForPertemuan ? getAlokasiWaktuForPlan(selectedPlanForPertemuan) : "";

  // PINDAH HALAMAN: Jika user memilih Edit Pertemuan, tampilkan Halaman Penuh Edit Pertemuan
  if (isPertemuanModalOpen && selectedPertemuan) {
    return (
      <LessonPlanPertemuanEditPage
        pertemuan={selectedPertemuan}
        rppTitle={selectedPlanForPertemuan?.judul_rpp || ""}
        namaLembaga={dynamicLembagaNama}
        namaKelas={extractedKelas}
        namaMapel={extractedMapel}
        semester={activeTahunAjaran?.semester || "Ganjil"}
        alokasiWaktu={dynamicAlokasiWaktu || "07.00 - 07.45, 08.15 - 09.00"}
        onBack={() => {
          setIsPertemuanModalOpen(false);
          setSelectedPertemuan(null);
          setSelectedPlanForPertemuan(null);
        }}
        onSave={handleSavePertemuan}
        isSaving={isSavingPertemuan}
      />
    );
  }

  // PINDAH HALAMAN: Jika user memilih Atur Template RPP, tampilkan Halaman Penuh Pengaturan Template
  // Hanya dapat diakses oleh Direktur dan Super Admin
  if (isTemplateConfigOpen && (role === "Direktur")) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 font-sans">
        <LessonPlanTemplateConfigPage
          onBack={() => setIsTemplateConfigOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500 font-sans">
      <LessonPlanHeader
        onOpenTemplateConfig={
          (role === "Direktur")
            ? () => setIsTemplateConfigOpen(true)
            : undefined
        }
        onOpenResetVerifikasi={
          (role === "Direktur" || role === "Super Admin")
            ? () => setIsResetVerifikasiModalOpen(true)
            : undefined
        }
        canVerify={canVerify}
        onSetujuiSemua={handleOpenSetujuiSemua}
        eligibleApproveCount={eligiblePlansToApprove.length}
        isApprovingAll={isApprovingAll}
      />

      {/* BANNER INFORMASI PANDUAN LESSON PLAN */}
      <Card className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50/90 via-blue-50/50 to-slate-50 shadow-xs overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-800 text-sm">
                    Panduan Penggunaan Lesson Plan (RPP)
                  </h3>
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Sistem Otomatis KBM
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Data Lesson Plan (RPP) tidak dibuat secara manual melainkan diunggah secara otomatis dari <strong>Jadwal Pelajaran</strong> di Jadwal Akademik. Setiap RPP akan berisi <strong>16 Pertemuan Lengkap</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsInfoOpen(!isInfoOpen)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 shrink-0 p-1.5 rounded-lg hover:bg-indigo-100/50 transition-colors"
            >
              <span>{isInfoOpen ? "Sembunyikan" : "Pelajari Selengkapnya"}</span>
              {isInfoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {isInfoOpen && (
            <div className="mt-4 pt-4 border-t border-indigo-100/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700 animate-in fade-in duration-300">
              <div className="bg-white/80 p-3.5 rounded-xl border border-indigo-100 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-indigo-900">
                  <UploadCloud className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>1. Pengunggahan Jadwal</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Tombol "Unggah Jadwal" pada halaman Jadwal Akademik akan mengekstrak seluruh mata pelajaran, pengajar, dan alokasi waktu ke Lesson Plan.
                </p>
              </div>

              <div className="bg-white/80 p-3.5 rounded-xl border border-indigo-100 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-indigo-900">
                  <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>2. 16 Pertemuan Otomatis</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Setiap RPP yang diunggah secara otomatis membuat 16 entri pertemuan lengkap (Pertemuan 1 s.d 16) yang dapat diisi konten materinya.
                </p>
              </div>

              <div className="bg-white/80 p-3.5 rounded-xl border border-indigo-100 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-indigo-900">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>3. Halaman Edit Pertemuan</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Klik tombol <strong>Edit Pertemuan</strong> untuk berpindah ke Halaman Edit khusus berisi metadata (Hari & Alokasi Waktu) dan Editor MDX RPP.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="text-xs text-gray-500 font-medium">
          {filteredLessonPlans.length === lessonPlans.length
            ? `Menampilkan ${paginatedLessonPlans.length} dari ${lessonPlans.length} lesson plan (Halaman ${currentPage} dari ${totalPages})`
            : `Menampilkan ${paginatedLessonPlans.length} dari ${filteredLessonPlans.length} hasil filter (total ${lessonPlans.length} lesson plan)`}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Disetujui", value: lessonPlans.filter((item) => item.status_ringkas === "Disetujui").length, color: "text-green-500" },
          { label: "Menunggu", value: lessonPlans.filter((item) => item.status_ringkas?.startsWith("Menunggu")).length, color: "text-amber-500" },
          { label: "Revisi", value: lessonPlans.filter((item) => item.status_ringkas?.startsWith("Revisi")).length, color: "text-red-500" },
          { label: "Total RPP", value: lessonPlans.length, color: "text-blue-900" },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-sm text-gray-500 mt-1 font-medium">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <LessonPlanFilters
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        kelasFilter={kelasFilter}
        setKelasFilter={setKelasFilter}
        mapelFilter={mapelFilter}
        setMapelFilter={setMapelFilter}
        pertemuanFilter={pertemuanFilter}
        setPertemuanFilter={setPertemuanFilter}
        kelasOptions={kelasOptions}
        mapelOptions={mapelOptions}
        canVerify={canVerify}
        onSetujuiSemua={handleOpenSetujuiSemua}
        eligibleApproveCount={eligiblePlansToApprove.length}
        isApprovingAll={isApprovingAll}
      />

      <LessonPlanList
        isLoading={isLoading}
        filteredLessonPlans={paginatedLessonPlans}
        expandedPlans={expandedPlans}
        onToggleExpand={toggleExpand}
        onExport={handleExport}
        onImport={handleImportClick}
        canVerify={canVerify}
        role={role}
        onVerifyAction={handleVerifyAction}
        onVerifyDetailAction={handleVerifyDetailAction}
        onOpenPertemuan={handleOpenPertemuan}
        onKirimVerifikasi={executeKirimVerifikasi}
        isSendingVerification={isSendingVerification}
        getJadwalInfo={getJadwalInfoForPlan}
        pertemuanFilter={pertemuanFilter}
      />

      {/* PAGINATION BAR */}
      {!isLoading && filteredLessonPlans.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-3 border-t border-slate-100">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium">Tampilkan</span>
            <div className="flex items-center gap-1">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => { setPageSize(size); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all border ${
                    pageSize === size
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <span className="font-medium">per halaman</span>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-medium">
              Halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPages}</strong>
              <span className="text-slate-400 ml-2">({filteredLessonPlans.length} total)</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white"
                title="Halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={`w-7 h-7 rounded-lg font-bold text-xs border transition-all ${
                        currentPage === p
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white"
                title="Halaman berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={processImport}
        accept=".xlsx, .xls"
        className="hidden"
      />

      <LessonPlanDeleteModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        selectedPlan={selectedPlan}
        isPending={isDeleting}
        onDelete={executeDelete}
      />

      <LessonPlanReviewModals
        isApproveOpen={isApproveModalOpen}
        onApproveOpenChange={setIsApproveModalOpen}
        isRevisiOpen={isRevisiModalOpen}
        onRevisiOpenChange={setIsRevisiModalOpen}
        isApproveAllOpen={isApproveAllModalOpen}
        onApproveAllOpenChange={setIsApproveAllModalOpen}
        eligibleCount={eligiblePlansToApprove.length}
        isApprovingAll={isApprovingAll}
        onVerifyAll={executeVerifyAll}
        selectedPlan={selectedPlan}
        revisiNote={revisiNote}
        setRevisiNote={setRevisiNote}
        isPending={isVerifying}
        onVerify={executeVerify}
        // Reset Verifikasi
        isResetVerifikasiOpen={isResetVerifikasiModalOpen}
        onResetVerifikasiOpenChange={setIsResetVerifikasiModalOpen}
        isResettingVerifikasi={isResettingVerifikasi}
        onResetVerifikasi={executeResetVerifikasi}
        // Detail Modals
        isDetailApproveOpen={isDetailApproveModalOpen}
        onDetailApproveOpenChange={setIsDetailApproveModalOpen}
        isDetailRevisiOpen={isDetailRevisiModalOpen}
        onDetailRevisiOpenChange={setIsDetailRevisiModalOpen}
        selectedDetailForVerify={selectedDetailForVerify}
        detailRevisiNote={detailRevisiNote}
        setDetailRevisiNote={setDetailRevisiNote}
        isDetailPending={isVerifyingDetail}
        onVerifyDetail={executeVerifyDetail}
      />
    </div>
  );
}