import React from 'react';
import type { AbsensiHarianState } from '../Index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
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
                    />
                </div>
            </div>

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
                    <tbody className="divide-y bg-white">
                        {siswas.map((s, idx) => (
                            <tr key={s.siswa_id} className="hover:bg-blue-50/50 transition-colors">
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
                                                className={`w-5 h-5 cursor-pointer ${
                                                    status === 'Hadir' ? 'accent-emerald-500' :
                                                    status === 'Sakit' ? 'accent-amber-500' :
                                                    status === 'Izin' ? 'accent-blue-500' :
                                                    status === 'Alpha' ? 'accent-rose-500' :
                                                    'accent-purple-500'
                                                }`}
                                                checked={absensiMap[s.siswa_id] === status}
                                                onChange={() => handleStatusChange(s.siswa_id, status)}
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
            </div>
        </div>
    );
}
