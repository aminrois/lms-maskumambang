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

    // Load jurnal + absensi yang sudah ada untuk pertemuan ini pada jadwal ini
    const firstJadwalId = selections.jadwal_ids?.[0] || null;
    const pertemuan = selections.pertemuan;
    const { data: existingJurnalData, isLoading: isLoadingExistingJurnal } = useQuery({
        queryKey: ['kbm', 'existing-jurnal', firstJadwalId, pertemuan],
        queryFn: async () => {
            if (!firstJadwalId || !pertemuan) return null;
            const jurnals = await getJurnalMengajars({
                jadwal_id: `in.(${selections.jadwal_ids.join(',')})`,
                pertemuan_ke: `eq.${pertemuan}`
            });
            if (!jurnals || jurnals.length === 0) return null;
            const jurnal = jurnals[0];

            // Load absensi yang sudah ada untuk jurnal ini
            const absensiList = (jurnal as any).absensi_pelajaran || await getAbsensiPelajarans({
                jurnal_id: `eq.${jurnal.jurnal_id}`
            });
            return { jurnal, absensiList };
        },
        enabled: !!firstJadwalId && !!pertemuan
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

    // Fetch info jam akademik jadwal untuk perhitungan kedisiplinan guru
    const { data: jadwalTimeInfoList = [] } = useQuery({
        queryKey: ['kbm', 'jadwal-time-info', selections.jadwal_ids],
        queryFn: async () => {
            if (!selections.jadwal_ids || selections.jadwal_ids.length === 0) return [];
            const { restClient } = await import('@/lib/api/axios');
            try {
                const res = await restClient.get('/jadwal_pelajaran', {
                    params: {
                        jadwal_id: `in.(${selections.jadwal_ids.join(',')})`,
                        select: 'jadwal_id,hari,jam_mulai:jam_akademik!jam_mulai_id(jam_mulai,jam_selesai,urutan_jam),jam_selesai:jam_akademik!jam_selesai_id(jam_mulai,jam_selesai,urutan_jam)'
                    }
                });
                return res.data || [];
            } catch (_) {
                return [];
            }
        },
        enabled: !!selections.jadwal_ids && selections.jadwal_ids.length > 0
    });

    // Helper untuk menghitung status disiplin
    const getDisiplinStatus = () => {
        const formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const currentTime = formatter.format(new Date()).replace(/\./g, ':');

        const startTimes: string[] = [];
        const endTimes: string[] = [];

        jadwalTimeInfoList.forEach((j: any) => {
            if (j.jam_mulai?.jam_mulai) startTimes.push(j.jam_mulai.jam_mulai);
            if (j.jam_selesai?.jam_selesai) {
                endTimes.push(j.jam_selesai.jam_selesai);
            } else if (j.jam_mulai?.jam_selesai) {
                endTimes.push(j.jam_mulai.jam_selesai);
            }
        });

        if (startTimes.length === 0 || endTimes.length === 0) {
            return {
                status: 'Tepat Waktu' as const,
                keterangan: `Absensi dilakukan pukul ${currentTime.substring(0, 5)} WIB`,
                jamMulai: null,
                jamSelesai: null,
                jamInput: currentTime.substring(0, 5)
            };
        }

        startTimes.sort();
        endTimes.sort();

        const earliestStart = startTimes[0];
        const latestEnd = endTimes[endTimes.length - 1];

        const toMinutes = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return (h || 0) * 60 + (m || 0);
        };

        const currentMin = toMinutes(currentTime);
        const startMin = toMinutes(earliestStart);
        const endMin = toMinutes(latestEnd);

        const startDisplay = earliestStart.substring(0, 5);
        const endDisplay = latestEnd.substring(0, 5);
        const currentDisplay = currentTime.substring(0, 5);

        let status: 'Tepat Waktu' | 'Terlambat' | 'Terlalu Cepat' = 'Tepat Waktu';
        let keterangan = '';

        if (currentMin < startMin) {
            status = 'Terlalu Cepat';
            keterangan = `Absensi dilakukan pukul ${currentDisplay} WIB (Sebelum jadwal mulai ${startDisplay})`;
        } else if (currentMin > endMin) {
            status = 'Terlambat';
            keterangan = `Absensi dilakukan pukul ${currentDisplay} WIB (Melewati jadwal selesai ${endDisplay})`;
        } else {
            status = 'Tepat Waktu';
            keterangan = `Absensi dilakukan pukul ${currentDisplay} WIB (Sesuai jadwal ${startDisplay} - ${endDisplay})`;
        }

        return {
            status,
            keterangan,
            jamMulai: startDisplay,
            jamSelesai: endDisplay,
            jamInput: currentDisplay
        };
    };

    const submitMutation = useMutation({
        mutationFn: async () => {
            if (!selections.jadwal_ids || selections.jadwal_ids.length === 0 || !selections.pertemuan) {
                throw new Error("Data Jadwal atau Pertemuan tidak lengkap.");
            }

            // Hitung status kedisiplinan guru saat absensi disubmit
            const disiplin = getDisiplinStatus();

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

            const INDONESIAN_DAYS = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const todayDayIndex = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getDay();
            const todayDayName = INDONESIAN_DAYS[todayDayIndex];
            const scheduleDay = jadwalTimeInfoList[0]?.hari;

            if (scheduleDay && scheduleDay !== todayDayName && !existingJurnalData?.jurnal) {
                throw new Error(`Batas waktu pengisian absensi telah berakhir (hanya dapat diisi pada hari ${scheduleDay} maksimal pukul 23:59 WIB). Pertemuan ini telah dikunci.`);
            }

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

            // Cek apakah jurnal mengajar sudah ada untuk sesi ini pada pertemuan ini
            const existingJurnals = await getJurnalMengajars({
                jadwal_id: `in.(${selections.jadwal_ids.join(',')})`,
                pertemuan_ke: `eq.${selections.pertemuan}`
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
                    tanggal: primaryJurnal.tanggal || todayDate,
                    status: disiplin.status,
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
                    status: disiplin.status,
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
            const disiplin = getDisiplinStatus();
            toast.success(`Absensi berhasil disimpan! Status Kedisiplinan: ${disiplin.status}`, {
                description: disiplin.keterangan
            });
            queryClient.invalidateQueries({ queryKey: ['kbm', 'jurnals-index'] });
            queryClient.invalidateQueries({ queryKey: ['kbm', 'jurnal_monitoring'] });
            queryClient.invalidateQueries({ queryKey: ['kbm', 'absensi'] });
            queryClient.invalidateQueries({ queryKey: ['kbm', 'existing-jurnal'] });
            queryClient.invalidateQueries({ queryKey: ['kbm', 'rekap-jurnals-raw'] });
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

    // Pertemuan hanya terkunci jika data absensi SUDAH DIISI (ada minimal 1 data absensi)
    const isEditMode = !!(existingJurnalData?.jurnal && existingJurnalData.absensiList && existingJurnalData.absensiList.length > 0);
    const disiplinInfo = getDisiplinStatus();

    const INDONESIAN_DAYS = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayDayIndex = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getDay();
    const todayDayName = INDONESIAN_DAYS[todayDayIndex];
    const scheduleDay = jadwalTimeInfoList[0]?.hari || null;
    const isLockedByDeadline = Boolean(scheduleDay && scheduleDay !== todayDayName && !existingJurnalData?.jurnal);

    return {
        absensiMap,
        catatan,
        setCatatan,
        siswas,
        isLoading,
        isEditMode,
        isLockedByDeadline,
        scheduleDay,
        disiplinInfo,
        canCreate,
        canUpdate,
        submitMutation,
        handleStatusChange
    };
}
