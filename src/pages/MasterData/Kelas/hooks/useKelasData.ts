import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restClient } from "../../../../lib/api/axios";
import { createKelas, updateKelas, deleteKelas } from "../../../../lib/api/services/akademikService";
import { assignSiswasToKelas, removeSiswaFromKelas } from "../../../../lib/api/services/masterService";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

export interface KelasUI {
  id: number;
  nama: string;
  lembaga: string;
  waliKelas: string;
  jumlahSiswa: number;
  tahunAjaran?: string;
  semester?: string;
  raw: any;
}

export function useKelasData(selectedKelasId: number | null, kelasToDeleteId: number | null) {
  const queryClient = useQueryClient();

  const userRole = useAuthStore(state => state.role);
  const userLembagaId = useAuthStore(state => state.lembaga_id);

  const { data: dataKelas = [], isLoading: isKelasLoading } = useQuery({
    queryKey: ['master-data', 'kelas-all', userRole, userLembagaId],
    staleTime: 5 * 60 * 1000, // 5 menit
    queryFn: async () => {
      const isGlobalRole = userRole === 'Super Admin' || userRole === 'Direktur';
      const params: any = {
        select: 'kelas_id,nama_kelas,lembaga_id,tahun_id,wali_kelas_id,lembaga(nama_lembaga),wali_kelas:wali_kelas_id(nama),siswa(siswa_id),tahun_ajaran(nama_tahun,semester)',
        order: 'nama_kelas.asc'
      };

      if (!isGlobalRole && userLembagaId) {
        params.lembaga_id = `eq.${userLembagaId}`;
      } else if (!isGlobalRole && !userLembagaId) {
        return [];
      }

      const response = await restClient.get('/kelas', { params });
      const data = response.data || [];

      return data.map((item: any) => ({
        id: item.kelas_id,
        nama: item.nama_kelas || "—",
        lembaga: item.lembaga?.nama_lembaga || "—",
        waliKelas: item.wali_kelas?.nama || "—",
        jumlahSiswa: Array.isArray(item.siswa) ? item.siswa.length : 0,
        tahunAjaran: item.tahun_ajaran?.nama_tahun || "—",
        semester: item.tahun_ajaran?.semester || "—",
        raw: item
      })) as KelasUI[];
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

  const { data: dataTahunList = [] } = useQuery({
    queryKey: ['master-data', 'tahun-options'],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      const response = await restClient.get('/tahun_ajaran', {
        params: { select: 'tahun_id,nama_tahun,semester,is_active,lembaga_id' }
      });
      return response.data || [];
    }
  });

  const { data: dataWaliList = [] } = useQuery({
    queryKey: ['master-data', 'pegawai-wali'],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      // Step 1: Ambil user_id dari user_role yang memiliki role Wali Kelas
      const roleResponse = await restClient.get('/user_role', {
        params: {
          select: 'user_id,role!inner(nama_role)',
          'role.nama_role': 'ilike.*wali kelas*'
        }
      });
      const userIds = (roleResponse.data || []).map((ur: any) => ur.user_id).filter(Boolean);
      
      if (userIds.length === 0) {
        return [];
      }

      // Step 2: Ambil pegawai yang memiliki user_id tersebut
      const response = await restClient.get('/pegawai', {
        params: {
          select: 'pegawai_id,nama,pegawai_lembaga(lembaga_id)',
          user_id: `in.(${userIds.join(',')})`
        }
      });
      return response.data || [];
    }
  });

  const { data: dataSiswa = [], isLoading: isLoadingSiswa } = useQuery({
    queryKey: ['master-data', 'siswa-kelas', selectedKelasId],
    staleTime: 2 * 60 * 1000, // 2 menit
    queryFn: async () => {
      if (!selectedKelasId) return [];
      const response = await restClient.get('/siswa', {
        params: {
          select: 'siswa_id,nama,nis,jenis_kelamin',
          kelas_id: `eq.${selectedKelasId}`,
          order: 'nama.asc'
        }
      });
      return response.data || [];
    },
    enabled: !!selectedKelasId
  });



  const { data: siswaToDeleteCount = 0, isLoading: isLoadingSiswaToDelete } = useQuery({
    queryKey: ['master-data', 'siswa-count', kelasToDeleteId],
    staleTime: 60 * 1000, // 1 menit
    queryFn: async () => {
      if (!kelasToDeleteId) return 0;
      const response = await restClient.get('/siswa', {
        params: {
          select: 'siswa_id',
          kelas_id: `eq.${kelasToDeleteId}`
        }
      });
      return (response.data || []).length;
    },
    enabled: !!kelasToDeleteId
  });

  const createMutation = useMutation({
    mutationFn: createKelas,
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'kelas-all'] });
    },
    onError: (error: any) => {
      if (error?.response?.status === 409 || error?.message?.includes("duplicate")) {
        toast.error("Gagal: Kelas dengan nama tersebut sudah ada di lembaga dan tahun ajaran ini.");
      } else {
        toast.error("Data kelas gagal disimpan. Periksa kembali isian dan coba lagi.");
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number, payload: any }) => updateKelas(data.id, data.payload),
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'kelas-all'] });
    },
    onError: (error: any) => {
      if (error?.response?.status === 409 || error?.message?.includes("duplicate")) {
        toast.error("Gagal: Kelas dengan nama tersebut sudah ada di lembaga dan tahun ajaran ini.");
      } else {
        toast.error("Perubahan data kelas gagal disimpan. Silakan coba lagi.");
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteKelas,
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'kelas-all'] });
    },
    onError: () => {
      toast.error("Data gagal dihapus. Pastikan data ini tidak sedang digunakan di modul lain.");
    }
  });

  const assignSiswasMutation = useMutation({
    mutationFn: (data: { siswaIds: number[], kelasId: number }) => assignSiswasToKelas(data.siswaIds, data.kelasId),
    onSuccess: () => {
      toast.success("Siswa berhasil ditambahkan ke kelas!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'kelas-all'] });
      queryClient.invalidateQueries({ queryKey: ['master-data', 'siswa-kelas'] });
    },
    onError: () => {
      toast.error("Gagal menambahkan siswa ke kelas. Silakan coba lagi.");
    }
  });

  const removeSiswaMutation = useMutation({
    mutationFn: removeSiswaFromKelas,
    onSuccess: () => {
      toast.success("Siswa berhasil dilepas dari kelas!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'kelas-all'] });
      queryClient.invalidateQueries({ queryKey: ['master-data', 'siswa-kelas'] });
    },
    onError: () => {
      toast.error("Gagal melepas siswa dari kelas. Silakan coba lagi.");
    }
  });

  return {
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
  };
}
