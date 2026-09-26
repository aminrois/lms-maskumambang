import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import { useDuplicateCheck } from "../../../hooks/useDuplicateCheck";
import { useRealtimeSync } from "../../../hooks/useRealtimeSync";
import { Loader2 } from "lucide-react";
import type { SISWA_CREATE } from "../../../types/database";
import { useAuthStore } from "../../../store/useAuthStore";

import { useSiswaData, type SiswaUI } from "./hooks/useSiswaData";
import { useSiswaExportImport } from "./hooks/useSiswaExportImport";

import SiswaHeader from "./components/SiswaHeader";
import SiswaFilter from "./components/SiswaFilter";
import SiswaTable from "./components/SiswaTable";
import SiswaPagination from "./components/SiswaPagination";
import SiswaFormModal from "./components/SiswaFormModal";
import SiswaDeleteModal from "./components/SiswaDeleteModal";
import SiswaTemplateModal from "./components/SiswaTemplateModal";
import BulkActionBar from "../../../components/custom/BulkActionBar";
import { restClient } from "../../../lib/api/axios";
import { toast } from "sonner";

export default function MasterDataSiswa() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathTerakhir = location.pathname.split("/").pop() || "Siswa";
  const judulOtomatis = pathTerakhir.replace(/-/g, " ").toUpperCase();
  const { canCreate, canUpdate, canDelete } = usePermissions('siswa');

  const [searchQuery, setSearchQuery] = useState("");
  const [filterLembaga, setFilterLembaga] = useState("Semua Lembaga");
  const [filterKelas, setFilterKelas] = useState("Semua Kelas");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Realtime: auto-refresh saat ada perubahan data siswa/kelas/wali dari user lain
  useRealtimeSync([
    { table: 'siswa', queryKeys: [['master-data', 'siswa-all']] },
    { table: 'kelas', queryKeys: [['master-data', 'siswa-all'], ['master-data', 'kelas']] },
    { table: 'wali_murid', queryKeys: [['master-data', 'siswa-all'], ['master-data', 'wali-options']] }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaUI | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [siswaToDelete, setSiswaToDelete] = useState<SiswaUI | null>(null);
  const [isTemplateInfoOpen, setIsTemplateInfoOpen] = useState(false);

  // Bulk Mode States
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);

  // Form State
  const [formData, setFormData] = useState<SISWA_CREATE>({
    nis: "",
    nisn: "",
    nik: "",
    pin: "",
    nama: "",
    panggilan: "",
    jenis_kelamin: "L",
    tempat_lahir: "",
    tanggal_lahir: "",
    agama: "Islam",
    kewarganegaraan: "WNI",
    tahun_masuk: new Date().getFullYear(),
    asal_sekolah: "",
    no_un_sebelumnya: "",
    alamat: "",
    kode_pos: "",
    status: "Aktif",
    keterangan_asrama: "Tidak",
    wali_murid_id: 0,
    kelas_id: 0,
    no_kk: "",
    no_akta_kelahiran: "",
    rt: "",
    rw: "",
    desa_kelurahan: "",
    kecamatan: "",
    kabupaten_kota: "",
    provinsi: "",
    alamat_sekolah_asal: ""
  });

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const {
    dataSiswa,
    totalCount = 0,
    isLoading,
    isSiswaFetching,
    dataLembagaList = [],
    dataKelasList = [],
    activeLembagaList = [],
    activeKelasList = [],
    dataWaliList = [],
    createMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation
  } = useSiswaData({
    page: currentPage,
    limit: itemsPerPage,
    searchQuery: debouncedSearchQuery,
    filterLembaga,
    filterKelas,
    sortOrder
  });

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
        toast.info("Pilihan semua siswa dibatalkan");
        return;
      }
      const res = await restClient.get('/siswa', { params: { select: 'siswa_id' } });
      const ids = (res.data || []).map((item: any) => item.siswa_id).filter(Boolean);
      if (selectedIds.length === ids.length && ids.length > 0) {
        setSelectedIds([]);
        toast.info("Pilihan semua siswa dibatalkan");
        return;
      }
      setSelectedIds(ids);
      toast.success(`${ids.length} data siswa berhasil dipilih`);
    } catch (e) {
      toast.error("Gagal mengambil seluruh ID siswa");
    }
  };

  const handleSelectByLembaga = async (lembagaId: number | string, isSelected: boolean = true) => {
    try {
      const res = await restClient.get('/siswa', {
        params: {
          select: 'siswa_id,kelas!inner(lembaga_id)',
          'kelas.lembaga_id': `eq.${lembagaId}`
        }
      });
      const ids = (res.data || []).map((item: any) => item.siswa_id).filter(Boolean);
      if (isSelected) {
        setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
        toast.success(`${ids.length} siswa dari lembaga terpilih ditambahkan ke pilihan`);
      } else {
        setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
        toast.info(`${ids.length} siswa dari lembaga terpilih dihapus dari pilihan`);
      }
    } catch (e) {
      toast.error("Gagal memproses ID siswa berdasarkan lembaga");
    }
  };

  const handleSelectByKelas = async (kelasId: number | string, isSelected: boolean = true) => {
    try {
      const res = await restClient.get('/siswa', {
        params: {
          select: 'siswa_id',
          kelas_id: `eq.${kelasId}`
        }
      });
      const ids = (res.data || []).map((item: any) => item.siswa_id).filter(Boolean);
      if (isSelected) {
        setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
        toast.success(`${ids.length} siswa dari kelas terpilih ditambahkan ke pilihan`);
      } else {
        setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
        toast.info(`${ids.length} siswa dari kelas terpilih dihapus dari pilihan`);
      }
    } catch (e) {
      toast.error("Gagal memproses ID siswa berdasarkan kelas");
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

  const getNamaWaliUtama = (wali: any) => {
    if (!wali) return "—";
    if (wali.nama_ayah && wali.status_ayah !== "Wafat") return wali.nama_ayah + " (Ayah)";
    if (wali.nama_ibu && wali.status_ibu !== "Wafat") return wali.nama_ibu + " (Ibu)";
    return (wali.nama_wali ? wali.nama_wali + " (Wali)" : "—");
  };

  const authRole = useAuthStore(state => state.role);
  const authLembagaId = useAuthStore(state => state.lembaga_id);

  const { handleExport, handleDownloadTemplate, handleImport } = useSiswaExportImport(dataSiswa, setIsImporting, fileInputRef);

  // Build filter params for export (server-side fetch all filtered data)
  const getExportFilterParams = () => {
    const associatedLembaga = dataLembagaList.find((l: any) => (l.singkatan || l.nama_lembaga) === filterLembaga);
    const filterLembagaId = associatedLembaga ? associatedLembaga.lembaga_id : null;
    const associatedKelas = dataKelasList.find((k: any) => k.nama_kelas === filterKelas);
    const filterKelasId = associatedKelas ? associatedKelas.kelas_id : null;
    return {
      searchQuery: debouncedSearchQuery,
      filterLembagaId,
      filterKelasId,
      sortOrder,
      authRole,
      authLembagaId,
      waliKelasId: null // handled internally by server-side filter
    };
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const paginatedData = dataSiswa;

  // Reset kelas filter when lembaga filter changes
  React.useEffect(() => {
    setFilterKelas("Semua Kelas");
    setCurrentPage(1);
  }, [filterLembaga]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterKelas, sortOrder]);

  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleOpenAddModal = () => {
    setSelectedSiswa(null);
    setFormData({
      nis: "",
      nisn: "",
      nik: "",
      pin: "",
      nama: "",
      panggilan: "",
      jenis_kelamin: "L",
      tempat_lahir: "",
      tanggal_lahir: "",
      agama: "Islam",
      kewarganegaraan: "WNI",
      tahun_masuk: new Date().getFullYear(),
      asal_sekolah: "",
      no_un_sebelumnya: "",
      alamat: "",
      kode_pos: "",
      status: "Aktif",
      keterangan_asrama: "Tidak",
      wali_murid_id: 0,
      kelas_id: 0,
      no_kk: "",
      no_akta_kelahiran: "",
      rt: "",
      rw: "",
      desa_kelurahan: "",
      kecamatan: "",
      kabupaten_kota: "",
      provinsi: "",
      alamat_sekolah_asal: ""
    });
    setIsModalOpen(true);
  };

  const handleEdit = (siswa: SiswaUI) => {
    setSelectedSiswa(siswa);
    setFormData({
      nis: siswa.raw.nis || "",
      nisn: siswa.raw.nisn || "",
      nik: siswa.raw.nik || "",
      pin: siswa.raw.pin || "",
      nama: siswa.raw.nama || "",
      panggilan: siswa.raw.panggilan || "",
      jenis_kelamin: siswa.raw.jenis_kelamin || "L",
      tempat_lahir: siswa.raw.tempat_lahir || "",
      tanggal_lahir: siswa.raw.tanggal_lahir || "",
      agama: siswa.raw.agama || "Islam",
      kewarganegaraan: siswa.raw.kewarganegaraan || "WNI",
      tahun_masuk: siswa.raw.tahun_masuk || new Date().getFullYear(),
      asal_sekolah: siswa.raw.asal_sekolah || "",
      no_un_sebelumnya: siswa.raw.no_un_sebelumnya || "",
      alamat: siswa.raw.alamat || "",
      kode_pos: siswa.raw.kode_pos || "",
      status: siswa.raw.status || "Aktif",
      keterangan_asrama: siswa.raw.keterangan_asrama || "Tidak",
      wali_murid_id: siswa.raw.wali_murid_id || 0,
      kelas_id: siswa.raw.kelas_id || 0,
      no_kk: siswa.raw.no_kk || "",
      no_akta_kelahiran: siswa.raw.no_akta_kelahiran || "",
      rt: siswa.raw.rt || "",
      rw: siswa.raw.rw || "",
      desa_kelurahan: siswa.raw.desa_kelurahan || "",
      kecamatan: siswa.raw.kecamatan || "",
      kabupaten_kota: siswa.raw.kabupaten_kota || "",
      provinsi: siswa.raw.provinsi || "",
      alamat_sekolah_asal: siswa.raw.alamat_sekolah_asal || ""
    });
    setIsModalOpen(true);
  };

  const { isDuplicate: isNisDuplikat } = useDuplicateCheck(
    formData.nis,
    (val) => dataSiswa.some(
      s => s.raw.nis === val && s.id !== selectedSiswa?.id
    )
  );

  const { isDuplicate: isNisnDuplikat } = useDuplicateCheck(
    formData.nisn || "",
    (val) => !!val && dataSiswa.some(
      s => s.raw.nisn === val && s.id !== selectedSiswa?.id
    )
  );

  const { isDuplicate: isNamaDuplikat } = useDuplicateCheck(
    formData.nama,
    (val) => dataSiswa.some(
      s => s.raw.nama?.toLowerCase() === val.toLowerCase() && s.id !== selectedSiswa?.id
    )
  );

  const hasDuplicateError = isNisDuplikat || isNisnDuplikat || isNamaDuplikat;

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();

    // Clean up empty optional fields
    const payload: any = { ...formData };
    if (!payload.nik) delete payload.nik;
    if (!payload.pin) delete payload.pin;
    if (!payload.panggilan) delete payload.panggilan;
    if (!payload.no_un_sebelumnya) delete payload.no_un_sebelumnya;
    if (!payload.alamat) delete payload.alamat;
    if (!payload.kode_pos) delete payload.kode_pos;
    if (!payload.no_kk) delete payload.no_kk;
    if (!payload.no_akta_kelahiran) delete payload.no_akta_kelahiran;
    if (!payload.rt) delete payload.rt;
    if (!payload.rw) delete payload.rw;
    if (!payload.desa_kelurahan) delete payload.desa_kelurahan;
    if (!payload.kecamatan) delete payload.kecamatan;
    if (!payload.kabupaten_kota) delete payload.kabupaten_kota;
    if (!payload.provinsi) delete payload.provinsi;
    if (!payload.alamat_sekolah_asal) delete payload.alamat_sekolah_asal;
    if (!payload.kelas_id) delete payload.kelas_id;
    if (!payload.wali_murid_id) {
      payload.wali_murid_id = null; // Set to null so PostgREST unsets it
    }

    if (selectedSiswa) {
      updateMutation.mutate({ id: selectedSiswa.id, payload }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  const confirmHapus = (siswa: SiswaUI) => {
    setSiswaToDelete(siswa);
    setIsDeleteModalOpen(true);
  };

  const executeHapus = () => {
    if (siswaToDelete) {
      deleteMutation.mutate(siswaToDelete.id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setSiswaToDelete(null);
        }
      });
    }
  };

  const daftarLembaga = ["Semua Lembaga", ...activeLembagaList.map((l: any) => l.singkatan || l.nama_lembaga).filter(Boolean)];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 relative">
      <SiswaHeader
        judulOtomatis={judulOtomatis}
        canCreate={canCreate}
        canDelete={canDelete}
        isBulkMode={isBulkMode}
        onToggleBulkMode={() => {
          setIsBulkMode(prev => !prev);
          if (isBulkMode) setSelectedIds([]);
        }}
        isImporting={isImporting}
        fileInputRef={fileInputRef}
        onOpenAddModal={handleOpenAddModal}
        onOpenTemplateInfo={() => setIsTemplateInfoOpen(true)}
        onImport={handleImport}
        onExport={() => handleExport(getExportFilterParams())}
      />

      <SiswaFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterLembaga={filterLembaga}
        setFilterLembaga={setFilterLembaga}
        filterKelas={filterKelas}
        setFilterKelas={setFilterKelas}
        daftarLembaga={daftarLembaga}
        dataKelasList={activeKelasList}
        dataLembagaList={activeLembagaList}
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
          lembagaList={activeLembagaList.map((l: any) => ({ id: l.lembaga_id || l.id, nama: l.nama_lembaga || l.nama, singkatan: l.singkatan }))}
          onSelectByLembaga={handleSelectByLembaga}
          kelasList={activeKelasList.map((k: any) => {
            const l = dataLembagaList.find((x: any) => (x.lembaga_id || x.id) === (k.lembaga_id || k.raw?.lembaga_id));
            return { id: k.kelas_id || k.id, nama: k.nama_kelas || k.nama, nama_lembaga: l?.singkatan || l?.nama_lembaga || l?.nama };
          })}
          onSelectByKelas={handleSelectByKelas}
          warningMessage={<>Apakah Anda yakin ingin menghapus <strong className="text-rose-600 font-bold">{selectedIds.length} data</strong> siswa yang terpilih? Tindakan ini tidak dapat dibatalkan.</>}
        />
      )}

      <div className="relative">
        {isSiswaFetching && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm text-gray-500 font-medium">Memuat data...</span>
            </div>
          </div>
        )}
        <SiswaTable
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
          onEdit={handleEdit}
          onDelete={confirmHapus}
          onDetail={(siswa) => {
            navigate(`/master-data/siswa/${siswa.id}`);
          }}
        />
      </div>

      <SiswaPagination
        totalData={totalCount}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        setItemsPerPage={setItemsPerPage}
        setCurrentPage={setCurrentPage}
      />

      <SiswaFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedSiswa={selectedSiswa}
        formData={formData}
        setFormData={setFormData}
        dataKelasList={dataKelasList}
        dataWaliList={dataWaliList}
        isNisDuplikat={isNisDuplikat}
        isNisnDuplikat={isNisnDuplikat}
        isNamaDuplikat={isNamaDuplikat}
        isPending={createMutation.isPending || updateMutation.isPending}
        hasDuplicateError={hasDuplicateError}
        onSubmit={handleSimpan}
        getNamaWaliUtama={getNamaWaliUtama}
      />

      <SiswaDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        siswaToDelete={siswaToDelete}
        isPending={deleteMutation.isPending}
        onConfirm={executeHapus}
      />

      <SiswaTemplateModal
        isOpen={isTemplateInfoOpen}
        onClose={() => setIsTemplateInfoOpen(false)}
        onDownload={handleDownloadTemplate}
      />
    </div>
  );
}
