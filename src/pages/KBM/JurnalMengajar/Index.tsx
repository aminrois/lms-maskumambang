import { useJurnalMengajarList } from "./hooks/useJurnalMengajarList";
import { JurnalHeader } from "./components/list/JurnalHeader";
import { JurnalSearch } from "./components/list/JurnalSearch";
import { JurnalList } from "./components/list/JurnalList";
import { JurnalDeleteModal } from "./components/list/JurnalDeleteModal";
import { useNavigate } from "react-router-dom";

export interface JurnalUI {
  jurnal_id: number;
  tanggal: string;
  pertemuan_ke: number;
  status: string;
  kelas: string;
  mapel: string;
  guru: string;
  pegawai_id: number;
}

export default function KbmJurnalMengajar() {
  const navigate = useNavigate();
  const {
    canDelete,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
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
    confirmDelete,
    executeDelete
  } = useJurnalMengajarList();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 relative">
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

      <JurnalList
        isLoading={isLoading}
        filteredData={paginatedData}
        paginatedData={paginatedData}
        canDelete={canDelete}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        itemsPerPage={6}
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
