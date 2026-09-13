import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSiswas } from "@/lib/api/services/masterService";
import { getAbsensiHarians, upsertAbsensiHarian } from "@/lib/api/services/kbmService";
import type { AbsensiHarianState } from "../Index";

interface UseFormAbsensiHarianProps {
    selections: AbsensiHarianState;
}

export function useFormAbsensiHarian({ selections }: UseFormAbsensiHarianProps) {
    const [absensiMap, setAbsensiMap] = useState<Record<number, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Dispen'>>({});
    const queryClient = useQueryClient();

    // Fetch daftar siswa
    const { data: siswas = [], isLoading: isLoadingSiswa } = useQuery({
        queryKey: ['master-data', 'siswa', selections.kelas_id],
        queryFn: async () => {
            if (!selections.kelas_id) return [];
            return await getSiswas({
                select: "siswa_id,nama,nis",
                kelas_id: `eq.${selections.kelas_id}`,
                order: "nama.asc"
            });
        },
        enabled: !!selections.kelas_id
    });

    // Fetch existing absensi harian
    const { data: existingAbsensi = [], isLoading: isLoadingAbsensi } = useQuery({
        queryKey: ['kbm', 'absensi_harian', selections.kelas_id, selections.tanggal],
        queryFn: async () => {
            if (!selections.kelas_id || !selections.tanggal) return [];
            // We need to fetch absensi for these students
            // But since we can't easily join on PostgREST without having a foreign key from absensi_harian to kelas, 
            // we will fetch absensi by the siswa_id list.
            
            // Wait for siswas to be loaded first. If it's empty, we return empty.
            // But React Query will handle this in useEffect if we manage state properly.
            // A simpler way: fetch absensi for all siswas in this class
            const siswasList = await getSiswas({ select: "siswa_id", kelas_id: `eq.${selections.kelas_id}` });
            if (siswasList.length === 0) return [];
            
            const siswaIds = siswasList.map(s => s.siswa_id).join(',');
            return await getAbsensiHarians({
                tanggal: `eq.${selections.tanggal}`,
                siswa_id: `in.(${siswaIds})`
            });
        },
        enabled: !!selections.kelas_id && !!selections.tanggal
    });

    // Populate absensiMap when existing data is loaded
    useEffect(() => {
        if (siswas.length > 0) {
            const newMap: Record<number, any> = {};
            
            // Set default 'Hadir'
            siswas.forEach(s => {
                newMap[s.siswa_id] = 'Hadir';
            });

            // Override with existing
            if (existingAbsensi.length > 0) {
                existingAbsensi.forEach(ab => {
                    if (ab.status) {
                        newMap[ab.siswa_id] = ab.status;
                    }
                });
            }
            
            setAbsensiMap(newMap);
        }
    }, [siswas, existingAbsensi]);

    const handleStatusChange = (siswaId: number, status: any) => {
        setAbsensiMap(prev => ({ ...prev, [siswaId]: status }));
    };

    const submitMutation = useMutation({
        mutationFn: async () => {
            if (!selections.tanggal) throw new Error("Tanggal tidak boleh kosong");
            
            const payload = siswas.map(s => ({
                siswa_id: s.siswa_id,
                tanggal: selections.tanggal,
                status: absensiMap[s.siswa_id] || 'Hadir'
            }));

            if (payload.length === 0) return;

            await upsertAbsensiHarian(payload);
        },
        onSuccess: () => {
            toast.success("Data absensi harian berhasil disimpan!");
            queryClient.invalidateQueries({ queryKey: ['kbm', 'absensi_harian'] });
        },
        onError: (err: any) => {
            console.error(err);
            toast.error("Gagal menyimpan absensi harian");
        }
    });

    return {
        siswas,
        isLoading: isLoadingSiswa || isLoadingAbsensi,
        absensiMap,
        handleStatusChange,
        submitMutation
    };
}
