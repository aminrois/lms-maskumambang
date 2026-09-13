// src/pages/KBM/Absensi/Index.tsx

import React, { useState } from "react";
import { Clipboard, CheckCircle2, Info, ChevronUp, ChevronDown, Calendar, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "react-router-dom";
import WizardMenu from "./components/WizardMenu";
import FormAbsensi from "./components/FormAbsensi";

export interface AbsensiState {
    jadwal_ids: number[];
    kelas_id: number | null;
    mapel_id: number | null;
    kelas_nama: string;
    mapel_nama: string;
    pertemuan: number | null;
    lesson_plan_detail_id: number | null;
}

export default function AbsensiMapelIndex() {
    const location = useLocation();
    const updateContext = location.state?.jurnalUpdateContext;

    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState<number>(updateContext ? 3 : 1);
    const [selections, setSelections] = useState<AbsensiState>({
        jadwal_ids: updateContext?.jadwal_id ? [updateContext.jadwal_id] : [],
        kelas_id: updateContext?.kelas_id || null,
        mapel_id: updateContext?.mapel_id || null,
        kelas_nama: updateContext?.kelas_nama || "",
        mapel_nama: updateContext?.mapel_nama || "",
        pertemuan: updateContext?.pertemuan || null,
        lesson_plan_detail_id: updateContext?.lesson_plan_detail_id || null,
    });

    const steps = [
        { id: 1, label: "Pilih Jadwal Mengajar" },
        { id: 2, label: "Pilih Lesson Plan" },
        { id: 3, label: "Isi Absensi" },
    ];

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 relative">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                    <Clipboard className="w-6 h-6 text-[#243B7A]" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[#2B3674] uppercase">ABSENSI MATA PELAJARAN</h1>
                    <p className="text-[#A3AED0] text-sm mt-1">Input kehadiran siswa per pertemuan</p>
                </div>
            </div>

            {/* BANNER INFORMASI PANDUAN ABSENSI MATA PELAJARAN */}
            <Card className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50/90 via-blue-50/50 to-slate-50 shadow-xs overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5">
                                <Info className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-bold text-slate-800 text-sm">
                                        Panduan Penggunaan Absensi Mata Pelajaran
                                    </h3>
                                    <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                        Alur 3 Langkah
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Pengisian presensi siswa dilakukan dalam 3 langkah ringkas: <strong>1. Pilih Jadwal Mengajar</strong> ➔ <strong>2. Pilih Lesson Plan</strong> ➔ <strong>3. Isi Absensi & Jurnal</strong>.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsInfoOpen(!isInfoOpen)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 shrink-0 p-1.5 rounded-lg hover:bg-indigo-100/50 transition-colors cursor-pointer"
                        >
                            <span>{isInfoOpen ? "Sembunyikan" : "Pelajari Selengkapnya"}</span>
                            {isInfoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>

                    {isInfoOpen && (
                        <div className="mt-4 pt-4 border-t border-indigo-100/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700 animate-in fade-in duration-300">
                            <div className="bg-white/80 p-3.5 rounded-xl border border-indigo-100 space-y-1.5 shadow-2xs">
                                <div className="flex items-center gap-2 font-bold text-indigo-900">
                                    <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <span>1. Pilih Jadwal Mengajar</span>
                                </div>
                                <p className="text-slate-600 text-[11px] leading-relaxed">
                                    Pilih kartu jadwal mata pelajaran dan kelas yang diampu pada hari ini. Jam mengajar berderet pada hari yang sama akan dikelompokkan secara otomatis.
                                </p>
                            </div>

                            <div className="bg-white/80 p-3.5 rounded-xl border border-indigo-100 space-y-1.5 shadow-2xs">
                                <div className="flex items-center gap-2 font-bold text-indigo-900">
                                    <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <span>2. Pilih Lesson Plan</span>
                                </div>
                                <p className="text-slate-600 text-[11px] leading-relaxed">
                                    Pilih nomor pertemuan dari RPP yang telah terverifikasi. Materi dan topik pembelajaran akan tersinkronisasi otomatis ke Jurnal Mengajar.
                                </p>
                            </div>

                            <div className="bg-white/80 p-3.5 rounded-xl border border-indigo-100 space-y-1.5 shadow-2xs">
                                <div className="flex items-center gap-2 font-bold text-indigo-900">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <span>3. Isi Absensi & Simpan</span>
                                </div>
                                <p className="text-slate-600 text-[11px] leading-relaxed">
                                    Tandai status kehadiran siswa (Hadir, Sakit, Izin, Alpha, Dispen), isi catatan jurnal mengajar opsional, lalu klik Simpan Absensi & Jurnal.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stepper Indicator */}
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

            {/* Main Content Area */}
            <Card className="min-h-100 shadow-sm">
                <CardContent className="p-6">
                    {currentStep <= 2 ? (
                        <WizardMenu
                            currentStep={currentStep}
                            setCurrentStep={setCurrentStep}
                            selections={selections}
                            setSelections={setSelections}
                        />
                    ) : (
                        <FormAbsensi
                            selections={selections}
                            setCurrentStep={setCurrentStep}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}