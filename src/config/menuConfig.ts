import {
  LayoutDashboard, Building, Book, GraduationCap, User,
  Calendar, BarChart, FileText, BookOpen, Clock,
  PenTool, Clipboard, Eye, CalendarDays, BookMarked, RotateCcw,
  Sparkles, Target, History, UserCheck, Users, Wallet, ShieldCheck, Settings,
  Compass, MessageSquare
} from "lucide-react";

export type MenuItem = {
  name: string;
  icon: any;
  path: string;
  allowedRoles?: string[];
  color?: string; // We can add optional color classes for the quick menu
};

export type MenuGroup = {
  category: string;
  items: MenuItem[];
};

export const allMenuGroups: MenuGroup[] = [
  {
    category: "Umum",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", color: "blue" }
    ]
  },
  {
    category: "Tahfidz & Hafalan",
    items: [
      { name: "Input Setoran", icon: Sparkles, path: "/tahfidz/setoran", allowedRoles: ['Super Admin', 'Direktur', 'Guru Tahfidz'], color: "emerald" },
      { name: "Target & Progres", icon: Target, path: "/tahfidz/target", allowedRoles: ['Super Admin', 'Direktur', 'Guru Tahfidz', 'Wali Kelas'], color: "blue" },
      { name: "Riwayat Setoran", icon: History, path: "/tahfidz/riwayat", allowedRoles: ['Super Admin', 'Direktur', 'Guru Tahfidz', 'Wali Kelas', 'Wali Murid'], color: "purple" },
      { name: "Penugasan Kelas", icon: UserCheck, path: "/tahfidz/penugasan", allowedRoles: ['Super Admin', 'Direktur'], color: "amber" },
      { name: "Kelompok Halaqoh", icon: Users, path: "/tahfidz/halaqah", allowedRoles: ['Super Admin', 'Direktur', 'Guru Tahfidz'], color: "teal" },
    ]
  },
  {
    category: "Bimbingan & Konseling",
    items: [
      { name: "Profil 360° Santri", icon: Compass, path: "/guidance", allowedRoles: ['Super Admin', 'Direktur', 'Kepala Sekolah', 'WaKa Kurikulum', 'Admin Lembaga', 'Wali Kelas', 'Guru', 'Guru Tahfidz', 'Murobbi'], color: "blue" },
      { name: "Sesi Konsultasi & BK", icon: MessageSquare, path: "/guidance/sesi-konseling", allowedRoles: ['Super Admin', 'Direktur', 'Kepala Sekolah', 'WaKa Kurikulum', 'Admin Lembaga', 'Wali Kelas', 'Guru', 'Guru Tahfidz', 'Murobbi'], color: "emerald" },
    ]
  },
  {
    category: "Master Data",
    items: [
      { name: "Lembaga", icon: Building, path: "/master-data/lembaga", allowedRoles: ['Super Admin', 'Direktur'], color: "emerald" },
      { name: "Kelas", icon: Book, path: "/master-data/kelas", allowedRoles: ['Super Admin', 'Direktur', 'Kepala Sekolah', 'WaKa Kurikulum', 'Admin Lembaga'], color: "rose" },
      { name: "Siswa", icon: GraduationCap, path: "/master-data/siswa", allowedRoles: ['Super Admin', 'Direktur', 'WaKa Kurikulum', 'Admin Lembaga'], color: "cyan" },
      { name: "Pegawai", icon: User, path: "/master-data/pegawai", allowedRoles: ['Super Admin', 'Direktur', 'Kepala Sekolah', 'WaKa Kurikulum', 'Admin Lembaga'], color: "purple" },
      { name: "Wali Murid", icon: User, path: "/master-data/wali-murid", allowedRoles: ['Super Admin', 'Direktur', 'Admin Lembaga'], color: "indigo" },
      { name: "Tahun Ajaran", icon: CalendarDays, path: "/master-data/tahun-ajaran", allowedRoles: ['Super Admin'], color: "pink" },
    ]
  },
  {
    category: "Akademik",
    items: [
      { name: "Mata Pelajaran", icon: BookOpen, path: "/akademik/mata-pelajaran", allowedRoles: ['Direktur', 'WaKa Kurikulum', 'Admin Lembaga'], color: "blue" },
      { name: "Kalender Akademik", icon: Calendar, path: "/akademik/kalender", allowedRoles: ['Super Admin', 'Direktur', 'Kepala Sekolah', 'WaKa Kurikulum', 'Admin Lembaga', 'Wali Kelas', 'Guru'], color: "orange" },
      { name: "Jam Akademik", icon: Clock, path: "/akademik/jam-akademik", allowedRoles: ['Direktur', 'Kepala Sekolah', 'WaKa Kurikulum', 'Admin Lembaga'], color: "rose" },
      { name: "Jadwal Pelajaran", icon: Clock, path: "/akademik/jadwal/akademik", allowedRoles: ['Direktur', 'Kepala Sekolah', 'WaKa Kurikulum', 'Admin Lembaga'], color: "teal" },
      { name: "Jadwal Guru", icon: Clock, path: "/akademik/jadwal/guru", allowedRoles: ['Direktur', 'Guru'], color: "violet" },
      { name: "Jadwal Kelas", icon: Clock, path: "/akademik/jadwal/kelas", allowedRoles: ['Wali Kelas'], color: "indigo" },
    ]
  },
  {
    category: "KBM",
    items: [
      { name: "Jurnal Mengajar", icon: BookMarked, path: "/kbm/jurnal-mengajar", allowedRoles: ['Direktur', 'Kepala Sekolah', 'WaKa Kurikulum', 'Wali Kelas', 'Guru'], color: "purple" },
      { name: "Lesson Plan", icon: PenTool, path: "/kbm/lesson-plan", allowedRoles: ['Direktur', 'Kepala Sekolah', 'WaKa Kurikulum', 'Guru'], color: "amber" },
      { name: "Activity Plan", icon: FileText, path: "/kbm/activity-plan", allowedRoles: ['Direktur', 'Kepala Sekolah'], color: "emerald" },
      { name: "Absensi Mapel", icon: Clipboard, path: "/kbm/absensi/mata-pelajaran", allowedRoles: ['Guru'], color: "fuchsia" },
      { name: "Rekap Absensi Mapel", icon: Clipboard, path: "/kbm/absensi/rekap-siswa", allowedRoles: ['Direktur', 'Kepala Sekolah', 'WaKa Kurikulum', 'Guru'], color: "pink" },
      { name: "Absensi Harian", icon: Clipboard, path: "/kbm/absensi/harian", allowedRoles: ['Wali Kelas'], color: "cyan" },
      { name: "Rekap Kehadiran", icon: FileText, path: "/kbm/absensi/rekap-harian", allowedRoles: ['Direktur', 'Wali Kelas'], color: "orange" },
      { name: "Reset Absensi", icon: RotateCcw, path: "/kbm/absensi/reset", allowedRoles: ['Direktur', 'Super Admin'], color: "rose" },
      { name: "Monitoring", icon: BarChart, path: "/kbm/monitoring/universal", allowedRoles: ['Direktur', 'Kepala Sekolah', 'WaKa Kurikulum'], color: "indigo" },
      { name: "Pantau Wali", icon: Eye, path: "/kbm/monitoring/wali-kelas", allowedRoles: ['Wali Kelas'], color: "teal" },
    ]
  },
  {
    category: "Keuangan & SPP",
    items: [
      { name: "Loket Kasir", icon: Wallet, path: "/keuangan/loket-kasir", allowedRoles: ['Super Admin', 'Direktur', 'Admin Lembaga', 'Kepala Sekolah'], color: "emerald" },
      { name: "Tagihan Santri", icon: FileText, path: "/keuangan/tagihan", allowedRoles: ['Super Admin', 'Direktur', 'Admin Lembaga', 'Kepala Sekolah'], color: "blue" },
      { name: "Verifikasi Transfer", icon: ShieldCheck, path: "/keuangan/verifikasi-transfer", allowedRoles: ['Super Admin', 'Direktur', 'Admin Lembaga', 'Kepala Sekolah'], color: "amber" },
      { name: "Master Tarif & Rekening", icon: Settings, path: "/keuangan/master-tarif", allowedRoles: ['Super Admin', 'Direktur', 'Admin Lembaga'], color: "purple" },
    ]
  }
];
