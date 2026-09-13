import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { getLessonPlans } from "@/lib/api/services/kbmService";
import { getJadwalPelajarans } from "@/lib/api/services/akademikService";
import type { AbsensiState } from "../Index";

export function isLPForSubjectAndClass(lpTitleRaw: string, mapelNamaRaw: string, kelasNamaRaw: string): boolean {
    if (!lpTitleRaw || !mapelNamaRaw || !kelasNamaRaw) return false;

    const lpTitle = lpTitleRaw.trim().toLowerCase();
    const mapelNama = mapelNamaRaw.trim().toLowerCase();
    const kelasNama = kelasNamaRaw.trim().toLowerCase();

    // 1. Must contain/match subject name
    if (!lpTitle.includes(mapelNama)) return false;

    // 2. Check for class specification after dash (- or –)
    const dashParts = lpTitle.split(/[-–]/);
    if (dashParts.length > 1) {
        const classPart = dashParts.slice(1).join(" ").trim();
        if (!classPart) return true;

        const specifiedClasses = classPart.split(',').map(c => c.trim().toLowerCase());
        return specifiedClasses.some(c => c === kelasNama || c.includes(kelasNama));
    }

    // 3. Generic LP title without class specification, matches all classes for this mapel
    return true;
}

interface UseWizardMenuProps {
    currentStep: number;
    setCurrentStep: (step: number) => void;
    selections: AbsensiState;
}

export function useWizardMenu({ currentStep, setCurrentStep, selections }: UseWizardMenuProps) {
    const nextStep = () => setCurrentStep(currentStep + 1);
    const prevStep = () => setCurrentStep(currentStep - 1);

    const { role, user, lembaga_id } = useAuthStore();
    const pegawai_id = user?.pegawai_id;

    // 1. Fetch Jadwal Mengajar & validasi lesson plan guru lain (Rule 1)
    const { data: sesiList = [], isLoading: isLoadingJadwal } = useQuery({
        queryKey: ['kbm', 'absensi', 'jadwals_v5', role, pegawai_id, lembaga_id],
        queryFn: async () => {
            const params: Record<string, string> = { select: "jadwal_id,hari,pegawai_id,kelas:kelas_id(kelas_id,nama_kelas,lembaga_id),mapel:mapel_id(mapel_id,nama_mapel),jam_mulai:jam_akademik!jam_mulai_id(urutan_jam,jam_mulai)" };
            
            const isGlobalRole = ['Super Admin', 'Direktur', 'Admin Lembaga', 'WaKa Kurikulum'].includes(role || '');
            if (!isGlobalRole && pegawai_id) {
                // Filter pegawai di DB level agar data yang ditarik lebih kecil
                params['pegawai_id'] = `eq.${pegawai_id}`;
            }

            const [res, allLPs] = await Promise.all([
                getJadwalPelajarans(params),
                // Gunakan getLessonPlans biasa (bukan getAllLessonPlans pagination loop)
                // hanya ambil fields yang diperlukan, sudah cukup untuk validasi LP
                getLessonPlans({ select: "lesson_plan_id,pegawai_id,judul_rpp,status_verifikasi_kepsek,status_verifikasi_direktur" })
            ]);

            // Filter berdasarkan lembaga_id dan status validitas Lesson Plan mapel & kelas tersebut
            let filtered = res.map((j: any) => {
                const matchedForJ = (allLPs || []).filter((lp: any) => {
                    const isGlobalRole = ['Super Admin', 'Direktur', 'Admin Lembaga', 'WaKa Kurikulum'].includes(role || '');
                    if (!isGlobalRole && Number(lp.pegawai_id) !== Number(pegawai_id)) return false;

                    return isLPForSubjectAndClass(lp.judul_rpp, j.mapel?.nama_mapel, j.kelas?.nama_kelas);
                });

                const userHasVerified = matchedForJ.some((lp: any) =>
                    (role && ['Super Admin', 'Direktur', 'Admin Lembaga', 'WaKa Kurikulum'].includes(role) || Number(lp.pegawai_id) === Number(pegawai_id)) &&
                    lp.status_verifikasi_kepsek === 'Disetujui' && lp.status_verifikasi_direktur === 'Disetujui'
                );

                const hasAnyVerified = matchedForJ.some((lp: any) =>
                    lp.status_verifikasi_kepsek === 'Disetujui' && lp.status_verifikasi_direktur === 'Disetujui'
                );

                const hasAnyUnverified = matchedForJ.some((lp: any) =>
                    lp.status_verifikasi_kepsek !== 'Disetujui' || lp.status_verifikasi_direktur !== 'Disetujui'
                );

                return {
                    ...j,
                    lpStatus: {
                        userHasVerified,
                        hasAnyVerified,
                        hasAnyUnverified,
                        othersWithVerified: []
                    }
                };
            }).filter((j: any) => {
                // Sembunyikan jadwal yang belum diisi mata pelajaran
                if (!j.mapel) return false;

                // Filter lembaga: filter di JS karena kelas embed tidak bisa difilter di DB langsung
                const matchLembaga = !lembaga_id || Number(j.kelas?.lembaga_id) === Number(lembaga_id);
                if (!matchLembaga) return false;

                // Double-check pegawai untuk global role
                const isGlobalRole = ['Super Admin', 'Direktur', 'Admin Lembaga', 'WaKa Kurikulum'].includes(role || '');
                if (!isGlobalRole && Number(j.pegawai_id) !== Number(pegawai_id)) return false;

                return true;
            });

            const sortedJadwals = filtered.sort((a: any, b: any) => {
                const urutanA = a.jam_mulai?.urutan_jam || 0;
                const urutanB = b.jam_mulai?.urutan_jam || 0;
                return urutanA - urutanB;
            });

            // Grouping logic
            const groups = new Map<string, any[]>();
            sortedJadwals.forEach((j: any) => {
                const key = `${j.kelas?.kelas_id}_${j.mapel?.mapel_id}_${j.pegawai_id}_${j.hari}`;
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key)!.push(j);
            });

            const groupedSesiList: any[] = [];
            groups.forEach((groupJadwals, key) => {
                if (groupJadwals.length === 0) return;

                const first = groupJadwals[0];
                const urutanList = groupJadwals
                    .map((s: any) => s.jam_mulai?.urutan_jam)
                    .filter((u: any) => typeof u === 'number')
                    .sort((a: number, b: number) => a - b);

                const urutanFirst = urutanList[0] || 0;
                const urutanLast = urutanList[urutanList.length - 1] || 0;
                const isContiguous = urutanList.length > 1 && (urutanLast - urutanFirst === urutanList.length - 1);

                let label_jam = "";
                if (urutanList.length === 1) {
                    label_jam = `Jam ${urutanFirst}`;
                } else if (isContiguous) {
                    label_jam = `Jam ${urutanFirst}-${urutanLast}`;
                } else {
                    label_jam = `Jam ${urutanList.join(', ')}`;
                }

                // Gunakan allLPs dari closure query di atas (tidak perlu fetch ulang)
                const matchedLPs = (allLPs || []).filter((lp: any) => {
                    const isDisetujui = lp.status_verifikasi_kepsek === 'Disetujui' && lp.status_verifikasi_direktur === 'Disetujui';
                    if (!isDisetujui) return false;

                    const isGlobalRole = ['Super Admin', 'Direktur', 'Admin Lembaga', 'WaKa Kurikulum'].includes(role || '');
                    if (!isGlobalRole && Number(lp.pegawai_id) !== Number(pegawai_id)) return false;

                    return isLPForSubjectAndClass(lp.judul_rpp, first.mapel?.nama_mapel, first.kelas?.nama_kelas);
                });

                groupedSesiList.push({
                    sesi_key: key,
                    jadwal_ids: groupJadwals.map((s: any) => s.jadwal_id),
                    hari: first.hari,
                    jam_mulai_display: first.jam_mulai?.jam_mulai?.substring(0, 5) || "—",
                    kelas: first.kelas,
                    mapel: first.mapel,
                    lpStatus: first.lpStatus,
                    matchedLPs,
                    label_jam
                });
            });

            return groupedSesiList.sort((a: any, b: any) => {
                const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                if (a.hari !== b.hari) return days.indexOf(a.hari) - days.indexOf(b.hari);
                const urutanA = parseInt(a.label_jam.replace('Jam ', '').split('-')[0]) || 0;
                const urutanB = parseInt(b.label_jam.replace('Jam ', '').split('-')[0]) || 0;
                return urutanA - urutanB;
            });
        }
    });

    // 2. Fetch all verified Lesson Plans — dipisah agar bisa di-share dengan sesiList query via cache
    // PENTING: queryKey sama dengan yang di dalam sesiList agar TanStack Query dapat meng-cache-nya
    const { data: allLessonPlans = [], isLoading: isLoadingLP } = useQuery({
        queryKey: ['kbm', 'absensi', 'all_lesson_plans_v5', role, pegawai_id],
        queryFn: async () => {
            // Filter di DB langsung: hanya LP yang sudah disetujui penuh
            // dan milik pegawai ini (kecuali global role)
            const isGlobalRole = ['Super Admin', 'Direktur', 'Admin Lembaga', 'WaKa Kurikulum'].includes(role || '');
            const params: Record<string, any> = {
                select: "lesson_plan_id,pegawai_id,judul_rpp,status_verifikasi_kepsek,status_verifikasi_direktur,lesson_plan_detail(detail_id,pertemuan_ke)",
                status_verifikasi_kepsek: "eq.Disetujui",
                status_verifikasi_direktur: "eq.Disetujui",
                order: "lesson_plan_id.desc",
            };
            if (!isGlobalRole && pegawai_id) {
                params.pegawai_id = `eq.${pegawai_id}`;
            }
            return await getLessonPlans(params);
        }
    });

    // Hitung jumlah detail pertemuan dari lesson plan yang dipilih
    const selectedLP = React.useMemo(() =>
        allLessonPlans.find((lp: any) => lp.lesson_plan_id === selections.lesson_plan_detail_id),
        [allLessonPlans, selections.lesson_plan_detail_id]
    );
    const maxPertemuan = selectedLP ? (selectedLP as any).lesson_plan_detail?.length || 16 : 16;

    const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const today = days[new Date().getDay()];

    return {
        role,
        pegawai_id,
        lembaga_id,
        sesiList,
        isLoadingJadwal,
        allLessonPlans,
        isLoadingLP,
        selectedLP,
        maxPertemuan,
        today,
        nextStep,
        prevStep
    };
}
