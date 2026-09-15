import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Lock, PlusCircle } from "lucide-react";
import type { AbsensiState } from "../Index";
import { useFormAbsensi } from "../hooks/useFormAbsensi";

interface FormAbsensiProps {
    selections: AbsensiState;
    setCurrentStep: (step: number) => void;
}

export default function FormAbsensi({ selections, setCurrentStep }: FormAbsensiProps) {
    const {
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
    } = useFormAbsensi({ selections, setCurrentStep });

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-start space-x-3 mb-6">
                <Button variant="ghost" size="icon" onClick={() => setCurrentStep(2)}><ArrowLeft className="w-5 h-5" /></Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-bold">Input Absensi & Jurnal</h2>
                        {isEditMode ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-full text-xs font-bold">
                                <Lock className="w-3.5 h-3.5 text-slate-500" />
                                Pertemuan Ke-{selections.pertemuan} (Terkunci)
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold">
                                <PlusCircle className="w-3 h-3" />
                                Pertemuan Baru
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Kelas: {selections.kelas_nama} · Mapel: {selections.mapel_nama} · Pertemuan ke-{selections.pertemuan}</p>
                    {isEditMode && (
                        <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> Pertemuan ini sudah selesai dilakukan dan otomatis terkunci. Data tidak dapat diedit kembali.
                        </p>
                    )}
                </div>
            </div>


            <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-50 border-b text-gray-700">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Nama Siswa</th>
                            <th className="px-6 py-4 font-semibold text-center">Hadir</th>
                            <th className="px-6 py-4 font-semibold text-center">Sakit</th>
                            <th className="px-6 py-4 font-semibold text-center">Izin</th>
                            <th className="px-6 py-4 font-semibold text-center">Alpha</th>
                            <th className="px-6 py-4 font-semibold text-center">Dispen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                        {siswas.map((s, idx) => (
                            <tr key={s.siswa_id} className="hover:bg-blue-50/50 transition-colors">
                                <td className="px-6 py-3 font-medium text-gray-800">
                                    {idx + 1}. {s.nama}
                                    <div className="text-xs font-normal text-gray-400 mt-0.5">NIS: {s.nis}</div>
                                </td>
                                {['Hadir', 'Sakit', 'Izin', 'Alpha', 'Dispen'].map((status) => (
                                    <td key={status} className="px-6 py-3 text-center">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="radio"
                                                disabled={isEditMode}
                                                name={`status_${s.siswa_id}`}
                                                className={`w-5 h-5 ${isEditMode ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${
                                                    status === 'Hadir' ? 'accent-emerald-500' :
                                                    status === 'Sakit' ? 'accent-amber-500' :
                                                    status === 'Izin' ? 'accent-blue-500' :
                                                    status === 'Alpha' ? 'accent-rose-500' :
                                                    'accent-purple-500'
                                                }`}
                                                checked={absensiMap[s.siswa_id] === status}
                                                onChange={() => !isEditMode && handleStatusChange(s.siswa_id, status)}
                                            />
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {siswas.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">
                                    Belum ada data siswa di kelas ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="space-y-3 p-5 bg-gray-50 border rounded-xl">
                <label className="font-semibold text-gray-700">Catatan Jurnal Mengajar (Opsional)</label>
                <Input
                    disabled={isEditMode}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Contoh: Pembelajaran berjalan lancar, 2 siswa absen..."
                    className={`bg-white ${isEditMode ? 'cursor-not-allowed bg-slate-100 text-slate-500' : ''}`}
                />
            </div>

            <div className="flex justify-end pt-4">
                {(canCreate || canUpdate) && (
                    <Button
                        onClick={() => submitMutation.mutate()}
                        disabled={submitMutation.isPending || siswas.length === 0 || isEditMode}
                        size="lg"
                        className={`w-full sm:w-auto min-w-50 ${isEditMode ? 'bg-slate-400 text-white cursor-not-allowed opacity-80' : 'bg-[#243B7A] hover:bg-[#1a2b5a]'}`}
                    >
                        {submitMutation.isPending
                            ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Menyimpan...</>
                            : isEditMode
                                ? <><Lock className="w-4 h-4 mr-2" /> Pertemuan Terkunci</>
                                : "Simpan Absensi & Jurnal"
                        }
                    </Button>
                )}
            </div>
        </div>
    );
}