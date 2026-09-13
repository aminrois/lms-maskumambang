import { restClient } from '../axios';
import * as Types from '../../../types/database';

// TAHUN_AJARAN CRUD
export const getTahunAjarans = async (params?: Record<string, any>): Promise<Types.TAHUN_AJARAN[]> => {
  const response = await restClient.get<Types.TAHUN_AJARAN[]>('/tahun_ajaran', { params });
  return response.data;
};

export const getTahunAjaranById = async (id: string | number): Promise<Types.TAHUN_AJARAN> => {
  const response = await restClient.get<Types.TAHUN_AJARAN[]>(`/tahun_ajaran?tahun_id=eq.${id}`);
  return response.data[0];
};

export const createTahunAjaran = async (payload: Types.TAHUN_AJARAN_CREATE): Promise<Types.TAHUN_AJARAN> => {
  const response = await restClient.post<Types.TAHUN_AJARAN[]>('/tahun_ajaran', payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const updateTahunAjaran = async (id: string | number, payload: Types.TAHUN_AJARAN_UPDATE): Promise<Types.TAHUN_AJARAN> => {
  const response = await restClient.patch<Types.TAHUN_AJARAN[]>(`/tahun_ajaran?tahun_id=eq.${id}`, payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const deactivateAllTahunAjaran = async (): Promise<void> => {
  await restClient.patch(`/tahun_ajaran?is_active=eq.true`, { is_active: false });
};

export const deleteTahunAjaran = async (id: string | number): Promise<void> => {
  await restClient.delete(`/tahun_ajaran?tahun_id=eq.${id}`);
};

// KELAS CRUD
export const getKelass = async (params?: Record<string, any>): Promise<Types.KELAS[]> => {
  const response = await restClient.get<Types.KELAS[]>('/kelas', { params });
  return response.data;
};

export const getKelasById = async (id: string | number): Promise<Types.KELAS> => {
  const response = await restClient.get<Types.KELAS[]>(`/kelas?kelas_id=eq.${id}`);
  return response.data[0];
};

export const createKelas = async (payload: Types.KELAS_CREATE): Promise<Types.KELAS> => {
  const response = await restClient.post<Types.KELAS[]>('/kelas', payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const updateKelas = async (id: string | number, payload: Types.KELAS_UPDATE): Promise<Types.KELAS> => {
  const response = await restClient.patch<Types.KELAS[]>(`/kelas?kelas_id=eq.${id}`, payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const deleteKelas = async (id: string | number): Promise<void> => {
  await restClient.delete(`/kelas?kelas_id=eq.${id}`);
};

// MATA_PELAJARAN CRUD
export const getMataPelajarans = async (params?: Record<string, any>): Promise<Types.MATA_PELAJARAN[]> => {
  const response = await restClient.get<Types.MATA_PELAJARAN[]>('/mata_pelajaran', { params });
  return response.data;
};

export const getMataPelajaranById = async (id: string | number): Promise<Types.MATA_PELAJARAN> => {
  const response = await restClient.get<Types.MATA_PELAJARAN[]>(`/mata_pelajaran?mapel_id=eq.${id}`);
  return response.data[0];
};

export const createMataPelajaran = async (payload: Types.MATA_PELAJARAN_CREATE): Promise<Types.MATA_PELAJARAN> => {
  const response = await restClient.post<Types.MATA_PELAJARAN[]>('/mata_pelajaran', payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const updateMataPelajaran = async (id: string | number, payload: Types.MATA_PELAJARAN_UPDATE): Promise<Types.MATA_PELAJARAN> => {
  const response = await restClient.patch<Types.MATA_PELAJARAN[]>(`/mata_pelajaran?mapel_id=eq.${id}`, payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const deleteMataPelajaran = async (id: string | number): Promise<void> => {
  await restClient.delete(`/mata_pelajaran?mapel_id=eq.${id}`);
};

// JAM_AKADEMIK CRUD
export const getJamAkademiks = async (params?: Record<string, any>): Promise<Types.JAM_AKADEMIK[]> => {
  const response = await restClient.get<Types.JAM_AKADEMIK[]>('/jam_akademik', { params });
  return response.data;
};

export const getJamAkademikById = async (id: string | number): Promise<Types.JAM_AKADEMIK> => {
  const response = await restClient.get<Types.JAM_AKADEMIK[]>(`/jam_akademik?jam_id=eq.${id}`);
  return response.data[0];
};

export const createJamAkademik = async (payload: Types.JAM_AKADEMIK_CREATE): Promise<Types.JAM_AKADEMIK> => {
  const response = await restClient.post<Types.JAM_AKADEMIK[]>('/jam_akademik', payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const updateJamAkademik = async (id: string | number, payload: Types.JAM_AKADEMIK_UPDATE): Promise<Types.JAM_AKADEMIK> => {
  const response = await restClient.patch<Types.JAM_AKADEMIK[]>(`/jam_akademik?jam_id=eq.${id}`, payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const deleteJamAkademik = async (id: string | number): Promise<void> => {
  await restClient.delete(`/jam_akademik?jam_id=eq.${id}`);
};

// JADWAL_PELAJARAN CRUD
export const getJadwalPelajarans = async (params?: Record<string, any>): Promise<Types.JADWAL_PELAJARAN[]> => {
  const response = await restClient.get<Types.JADWAL_PELAJARAN[]>('/jadwal_pelajaran', { params });
  return response.data;
};

// Fetch semua baris jadwal_pelajaran dengan pagination untuk menghindari limit 1000 baris Supabase.
// Gunakan fungsi ini ketika data yang diambil bisa >1000 baris (misal: semua kelas, semua hari).
export const getAllJadwalPelajarans = async (params?: Record<string, any>): Promise<Types.JADWAL_PELAJARAN[]> => {
  const PAGE_SIZE = 1000;
  let allData: Types.JADWAL_PELAJARAN[] = [];
  let page = 0;

  while (true) {
    const response = await restClient.get<Types.JADWAL_PELAJARAN[]>('/jadwal_pelajaran', {
      params: { ...params, limit: PAGE_SIZE, offset: page * PAGE_SIZE }
    });
    const data = response.data || [];
    allData = [...allData, ...data];
    if (data.length < PAGE_SIZE) break;
    page++;
  }

  return allData;
};

export const getJadwalPelajaranById = async (id: string | number): Promise<Types.JADWAL_PELAJARAN> => {
  const response = await restClient.get<Types.JADWAL_PELAJARAN[]>(`/jadwal_pelajaran?jadwal_id=eq.${id}`);
  return response.data[0];
};

export const createJadwalPelajaran = async (payload: Types.JADWAL_PELAJARAN_CREATE): Promise<Types.JADWAL_PELAJARAN> => {
  const response = await restClient.post<Types.JADWAL_PELAJARAN[]>('/jadwal_pelajaran', payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const updateJadwalPelajaran = async (id: string | number, payload: Types.JADWAL_PELAJARAN_UPDATE): Promise<Types.JADWAL_PELAJARAN> => {
  const response = await restClient.patch<Types.JADWAL_PELAJARAN[]>(`/jadwal_pelajaran?jadwal_id=eq.${id}`, payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  
  // Jika ada perubahan jadwal (mapel/guru), reset status verifikasi RPP yang terhubung
  try {
    const lps = await restClient.get<Types.LESSON_PLAN[]>(`/lesson_plan?jadwal_id=eq.${id}`);
    if (lps.data && lps.data.length > 0) {
      for (const lp of lps.data) {
        const lpPayload: Partial<Types.LESSON_PLAN> = {
          status_verifikasi_kepsek: 'Menunggu Verifikasi',
          catatan_revisi_kepsek: null as any,
          status_verifikasi_direktur: 'Menunggu Verifikasi',
          catatan_revisi_direktur: null as any
        };
        // Sinkronkan guru (pegawai_id) jika diubah di Jadwal
        if (payload.pegawai_id) {
          lpPayload.pegawai_id = payload.pegawai_id;
        }
        await restClient.patch(`/lesson_plan?lesson_plan_id=eq.${lp.lesson_plan_id}`, lpPayload);
      }
    }
  } catch (err) {
    console.error("Gagal mereset status verifikasi Lesson Plan terkait jadwal", err);
  }
  
  return response.data[0];
};

export const deleteJadwalPelajaran = async (id: string | number): Promise<void> => {
  await restClient.delete(`/jadwal_pelajaran?jadwal_id=eq.${id}`);
};

// KALENDER_AKADEMIK CRUD
export const getKalenderAkademiks = async (params?: Record<string, any>): Promise<Types.KALENDER_AKADEMIK[]> => {
  const response = await restClient.get<Types.KALENDER_AKADEMIK[]>('/kalender_akademik', { params });
  return response.data;
};

export const getKalenderAkademikById = async (id: string | number): Promise<Types.KALENDER_AKADEMIK> => {
  const response = await restClient.get<Types.KALENDER_AKADEMIK[]>(`/kalender_akademik?kalender_id=eq.${id}`);
  return response.data[0];
};

export const createKalenderAkademik = async (payload: Types.KALENDER_AKADEMIK_CREATE): Promise<Types.KALENDER_AKADEMIK> => {
  const response = await restClient.post<Types.KALENDER_AKADEMIK[]>('/kalender_akademik', payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const updateKalenderAkademik = async (id: string | number, payload: Types.KALENDER_AKADEMIK_UPDATE): Promise<Types.KALENDER_AKADEMIK> => {
  const response = await restClient.patch<Types.KALENDER_AKADEMIK[]>(`/kalender_akademik?kalender_id=eq.${id}`, payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const deleteKalenderAkademik = async (id: string | number): Promise<void> => {
  await restClient.delete(`/kalender_akademik?kalender_id=eq.${id}`);
};

// ACTIVITY_PLAN CRUD
export const getActivityPlans = async (params?: Record<string, any>): Promise<Types.ACTIVITY_PLAN[]> => {
  const response = await restClient.get<Types.ACTIVITY_PLAN[]>('/activity_plan', { params });
  return response.data;
};

export const getActivityPlanById = async (id: string | number): Promise<Types.ACTIVITY_PLAN> => {
  const response = await restClient.get<Types.ACTIVITY_PLAN[]>(`/activity_plan?activity_id=eq.${id}`);
  return response.data[0];
};

export const createActivityPlan = async (payload: Types.ACTIVITY_PLAN_CREATE): Promise<Types.ACTIVITY_PLAN> => {
  const response = await restClient.post<Types.ACTIVITY_PLAN[]>('/activity_plan', payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const updateActivityPlan = async (id: string | number, payload: Types.ACTIVITY_PLAN_UPDATE): Promise<Types.ACTIVITY_PLAN> => {
  const response = await restClient.patch<Types.ACTIVITY_PLAN[]>(`/activity_plan?activity_id=eq.${id}`, payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const deleteActivityPlan = async (id: string | number): Promise<void> => {
  await restClient.delete(`/activity_plan?activity_id=eq.${id}`);
};

// KELAS_MAPEL CRUD (Composite Key: kelas_id + mapel_id)
// Menggantikan PEGAWAI_MAPEL — mata pelajaran dikaitkan per kelas, bukan per guru
export const getKelasMapels = async (params?: Record<string, any>): Promise<Types.KELAS_MAPEL[]> => {
  const response = await restClient.get<Types.KELAS_MAPEL[]>('/kelas_mapel', { params });
  return response.data;
};

export const createKelasMapel = async (payload: Types.KELAS_MAPEL_CREATE): Promise<Types.KELAS_MAPEL> => {
  const response = await restClient.post<Types.KELAS_MAPEL[]>('/kelas_mapel', payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const deleteKelasMapel = async (kelas_id: number, mapel_id: number): Promise<void> => {
  await restClient.delete(`/kelas_mapel?kelas_id=eq.${kelas_id}&mapel_id=eq.${mapel_id}`);
};

export const deleteKelasMapelByMapelId = async (mapel_id: number): Promise<void> => {
  await restClient.delete(`/kelas_mapel?mapel_id=eq.${mapel_id}`);
};

