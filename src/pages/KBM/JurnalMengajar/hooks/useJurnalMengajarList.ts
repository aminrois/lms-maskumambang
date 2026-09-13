import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { restClient } from "@/lib/api/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { sanitizePostgrestSearch } from "@/lib/utils";
import { deleteJurnalMengajar } from "@/lib/api/services/kbmService";
import { toast } from "sonner";

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

export function useJurnalMengajarList() {
  const role = useAuthStore((state: any) => state.role);
  const pegawai_id = useAuthStore((state: any) => state.user?.pegawai_id);
  const lembaga_id = useAuthStore((state: any) => state.lembaga_id);
  const isDirector = role === 'Direktur';
  const { canDelete } = usePermissions("jurnal_mengajar");
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // States khusus Direktur untuk filter Lembaga & Kelas
  const [selectedLembagaId, setSelectedLembagaId] = useState<string>("Semua");
  const [selectedKelasId, setSelectedKelasId] = useState<string>("Semua");

  const [tanggalMulai, setTanggalMulai] = useState(() => 
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [tanggalAkhir, setTanggalAkhir] = useState(() => 
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)
  );

  // Fetch daftar Lembaga jika role Direktur
  const { data: lembagaList = [] } = useQuery({
    queryKey: ['master-data', 'lembaga-options-jurnal'],
    staleTime: 10 * 60 * 1000,
    enabled: isDirector,
    queryFn: async () => {
      const response = await restClient.get('/lembaga', {
        params: { select: 'lembaga_id,nama_lembaga,singkatan', order: 'nama_lembaga.asc' }
      });
      return response.data || [];
    }
  });

  // Fetch daftar Kelas jika role Direktur
  const { data: kelasList = [] } = useQuery({
    queryKey: ['master-data', 'kelas-options-jurnal'],
    staleTime: 10 * 60 * 1000,
    enabled: isDirector,
    queryFn: async () => {
      const response = await restClient.get('/kelas', {
        params: { select: 'kelas_id,nama_kelas,lembaga_id', order: 'nama_kelas.asc' }
      });
      return response.data || [];
    }
  });

  // Filter daftar kelas berdasarkan lembaga yang dipilih (untuk dropdown Direktur)
  const filteredKelasList = kelasList.filter((k: any) => {
    if (!selectedLembagaId || selectedLembagaId === "Semua") return true;
    return String(k.lembaga_id) === String(selectedLembagaId);
  });

  // Reset selectedKelasId jika lembaga berubah dan kelas yang dipilih tidak valid lagi
  useEffect(() => {
    if (selectedKelasId !== "Semua" && selectedLembagaId !== "Semua") {
      const exists = filteredKelasList.some((k: any) => String(k.kelas_id) === String(selectedKelasId));
      if (!exists) {
        setSelectedKelasId("Semua");
      }
    }
  }, [selectedLembagaId, filteredKelasList, selectedKelasId]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useRealtimeSync([
    { table: 'jurnal_mengajar', queryKeys: [['kbm', 'jurnals-index']] },
  ]);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedJurnal, setSelectedJurnal] = useState<JurnalUI | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: jurnalQueryResult = { data: [], totalCount: 0 }, isLoading } = useQuery({
    queryKey: ['kbm', 'jurnals-index', role, lembaga_id, pegawai_id, currentPage, itemsPerPage, debouncedSearchQuery, tanggalMulai, tanggalAkhir, selectedLembagaId, selectedKelasId],
    staleTime: 60 * 1000, // 1 menit (auto-invalidated via useRealtimeSync)
    queryFn: async () => {
      const selectQuery = 'jurnal_id,tanggal,pertemuan_ke,status,jadwal_pelajaran!inner(kelas_id, kelas!inner(nama_kelas,lembaga_id), mata_pelajaran!inner(nama_mapel), pegawai!inner(nama, pegawai_id))';
      
      const params: any = {
        select: selectQuery,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        order: 'tanggal.desc'
      };

      if (tanggalMulai) params['tanggal'] = `gte.${tanggalMulai}`;
      if (tanggalAkhir) {
        if (params['tanggal']) {
          params['and'] = `(tanggal.gte.${tanggalMulai},tanggal.lte.${tanggalAkhir})`;
          delete params['tanggal'];
        } else {
          params['tanggal'] = `lte.${tanggalAkhir}`;
        }
      }

      // Filter Lembaga & Kelas:
      if (isDirector) {
        if (selectedLembagaId && selectedLembagaId !== "Semua") {
          params['jadwal_pelajaran.kelas.lembaga_id'] = `eq.${selectedLembagaId}`;
        }
        if (selectedKelasId && selectedKelasId !== "Semua") {
          params['jadwal_pelajaran.kelas_id'] = `eq.${selectedKelasId}`;
        }
      } else {
        if (lembaga_id) {
          params['jadwal_pelajaran.kelas.lembaga_id'] = `eq.${lembaga_id}`;
        }
        if ((role === 'Guru' || role === 'Wali Kelas') && pegawai_id) {
          params['jadwal_pelajaran.pegawai_id'] = `eq.${pegawai_id}`;
        }
      }

      if (debouncedSearchQuery.trim()) {
        const cleanQuery = sanitizePostgrestSearch(debouncedSearchQuery);
        if (cleanQuery) {
          params['jadwal_pelajaran.or'] = `(kelas.nama_kelas.ilike.*${cleanQuery}*,mata_pelajaran.nama_mapel.ilike.*${cleanQuery}*,pegawai.nama.ilike.*${cleanQuery}*)`;
        }
      }

      const response = await restClient.get('/jurnal_mengajar', {
        headers: { 'Prefer': 'count=exact' },
        params
      });

      const totalRange = response.headers['content-range'];
      const totalCount = totalRange ? parseInt(totalRange.split('/')[1]) : 0;
      const data = response.data || [];

      const items = data.map((item: any) => ({
        jurnal_id: item.jurnal_id,
        tanggal: item.tanggal,
        pertemuan_ke: item.pertemuan_ke || 0,
        status: item.status || "Tidak Diketahui",
        kelas: item.jadwal_pelajaran?.kelas?.nama_kelas || "Unknown",
        mapel: item.jadwal_pelajaran?.mata_pelajaran?.nama_mapel || "Unknown",
        guru: item.jadwal_pelajaran?.pegawai?.nama || "Unknown",
        pegawai_id: item.jadwal_pelajaran?.pegawai?.pegawai_id
      })) as JurnalUI[];

      return { data: items, totalCount };
    }
  });

  const totalPages = Math.ceil(jurnalQueryResult.totalCount / itemsPerPage) || 1;
  const paginatedData = jurnalQueryResult.data;

  const confirmDelete = (e: React.MouseEvent, jurnal: JurnalUI) => {
    e.stopPropagation();
    setSelectedJurnal(jurnal);
    setIsDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!selectedJurnal) return;
    setIsDeleting(true);
    try {
      await deleteJurnalMengajar(selectedJurnal.jurnal_id);
      toast.success("Jurnal Mengajar berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ['kbm', 'jurnals-index'] });
      setIsDeleteOpen(false);
      setSelectedJurnal(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Jurnal mengajar gagal dihapus. Silakan coba lagi.");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    role,
    isDirector,
    pegawai_id,
    canDelete,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    tanggalMulai,
    setTanggalMulai,
    tanggalAkhir,
    setTanggalAkhir,
    selectedLembagaId,
    setSelectedLembagaId,
    selectedKelasId,
    setSelectedKelasId,
    lembagaList,
    filteredKelasList,
    isDeleteOpen,
    setIsDeleteOpen,
    selectedJurnal,
    setSelectedJurnal,
    isDeleting,
    dataJurnal: jurnalQueryResult.data,
    totalCount: jurnalQueryResult.totalCount,
    isLoading,
    totalPages,
    paginatedData,
    confirmDelete,
    executeDelete
  };
}
