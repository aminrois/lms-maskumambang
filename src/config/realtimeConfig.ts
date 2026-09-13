import type { RealtimeTable } from "@/hooks/useRealtimeSync";

/**
 * Kontrol Master & Registri Realtime Supabase Frontend
 * Proyek: Maskumambang Learning Management System (MLMS) Web
 *
 * File ini digunakan sebagai saklar (toggle) dan registri pusat fitur Supabase Realtime di Frontend.
 * Anda dapat mengaktifkan/mematikan fitur realtime secara global atau per modul/halaman.
 */

export interface RealtimeFeatureDefinition {
  /** Kode unik fitur */
  id: string;
  /** Nama fitur / modul */
  name: string;
  /** Rute halaman frontend */
  page: string;
  /** Deskripsi fungsi realtime */
  description: string;
  /** Saklar aktif/nonaktif per fitur */
  enabled: boolean;
  /** Daftar tabel Supabase dan query key yang akan di-invalidate */
  tables: RealtimeTable[];
}

export const REALTIME_CONFIG = {
  /** Master switch: ubah ke false jika ingin menonaktifkan seluruh fitur realtime di frontend */
  GLOBAL_ENABLED: false,

  /** Registri modul dan halaman frontend yang menggunakan Realtime Supabase */
  FEATURES: {
    MAIN_LAYOUT: {
      id: "MAIN_LAYOUT",
      name: "Main Layout (Profil & Lembaga)",
      page: "Global / Sidebar",
      description: "Sinkronisasi realtime profil pengguna aktif dan daftar lembaga",
      enabled: true,
      tables: [
        { table: "pegawai", queryKeys: [["mainlayout", "pegawai-profile"]] },
        { table: "lembaga", queryKeys: [["mainlayout", "lembaga-list"]] }
      ]
    },
    MASTER_DATA_LEMBAGA: {
      id: "MASTER_DATA_LEMBAGA",
      name: "Master Data Lembaga",
      page: "/master-data/lembaga",
      description: "Sinkronisasi realtime statistik & daftar lembaga saat data bertambah/diubah",
      enabled: true,
      tables: [
        { table: "lembaga", queryKeys: [["master-data", "lembaga-all"], ["master-data", "lembaga-options"]] }
      ]
    },
    MASTER_DATA_PEGAWAI: {
      id: "MASTER_DATA_PEGAWAI",
      name: "Master Data Pegawai & Role",
      page: "/master-data/pegawai",
      description: "Sinkronisasi realtime daftar guru/pegawai, penugasan role, dan lembaga",
      enabled: true,
      tables: [
        { table: "pegawai", queryKeys: [["master-data", "pegawai-all"], ["master-data", "pegawai-options"]] },
        { table: "user_role", queryKeys: [["master-data", "pegawai-all"]] },
        { table: "pegawai_lembaga", queryKeys: [["master-data", "pegawai-all"]] }
      ]
    },
    MASTER_DATA_SISWA: {
      id: "MASTER_DATA_SISWA",
      name: "Master Data Siswa",
      page: "/master-data/siswa",
      description: "Sinkronisasi realtime daftar siswa dan entri siswa per kelas/lembaga",
      enabled: true,
      tables: [
        { table: "siswa", queryKeys: [["master-data", "siswa-all"]] }
      ]
    },
    MASTER_DATA_KELAS: {
      id: "MASTER_DATA_KELAS",
      name: "Master Data Kelas",
      page: "/master-data/kelas",
      description: "Sinkronisasi realtime daftar kelas dan penetapan wali kelas",
      enabled: true,
      tables: [
        { table: "kelas", queryKeys: [["master-data", "kelas-all"], ["master-data", "kelas-options"]] }
      ]
    },
    MASTER_DATA_WALI_MURID: {
      id: "MASTER_DATA_WALI_MURID",
      name: "Master Data Wali Murid",
      page: "/master-data/wali-murid",
      description: "Sinkronisasi realtime data orang tua/wali murid dan anak",
      enabled: true,
      tables: [
        { table: "wali_murid", queryKeys: [["master-data", "wali-murid-all"]] }
      ]
    },
    MASTER_DATA_TAHUN_AJARAN: {
      id: "MASTER_DATA_TAHUN_AJARAN",
      name: "Master Data Tahun Ajaran",
      page: "/master-data/tahun-ajaran",
      description: "Sinkronisasi realtime status aktif tahun ajaran",
      enabled: true,
      tables: [
        { table: "tahun_ajaran", queryKeys: [["master-data", "tahun-ajaran-all"], ["akademik", "tahun-ajaran-aktif"]] }
      ]
    },
    AKADEMIK_KALENDER: {
      id: "AKADEMIK_KALENDER",
      name: "Kalender Akademik",
      page: "/akademik/kalender",
      description: "Sinkronisasi realtime agenda kegiatan dan libur sekolah",
      enabled: true,
      tables: [
        { table: "kalender_akademik", queryKeys: [["akademik", "kalender"]] }
      ]
    },
    AKADEMIK_JADWAL: {
      id: "AKADEMIK_JADWAL",
      name: "Jadwal Pelajaran",
      page: "/akademik/jadwal",
      description: "Sinkronisasi realtime jadwal KBM per kelas & guru",
      enabled: true,
      tables: [
        { table: "jadwal_pelajaran", queryKeys: [["akademik", "jadwal-pelajaran"], ["akademik", "jadwal-template"]] }
      ]
    },
    AKADEMIK_JAM: {
      id: "AKADEMIK_JAM",
      name: "Jam Akademik & Jam Khusus",
      page: "/akademik/jam",
      description: "Sinkronisasi realtime slot waktu jam pelajaran & override jam khusus per lembaga",
      enabled: true,
      tables: [
        { table: "jam_akademik", queryKeys: [["akademik", "jam-akademik"]] },
        { table: "jadwal_pelajaran", queryKeys: [["akademik", "jam-khusus-db"], ["akademik", "jam-akademik"], ["akademik", "jadwal-pelajaran"], ["akademik", "jadwal-template"]] }
      ]
    },
    AKADEMIK_MAPEL: {
      id: "AKADEMIK_MAPEL",
      name: "Mata Pelajaran",
      page: "/akademik/mata-pelajaran",
      description: "Sinkronisasi realtime daftar mapel & pemetaan kelas_mapel",
      enabled: true,
      tables: [
        { table: "mata_pelajaran", queryKeys: [["akademik", "mata-pelajaran"]] },
        { table: "kelas_mapel", queryKeys: [["akademik", "mata-pelajaran"]] }
      ]
    },
    KBM_ACTIVITY_PLAN: {
      id: "KBM_ACTIVITY_PLAN",
      name: "Activity Plan",
      page: "/kbm/activity-plan",
      description: "Sinkronisasi realtime pengajuan dan verifikasi rencana kegiatan",
      enabled: true,
      tables: [
        { table: "activity_plan", queryKeys: [["kbm", "activity-plans"], ["kbm", "activity-plans-verification"]] }
      ]
    },
    KBM_LESSON_PLAN: {
      id: "KBM_LESSON_PLAN",
      name: "Lesson Plan / RPP",
      page: "/kbm/lesson-plan",
      description: "Sinkronisasi realtime RPP & status verifikasi Kepsek/Direktur",
      enabled: true,
      tables: [
        { table: "lesson_plan", queryKeys: [["kbm", "lesson-plans"], ["kbm", "lesson-plans-validity"]] },
        { table: "lesson_plan_detail", queryKeys: [["kbm", "lesson-plans"]] }
      ]
    },
    KBM_JURNAL_MENGAJAR: {
      id: "KBM_JURNAL_MENGAJAR",
      name: "Jurnal Mengajar",
      page: "/kbm/jurnal-mengajar",
      description: "Sinkronisasi realtime riwayat pelaksanaan KBM harian",
      enabled: true,
      tables: [
        { table: "jurnal_mengajar", queryKeys: [["kbm", "jurnal-mengajar"]] }
      ]
    },
    KBM_ABSENSI: {
      id: "KBM_ABSENSI",
      name: "Absensi Pelajaran & Harian",
      page: "/kbm/absensi",
      description: "Sinkronisasi realtime presensi mapel & presensi harian siswa",
      enabled: true,
      tables: [
        { table: "absensi_pelajaran", queryKeys: [["kbm", "absensi-pelajaran"]] },
        { table: "absensi_harian", queryKeys: [["kbm", "absensi-harian"]] }
      ]
    }
  } as Record<string, RealtimeFeatureDefinition>
};
