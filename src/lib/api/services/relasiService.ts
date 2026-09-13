import { restClient } from '../axios';
import * as Types from '../../../types/database';

// PEGAWAI_LEMBAGA CRUD (Composite Key: pegawai_id + lembaga_id)
export const getPegawaiLembagas = async (params?: Record<string, any>): Promise<Types.PEGAWAI_LEMBAGA[]> => {
  const response = await restClient.get<Types.PEGAWAI_LEMBAGA[]>('/pegawai_lembaga', { params });
  return response.data;
};

export const getPegawaiLembagaById = async (pegawaiId: string | number, lembagaId: string | number): Promise<Types.PEGAWAI_LEMBAGA> => {
  const response = await restClient.get<Types.PEGAWAI_LEMBAGA[]>(
    `/pegawai_lembaga?pegawai_id=eq.${pegawaiId}&lembaga_id=eq.${lembagaId}`
  );
  return response.data[0];
};

export const createPegawaiLembaga = async (payload: Types.PEGAWAI_LEMBAGA_CREATE): Promise<Types.PEGAWAI_LEMBAGA> => {
  const response = await restClient.post<Types.PEGAWAI_LEMBAGA[]>('/pegawai_lembaga', payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const updatePegawaiLembaga = async (
  pegawaiId: string | number,
  lembagaId: string | number,
  payload: Types.PEGAWAI_LEMBAGA_UPDATE
): Promise<Types.PEGAWAI_LEMBAGA> => {
  const response = await restClient.patch<Types.PEGAWAI_LEMBAGA[]>(
    `/pegawai_lembaga?pegawai_id=eq.${pegawaiId}&lembaga_id=eq.${lembagaId}`,
    payload,
    { headers: { 'Prefer': 'return=representation' } }
  );
  return response.data[0];
};

export const deletePegawaiLembaga = async (pegawaiId: string | number, lembagaId: string | number): Promise<void> => {
  await restClient.delete(`/pegawai_lembaga?pegawai_id=eq.${pegawaiId}&lembaga_id=eq.${lembagaId}`);
};

// KELAS_MAPEL CRUD (Composite Key: kelas_id + mapel_id)
// Menggantikan PEGAWAI_MAPEL — mata pelajaran dikaitkan per kelas, bukan per guru
export const getKelasMapelsByKelasId = async (kelasId: number): Promise<Types.KELAS_MAPEL[]> => {
  const response = await restClient.get<Types.KELAS_MAPEL[]>(
    `/kelas_mapel?kelas_id=eq.${kelasId}`
  );
  return response.data;
};

export const createKelasMapel = async (payload: Types.KELAS_MAPEL_CREATE): Promise<Types.KELAS_MAPEL> => {
  const response = await restClient.post<Types.KELAS_MAPEL[]>('/kelas_mapel', payload, {
    headers: { 'Prefer': 'return=representation' }
  });
  return response.data[0];
};

export const deleteKelasMapel = async (kelasId: number, mapelId: number): Promise<void> => {
  await restClient.delete(`/kelas_mapel?kelas_id=eq.${kelasId}&mapel_id=eq.${mapelId}`);
};

export const updateKelasMapel = async (kelasId: number, mapelIds: number[]): Promise<void> => {
  // 1. Hapus semua assignment lama untuk kelas ini
  await restClient.delete(`/kelas_mapel?kelas_id=eq.${kelasId}`);
  // 2. Insert assignment baru jika ada
  if (mapelIds.length > 0) {
    const payload = mapelIds.map(m_id => ({ kelas_id: kelasId, mapel_id: m_id }));
    await restClient.post('/kelas_mapel', payload);
  }
};

