import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { getLessonPlans, getJurnalMengajars } from "@/lib/api/services/kbmService";
import { getJadwalPelajarans } from "@/lib/api/services/akademikService";
import { restClient } from "@/lib/api/axios";
import type { AbsensiState } from "../Index";

function normalizeText(text: string): string {
    return (text || '')
        .toLowerCase()
        .replace(/['’`]/g, "'")
        .replace(/&/g, 'dan')
        .replace(/\s+/g, ' ')
        .trim();
}

function cleanRomanNumeral(str: string): string {
    return str.replace(/\b(iv|iii|ii|i)\b/gi, '').replace(/\s+/g, ' ').trim();
}

export function isLPForSubjectAndClass(lpTitleRaw: string, mapelNamaRaw: string, kelasNamaRaw: string): boolean {
    if (!lpTitleRaw || !mapelNamaRaw || !kelasNamaRaw) return false;

    const lpTitle = normalizeText(lpTitleRaw);
    const mapelNama = normalizeText(mapelNamaRaw);
    const kelasNama = normalizeText(kelasNamaRaw);

    const baseLPTitle = cleanRomanNumeral(lpTitle);
    const baseMapelNama = cleanRomanNumeral(mapelNama);

    // 1. Must contain/match subject name
    const matchMapel = lpTitle.includes(mapelNama) || baseLPTitle.includes(baseMapelNama) || baseMapelNama.includes(baseLPTitle);
    if (!matchMapel) return false;

    // 2. Check for class specification after dash (- or –)
    const dashParts = lpTitleRaw.split(/[-–]/);
    if (dashParts.length > 1) {
        const classPart = normalizeText(dashParts.slice(1).join(" "));
        if (!classPart) return true;

        const specifiedClasses = classPart.split(/[,/]/).map(c => c.trim());
        return specifiedClasses.some(c => c === kelasNama || c.includes(kelasNama) || kelasNama.includes(c));
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
        queryKey: ['kbm', 'absensi', 'jadwals_v6', role, pegawai_id, lembaga_id],
        queryFn: async () => {
            const isGlobalRole = ['Super Admin', 'Direktur', 'Admin Lembaga', 'WaKa Kurikulum'].includes(role || '');
            const params: Record<string, string> = { select: "jadwal_id,hari,pegawai_id,kelas:kelas_id(kelas_id,nama_kelas,lembaga_id),mapel:mapel_id(mapel_id,nama_mapel),jam_mulai:jam_akademik!jam_mulai_id(urutan_jam,jam_mulai)" };
            
            if (!isGlobalRole && pegawai_id) {
                params['pegawai_id'] = `eq.${pegawai_id}`;
            }

            const lpParams: Record<string, any> = {
                select: "lesson_plan_id,pegawai_id,jadwal_id,judul_rpp,status_verifikasi_kepsek,status_verifikasi_direktur,lesson_plan_detail(detail_id,pertemuan_ke)",
                limit: 5000
            };
            if (!isGlobalRole && pegawai_id) {
                lpParams['pegawai_id'] = `eq.${pegawai_id}`;
            }

            const [res, allLPs] = await Promise.all([
                getJadwalPelajarans(params),
                getLessonPlans(lpParams)
            ]);

            // Filter berdasarkan lembaga_id dan status validitas Lesson Plan mapel & kelas tersebut
            let filtered = res.map((j: any) => {
                const matchedForJ = (allLPs || []).filter((lp: any) => {
                    if (!isGlobalRole && Number(lp.pegawai_id) !== Number(pegawai_id)) return false;

                    if (lp.jadwal_id && Number(lp.jadwal_id) === Number(j.jadwal_id)) {
                        return true;
                    }

                    return isLPForSubjectAndClass(lp.judul_rpp, j.mapel?.nama_mapel, j.kelas?.nama_kelas);
                });

                const userHasVerified = matchedForJ.some((lp: any) =>
                    (isGlobalRole || Number(lp.pegawai_id) === Number(pegawai_id)) &&
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

                // Double-check pegawai untuk non-global role
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

                // Gunakan allLPs dari closure query di atas
                const matchedLPs = (allLPs || []).filter((lp: any) => {
                    const isDisetujui = lp.status_verifikasi_kepsek === 'Disetujui' && lp.status_verifikasi_direktur === 'Disetujui';
                    if (!isDisetujui) return false;

                    if (!isGlobalRole && Number(lp.pegawai_id) !== Number(pegawai_id)) return false;

                    const groupJadwalIds = groupJadwals.map((s: any) => Number(s.jadwal_id));
                    if (lp.jadwal_id && groupJadwalIds.includes(Number(lp.jadwal_id))) {
                        return true;
                    }

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
                limit: 1000,
            };
            if (!isGlobalRole && pegawai_id) {
                params.pegawai_id = `eq.${pegawai_id}`;
            }
            return await getLessonPlans(params);
        }
    });

    // Hitung jumlah detail pertemuan dari lesson plan yang dipilih
    const selectedLP = useMemo(() =>
        allLessonPlans.find((lp: any) => lp.lesson_plan_id === selections.lesson_plan_detail_id),
        [allLessonPlans, selections.lesson_plan_detail_id]
    );
    const maxPertemuan = selectedLP ? (selectedLP as any).lesson_plan_detail?.length || 16 : 16;

    // 3. Fetch completed pertemuan untuk jadwal/sesi ini (lock hanya pertemuan yang SUDAH DIISI absensinya)
    const { data: completedPertemuans = [], isLoading: isLoadingCompleted } = useQuery({
        queryKey: ['kbm', 'absensi', 'completed_pertemuan', selections.jadwal_ids, selections.kelas_id, selections.mapel_id],
        queryFn: async () => {
            if (!selections.jadwal_ids || selections.jadwal_ids.length === 0) return [];

            // Fetch jurnal mengajar untuk jadwal ini (sudah include absensi_pelajaran)
            const jurnals = await getJurnalMengajars({
                jadwal_id: `in.(${selections.jadwal_ids.join(',')})`,
            });

            if (!jurnals || jurnals.length === 0) return [];

            const lockedPertemuans: number[] = [];
            for (const j of jurnals as any[]) {
                if (!j.jurnal_id || !j.pertemuan_ke) continue;
                // Cek relasi absensi_pelajaran
                if (Array.isArray(j.absensi_pelajaran)) {
                    if (j.absensi_pelajaran.length > 0) {
                        lockedPertemuans.push(Number(j.pertemuan_ke));
                    }
                } else {
                    // Fallback jika absensi_pelajaran tidak ter-include
                    try {
                        const absensiRes = await restClient.get(`/absensi_pelajaran?jurnal_id=eq.${j.jurnal_id}&select=absensi_pel_id&limit=1`);
                        if (absensiRes.data && absensiRes.data.length > 0) {
                            lockedPertemuans.push(Number(j.pertemuan_ke));
                        }
                    } catch {
                        // Jangan lock jika gagal
                    }
                }
            }

            return Array.from(new Set(lockedPertemuans));
        },
        enabled: !!(selections.jadwal_ids && selections.jadwal_ids.length > 0)
    });

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
        completedPertemuans,
        isLoadingCompleted,
        today,
        nextStep,
        prevStep
    };
}

