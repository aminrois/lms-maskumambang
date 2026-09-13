import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { restClient } from "@/lib/api/axios";
import { getMataPelajarans, deleteMataPelajaran } from "@/lib/api/services/akademikService";
import { getLessonPlans } from "@/lib/api/services/kbmService";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useFeatureRealtimeSync } from "@/hooks/useRealtimeSync";

export interface MataPelajaranResponse {
  mapel_id: number;
  lembaga_id: number;
  nama_mapel: string;
  lembaga?: {
    nama_lembaga: string;
    singkatan?: string;
  };
  kelas_mapel?: Array<{
    kelas?: { kelas_id: number; nama_kelas: string };
  }>;
}

export const useMataPelajaran = () => {
  const userLembagaId = useAuthStore(state => state.lembaga_id);
  const userRole = useAuthStore(state => state.role);

  useFeatureRealtimeSync("AKADEMIK_MAPEL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mapelToDelete, setMapelToDelete] = useState<MataPelajaranResponse | null>(null);

  const { data: lembagaList = [] } = useQuery({
    queryKey: ['master-data', 'lembaga-options'],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      const response = await restClient.get('/lembaga', {
        params: { select: 'lembaga_id,nama_lembaga,singkatan' }
      });
      return response.data || [];
    }
  });

  const { data: lessonPlans = [] } = useQuery({
    queryKey: ['kbm', 'lesson-plans-validity'],
    staleTime: 60 * 1000, // 1 menit
    queryFn: () => getLessonPlans({ select: "lesson_plan_id,status_verifikasi_kepsek,status_verifikasi_direktur" }),
  });

  const { data: mapelData = [], refetch: fetchMapel, isLoading } = useQuery({
    queryKey: ['akademik', 'mata-pelajaran', userLembagaId, userRole],
    staleTime: 5 * 60 * 1000, // 5 menit
    queryFn: async () => {
      const params: Record<string, any> = {
        select: "mapel_id,lembaga_id,nama_mapel,lembaga(nama_lembaga,singkatan),kelas_mapel(kelas(kelas_id,nama_kelas))",
        order: "nama_mapel.asc",
      };
      if (userLembagaId && userRole !== 'Super Admin') {
        params.lembaga_id = `eq.${userLembagaId}`;
      }
      const rows = await getMataPelajarans(params);
      return rows as unknown as MataPelajaranResponse[];
    }
  });

  const validMapelIds = useMemo(() => {
    const ids = new Set<number>();
    (lessonPlans as any[]).forEach((lp) => {
      if (lp.status_verifikasi_kepsek === 'Disetujui' && lp.status_verifikasi_direktur === 'Disetujui') {
        ids.add(lp.mapel_id);
      }
    });
    return ids;
  }, [lessonPlans]);

  const filterLembaga = useMemo(() => {
    if (userLembagaId && userRole !== 'Super Admin') {
      return [];
    }
    return ["Semua", ...lembagaList.map((l: any) => l.singkatan || l.nama_lembaga)];
  }, [lembagaList, userLembagaId, userRole]);

  const [activeFilter, setActiveFilter] = useState("Semua");

  const handleDelete = async (id: number) => {
    try {
      await deleteMataPelajaran(id);
      toast.success("Mata pelajaran berhasil dihapus");
      fetchMapel();
    } catch (error) {
      console.error("Gagal menghapus mata pelajaran:", error);
      toast.error("Mata pelajaran gagal dihapus. Mungkin masih digunakan di jadwal pelajaran.");
    }
  };

  const filteredData = useMemo(() => {
    return mapelData.filter((mapel) => {
      return activeFilter === "Semua" || mapel.lembaga?.singkatan === activeFilter;
    });
  }, [mapelData, activeFilter]);

  return {
    userLembagaId,
    userRole,
    lembagaList,
    validMapelIds,
    filterLembaga,
    activeFilter,
    setActiveFilter,
    dialogOpen,
    setDialogOpen,
    editId,
    setEditId,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    mapelToDelete,
    setMapelToDelete,
    fetchMapel,
    handleDelete,
    filteredData,
    isLoading,
  };
};
