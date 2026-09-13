import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { restClient } from "../../../../lib/api/axios";
import { useAuthStore } from "../../../../store/useAuthStore";
import { toast } from "sonner";
import { sanitizePostgrestSearch } from "@/lib/utils";
import { useFeatureRealtimeSync } from "@/hooks/useRealtimeSync";
import {
  createWaliMurid,
  updateWaliMurid,
  deleteWaliMurid,
  updateSiswa
} from "../../../../lib/api/services/masterService";
import { getUserById, updateUserAuth, createUserAuth, deleteUserAuth, getRoles, createUserRole } from "../../../../lib/api/services/userService";

export function useWaliMuridData(isPilihSiswaModalOpen: boolean, paramsInput?: {
  page: number;
  limit: number;
  searchQuery: string;
  filterKelas?: string;
  sortOrder: "asc" | "desc";
}) {
  const queryClient = useQueryClient();
  const userRole = useAuthStore(state => state.role);
  const userLembagaId = useAuthStore(state => state.lembaga_id);

  // 1. Fetch Daftar Kelas (Untuk Filter)
  const { data: dataKelasFilter = [], isLoading: isLoadingWaliKelas } = useQuery({
    queryKey: ['master-data', 'wali-kelas-options', userRole, userLembagaId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const isGlobalRole = userRole === 'Super Admin' || userRole === 'Direktur';
      const params: any = { select: 'kelas_id,nama_kelas,lembaga_id,lembaga(singkatan)' };
      if (!isGlobalRole && userLembagaId) {
        params.lembaga_id = `eq.${userLembagaId}`;
      }
      const response = await restClient.get('/kelas', { params });
      return (response.data || []).map((item: any) => ({
        id: item.kelas_id,
        nama: item.nama_kelas,
        lembaga: item.lembaga?.singkatan || ''
      }));
    }
  });

  const { page = 1, limit = 10, searchQuery = "", filterKelas = "Semua Kelas", sortOrder = "asc" } = paramsInput || {};

  // 2. Fetch Daftar Wali Murid + Siswanya
  const { data: waliQueryResult = { data: [], totalCount: 0 }, isLoading: isLoadingWali, isFetching: isWaliFetching } = useQuery({
    queryKey: ['master-data', 'wali_murid', page, limit, searchQuery, filterKelas, sortOrder],
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      // Optimasi: Hanya ambil data siswa dasar yang dibutuhkan (siswa_id, nis, nama), hindari join berat 3 tingkat (kelas -> lembaga)
      const selectQuery = '*, siswa(siswa_id, nis, nama)';
      const params: any = {
        limit,
        offset: (page - 1) * limit,
        order: `nama_wali.${sortOrder}`
      };

      if (filterKelas !== "Semua Kelas") {
        const targetKelas = dataKelasFilter.find((k: any) => k.nama === filterKelas);
        if (targetKelas) {
          const siswaRes = await restClient.get('/siswa', {
            params: { select: 'wali_murid_id', kelas_id: `eq.${targetKelas.id}`, wali_murid_id: 'not.is.null' }
          });
          const waliIds = Array.from(new Set((siswaRes.data || []).map((s: any) => s.wali_murid_id)));
          if (waliIds.length === 0) {
            return { data: [], totalCount: 0 };
          }
          params.wali_id = `in.(${waliIds.join(',')})`;
        }
      }

      params.select = selectQuery;

      if (searchQuery.trim()) {
        const clean = sanitizePostgrestSearch(searchQuery);
        if (clean) {
          const isNumeric = /^\d+$/.test(clean);
          if (isNumeric) {
            // Jika pencarian angka (NIK / No HP), arahkan ke kolom nomor saja agar query jauh lebih cepat
            params['or'] = `(nik_wali.ilike.*${clean}*,nik_ayah.ilike.*${clean}*,no_hp_wali.ilike.*${clean}*,no_hp_ayah.ilike.*${clean}*)`;
          } else {
            // Jika pencarian teks/nama, arahkan ke kolom nama wali, ayah, ibu
            params['or'] = `(nama_wali.ilike.*${clean}*,nama_ayah.ilike.*${clean}*,nama_ibu.ilike.*${clean}*)`;
          }
        }
      }

      try {
        const response = await restClient.get('/wali_murid', {
          params,
          headers: { Prefer: "count=exact" }
        });

        const rawData = response.data || [];
        const totalCount = parseInt(response.headers['content-range']?.split('/')?.[1] || "0", 10) || rawData.length;

        return { data: rawData, totalCount };
      } catch (err: any) {
        if ((err?.response?.data?.code === 'PGRST103' || err?.response?.status === 416) && params.offset > 0) {
          const fallbackParams = { ...params, offset: 0 };
          const response = await restClient.get('/wali_murid', {
            params: fallbackParams,
            headers: { Prefer: "count=exact" }
          });
          const rawData = response.data || [];
          const totalCount = parseInt(response.headers['content-range']?.split('/')?.[1] || "0", 10) || rawData.length;
          return { data: rawData, totalCount };
        }
        throw err;
      }
    }
  });

  // Realtime
  useFeatureRealtimeSync("MASTER_DATA_WALI_MURID");

  // 3. Fetch Daftar Siswa Belum Punya Wali (Untuk Modal Pilih Siswa)
  const { data: dataUnlinkedSiswa = [], isLoading: isLoadingUnlinkedSiswa } = useQuery({
    queryKey: ['unlinked-siswa', userRole, userLembagaId],
    enabled: isPilihSiswaModalOpen,
    staleTime: 0,
    queryFn: async () => {
      const isGlobalRole = userRole === 'Super Admin' || userRole === 'Direktur';
      const params: any = {
        select: 'siswa_id,nis,nama,kelas(kelas_id,nama_kelas,lembaga_id,lembaga(singkatan))',
        wali_murid_id: 'is.null',
        status: 'eq.Aktif',
        order: 'nama.asc'
      };

      if (!isGlobalRole && userLembagaId) {
        params['kelas.lembaga_id'] = `eq.${userLembagaId}`;
      }

      const response = await restClient.get('/siswa', { params });
      return (response.data || []).map((item: any) => ({
        id: item.siswa_id,
        siswa_id: item.siswa_id,
        kelas_id: item.kelas?.kelas_id ?? null,
        nis: item.nis || '-',
        nama: item.nama || '-',
        kelas: item.kelas?.nama_kelas || '-',
        lembaga: item.kelas?.lembaga?.singkatan || '-'
      }));
    }
  });

  // 4. Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data };
      const username = payload.nik_wali.trim();
      const email = `${username}@mlms.local`;

      let createdUser: any = null;
      try {
        createdUser = await createUserAuth({ email, password: 'password123', username });
      } catch (err: any) {
        const errMsg = err?.message?.toLowerCase() || err?.response?.data?.message?.toLowerCase() || "";
        if (err?.response?.status === 409 || errMsg.includes('already exists') || errMsg.includes('duplicate')) {
          throw new Error("Gagal membuat akun: NIK Wali sudah terdaftar di sistem.");
        }
        throw err;
      }

      if (!createdUser) throw new Error("Gagal membuat akun user.");
      const userId = createdUser?.user?.id || createdUser?.id || createdUser?.user_id;

      try {
        const roles = await getRoles();
        const waliRole = roles.find((r: any) => r.nama_role.toLowerCase() === 'wali murid');
        if (waliRole) {
          await createUserRole({ user_id: userId, role_id: waliRole.role_id, lembaga_id: undefined });
        }
      } catch (roleErr) {
        console.error("Gagal menetapkan role Wali Murid:", roleErr);
      }

      payload.user_id = userId;
      return await createWaliMurid(payload);
    },
    onSuccess: () => {
      toast.success("Data Wali Murid dan Akun berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'wali_murid'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan data wali murid.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number, payload: any }) => {
      if (data.payload.user_id && data.payload.nik_wali) {
        try {
          await updateUserAuth({
            user_id: data.payload.user_id,
            email: `${data.payload.nik_wali.trim()}@mlms.local`,
            username: data.payload.nik_wali.trim()
          });
        } catch (err) {
          console.error("Gagal update user auth", err);
        }
      }
      return updateWaliMurid(data.id, data.payload);
    },
    onSuccess: () => {
      toast.success("Data Wali Murid berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'wali_murid'] });
    },
    onError: () => {
      toast.error("Perubahan data wali murid gagal disimpan. Silakan coba lagi.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (wali: any) => {
      const waliId = typeof wali === 'object' ? wali.id : wali;
      const rawUser = typeof wali === 'object' ? wali.raw : undefined;
      if (rawUser && rawUser.user_id) {
        try { await deleteUserAuth(rawUser.user_id); } catch (e) { console.error("Gagal hapus user auth:", e); }
        try { await restClient.delete(`/user_role?user_id=eq.${rawUser.user_id}`); } catch (e) {}
      }
      try {
        await restClient.patch(`/siswa?wali_murid_id=eq.${waliId}`, { wali_murid_id: null });
      } catch (e) {}
      await deleteWaliMurid(waliId);
    },
    onSuccess: () => {
      toast.success("Data Wali Murid berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'wali_murid'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['master-data', 'siswa-all'], refetchType: 'all' });
      queryClient.refetchQueries({ queryKey: ['master-data', 'wali_murid'] });
    },
    onError: () => {
      toast.error("Data Wali Murid gagal dihapus. Pastikan data tidak terelasi dengan data lain.");
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: (number | string)[]) => {
      const batchSize = 50;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        try {
          const res = await restClient.get('/wali_murid', {
            params: { select: 'user_id', wali_id: `in.(${batch.join(',')})` }
          });
          const userIds = (res.data || []).map((w: any) => w.user_id).filter(Boolean);
          if (userIds.length > 0) {
            for (const uid of userIds) {
              try { await deleteUserAuth(uid); } catch (e) { console.error("Gagal hapus auth wali bulk:", e); }
            }
            await restClient.delete(`/user_role?user_id=in.(${userIds.join(',')})`);
          }
          await restClient.patch(`/siswa?wali_murid_id=in.(${batch.join(',')})`, { wali_murid_id: null });
        } catch (e) {
          console.error("Gagal membersihkan relasi wali_murid bulk:", e);
        }
        await restClient.delete(`/wali_murid?wali_id=in.(${batch.join(',')})`);
      }
    },
    onSuccess: () => {
      toast.success("Data Wali Murid terpilih berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'wali_murid'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['master-data', 'siswa-all'], refetchType: 'all' });
      queryClient.refetchQueries({ queryKey: ['master-data', 'wali_murid'] });
    },
    onError: () => {
      toast.error("Gagal menghapus beberapa data wali murid. Pastikan data tidak terikat kendala sistem.");
    }
  });

  // Tautkan & Unlink
  const tautkanSiswaMutation = useMutation({
    mutationFn: async ({ waliId, siswaIds }: { waliId: number, siswaIds: number[] }) => {
      const promises = siswaIds.map(siswaId => updateSiswa(siswaId, { wali_murid_id: waliId }));
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Berhasil menautkan siswa!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'wali_murid'] });
      queryClient.invalidateQueries({ queryKey: ['unlinked-siswa'] });
    },
    onError: () => toast.error("Gagal menautkan siswa")
  });

  const unlinkSiswaMutation = useMutation({
    mutationFn: async (siswaId: number) => {
      return await updateSiswa(siswaId, { wali_murid_id: null as any });
    },
    onSuccess: () => {
      toast.success("Siswa berhasil dilepas dari wali murid!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'wali_murid'] });
      queryClient.invalidateQueries({ queryKey: ['unlinked-siswa'] });
    },
    onError: () => toast.error("Gagal melepas siswa")
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => updateUserAuth({ user_id: userId, password: "password123" }),
    onSuccess: () => toast.success("Password berhasil di-reset ke default!"),
    onError: () => toast.error("Gagal me-reset password.")
  });

  const createAccountMutation = useMutation({
    mutationFn: async (wali: any) => {
      const username = (wali.nik_wali || wali.nik_ayah || "").trim();
      if (!username) throw new Error("NIK Wali / NIK Ayah wajib diisi untuk membuat akun login.");
      const email = `${username}@mlms.local`;

      let createdUser: any = null;
      try {
        createdUser = await createUserAuth({ email, password: 'password123', username });
      } catch (err: unknown) {
        const errObj = err as { message?: string; response?: { status?: number; data?: { message?: string } } };
        const errMsg = errObj?.message?.toLowerCase() || errObj?.response?.data?.message?.toLowerCase() || "";
        if (errObj?.response?.status === 409 || errMsg.includes('already exists') || errMsg.includes('duplicate')) {
          throw new Error("Gagal membuat akun: NIK Wali sudah terdaftar di sistem.", { cause: err });
        }
        throw err;
      }

      if (!createdUser) throw new Error("Gagal membuat akun user.");
      const userId = createdUser?.user?.id || createdUser?.id || createdUser?.user_id;

      try {
        const roles = await getRoles();
        const waliRole = roles.find((r: any) => r.nama_role.toLowerCase() === 'wali murid');
        if (waliRole) {
          await createUserRole({ user_id: userId, role_id: waliRole.role_id, lembaga_id: undefined });
        }
      } catch (roleErr) {
        console.error("Gagal menetapkan role Wali Murid:", roleErr);
      }

      await restClient.patch(`/wali_murid?wali_id=eq.${wali.wali_id}`, { user_id: userId });
      return { userId, waliId: wali.wali_id };
    },
    onSuccess: () => {
      toast.success("Akun login Wali Murid berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'wali_murid'] });
    },
    onError: (err: unknown) => {
      const errObj = err as { message?: string };
      toast.error(errObj?.message || "Gagal membuat akun login wali murid.");
    }
  });

  return {
    dataWali: waliQueryResult.data,
    totalCount: waliQueryResult.totalCount,
    isLoading: isLoadingWali || isLoadingWaliKelas,
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
  };
}
