import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/store/useAuthStore";
import {
  createMataPelajaran,
  updateMataPelajaran,
  createKelasMapel,
  deleteKelasMapelByMapelId,
  getMataPelajarans
} from "@/lib/api/services/akademikService";
import { getLembagas, getKelas } from "@/lib/api/services/masterService";
import { toast } from "sonner";

export interface MapelFormValues {
  lembaga_id: string;
  nama_mapel: string;
}

export const useMataPelajaranDialog = (
  open: boolean,
  mapelId: number | null,
  onOpenChange: (open: boolean) => void,
  onSuccess: () => void
) => {
  const isEdit = !!mapelId;
  const formMethods = useForm<MapelFormValues>();
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = formMethods;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [lembagas, setLembagas] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<number[]>([]);

  const selectedLembagaId = watch("lembaga_id");
  const userRole = useAuthStore(state => state.role);
  const userLembagaId = useAuthStore(state => state.lembaga_id);

  // Filter kelas sesuai lembaga yang dipilih di form
  const filteredKelas = useMemo(() => {
    if (!selectedLembagaId) return [];
    const targetLembagaId = parseInt(selectedLembagaId, 10);
    return kelasList.filter(k => k.lembaga_id === targetLembagaId);
  }, [kelasList, selectedLembagaId]);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      reset();
      setSelectedKelas([]);

      const fetchData = async () => {
        try {
          const [lembagaRes, kelasRes] = await Promise.all([
            getLembagas({ select: 'lembaga_id,nama_lembaga,singkatan' }),
            getKelas({ select: 'kelas_id,nama_kelas,lembaga_id', order: 'nama_kelas.asc' }),
          ]);

          if (userRole !== 'Super Admin' && userLembagaId) {
            const filtered = (lembagaRes || []).filter((l: any) => l.lembaga_id === userLembagaId);
            setLembagas(filtered);
            if (!isEdit && filtered.length > 0) {
              setValue('lembaga_id', userLembagaId.toString());
            }
          } else {
            setLembagas(lembagaRes || []);
          }

          setKelasList(kelasRes || []);

          if (isEdit) {
            const rows = await getMataPelajarans({
              select: "*,kelas_mapel(kelas_id)",
              "mapel_id": `eq.${mapelId}`
            });
            const mapelData: any = rows[0];
            if (mapelData) {
              setValue('lembaga_id', mapelData.lembaga_id.toString());
              setValue('nama_mapel', mapelData.nama_mapel);
              const existingKelas = mapelData.kelas_mapel?.map((km: any) => km.kelas_id) || [];
              setSelectedKelas(existingKelas);
            }
          }
        } catch (error) {
          console.error("Gagal mengambil data referensi:", error);
          toast.error("Gagal memuat data pendukung. Periksa koneksi internet dan coba lagi.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [open, mapelId, isEdit, setValue, reset, userRole, userLembagaId]);

  const toggleKelas = (kelasId: number) => {
    setSelectedKelas(prev =>
      prev.includes(kelasId)
        ? prev.filter(id => id !== kelasId)
        : [...prev, kelasId]
    );
  };

  const onSubmit = async (data: MapelFormValues) => {
    if (!data.lembaga_id) {
      toast.error("Silakan pilih lembaga terlebih dahulu");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        lembaga_id: parseInt(data.lembaga_id, 10),
        nama_mapel: data.nama_mapel,
      };

      // Cek duplikasi nama mapel di lembaga yang sama
      const existingMapels = await getMataPelajarans({
        select: "mapel_id,nama_mapel",
        "lembaga_id": `eq.${payload.lembaga_id}`
      });

      const isDuplicate = existingMapels.some(
        m => m.nama_mapel.toLowerCase().trim() === payload.nama_mapel.toLowerCase().trim()
          && (!isEdit || m.mapel_id !== mapelId)
      );

      if (isDuplicate) {
        toast.error(`Mata pelajaran "${payload.nama_mapel}" sudah ada di lembaga ini.`);
        setIsSubmitting(false);
        return;
      }

      let finalMapelId = isEdit ? mapelId : 0;

      if (isEdit) {
        await updateMataPelajaran(finalMapelId!, payload);
      } else {
        const result = await createMataPelajaran(payload);
        finalMapelId = result.mapel_id;
      }

      if (finalMapelId) {
        // Hapus semua relasi kelas_mapel lama, lalu buat yang baru
        await deleteKelasMapelByMapelId(finalMapelId);
        const promises = selectedKelas.map(kelasId =>
          createKelasMapel({ mapel_id: finalMapelId!, kelas_id: kelasId })
        );
        await Promise.all(promises);
      }

      toast.success(`Mata pelajaran berhasil di${isEdit ? 'perbarui' : 'simpan'}`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Gagal menyimpan mata pelajaran:", error);
      toast.error("Mata pelajaran gagal disimpan. Periksa kembali isian dan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isEdit,
    formMethods,
    register,
    handleSubmit,
    setValue,
    errors,
    watch,
    isSubmitting,
    isLoading,
    lembagas,
    filteredKelas,
    selectedKelas,
    toggleKelas,
    onSubmit,
  };
};
