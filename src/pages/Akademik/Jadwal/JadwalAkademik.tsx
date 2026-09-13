import React from "react";
import { CalendarDays, Info, Pencil, ChevronDown, ChevronUp, UploadCloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { usePermissions } from "@/hooks/usePermissions";
import { useJadwalAkademik } from "./hooks/useJadwalAkademik";
import type { JadwalRow } from "./hooks/useJadwalAkademik";
import { JadwalHeader } from "./components/JadwalHeader";
import { JadwalFilters } from "./components/JadwalFilters";
import { JadwalDayCard } from "./components/JadwalDayCard";
import { JadwalDeleteModal } from "./components/JadwalDeleteModal";
import { JadwalEditModal } from "./components/JadwalEditModal";
import { UnggahJadwalModal } from "./components/UnggahJadwalModal";
import { UnverifiedLessonPlanWarning } from "./components/UnverifiedLessonPlanWarning";

const JadwalAkademik: React.FC = () => {
  const { canUpdate } = usePermissions('jadwal_pelajaran');
  const {
    isLoading,
    lembagaList,
    filteredKelas,
    activeLembagaId,
    setActiveLembagaId,
    activeKelasId,
    setActiveKelasId,
    allJadwalData,
    groupedData,
    sortedHari,
    isDirector,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    jadwalToDelete,
    setJadwalToDelete,
    executeDelete,
    hasUnuploadedSchedules,
    unuploadedCount,
    isUnggahModalOpen,
    setIsUnggahModalOpen,
    isUploading,
    executeUnggahJadwal,
    unggahProgress,
    unggahStats,
    lessonPlanVerifikasiMap,
    unverifiedCount,
  } = useJadwalAkademik();

  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [jadwalToEdit, setJadwalToEdit] = React.useState<JadwalRow | null>(null);
  const [isInfoOpen, setIsInfoOpen] = React.useState(false);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 bg-[#F4F7FE] min-h-dvh font-sans">
      {/* HEADER */}
      <JadwalHeader
        canCreate={false}
        hasUnuploadedSchedules={hasUnuploadedSchedules}
        unuploadedCount={unuploadedCount}
        onUnggahJadwalClick={() => setIsUnggahModalOpen(true)}
      />

      {/* INFORMASI CARA MENGUBAH JADWAL */}
      <Card className="rounded-2xl border border-indigo-100/80 shadow-2xs overflow-hidden bg-white">
        <button
          onClick={() => setIsInfoOpen(!isInfoOpen)}
          className="w-full px-5 py-3.5 flex justify-between items-center bg-linear-to-r from-indigo-50/60 to-blue-50/40 hover:from-indigo-50 hover:to-blue-50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-[#243B7A] font-bold text-sm">
            <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-2xs">
              <Info className="w-4 h-4" />
            </div>
            <span>Bagaimana Cara Kerja Jam Akademik & Unggah Jadwal?</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-600 font-semibold hidden sm:inline">
              {isInfoOpen ? "Sembunyikan Panduan" : "Lihat Panduan"}
            </span>
            {isInfoOpen ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-indigo-600" />}
          </div>
        </button>
        {isInfoOpen && (
          <CardContent className="p-5 border-t border-indigo-100/60 bg-white text-xs text-slate-600 space-y-3 leading-relaxed">
            <p className="text-slate-600 text-[13px] leading-relaxed">
              Struktur sesi dan jam pelajaran pada halaman ini dibuat secara otomatis mengikuti konfigurasi pada halaman <strong>Jam Akademik</strong> (menggunakan tombol <em>"Terapkan ke Jadwal Kelas"</em>). 
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-[12.5px] space-y-2 leading-relaxed">
              <li>
                Untuk mengisi atau memperbarui <strong>Mata Pelajaran</strong>, <strong>Guru/Pegawai Pengampu</strong>, dan <strong>Ruangan</strong> pada slot pelajaran yang tersedia, klik tombol <strong>Edit</strong> (ikon pensil <span className="inline-flex items-center align-middle font-semibold text-blue-600"><Pencil className="w-3 h-3 inline mx-0.5" /></span>) pada baris sesi bersangkutan.
              </li>
              <li>
                Tombol <strong className="text-amber-600"><UploadCloud className="w-3.5 h-3.5 inline mx-0.5" /> "Unggah Jadwal"</strong> di kanan atas akan otomatis muncul bila terdapat mata pelajaran yang baru di-assign atau belum diunggah ke sistem Lesson Plan.
              </li>
              <li>
                Saat tombol <strong>Unggah Jadwal</strong> ditekan, seluruh mata pelajaran beserta guru pengajar dan alokasi waktu jam pelajaran akan diunggah ke Lesson Plan di setiap kelas yang terhubung dengan judul RPP format <code>"Nama Mata Pelajaran – Kelas"</code> dan otomatis dilengkapi dengan <strong>16 Pertemuan</strong>.
              </li>
            </ul>
          </CardContent>
        )}
      </Card>

      {/* FILTER BAR */}
      <JadwalFilters
        lembagaList={lembagaList}
        filteredKelas={filteredKelas}
        activeLembagaId={activeLembagaId}
        setActiveLembagaId={setActiveLembagaId}
        activeKelasId={activeKelasId}
        setActiveKelasId={setActiveKelasId}
        isDirector={isDirector}
      />

      {/* WARNING KBM VERIFIKASI */}
      <UnverifiedLessonPlanWarning count={unverifiedCount} />

      {/* TABLE DATA GROUPED BY HARI */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 font-medium text-sm">Memuat data jadwal...</span>
          </div>
        ) : sortedHari.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">Tidak ada jadwal</h3>
            <p className="text-slate-500 mt-1 text-sm">Belum ada jadwal pelajaran untuk kelas ini.</p>
          </div>
        ) : (
          sortedHari.map(hari => (
            <JadwalDayCard
              key={hari}
              hari={hari}
              sessions={groupedData[hari]}
              canUpdate={canUpdate}
              canDelete={false}
              lessonPlanVerifikasiMap={lessonPlanVerifikasiMap}
              onDeleteClick={(row) => {
                setJadwalToDelete(row);
                setIsDeleteModalOpen(true);
              }}
              onEditClick={(row) => {
                setJadwalToEdit(row);
                setIsEditModalOpen(true);
              }}
            />
          ))
        )}
      </div>

      {/* Modal Hapus */}
      <JadwalDeleteModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        jadwalToDelete={jadwalToDelete}
        onConfirm={() => {
          if (jadwalToDelete) {
            executeDelete(jadwalToDelete.jadwal_id);
          }
          setIsDeleteModalOpen(false);
          setJadwalToDelete(null);
        }}
      />

      {/* Modal Edit Detail Pelajaran */}
      <JadwalEditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        selectedData={jadwalToEdit}
        allJadwalData={allJadwalData}
      />

      {/* Modal Unggah Jadwal ke Lesson Plan */}
      <UnggahJadwalModal
        open={isUnggahModalOpen}
        onOpenChange={setIsUnggahModalOpen}
        onConfirm={executeUnggahJadwal}
        isUploading={isUploading}
        unuploadedCount={unuploadedCount}
        unggahProgress={unggahProgress}
        unggahStats={unggahStats}
      />
    </div>
  );
};

export default JadwalAkademik;
