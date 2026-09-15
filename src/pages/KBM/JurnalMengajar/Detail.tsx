import { useJurnalMengajarDetail } from "./hooks/useJurnalMengajarDetail";
import { DetailHeader } from "./components/detail/DetailHeader";
import { JurnalInfoCard } from "./components/detail/JurnalInfoCard";
import { JurnalAbsensiCard } from "./components/detail/JurnalAbsensiCard";
import { Loader2, AlertTriangle } from "lucide-react";

export default function JurnalMengajarDetail() {
  const {
    navigate,
    canUpdate,
    jurnal,
    isJurnalLoading,
    absensi,
    isAbsensiLoading
  } = useJurnalMengajarDetail();

  if (isJurnalLoading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-gray-500 font-medium text-sm">Memuat detail jurnal...</span>
      </div>
    );
  }

  if (!jurnal) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-800">Jurnal Tidak Ditemukan</h2>
        <button 
          onClick={() => navigate('/kbm/jurnal-mengajar')} 
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          Kembali ke Daftar Jurnal
        </button>
      </div>
    );
  }

  const mapelName = jurnal.jadwal_pelajaran?.mata_pelajaran?.nama_mapel;
  const className = jurnal.jadwal_pelajaran?.kelas?.nama_kelas;
  const guruName = jurnal.jadwal_pelajaran?.pegawai?.nama;
  const materi = jurnal.lesson_plan_detail?.materi || jurnal.lesson_plan_detail?.topik_materi;
  const statusKbm = jurnal.status_kbm || jurnal.status || "Sesuai Target";

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
      <DetailHeader
        mapelName={mapelName}
        className={className}
        guruName={guruName}
        tanggal={jurnal.tanggal}
        onBack={() => navigate('/kbm/jurnal-mengajar')}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6 animate-in slide-in-from-top-6 fade-in duration-500">
          <JurnalInfoCard
            pertemuanKe={jurnal.pertemuan_ke}
            status={statusKbm}
            materi={materi}
            topik={jurnal.lesson_plan_detail?.topik_materi}
            catatanTambahan={jurnal.catatan_tambahan}
          />
        </div>

        <div className="md:col-span-2 animate-in slide-in-from-top-6 fade-in duration-500">
          <JurnalAbsensiCard
            canUpdate={canUpdate}
            isAbsensiLoading={isAbsensiLoading}
            absensi={absensi}
            onUpdateAbsensi={() => navigate('/kbm/absensi/mata-pelajaran', {
              state: {
                jurnalUpdateContext: {
                  jadwal_id: jurnal.jadwal_id,
                  kelas_id: jurnal.jadwal_pelajaran?.kelas_id,
                  mapel_id: jurnal.jadwal_pelajaran?.mapel_id,
                  kelas_nama: jurnal.jadwal_pelajaran?.kelas?.nama_kelas,
                  mapel_nama: jurnal.jadwal_pelajaran?.mata_pelajaran?.nama_mapel,
                  pertemuan: jurnal.pertemuan_ke,
                  lesson_plan_detail_id: jurnal.lesson_plan_detail_id || null
                }
              }
            })}
          />
        </div>
      </div>
    </div>
  );
}
