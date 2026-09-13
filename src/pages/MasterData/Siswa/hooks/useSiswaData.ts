
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { restClient } from "../../../../lib/api/axios";
import { createSiswa, updateSiswa, deleteSiswa } from "../../../../lib/api/services/masterService";
import { toast } from "sonner";
import { useAuthStore } from "../../../../store/useAuthStore";
import { sanitizePostgrestSearch } from "@/lib/utils";

export interface SiswaUI {
  id: number;
  nama: string;
  nis: string;
  nisn: string;
  kelas: string;
  lembaga: string;
  waliMurid: string;
  status: string;
  raw: any;
}

export function useSiswaData(paramsInput?: {
  page: number;
  limit: number;
  searchQuery: string;
  filterLembaga: string;
  filterKelas: string;
  sortOrder: "asc" | "desc";
}) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore(state => state.user);
  const authRole = useAuthStore(state => state.role);
  const authLembagaId = useAuthStore(state => state.lembaga_id);

  const getNamaWaliUtama = (wali: any) => {
    if (!wali || !wali.nama_wali) return "—";
    if (wali.nama_wali === wali.nama_ayah) return wali.nama_wali + " (Ayah)";
    if (wali.nama_wali === wali.nama_ibu) return wali.nama_wali + " (Ibu)";
    return wali.nama_wali + " (Wali)";
  };

  const { data: waliKelasId, isLoading: isLoadingWaliKelas } = useQuery({
    queryKey: ['master-data', 'wali-kelas-id', authUser?.pegawai_id],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      if (authRole !== 'Wali Kelas' || !authUser?.pegawai_id) return null;
      const response = await restClient.get('/kelas', {
        params: { select: 'kelas_id', wali_kelas_id: `eq.${authUser.pegawai_id}` }
      });
      return response.data?.[0]?.kelas_id || null;
    },
    enabled: authRole === 'Wali Kelas' && !!authUser?.pegawai_id
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

  const { data: dataKelasList = [] } = useQuery({
    queryKey: ['master-data', 'kelas-options', authRole, authLembagaId],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      const isGlobalRole = authRole === 'Super Admin' || authRole === 'Direktur';
      const params: any = { select: 'kelas_id,nama_kelas,lembaga_id' };
      if (!isGlobalRole && authLembagaId) {
        params.lembaga_id = `eq.${authLembagaId}`;
      }
      const response = await restClient.get('/kelas', { params });
      return response.data || [];
    }
  });

  // Untuk mencegah unduh 10.000 data siswa hanya untuk mengecek kelas yang ada siswanya, 
  // kita langsung menampilkan semua lembaga dan kelas yang relevan dari master data.
  const activeLembagaList = dataLembagaList;
  const activeKelasList = dataKelasList;

  const { page = 1, limit = 10, searchQuery = "", filterLembaga = "Semua Lembaga", filterKelas = "Semua Kelas", sortOrder = "asc" } = paramsInput || {};

  const associatedLembaga = dataLembagaList.find((l: any) => (l.singkatan || l.nama_lembaga) === filterLembaga);
  const filterLembagaId = associatedLembaga ? associatedLembaga.lembaga_id : null;

  const associatedKelas = dataKelasList.find((k: any) => k.nama_kelas === filterKelas);
  const filterKelasId = associatedKelas ? associatedKelas.kelas_id : null;

  const { data: siswaQueryResult = { data: [], totalCount: 0 }, isLoading: isLoadingSiswa, isFetching: isSiswaFetching } = useQuery({
    queryKey: ['master-data', 'siswa-all', authRole, authLembagaId, waliKelasId, page, limit, searchQuery, filterLembagaId, filterKelasId, sortOrder],
    staleTime: 10 * 1000, // 10 detik agar realtime sync cepat responsif
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (authRole === 'Wali Kelas' && !waliKelasId) {
        return { data: [], totalCount: 0 };
      }

      const isGlobalRole = authRole === 'Super Admin' || authRole === 'Direktur';

      const selectQuery = `*,kelas:kelas_id(nama_kelas,lembaga_id,lembaga(nama_lembaga,singkatan)),wali_murid:wali_murid_id(nama_ayah,status_ayah,nama_ibu,status_ibu,nama_wali)`;
      
      const params: any = {
        select: selectQuery,
        limit,
        offset: (page - 1) * limit,
        order: `nama.${sortOrder}`
      };

      if (authRole === 'Wali Kelas' && waliKelasId) {
        params.kelas_id = `eq.${waliKelasId}`;
      } else if (!isGlobalRole && authLembagaId) {
        params.select = `*,kelas:kelas_id!inner(nama_kelas,lembaga_id,lembaga(nama_lembaga,singkatan)),wali_murid:wali_murid_id(nama_ayah,status_ayah,nama_ibu,status_ibu,nama_wali)`;
        params['kelas.lembaga_id'] = `eq.${authLembagaId}`;
      }

      if (filterKelasId) {
        params.kelas_id = `eq.${filterKelasId}`;
      } else if (filterLembagaId) {
        params.select = `*,kelas:kelas_id!inner(nama_kelas,lembaga_id,lembaga(nama_lembaga,singkatan)),wali_murid:wali_murid_id(nama_ayah,status_ayah,nama_ibu,status_ibu,nama_wali)`;
        params['kelas.lembaga_id'] = `eq.${filterLembagaId}`;
      }

      if (searchQuery.trim()) {
        const cleanQuery = sanitizePostgrestSearch(searchQuery);
        if (cleanQuery) {
          params.or = `(nama.ilike.*${cleanQuery}*,nis.ilike.*${cleanQuery}*,nisn.ilike.*${cleanQuery}*)`;
        }
      }

      try {
        const response = await restClient.get('/siswa', {
          headers: { 'Prefer': 'count=exact' },
          params
        });

        const totalRange = response.headers['content-range'];
        const totalCount = totalRange ? parseInt(totalRange.split('/')[1]) : 0;
        const data = response.data || [];

        const items = data.map((item: any) => ({
          id: item.siswa_id,
          nama: item.nama || "—",
          nis: item.nis || "—",
          nisn: item.nisn || "—",
          kelas: item.kelas?.nama_kelas || "—",
          lembaga: item.kelas?.lembaga?.nama_lembaga || "—",
          waliMurid: getNamaWaliUtama(item.wali_murid),
          status: item.status || "Aktif",
          raw: item
        })) as SiswaUI[];

        return { data: items, totalCount };
      } catch (err: any) {
        if ((err?.response?.data?.code === 'PGRST103' || err?.response?.status === 416) && params.offset > 0) {
          const fallbackParams = { ...params, offset: 0 };
          const response = await restClient.get('/siswa', {
            headers: { 'Prefer': 'count=exact' },
            params: fallbackParams
          });
          const totalRange = response.headers['content-range'];
          const totalCount = totalRange ? parseInt(totalRange.split('/')[1]) : 0;
          const data = response.data || [];
          const items = data.map((item: any) => ({
            id: item.siswa_id,
            nama: item.nama || "—",
            nis: item.nis || "—",
            nisn: item.nisn || "—",
            kelas: item.kelas?.nama_kelas || "—",
            lembaga: item.kelas?.lembaga?.nama_lembaga || "—",
            waliMurid: getNamaWaliUtama(item.wali_murid),
            status: item.status || "Aktif",
            raw: item
          })) as SiswaUI[];
          return { data: items, totalCount };
        }
        throw err;
      }
    },
    enabled: authRole !== 'Wali Kelas' || (authRole === 'Wali Kelas' && !isLoadingWaliKelas)
  });

  const isLoading = isLoadingSiswa || isLoadingWaliKelas;

  // Query for Wali Murid candidates
  const { data: dataWaliList = [] } = useQuery({
    queryKey: ['master-data', 'wali-options'],
    staleTime: 2 * 60 * 1000, // 2 menit
    queryFn: async () => {
      const response = await restClient.get('/wali_murid', {
        params: { select: 'wali_id,nama_ayah,status_ayah,nama_ibu,status_ibu,nama_wali' }
      });
      return response.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: createSiswa,
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'siswa-all'], refetchType: 'all' });
    },
    onError: (error: any) => {
      if (error?.response?.status === 409 || error?.message?.includes("duplicate")) {
        toast.error("Gagal: NIS atau NISN sudah terdaftar di sistem.");
      } else {
        toast.error("Data siswa gagal disimpan. Periksa kembali isian dan coba lagi.");
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number, payload: any }) => updateSiswa(data.id, data.payload),
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'siswa-all'], refetchType: 'all' });
    },
    onError: (error: any) => {
      if (error?.response?.status === 409 || error?.message?.includes("duplicate")) {
        toast.error("Gagal: NIS atau NISN sudah terdaftar di sistem.");
      } else {
        toast.error("Perubahan data siswa gagal disimpan. Silakan coba lagi.");
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (siswaId: number) => {
      try {
        await restClient.delete(`/absensi_pelajaran?siswa_id=eq.${siswaId}`);
        await restClient.delete(`/absensi_harian?siswa_id=eq.${siswaId}`);
      } catch (e) {
        console.error("Gagal membersihkan relasi absensi siswa sebelum dihapus:", e);
      }
      return deleteSiswa(siswaId);
    },
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'siswa-all'], refetchType: 'all' });
      queryClient.refetchQueries({ queryKey: ['master-data', 'siswa-all'] });
    },
    onError: () => {
      toast.error("Data siswa gagal dihapus. Mungkin masih terhubung dengan data lain.");
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: (number | string)[]) => {
      const batchSize = 50;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        try {
          await restClient.delete(`/absensi_pelajaran?siswa_id=in.(${batch.join(',')})`);
          await restClient.delete(`/absensi_harian?siswa_id=in.(${batch.join(',')})`);
        } catch (e) {
          console.error("Gagal membersihkan relasi absensi siswa bulk:", e);
        }
        await restClient.delete(`/siswa?siswa_id=in.(${batch.join(',')})`);
      }
    },
    onSuccess: () => {
      toast.success("Data siswa terpilih berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'siswa-all'], refetchType: 'all' });
      queryClient.refetchQueries({ queryKey: ['master-data', 'siswa-all'] });
    },
    onError: () => {
      toast.error("Gagal menghapus beberapa data siswa. Mungkin masih terikat dengan data lain.");
    }
  });

  return {
    dataSiswa: siswaQueryResult.data,
    totalCount: siswaQueryResult.totalCount,
    isLoading,
    isSiswaFetching,
    dataLembagaList,
    dataKelasList,
    activeLembagaList,
    activeKelasList,
    dataWaliList,
    createMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation
  };
}
