import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { restClient } from "@/lib/api/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { deleteJurnalMengajar } from "@/lib/api/services/kbmService";
import { getJurnalMengajarMonitoring } from "@/lib/api/services/rpcService";
import { toast } from "sonner";

export interface JurnalUI {
  jurnal_id: number | null;
  jadwal_id: number;
  tanggal: string;
  hari?: string;
  pertemuan_ke: number | null;
  status: string;
  is_completed: boolean;
  is_danger: boolean;
  kelas: string;
  kelas_id?: number;
  mapel: string;
  mapel_id?: number;
  guru: string;
  pegawai_id?: number;
  jam_label?: string;
  materi?: string;
  catatan?: string;
  total_hadir?: number;
  total_siswa?: number;
}

export function useJurnalMengajarList() {
  const role = useAuthStore((state: any) => state.role);
  const pegawai_id = useAuthStore((state: any) => state.user?.pegawai_id);
  const lembaga_id = useAuthStore((state: any) => state.lembaga_id);
  const isDirector = role === 'Direktur' || role === 'Super Admin';
  const isWaliKelas = role === 'Wali Kelas';
  const { canDelete } = usePermissions("jurnal_mengajar");
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Status Filter: "Semua" | "Sudah" | "Belum"
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Sudah' | 'Belum'>('Semua');

  // Filter Lembaga & Kelas
  const [selectedLembagaId, setSelectedLembagaId] = useState<string>("Semua");
  const [selectedKelasId, setSelectedKelasId] = useState<string>("Semua");

  // Rentang tanggal default (awal bulan s.d. akhir bulan ini)
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

  // Fetch daftar Kelas (Direktur: semua kelas, Wali Kelas: kelas yang diampu)
  const { data: kelasList = [] } = useQuery({
    queryKey: ['master-data', 'kelas-options-jurnal', isDirector, isWaliKelas, pegawai_id],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const params: Record<string, any> = {
        select: 'kelas_id,nama_kelas,lembaga_id,wali_kelas_id',
        order: 'nama_kelas.asc'
      };
      if (isWaliKelas && pegawai_id) {
        params.wali_kelas_id = `eq.${pegawai_id}`;
      }
      const response = await restClient.get('/kelas', { params });
      return response.data || [];
    }
  });

  // Filter daftar kelas berdasarkan lembaga yang dipilih (untuk dropdown Direktur)
  const filteredKelasList = useMemo(() => {
    return kelasList.filter((k: any) => {
      if (!selectedLembagaId || selectedLembagaId === "Semua") return true;
      return String(k.lembaga_id) === String(selectedLembagaId);
    });
  }, [kelasList, selectedLembagaId]);

  // Reset selectedKelasId jika lembaga berubah
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
    { table: 'jurnal_mengajar', queryKeys: [['kbm', 'jurnal_monitoring']] },
  ]);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedJurnal, setSelectedJurnal] = useState<JurnalUI | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch data Monitoring Jurnal Mengajar Terpadu
  const { data: monitoringResult = { data: [], summary: { totalSesi: 0, totalSudahMengajar: 0, totalBelumMengajar: 0, persentase: 0 } }, isLoading } = useQuery({
    queryKey: ['kbm', 'jurnal_monitoring', role, lembaga_id, pegawai_id, tanggalMulai, tanggalAkhir, selectedLembagaId, selectedKelasId, statusFilter, debouncedSearchQuery],
    staleTime: 30 * 1000,
    queryFn: async () => {
      const payload: any = {
        p_tanggal_mulai: tanggalMulai,
        p_tanggal_akhir: tanggalAkhir,
        p_status_filter: statusFilter,
        p_search: debouncedSearchQuery,
        p_role: role,
        p_pegawai_id: pegawai_id
      };

      if (isDirector) {
        if (selectedLembagaId && selectedLembagaId !== "Semua") {
          payload.p_lembaga_id = Number(selectedLembagaId);
        }
        if (selectedKelasId && selectedKelasId !== "Semua") {
          payload.p_kelas_id = Number(selectedKelasId);
        }
      } else if (isWaliKelas) {
        if (selectedKelasId && selectedKelasId !== "Semua") {
          payload.p_kelas_id = Number(selectedKelasId);
        }
      } else if (lembaga_id) {
        payload.p_lembaga_id = Number(lembaga_id);
      }

      return await getJurnalMengajarMonitoring(payload);
    }
  });

  const isGuruOnly = role === 'Guru' && !isDirector && !isWaliKelas;

  const allItems: JurnalUI[] = useMemo(() => {
    const raw: JurnalUI[] = monitoringResult.data || [];
    if (isGuruOnly || role === 'Guru') {
      return raw.filter((it: JurnalUI) => 
        it.is_completed && 
        !it.is_danger && 
        (!pegawai_id || !it.pegawai_id || Number(it.pegawai_id) === Number(pegawai_id))
      );
    }
    return raw;
  }, [monitoringResult.data, isGuruOnly, role, pegawai_id]);

  const summary = useMemo(() => {
    if (isGuruOnly || role === 'Guru') {
      return {
        totalSesi: allItems.length,
        totalSudahMengajar: allItems.length,
        totalBelumMengajar: 0,
        persentase: 100
      };
    }
    return monitoringResult.summary || { totalSesi: 0, totalSudahMengajar: 0, totalBelumMengajar: 0, persentase: 0 };
  }, [monitoringResult.summary, isGuruOnly, role, allItems.length]);

  const totalPages = Math.ceil(allItems.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return allItems.slice(start, start + itemsPerPage);
  }, [allItems, currentPage, itemsPerPage]);

  const confirmDelete = (e: React.MouseEvent, jurnal: JurnalUI) => {
    e.stopPropagation();
    if (!jurnal.jurnal_id) return;
    setSelectedJurnal(jurnal);
    setIsDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!selectedJurnal || !selectedJurnal.jurnal_id) return;
    setIsDeleting(true);
    try {
      await deleteJurnalMengajar(selectedJurnal.jurnal_id);
      toast.success("Jurnal Mengajar berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ['kbm', 'jurnal_monitoring'] });
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
    isWaliKelas,
    pegawai_id,
    canDelete,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
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
    dataJurnal: allItems,
    summary,
    totalCount: allItems.length,
    isLoading,
    totalPages,
    paginatedData,
    confirmDelete,
    executeDelete
  };
}

