import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restClient } from "../../../../lib/api/axios";
import { createTahunAjaran, updateTahunAjaran, deleteTahunAjaran, deactivateAllTahunAjaran } from "../../../../lib/api/services/akademikService";
import { toast } from "sonner";
import { useFeatureRealtimeSync } from "@/hooks/useRealtimeSync";

export interface GlobalTahunAjaranUI {
  id: string;
  namaTahun: string;
  semester: string;
  tanggalMulai: string;
  tanggalAkhir: string;
  isActive: boolean;
  relatedIds: number[];
  lembagaSingkatans: string[];
  raw: any;
}

export function useTahunAjaranData() {
  const queryClient = useQueryClient();

  useFeatureRealtimeSync("MASTER_DATA_TAHUN_AJARAN");

  const { data: dataTahun = [], isLoading } = useQuery({
    queryKey: ['master-data', 'tahun-ajaran'],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      const response = await restClient.get('/tahun_ajaran', {
        params: {
          select: 'tahun_id,lembaga_id,nama_tahun,semester,tanggal_mulai,tanggal_akhir,is_active,lembaga(nama_lembaga,singkatan)'
        }
      });
      const data = response.data || [];
      const groupedData = new Map<string, GlobalTahunAjaranUI>();
      data.forEach((item: any) => {
        const key = `${item.nama_tahun}-${item.semester}`;
        const singkatan = item.lembaga?.singkatan || 'Unknown';
        if (!groupedData.has(key)) {
          groupedData.set(key, {
            id: key,
            namaTahun: item.nama_tahun,
            semester: item.semester,
            tanggalMulai: item.tanggal_mulai,
            tanggalAkhir: item.tanggal_akhir,
            isActive: item.is_active,
            relatedIds: [item.tahun_id],
            lembagaSingkatans: [singkatan],
            raw: item
          });
        } else {
          groupedData.get(key)!.relatedIds.push(item.tahun_id);
          if (!groupedData.get(key)!.lembagaSingkatans.includes(singkatan)) {
            groupedData.get(key)!.lembagaSingkatans.push(singkatan);
          }
          // Jika salah satu is_active, tandai aktif
          if (item.is_active) {
            groupedData.get(key)!.isActive = true;
          }
        }
      });
      return Array.from(groupedData.values());
    }
  });

  const { data: dataLembagaList = [] } = useQuery({
    queryKey: ['master-data', 'lembaga-options'],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      const response = await restClient.get('/lembaga', {
        params: { select: 'lembaga_id,nama_lembaga,singkatan' }
      });
      return response.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.is_active === true) {
        await deactivateAllTahunAjaran();
      }

      const promises = dataLembagaList.map((lembaga: any) =>
        createTahunAjaran({ ...payload, lembaga_id: lembaga.lembaga_id })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'tahun-ajaran'] });
    },
    onError: (error: any) => {
      const errMsg = error?.response?.data?.message || error?.message || "";
      if (errMsg.includes("tahun_ajaran_is_active_lembaga_id_idx")) {
        toast.error("Gagal: Sudah ada tahun ajaran aktif untuk lembaga ini. Nonaktifkan terlebih dahulu tahun ajaran sebelumnya.");
      } else if (error?.response?.status === 409 || errMsg.includes("tahun_ajaran_lembaga_id_nama_tahun_semester_key") || errMsg.includes("duplicate") || errMsg.includes("unique constraint")) {
        toast.error("Gagal: Nama tahun ajaran ini sudah terdaftar di lembaga tersebut.");
      } else {
        toast.error("Data tahun ajaran gagal disimpan. Periksa kembali isian dan coba lagi.");
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { relatedIds: number[], payload: any }) => {
      if (data.payload.is_active === true) {
        await deactivateAllTahunAjaran();
      }

      const promises = data.relatedIds.map(id => updateTahunAjaran(id, data.payload));
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'tahun-ajaran'] });
    },
    onError: (error: any) => {
      const errMsg = error?.response?.data?.message || error?.message || "";
      if (errMsg.includes("tahun_ajaran_is_active_lembaga_id_idx")) {
        toast.error("Gagal: Sudah ada tahun ajaran aktif untuk lembaga ini. Nonaktifkan terlebih dahulu tahun ajaran sebelumnya.");
      } else if (error?.response?.status === 409 || errMsg.includes("tahun_ajaran_lembaga_id_nama_tahun_semester_key") || errMsg.includes("duplicate") || errMsg.includes("unique constraint")) {
        toast.error("Gagal: Nama tahun ajaran ini sudah terdaftar di lembaga tersebut.");
      } else {
        toast.error("Perubahan tahun ajaran gagal disimpan. Silakan coba lagi.");
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (relatedIds: number[]) => {
      const promises = relatedIds.map(id => deleteTahunAjaran(id));
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'tahun-ajaran'] });
    },
    onError: () => {
      toast.error("Tahun ajaran gagal dihapus. Mungkin masih terhubung dengan data kelas atau jadwal.");
    }
  });

  return {
    dataTahun,
    isLoading,
    dataLembagaList,
    createMutation,
    updateMutation,
    deleteMutation
  };
}
