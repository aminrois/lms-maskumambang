import React from 'react';
import type { AbsensiHarianState } from '../Index';
import { Building, Book, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { restClient } from '@/lib/api/axios';
import { useAuthStore } from '@/store/useAuthStore';

interface WizardMenuProps {
    selections: AbsensiHarianState;
    setSelections: React.Dispatch<React.SetStateAction<AbsensiHarianState>>;
    onNext: () => void;
}

export default function WizardMenu({ selections, setSelections, onNext }: WizardMenuProps) {
    const { role, lembaga_id: userLembagaId, user } = useAuthStore();
    
    const isGlobalRole = role === 'Direktur' || role === 'Super Admin';
    const isWaliKelas = role === 'Wali Kelas';

    const pegawai_id = user?.pegawai_id;

    // Fetch Lembaga (hanya untuk Global Role)
    const { data: lembagas = [], isLoading: isLoadingLembaga } = useQuery({
        queryKey: ['options', 'lembaga'],
        queryFn: async () => {
            const res = await restClient.get('/lembaga?select=lembaga_id,nama_lembaga,singkatan');
            return res.data || [];
        },
        enabled: isGlobalRole
    });

    // Determine effective lembaga
    const effectiveLembagaId = isGlobalRole ? selections.lembaga_id : userLembagaId;

    // Set lembaga_id untuk non-global role secara otomatis
    React.useEffect(() => {
        if (!isGlobalRole && userLembagaId && !selections.lembaga_id) {
            setSelections(prev => ({ ...prev, lembaga_id: userLembagaId }));
        }
    }, [isGlobalRole, userLembagaId, selections.lembaga_id, setSelections]);

    // Fetch semua kelas di lembaga (hanya untuk Global Role & Admin Lembaga)
    const { data: kelasesAll = [], isLoading: isLoadingKelasAll } = useQuery({
        queryKey: ['options', 'kelas-all', effectiveLembagaId],
        queryFn: async () => {
            if (!effectiveLembagaId) return [];
            const res = await restClient.get(`/kelas?lembaga_id=eq.${effectiveLembagaId}&select=kelas_id,nama_kelas,lembaga_id&order=nama_kelas.asc`);
            return res.data || [];
        },
        enabled: !!effectiveLembagaId && !isWaliKelas && (isGlobalRole || role === 'Admin Lembaga' || role === 'WaKa Kurikulum')
    });

    // Fetch kelas yang diwalikan (khusus Wali Kelas)
    const { data: kelasWali = [], isLoading: isLoadingKelasWali } = useQuery({
        queryKey: ['options', 'kelas-wali', pegawai_id],
        queryFn: async () => {
            if (!pegawai_id) return [];
            const res = await restClient.get(`/kelas?wali_kelas_id=eq.${pegawai_id}&select=kelas_id,nama_kelas,lembaga_id&order=nama_kelas.asc`);
            return res.data || [];
        },
        enabled: isWaliKelas && !!pegawai_id
    });

    // Fetch kelas dari jadwal mengajar (untuk Guru biasa)
    const { data: kelasGuru = [], isLoading: isLoadingKelasGuru } = useQuery({
        queryKey: ['options', 'kelas-guru-jadwal', pegawai_id, effectiveLembagaId],
        queryFn: async () => {
            if (!pegawai_id) return [];
            const res = await restClient.get(
                `/jadwal_pelajaran?pegawai_id=eq.${pegawai_id}&select=kelas:kelas_id(kelas_id,nama_kelas,lembaga_id)`
            );
            const jadwals: any[] = res.data || [];
            // Ambil kelas unik yang lembaga_id-nya sesuai, filter null
            const seen = new Set<number>();
            return jadwals
                .map((j: any) => j.kelas)
                .filter((k: any) => {
                    if (!k || !k.kelas_id) return false;
                    if (effectiveLembagaId && Number(k.lembaga_id) !== Number(effectiveLembagaId)) return false;
                    if (seen.has(k.kelas_id)) return false;
                    seen.add(k.kelas_id);
                    return true;
                })
                .sort((a: any, b: any) => a.nama_kelas.localeCompare(b.nama_kelas));
        },
        enabled: !isWaliKelas && !isGlobalRole && role !== 'Admin Lembaga' && role !== 'WaKa Kurikulum' && !!pegawai_id
    });

    const handleLembagaSelect = (id: number) => {
        setSelections({ ...selections, lembaga_id: id, kelas_id: null, kelas_nama: "" });
    };

    const handleKelasSelect = (id: number, nama: string, lembagaId?: number) => {
        setSelections({
            ...selections,
            kelas_id: id,
            kelas_nama: nama,
            ...(lembagaId ? { lembaga_id: lembagaId } : {})
        });
    };

    // Tentukan sumber kelas berdasarkan role
    const availableKelas = isWaliKelas
        ? kelasWali
        : (isGlobalRole || role === 'Admin Lembaga' || role === 'WaKa Kurikulum')
            ? kelasesAll
            : kelasGuru;

    const isLoadingKelas = isLoadingKelasAll || isLoadingKelasWali || isLoadingKelasGuru;

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Step 1a: Pilih Lembaga (hanya Global Role) */}
            {isGlobalRole && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                        Pilih Lembaga
                    </h3>
                    {isLoadingLembaga ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" /> Memuat lembaga...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {lembagas.map((l: any) => (
                                <div
                                    key={l.lembaga_id}
                                    onClick={() => handleLembagaSelect(l.lembaga_id)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                        selections.lembaga_id === l.lembaga_id 
                                            ? "border-indigo-600 bg-indigo-50/50" 
                                            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${selections.lembaga_id === l.lembaga_id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                                            <Building className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium">{l.nama_lembaga}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 1b: Pilih Kelas */}
            {(effectiveLembagaId || isWaliKelas) && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">
                            {isGlobalRole ? "2" : "1"}
                        </span>
                        Pilih Kelas
                        {isWaliKelas && (
                            <span className="text-xs text-slate-500 font-normal ml-1">(Kelas yang Anda Wali)</span>
                        )}
                        {!isWaliKelas && !isGlobalRole && role !== 'Admin Lembaga' && role !== 'WaKa Kurikulum' && (
                            <span className="text-xs text-slate-500 font-normal ml-1">(Kelas yang Anda Ampu)</span>
                        )}
                    </h3>
                    {isLoadingKelas ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" /> Memuat kelas...
                        </div>
                    ) : availableKelas.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm">
                            {isWaliKelas
                                ? "Anda belum ditugaskan sebagai wali kelas."
                                : "Tidak ada kelas yang tersedia untuk Anda di lembaga ini."}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {availableKelas.map((k: any) => (
                                <button
                                    key={k.kelas_id}
                                    onClick={() => handleKelasSelect(k.kelas_id, k.nama_kelas, k.lembaga_id)}
                                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                                        selections.kelas_id === k.kelas_id
                                            ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                                    }`}
                                >
                                    <Book className={`w-4 h-4 ${selections.kelas_id === k.kelas_id ? "text-indigo-200" : "text-slate-400"}`} />
                                    {k.nama_kelas}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="pt-6 border-t flex justify-end">
                <Button 
                    onClick={onNext}
                    disabled={!selections.lembaga_id || !selections.kelas_id}
                    className="bg-indigo-600 hover:bg-indigo-700 px-8"
                >
                    Lanjutkan ke Absensi
                </Button>
            </div>
        </div>
    );
}
