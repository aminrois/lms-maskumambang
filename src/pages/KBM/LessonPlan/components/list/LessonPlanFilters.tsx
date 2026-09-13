import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Search, School, BookOpen, CheckCircle2, Loader2 } from "lucide-react";

interface LessonPlanFiltersProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  kelasFilter: string;
  setKelasFilter: (kelas: string) => void;
  mapelFilter: string;
  setMapelFilter: (mapel: string) => void;
  kelasOptions: string[];
  mapelOptions: string[];
  canVerify?: boolean;
  onSetujuiSemua?: () => void;
  eligibleApproveCount?: number;
  isApprovingAll?: boolean;
}

export function LessonPlanFilters({
  activeTab,
  setActiveTab,
  tabs,
  searchQuery,
  setSearchQuery,
  kelasFilter,
  setKelasFilter,
  mapelFilter,
  setMapelFilter,
  kelasOptions,
  mapelOptions,
  canVerify,
  onSetujuiSemua,
  eligibleApproveCount = 0,
  isApprovingAll = false,
}: LessonPlanFiltersProps) {
  return (
    <Card className="rounded-2xl border-slate-100 shadow-sm">
      <CardContent className="p-5 space-y-4">
        {/* ROW 1: SEARCH & DROPDOWN FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Cari RPP, Mapel, Guru, Kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl border-slate-200 focus:border-indigo-500 font-medium"
            />
          </div>

          {/* FILTER KELAS */}
          <div className="relative">
            <School className="w-4 h-4 absolute left-3 top-3 text-indigo-500 pointer-events-none" />
            <select
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden cursor-pointer"
            >
              <option value="Semua Kelas">Semua Kelas</option>
              {kelasOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* FILTER MATA PELAJARAN */}
          <div className="relative">
            <BookOpen className="w-4 h-4 absolute left-3 top-3 text-indigo-500 pointer-events-none" />
            <select
              value={mapelFilter}
              onChange={(e) => setMapelFilter(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden cursor-pointer"
            >
              <option value="Semua Mapel">Semua Mapel</option>
              {mapelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ROW 2: TABS STATUS VERIFIKASI */}
        <div className="pt-1 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center text-slate-700 font-semibold text-xs shrink-0">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            <span>Status Verifikasi:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab}
                type="button"
                variant="outline"
                onClick={() => setActiveTab(tab)}
                className={`h-8 px-3 rounded-xl text-xs transition-all ${
                  activeTab === tab 
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-2xs" 
                    : "text-slate-600 border-slate-200 hover:bg-slate-50 font-medium"
                }`}
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>

        {/* ROW 3: TOMBOL SETUJUI SEMUA (DIBAWAH STATUS VERIFIKASI) */}
        {canVerify && eligibleApproveCount > 0 && onSetujuiSemua && (
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Terdapat <strong className="font-bold text-emerald-950">{eligibleApproveCount} Lesson Plan</strong> yang belum disetujui dan memerlukan verifikasi Anda.</span>
            </div>
            <Button
              type="button"
              onClick={onSetujuiSemua}
              disabled={isApprovingAll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
              title="Setujui seluruh Lesson Plan yang belum disetujui sekaligus"
            >
              {isApprovingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Setujui Semua ({eligibleApproveCount})</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
