import React, { useState } from "react";
import { ClipboardCheck, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { getKelass } from "@/lib/api/services/akademikService";
import WizardMenu from "./components/WizardMenu";
import FormAbsensi from "./components/FormAbsensi";

export interface AbsensiHarianState {
    lembaga_id: number | null;
    kelas_id: number | null;
    kelas_nama: string;
    tanggal: string; // YYYY-MM-DD
}

export default function AbsensiHarianIndex() {
    const { role, user } = useAuthStore();
    const isWaliKelas = role === 'Wali Kelas';
    const pegawai_id = user?.pegawai_id;

    // isWaliKelasLoading: true saat sedang mendeteksi jumlah kelas yang diwalikan
    const [isWaliKelasLoading, setIsWaliKelasLoading] = useState<boolean>(isWaliKelas);
    // waliKelasMultiple: true jika Wali Kelas mengelola lebih dari 1 kelas → perlu step pilih kelas
    const [waliKelasMultiple, setWaliKelasMultiple] = useState<boolean>(false);

    // Step awal ditentukan setelah data kelas Wali Kelas dimuat
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [selections, setSelections] = useState<AbsensiHarianState>({
        lembaga_id: null,
        kelas_id: null,
        kelas_nama: "",
        tanggal: new Date().toISOString().split('T')[0],
    });

    React.useEffect(() => {
        if (isWaliKelas && pegawai_id) {
            setIsWaliKelasLoading(true);
            getKelass({ 'wali_kelas_id': `eq.${pegawai_id}` })
                .then(classes => {
                    if (classes && classes.length === 1) {
                        // Hanya 1 kelas → langsung set dan skip ke step 2
                        setSelections(prev => ({
                            ...prev,
                            kelas_id: classes[0].kelas_id,
                            kelas_nama: classes[0].nama_kelas,
                            lembaga_id: classes[0].lembaga_id
                        }));
                        setWaliKelasMultiple(false);
                        setCurrentStep(2);
                    } else if (classes && classes.length > 1) {
                        // Lebih dari 1 kelas → tampilkan wizard pilih kelas
                        setWaliKelasMultiple(true);
                        // Set lembaga dari kelas pertama (semua kelas wali asumsi 1 lembaga)
                        setSelections(prev => ({
                            ...prev,
                            lembaga_id: classes[0].lembaga_id
                        }));
                        setCurrentStep(1);
                    } else {
                        // Tidak ada kelas
                        setWaliKelasMultiple(false);
                        setCurrentStep(2); // Biarkan FormAbsensi handle kelas kosong
                    }
                })
                .catch(() => {
                    setCurrentStep(2);
                })
                .finally(() => {
                    setIsWaliKelasLoading(false);
                });
        } else if (!isWaliKelas) {
            setIsWaliKelasLoading(false);
            setCurrentStep(1);
        }
    }, [isWaliKelas, pegawai_id]);

    // Wali Kelas dengan 1 kelas tidak perlu stepper maupun wizard
    const showStepper = !isWaliKelas || waliKelasMultiple;

    const steps = [
        { id: 1, label: "Pilih Kelas" },
        { id: 2, label: "Isi Absensi Harian" },
    ];

    if (isWaliKelasLoading) {
        return (
            <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                        <ClipboardCheck className="w-6 h-6 text-[#243B7A]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#2B3674] uppercase">ABSENSI HARIAN</h1>
                        <p className="text-[#A3AED0] text-sm mt-1">Input kehadiran siswa harian per kelas</p>
                    </div>
                </div>
                <Card className="min-h-100 shadow-sm">
                    <CardContent className="p-6 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Memuat data kelas...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 relative">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                    <ClipboardCheck className="w-6 h-6 text-[#243B7A]" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[#2B3674] uppercase">ABSENSI HARIAN</h1>
                    <p className="text-[#A3AED0] text-sm mt-1">Input kehadiran siswa harian per kelas</p>
                </div>
            </div>

            {/* Stepper Indicator */}
            {showStepper && (
                <Card>
                    <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2">
                        {steps.map((step, idx) => (
                            <React.Fragment key={step.id}>
                                <div className="flex items-center space-x-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${currentStep > step.id ? "bg-green-500 text-white" : currentStep === step.id ? "bg-[#1E3A8A] text-white" : "bg-gray-100 text-gray-400"}`}>
                                        {currentStep > step.id ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                                    </div>
                                    <span className={`text-sm font-medium hidden sm:block ${currentStep >= step.id ? "text-gray-800" : "text-gray-400"}`}>{step.label}</span>
                                </div>
                                {idx < steps.length - 1 && <div className="hidden md:block flex-1 h-px bg-gray-200 mx-4" />}
                            </React.Fragment>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Main Content Area */}
            <Card className="min-h-100 shadow-sm">
                <CardContent className="p-6">
                    {currentStep === 1 ? (
                        <WizardMenu
                            selections={selections}
                            setSelections={setSelections}
                            onNext={() => setCurrentStep(2)}
                        />
                    ) : (
                        <FormAbsensi
                            selections={selections}
                            setSelections={setSelections}
                            onBack={(showStepper) ? () => setCurrentStep(1) : undefined}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
