import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { restClient } from "@/lib/api/axios";
import { usePermissions } from "@/hooks/usePermissions";

function calcStatusKBM(tanggalJurnal: string | null, rencanaStr: string | null): string {
  if (!tanggalJurnal || !rencanaStr) return "Sesuai Target";
  // Ambil tanggal pertama dari range (misal "2026-09-01 - 2026-09-07" -> "2026-09-01")
  const rencanaDate = rencanaStr.split(' ')[0].trim();
  if (tanggalJurnal < rencanaDate) return "Terlalu Cepat";
  if (tanggalJurnal > rencanaDate) return "Terlambat";
  return "Sesuai Target";
}

export function useJurnalMengajarDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canUpdate } = usePermissions('absensi_pelajaran');

  const { data: jurnal, isLoading: isJurnalLoading } = useQuery<any>({
    queryKey: ['kbm', 'jurnal-detail', id],
    queryFn: async () => {
      const selectQuery = '*,jadwal_pelajaran:jadwal_id(jadwal_id,kelas_id,mapel_id,pegawai_id,kelas:kelas_id(nama_kelas),mapel:mapel_id(nama_mapel),pegawai:pegawai_id(nama)),lesson_plan_detail:lesson_plan_detail_id(materi,topik_materi,rencana_pelaksanaan_kbm)';
      try {
        const response = await restClient.get(`/jurnal_mengajar?jurnal_id=eq.${id}&select=${selectQuery}`);
        if (response.data && response.data.length > 0) {
          const item = response.data[0];
          const jadwal = item.jadwal_pelajaran || item.jadwal || {};
          const rencanaKbm = item.lesson_plan_detail?.rencana_pelaksanaan_kbm || null;
          const status_kbm = calcStatusKBM(item.tanggal, rencanaKbm);
          return {
            ...item,
            status_kbm,
            jadwal_pelajaran: {
              ...jadwal,
              kelas: jadwal.kelas || { nama_kelas: "-" },
              mata_pelajaran: jadwal.mapel || jadwal.mata_pelajaran || { nama_mapel: "-" },
              pegawai: jadwal.pegawai || { nama: "-" }
            }
          };
        }
      } catch (e) {
        console.error("Error fetching detail with full relation:", e);
      }

      // Fallback
      const simpleRes = await restClient.get(`/jurnal_mengajar?jurnal_id=eq.${id}`);
      return simpleRes.data?.[0] || null;
    },
    enabled: !!id
  });

  const { data: absensi = [], isLoading: isAbsensiLoading } = useQuery({
    queryKey: ['kbm', 'absensi-by-jurnal', id],
    queryFn: async () => {
      const response = await restClient.get(`/absensi_pelajaran?jurnal_id=eq.${id}&select=*,siswa:siswa_id(nama,nis)`);
      return response.data;
    },
    enabled: !!id
  });

  return {
    id,
    navigate,
    canUpdate,
    jurnal,
    isJurnalLoading,
    absensi,
    isAbsensiLoading
  };
}

