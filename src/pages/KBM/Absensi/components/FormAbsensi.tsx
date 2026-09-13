import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, PenLine, PlusCircle } from "lucide-react";
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
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                                <PenLine className="w-3 h-3" />
                                Memperbarui Pertemuan Ke-{selections.pertemuan}
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
                        <p className="text-xs text-amber-600 mt-1 font-medium">
                            ⚠️ Pertemuan ini sudah memiliki catatan absensi. Data ditampilkan dari jurnal sebelumnya. Simpan kembali untuk memperbarui data.
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
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Contoh: Pembelajaran berjalan lancar, 2 siswa absen..."
                    className="bg-white"
                />
            </div>

            <div className="flex justify-end pt-4">
                {(canCreate || canUpdate) && (
                    <Button
                        onClick={() => submitMutation.mutate()}
                        disabled={submitMutation.isPending || siswas.length === 0}
                        size="lg"
                        className={`w-full sm:w-auto min-w-50 ${isEditMode ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                    >
                        {submitMutation.isPending
                            ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Menyimpan...</>
                            : isEditMode
                                ? "Perbarui Absensi & Jurnal"
                                : "Simpan Absensi & Jurnal"
                        }
                    </Button>
                )}
            </div>
        </div>
    );
}