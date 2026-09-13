// src/pages/Akademik/Jadwal/JadwalGuru.tsx
import React from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User, Clock, CalendarDays } from "lucide-react";
import { useJadwalGuru } from "./hooks/useJadwalGuru";
import { useAuthStore } from "@/store/useAuthStore";
import { JadwalGuruDirektur } from "./JadwalGuruDirektur";
import { UnverifiedLessonPlanWarning } from "./components/UnverifiedLessonPlanWarning";

const isCountedCategory = (tipe?: string): boolean => {
  if (!tipe) return true;
  return tipe.trim().toLowerCase() === "belajar";
};

const JadwalGuru: React.FC = () => {
  const role = useAuthStore((state) => state.role);
  const { isLoading, pegawaiNama, groupedData, sortedHari, lessonPlanVerifikasiMap, unverifiedCount } = useJadwalGuru();

  if (role === "Direktur") {
    return <JadwalGuruDirektur />;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 bg-[#F4F7FE] min-h-dvh font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
            <Clock className="w-6 h-6 text-[#243B7A]" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#2B3674] tracking-tight uppercase">Jadwal Mengajar Saya</h1>
            <p className="text-[#A3AED0] text-[13px] font-medium mt-1">Sistem Akademik · Tahun Ajaran 2024/2025</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 w-fit">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <User className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guru Aktif</span>
          <span className="font-bold text-[#2B3674] text-sm">{pegawaiNama}</span>
        </div>
      </div>

      {/* WARNING KBM VERIFIKASI */}
      <UnverifiedLessonPlanWarning count={unverifiedCount} />

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 font-medium text-sm">Memuat data jadwal...</span>
          </div>
        ) : sortedHari.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">Tidak ada jadwal</h3>
            <p className="text-slate-500 mt-1 text-sm">Anda belum memiliki jadwal mengajar.</p>
          </div>
        ) : (
          sortedHari.map((hari) => {
            let jamCounter = 0;
            const jamNumbersMap = new Map<string, number | null>();
            groupedData[hari].forEach((row) => {
              if (isCountedCategory(row.tipe)) {
                jamCounter += 1;
                jamNumbersMap.set(row.key, jamCounter);
              } else {
                jamNumbersMap.set(row.key, null);
              }
            });

            return (
              <Card key={hari} className="rounded-[16px] shadow-sm border-slate-200 bg-white overflow-hidden">
                {/* Header */}
                <div className="bg-white px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-7.5 h-7.5 rounded bg-[#243B7A] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {hari.substring(0, 2)}
                  </div>
                  <span className="font-bold text-slate-700 text-[15px] tracking-tight">{hari}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-100/50">
                    {groupedData[hari].length} sesi
                  </span>
                </div>
                
                {/* Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-white">
                      <TableRow className="hover:bg-transparent border-b-slate-100">
                        <TableHead className="font-semibold text-slate-400 text-[10px] tracking-widest h-10 pl-5 w-16 text-center uppercase">JAM</TableHead>
                        <TableHead className="font-semibold text-slate-400 text-[10px] tracking-widest h-10 w-[20%] uppercase">WAKTU</TableHead>
                        <TableHead className="font-semibold text-slate-400 text-[10px] tracking-widest h-10 w-[25%] uppercase">KELAS</TableHead>
                        <TableHead className="font-semibold text-slate-400 text-[10px] tracking-widest h-10 w-[30%] uppercase">MATA PELAJARAN</TableHead>
                        <TableHead className="font-semibold text-slate-400 text-[10px] tracking-widest h-10 pr-5 w-[20%] uppercase">RUANGAN</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedData[hari].map((row) => {
                        const jamNum = jamNumbersMap.get(row.key);

                        return (
                          <TableRow key={row.key} className="hover:bg-slate-50/60 border-b border-slate-50 transition-colors">
                            <TableCell className="pl-5 py-3 text-center">
                              {jamNum !== null && jamNum !== undefined ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-100/60 shadow-2xs">
                                  {jamNum}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="font-mono text-[13px] font-bold text-slate-600 tracking-tight">
                                {row.jam_mulai_display}–{row.jam_selesai_display}
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="font-bold text-[#2B3674] text-[13px]">
                                {row.kelas_nama}
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              {(() => {
                                const isUnverified = lessonPlanVerifikasiMap && row.jadwal_id && lessonPlanVerifikasiMap.has(row.jadwal_id) && !lessonPlanVerifikasiMap.get(row.jadwal_id)!.isVerified;
                                return (
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded font-bold text-xs border ${
                                    isUnverified
                                      ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse shadow-sm"
                                      : "bg-indigo-50/70 text-indigo-700 border-indigo-100/50"
                                  }`}>
                                    {row.mapel_nama}
                                  </span>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="pr-5 py-3">
                              <span className="text-slate-600 text-[13px]">
                                {row.ruangan || "—"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default JadwalGuru;
