import React from 'react';
import type { AbsensiHarianState } from '../Index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Calendar as CalendarIcon, Loader2, Lock, LockOpen, CheckCircle2 } from 'lucide-react';
import { useFormAbsensiHarian } from '../hooks/useFormAbsensiHarian';

interface FormAbsensiProps {
    selections: AbsensiHarianState;
    setSelections: React.Dispatch<React.SetStateAction<AbsensiHarianState>>;
    onBack?: () => void;
}

const STATUS_OPTIONS = ['Hadir', 'Sakit', 'Izin', 'Alpha', 'Dispen'] as const;

export default function FormAbsensi({ selections, setSelections, onBack }: FormAbsensiProps) {
    const {
        siswas,
        isLoading,
        absensiMap,
        isLocked,
        setIsLocked,
        handleStatusChange,
        submitMutation
    } = useFormAbsensiHarian({ selections });

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    const handleSave = () => {
        submitMutation.mutate();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-start space-x-3 mb-6">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                )}
                <div className="flex-1">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        Input Absensi Kehadiran Harian
                        {isLocked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Tersimpan &amp; Terkunci
                            </span>
                        )}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Kelas: {selections.kelas_nama}</p>
                </div>
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <Input 
                        type="date" 
                        value={selections.tanggal}
                        onChange={(e) => setSelections({ ...selections, tanggal: e.target.value })}
                        className="w-40"
                        disabled={isLocked}
                    />
                </div>
            </div>

            {/* Banner informasi status terkunci */}
            {isLocked && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-emerald-800">Absensi sudah tersimpan dan dikunci</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                            Data absensi untuk kelas ini pada tanggal {selections.tanggal} telah berhasil disimpan.
                            Klik &quot;Edit Ulang&quot; jika perlu melakukan koreksi.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsLocked(false)}
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 shrink-0 gap-1.5"
                    >
                        <LockOpen className="w-3.5 h-3.5" />
                        Edit Ulang
                    </Button>
                </div>
            )}

            <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-50 border-b text-gray-700">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Nama Siswa</th>
                            {STATUS_OPTIONS.map(status => (
                                <th key={status} className="px-6 py-4 font-semibold text-center">{status}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y bg-white ${isLocked ? 'opacity-70' : ''}`}>
                        {siswas.map((s, idx) => (
                            <tr key={s.siswa_id} className={`transition-colors ${isLocked ? 'bg-gray-50/50' : 'hover:bg-blue-50/50'}`}>
                                <td className="px-6 py-3 font-medium text-gray-800">
                                    {idx + 1}. {s.nama}
                                    <div className="text-xs font-normal text-gray-400 mt-0.5">NIS: {s.nis}</div>
                                </td>
                                {STATUS_OPTIONS.map((status) => (
                                    <td key={status} className="px-6 py-3 text-center">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="radio"
                                                name={`status_${s.siswa_id}`}
                                                className={`w-5 h-5 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                                                    status === 'Hadir' ? 'accent-emerald-500' :
                                                    status === 'Sakit' ? 'accent-amber-500' :
                                                    status === 'Izin' ? 'accent-blue-500' :
                                                    status === 'Alpha' ? 'accent-rose-500' :
                                                    'accent-purple-500'
                                                }`}
                                                checked={absensiMap[s.siswa_id] === status}
                                                onChange={() => !isLocked && handleStatusChange(s.siswa_id, status)}
                                                disabled={isLocked}
                                            />
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {siswas.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">
                                    Tidak ada data siswa di kelas ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end pt-4">
                {isLocked ? (
                    <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                        <Lock className="w-4 h-4" />
                        <span>Absensi telah disimpan</span>
                    </div>
                ) : (
                    <Button 
                        onClick={handleSave} 
                        disabled={submitMutation.isPending || siswas.length === 0}
                        className="bg-[#1E3A8A] hover:bg-[#1e3a8ad2] px-8"
                    >
                        {submitMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Simpan Absensi
                    </Button>
                )}
            </div>
        </div>
    );
}
