import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePermissions } from "../../../hooks/usePermissions";
import type { KELAS_CREATE } from "../../../types/database";
import { useDuplicateCheck } from "../../../hooks/useDuplicateCheck";
import { useRealtimeSync } from "../../../hooks/useRealtimeSync";

import { useKelasData, type KelasUI } from "./hooks/useKelasData";
import KelasHeader from "./components/KelasHeader";
import KelasCardList from "./components/KelasCardList";
import KelasFormModal from "./components/KelasFormModal";
import KelasDeleteModal from "./components/KelasDeleteModal";
import KelasListSiswaModal from "./components/KelasListSiswaModal";
import KelasAssignSiswaModal from "./components/KelasAssignSiswaModal";
import KelasReqModal from "./components/KelasReqModal";
import { useAuthStore } from "../../../store/useAuthStore";

export default function MasterDataKelas() {
  const location = useLocation();
  const pathTerakhir = location.pathname.split("/").pop() || "Kelas";
  const judulOtomatis = pathTerakhir.replace(/-/g, " ").toUpperCase();

  const [filterLembaga, setFilterLembaga] = useState("Semua");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const { canCreate, canUpdate, canDelete } = usePermissions('kelas');

  // Realtime: auto-refresh saat ada perubahan data kelas dari user lain
  useRealtimeSync([
    { table: 'kelas', queryKeys: [['master-data', 'kelas-all'], ['master-data', 'kelas-options']] },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState<KelasUI | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [kelasToDelete, setKelasToDelete] = useState<KelasUI | null>(null);

  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [requirementError, setRequirementError] = useState<string[]>([]);

  // State untuk List Siswa
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null);
  const [isAssignSiswaModalOpen, setIsAssignSiswaModalOpen] = useState(false);

  const userRole = useAuthStore(state => state.role);
  const canManageSiswa = ["Super Admin", "WaKa Kurikulum", "Admin Lembaga"].includes(userRole || "");

  // Form State
  const [formData, setFormData] = useState<KELAS_CREATE>({
    lembaga_id: 0,
    tahun_id: 0,
    nama_kelas: "",
    wali_kelas_id: 0
  });

  const {
    dataKelas,
    isKelasLoading,
    dataLembagaList,
    dataTahunList,
    dataWaliList,
    dataSiswa,
    isLoadingSiswa,
    siswaToDeleteCount,
    isLoadingSiswaToDelete,
    createMutation,
    updateMutation,
    deleteMutation,
    assignSiswasMutation,
    removeSiswaMutation
  } = useKelasData(selectedKelasId, kelasToDelete?.id || null);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const tabs = React.useMemo(() => {
    return ["Semua", ...dataLembagaList.map((l: any) => l.singkatan || l.nama_lembaga).filter(Boolean)];
  }, [dataLembagaList]);

  const filteredKelas = React.useMemo(() => {
    return dataKelas.filter(kelas => {
      if (filterLembaga !== "Semua") {
        const associatedLembaga = dataLembagaList.find((l: any) => (l.singkatan || l.nama_lembaga) === filterLembaga);
        if (!associatedLembaga || kelas.raw.lembaga_id !== associatedLembaga.lembaga_id) return false;
      }
      if (debouncedSearchQuery.trim()) {
        return kelas.raw.nama_kelas?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      }
      return true;
    });
  }, [dataKelas, filterLembaga, debouncedSearchQuery, dataLembagaList]);

  const totalPages = Math.ceil(filteredKelas.length / itemsPerPage);
  const paginatedKelas = React.useMemo(() => {
    return filteredKelas.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredKelas, currentPage, itemsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterLembaga, debouncedSearchQuery]);

  React.useEffect(() => {
    if (formData.lembaga_id && !selectedKelas && isModalOpen) {
      const activeTahun = dataTahunList.find((t: any) => t.lembaga_id === formData.lembaga_id && t.is_active);
      if (activeTahun && formData.tahun_id !== activeTahun.tahun_id) {
        setFormData(prev => ({ ...prev, tahun_id: activeTahun.tahun_id }));
      }
    }
  }, [formData.lembaga_id, isModalOpen, dataTahunList, selectedKelas]);

  const handleOpenAddModal = () => {
    const missing: string[] = [];
    if (dataLembagaList.length === 0) {
      missing.push("Data Lembaga masih kosong.");
    }
    if (dataTahunList.length === 0) {
      missing.push("Data Tahun Ajaran masih kosong.");
    }

    if (missing.length > 0) {
      setRequirementError(missing);
      setIsReqModalOpen(true);
      return;
    }

    setSelectedKelas(null);
    setFormData({
      lembaga_id: 0,
      tahun_id: 0,
      nama_kelas: "",
      wali_kelas_id: 0
    });
    setIsModalOpen(true);
  };

  const handleEdit = (kelas: KelasUI) => {
    setSelectedKelas(kelas);
    setFormData({
      lembaga_id: kelas.raw.lembaga_id || 0,
      tahun_id: kelas.raw.tahun_id || 0,
      nama_kelas: kelas.raw.nama_kelas || "",
      wali_kelas_id: kelas.raw.wali_kelas_id || 0
    });
    setIsModalOpen(true);
  };

  const { isDuplicate: isNamaDuplikat } = useDuplicateCheck(
    formData.nama_kelas,
    (val) => !!val && dataKelas.some(
      k => k.raw.nama_kelas.toLowerCase() === val.toLowerCase()
        && k.raw.lembaga_id === formData.lembaga_id
        && k.id !== selectedKelas?.id
    )
  );

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();

    // Clean up empty optional fields
    const payload: any = { ...formData };
    if (!payload.wali_kelas_id) delete payload.wali_kelas_id;

    if (selectedKelas) {
      updateMutation.mutate({ id: selectedKelas.id, payload }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  const confirmHapus = (kelas: KelasUI) => {
    setKelasToDelete(kelas);
    setIsDeleteModalOpen(true);
  };

  const executeHapus = () => {
    if (kelasToDelete) {
      deleteMutation.mutate(kelasToDelete.id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setKelasToDelete(null);
        }
      });
    }
  };

  const handleLihatSiswa = (id: number) => {
    setSelectedKelasId(id);
    setIsListModalOpen(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 relative">
      <KelasHeader
        judulOtomatis={judulOtomatis}
        totalKelas={dataKelas.length}
        canCreate={canCreate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterLembaga={filterLembaga}
        setFilterLembaga={setFilterLembaga}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        tabs={tabs}
        onOpenAddModal={handleOpenAddModal}
      />

      {isKelasLoading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-500 font-medium">Memuat data kelas...</span>
        </div>
      ) : filteredKelas.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white border rounded-xl shadow-sm">
          Tidak ada kelas yang ditemukan.
        </div>
      ) : (
        <KelasCardList
          paginatedKelas={paginatedKelas}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onLihatSiswa={handleLihatSiswa}
          onEdit={handleEdit}
          onDelete={confirmHapus}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalData={filteredKelas.length}
          setCurrentPage={setCurrentPage}
        />
      )}

      <KelasFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedKelas={selectedKelas}
        formData={formData}
        setFormData={setFormData}
        dataLembagaList={dataLembagaList}
        dataTahunList={dataTahunList}
        dataWaliList={dataWaliList}
        isNamaDuplikat={isNamaDuplikat}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSimpan}
      />

      <KelasListSiswaModal
        isOpen={isListModalOpen}
        onClose={() => {
          setIsListModalOpen(false);
          setSelectedKelasId(null);
        }}
        isLoadingSiswa={isLoadingSiswa}
        dataSiswa={dataSiswa}
        canManageSiswa={canManageSiswa}
        onOpenAssignModal={() => setIsAssignSiswaModalOpen(true)}
        onRemoveSiswa={(siswaId) => removeSiswaMutation.mutate(siswaId)}
        isRemoving={removeSiswaMutation.isPending}
      />

      <KelasAssignSiswaModal
        isOpen={isAssignSiswaModalOpen}
        onClose={() => setIsAssignSiswaModalOpen(false)}
        kelasId={selectedKelasId}
        lembagaId={dataKelas.find(k => k.id === selectedKelasId)?.raw.lembaga_id || null}
        isPending={assignSiswasMutation.isPending}
        onAssign={(siswaIds) => {
          if (selectedKelasId) {
            assignSiswasMutation.mutate({ siswaIds, kelasId: selectedKelasId }, {
              onSuccess: () => setIsAssignSiswaModalOpen(false)
            });
          }
        }}
      />

      <KelasDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        kelasToDelete={kelasToDelete}
        isLoadingSiswaToDelete={isLoadingSiswaToDelete}
        siswaToDeleteCount={siswaToDeleteCount}
        isPending={deleteMutation.isPending}
        onConfirm={executeHapus}
      />

      <KelasReqModal
        isOpen={isReqModalOpen}
        onClose={() => setIsReqModalOpen(false)}
        requirementError={requirementError}
      />
    </div>
  );
}
