import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

import { createPegawai, updatePegawai } from "../../../lib/api/services/masterService";
import { createUserAuth, getUserById, updateUserAuth } from "../../../lib/api/services/userService";
import type { PEGAWAI_CREATE } from "../../../types/database";
import { usePermissions } from "../../../hooks/usePermissions";
import { useDuplicateCheck } from "../../../hooks/useDuplicateCheck";
import { useAuthStore } from "@/store/useAuthStore";
import { useRealtimeSync } from "../../../hooks/useRealtimeSync";

import AssignRoleModal from "./components/AssignRoleModal";

import { usePegawaiData, type PegawaiUI } from "./hooks/usePegawaiData";
import { usePegawaiExportImport } from "./hooks/usePegawaiExportImport";

import PegawaiHeader from "./components/PegawaiHeader";
import PegawaiTable from "./components/PegawaiTable";
import PegawaiPagination from "./components/PegawaiPagination";
import PegawaiFormModal from "./components/PegawaiFormModal";
import PegawaiDetailModal from "./components/PegawaiDetailModal";
import PegawaiDeleteModal from "./components/PegawaiDeleteModal";
import PegawaiTemplateModal from "./components/PegawaiTemplateModal";
import BulkActionBar from "../../../components/custom/BulkActionBar";
import { restClient } from "../../../lib/api/axios";

export default function PegawaiIndex() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathTerakhir = location.pathname.split("/").pop() || "Pegawai";
  const judulOtomatis = pathTerakhir.replace(/-/g, " ").toUpperCase();
  const userRole = useAuthStore(state => state.role);
  const queryClient = useQueryClient();

  const { canCreate, canUpdate, canDelete } = usePermissions('pegawai');
  const { canRead: canReadRole } = usePermissions('user_role');

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [filterRole, setFilterRole] = useState("Semua Role");
  const [filterLembaga, setFilterLembaga] = useState("Semua Lembaga");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const {
    dataPegawai,
    totalCount = 0,
    isPegawaiLoading,
    isPegawaiFetching,
    roles,
    activeLembagaOptions = [],
    updateMutation,
    deleteMutation,
    bulkDeleteMutation
  } = usePegawaiData({
    page: currentPage,
    limit: itemsPerPage,
    searchQuery: debouncedSearchQuery,
    filterStatus,
    filterRole,
    filterLembaga,
    sortOrder
  });

  // Bulk Mode States
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);

  const handleToggleSelect = (id: number | string) => {
    setSelectedIds(prev => prev.some(sid => sid === id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleToggleSelectAllCurrentPage = () => {
    const currentIds = paginatedData.map(item => item.id);
    const allSelected = currentIds.every(id => selectedIds.some(sid => sid === id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.some(cid => cid === id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleSelectAll = async () => {
    try {
      if (selectedIds.length === totalCount && totalCount > 0) {
        setSelectedIds([]);
        toast.info("Pilihan semua pegawai dibatalkan");
        return;
      }
      const res = await restClient.get('/pegawai', { params: { select: 'pegawai_id' } });
      const ids = (res.data || []).map((item: any) => item.pegawai_id).filter(Boolean);
      if (selectedIds.length === ids.length && ids.length > 0) {
        setSelectedIds([]);
        toast.info("Pilihan semua pegawai dibatalkan");
        return;
      }
      setSelectedIds(ids);
      toast.success(`${ids.length} data pegawai berhasil dipilih`);
    } catch (e) {
      toast.error("Gagal mengambil seluruh ID pegawai");
    }
  };

  const handleSelectByLembaga = async (lembagaId: number | string, isSelected: boolean = true) => {
    try {
      const res = await restClient.get('/pegawai', {
        params: {
          select: 'pegawai_id,pegawai_lembaga!inner(lembaga_id)',
          'pegawai_lembaga.lembaga_id': `eq.${lembagaId}`
        }
      });
      const ids = (res.data || []).map((item: any) => item.pegawai_id).filter(Boolean);
      if (isSelected) {
        setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
        toast.success(`${ids.length} pegawai dari lembaga terpilih ditambahkan ke pilihan`);
      } else {
        setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
        toast.info(`${ids.length} pegawai dari lembaga terpilih dihapus dari pilihan`);
      }
    } catch (e) {
      toast.error("Gagal memproses ID pegawai berdasarkan lembaga");
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

  const {
    isImporting,
    isTemplateInfoOpen,
    setIsTemplateInfoOpen,
    handleExport,
    handleDownloadTemplate,
    handleImport
  } = usePegawaiExportImport();

  const getExportFilterParams = () => {
    const isGlobalRole = userRole === 'Super Admin' || userRole === 'Direktur';
    const { lembaga_id: authLembagaId } = useAuthStore.getState();
    const associatedLembaga = (activeLembagaOptions as any[]).find((l: any) => (l.singkatan || l.nama_lembaga) === filterLembaga);
    const filterLembagaId = associatedLembaga ? associatedLembaga.lembaga_id : null;
    return {
      searchQuery: debouncedSearchQuery,
      filterStatus,
      filterRole,
      filterLembagaId,
      sortOrder,
      isGlobalRole,
      userLembagaId: isGlobalRole ? null : (authLembagaId ?? null)
    };
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isFilterLembagaDropdownOpen, setIsFilterLembagaDropdownOpen] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  
  const [selectedPegawai, setSelectedPegawai] = useState<PegawaiUI | null>(null);
  const [pegawaiToDelete, setPegawaiToDelete] = useState<PegawaiUI | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useRealtimeSync([
    { table: 'pegawai', queryKeys: [['master-data', 'pegawai-all']] },
    { table: 'pegawai_lembaga', queryKeys: [['master-data', 'pegawai-all']] },
    { table: 'user_role', queryKeys: [['user-roles-relation']] },
  ]);

  const userAccountQuery = useQuery({
    queryKey: ['userAccount', selectedPegawai?.raw?.user_id],
    queryFn: () => getUserById(selectedPegawai!.raw.user_id),
    enabled: !!selectedPegawai?.raw?.user_id && isDetailModalOpen,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => updateUserAuth({ user_id: userId, password: "password123" }),
    onSuccess: () => toast.success("Password berhasil dikembalikan ke default (password123)"),
    onError: () => toast.error("Gagal me-reset password. Silakan coba lagi.")
  });

  const createAccountMutation = useMutation({
    mutationFn: async (pegawai: PegawaiUI) => {
      const nig = pegawai.raw?.nig || pegawai.nig;
      if (!nig) throw new Error("NIG pegawai wajib ada untuk membuat akun.");
      const email = `${nig.trim()}@mlms.local`;
      const username = nig.trim();

      let createdUser = null;
      try {
        createdUser = await createUserAuth({ email, password: 'password123', username });
      } catch (err: unknown) {
        const errObj = err as { message?: string; response?: { status?: number; data?: { message?: string } } };
        const errMsg = errObj?.message?.toLowerCase() || errObj?.response?.data?.message?.toLowerCase() || "";
        if (errObj?.response?.status === 409 || errMsg.includes('already exists') || errMsg.includes('duplicate')) {
          throw new Error("Gagal membuat akun: NIG sudah terdaftar di sistem.", { cause: err });
        }
        throw err;
      }

      const userId = createdUser?.user?.id || createdUser?.id || createdUser?.user_id;
      if (!userId) throw new Error("Gagal mendapatkan ID user dari server.");

      await updatePegawai(pegawai.id, { user_id: userId });
      return { userId, pegawaiId: pegawai.id };
    },
    onSuccess: (res) => {
      toast.success("Akun login pegawai berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'pegawai-all'] });
      setSelectedPegawai(prev => prev ? {
        ...prev,
        raw: { ...prev.raw, user_id: res.userId }
      } : null);
    },
    onError: (err: unknown) => {
      const errObj = err as { message?: string };
      toast.error(errObj?.message || "Gagal membuat akun login pegawai.");
    }
  });

  const [formData, setFormData] = useState<PEGAWAI_CREATE & { lembaga_ids: number[] }>({
    nig: "", nip: "", nik: "", nama: "", jenis_kelamin: "L",
    tempat_lahir: "", tanggal_lahir: "", alamat: "", no_hp: "",
    status: "Aktif", jabatan: "Guru", tugas_tambahan: "",
    jumlah_anak_laki: undefined, jumlah_anak_perempuan: undefined,
    nama_ayah: "", nama_ibu: "", golongan_darah: "",
    user_id: "", lembaga_ids: []
  });

  const { isDuplicate: isNigDuplikat } = useDuplicateCheck(
    formData.nig,
    (val) => dataPegawai.some(p => p.raw.nig.toLowerCase() === val.toLowerCase() && p.id !== selectedPegawai?.id)
  );

  const { isDuplicate: isNamaDuplikat } = useDuplicateCheck(
    formData.nama,
    (val) => dataPegawai.some(p => p.raw.nama.toLowerCase() === val.toLowerCase() && p.id !== selectedPegawai?.id)
  );

  const hasDuplicateError = isNigDuplikat || isNamaDuplikat;

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      nig: formData.nig, nip: formData.nip || "", nik: formData.nik || "",
      nama: formData.nama, jenis_kelamin: formData.jenis_kelamin,
      tempat_lahir: formData.tempat_lahir || "",
      tanggal_lahir: formData.tanggal_lahir || null,
      alamat: formData.alamat || "", no_hp: formData.no_hp || "",
      status: formData.status, jabatan: formData.jabatan,
      tugas_tambahan: formData.tugas_tambahan || "",
      jumlah_anak_laki: formData.jumlah_anak_laki !== undefined ? formData.jumlah_anak_laki : null,
      jumlah_anak_perempuan: formData.jumlah_anak_perempuan !== undefined ? formData.jumlah_anak_perempuan : null,
      nama_ayah: formData.nama_ayah || "",
      nama_ibu: formData.nama_ibu || "",
      golongan_darah: formData.golongan_darah || ""
    };

    if (dataPegawai.some(p => p.raw.nig.toLowerCase() === formData.nig.toLowerCase() && p.id !== selectedPegawai?.id)) {
      toast.error("Gagal: NIG sudah terdaftar di sistem.");
      return;
    }

    if (dataPegawai.some(p => p.raw.nama.toLowerCase() === formData.nama.toLowerCase() && p.id !== selectedPegawai?.id)) {
      toast.error("Gagal: Nama Pegawai sudah digunakan.");
      return;
    }

    if (selectedPegawai) {
      updateMutation.mutate({ id: selectedPegawai.id, payload });
      setIsModalOpen(false);
    } else {
      const executeCreation = async () => {
        setIsSaving(true);
        try {
          if (!formData.nig) throw new Error("NIG wajib diisi untuk membuat akun login.");
          let createdUser = null;
          try {
            createdUser = await createUserAuth({ email: `${formData.nig.trim()}@mlms.local`, password: 'password123', username: formData.nig.trim() });
          } catch (err: any) {
            const errMsg = err?.message?.toLowerCase() || err?.response?.data?.message?.toLowerCase() || "";
            if (err?.response?.status === 409 || errMsg.includes('already exists') || errMsg.includes('duplicate')) {
              throw new Error("Gagal membuat akun: NIG sudah terdaftar di sistem.");
            } else throw err;
          }
          if (!createdUser) throw new Error("Gagal membuat akun user.");

          const userId = createdUser?.user?.id || createdUser?.id || createdUser?.user_id;
          if (!userId) throw new Error("Gagal mendapatkan ID user dari respon auth.");

          payload.user_id = userId;
          await createPegawai(payload);
          toast.success("Pegawai dan Akun berhasil dibuat!");
          queryClient.invalidateQueries({ queryKey: ['master-data', 'pegawai-all'] });
          setIsModalOpen(false);
        } catch (error: any) {
          if (error?.response?.status === 409) toast.error("Data duplikat: NIG, NIK, atau NIP sudah terdaftar.");
          else toast.error(error?.message || "Proses gagal. Pastikan semua data sudah terisi dengan benar.");
        } finally {
          setIsSaving(false);
        }
      };
      executeCreation();
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const paginatedData = dataPegawai;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterRole, filterLembaga, sortOrder]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (isPegawaiLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Memuat data pegawai...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 relative">
      <PegawaiHeader
        judulOtomatis={judulOtomatis}
        canCreate={canCreate}
        canDelete={canDelete}
        isBulkMode={isBulkMode}
        onToggleBulkMode={() => {
          setIsBulkMode(prev => !prev);
          if (isBulkMode) setSelectedIds([]);
        }}
        isImporting={isImporting}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        filterLembaga={filterLembaga}
        setFilterLembaga={setFilterLembaga}
        roles={roles}
        lembagaOptions={activeLembagaOptions}
        userRole={userRole}
        onOpenAddModal={() => {
          setSelectedPegawai(null);
          setFormData({ nig: "", nip: "", nik: "", nama: "", jenis_kelamin: "L", tempat_lahir: "", tanggal_lahir: "", alamat: "", no_hp: "", status: "Aktif", jabatan: "Guru", tugas_tambahan: "", jumlah_anak_laki: undefined, jumlah_anak_perempuan: undefined, nama_ayah: "", nama_ibu: "", golongan_darah: "", user_id: "", lembaga_ids: [] });
          setIsModalOpen(true);
        }}
        onTemplateInfo={() => setIsTemplateInfoOpen(true)}
        onImport={(e) => handleImport(e, fileInputRef)}
        onExport={() => handleExport(getExportFilterParams())}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        isRoleDropdownOpen={isRoleDropdownOpen}
        setIsRoleDropdownOpen={setIsRoleDropdownOpen}
        isFilterLembagaDropdownOpen={isFilterLembagaDropdownOpen}
        setIsFilterLembagaDropdownOpen={setIsFilterLembagaDropdownOpen}
        sortOrder={sortOrder}
        onToggleSort={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
      />

      {isBulkMode && (
        <BulkActionBar
          selectedCount={selectedIds.length}
          totalDataCount={totalCount}
          onSelectAll={handleSelectAll}
          onClearSelection={() => { setSelectedIds([]); setIsBulkMode(false); }}
          onDeleteSelected={handleBulkDelete}
          isDeleting={bulkDeleteMutation.isPending}
          lembagaList={activeLembagaOptions.map((l: any) => ({ id: l.lembaga_id || l.id, nama: l.nama_lembaga || l.nama, singkatan: l.singkatan }))}
          onSelectByLembaga={handleSelectByLembaga}
          warningMessage={<>Anda yakin ingin menghapus <strong className="text-rose-600 font-bold">{selectedIds.length} data</strong> pegawai yang terpilih? <span className="font-semibold text-rose-600">Perhatian:</span> Jika akun Anda sendiri (user yang login sekarang) ikut terpilih, Anda akan dikeluarkan (logout) secara otomatis dari sistem.</>}
        />
      )}

      <div className="relative">
        {isPegawaiFetching && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm text-gray-500 font-medium">Memuat data...</span>
            </div>
          </div>
        )}
        <PegawaiTable
          data={paginatedData}
          startIndex={(currentPage - 1) * itemsPerPage}
          canUpdate={canUpdate}
          canDelete={canDelete}
          isBulkMode={isBulkMode}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAllCurrentPage={handleToggleSelectAllCurrentPage}
          onViewDetail={(pegawai) => navigate(`/master-data/pegawai/${pegawai.id}`)}
          onEdit={(pegawai) => {
            setSelectedPegawai(pegawai);
            setFormData({
              nig: pegawai.raw.nig || "",
              nip: pegawai.raw.nip || "",
              nik: pegawai.raw.nik || "",
              nama: pegawai.raw.nama || "",
              jenis_kelamin: pegawai.raw.jenis_kelamin || "L",
              tempat_lahir: pegawai.raw.tempat_lahir || "",
              tanggal_lahir: pegawai.raw.tanggal_lahir || "",
              alamat: pegawai.raw.alamat || "",
              no_hp: pegawai.raw.no_hp || "",
              status: pegawai.raw.status || "Aktif",
              jabatan: pegawai.raw.jabatan || "Guru",
              tugas_tambahan: pegawai.raw.tugas_tambahan || "",
              jumlah_anak_laki: pegawai.raw.jumlah_anak_laki ?? undefined,
              jumlah_anak_perempuan: pegawai.raw.jumlah_anak_perempuan ?? undefined,
              nama_ayah: pegawai.raw.nama_ayah || "",
              nama_ibu: pegawai.raw.nama_ibu || "",
              golongan_darah: pegawai.raw.golongan_darah || "",
              user_id: pegawai.raw.user_id || "",
              lembaga_ids: []
            });
            setIsModalOpen(true);
          }}
          onDelete={(pegawai) => { setPegawaiToDelete(pegawai); setIsDeleteModalOpen(true); }}
        />
      </div>

      <PegawaiPagination
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalPages={totalPages}
        setItemsPerPage={setItemsPerPage}
        setCurrentPage={setCurrentPage}
      />

      <PegawaiFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedPegawai={selectedPegawai}
        formData={formData}
        setFormData={setFormData}
        isNigDuplikat={isNigDuplikat}
        isNamaDuplikat={isNamaDuplikat}
        hasDuplicateError={hasDuplicateError}
        isSaving={isSaving}
        isPending={updateMutation.isPending}
        onSubmit={handleSimpan}
      />

      <PegawaiDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedPegawai={selectedPegawai}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canReadRole={canReadRole}
        userRole={userRole}
        userAccountQuery={userAccountQuery}
        resetPasswordMutation={resetPasswordMutation}
        onEdit={(pegawai) => {
          setIsDetailModalOpen(false);
          setSelectedPegawai(pegawai);
          setFormData({ nig: pegawai.raw.nig || "", nip: pegawai.raw.nip || "", nik: pegawai.raw.nik || "", nama: pegawai.raw.nama || "", jenis_kelamin: pegawai.raw.jenis_kelamin || "L", tempat_lahir: pegawai.raw.tempat_lahir || "", tanggal_lahir: pegawai.raw.tanggal_lahir || "", alamat: pegawai.raw.alamat || "", no_hp: pegawai.raw.no_hp || "", status: pegawai.raw.status || "Aktif", jabatan: pegawai.raw.jabatan || "Guru", tugas_tambahan: pegawai.raw.tugas_tambahan || "", user_id: pegawai.raw.user_id || "", lembaga_ids: [] });
          setIsModalOpen(true);
        }}
        onDelete={(pegawai) => {
          setIsDetailModalOpen(false);
          setPegawaiToDelete(pegawai);
          setIsDeleteModalOpen(true);
        }}
        onResetPassword={() => {
          if (userAccountQuery.data?.user_id) resetPasswordMutation.mutate(userAccountQuery.data.user_id);
        }}
        onAssignRole={() => {
          setIsDetailModalOpen(false);
          setIsRoleModalOpen(true);
        }}
        onCreateAccount={() => {
          if (selectedPegawai) createAccountMutation.mutate(selectedPegawai);
        }}
        isCreatingAccount={createAccountMutation.isPending}
      />

      <PegawaiDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        pegawaiToDelete={pegawaiToDelete}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (pegawaiToDelete) {
            deleteMutation.mutate(pegawaiToDelete);
            setIsDeleteModalOpen(false);
            setPegawaiToDelete(null);
          }
        }}
      />

      <PegawaiTemplateModal
        isOpen={isTemplateInfoOpen}
        onClose={() => setIsTemplateInfoOpen(false)}
        onDownloadTemplate={handleDownloadTemplate}
      />

      <AssignRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        userId={selectedPegawai?.raw?.user_id || null}
        pegawaiId={selectedPegawai?.id || null}
        pegawaiName={selectedPegawai?.nama || ''}
      />
    </div>
  );
}
