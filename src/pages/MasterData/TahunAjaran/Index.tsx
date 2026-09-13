import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePermissions } from "../../../hooks/usePermissions";
import { useDuplicateCheck } from "../../../hooks/useDuplicateCheck";
import { toast } from "sonner";
import type { TAHUN_AJARAN_CREATE } from "../../../types/database";

import { useTahunAjaranData, type GlobalTahunAjaranUI } from "./hooks/useTahunAjaranData";
import TahunAjaranHeader from "./components/TahunAjaranHeader";
import TahunAjaranActiveHero from "./components/TahunAjaranActiveHero";
import TahunAjaranHistoryList from "./components/TahunAjaranHistoryList";
import TahunAjaranFormModal from "./components/TahunAjaranFormModal";
import TahunAjaranDeleteModal from "./components/TahunAjaranDeleteModal";
import TahunAjaranReqModal from "./components/TahunAjaranReqModal";

export default function MasterDataTahunAjaran() {
  const location = useLocation();
  const pathTerakhir = location.pathname.split("/").pop() || "Tahun Ajaran";
  const judulOtomatis = pathTerakhir.replace(/-/g, " ").toUpperCase();
  
  const { canCreate, canUpdate, canDelete } = usePermissions('tahun_ajaran');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<GlobalTahunAjaranUI | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tahunToDelete, setTahunToDelete] = useState<GlobalTahunAjaranUI | null>(null);

  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [requirementError, setRequirementError] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState<TAHUN_AJARAN_CREATE & { is_active?: boolean }>({
    lembaga_id: 0,
    nama_tahun: "",
    semester: "Ganjil",
    tanggal_mulai: "",
    tanggal_akhir: "",
    is_active: false
  });

  const {
    dataTahun,
    isLoading,
    dataLembagaList,
    createMutation,
    updateMutation,
    deleteMutation
  } = useTahunAjaranData();

  const activeTahun = dataTahun.find(t => t.isActive) || null;
  const inactiveTahun = dataTahun.filter(t => !t.isActive);

  const handleOpenAddModal = () => {
    const missing: string[] = [];
    if (dataLembagaList.length === 0) {
      missing.push("Data Lembaga masih kosong.");
    }

    if (missing.length > 0) {
      setRequirementError(missing);
      setIsReqModalOpen(true);
      return;
    }

    setSelectedData(null);
    setFormData({
      lembaga_id: 0,
      nama_tahun: "",
      semester: "Ganjil",
      tanggal_mulai: "",
      tanggal_akhir: "",
      is_active: false
    });
    setIsModalOpen(true);
  };

  const handleEdit = (data: GlobalTahunAjaranUI) => {
    setSelectedData(data);
    setFormData({
      lembaga_id: data.raw.lembaga_id,
      nama_tahun: data.raw.nama_tahun,
      semester: data.raw.semester,
      tanggal_mulai: data.raw.tanggal_mulai,
      tanggal_akhir: data.raw.tanggal_akhir,
      is_active: data.raw.is_active
    });
    setIsModalOpen(true);
  };

  const { isDuplicate: isTahunDuplikat } = useDuplicateCheck(
    `${formData.nama_tahun}||${formData.semester}`,
    (val) => {
      const [namaTahun, semester] = val.split("||");
      if (!namaTahun || !semester) return false;
      return dataTahun.some(
        t => t.namaTahun.toLowerCase() === namaTahun.toLowerCase()
          && t.semester === semester
          && t.id !== selectedData?.id
      );
    }
  );

  const { isDuplicate: isRentangTanggalDuplikat } = useDuplicateCheck(
    `${formData.tanggal_mulai}||${formData.tanggal_akhir}`,
    (val) => {
      const [mulai, akhir] = val.split("||");
      if (!mulai || !akhir) return false;
      const start1 = new Date(mulai).getTime();
      const end1 = new Date(akhir).getTime();
      if (start1 > end1) return false;
      
      return dataTahun.some(
        t => {
          if (t.id === selectedData?.id || !t.tanggalMulai || !t.tanggalAkhir) return false;
          const start2 = new Date(t.tanggalMulai).getTime();
          const end2 = new Date(t.tanggalAkhir).getTime();
          return start1 <= end2 && end1 >= start2;
        }
      );
    }
  );

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };

    // Validasi duplikat tambahan (jaga-jaga)
    const isDuplicateTahun = dataTahun.some(
      t => t.namaTahun.toLowerCase() === formData.nama_tahun.toLowerCase()
        && t.semester === formData.semester
        && t.id !== selectedData?.id
    );
    if (isDuplicateTahun) {
      toast.error(`Gagal: Tahun Ajaran ${formData.nama_tahun} (${formData.semester}) sudah ada di sistem.`);
      return;
    }

    if (isRentangTanggalDuplikat) {
      toast.error(`Gagal: Rentang tanggal ini sudah digunakan di tahun ajaran lain.`);
      return;
    }

    if (selectedData) {
      updateMutation.mutate({ relatedIds: selectedData.relatedIds, payload }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  const confirmHapus = (tahun: GlobalTahunAjaranUI) => {
    setTahunToDelete(tahun);
    setIsDeleteModalOpen(true);
  };

  const executeHapus = () => {
    if (tahunToDelete) {
      deleteMutation.mutate(tahunToDelete.relatedIds, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setTahunToDelete(null);
        }
      });
    }
  };

  const handleActivate = (tahun: GlobalTahunAjaranUI) => {
    updateMutation.mutate({
      relatedIds: tahun.relatedIds,
      payload: { is_active: true }
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 relative">
      <TahunAjaranHeader
        judulOtomatis={judulOtomatis}
        dataCount={dataTahun.length}
        canCreate={canCreate}
        onOpenAddModal={handleOpenAddModal}
      />

      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-500 font-medium">Memuat data tahun ajaran...</span>
        </div>
      ) : dataTahun.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white border rounded-xl shadow-sm">
          Tidak ada data tahun ajaran yang ditemukan.
        </div>
      ) : (
        <div className="space-y-6">
          <TahunAjaranActiveHero
            activeTahun={activeTahun}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={handleEdit}
            onDelete={confirmHapus}
          />
          <TahunAjaranHistoryList
            inactiveTahun={inactiveTahun}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={handleEdit}
            onDelete={confirmHapus}
            onActivate={handleActivate}
          />
        </div>
      )}

      <TahunAjaranFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedData={selectedData}
        formData={formData}
        setFormData={setFormData}
        isTahunDuplikat={isTahunDuplikat}
        isRentangTanggalDuplikat={isRentangTanggalDuplikat}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSimpan}
      />

      <TahunAjaranDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        tahunToDelete={tahunToDelete}
        isPending={deleteMutation.isPending}
        onConfirm={executeHapus}
      />

      <TahunAjaranReqModal
        isOpen={isReqModalOpen}
        onClose={() => setIsReqModalOpen(false)}
        requirementError={requirementError}
      />
    </div>
  );
}
