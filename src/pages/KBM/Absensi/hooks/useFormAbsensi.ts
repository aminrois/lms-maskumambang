import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSiswas } from "@/lib/api/services/masterService";
import {
    createJurnalMengajar, updateJurnalMengajar, deleteJurnalMengajar, getJurnalMengajars,
    createAbsensiPelajaran, updateAbsensiPelajaran, getAbsensiPelajarans,
    getLessonPlanDetails
} from "@/lib/api/services/kbmService";
import { usePermissions } from "@/hooks/usePermissions";
import { useFeatureRealtimeSync } from "@/hooks/useRealtimeSync";
import type { AbsensiState } from "../Index";

interface UseFormAbsensiProps {
    selections: AbsensiState;
    setCurrentStep: (step: number) => void;
}

export function useFormAbsensi({ selections, setCurrentStep }: UseFormAbsensiProps) {
    const [absensiMap, setAbsensiMap] = useState<Record<number, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Dispen'>>({});
    const [catatan, setCatatan] = useState("");
    const { canCreate, canUpdate } = usePermissions('absensi_pelajaran');
    const queryClient = useQueryClient();

    useFeatureRealtimeSync("KBM_ABSENSI");

    // Fetch daftar siswa di kelas ini
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

    // Load jurnal + absensi yang sudah ada untuk hari ini pada jadwal ini
    // Identifier unik: jadwal_id + tanggal (mengikuti constraint DB)
    const todayDate = new Date().toISOString().split('T')[0];
    const firstJadwalId = selections.jadwal_ids?.[0] || null;
    const { data: existingJurnalData, isLoading: isLoadingExistingJurnal } = useQuery({
        queryKey: ['kbm', 'existing-jurnal', firstJadwalId, todayDate],
        queryFn: async () => {
            if (!firstJadwalId) return null;
            const jurnals = await getJurnalMengajars({
                jadwal_id: `in.(${selections.jadwal_ids.join(',')})`,
                tanggal: `eq.${todayDate}`
            });
            if (!jurnals || jurnals.length === 0) return null;
            const jurnal = jurnals[0];

            // Load absensi yang sudah ada untuk jurnal ini
            const absensiList = await getAbsensiPelajarans({
                jurnal_id: `eq.${jurnal.jurnal_id}`
            });
            return { jurnal, absensiList };
        },
        enabled: !!firstJadwalId
    });

    const isLoading = isLoadingSiswa || isLoadingExistingJurnal;

    // Masalah 5: Pisahkan inisialisasi menjadi 2 efek untuk menghilangkan race condition.
    // Efek 1: Selalu set default 'Hadir' untuk SEMUA siswa saat daftar siswa berubah.
    // Ini memastikan absensiMap tidak pernah kosong selama siswas sudah loaded.
    useEffect(() => {
        if (siswas.length === 0) return;
        setAbsensiMap(prev => {
            const newMap: Record<number, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Dispen'> = {};
            siswas.forEach(s => {
                // Pertahankan status yang sudah ada (dari pre-fill existing), atau default Hadir
                newMap[s.siswa_id] = prev[s.siswa_id] || 'Hadir';
            });
            return newMap;
        });
    }, [siswas]);

    // Efek 2: Pre-fill dari data absensi existing saat keduanya sudah selesai loading.
    useEffect(() => {
        if (siswas.length === 0 || isLoadingExistingJurnal) return;
        if (!existingJurnalData?.absensiList || existingJurnalData.absensiList.length === 0) return;

        setAbsensiMap(prev => {
            const updated = { ...prev };
            existingJurnalData.absensiList.forEach((ab: any) => {
                if (ab.siswa_id in updated) {
                    updated[ab.siswa_id] = ab.status;
                }
            });
            return updated;
        });

        if (existingJurnalData.jurnal?.catatan_tambahan) {
            setCatatan(existingJurnalData.jurnal.catatan_tambahan);
        }
    }, [siswas, existingJurnalData, isLoadingExistingJurnal]);

    const submitMutation = useMutation({
        mutationFn: async () => {
            if (!selections.jadwal_ids || selections.jadwal_ids.length === 0 || !selections.pertemuan) {
                throw new Error("Data Jadwal atau Pertemuan tidak lengkap.");
            }

            // 1. Resolve detail_id RPP yang valid untuk pertemuan ini
            let actualDetailId: number | undefined = undefined;

            const findDetailForPertemuan = (detailsList: any[], pertemuanNum: number) => {
                if (!detailsList || detailsList.length === 0) return undefined;
                const match = detailsList.find((d: any) => Number(d.pertemuan_ke) === Number(pertemuanNum));
                return (match || detailsList[0])?.detail_id;
            };

            // Percobaan A: selections.lesson_plan_detail_id sebagai lesson_plan_id
            if (selections.lesson_plan_detail_id) {
                const detailsByLpId = await getLessonPlanDetails({
                    lesson_plan_id: `eq.${selections.lesson_plan_detail_id}`,
                    order: "pertemuan_ke.asc"
                });
                if (detailsByLpId && detailsByLpId.length > 0) {
                    actualDetailId = findDetailForPertemuan(detailsByLpId, selections.pertemuan);
                } else {
                    // Percobaan B: selections.lesson_plan_detail_id sebagai detail_id langsung
                    const detailsByDetailId = await getLessonPlanDetails({
                        detail_id: `eq.${selections.lesson_plan_detail_id}`
                    });
                    if (detailsByDetailId && detailsByDetailId.length > 0) {
                        const parentLpId = detailsByDetailId[0].lesson_plan_id;
                        if (parentLpId) {
                            const parentDetails = await getLessonPlanDetails({
                                lesson_plan_id: `eq.${parentLpId}`,
                                order: "pertemuan_ke.asc"
                            });
                            actualDetailId = findDetailForPertemuan(parentDetails, selections.pertemuan) || detailsByDetailId[0].detail_id;
                        } else {
                            actualDetailId = detailsByDetailId[0].detail_id;
                        }
                    }
                }
            }

            // Percobaan C: Fallback dari jurnal yang sudah ada di database
            if (!actualDetailId && existingJurnalData?.jurnal?.lesson_plan_detail_id) {
                const existingDetailId = existingJurnalData.jurnal.lesson_plan_detail_id;
                const detailsByDetailId = await getLessonPlanDetails({
                    detail_id: `eq.${existingDetailId}`
                });
                if (detailsByDetailId && detailsByDetailId.length > 0 && detailsByDetailId[0].lesson_plan_id) {
                    const parentDetails = await getLessonPlanDetails({
                        lesson_plan_id: `eq.${detailsByDetailId[0].lesson_plan_id}`,
                        order: "pertemuan_ke.asc"
                    });
                    actualDetailId = findDetailForPertemuan(parentDetails, selections.pertemuan) || existingDetailId;
                } else {
                    actualDetailId = existingDetailId;
                }
            }

            // Percobaan D dihapus — fallback getAllLessonPlans saat submit
            // menyebabkan statement timeout (query berat saat save).
            // Percobaan A, B, C sudah cukup sebagai fallback.

            const todayDate = new Date().toISOString().split('T')[0];
            const formatter = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            const currentTime = formatter.format(new Date()).replace(/\./g, ':');

            // Gunakan jadwal_id utama untuk 1 sesi pertemuan ini (1 jurnal mengajar per pertemuan)
            const primaryJadwalId = selections.jadwal_ids[0];

            // Cek apakah jurnal mengajar sudah ada untuk sesi ini pada hari ini
            const existingJurnals = await getJurnalMengajars({
                jadwal_id: `in.(${selections.jadwal_ids.join(',')})`,
                tanggal: `eq.${todayDate}`
            });

            let jurnalId: number;

            if (existingJurnals && existingJurnals.length > 0) {
                const primaryJurnal = existingJurnals[0];
                jurnalId = primaryJurnal.jurnal_id;
                const finalDetailId = actualDetailId || primaryJurnal.lesson_plan_detail_id || existingJurnalData?.jurnal?.lesson_plan_detail_id;

                if (!finalDetailId) {
                    throw new Error("Gagal menyimpan: Detail RPP terverifikasi untuk pertemuan ini tidak ditemukan.");
                }

                await updateJurnalMengajar(jurnalId, {
                    lesson_plan_detail_id: finalDetailId,
                    pertemuan_ke: selections.pertemuan,
                    catatan_tambahan: catatan.trim()
                });

                // Hapus duplikat jurnal lama (jika sebelumnya pernah terlanjur tersimpan per jam)
                if (existingJurnals.length > 1) {
                    for (let i = 1; i < existingJurnals.length; i++) {
                        try {
                            await deleteJurnalMengajar(existingJurnals[i].jurnal_id);
                        } catch (e) {
                            console.error("Gagal menghapus duplikat jurnal:", e);
                        }
                    }
                }
            } else {
                const finalDetailId = actualDetailId || existingJurnalData?.jurnal?.lesson_plan_detail_id;
                if (!finalDetailId) {
                    throw new Error("Gagal menyimpan: Detail RPP terverifikasi untuk pertemuan ini tidak ditemukan.");
                }

                const jurnalResponse = await createJurnalMengajar({
                    jadwal_id: primaryJadwalId,
                    lesson_plan_detail_id: finalDetailId,
                    pertemuan_ke: selections.pertemuan,
                    tanggal: todayDate,
                    catatan_tambahan: catatan.trim()
                });
                jurnalId = jurnalResponse.jurnal_id;
            }

            // Simpan absensi siswa (1 set absensi per jurnal mengajar)
            const existingAbsensi = await getAbsensiPelajarans({
                jurnal_id: `eq.${jurnalId}`
            });
            const existingAbsensiMap = new Map(existingAbsensi.map(a => [a.siswa_id, a.absensi_pel_id]));

            const absensiPromises = siswas.map(s => {
                const existingId = existingAbsensiMap.get(s.siswa_id);
                if (existingId) {
                    return updateAbsensiPelajaran(existingId, {
                        status: absensiMap[s.siswa_id] || 'Hadir',
                        waktu_kehadiran: currentTime
                    });
                } else {
                    return createAbsensiPelajaran({
                        siswa_id: s.siswa_id,
                        jurnal_id: jurnalId,
                        status: absensiMap[s.siswa_id] || 'Hadir',
                        waktu_kehadiran: currentTime
                    });
                }
            });

            await Promise.all(absensiPromises);
        },
        onSuccess: () => {
            toast.success("Absensi dan Jurnal berhasil disimpan!");
            queryClient.invalidateQueries({ queryKey: ['kbm', 'jurnals-index'] });
            queryClient.invalidateQueries({ queryKey: ['kbm', 'existing-jurnal', selections.jadwal_ids?.[0], todayDate] });
            setCurrentStep(1);
        },
        onError: (error: any) => {
            const errMsg = error?.response?.data?.message || error?.message || "Absensi gagal disimpan. Periksa koneksi dan coba lagi.";
            toast.error(errMsg);
        }
    });

    const handleStatusChange = (siswa_id: number, status: any) => {
        setAbsensiMap(prev => ({ ...prev, [siswa_id]: status }));
    };

    const isEditMode = !!(existingJurnalData?.jurnal);

    return {
        absensiMap,
        catatan,
        setCatatan,
        siswas,
        isLoading,
        isEditMode,
        canCreate,
        canUpdate,
        submitMutation,
        handleStatusChange
    };
}
