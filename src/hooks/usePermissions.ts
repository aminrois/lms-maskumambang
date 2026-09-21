import { useAuthStore } from '../store/useAuthStore';

type ResourcePage = 'pengguna' | 'role' | 'user_role' | 'lembaga' | 'pegawai' | 'siswa' | 'wali-murid' | 'kelas' | 'jam_akademik' | 'tahun_ajaran' | 'mata_pelajaran' | 'jadwal_pelajaran' | 'lesson_plan' | 'jurnal_mengajar' | 'absensi_pelajaran' | 'kalender_akademik' | 'activity_plan' | 'tahfidz_pengampu' | 'tahfidz_setoran' | 'tahfidz_target';

interface Permissions {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canVerify: boolean;
}

const crud: Permissions = { canRead: true, canCreate: true, canUpdate: true, canDelete: true, canVerify: false };
const r: Permissions = { canRead: true, canCreate: false, canUpdate: false, canDelete: false, canVerify: false };
const ru: Permissions = { canRead: true, canCreate: false, canUpdate: true, canDelete: false, canVerify: false };
const rv: Permissions = { canRead: true, canCreate: false, canUpdate: false, canDelete: false, canVerify: true };
const crudv: Permissions = { canRead: true, canCreate: true, canUpdate: true, canDelete: true, canVerify: true };


export const permissionsMap: Record<string, Partial<Record<ResourcePage, Permissions>>> = {
  'Super Admin': {
    pengguna: crud, role: r, user_role: crud, lembaga: crud, siswa: crud, pegawai: crud, 'wali-murid': crud, tahun_ajaran: crud, kelas: crud, kalender_akademik: r, tahfidz_pengampu: crud, tahfidz_setoran: crud, tahfidz_target: crud
  },
  'Direktur': {
    pengguna: r, role: r, user_role: r, lembaga: crud, siswa: crud, pegawai: crud, kelas: crud, mata_pelajaran: r, jam_akademik: r, jadwal_pelajaran: r, lesson_plan: rv, jurnal_mengajar: r, absensi_pelajaran: r, kalender_akademik: crud, activity_plan: rv, 'wali-murid': crud, tahfidz_pengampu: crud, tahfidz_setoran: crud, tahfidz_target: crud
  },
  'Kepala Sekolah': {
    role: r, lembaga: r, pegawai: ru, kelas: r, jam_akademik: r, jadwal_pelajaran: r, lesson_plan: crudv, jurnal_mengajar: crud, absensi_pelajaran: crud, kalender_akademik: r, activity_plan: crud, tahfidz_setoran: r, tahfidz_target: r
  },
  'WaKa Kurikulum': {
    role: r, lembaga: r, siswa: crud, pegawai: r, kelas: r, mata_pelajaran: crud, jam_akademik: crud, jadwal_pelajaran: crud, lesson_plan: crud, jurnal_mengajar: crud, absensi_pelajaran: crud, kalender_akademik: r, tahfidz_setoran: r, tahfidz_target: r
  },
  'Admin Lembaga': {
    pengguna: crud, role: r, user_role: crud, lembaga: r, siswa: crud, pegawai: r, 'wali-murid': crud, kelas: r, mata_pelajaran: crud, jam_akademik: r, jadwal_pelajaran: r, kalender_akademik: r, tahfidz_pengampu: crud, tahfidz_setoran: crud, tahfidz_target: crud
  },
  'Wali Kelas': {
    role: r, lembaga: r, siswa: r, pegawai: r, 'wali-murid': crud, kelas: r, jam_akademik: r, jadwal_pelajaran: r, lesson_plan: crud, jurnal_mengajar: crud, absensi_pelajaran: crud, kalender_akademik: r, tahfidz_setoran: r, tahfidz_target: r
  },
  'Guru': {
    role: r, lembaga: r, pegawai: r, kelas: r, jam_akademik: r, jadwal_pelajaran: r, lesson_plan: crud, jurnal_mengajar: crud, absensi_pelajaran: crud, kalender_akademik: r, activity_plan: r
  },
  'Guru Tahfidz': {
    role: r, lembaga: r, siswa: r, pegawai: r, kelas: r, tahfidz_pengampu: r, tahfidz_setoran: crud, tahfidz_target: crud, kalender_akademik: r
  },
  'Wali Murid': {
    'wali-murid': crud, siswa: r, kalender_akademik: r, tahfidz_setoran: r, tahfidz_target: r
  }
};

export const usePermissions = (page: ResourcePage) => {
  const { roles, role } = useAuthStore();
  const defaultPermissions: Permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canVerify: false };
  if (!roles || roles.length === 0 || !role) return defaultPermissions;
  const roleName = role;
  const rolePermissions = permissionsMap[roleName];
  if (!rolePermissions) return defaultPermissions;
  const pagePermissions = rolePermissions[page];
  return pagePermissions || defaultPermissions;
};
