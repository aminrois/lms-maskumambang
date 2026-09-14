import { restClient } from "../axios";
import * as Types from "../../../types/database";

// LEMBAGA CRUD
export const getLembagas = async (
  params?: Record<string, any>,
): Promise<Types.LEMBAGA[]> => {
  const response = await restClient.get<Types.LEMBAGA[]>("/lembaga", {
    params,
  });
  return response.data;
};

export const getLembagaById = async (
  id: string | number,
): Promise<Types.LEMBAGA> => {
  const response = await restClient.get<Types.LEMBAGA[]>(
    `/lembaga?lembaga_id=eq.${id}`,
  );
  return response.data[0];
};

export const createLembaga = async (
  payload: Types.LEMBAGA_CREATE,
): Promise<Types.LEMBAGA> => {
  const response = await restClient.post<Types.LEMBAGA>("/lembaga", payload, {
    headers: { Prefer: "return=representation" },
  });
  return response.data;
};

export const updateLembaga = async (
  id: string | number,
  payload: Types.LEMBAGA_UPDATE,
): Promise<Types.LEMBAGA> => {
  const response = await restClient.patch<Types.LEMBAGA>(
    `/lembaga?lembaga_id=eq.${id}`,
    payload,
    {
      headers: { Prefer: "return=representation" },
    },
  );
  return response.data;
};

export const deleteLembaga = async (id: string | number): Promise<void> => {
  const response = await restClient.delete(`/lembaga?lembaga_id=eq.${id}`, {
    headers: { Prefer: "return=representation" },
  });
  if (response.data && response.data.length === 0) {
    throw new Error("Data gagal dihapus. Anda mungkin tidak memiliki izin (RLS) atau data sudah tidak ada.");
  }
};

// PEGAWAI CRUD
export const getPegawais = async (
  params?: Record<string, any>,
): Promise<Types.PEGAWAI[]> => {
  const response = await restClient.get<Types.PEGAWAI[]>("/pegawai", {
    params,
  });
  return response.data;
};

export const getPegawaiById = async (
  id: string | number,
): Promise<Types.PEGAWAI> => {
  const response = await restClient.get<Types.PEGAWAI[]>(
    `/pegawai?pegawai_id=eq.${id}`,
  );
  return response.data[0];
};

export const getPegawaiByUserId = async (
  userId: string,
): Promise<Types.PEGAWAI | undefined> => {
  const response = await restClient.get<Types.PEGAWAI[]>("/pegawai", {
    params: {
      user_id: `eq.${userId}`,
    },
  });

  return response.data[0];
};

export const createPegawai = async (
  payload: Types.PEGAWAI_CREATE,
): Promise<Types.PEGAWAI> => {
  const response = await restClient.post<Types.PEGAWAI>("/pegawai", payload, {
    headers: { Prefer: "return=representation" },
  });
  return response.data;
};

export const updatePegawai = async (
  id: string | number,
  payload: Types.PEGAWAI_UPDATE,
): Promise<Types.PEGAWAI> => {
  const response = await restClient.patch<Types.PEGAWAI>(
    `/pegawai?pegawai_id=eq.${id}`,
    payload,
    {
      headers: { Prefer: "return=representation" },
    },
  );
  return response.data;
};

export const deletePegawai = async (id: string | number): Promise<void> => {
  const response = await restClient.delete(`/pegawai?pegawai_id=eq.${id}`, {
    headers: { Prefer: "return=representation" },
  });
  if (response.data && response.data.length === 0) {
    throw new Error("Data gagal dihapus. Anda mungkin tidak memiliki izin (RLS) atau data sudah tidak ada.");
  }
};

// SISWA CRUD
export const getSiswas = async (
  params?: Record<string, any>,
): Promise<Types.SISWA[]> => {
  const response = await restClient.get<Types.SISWA[]>("/siswa", { params });
  return response.data;
};

export const getSiswaById = async (
  id: string | number,
): Promise<Types.SISWA> => {
  const response = await restClient.get<Types.SISWA[]>(
    `/siswa?siswa_id=eq.${id}`,
  );
  return response.data[0];
};

export const createSiswa = async (
  payload: Types.SISWA_CREATE,
): Promise<Types.SISWA> => {
  const response = await restClient.post<Types.SISWA>("/siswa", payload, {
    headers: { Prefer: "return=representation" },
  });
  return response.data;
};

export const updateSiswa = async (
  id: string | number,
  payload: Types.SISWA_UPDATE,
): Promise<Types.SISWA> => {
  const response = await restClient.patch<Types.SISWA>(
    `/siswa?siswa_id=eq.${id}`,
    payload,
    {
      headers: { Prefer: "return=representation" },
    },
  );
  return response.data;
};

// KELAS — generic fetch
export const getKelas = async (params?: Record<string, any>): Promise<Types.KELAS[]> => {
  const response = await restClient.get<Types.KELAS[]>('/kelas', { params });
  return response.data;
};

export const assignSiswasToKelas = async (
  siswaIds: (string | number)[],
  kelasId: number
): Promise<void> => {
  if (siswaIds.length === 0) return;
  await restClient.patch(
    `/siswa?siswa_id=in.(${siswaIds.join(",")})`,
    { kelas_id: kelasId },
    { headers: { Prefer: "return=minimal" } }
  );
};

export const removeSiswaFromKelas = async (
  siswaId: string | number
): Promise<void> => {
  await restClient.patch(
    `/siswa?siswa_id=eq.${siswaId}`,
    { kelas_id: null },
    { headers: { Prefer: "return=minimal" } }
  );
};

export const deleteSiswa = async (id: string | number): Promise<void> => {
  const response = await restClient.delete(`/siswa?siswa_id=eq.${id}`, {
    headers: { Prefer: "return=representation" },
  });
  if (response.data && response.data.length === 0) {
    throw new Error("Data gagal dihapus. Anda mungkin tidak memiliki izin (RLS) atau data sudah tidak ada.");
  }
};

// WALI_MURID CRUD
export const getWaliMurids = async (
  params?: Record<string, any>,
): Promise<Types.WALI_MURID[]> => {
  const response = await restClient.get<Types.WALI_MURID[]>("/wali_murid", {
    params,
  });
  return response.data;
};

export const getWaliMuridById = async (
  id: string | number,
): Promise<Types.WALI_MURID> => {
  const response = await restClient.get<Types.WALI_MURID[]>(
    `/wali_murid?wali_id=eq.${id}`,
  );
  return response.data[0];
};

export const createWaliMurid = async (
  payload: Types.WALI_MURID_CREATE,
): Promise<Types.WALI_MURID> => {
  const response = await restClient.post<Types.WALI_MURID>(
    "/wali_murid",
    payload,
    {
      headers: { Prefer: "return=representation" },
    },
  );
  return response.data;
};

export const updateWaliMurid = async (
  id: string | number,
  payload: Types.WALI_MURID_UPDATE,
): Promise<Types.WALI_MURID> => {
  const response = await restClient.patch<Types.WALI_MURID>(
    `/wali_murid?wali_id=eq.${id}`,
    payload,
    {
      headers: { Prefer: "return=representation" },
    },
  );
  return response.data;
};

export const deleteWaliMurid = async (id: string | number): Promise<void> => {
  const response = await restClient.delete(`/wali_murid?wali_id=eq.${id}`, {
    headers: { Prefer: "return=representation" },
  });
  if (response.data && response.data.length === 0) {
    throw new Error("Data gagal dihapus. Anda mungkin tidak memiliki izin (RLS) atau data sudah tidak ada.");
  }
};

// PEGAWAI_LEMBAGA (Assignment)
export const getPegawaiLembaga = async (pegawai_id: number): Promise<Types.PEGAWAI_LEMBAGA[]> => {
  const response = await restClient.get<Types.PEGAWAI_LEMBAGA[]>(`/pegawai_lembaga?pegawai_id=eq.${pegawai_id}`);
  return response.data;
};

export const updatePegawaiLembaga = async (pegawai_id: number, lembaga_ids: number[]): Promise<void> => {
  // 1. Hapus semua assignment lama
  await restClient.delete(`/pegawai_lembaga?pegawai_id=eq.${pegawai_id}`);
  
  // 2. Insert assignment baru jika ada
  if (lembaga_ids.length > 0) {
    const payload = lembaga_ids.map(l_id => ({
      pegawai_id,
      lembaga_id: l_id
    }));
    await restClient.post("/pegawai_lembaga", payload);
  }
};

// KELAS_MAPEL (Assignment mapel per kelas — menggantikan PEGAWAI_MAPEL)
export const getKelasMapelByKelasId = async (kelas_id: number): Promise<Types.KELAS_MAPEL[]> => {
  const response = await restClient.get<Types.KELAS_MAPEL[]>(`/kelas_mapel?kelas_id=eq.${kelas_id}`);
  return response.data;
};

export const updateKelasMapelByKelasId = async (kelas_id: number, mapel_ids: number[]): Promise<void> => {
  // 1. Hapus semua assignment lama
  await restClient.delete(`/kelas_mapel?kelas_id=eq.${kelas_id}`);

  // 2. Insert assignment baru jika ada
  if (mapel_ids.length > 0) {
    const payload = mapel_ids.map(m_id => ({
      kelas_id,
      mapel_id: m_id
    }));
    await restClient.post("/kelas_mapel", payload);
  }
};
