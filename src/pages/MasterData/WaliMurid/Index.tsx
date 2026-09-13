import React, { useState, useEffect } from "react";
import { usePermissions } from "../../../hooks/usePermissions";
import { useDuplicateCheck } from "../../../hooks/useDuplicateCheck";
import { useAuthStore } from "../../../store/useAuthStore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { WALI_MURID_CREATE, WALI_MURID } from "../../../types/database";

import { useWaliMuridData } from "./hooks/useWaliMuridData";
import { useWaliMuridExportImport } from "./hooks/useWaliMuridExportImport";
import WaliMuridHeader from "./components/WaliMuridHeader";
import WaliMuridFilter from "./components/WaliMuridFilter";
import WaliMuridTable from "./components/WaliMuridTable";
import WaliMuridPagination from "./components/WaliMuridPagination";
import WaliMuridFormModal from "./components/WaliMuridFormModal";
import WaliMuridDetailModal from "./components/WaliMuridDetailModal";
import WaliMuridDeleteModal from "./components/WaliMuridDeleteModal";
import WaliMuridResetPasswordModal from "./components/WaliMuridResetPasswordModal";
import WaliMuridPilihSiswaModal from "./components/WaliMuridPilihSiswaModal";
import WaliMuridUnlinkSiswaModal from "./components/WaliMuridUnlinkSiswaModal";
import BulkActionBar from "../../../components/custom/BulkActionBar";
import { restClient } from "../../../lib/api/axios";

const initialFormState: WALI_MURID_CREATE = {
  nama_ayah: "",
  nik_ayah: "",
  status_ayah: "Hidup",
  tempat_lahir_ayah: "",
  tanggal_lahir_ayah: "",
  email_ayah: "",
  pin_ayah: "",
  pendidikan_ayah: "",
  pekerjaan_ayah: "",
  penghasilan_ayah: "",
  no_hp_ayah: "",
  nama_ibu: "",
  nik_ibu: "",
  status_ibu: "Hidup",
  tempat_lahir_ibu: "",
  tanggal_lahir_ibu: "",
  email_ibu: "",
  pin_ibu: "",
  pendidikan_ibu: "",
  pekerjaan_ibu: "",
  penghasilan_ibu: "",
  no_hp_ibu: "",
  nama_wali: "",
  nik_wali: "",
  alamat: "",
  status: "Hidup",
  no_hp_wali: "",
};

export default function MasterDataWaliMurid() {
  const { canCreate, canUpdate, canDelete } = usePermissions('wali-murid');
  const userRole = useAuthStore(state => state.role);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"Ayah" | "Ibu" | "Wali">("Ayah");
  const [selectedWali, setSelectedWali] = useState<WALI_MURID | null>(null);
  const [formData, setFormData] = useState<WALI_MURID_CREATE>(initialFormState);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [waliToDelete, setWaliToDelete] = useState<WALI_MURID | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Pilih Siswa States
  const [isPilihSiswaModalOpen, setIsPilihSiswaModalOpen] = useState(false);
  const [searchSiswaQuery, setSearchSiswaQuery] = useState("");
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>("");
  const [isAddingSiswa, setIsAddingSiswa] = useState(false);
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<number[]>([]);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [siswaToUnlink, setSiswaToUnlink] = useState<any>(null);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    if (!searchQuery.trim()) {
      setDebouncedSearchQuery("");
      setCurrentPage(1);
      return;
    }
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Hook Data
  const {
    dataWali,
    totalCount = 0,
    isLoading,
    isWaliFetching,
    dataUnlinkedSiswa,
    isLoadingUnlinkedSiswa,
    dataKelasFilter,
    createMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation,
    tautkanSiswaMutation,
    unlinkSiswaMutation,
    resetPasswordMutation,
    createAccountMutation,
    getUserById
  } = useWaliMuridData(isPilihSiswaModalOpen, {
    page: currentPage,
    limit: itemsPerPage,
    searchQuery: debouncedSearchQuery,
    sortOrder
  });

  const {
    handleExport,
    handleDownloadTemplate,
    handleImport
  } = useWaliMuridExportImport(dataWali, setIsImporting, fileInputRef);

  // Bulk Mode States
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);

  const handleToggleSelect = (id: number | string) => {
    setSelectedIds(prev => prev.some(sid => sid === id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleToggleSelectAllCurrentPage = () => {
    const currentIds: (number | string)[] = paginatedData.map((item: any) => item.id || item.wali_id);
    const allSelected = currentIds.every((id: number | string) => selectedIds.some(sid => sid === id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.some((cid: number | string) => cid === id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleSelectAll = async () => {
    try {
      if (selectedIds.length === totalCount && totalCount > 0) {
        setSelectedIds([]);
        toast.info("Pilihan semua wali murid dibatalkan");
        return;
      }
      const res = await restClient.get('/wali_murid', { params: { select: 'wali_id' } });
      const ids = (res.data || []).map((item: any) => item.wali_id).filter(Boolean);
      if (selectedIds.length === ids.length && ids.length > 0) {
        setSelectedIds([]);
        toast.info("Pilihan semua wali murid dibatalkan");
        return;
      }
      setSelectedIds(ids);
      toast.success(`${ids.length} data wali murid berhasil dipilih`);
    } catch (e) {
      toast.error("Gagal mengambil seluruh ID wali murid");
    }
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        setSelectedIds([]);
        setIsBulkMode(false);
      }
    });
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const paginatedData = dataWali;

  useEffect(() => { setCurrentPage(1); }, [sortOrder]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Reactive Detail Wali
  const activeWali = selectedWali ? dataWali.find((w: any) => w.wali_id === selectedWali.wali_id) || selectedWali : null;

  // Filter Unlinked Siswa
  const filteredUnlinkedSiswa = dataUnlinkedSiswa.filter((s: any) => {
    const matchSearch = (s.nama || "").toLowerCase().includes(searchSiswaQuery.toLowerCase()) ||
      (s.nis || "").toLowerCase().includes(searchSiswaQuery.toLowerCase());
    const matchKelas = selectedKelasFilter ? String(s.kelas_id) === selectedKelasFilter : true;
    return matchSearch && matchKelas;
  });

  // Handlers
  const handleOpenAddModal = () => {
    setSelectedWali(null);
    setFormData(initialFormState);
    setActiveTab("Ayah");
    setIsModalOpen(true);
  };

  const handleEdit = (wali: WALI_MURID) => {
    setSelectedWali(wali);
    setFormData({ ...initialFormState, ...wali });
    setActiveTab("Ayah");
    setIsModalOpen(true);
  };

  const handleOpenPilihSiswa = (wali: WALI_MURID) => {
    setSelectedWali(wali);
    setSelectedSiswaIds([]);
    setSearchSiswaQuery("");
    setSelectedKelasFilter("");
    setIsAddingSiswa(false);
    setIsPilihSiswaModalOpen(true);
  };

  const getEffectiveWali = () => {
    const isAyahHidup = formData.status_ayah === "Hidup";
    if (isAyahHidup) return { nama: formData.nama_ayah, nik: formData.nik_ayah };
    return { nama: formData.nama_wali, nik: formData.nik_wali };
  };

  const effective = getEffectiveWali();

  const { isDuplicate: isNikDuplikat } = useDuplicateCheck(
    effective.nik || "",
    (val) => !!val && dataWali.some((w: any) => w.nik_wali === val && w.wali_id !== selectedWali?.wali_id)
  );

  const hasDuplicateError = isNikDuplikat;

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    
    // Pastikan status tidak pernah null/undefined saat dikirim
    payload.status_ayah = payload.status_ayah || "Hidup";
    payload.status_ibu = payload.status_ibu || "Hidup";

    const isAyahHidup = payload.status_ayah === "Hidup";
    if (isAyahHidup) {
      payload.nama_wali = payload.nama_ayah || "";
      payload.nik_wali = payload.nik_ayah || "";
      payload.no_hp_wali = payload.no_hp_ayah || "";
      payload.status = payload.status_ayah || "Hidup";
    } else {
      if (!payload.nama_wali || !payload.nik_wali || !payload.no_hp_wali) {
        toast.error("Ayah telah wafat. Anda harus mengisi detail Wali Utama pada tab 'Data Wali'.");
        setActiveTab("Wali");
        return;
      }
    }

    if (!payload.tanggal_lahir_ayah) delete payload.tanggal_lahir_ayah;
    if (!payload.tanggal_lahir_ibu) delete payload.tanggal_lahir_ibu;

    if (!payload.email_ayah && payload.nama_ayah) payload.email_ayah = `${(payload.nik_ayah || 'ayah').trim()}@mlms.local`;
    if (!payload.email_ibu && payload.nama_ibu) payload.email_ibu = `${(payload.nik_ibu || 'ibu').trim()}@mlms.local`;

    // Hapus properti relasional yang didapat dari query GET agar tidak dikirim ke PATCH/POST (menghindari error PGRST204)
    delete (payload as any).siswa;

    const isDuplicateNik = payload.nik_wali && dataWali.some((w: any) => w.nik_wali === payload.nik_wali && w.wali_id !== selectedWali?.wali_id);
    if (isDuplicateNik) {
      toast.error("Gagal: NIK Wali Utama sudah terdaftar di sistem.");
      return;
    }

    if (selectedWali) {
      updateMutation.mutate({ id: selectedWali.wali_id, payload }, { onSuccess: () => setIsModalOpen(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const confirmHapus = (wali: WALI_MURID) => {
    setWaliToDelete(wali);
    setIsDeleteModalOpen(true);
  };

  const executeHapus = () => {
    if (waliToDelete) {
      deleteMutation.mutate(waliToDelete.wali_id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setWaliToDelete(null);
        }
      });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 relative">
      <WaliMuridHeader
        dataCount={dataWali.length}
        canCreate={canCreate}
        canDelete={canDelete}
        isBulkMode={isBulkMode}
        onToggleBulkMode={() => {
          setIsBulkMode(prev => !prev);
          if (isBulkMode) setSelectedIds([]);
        }}
        onOpenAddModal={handleOpenAddModal}
        isImporting={isImporting}
        onExport={handleExport}
        onTemplateInfo={handleDownloadTemplate}
        onImport={handleImport}
      />

      <WaliMuridFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOrder={sortOrder}
        onToggleSort={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
        isSearching={isWaliFetching && !!searchQuery}
      />

      {isBulkMode && (
        <BulkActionBar
          selectedCount={selectedIds.length}
          totalDataCount={totalCount}
          onSelectAll={handleSelectAll}
          onClearSelection={() => { setSelectedIds([]); setIsBulkMode(false); }}
          onDeleteSelected={handleBulkDelete}
          isDeleting={bulkDeleteMutation.isPending}
          warningMessage={<>Anda yakin ingin menghapus <strong className="text-rose-600 font-bold">{selectedIds.length} data</strong> wali murid yang terpilih? <span className="font-semibold text-rose-600">Perhatian:</span> Data wali murid beserta akun login mereka akan dihapus secara permanen dan tidak dapat dibatalkan.</>}
        />
      )}

      <div className="relative">
        {isWaliFetching && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm text-gray-500 font-medium">Memuat data...</span>
            </div>
          </div>
        )}
        <WaliMuridTable
          isLoading={isLoading}
          paginatedData={paginatedData}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          canUpdate={canUpdate}
          canDelete={canDelete}
          isBulkMode={isBulkMode}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAllCurrentPage={handleToggleSelectAllCurrentPage}
          onOpenPilihSiswa={handleOpenPilihSiswa}
          onViewDetail={(wali) => { setSelectedWali(wali); setIsDetailModalOpen(true); }}
          onEdit={handleEdit}
          onDelete={confirmHapus}
        />
      </div>

      <WaliMuridPagination
        totalData={totalCount}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        setItemsPerPage={setItemsPerPage}
        setCurrentPage={setCurrentPage}
      />

      <WaliMuridFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedWali={selectedWali}
        formData={formData}
        setFormData={setFormData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isNikDuplikat={isNikDuplikat}
        hasDuplicateError={hasDuplicateError}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSimpan}
      />

      <WaliMuridDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        activeWali={activeWali}
        canUpdate={canUpdate}
        canDelete={canDelete}
        userRole={userRole}
        getUserById={getUserById}
        onEdit={handleEdit}
        onDelete={confirmHapus}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        onCreateAccount={() => {
          if (activeWali) createAccountMutation.mutate(activeWali);
        }}
        isCreatingAccount={createAccountMutation.isPending}
      />

      <WaliMuridDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        waliToDelete={waliToDelete}
        isPending={deleteMutation.isPending}
        onConfirm={executeHapus}
      />

      <WaliMuridResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        userId={activeWali?.user_id}
        isPending={resetPasswordMutation.isPending}
        onConfirm={(userId) => {
          resetPasswordMutation.mutate(userId, { onSuccess: () => setIsResetModalOpen(false) });
        }}
      />

      <WaliMuridPilihSiswaModal
        isOpen={isPilihSiswaModalOpen}
        onClose={() => setIsPilihSiswaModalOpen(false)}
        activeWali={activeWali}
        isAddingSiswa={isAddingSiswa}
        setIsAddingSiswa={setIsAddingSiswa}
        searchSiswaQuery={searchSiswaQuery}
        setSearchSiswaQuery={setSearchSiswaQuery}
        selectedKelasFilter={selectedKelasFilter}
        setSelectedKelasFilter={setSelectedKelasFilter}
        dataKelasFilter={dataKelasFilter}
        isLoadingUnlinkedSiswa={isLoadingUnlinkedSiswa}
        filteredUnlinkedSiswa={filteredUnlinkedSiswa}
        selectedSiswaIds={selectedSiswaIds}
        setSelectedSiswaIds={setSelectedSiswaIds}
        tautkanPending={tautkanSiswaMutation.isPending}
        onTautkan={() => {
          if (activeWali) {
            tautkanSiswaMutation.mutate({ waliId: activeWali.wali_id, siswaIds: selectedSiswaIds }, {
              onSuccess: () => {
                setIsAddingSiswa(false);
                setSelectedSiswaIds([]);
              }
            });
          }
        }}
        onOpenUnlink={(siswa) => { setSiswaToUnlink(siswa); setIsUnlinkModalOpen(true); }}
      />

      <WaliMuridUnlinkSiswaModal
        isOpen={isUnlinkModalOpen}
        onClose={() => setIsUnlinkModalOpen(false)}
        siswaToUnlink={siswaToUnlink}
        isPending={unlinkSiswaMutation.isPending}
        onConfirm={() => {
          if (siswaToUnlink) {
            unlinkSiswaMutation.mutate(siswaToUnlink.siswa_id, {
              onSuccess: () => setIsUnlinkModalOpen(false)
            });
          }
        }}
      />
    </div>
  );
}