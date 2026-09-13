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
import { Pencil, Trash2, Coffee, BookOpen, Moon, Flag, Star, Zap, Layers } from "lucide-react";
import type { JadwalRow } from "../hooks/useJadwalAkademik";

const getTipeBadgeClass = (tipe: string) => {
  switch (tipe) {
    case "Belajar":
      return {
        bg: "bg-indigo-50/70 text-indigo-700 border-indigo-100/50",
        icon: <BookOpen className="w-3.5 h-3.5 mr-1.5" />,
        iconLarge: <BookOpen className="w-4 h-4 mr-2" />
      };
    case "Istirahat":
      return {
        bg: "bg-amber-50 text-amber-800 border-amber-200/80",
        icon: <Coffee className="w-3.5 h-3.5 mr-1.5" />,
        iconLarge: <Coffee className="w-4.5 h-4.5 mr-2" />
      };
    case "Sholat Dhuha & Halaqoh":
      return {
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
        icon: <Moon className="w-3.5 h-3.5 mr-1.5" />,
        iconLarge: <Moon className="w-4.5 h-4.5 mr-2" />
      };
    case "Apel":
      return {
        bg: "bg-sky-50 text-sky-800 border-sky-200/80",
        icon: <Flag className="w-3.5 h-3.5 mr-1.5" />,
        iconLarge: <Flag className="w-4.5 h-4.5 mr-2" />
      };
    case "Mapel Pilihan / Bimbingan TKA":
      return {
        bg: "bg-violet-50 text-violet-800 border-violet-200/80",
        icon: <Star className="w-3.5 h-3.5 mr-1.5" />,
        iconLarge: <Star className="w-4.5 h-4.5 mr-2" />
      };
    case "Bonding / Life Skill":
      return {
        bg: "bg-rose-50 text-rose-800 border-rose-200/80",
        icon: <Zap className="w-3.5 h-3.5 mr-1.5" />,
        iconLarge: <Zap className="w-4.5 h-4.5 mr-2" />
      };
    default:
      return {
        bg: "bg-slate-50 text-slate-600 border-slate-200/80",
        icon: <Layers className="w-3.5 h-3.5 mr-1.5" />,
        iconLarge: <Layers className="w-4.5 h-4.5 mr-2" />
      };
  }
};

const isCountedCategory = (tipe: string): boolean => {
  if (!tipe) return true;
  return tipe.trim().toLowerCase() === "belajar";
};

interface JadwalDayCardProps {
  hari: string;
  sessions: JadwalRow[];
  canUpdate: boolean;
  canDelete: boolean;
  onDeleteClick: (row: JadwalRow) => void;
  onEditClick: (row: JadwalRow) => void;
  /** Map jadwal_id → status verifikasi lesson plan, untuk styling */
  lessonPlanVerifikasiMap?: Map<number, { kepsek: string; direktur: string; isVerified: boolean }>;
}

export const JadwalDayCard: React.FC<JadwalDayCardProps> = ({
  hari,
  sessions,
  canUpdate,
  canDelete,
  onDeleteClick,
  onEditClick,
  lessonPlanVerifikasiMap,
}) => {
  // Hitung penomoran jam pelajaran berurutan per harinya hanya untuk kategori Belajar, Bonding, & Mapel Pilihan
  let jamCounter = 0;
  const jamNumbersMap = new Map<number, number | null>();
  sessions.forEach((row) => {
    const tipe = row.jam_mulai?.tipe || "";
    if (isCountedCategory(tipe)) {
      jamCounter += 1;
      jamNumbersMap.set(row.jadwal_id, jamCounter);
    } else {
      jamNumbersMap.set(row.jadwal_id, null);
    }
  });

  return (
    <Card className="rounded-xl border-slate-100 shadow-sm bg-white overflow-hidden">
      <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">{hari}</h3>
        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
          {sessions.length} Sesi
        </span>
      </div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/20">
            <TableRow className="border-b border-slate-100 hover:bg-transparent">
              <TableHead className="w-16 pl-5 text-center font-semibold text-slate-500 text-xs uppercase">Jam</TableHead>
              <TableHead className="w-32 font-semibold text-slate-500 text-xs uppercase">Waktu</TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs uppercase">Mata Pelajaran</TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs uppercase">Guru</TableHead>
              <TableHead className="font-semibold text-slate-500 text-xs uppercase">Ruangan</TableHead>
              {(canUpdate || canDelete) && (
                <TableHead className="w-30 pr-5 text-right font-semibold text-slate-500 text-xs uppercase">Aksi</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((row) => {
              const tipe = row.jam_mulai?.tipe || "";
              const isSpecialCategory = tipe !== "Belajar" && tipe !== "";
              const jamNum = jamNumbersMap.get(row.jadwal_id);

              return (
                <TableRow key={row.jadwal_id} className="hover:bg-slate-50/60 border-b border-slate-50 transition-colors">
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
                      {row.jam_mulai?.jam_mulai?.substring(0, 5)}–{row.jam_selesai?.jam_selesai?.substring(0, 5)}
                    </span>
                  </TableCell>

                  {isSpecialCategory ? (
                    <TableCell colSpan={(canUpdate || canDelete) ? 4 : 3} className="py-2.5 pr-5">
                      {(() => {
                        const badge = getTipeBadgeClass(tipe);
                        return (
                          <div className={`w-full flex items-center justify-center py-1.5 px-4 rounded-lg font-bold text-xs border shadow-2xs tracking-widest uppercase ${badge.bg}`}>
                            {badge.iconLarge}
                            <span>{tipe}</span>
                          </div>
                        );
                      })()}
                    </TableCell>
                  ) : (
                    <>
                      <TableCell className="py-3">
                        {row.mapel?.nama_mapel ? (
                          (() => {
                            const isUnverified = lessonPlanVerifikasiMap && row.jadwal_id && lessonPlanVerifikasiMap.has(row.jadwal_id) && !lessonPlanVerifikasiMap.get(row.jadwal_id)!.isVerified;
                            return (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded font-bold text-xs border ${
                                isUnverified 
                                  ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse shadow-sm" 
                                  : "bg-indigo-50/70 text-indigo-700 border-indigo-100/50"
                              }`}>
                                {row.mapel.nama_mapel}
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        {row.pegawai?.nama ? (
                          <span className="text-slate-600 text-[13px] font-medium">
                            {row.pegawai.nama}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        {row.ruangan ? (
                          <span className="text-slate-600 text-[13px]">
                            {row.ruangan}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                      {(canUpdate || canDelete) && (
                        <TableCell className="pr-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canUpdate && (
                              <button
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                                onClick={() => onEditClick(row)}
                                title="Edit Jadwal"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span>Edit</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                                onClick={() => onDeleteClick(row)}
                                title="Hapus Jadwal"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden p-4 space-y-3 divide-y divide-slate-100">
        {sessions.map((row) => {
          const tipe = row.jam_mulai?.tipe || "";
          const isSpecialCategory = tipe !== "Belajar" && tipe !== "";
          const badge = getTipeBadgeClass(tipe);
          const jamNum = jamNumbersMap.get(row.jadwal_id);

          return (
            <div key={row.jadwal_id} className="pt-3 first:pt-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {jamNum !== null && jamNum !== undefined && (
                    <span className="font-extrabold text-xs bg-indigo-100/80 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200/50">
                      Jam {jamNum}
                    </span>
                  )}
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {row.jam_mulai?.jam_mulai?.substring(0, 5)}–{row.jam_selesai?.jam_selesai?.substring(0, 5)} WIB
                  </span>
                </div>
                {isSpecialCategory ? (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                    {badge.icon}
                    {tipe}
                  </span>
                ) : canUpdate ? (
                  <button
                    onClick={() => onEditClick(row)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                ) : null}
              </div>

              {isSpecialCategory ? (
                <div className={`w-full text-center py-2 px-3 rounded-lg font-bold text-xs border tracking-wider uppercase ${badge.bg}`}>
                  {tipe}
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  {(() => {
                    const isUnverified = lessonPlanVerifikasiMap && row.jadwal_id && lessonPlanVerifikasiMap.has(row.jadwal_id) && !lessonPlanVerifikasiMap.get(row.jadwal_id)!.isVerified;
                    return (
                      <div className={`font-bold text-sm ${isUnverified ? "text-amber-700 animate-pulse" : "text-indigo-700"}`}>
                        {row.mapel?.nama_mapel || "—"}
                      </div>
                    );
                  })()}
                  <div className="text-slate-600 font-medium">
                    Guru: {row.pegawai?.nama || "—"}
                  </div>
                  {row.ruangan && (
                    <div className="text-slate-500">
                      Ruangan: {row.ruangan}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
