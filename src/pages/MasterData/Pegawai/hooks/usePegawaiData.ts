import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { restClient } from "../../../../lib/api/axios";
import { updatePegawai, deletePegawai } from "../../../../lib/api/services/masterService";
import { deleteUserAuth, getRoles } from "../../../../lib/api/services/userService";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { sanitizePostgrestSearch } from "@/lib/utils";

export interface PegawaiUI {
  id: number;
  nama: string;
  nig: string;
  nip: string;
  jabatan: string;
  jenisKelamin: string;
  status: string;
  lembagaList: string;
  raw: any;
}

export function usePegawaiData(paramsInput?: {
  page: number;
  limit: number;
  searchQuery: string;
  filterStatus: string;
  filterRole: string;
  filterLembaga: string;
  sortOrder: "asc" | "desc";
}) {
  const queryClient = useQueryClient();
  const userRole = useAuthStore(state => state.role);
  const userLembagaId = useAuthStore(state => state.lembaga_id);

  // 1. Fetch Lembaga Options (for form and filter)
  const { data: lembagaOptions = [], isLoading: isLembagaLoading } = useQuery({
    queryKey: ['master-data', 'lembaga-options'],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      const response = await restClient.get('/lembaga', {
        params: { select: 'lembaga_id,nama_lembaga,singkatan' }
      });
      return response.data || [];
    }
  });

  const { data: activeLembagaIds = new Set<number>() } = useQuery({
    queryKey: ['master-data', 'pegawai-all', 'active-lembaga', userRole, userLembagaId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await restClient.get('/pegawai_lembaga', {
        params: { select: 'lembaga_id' }
      });
      const ids = (response.data || []).map((item: any) => item.lembaga_id).filter(Boolean);
      return new Set<number>(ids);
    }
  });

  const activeLembagaOptions = useMemo(() => {
    return lembagaOptions.filter((l: any) => activeLembagaIds.has(l.lembaga_id || l.id));
  }, [lembagaOptions, activeLembagaIds]);

  const { page = 1, limit = 10, searchQuery = "", filterStatus = "Semua Status", filterRole = "Semua Role", filterLembaga = "Semua Lembaga", sortOrder = "asc" } = paramsInput || {};

  const associatedLembaga = lembagaOptions.find((l: any) => (l.singkatan || l.nama_lembaga) === filterLembaga);
  const filterLembagaId = associatedLembaga ? associatedLembaga.lembaga_id : null;

  // 2. Fetch All Pegawai
  const { data: pegawaiQueryResult = { data: [], totalCount: 0 }, isLoading: isPegawaiLoading, isFetching: isPegawaiFetching } = useQuery({
    queryKey: ['master-data', 'pegawai-all', userRole, userLembagaId, page, limit, searchQuery, filterStatus, filterRole, filterLembagaId, sortOrder],
    staleTime: 30000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const isGlobalRole = userRole === 'Super Admin' || userRole === 'Direktur';

      let selectQuery = '*, pegawai_lembaga(lembaga(singkatan))';
      const params: any = {
        limit,
        offset: (page - 1) * limit,
        order: `nama.${sortOrder}`
      };

      if (!isGlobalRole && userLembagaId) {
        selectQuery = '*, pegawai_lembaga!inner(lembaga_id, lembaga(singkatan))';
        params['pegawai_lembaga.lembaga_id'] = `eq.${userLembagaId}`;
      } else if (filterLembagaId) {
        selectQuery = '*, pegawai_lembaga!inner(lembaga_id, lembaga(singkatan))';
        params['pegawai_lembaga.lembaga_id'] = `eq.${filterLembagaId}`;
      }

      params.select = selectQuery;

      if (filterRole !== "Semua Role") {
        const roleResponse = await restClient.get('/user_role', {
          params: {
            select: 'user_id,role!inner(nama_role)',
            'role.nama_role': `eq.${filterRole}`
          }
        });
        const userIds = (roleResponse.data || []).map((ur: any) => ur.user_id).filter(Boolean);
        if (userIds.length === 0) {
          return { data: [], totalCount: 0 };
        }
        params.user_id = `in.(${userIds.join(',')})`;
      }

      if (filterStatus !== "Semua Status") {
        params.status = `eq.${filterStatus}`;
      }

      if (searchQuery.trim()) {
        const cleanQuery = sanitizePostgrestSearch(searchQuery);
        if (cleanQuery) {
          params.or = `(nama.ilike.*${cleanQuery}*,nig.ilike.*${cleanQuery}*,nip.ilike.*${cleanQuery}*)`;
        }
      }

      try {
        const response = await restClient.get('/pegawai', {
          headers: { 'Prefer': 'count=exact' },
          params
        });

        const totalRange = response.headers['content-range'];
        const totalCount = totalRange ? parseInt(totalRange.split('/')[1]) : 0;
        const data = response.data || [];

        const items = data.map((item: any) => ({
          id: item.pegawai_id,
          nama: item.nama || "—",
          nig: item.nig || "—",
          nip: item.nip || "—",
          jabatan: item.jabatan || "—",
          jenisKelamin: item.jenis_kelamin === "L" ? "Laki-laki" : (item.jenis_kelamin === "P" ? "Perempuan" : "—"),
          status: item.status || "Aktif",
          lembagaList: item.pegawai_lembaga && item.pegawai_lembaga.length > 0 
            ? item.pegawai_lembaga.map((pl: any) => pl.lembaga?.singkatan).filter(Boolean).join(", ")
            : "Global",
          raw: item
        })) as PegawaiUI[];

        return { data: items, totalCount };
      } catch (err: any) {
        if ((err?.response?.data?.code === 'PGRST103' || err?.response?.status === 416) && params.offset > 0) {
          const fallbackParams = { ...params, offset: 0 };
          const response = await restClient.get('/pegawai', {
            headers: { 'Prefer': 'count=exact' },
            params: fallbackParams
          });
          const totalRange = response.headers['content-range'];
          const totalCount = totalRange ? parseInt(totalRange.split('/')[1]) : 0;
          const data = response.data || [];
          const items = data.map((item: any) => ({
            id: item.pegawai_id,
            nama: item.nama || "—",
            nig: item.nig || "—",
            nip: item.nip || "—",
            jabatan: item.jabatan || "—",
            jenisKelamin: item.jenis_kelamin === "L" ? "Laki-laki" : (item.jenis_kelamin === "P" ? "Perempuan" : "—"),
            status: item.status || "Aktif",
            lembagaList: item.pegawai_lembaga && item.pegawai_lembaga.length > 0 
              ? item.pegawai_lembaga.map((pl: any) => pl.lembaga?.singkatan).filter(Boolean).join(", ")
              : "Global",
            raw: item
          })) as PegawaiUI[];
          return { data: items, totalCount };
        }
        throw err;
      }
    }
  });

  // 3. Fetch User Roles Relation (for filter)
  const { data: allUserRoles = [] } = useQuery({
    queryKey: ['user-roles-relation'],
    queryFn: async () => {
      const response = await restClient.get('/user_role?select=*,role(nama_role)');
      return response.data || [];
    }
  });

  // 4. Fetch Roles List (for form)
  const { data: roles = [] } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => getRoles()
  });

  // 5. Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number, payload: any }) => updatePegawai(data.id, data.payload),
    onSuccess: () => {
      toast.success("Data pegawai berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'pegawai-all'] });
    },
    onError: () => {
      toast.error("Perubahan data pegawai gagal disimpan. Silakan coba lagi.");
    }
  });

  // 6. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (pegawai: PegawaiUI) => {
      if (pegawai.raw.user_id) {
        try {
          await deleteUserAuth(pegawai.raw.user_id);
        } catch (err: any) {
          console.error("Gagal menghapus user auth terkait:", err);
          throw new Error("Gagal menghapus akun sistem pegawai (Auth). Proses dibatalkan.");
        }
      }
      try {
        await restClient.patch(`/kelas?wali_kelas_id=eq.${pegawai.id}`, { wali_kelas_id: null });
        await restClient.patch(`/lembaga?kepsek_id=eq.${pegawai.id}`, { kepsek_id: null });
        await restClient.patch(`/lembaga?waka_id=eq.${pegawai.id}`, { waka_id: null });
        await restClient.delete(`/pegawai_lembaga?pegawai_id=eq.${pegawai.id}`);
        if (pegawai.raw.user_id) {
          await restClient.delete(`/user_role?user_id=eq.${pegawai.raw.user_id}`);
        }
      } catch (e) {
        console.error("Gagal membersihkan relasi pegawai sebelum dihapus:", e);
      }
      try {
        await deletePegawai(pegawai.id);
      } catch (err: any) {
        console.error("Gagal menghapus data pegawai:", err);
        if (pegawai.raw.user_id) {
          throw new Error("Peringatan: Akun login berhasil dihapus, namun data profil gagal dihapus karena relasi data.");
        } else {
          throw new Error("Data pegawai gagal dihapus karena masih terhubung dengan entitas lain.");
        }
      }
    },
    onSuccess: () => {
      toast.success("Data pegawai berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'pegawai-all'], refetchType: 'all' });
      queryClient.refetchQueries({ queryKey: ['master-data', 'pegawai-all'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Data pegawai gagal dihapus. Mungkin masih terhubung dengan data lain.");
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: (number | string)[]) => {
      const batchSize = 50;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        try {
          const res = await restClient.get('/pegawai', {
            params: { select: 'user_id', pegawai_id: `in.(${batch.join(',')})` }
          });
          const userIds = (res.data || []).map((p: any) => p.user_id).filter(Boolean);
          if (userIds.length > 0) {
            for (const uid of userIds) {
              try { await deleteUserAuth(uid); } catch (e) { console.error("Gagal hapus auth bulk:", e); }
            }
            await restClient.delete(`/user_role?user_id=in.(${userIds.join(',')})`);
          }
          await restClient.patch(`/kelas?wali_kelas_id=in.(${batch.join(',')})`, { wali_kelas_id: null });
          await restClient.patch(`/lembaga?kepsek_id=in.(${batch.join(',')})`, { kepsek_id: null });
          await restClient.patch(`/lembaga?waka_id=in.(${batch.join(',')})`, { waka_id: null });
          await restClient.delete(`/pegawai_lembaga?pegawai_id=in.(${batch.join(',')})`);
        } catch (e) {
          console.error("Gagal membersihkan relasi pegawai bulk:", e);
        }
        await restClient.delete(`/pegawai?pegawai_id=in.(${batch.join(',')})`);
      }
    },
    onSuccess: () => {
      toast.success("Data pegawai terpilih berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'pegawai-all'], refetchType: 'all' });
      queryClient.refetchQueries({ queryKey: ['master-data', 'pegawai-all'] });
    },
    onError: () => {
      toast.error("Gagal menghapus beberapa data pegawai. Mungkin masih terhubung dengan data lain.");
    }
  });

  return {
    dataPegawai: pegawaiQueryResult.data,
    totalCount: pegawaiQueryResult.totalCount,
    isPegawaiLoading,
    isPegawaiFetching,
    allUserRoles,
    roles,
    lembagaOptions,
    activeLembagaOptions,
    isLembagaLoading,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation
  };
}
