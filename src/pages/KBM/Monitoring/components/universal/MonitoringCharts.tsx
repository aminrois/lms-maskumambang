import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  PieChart, BarChart3, School, BookOpen
} from "lucide-react";
import type { MonitoringKBMResponse } from "../../Universal";

interface MonitoringChartsProps {
  data: MonitoringKBMResponse[];
  summary: {
    terlambat: number;
    sesuai: number;
    cepat: number;
  };
}

export function MonitoringCharts({ data, summary }: MonitoringChartsProps) {
  const [activeTab, setActiveTab] = useState<'kelas' | 'mapel'>('kelas');

  const total = summary.sesuai + summary.terlambat + summary.cepat;
  const sesuaiPct = total > 0 ? Math.round((summary.sesuai / total) * 100) : 0;
  const cepatPct = total > 0 ? Math.round((summary.cepat / total) * 100) : 0;
  const terlambatPct = total > 0 ? Math.round((summary.terlambat / total) * 100) : 0;

  // Donut SVG parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.292
  const strokeWidth = 14;

  const sesuaiOffset = 0;
  const sesuaiLength = (sesuaiPct / 100) * circumference;

  const cepatLength = (cepatPct / 100) * circumference;
  const cepatOffset = -sesuaiLength;

  const terlambatLength = (terlambatPct / 100) * circumference;
  const terlambatOffset = -(sesuaiLength + cepatLength);

  // Group data by Kelas
  const classBreakdown = useMemo(() => {
    const map: Record<string, { nama: string; total: number; sesuai: number; cepat: number; terlambat: number }> = {};
    data.forEach(d => {
      const k = d.nama_kelas || "Lainnya";
      if (!map[k]) {
        map[k] = { nama: k, total: 0, sesuai: 0, cepat: 0, terlambat: 0 };
      }
      map[k].total += 1;
      const s = (d.status || "").trim();
      if (s === "Terlambat" || s === "Tertinggal") {
        map[k].terlambat += 1;
      } else if (s === "Terlalu Cepat") {
        map[k].cepat += 1;
      } else {
        map[k].sesuai += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [data]);

  // Group data by Mapel
  const mapelBreakdown = useMemo(() => {
    const map: Record<string, { nama: string; total: number; sesuai: number; cepat: number; terlambat: number }> = {};
    data.forEach(d => {
      const m = d.nama_mapel || "Lainnya";
      if (!map[m]) {
        map[m] = { nama: m, total: 0, sesuai: 0, cepat: 0, terlambat: 0 };
      }
      map[m].total += 1;
      const s = (d.status || "").trim();
      if (s === "Terlambat" || s === "Tertinggal") {
        map[m].terlambat += 1;
      } else if (s === "Terlalu Cepat") {
        map[m].cepat += 1;
      } else {
        map[m].sesuai += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [data]);

  if (total === 0) {
    return null;
  }

  const activeBreakdown = activeTab === 'kelas' ? classBreakdown : mapelBreakdown;

  return (
    <Card className="rounded-2xl border-slate-200/90 shadow-xs overflow-hidden bg-white">
      {/* Header Visual */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 via-indigo-50/30 to-blue-50/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base">Grafik &amp; Analisis KBM</h2>
            <p className="text-xs text-slate-500 mt-0.5">Visualisasi kepatuhan target RPP &amp; distribusi pelaksanaan KBM</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('kelas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'kelas'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            Distribusi Kelas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mapel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mapel'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Distribusi Mapel
          </button>
        </div>
      </div>

      <CardContent className="p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Kolom 1: Donut Chart Status KBM */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50/60 rounded-2xl border border-slate-100">
            <div className="relative flex items-center justify-center">
              <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 140 140">
                {/* Background Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="#e2e8f0"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Sesuai Target Ring (Emerald) */}
                {sesuaiPct > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="#10b981"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${sesuaiLength} ${circumference}`}
                    strokeDashoffset={sesuaiOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                )}
                {/* Terlalu Cepat Ring (Amber) */}
                {cepatPct > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="#f59e0b"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${cepatLength} ${circumference}`}
                    strokeDashoffset={cepatOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                )}
                {/* Terlambat Ring (Rose) */}
                {terlambatPct > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="#f43f5e"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${terlambatLength} ${circumference}`}
                    strokeDashoffset={terlambatOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                )}
              </svg>

              {/* Center Metrics */}
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800 tracking-tight">
                  {sesuaiPct}%
                </span>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Sesuai Target
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {total} Total Sesi
                </span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="grid grid-cols-3 gap-2 w-full mt-5 pt-4 border-t border-slate-200/80">
              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-emerald-50/80 border border-emerald-100">
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Sesuai
                </div>
                <span className="text-base font-extrabold text-emerald-900 mt-0.5">{summary.sesuai}</span>
                <span className="text-[10px] font-semibold text-emerald-700">{sesuaiPct}%</span>
              </div>

              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-amber-50/80 border border-amber-100">
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Cepat
                </div>
                <span className="text-base font-extrabold text-amber-900 mt-0.5">{summary.cepat}</span>
                <span className="text-[10px] font-semibold text-amber-700">{cepatPct}%</span>
              </div>

              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-rose-50/80 border border-rose-100">
                <div className="flex items-center gap-1 text-[11px] font-bold text-rose-800">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Terlambat
                </div>
                <span className="text-base font-extrabold text-rose-900 mt-0.5">{summary.terlambat}</span>
                <span className="text-[10px] font-semibold text-rose-700">{terlambatPct}%</span>
              </div>
            </div>
          </div>

          {/* Kolom 2: Progress Bars Breakdown per Kelas / Mapel */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                {activeTab === 'kelas' ? 'Distribusi Kepatuhan per Kelas' : 'Distribusi Kepatuhan per Mata Pelajaran'}
              </h3>
              <span className="text-[11px] font-medium text-slate-500">
                {activeBreakdown.length} {activeTab === 'kelas' ? 'Kelas' : 'Mata Pelajaran'}
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {activeBreakdown.slice(0, 8).map((item) => {
                const itemSesuaiPct = Math.round((item.sesuai / item.total) * 100);
                const itemCepatPct = Math.round((item.cepat / item.total) * 100);
                const itemTerlambatPct = Math.round((item.terlambat / item.total) * 100);

                return (
                  <div key={item.nama} className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100/90 space-y-1.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate max-w-[180px] sm:max-w-[260px]" title={item.nama}>
                        {item.nama}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] shrink-0 font-medium">
                        <span className="text-emerald-700 font-bold">{item.sesuai} Sesuai</span>
                        {item.terlambat > 0 && <span className="text-rose-600 font-bold">· {item.terlambat} Lambat</span>}
                        {item.cepat > 0 && <span className="text-amber-600 font-bold">· {item.cepat} Cepat</span>}
                        <span className="text-slate-400">({item.total} Sesi)</span>
                      </div>
                    </div>

                    {/* Stacked Proportional Bar */}
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden flex">
                      {item.sesuai > 0 && (
                        <div
                          style={{ width: `${itemSesuaiPct}%` }}
                          className="bg-emerald-500 h-full transition-all duration-500"
                          title={`Sesuai: ${item.sesuai} (${itemSesuaiPct}%)`}
                        />
                      )}
                      {item.cepat > 0 && (
                        <div
                          style={{ width: `${itemCepatPct}%` }}
                          className="bg-amber-400 h-full transition-all duration-500"
                          title={`Terlalu Cepat: ${item.cepat} (${itemCepatPct}%)`}
                        />
                      )}
                      {item.terlambat > 0 && (
                        <div
                          style={{ width: `${itemTerlambatPct}%` }}
                          className="bg-rose-500 h-full transition-all duration-500"
                          title={`Terlambat: ${item.terlambat} (${itemTerlambatPct}%)`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {activeBreakdown.length === 0 && (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  Tidak ada data untuk filter ini.
                </p>
              )}
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
