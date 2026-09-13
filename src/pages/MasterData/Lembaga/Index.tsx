import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePermissions } from "../../../hooks/usePermissions";
import { useDuplicateCheck } from "../../../hooks/useDuplicateCheck";
import { useRealtimeSync } from "../../../hooks/useRealtimeSync";
import { toast } from "sonner";

import { useLembagaData, type LembagaUI } from "./hooks/useLembagaData";
import LembagaHeader from "./components/LembagaHeader";
import LembagaCardList from "./components/LembagaCardList";
import LembagaFormModal from "./components/LembagaFormModal";
import LembagaDeleteModal from "./components/LembagaDeleteModal";

export default function MasterDataLembaga() {
  const location = useLocation();
  const pathTerakhir = location.pathname.split("/").pop() || "Lembaga";
  const judulOtomatis = pathTerakhir.replace(/-/g, " ").toUpperCase();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const { canCreate, canUpdate, canDelete } = usePermissions('lembaga');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLembaga, setSelectedLembaga] = useState<LembagaUI | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [lembagaToDelete, setLembagaToDelete] = useState<LembagaUI | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nama_lembaga: "",
    singkatan: "",
    kepala_sekolah_id: "",
    kurikulum_id: ""
  });

  // Realtime: auto-refresh saat ada perubahan data lembaga dari user lain
  useRealtimeSync([
    { table: 'lembaga', queryKeys: [['master-data', 'lembaga'], ['master-data', 'lembaga-options']] },
  ]);

  const {
    dataLembaga,
    isLembagaLoading,
    dataPegawaiAll,
    createMutation,
    updateMutation,
    deleteMutation
  } = useLembagaData();

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Filter Data
  const filteredData = React.useMemo(() => {
    return dataLembaga.filter((lembaga) => {
      return (
        lembaga.singkatan.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        lembaga.namaLengkap.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    });
  }, [dataLembaga, debouncedSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = React.useMemo(() => {
    return filteredData.slice(
      (safeCurrentPage - 1) * itemsPerPage,
      safeCurrentPage * itemsPerPage
    );
  }, [filteredData, safeCurrentPage, itemsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    setSelectedLembaga(null);
    setFormData({
      nama_lembaga: "",
      singkatan: "",
      kepala_sekolah_id: "",
      kurikulum_id: ""
    });
    setIsModalOpen(true);
  };

  const handleEdit = (lembaga: LembagaUI) => {
    setSelectedLembaga(lembaga);
    setFormData({
      nama_lembaga: lembaga.raw.nama_lembaga || "",
      singkatan: lembaga.raw.singkatan || "",
      kepala_sekolah_id: lembaga.raw.kepala_sekolah_id ? String(lembaga.raw.kepala_sekolah_id) : "",
      kurikulum_id: lembaga.raw.kurikulum_id ? String(lembaga.raw.kurikulum_id) : ""
    });
    setIsModalOpen(true);
  };

  const { isDuplicate: isNamaDuplikat } = useDuplicateCheck(
    formData.nama_lembaga,
    (val) => dataLembaga.some(
      l => l.raw?.nama_lembaga?.toLowerCase() === val.toLowerCase() && l.id !== selectedLembaga?.id
    )
  );

  const { isDuplicate: isSingkatanDuplikat } = useDuplicateCheck(
    formData.singkatan || "",
    (val) => !!val && dataLembaga.some(
      l => l.raw?.singkatan === val && l.id !== selectedLembaga?.id
    )
  );

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();

    const kepsekId = formData.kepala_sekolah_id ? parseInt(formData.kepala_sekolah_id) : null;
    const kurikulumId = formData.kurikulum_id ? parseInt(formData.kurikulum_id) : null;

    const payload: any = {
      nama_lembaga: formData.nama_lembaga,
      singkatan: formData.singkatan || "",
      kepala_sekolah_id: kepsekId,
      kurikulum_id: kurikulumId,
    };

    // Validasi duplikat
    const isDuplicateNama = dataLembaga.some(
      l => l.raw?.nama_lembaga?.toLowerCase() === formData.nama_lembaga.toLowerCase() && l.id !== selectedLembaga?.id
    );
    if (isDuplicateNama) {
      toast.error("Gagal: Nama Lembaga sudah digunakan.");
      return;
    }

    if (formData.singkatan) {
      const isDuplicateSingkatan = dataLembaga.some(
        l => l.raw?.singkatan === formData.singkatan && l.id !== selectedLembaga?.id
      );
      if (isDuplicateSingkatan) {
        toast.error("Gagal: Singkatan sudah digunakan.");
        return;
      }
    }

    if (selectedLembaga) {
      updateMutation.mutate({ id: selectedLembaga.id, payload }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  const confirmHapus = (lembaga: LembagaUI) => {
    setLembagaToDelete(lembaga);
    setIsDeleteModalOpen(true);
  };

  const executeHapus = () => {
    if (lembagaToDelete) {
      deleteMutation.mutate(lembagaToDelete.id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setLembagaToDelete(null);
        }
      });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 relative">
      <LembagaHeader
        judulOtomatis={judulOtomatis}
        totalData={filteredData.length}
        canCreate={canCreate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAddModal={handleOpenAddModal}
      />

      {isLembagaLoading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium">Memuat data lembaga...</p>
        </div>
      ) : (
        <LembagaCardList
          paginatedData={paginatedData}
          canUpdate={canUpdate}
          canDelete={canDelete}
          dataPegawaiAll={dataPegawaiAll}
          onEdit={handleEdit}
          onDelete={confirmHapus}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalData={filteredData.length}
          setCurrentPage={setCurrentPage}
        />
      )}

      <LembagaFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedLembaga={selectedLembaga}
        formData={formData}
        setFormData={setFormData}
        dataPegawaiAll={dataPegawaiAll}
        isNamaDuplikat={isNamaDuplikat}
        isSingkatanDuplikat={isSingkatanDuplikat}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSimpan}
      />

      <LembagaDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        lembagaToDelete={lembagaToDelete}
        isPending={deleteMutation.isPending}
        onConfirm={executeHapus}
      />
    </div>
  );
}
