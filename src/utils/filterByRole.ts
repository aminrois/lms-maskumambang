import { restClient } from "../lib/api/axios";

/**
 * Retrieves the class IDs that a specific teacher (Guru) is teaching.
 * Used for role-based filtering (BR-29).
 */
export async function getGuruKelasFilter(pegawai_id: number): Promise<number[]> {
  try {
    const res = await restClient.get(`/jadwal_pelajaran?pegawai_id=eq.${pegawai_id}&select=kelas_id`);
    if (res.data && Array.isArray(res.data)) {
      // Extract unique kelas_ids
      const kelasIds = new Set<number>();
      res.data.forEach((item: any) => {
        if (item.kelas_id) {
          kelasIds.add(item.kelas_id);
        }
      });
      return Array.from(kelasIds);
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch guru kelas filter:", error);
    return [];
  }
}

/**
 * Retrieves the mapel IDs that a specific teacher (Guru) is teaching.
 */
export async function getGuruMapelFilter(pegawai_id: number): Promise<number[]> {
  try {
    const res = await restClient.get(`/jadwal_pelajaran?pegawai_id=eq.${pegawai_id}&select=mapel_id`);
    if (res.data && Array.isArray(res.data)) {
      const mapelIds = new Set<number>();
      res.data.forEach((item: any) => {
        if (item.mapel_id) {
          mapelIds.add(item.mapel_id);
        }
      });
      return Array.from(mapelIds);
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch guru mapel filter:", error);
    return [];
  }
}
