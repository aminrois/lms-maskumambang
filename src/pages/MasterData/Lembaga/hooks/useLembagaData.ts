import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restClient } from "../../../../lib/api/axios";
import { createLembaga, updateLembaga, deleteLembaga } from "../../../../lib/api/services/masterService";
import { toast } from "sonner";

export interface LembagaUI {
  id: number;
  singkatan: string;
  namaLengkap: string;
  statistik: {
    siswa: number;
    guru: number;
    kelas: number;
  };
  pejabat: {
    kepalaSekolah: string;
    wakaKurikulum: string;
  };
  raw: any;
}

export function useLembagaData() {
  const queryClient = useQueryClient();

  const { data: dataLembaga = [], isLoading: isLembagaLoading } = useQuery({
    queryKey: ['master-data', 'lembaga'],
    staleTime: 30000,
    queryFn: async () => {
      const response = await restClient.get('/lembaga', {
        params: {
          select: 'lembaga_id,nama_lembaga,singkatan,kepala_sekolah_id,kurikulum_id,kelas(kelas_id,siswa(siswa_id)),pegawai_lembaga(pegawai_id)',
          order: 'lembaga_id.asc'
        }
      });

      const data = Array.isArray(response.data) ? response.data : [];

      return data
        .map((item: any) => {
          const kelasCount = item.kelas ? item.kelas.length : 0;
          const siswaCount = item.kelas ? item.kelas.reduce((sum: number, k: any) => sum + (k.siswa ? k.siswa.length : 0), 0) : 0;
          const guruCount = item.pegawai_lembaga ? item.pegawai_lembaga.length : 0;

          return {
            id: item.lembaga_id,
            singkatan: item.singkatan || "—",
            namaLengkap: item.nama_lembaga || "—",
            statistik: {
              siswa: siswaCount,
              guru: guruCount,
              kelas: kelasCount,
            },
            pejabat: {
              kepalaSekolah: item.kepala_sekolah_id ? item.kepala_sekolah_id : "—",
              wakaKurikulum: item.kurikulum_id ? item.kurikulum_id : "—",
            },
            raw: item
          };
        })
        .sort((a, b) => a.id - b.id) as LembagaUI[];
    }
  });

  const { data: dataPegawaiAll = [] } = useQuery({
    queryKey: ['master-data', 'pegawai-all-candidates'],
    staleTime: 30000,
    queryFn: async () => {
      const response = await restClient.get('/pegawai', {
        params: { select: 'pegawai_id,nama,user_id,pegawai_lembaga(lembaga_id)' }
      });
      return Array.isArray(response.data) ? response.data : [];
    }
  });

  const syncRolesAndLembaga = async (lembagaId: number | null, kepsekId: number | null, kurikulumId: number | null) => {
    try {
      const rolesRes = await restClient.get('/role', { params: { select: 'role_id,nama_role' } });
      const roles = rolesRes.data || [];
      const roleKepsek = roles.find((r: any) => r.nama_role.toLowerCase().includes('kepala'))?.role_id;
      const roleWaka = roles.find((r: any) => r.nama_role.toLowerCase().includes('kurikulum'))?.role_id;

      /**
       * processSync: Pastikan pegawai terdaftar di lembaga dan memiliki role yang benar.
       * 
       * Pendekatan: Simple upsert (POST + resolution=ignore-duplicates).
       * DB unique constraint pada (user_id, role_id, lembaga_id) menjamin tidak ada duplikat.
       * Tidak perlu GET + cek manual — logika if-else bertingkat sebelumnya rawan miss
       * karena type coercion number vs string, atau kondisi role di lembaga lain tidak terdeteksi.
       */
      const processSync = async (pegawaiId: number, roleId: number) => {
        if (!pegawaiId || !roleId) return;

        // 1. Daftarkan pegawai ke lembaga (upsert — abaikan jika sudah ada)
        if (lembagaId !== null && lembagaId !== undefined) {
          await restClient.post(
            '/pegawai_lembaga',
            { pegawai_id: pegawaiId, lembaga_id: lembagaId },
            { headers: { 'Prefer': 'resolution=ignore-duplicates' } }
          ).catch(() => {
            // Abaikan conflict — pegawai sudah terdaftar di lembaga ini
          });
        }

        // 2. Tambahkan role ke akun pengguna (jika pegawai punya akun user)
        const pegawaiInfo = dataPegawaiAll.find((p: any) => p.pegawai_id === pegawaiId);
        if (pegawaiInfo?.user_id) {
          await restClient.post(
            '/user_role',
            { user_id: pegawaiInfo.user_id, role_id: roleId, lembaga_id: lembagaId ?? null },
            { headers: { 'Prefer': 'resolution=ignore-duplicates' } }
          ).catch(() => {
            // Abaikan conflict — role di lembaga ini sudah ada
          });
        }
      };

      if (kepsekId && roleKepsek) await processSync(kepsekId, roleKepsek);
      if (kurikulumId && roleWaka) await processSync(kurikulumId, roleWaka);
    } catch (e) {
      console.error("Gagal sinkronisasi peran dan lembaga", e);
    }
  };

  const syncGlobalTahunAjaran = async (lembagaId: number) => {
    try {
      const response = await restClient.get('/tahun_ajaran');
      const data = response.data || [];
      const uniqueTahun = new Map();
      data.forEach((item: any) => {
        const key = `${item.nama_tahun}-${item.semester}`;
        if (!uniqueTahun.has(key)) {
          uniqueTahun.set(key, item);
        }
      });
      
      const promises = Array.from(uniqueTahun.values()).map(item => 
        restClient.post('/tahun_ajaran', {
          lembaga_id: lembagaId,
          nama_tahun: item.nama_tahun,
          semester: item.semester,
          tanggal_mulai: item.tanggal_mulai,
          tanggal_akhir: item.tanggal_akhir,
          is_active: item.is_active
        }, {
          headers: { 'Prefer': 'resolution=ignore-duplicates' }
        }).catch(() => {})
      );
      await Promise.all(promises);
    } catch (e) {
      console.error("Gagal sinkronisasi tahun ajaran", e);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      // 1. Buat lembaga baru di database tanpa kepala_sekolah_id dan kurikulum_id terlebih dahulu
      // agar tidak terbentur constraint trigger "Kepala Sekolah harus pegawai di lembaga ini"
      const initialPayload = {
        ...payload,
        kepala_sekolah_id: null,
        kurikulum_id: null
      };
      const result = await createLembaga(initialPayload);
      const data = Array.isArray(result) ? result[0] : result;
      const newLembagaId = data.lembaga_id;

      // 2. Sekarang lembaga_id sudah ada, tambahkan pegawai ke pegawai_lembaga dan role user ke user_role terlebih dahulu
      await syncRolesAndLembaga(newLembagaId, payload.kepala_sekolah_id, payload.kurikulum_id);

      // 3. Setelah pegawai resmi terdaftar di lembaga ini dan rolenya ditambahkan, update data lembaga dengan kepala sekolah & waka kurikulum
      if (payload.kepala_sekolah_id || payload.kurikulum_id) {
        await updateLembaga(newLembagaId, {
          kepala_sekolah_id: payload.kepala_sekolah_id || null,
          kurikulum_id: payload.kurikulum_id || null
        });
      }

      await syncGlobalTahunAjaran(newLembagaId);
      return result;
    },
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'lembaga'] });
    },
    onError: (error: any) => {
      if (error?.response?.status === 409 || error?.message?.includes("duplicate")) {
        toast.error("Gagal: Nama Lembaga sudah digunakan.");
      } else {
        toast.error("Data lembaga gagal disimpan. Periksa kembali isian dan coba lagi.");
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number, payload: any }) => {
      // 1. Menambahkan role ke akun pengguna dan pegawai_lembaga terlebih dahulu
      await syncRolesAndLembaga(data.id, data.payload.kepala_sekolah_id, data.payload.kurikulum_id);
      // 2. Mengirim ke database untuk update lembaga tersebut
      const result = await updateLembaga(data.id, data.payload);
      return result;
    },
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'lembaga'] });
    },
    onError: (error: any) => {
      if (error?.response?.status === 409 || error?.message?.includes("duplicate")) {
        toast.error("Gagal: Nama Lembaga sudah digunakan.");
      } else {
        toast.error("Perubahan data lembaga gagal disimpan. Silakan coba lagi.");
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      // Hapus role pegawai, relasi pegawai_lembaga, dan tahun_ajaran terkait lembaga yang dihapus
      try {
        await restClient.delete(`/user_role?lembaga_id=eq.${id}`);
        await restClient.delete(`/pegawai_lembaga?lembaga_id=eq.${id}`);
        await restClient.delete(`/tahun_ajaran?lembaga_id=eq.${id}`);
      } catch (e) {
        console.error("Gagal membersihkan relasi lembaga yang dihapus:", e);
      }
      await deleteLembaga(id);
    },
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'lembaga'] });
    },
    onError: () => {
      toast.error("Lembaga gagal dihapus. Mungkin masih memiliki data terkait (kelas, siswa, dll).");
    }
  });

  return {
    dataLembaga,
    isLembagaLoading,
    dataPegawaiAll,
    createMutation,
    updateMutation,
    deleteMutation
  };
}
