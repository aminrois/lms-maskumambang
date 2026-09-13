import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { restClient } from "@/lib/api/axios";
import { usePermissions } from "@/hooks/usePermissions";

export function useJurnalMengajarDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canUpdate } = usePermissions('absensi_pelajaran');

  const { data: jurnal, isLoading: isJurnalLoading } = useQuery<any>({
    queryKey: ['kbm', 'jurnal-detail', id],
    queryFn: async () => {
      const selectQuery = '*, jadwal_pelajaran!inner(kelas_id, mapel_id, kelas!inner(nama_kelas), mata_pelajaran!inner(nama_mapel), pegawai!inner(nama)), lesson_plan_detail(materi, topik_materi)';
      const response = await restClient.get(`/jurnal_mengajar?jurnal_id=eq.${id}&select=${selectQuery}`);
      return response.data[0];
    },
    enabled: !!id
  });

  const { data: absensi = [], isLoading: isAbsensiLoading } = useQuery({
    queryKey: ['kbm', 'absensi-by-jurnal', id],
    queryFn: async () => {
      const response = await restClient.get(`/absensi_pelajaran?jurnal_id=eq.${id}&select=*,siswa(nama,nis)`);
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
