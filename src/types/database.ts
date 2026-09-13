export interface USER {
  user_id: string;
  username: string;
  created_at: string;
  fcm_device_token?: string;
}

export interface USER_CREATE {
  username: string;
  fcm_device_token?: string;
}

export interface USER_UPDATE {
  username?: string;
  fcm_device_token?: string;
}

export interface ROLE {
  role_id: number;
  nama_role: 'Super Admin' | 'Direktur' | 'Kepala Sekolah' | 'Admin Lembaga' | 'WaKa Kurikulum' | 'Wali Kelas' | 'Guru' | 'Wali Murid';
}

export interface USER_ROLE {
  user_role_id: number;
  user_id: string;
  role_id: number;
  lembaga_id?: number;
}

export interface USER_ROLE_CREATE {
  user_id: string;
  role_id: number;
  lembaga_id?: number;
}

export interface USER_ROLE_UPDATE {
  user_id?: string;
  role_id?: number;
  lembaga_id?: number;
}

export interface LEMBAGA {
  lembaga_id: number;
  nama_lembaga: string;
  singkatan?: string;
  kepala_sekolah_id?: number;
  kurikulum_id?: number;
}

export interface LEMBAGA_CREATE {
  nama_lembaga: string;
  singkatan?: string;
  kepala_sekolah_id?: number;
  kurikulum_id?: number;
}

export interface LEMBAGA_UPDATE {
  nama_lembaga?: string;
  singkatan?: string;
  kepala_sekolah_id?: number | null;
  kurikulum_id?: number | null;
}

export interface SISWA {
  siswa_id: number;
  nis: string;
  nisn: string;
  nik?: string;
  pin?: string;
  nama: string;
  panggilan?: string;
  jenis_kelamin: 'L' | 'P';
  tempat_lahir: string;
  tanggal_lahir: string;
  agama: string;
  kewarganegaraan: string;
  tahun_masuk: number;
  asal_sekolah: string;
  no_un_sebelumnya?: string;
  alamat?: string;
  kode_pos?: string;
  status?: 'Aktif' | 'Tidak Aktif';
  keterangan_asrama: 'Ya' | 'Tidak';
  wali_murid_id?: number;
  kelas_id?: number;
  no_kk?: string;
  no_akta_kelahiran?: string;
  rt?: string;
  rw?: string;
  desa_kelurahan?: string;
  kecamatan?: string;
  kabupaten_kota?: string;
  provinsi?: string;
  alamat_sekolah_asal?: string;
}

export interface SISWA_CREATE {
  nis: string;
  nisn: string;
  nik?: string;
  pin?: string;
  nama: string;
  panggilan?: string;
  jenis_kelamin: 'L' | 'P';
  tempat_lahir: string;
  tanggal_lahir: string;
  agama: string;
  kewarganegaraan: string;
  tahun_masuk: number;
  asal_sekolah: string;
  no_un_sebelumnya?: string;
  alamat?: string;
  kode_pos?: string;
  status?: 'Aktif' | 'Tidak Aktif';
  keterangan_asrama: 'Ya' | 'Tidak';
  wali_murid_id?: number;
  kelas_id?: number;
  no_kk?: string;
  no_akta_kelahiran?: string;
  rt?: string;
  rw?: string;
  desa_kelurahan?: string;
  kecamatan?: string;
  kabupaten_kota?: string;
  provinsi?: string;
  alamat_sekolah_asal?: string;
}

export interface SISWA_UPDATE {
  nis?: string;
  nisn?: string;
  nik?: string;
  pin?: string;
  nama?: string;
  panggilan?: string;
  jenis_kelamin?: 'L' | 'P';
  tempat_lahir?: string;
  tanggal_lahir?: string;
  agama?: string;
  kewarganegaraan?: string;
  tahun_masuk?: number;
  asal_sekolah?: string;
  no_un_sebelumnya?: string;
  alamat?: string;
  kode_pos?: string;
  status?: 'Aktif' | 'Tidak Aktif';
  keterangan_asrama?: 'Ya' | 'Tidak';
  wali_murid_id?: number;
  kelas_id?: number;
  no_kk?: string;
  no_akta_kelahiran?: string;
  rt?: string;
  rw?: string;
  desa_kelurahan?: string;
  kecamatan?: string;
  kabupaten_kota?: string;
  provinsi?: string;
  alamat_sekolah_asal?: string;
}

export interface PEGAWAI {
  pegawai_id: number;
  user_id?: string;
  nig: string;
  nip?: string;
  nik?: string;
  nama: string;
  jenis_kelamin: 'L' | 'P';
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  no_hp?: string;
  status: 'Aktif' | 'Tidak Aktif';
  jabatan: string;
  tugas_tambahan?: string;
  jumlah_anak_laki?: number;
  jumlah_anak_perempuan?: number;
  nama_ayah?: string;
  nama_ibu?: string;
  golongan_darah?: string;
}

export interface PEGAWAI_CREATE {
  user_id?: string;
  nig: string;
  nip?: string;
  nik?: string;
  nama: string;
  jenis_kelamin: 'L' | 'P';
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  no_hp?: string;
  status: 'Aktif' | 'Tidak Aktif';
  jabatan: string;
  tugas_tambahan?: string;
  jumlah_anak_laki?: number;
  jumlah_anak_perempuan?: number;
  nama_ayah?: string;
  nama_ibu?: string;
  golongan_darah?: string;
}

export interface PEGAWAI_UPDATE {
  user_id?: string;
  nig?: string;
  nip?: string;
  nik?: string;
  nama?: string;
  jenis_kelamin?: 'L' | 'P';
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  no_hp?: string;
  status?: 'Aktif' | 'Tidak Aktif';
  jabatan?: string;
  tugas_tambahan?: string;
  jumlah_anak_laki?: number;
  jumlah_anak_perempuan?: number;
  nama_ayah?: string;
  nama_ibu?: string;
  golongan_darah?: string;
}

export interface PEGAWAI_LEMBAGA {
  pegawai_id: number;
  lembaga_id: number;
}

export interface PEGAWAI_LEMBAGA_CREATE {
  pegawai_id: number;
  lembaga_id: number;
}

export interface PEGAWAI_LEMBAGA_UPDATE {
  pegawai_id?: number;
  lembaga_id?: number;
}

export interface WALI_MURID {
  wali_id: number;
  user_id?: string;
  nama_ayah?: string;
  nik_ayah?: string;
  status_ayah?: 'Wafat' | 'Hidup';
  tempat_lahir_ayah?: string;
  tanggal_lahir_ayah?: string;
  email_ayah?: string;
  pin_ayah?: string;
  pendidikan_ayah?: string;
  pekerjaan_ayah?: string;
  penghasilan_ayah?: string;
  nama_ibu?: string;
  nik_ibu?: string;
  status_ibu?: 'Wafat' | 'Hidup';
  tempat_lahir_ibu?: string;
  tanggal_lahir_ibu?: string;
  email_ibu?: string;
  pin_ibu?: string;
  pendidikan_ibu?: string;
  pekerjaan_ibu?: string;
  penghasilan_ibu?: string;
  nama_wali: string;
  nik_wali: string;
  alamat: string;
  status: 'Wafat' | 'Hidup';
  no_hp_ayah?: string;
  no_hp_ibu?: string;
  no_hp_wali: string;
}

export interface WALI_MURID_CREATE {
  user_id?: string;
  nama_ayah?: string;
  nik_ayah?: string;
  status_ayah?: 'Wafat' | 'Hidup';
  tempat_lahir_ayah?: string;
  tanggal_lahir_ayah?: string;
  email_ayah?: string;
  pin_ayah?: string;
  pendidikan_ayah?: string;
  pekerjaan_ayah?: string;
  penghasilan_ayah?: string;
  nama_ibu?: string;
  nik_ibu?: string;
  status_ibu?: 'Wafat' | 'Hidup';
  tempat_lahir_ibu?: string;
  tanggal_lahir_ibu?: string;
  email_ibu?: string;
  pin_ibu?: string;
  pendidikan_ibu?: string;
  pekerjaan_ibu?: string;
  penghasilan_ibu?: string;
  nama_wali: string;
  nik_wali: string;
  alamat: string;
  status: 'Wafat' | 'Hidup';
  no_hp_ayah?: string;
  no_hp_ibu?: string;
  no_hp_wali: string;
}

export interface WALI_MURID_UPDATE {
  user_id?: string;
  nama_ayah?: string;
  nik_ayah?: string;
  status_ayah?: 'Wafat' | 'Hidup';
  tempat_lahir_ayah?: string;
  tanggal_lahir_ayah?: string;
  email_ayah?: string;
  pin_ayah?: string;
  pendidikan_ayah?: string;
  pekerjaan_ayah?: string;
  penghasilan_ayah?: string;
  nama_ibu?: string;
  nik_ibu?: string;
  status_ibu?: 'Wafat' | 'Hidup';
  tempat_lahir_ibu?: string;
  tanggal_lahir_ibu?: string;
  email_ibu?: string;
  pin_ibu?: string;
  pendidikan_ibu?: string;
  pekerjaan_ibu?: string;
  penghasilan_ibu?: string;
  nama_wali?: string;
  nik_wali?: string;
  alamat?: string;
  status?: 'Wafat' | 'Hidup';
  no_hp_ayah?: string;
  no_hp_ibu?: string;
  no_hp_wali?: string;
}

export interface TAHUN_AJARAN {
  tahun_id: number;
  lembaga_id: number;
  nama_tahun: string;
  semester: 'Ganjil' | 'Genap';
  tanggal_mulai: string;
  tanggal_akhir: string;
  is_active?: boolean;
}

export interface TAHUN_AJARAN_CREATE {
  lembaga_id: number;
  nama_tahun: string;
  semester: 'Ganjil' | 'Genap';
  tanggal_mulai: string;
  tanggal_akhir: string;
  is_active?: boolean;
}

export interface TAHUN_AJARAN_UPDATE {
  lembaga_id?: number;
  nama_tahun?: string;
  semester?: 'Ganjil' | 'Genap';
  tanggal_mulai?: string;
  tanggal_akhir?: string;
  is_active?: boolean;
}

export interface KELAS {
  kelas_id: number;
  lembaga_id: number;
  tahun_id: number;
  nama_kelas: string;
  wali_kelas_id?: number;
}

export interface KELAS_CREATE {
  lembaga_id: number;
  tahun_id: number;
  nama_kelas: string;
  wali_kelas_id?: number;
}

export interface KELAS_UPDATE {
  lembaga_id?: number;
  tahun_id?: number;
  nama_kelas?: string;
  wali_kelas_id?: number;
}

export interface MATA_PELAJARAN {
  mapel_id: number;
  lembaga_id: number;
  nama_mapel: string;
}

export interface MATA_PELAJARAN_CREATE {
  lembaga_id: number;
  nama_mapel: string;
}

export interface MATA_PELAJARAN_UPDATE {
  lembaga_id?: number;
  nama_mapel?: string;
}

// KELAS_MAPEL menggantikan PEGAWAI_MAPEL — relasi mata pelajaran per kelas
export interface KELAS_MAPEL {
  kelas_id: number;
  mapel_id: number;
}

export interface KELAS_MAPEL_CREATE {
  kelas_id: number;
  mapel_id: number;
}

export interface KELAS_MAPEL_UPDATE {
  kelas_id?: number;
  mapel_id?: number;
}

export interface JAM_AKADEMIK {
  jam_id: number;
  lembaga_id: number;
  urutan_jam: number;
  jam_mulai: string;
  jam_selesai: string;
  tipe: 'Belajar' | 'Istirahat' | 'Sholat Dhuha & Halaqoh' | 'Apel' | 'Mapel Pilihan / Bimbingan TKA' | 'Bonding / Life Skill';
}

export interface JAM_AKADEMIK_CREATE {
  lembaga_id: number;
  urutan_jam: number;
  jam_mulai: string;
  jam_selesai: string;
  tipe: 'Belajar' | 'Istirahat' | 'Sholat Dhuha & Halaqoh' | 'Apel' | 'Mapel Pilihan / Bimbingan TKA' | 'Bonding / Life Skill';
}

export interface JAM_AKADEMIK_UPDATE {
  lembaga_id?: number;
  urutan_jam?: number;
  jam_mulai?: string;
  jam_selesai?: string;
  tipe?: 'Belajar' | 'Istirahat' | 'Sholat Dhuha & Halaqoh' | 'Apel' | 'Mapel Pilihan / Bimbingan TKA' | 'Bonding / Life Skill';
}

export interface JADWAL_PELAJARAN {
  jadwal_id: number;
  kelas_id?: number | null;
  mapel_id?: number | null;
  pegawai_id?: number | null;
  ruangan?: string | null;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Ahad';
  jam_mulai_id?: number | null;
  jam_selesai_id?: number | null;
}

export interface JADWAL_PELAJARAN_CREATE {
  kelas_id?: number | null;
  mapel_id?: number | null;
  pegawai_id?: number | null;
  ruangan?: string | null;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Ahad';
  jam_mulai_id?: number | null;
  jam_selesai_id?: number | null;
}

export interface JADWAL_PELAJARAN_UPDATE {
  kelas_id?: number | null;
  mapel_id?: number | null;
  pegawai_id?: number | null;
  ruangan?: string | null;
  hari?: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Ahad';
  jam_mulai_id?: number | null;
  jam_selesai_id?: number | null;
}

export interface LESSON_PLAN {
  lesson_plan_id: number;
  pegawai_id: number;
  jadwal_id?: number | null;
  judul_rpp: string;
  status_verifikasi_kepsek?: 'Menunggu Verifikasi' | 'Disetujui' | 'Revisi';
  verified_by_kepsek?: number;
  catatan_revisi_kepsek?: string;
  status_verifikasi_direktur?: 'Menunggu Verifikasi' | 'Disetujui' | 'Revisi';
  verified_by_direktur?: number;
  catatan_revisi_direktur?: string;
}

export interface LESSON_PLAN_CREATE {
  pegawai_id: number;
  judul_rpp: string;
  jadwal_id?: number | null;
  status_verifikasi_kepsek?: 'Menunggu Verifikasi' | 'Disetujui' | 'Revisi';
  catatan_revisi_kepsek?: string;
  status_verifikasi_direktur?: 'Menunggu Verifikasi' | 'Disetujui' | 'Revisi';
  catatan_revisi_direktur?: string;
}

export interface LESSON_PLAN_UPDATE {
  pegawai_id?: number;
  jadwal_id?: number | null;
  judul_rpp?: string;
  status_verifikasi_kepsek?: 'Menunggu Verifikasi' | 'Disetujui' | 'Revisi';
  verified_by_kepsek?: number;
  catatan_revisi_kepsek?: string;
  status_verifikasi_direktur?: 'Menunggu Verifikasi' | 'Disetujui' | 'Revisi';
  verified_by_direktur?: number;
  catatan_revisi_direktur?: string;
}

export interface LESSON_PLAN_DETAIL {
  detail_id: number;
  lesson_plan_id: number;
  pertemuan_ke: number;
  materi?: string;
  topik_materi?: string;
  pelaksanaan_kbm?: string; // Diisi dinamis di client dari jadwal_pelajaran
  rencana_pelaksanaan_kbm?: string | null;
  isi?: string | null;
}

export interface LESSON_PLAN_DETAIL_CREATE {
  lesson_plan_id: number;
  pertemuan_ke: number;
  materi?: string;
  topik_materi?: string;
  rencana_pelaksanaan_kbm?: string | null;
  isi?: string | null;
}

export interface LESSON_PLAN_DETAIL_UPDATE {
  lesson_plan_id?: number;
  pertemuan_ke?: number;
  materi?: string;
  topik_materi?: string;
  rencana_pelaksanaan_kbm?: string | null;
  isi?: string | null;
}

export interface JURNAL_MENGAJAR {
  jurnal_id: number;
  jadwal_id: number;
  lesson_plan_detail_id?: number;
  pertemuan_ke?: number;
  status?: 'Tertinggal' | 'Sesuai' | 'Terlalu Cepat';
  tanggal: string;
  catatan_tambahan?: string;
}


export interface JURNAL_MENGAJAR_CREATE {
  jadwal_id: number;
  lesson_plan_detail_id?: number;
  pertemuan_ke: number;
  tanggal: string;
  catatan_tambahan?: string;
}

export interface JURNAL_MENGAJAR_UPDATE {
  jadwal_id?: number;
  lesson_plan_detail_id?: number;
  pertemuan_ke?: number;
  status?: 'Tertinggal' | 'Sesuai' | 'Terlalu Cepat';
  tanggal?: string;
  catatan_tambahan?: string;
}

export interface ABSENSI_PELAJARAN {
  absensi_pel_id: number;
  siswa_id: number;
  jurnal_id: number;
  waktu_kehadiran?: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Dispen';
}

export interface ABSENSI_PELAJARAN_CREATE {
  siswa_id: number;
  jurnal_id: number;
  waktu_kehadiran?: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Dispen';
}

export interface ABSENSI_PELAJARAN_UPDATE {
  siswa_id?: number;
  jurnal_id?: number;
  waktu_kehadiran?: string;
  status?: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Dispen';
}

export interface ABSENSI_HARIAN {
  absensi_harian_id: number;
  siswa_id: number;
  tanggal: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Dispen';
}

export interface ABSENSI_HARIAN_CREATE {
  siswa_id: number;
  tanggal: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Dispen';
}

export interface ABSENSI_HARIAN_UPDATE {
  siswa_id?: number;
  tanggal?: string;
  status?: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Dispen';
}

export interface KALENDER_AKADEMIK {
  kalender_id: number;
  lembaga_id?: number;
  tahun_id: number;
  nama_kegiatan: string;
  kategori: 'Akademik' | 'Acara' | 'Libur' | 'Lainnya';
  tanggal_mulai: string;
  tanggal_berakhir: string;
}

export interface KALENDER_AKADEMIK_CREATE {
  lembaga_id?: number;
  tahun_id: number;
  nama_kegiatan: string;
  kategori: 'Akademik' | 'Acara' | 'Libur' | 'Lainnya';
  tanggal_mulai: string;
  tanggal_berakhir: string;
}

export interface KALENDER_AKADEMIK_UPDATE {
  lembaga_id?: number;
  tahun_id?: number;
  nama_kegiatan?: string;
  kategori?: 'Akademik' | 'Acara' | 'Libur' | 'Lainnya';
  tanggal_mulai?: string;
  tanggal_berakhir?: string;
}

export interface ACTIVITY_PLAN {
  activity_id: number;
  lembaga_id: number;
  tahun_id: number;
  nama_kegiatan: string;
  kategori: 'Akademik' | 'Acara' | 'Libur' | 'Lainnya';
  tanggal_mulai: string;
  tanggal_berakhir: string;
  deskripsi?: string;
  status_verifikasi?: 'Menunggu Verifikasi' | 'Disetujui' | 'Revisi';
  verified_by?: number;
  catatan_revisi?: string;
}

export interface ACTIVITY_PLAN_CREATE {
  lembaga_id: number;
  tahun_id: number;
  nama_kegiatan: string;
  kategori: 'Akademik' | 'Acara' | 'Libur' | 'Lainnya';
  tanggal_mulai: string;
  tanggal_berakhir: string;
  deskripsi?: string;
  status_verifikasi?: 'Menunggu Verifikasi' | 'Disetujui' | 'Revisi';
  verified_by?: number;
  catatan_revisi?: string;
}

export interface ACTIVITY_PLAN_UPDATE {
  lembaga_id?: number;
  tahun_id?: number;
  nama_kegiatan?: string;
  kategori?: 'Akademik' | 'Acara' | 'Libur' | 'Lainnya';
  tanggal_mulai?: string;
  tanggal_berakhir?: string;
  deskripsi?: string;
  status_verifikasi?: 'Menunggu Verifikasi' | 'Disetujui' | 'Revisi';
  verified_by?: number;
  catatan_revisi?: string;
}

export interface VERIFY_LESSON_PLAN_KEPSEK_REQUEST {
  p_lesson_plan_id: number;
  p_action: 'Disetujui' | 'Revisi';
  p_catatan_revisi: string;
}

export interface VERIFY_LESSON_PLAN_DIREKTUR_REQUEST {
  p_lesson_plan_id: number;
  p_action: 'Disetujui' | 'Revisi';
  p_catatan_revisi: string;
}

export interface MONITORING_KBM_REQUEST {
  kelas_id?: number;
  lembaga_id: number;
  tanggal_mulai: string;
  tanggal_akhir: string;
}

export interface VERIFY_ACTIVITY_PLAN_REQUEST {
  activity_id: number;
  action: 'Disetujui' | 'Revisi';
  catatan_revisi?: string;
}

export interface ABSENSI_SUMMARY_REQUEST {
  lembaga_id: number;
  kelas_id?: number;
  mapel_id?: number;
  tanggal_mulai: string;
  tanggal_akhir: string;
}

export interface CHANGE_PASSWORD_REQUEST {
  old_password: string;
  new_password: string;
}

