import React from "react";
import { Clock, CalendarDays, BookOpen, User } from "lucide-react";
import { useJadwalKelas } from "./hooks/useJadwalKelas";
import { JadwalDayCard } from "./components/JadwalDayCard";
import { UnverifiedLessonPlanWarning } from "./components/UnverifiedLessonPlanWarning";

const JadwalKelas: React.FC = () => {
  const {
    assignedClasses,
    selectedKelasId,
    setSelectedKelasId,
    activeClass,
    groupedData,
    sortedHari,
    isLoading,
    lessonPlanVerifikasiMap,
    unverifiedCount,
  } = useJadwalKelas();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 bg-[#F4F7FE] min-h-dvh font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
            <Clock className="w-6 h-6 text-[#243B7A]" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#2B3674] tracking-tight uppercase">Jadwal Kelas</h1>
            <p className="text-[#A3AED0] text-[13px] font-medium mt-1">Sistem Akademik · Jadwal Pelajaran Kelas Asuhan Wali Kelas</p>
          </div>
        </div>
      </div>

      {/* INFORMASI KELAS ASUHAN & SELECTOR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kelas Asuhan</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#2B3674] text-base">
                {activeClass ? activeClass.nama_kelas : "Belum ditentukan"}
              </span>
              {activeClass?.lembaga_nama && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {activeClass.lembaga_nama}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Jika Wali Kelas mengampu lebih dari 1 kelas */}
        {assignedClasses.length > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500">Pilih Kelas:</span>
            <select
              value={selectedKelasId || ""}
              onChange={(e) => setSelectedKelasId(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              {assignedClasses.map((c) => (
                <option key={c.kelas_id} value={c.kelas_id}>
                  {c.nama_kelas} {c.lembaga_nama ? `(${c.lembaga_nama})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Info Wali Kelas */}
        {activeClass?.wali_kelas_nama && (
          <div className="flex items-center gap-2 text-xs text-slate-500 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Wali Kelas: <strong className="text-slate-700 font-semibold">{activeClass.wali_kelas_nama}</strong></span>
          </div>
        )}
      </div>

      {/* WARNING KBM VERIFIKASI */}
      <UnverifiedLessonPlanWarning count={unverifiedCount} />

      {/* TABLE DATA GROUPED BY HARI */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 font-medium text-sm">Memuat data jadwal kelas...</span>
          </div>
        ) : assignedClasses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">Tidak ada kelas asuhan</h3>
            <p className="text-slate-500 mt-1 text-sm">Anda belum ditugaskan sebagai wali kelas di kelas manapun.</p>
          </div>
        ) : sortedHari.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">Tidak ada jadwal</h3>
            <p className="text-slate-500 mt-1 text-sm">Belum ada jadwal pelajaran yang diatur untuk kelas ini.</p>
          </div>
        ) : (
          sortedHari.map((hari) => (
            <JadwalDayCard
              key={hari}
              hari={hari}
              sessions={groupedData[hari]}
              canUpdate={false}
              canDelete={false}
              lessonPlanVerifikasiMap={lessonPlanVerifikasiMap}
              onDeleteClick={() => {}}
              onEditClick={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default JadwalKelas;
