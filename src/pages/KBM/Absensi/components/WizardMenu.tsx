import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2, Clock, BookOpen, Sparkles, Check, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { AbsensiState } from "../Index";
import { useWizardMenu } from "../hooks/useWizardMenu";

interface WizardMenuProps {
    currentStep: number;
    setCurrentStep: (step: number) => void;
    selections: AbsensiState;
    setSelections: (val: AbsensiState) => void;
}

export default function WizardMenu({ currentStep, setCurrentStep, selections, setSelections }: WizardMenuProps) {
    const {
        sesiList,
        isLoadingJadwal,
        isLoadingLP,
        maxPertemuan,
        today,
        nextStep,
        prevStep
    } = useWizardMenu({ currentStep, setCurrentStep, selections });

    return (
        <div className="space-y-6 animate-in fade-in duration-300">

            {/* Step 1: Pilih Jadwal & Lesson Plan */}
            {currentStep === 1 && (
                <div className="space-y-5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Pilih Jadwal Mengajar</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Pilih jadwal kelas yang diampu untuk memulai absensi siswa.</p>
                    </div>

                    {isLoadingJadwal || isLoadingLP ? (
                        <div className="flex items-center justify-center py-12 text-slate-500">
                            <Loader2 className="w-6 h-6 animate-spin mr-2 text-indigo-600" />
                            <span className="font-medium text-sm">Memuat jadwal & RPP...</span>
                        </div>
                    ) : sesiList.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                            <p className="text-slate-500 font-medium">Tidak ada jadwal mengajar yang ditugaskan kepada Anda.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sesiList.map((s: any) => {
                                const isSelected = JSON.stringify(selections.jadwal_ids) === JSON.stringify(s.jadwal_ids);
                                const isToday = s.hari === today;
                                const matchedLPs = s.matchedLPs || [];
                                const defaultLP = matchedLPs.length > 0 ? matchedLPs[0] : null;

                                const hasAnyLP = s.lpStatus?.hasAnyVerified || s.lpStatus?.hasAnyUnverified || matchedLPs.length > 0;
                                const isNoLP = !hasAnyLP;
                                const isUnverified = hasAnyLP && !s.lpStatus?.hasAnyVerified && matchedLPs.length === 0;
                                const isDisabled = matchedLPs.length === 0;
                                const otherTeachers = s.lpStatus?.othersWithVerified || [];

                                const handleCardClick = () => {
                                    if (isDisabled) {
                                        if (isNoLP) {
                                            toast.error(`Anda tidak bisa mengisi absensi. Anda belum membuat Lesson Plan (RPP) untuk mata pelajaran ini.`);
                                        } else if (isUnverified) {
                                            toast.error(`Anda tidak bisa mengisi absensi. RPP untuk mata pelajaran ini belum terverifikasi.`);
                                        } else {
                                            toast.error(`Anda tidak bisa mengisi absensi. RPP Anda belum terverifikasi.`);
                                        }
                                        return;
                                    }

                                    setSelections({
                                        ...selections,
                                        jadwal_ids: s.jadwal_ids,
                                        kelas_id: s.kelas?.kelas_id,
                                        mapel_id: s.mapel?.mapel_id,
                                        kelas_nama: s.kelas?.nama_kelas || "Tidak diketahui",
                                        mapel_nama: s.mapel?.nama_mapel || "Tidak diketahui",
                                        lesson_plan_detail_id: defaultLP ? defaultLP.lesson_plan_id : null,
                                        pertemuan: null
                                    });
                                };

                                return (
                                    <div
                                        key={s.sesi_key}
                                        onClick={handleCardClick}
                                        className={`p-5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${isDisabled
                                                ? "opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed"
                                                : isSelected
                                                    ? "border-2 border-indigo-600 bg-linear-to-br from-indigo-50/80 via-white to-blue-50/50 shadow-md ring-2 ring-indigo-500/20 cursor-pointer"
                                                    : "bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-md cursor-pointer"
                                            }`}
                                    >
                                        <div>
                                            {/* Badges Bar */}
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 border border-slate-200/60 font-semibold text-xs text-slate-700 rounded-full">
                                                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                                    {s.hari} • {s.label_jam} ({s.jam_mulai_display})
                                                </span>

                                                {isToday ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                                                        <Sparkles className="w-3 h-3" />
                                                        Hari Ini
                                                    </span>
                                                ) : isSelected ? (
                                                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                                        <Check className="w-3.5 h-3.5 stroke-3" />
                                                    </span>
                                                ) : null}
                                            </div>

                                            {/* Mapel Title */}
                                            <h3 className={`font-bold text-lg leading-snug tracking-tight text-slate-800 ${isDisabled ? 'line-through text-slate-400' : ''}`}>
                                                {s.mapel?.nama_mapel}
                                            </h3>

                                            {/* Kelas Badge */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs rounded-lg">
                                                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                                                    Kelas {s.kelas?.nama_kelas}
                                                </span>
                                            </div>
                                        </div>

                                        {/* RPP Selector / Warning Footer */}
                                        <div className="mt-4 pt-3 border-t border-slate-100">
                                            {isDisabled ? (
                                                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700 leading-relaxed flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <strong>Absensi Terkunci:</strong>{" "}
                                                        {isNoLP ? (
                                                            "Belum ada Lesson Plan (RPP). Silakan buat RPP terlebih dahulu."
                                                        ) : isUnverified ? (
                                                            "Seluruh RPP untuk mapel ini belum disetujui oleh Kepala Sekolah/Direktur."
                                                        ) : (
                                                            `RPP Anda belum disetujui (${otherTeachers.join(', ')}).`
                                                        )}
                                                    </div>
                                                </div>
                                            ) : matchedLPs.length > 1 && isSelected ? (
                                                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                                                    <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                                        Pilih RPP:
                                                    </label>
                                                    <select
                                                        value={selections.lesson_plan_detail_id || ""}
                                                        onChange={(e) => setSelections({ ...selections, lesson_plan_detail_id: Number(e.target.value) })}
                                                        className="w-full text-xs bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    >
                                                        {matchedLPs.map((lp: any) => (
                                                            <option key={lp.lesson_plan_id} value={lp.lesson_plan_id}>
                                                                {lp.judul_rpp} ({lp.lesson_plan_detail?.length || 0} Pertemuan)
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : defaultLP ? (
                                                <div className="flex items-center justify-between text-xs text-slate-600">
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                                        <span className="truncate font-medium text-slate-700">{defaultLP.judul_rpp}</span>
                                                    </div>
                                                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md shrink-0 ml-2">
                                                        Disetujui
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-amber-600 flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5" /> RPP Belum Dipilih
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button
                            onClick={nextStep}
                            disabled={!selections.jadwal_ids || selections.jadwal_ids.length === 0 || !selections.lesson_plan_detail_id}
                            className="bg-[#243B7A] hover:bg-[#1a2b5a] text-white rounded-xl px-6"
                        >
                            Lanjut <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2: Pilih Lesson Plan */}
            {currentStep === 2 && (
                <div className="space-y-5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Pilih Lesson Plan Ke-Berapa</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Mata pelajaran <strong className="text-slate-800">{selections.mapel_nama}</strong> ({selections.kelas_nama}) memiliki <strong className="text-indigo-600">{maxPertemuan} pertemuan</strong> di RPP.
                        </p>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5 py-2">
                        {Array.from({ length: maxPertemuan }, (_, i) => i + 1).map((n) => {
                            const isSelected = selections.pertemuan === n;
                            return (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setSelections({ ...selections, pertemuan: n })}
                                    className={`h-12 rounded-xl text-sm font-bold transition-all flex items-center justify-center border cursor-pointer ${isSelected
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30 scale-[1.03]"
                                            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                                        }`}
                                >
                                    {n}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-between pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={prevStep} className="rounded-xl">
                            Kembali
                        </Button>
                        <Button
                            onClick={nextStep}
                            disabled={!selections.pertemuan}
                            className="bg-[#243B7A] hover:bg-[#1a2b5a] text-white rounded-xl px-6"
                        >
                            Tampilkan Siswa <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
