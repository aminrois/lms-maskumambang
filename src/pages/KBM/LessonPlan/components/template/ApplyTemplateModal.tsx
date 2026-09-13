import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { restClient } from "@/lib/api/axios";
import { getAllLessonPlans, getAllLessonPlanDetails } from "@/lib/api/services/kbmService";
import {
  Loader2, CheckSquare, Square, ChevronDown, ChevronUp,
  School, BookOpen, Layers
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LembagaGroup {
  lembaga_id: number;
  nama_lembaga: string;
  kelasList: KelasGroup[];
}

interface KelasGroup {
  nama_kelas: string;
  lembaga_id: number;
  lessonPlanIds: number[];
  emptyCount: number; // hanya pertemuan yang isi = NULL
}

interface ApplyTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedLessonPlanIds: number[]) => Promise<void>;
  isSaving: boolean;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
const extractKelasFromJudul = (judul: string) =>
  judul.split(/\s+[-–]\s+/)?.[1]?.trim() || judul;

// ─── Component ────────────────────────────────────────────────────────────────
export const ApplyTemplateModal: React.FC<ApplyTemplateModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isSaving,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lembagaGroups, setLembagaGroups] = useState<LembagaGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set()); // lesson_plan_ids
  const [expandedLembaga, setExpandedLembaga] = useState<Set<number>>(new Set());

  // Fetch data saat modal dibuka
  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    setSelectedIds(new Set());

    const fetchData = async () => {
      try {
        const [plansRes, kelasRes, lembagaRes, emptyDetailsRes] = await Promise.all([
          getAllLessonPlans({ select: "lesson_plan_id,judul_rpp" }),
          restClient.get("/kelas", { params: { select: "kelas_id,nama_kelas,lembaga_id" } }),
          restClient.get("/lembaga", { params: { select: "lembaga_id,nama_lembaga" } }),
          // Hanya ambil pertemuan yang BELUM memiliki isi (isi IS NULL atau empty string)
          getAllLessonPlanDetails({ select: "lesson_plan_id", or: "(isi.is.null,isi.eq.)" }),
        ]);

        const plans: { lesson_plan_id: number; judul_rpp: string }[] = plansRes;
        const kelasList: { kelas_id: number; nama_kelas: string; lembaga_id: number }[] = kelasRes.data || [];
        const lembagaList: { lembaga_id: number; nama_lembaga: string }[] = lembagaRes.data || [];
        const emptyDetails: { lesson_plan_id: number }[] = emptyDetailsRes;

        // Hitung jumlah pertemuan kosong per lesson_plan
        const emptyCountMap = new Map<number, number>();
        emptyDetails.forEach((d) => {
          emptyCountMap.set(d.lesson_plan_id, (emptyCountMap.get(d.lesson_plan_id) || 0) + 1);
        });

        // Build nama_kelas → lembaga_id map dari tabel kelas
        const kelasNameLembagaMap = new Map<string, number>();
        kelasList.forEach((k) => {
          kelasNameLembagaMap.set(k.nama_kelas.trim().toLowerCase(), k.lembaga_id);
        });

        const lembagaNameMap = new Map<number, string>();
        lembagaList.forEach((l) => lembagaNameMap.set(l.lembaga_id, l.nama_lembaga));

        // Kelompokkan lesson_plan → kelas → lembaga
        // Hanya tampilkan kelas yang memiliki pertemuan kosong
        const kelasMap = new Map<string, KelasGroup>(); // key: "lembagaId-namaKelas"

        plans.forEach((plan) => {
          const emptyCount = emptyCountMap.get(plan.lesson_plan_id) || 0;
          if (emptyCount === 0) return; // skip — tidak ada pertemuan kosong

          const namaKelas = extractKelasFromJudul(plan.judul_rpp);
          const lembagaId = kelasNameLembagaMap.get(namaKelas.toLowerCase()) ?? 0;
          const key = `${lembagaId}-${namaKelas}`;

          if (!kelasMap.has(key)) {
            kelasMap.set(key, {
              nama_kelas: namaKelas,
              lembaga_id: lembagaId,
              lessonPlanIds: [],
              emptyCount: 0,
            });
          }
          const group = kelasMap.get(key)!;
          group.lessonPlanIds.push(plan.lesson_plan_id);
          group.emptyCount += emptyCount;
        });

        // Kelompokkan kelas → lembaga
        const lembagaMap = new Map<number, LembagaGroup>();
        kelasMap.forEach((kelasGroup) => {
          const lid = kelasGroup.lembaga_id;
          if (!lembagaMap.has(lid)) {
            lembagaMap.set(lid, {
              lembaga_id: lid,
              nama_lembaga: lembagaNameMap.get(lid) || "Lembaga Tidak Diketahui",
              kelasList: [],
            });
          }
          lembagaMap.get(lid)!.kelasList.push(kelasGroup);
        });

        // Sort: lembaga by nama, kelas by nama
        const sorted = Array.from(lembagaMap.values()).sort((a, b) =>
          a.nama_lembaga.localeCompare(b.nama_lembaga)
        );
        sorted.forEach((lg) =>
          lg.kelasList.sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas))
        );

        setLembagaGroups(sorted);
        // Default: expand semua lembaga
        setExpandedLembaga(new Set(sorted.map((l) => l.lembaga_id)));
      } catch (err) {
        console.error("Gagal memuat data kelas:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [open]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const allLessonPlanIds = useMemo(
    () => lembagaGroups.flatMap((lg) => lg.kelasList.flatMap((k) => k.lessonPlanIds)),
    [lembagaGroups]
  );

  const isAllSelected = allLessonPlanIds.length > 0 && allLessonPlanIds.every((id) => selectedIds.has(id));
  const isSomeSelected = allLessonPlanIds.some((id) => selectedIds.has(id));

  const totalEmptySelected = useMemo(() => {
    let total = 0;
    lembagaGroups.forEach((lg) =>
      lg.kelasList.forEach((k) => {
        if (k.lessonPlanIds.some((id) => selectedIds.has(id))) {
          total += k.emptyCount;
        }
      })
    );
    return total;
  }, [selectedIds, lembagaGroups]);

  const selectedKelasCount = useMemo(() => {
    return lembagaGroups
      .flatMap((lg) => lg.kelasList)
      .filter((k) => k.lessonPlanIds.every((id) => selectedIds.has(id))).length;
  }, [selectedIds, lembagaGroups]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allLessonPlanIds));
    }
  };

  const toggleLembaga = (lg: LembagaGroup) => {
    const ids = lg.kelasList.flatMap((k) => k.lessonPlanIds);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleKelas = (kelas: KelasGroup) => {
    const allSelected = kelas.lessonPlanIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        kelas.lessonPlanIds.forEach((id) => next.delete(id));
      } else {
        kelas.lessonPlanIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleExpandLembaga = (id: number) => {
    setExpandedLembaga((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isLembagaChecked = (lg: LembagaGroup) => {
    const ids = lg.kelasList.flatMap((k) => k.lessonPlanIds);
    return ids.every((id) => selectedIds.has(id));
  };

  const isLembagaIndeterminate = (lg: LembagaGroup) => {
    const ids = lg.kelasList.flatMap((k) => k.lessonPlanIds);
    return !isLembagaChecked(lg) && ids.some((id) => selectedIds.has(id));
  };

  const isKelasChecked = (k: KelasGroup) =>
    k.lessonPlanIds.every((id) => selectedIds.has(id));

  const handleConfirm = async () => {
    await onConfirm(Array.from(selectedIds));
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-linear-to-r from-indigo-50/80 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-800">
                Terapkan Template ke Kelas
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Pilih kelas yang pertemuan <strong>belum terisi</strong>-nya akan diisi dengan template ini.
                RPP yang sudah memiliki isi tidak akan ditimpa.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-5 py-4 max-h-[58vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
              <span className="text-xs font-medium">Memuat daftar kelas...</span>
            </div>
          ) : lembagaGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
              <BookOpen className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">Semua pertemuan sudah terisi</p>
              <p className="text-xs text-slate-400 text-center max-w-xs">
                Tidak ada pertemuan yang masih kosong untuk diterapkan template.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pilih Semua */}
              <button
                onClick={toggleSelectAll}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-all hover:border-indigo-400 hover:bg-indigo-50/60 group"
                style={{ borderColor: isAllSelected ? "#6366f1" : isSomeSelected ? "#a5b4fc" : "#e2e8f0" }}
              >
                <div className="shrink-0">
                  {isAllSelected ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                  ) : isSomeSelected ? (
                    <div className="w-5 h-5 rounded border-2 border-indigo-400 bg-indigo-100 flex items-center justify-center">
                      <div className="w-2 h-0.5 bg-indigo-600 rounded-full" />
                    </div>
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
                  )}
                </div>
                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">
                  Pilih Semua Kelas
                </span>
                <span className="ml-auto text-xs text-slate-400 font-medium">
                  {lembagaGroups.flatMap((lg) => lg.kelasList).length} kelas · {allLessonPlanIds.length} RPP
                </span>
              </button>

              {/* Grup per Lembaga */}
              {lembagaGroups.map((lg) => {
                const isExpanded = expandedLembaga.has(lg.lembaga_id);
                const checked = isLembagaChecked(lg);
                const indeterminate = isLembagaIndeterminate(lg);

                return (
                  <div key={lg.lembaga_id} className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    {/* Lembaga Header */}
                    <div className="flex items-center gap-0 bg-slate-50/80">
                      <button
                        onClick={() => toggleLembaga(lg)}
                        className="flex items-center gap-3 flex-1 px-4 py-3 text-left hover:bg-indigo-50/40 transition-colors"
                      >
                        <div className="shrink-0">
                          {checked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : indeterminate ? (
                            <div className="w-4 h-4 rounded border-2 border-indigo-400 bg-indigo-100 flex items-center justify-center">
                              <div className="w-2 h-0.5 bg-indigo-600 rounded-full" />
                            </div>
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <School className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 flex-1">{lg.nama_lembaga}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {lg.kelasList.length} kelas
                        </span>
                      </button>
                      <button
                        onClick={() => toggleExpandLembaga(lg.lembaga_id)}
                        className="px-3 py-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border-l border-slate-200"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Daftar Kelas */}
                    {isExpanded && (
                      <div className="divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                        {lg.kelasList.map((kelas) => {
                          const isChecked = isKelasChecked(kelas);
                          return (
                            <button
                              key={kelas.nama_kelas}
                              onClick={() => toggleKelas(kelas)}
                              className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-indigo-50/50 ${
                                isChecked ? "bg-indigo-50/30" : "bg-white"
                              }`}
                            >
                              <div className="shrink-0">
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300" />
                                )}
                              </div>
                              <span className={`text-xs font-semibold flex-1 ${isChecked ? "text-indigo-700" : "text-slate-600"}`}>
                                {kelas.nama_kelas}
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                {kelas.emptyCount} pertemuan kosong
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && lembagaGroups.length > 0 && (
          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 sm:justify-between">
            <div className="text-xs text-slate-500">
              {selectedIds.size > 0 ? (
                <span>
                  <strong className="text-indigo-700">{totalEmptySelected} pertemuan</strong>
                  <span className="text-slate-400"> kosong pada </span>
                  <strong className="text-slate-700">{selectedKelasCount} kelas</strong>
                  <span className="text-slate-400"> akan diisi</span>
                </span>
              ) : (
                <span className="text-slate-400">Belum ada kelas dipilih</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="rounded-xl text-xs border-slate-200 text-slate-600 h-9 px-4 font-semibold"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedIds.size === 0 || isSaving}
                className={`rounded-xl text-xs font-bold h-9 px-5 flex items-center gap-2 shadow-sm transition-all ${
                  selectedIds.size > 0 && !isSaving
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menerapkan...
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    Terapkan ke {selectedKelasCount > 0 ? `${selectedKelasCount} Kelas` : "Kelas Dipilih"}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
