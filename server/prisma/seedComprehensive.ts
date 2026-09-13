import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Memulai Seeding Data Trial Lengkap...');

  // 1. Roles
  const rolesList = [
    'Super Admin',
    'Direktur',
    'Kepala Sekolah',
    'Admin Lembaga',
    'WaKa Kurikulum',
    'Wali Kelas',
    'Guru',
    'Wali Murid',
  ];

  const roleMap: Record<string, number> = {};
  for (const roleName of rolesList) {
    const r = await prisma.role.upsert({
      where: { nama_role: roleName },
      update: {},
      create: { nama_role: roleName },
    });
    roleMap[roleName] = r.role_id;
  }
  console.log('✅ 1. Roles siap.');

  // 2. Lembaga
  const lembagasData = [
    { nama_lembaga: 'Madrasah Aliyah Maskumambang Putra', singkatan: 'MA Putra' },
    { nama_lembaga: 'Madrasah Aliyah Maskumambang Putri', singkatan: 'MA Putri' },
    { nama_lembaga: 'Madrasah Tsanawiyah Maskumambang Putra', singkatan: 'MTs Putra' },
    { nama_lembaga: 'Madrasah Tsanawiyah Maskumambang Putri', singkatan: 'MTs Putri' },
    { nama_lembaga: 'Sekolah Dasar Islam Terpadu Maskumambang', singkatan: 'SDIT' },
  ];

  const lembagaMap: Record<string, number> = {};
  for (const lem of lembagasData) {
    let existing = await prisma.lembaga.findFirst({ where: { nama_lembaga: lem.nama_lembaga } });
    if (!existing) {
      existing = await prisma.lembaga.create({ data: lem });
    }
    lembagaMap[lem.singkatan] = existing.lembaga_id;
  }
  console.log('✅ 2. Lembaga siap.');

  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // Helper untuk buat User + Pegawai + Role
  async function createOrUpdateUserPegawai(data: {
    username: string;
    email: string;
    passwordHash: string;
    roleName: string;
    lembagaSingkatan?: string;
    nig: string;
    nip?: string;
    nama: string;
    jenis_kelamin: 'L' | 'P';
    jabatan: string;
    tugas_tambahan?: string;
  }) {
    let user = await prisma.user.findUnique({ where: { username: data.username } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          password_hash: data.passwordHash,
        },
      });
    }

    const roleId = roleMap[data.roleName];
    const lembagaId = data.lembagaSingkatan ? lembagaMap[data.lembagaSingkatan] : null;

    if (roleId) {
      const existingUserRole = await prisma.userRole.findFirst({
        where: { user_id: user.user_id, role_id: roleId, lembaga_id: lembagaId },
      });
      if (!existingUserRole) {
        await prisma.userRole.create({
          data: {
            user_id: user.user_id,
            role_id: roleId,
            lembaga_id: lembagaId,
          },
        });
      }
    }

    let pegawai = await prisma.pegawai.findUnique({ where: { nig: data.nig } });
    if (!pegawai) {
      pegawai = await prisma.pegawai.create({
        data: {
          user_id: user.user_id,
          nig: data.nig,
          nip: data.nip || null,
          nama: data.nama,
          jenis_kelamin: data.jenis_kelamin,
          jabatan: data.jabatan,
          tugas_tambahan: data.tugas_tambahan || null,
          status: 'Aktif',
        },
      });

      if (lembagaId) {
        await prisma.pegawaiLembaga.create({
          data: {
            pegawai_id: pegawai.pegawai_id,
            lembaga_id: lembagaId,
          },
        });
      }
    }

    return { user, pegawai };
  }

  // 3. Buat Akun untuk Seluruh Role
  console.log('👤 3. Membuat Akun Pengguna untuk Setiap Role...');

  // Super Admin
  await createOrUpdateUserPegawai({
    username: 'admin',
    email: 'admin@maskumambang.sch.id',
    passwordHash: adminPasswordHash,
    roleName: 'Super Admin',
    nig: 'ADM001',
    nama: 'Administrator Utama',
    jenis_kelamin: 'L',
    jabatan: 'Super Administrator',
  });

  // Direktur
  const { pegawai: pegDirektur } = await createOrUpdateUserPegawai({
    username: 'direktur',
    email: 'direktur@maskumambang.sch.id',
    passwordHash: defaultPasswordHash,
    roleName: 'Direktur',
    nig: 'DIR001',
    nama: 'K.H. Dr. Ahmad Fathoni, M.A.',
    jenis_kelamin: 'L',
    jabatan: 'Direktur Pendidikan Pesantren',
  });

  // Kepala Sekolah MA Putra
  const { pegawai: pegKepsek } = await createOrUpdateUserPegawai({
    username: 'kepsek_ma',
    email: 'kepsek.ma@maskumambang.sch.id',
    passwordHash: defaultPasswordHash,
    roleName: 'Kepala Sekolah',
    lembagaSingkatan: 'MA Putra',
    nig: 'PEG101',
    nip: '197805122005011002',
    nama: 'Drs. H. M. Zainal Arifin, M.Pd.',
    jenis_kelamin: 'L',
    jabatan: 'Kepala Madrasah',
    tugas_tambahan: 'Kepala Sekolah',
  });

  // Update Kepala Sekolah ID di Lembaga MA Putra
  const maPutraId = lembagaMap['MA Putra'];
  if (maPutraId && pegKepsek) {
    await prisma.lembaga.update({
      where: { lembaga_id: maPutraId },
      data: { kepala_sekolah_id: pegKepsek.pegawai_id },
    });
  }

  // Admin Lembaga MA Putra
  await createOrUpdateUserPegawai({
    username: 'admin_ma',
    email: 'admin.ma@maskumambang.sch.id',
    passwordHash: defaultPasswordHash,
    roleName: 'Admin Lembaga',
    lembagaSingkatan: 'MA Putra',
    nig: 'PEG102',
    nama: 'Ust. Rahmat Hidayat, S.Kom.',
    jenis_kelamin: 'L',
    jabatan: 'Tenaga Kependidikan / TU',
    tugas_tambahan: 'Operator Lembaga',
  });

  // WaKa Kurikulum MA Putra
  const { pegawai: pegWaka } = await createOrUpdateUserPegawai({
    username: 'waka_kurikulum',
    email: 'waka.kurikulum@maskumambang.sch.id',
    passwordHash: defaultPasswordHash,
    roleName: 'WaKa Kurikulum',
    lembagaSingkatan: 'MA Putra',
    nig: 'PEG103',
    nama: 'Ust. Abdullah Faqih, M.Pd.',
    jenis_kelamin: 'L',
    jabatan: 'Guru Ahli Madya',
    tugas_tambahan: 'Wakil Kepala Kurikulum',
  });

  // Wali Kelas X-A
  const { pegawai: pegWalikelas } = await createOrUpdateUserPegawai({
    username: 'walikelas_10a',
    email: 'walikelas10a@maskumambang.sch.id',
    passwordHash: defaultPasswordHash,
    roleName: 'Wali Kelas',
    lembagaSingkatan: 'MA Putra',
    nig: 'PEG104',
    nama: 'Ust. Muhyiddin S.Si.',
    jenis_kelamin: 'L',
    jabatan: 'Guru Mata Pelajaran',
    tugas_tambahan: 'Wali Kelas X-A MIPA',
  });

  // Guru Matematika
  const { pegawai: pegGuruMath } = await createOrUpdateUserPegawai({
    username: 'guru_matematika',
    email: 'guru.matematika@maskumambang.sch.id',
    passwordHash: defaultPasswordHash,
    roleName: 'Guru',
    lembagaSingkatan: 'MA Putra',
    nig: 'PEG105',
    nama: 'Ust. Muhammad Ilyas, M.Sc.',
    jenis_kelamin: 'L',
    jabatan: 'Guru Matematika',
  });

  // Guru PAI
  const { pegawai: pegGuruPai } = await createOrUpdateUserPegawai({
    username: 'guru_pai',
    email: 'guru.pai@maskumambang.sch.id',
    passwordHash: defaultPasswordHash,
    roleName: 'Guru',
    lembagaSingkatan: 'MA Putra',
    nig: 'PEG106',
    nama: 'Ust. Ridwan Ali, Lc.',
    jenis_kelamin: 'L',
    jabatan: 'Guru Fiqih & Tafsir',
  });

  console.log('✅ 3. Seluruh Akun Role berhasil dibuat.');

  // 4. Tahun Ajaran
  console.log('📅 4. Menyiapkan Tahun Ajaran...');
  let tahunAjaranAktif = await prisma.tahunAjaran.findFirst({
    where: { nama_tahun: '2025/2026 Ganjil' },
  });
  if (!tahunAjaranAktif) {
    tahunAjaranAktif = await prisma.tahunAjaran.create({
      data: {
        lembaga_id: maPutraId,
        nama_tahun: '2025/2026',
        semester: 'Ganjil',
        tanggal_mulai: '2025-07-14',
        tanggal_akhir: '2025-12-20',
        is_active: true,
      },
    });
  }
  const tahunId = tahunAjaranAktif.tahun_id;

  // 5. Kelas
  console.log('🏫 5. Menyiapkan Kelas...');
  const kelasData = [
    { nama_kelas: 'X-A MIPA (Tahfidz)', wali_kelas_id: pegWalikelas.pegawai_id },
    { nama_kelas: 'X-B MIPA (Reguler)', wali_kelas_id: pegGuruMath.pegawai_id },
    { nama_kelas: 'XI-A MIPA', wali_kelas_id: pegWaka.pegawai_id },
    { nama_kelas: 'XII-A MIPA', wali_kelas_id: pegKepsek.pegawai_id },
  ];

  const kelasMap: Record<string, number> = {};
  for (const k of kelasData) {
    let existingKelas = await prisma.kelas.findFirst({
      where: { nama_kelas: k.nama_kelas, lembaga_id: maPutraId },
    });
    if (!existingKelas) {
      existingKelas = await prisma.kelas.create({
        data: {
          nama_kelas: k.nama_kelas,
          lembaga_id: maPutraId,
          tahun_id: tahunId,
          wali_kelas_id: k.wali_kelas_id,
        },
      });
    }
    kelasMap[k.nama_kelas] = existingKelas.kelas_id;
  }
  const kelas10AId = kelasMap['X-A MIPA (Tahfidz)'];

  // 6. Mata Pelajaran
  console.log('📖 6. Menyiapkan Mata Pelajaran...');
  const mapelList = [
    'Matematika Wajib',
    'Fiqih & Ushul Fiqih',
    'Bahasa Arab',
    'Bahasa Inggris',
    'Fisika',
    'Al-Qur\'an Hadits',
  ];

  const mapelMap: Record<string, number> = {};
  for (const namaMapel of mapelList) {
    let existingMapel = await prisma.mataPelajaran.findFirst({
      where: { nama_mapel: namaMapel, lembaga_id: maPutraId },
    });
    if (!existingMapel) {
      existingMapel = await prisma.mataPelajaran.create({
        data: {
          nama_mapel: namaMapel,
          lembaga_id: maPutraId,
        },
      });
    }
    mapelMap[namaMapel] = existingMapel.mapel_id;

    // Hubungkan mapel ke kelas
    if (kelas10AId) {
      await prisma.kelasMapel.upsert({
        where: { kelas_id_mapel_id: { kelas_id: kelas10AId, mapel_id: existingMapel.mapel_id } },
        update: {},
        create: { kelas_id: kelas10AId, mapel_id: existingMapel.mapel_id },
      });
    }
  }

  // 7. Jam Akademik
  console.log('⏰ 7. Menyiapkan Jam Akademik...');
  const jamData = [
    { urutan_jam: 1, jam_mulai: '07:00', jam_selesai: '07:45', tipe: 'Belajar' },
    { urutan_jam: 2, jam_mulai: '07:45', jam_selesai: '08:30', tipe: 'Belajar' },
    { urutan_jam: 3, jam_mulai: '08:30', jam_selesai: '09:15', tipe: 'Belajar' },
    { urutan_jam: 4, jam_mulai: '09:15', jam_selesai: '09:45', tipe: 'Sholat Dhuha & Halaqoh' },
    { urutan_jam: 5, jam_mulai: '09:45', jam_selesai: '10:30', tipe: 'Belajar' },
    { urutan_jam: 6, jam_mulai: '10:30', jam_selesai: '11:15', tipe: 'Belajar' },
    { urutan_jam: 7, jam_mulai: '11:15', jam_selesai: '12:00', tipe: 'Belajar' },
    { urutan_jam: 8, jam_mulai: '12:00', jam_selesai: '13:00', tipe: 'Istirahat' },
  ];

  const jamMap: Record<number, number> = {};
  for (const j of jamData) {
    let existingJam = await prisma.jamAkademik.findFirst({
      where: { lembaga_id: maPutraId, urutan_jam: j.urutan_jam },
    });
    if (!existingJam) {
      existingJam = await prisma.jamAkademik.create({
        data: {
          lembaga_id: maPutraId,
          ...j,
        },
      });
    }
    jamMap[j.urutan_jam] = existingJam.jam_id;
  }

  // 8. Wali Murid & Siswa
  console.log('👨‍👩‍👦 8. Menyiapkan Data Siswa & Wali Murid...');
  let wali1 = await prisma.waliMurid.findFirst({ where: { no_hp_wali: '081234567890' } });
  if (!wali1) {
    wali1 = await prisma.waliMurid.create({
      data: {
        nama_wali: 'H. Sudirman, S.E.',
        nik_wali: '3525011205700001',
        nama_ayah: 'H. Sudirman, S.E.',
        nama_ibu: 'Hj. Siti Aminah',
        pekerjaan_ayah: 'Wiraswasta',
        no_hp_wali: '081234567890',
        no_hp_ayah: '081234567890',
        alamat: 'Jl. Raya Maskumambang No. 45 Dukun Gresik',
        status: 'Hidup',
      },
    });
  }

  const siswasData = [
    { nisn: '0089123451', nis: '25261001', nama: 'Ahmad Faiz Mubarok', jenis_kelamin: 'L', tempat_lahir: 'Gresik', tanggal_lahir: '2009-05-12', tahun_masuk: 2025, asal_sekolah: 'MTs Maskumambang', status: 'Aktif', keterangan_asrama: 'Ya' },
    { nisn: '0089123452', nis: '25261002', nama: 'Muhammad Rizky Ramadhan', jenis_kelamin: 'L', tempat_lahir: 'Surabaya', tanggal_lahir: '2009-09-20', tahun_masuk: 2025, asal_sekolah: 'SMP Al-Hikmah', status: 'Aktif', keterangan_asrama: 'Ya' },
    { nisn: '0089123453', nis: '25261003', nama: 'Fathur Rahman Hakim', jenis_kelamin: 'L', tempat_lahir: 'Lamongan', tanggal_lahir: '2009-03-15', tahun_masuk: 2025, asal_sekolah: 'MTsN 1 Lamongan', status: 'Aktif', keterangan_asrama: 'Ya' },
    { nisn: '0089123454', nis: '25261004', nama: 'Zaidan Al-Farisi', jenis_kelamin: 'L', tempat_lahir: 'Sidoarjo', tanggal_lahir: '2009-11-08', tahun_masuk: 2025, asal_sekolah: 'SMP IT Darul Fikri', status: 'Aktif', keterangan_asrama: 'Tidak' },
    { nisn: '0089123455', nis: '25261005', nama: 'Ibrahim Nu\'man', jenis_kelamin: 'L', tempat_lahir: 'Gresik', tanggal_lahir: '2009-01-25', tahun_masuk: 2025, asal_sekolah: 'MTs Maskumambang', status: 'Aktif', keterangan_asrama: 'Ya' },
  ];

  const siswaList = [];
  for (const s of siswasData) {
    let existingSiswa = await prisma.siswa.findUnique({ where: { nisn: s.nisn } });
    if (!existingSiswa) {
      existingSiswa = await prisma.siswa.create({
        data: {
          ...s,
          kelas_id: kelas10AId,
          wali_murid_id: wali1.wali_id,
        },
      });
    }
    siswaList.push(existingSiswa);
  }

  // 9. Jadwal Pelajaran
  console.log('🗓️ 9. Menyiapkan Jadwal Pelajaran...');
  let jadwalMath = await prisma.jadwalPelajaran.findFirst({
    where: { kelas_id: kelas10AId, mapel_id: mapelMap['Matematika Wajib'] },
  });
  if (!jadwalMath) {
    jadwalMath = await prisma.jadwalPelajaran.create({
      data: {
        kelas_id: kelas10AId,
        mapel_id: mapelMap['Matematika Wajib'],
        pegawai_id: pegGuruMath.pegawai_id,
        hari: 'Senin',
        ruangan: 'Kelas X-A (Gedung Umar Lt. 2)',
        jam_mulai_id: jamMap[1],
        jam_selesai_id: jamMap[2],
      },
    });
  }

  let jadwalPai = await prisma.jadwalPelajaran.findFirst({
    where: { kelas_id: kelas10AId, mapel_id: mapelMap['Fiqih & Ushul Fiqih'] },
  });
  if (!jadwalPai) {
    jadwalPai = await prisma.jadwalPelajaran.create({
      data: {
        kelas_id: kelas10AId,
        mapel_id: mapelMap['Fiqih & Ushul Fiqih'],
        pegawai_id: pegGuruPai.pegawai_id,
        hari: 'Selasa',
        ruangan: 'Kelas X-A (Gedung Umar Lt. 2)',
        jam_mulai_id: jamMap[1],
        jam_selesai_id: jamMap[3],
      },
    });
  }

  // 10. Kalender Akademik
  console.log('📌 10. Menyiapkan Kalender Akademik...');
  const kalenderData = [
    { nama_kegiatan: 'Masa Ta\'aruf Santri Baru (MATSAMA)', kategori: 'Akademik', tanggal_mulai: '2025-07-15', tanggal_berakhir: '2025-07-18' },
    { nama_kegiatan: 'Penilaian Tengah Semester (PTS) Ganjil', kategori: 'Akademik', tanggal_mulai: '2025-09-22', tanggal_berakhir: '2025-09-27' },
    { nama_kegiatan: 'Peringatan Hari Santri Nasional', kategori: 'Acara', tanggal_mulai: '2025-10-22', tanggal_berakhir: '2025-10-22' },
    { nama_kegiatan: 'Asesmen Akhir Semester (AAS) Ganjil', kategori: 'Akademik', tanggal_mulai: '2025-12-01', tanggal_berakhir: '2025-12-12' },
    { nama_kegiatan: 'Libur Semester Ganjil', kategori: 'Libur', tanggal_mulai: '2025-12-22', tanggal_berakhir: '2026-01-03' },
  ];

  for (const kal of kalenderData) {
    const existing = await prisma.kalenderAkademik.findFirst({
      where: { nama_kegiatan: kal.nama_kegiatan, tahun_id: tahunId },
    });
    if (!existing) {
      await prisma.kalenderAkademik.create({
        data: {
          lembaga_id: maPutraId,
          tahun_id: tahunId,
          ...kal,
        },
      });
    }
  }

  // 11. Activity Plan
  console.log('📋 11. Menyiapkan Activity Plan...');
  const activityData = [
    {
      nama_kegiatan: 'Latihan Dasar Kepemimpinan Santri (LDKS)',
      kategori: 'Akademik',
      tanggal_mulai: '2025-08-10',
      tanggal_berakhir: '2025-08-12',
      deskripsi: 'Pelatihan kepemimpinan dan manajemen organisasi santri IPNU-IPPNU Maskumambang',
      status_verifikasi: 'Disetujui',
      verified_by: pegDirektur.pegawai_id,
    },
    {
      nama_kegiatan: 'Pekan Olahraga & Seni Santri Maskumambang (PORSENI)',
      kategori: 'Acara',
      tanggal_mulai: '2025-10-20',
      tanggal_berakhir: '2025-10-25',
      deskripsi: 'Ajang kompetisi sains, kaligrafi, pidato 3 bahasa, dan olahraga antar santri',
      status_verifikasi: 'Menunggu Verifikasi',
    },
    {
      nama_kegiatan: 'Dauroh Tahfidz Al-Qur\'an Intensif',
      kategori: 'Akademik',
      tanggal_mulai: '2025-11-15',
      tanggal_berakhir: '2025-11-20',
      deskripsi: 'Karantina tahfidz 5 juz untuk santri kelas X dan XI',
      status_verifikasi: 'Disetujui',
      verified_by: pegDirektur.pegawai_id,
    },
  ];

  for (const act of activityData) {
    const existing = await prisma.activityPlan.findFirst({
      where: { nama_kegiatan: act.nama_kegiatan, tahun_id: tahunId },
    });
    if (!existing) {
      await prisma.activityPlan.create({
        data: {
          lembaga_id: maPutraId,
          tahun_id: tahunId,
          ...act,
        },
      });
    }
  }

  // 12. Lesson Plan (RPP) + Jurnal Mengajar + Absensi
  console.log('📝 12. Menyiapkan Lesson Plan (RPP) & Jurnal Mengajar...');
  let lpMath = await prisma.lessonPlan.findFirst({
    where: { jadwal_id: jadwalMath.jadwal_id },
  });
  if (!lpMath) {
    lpMath = await prisma.lessonPlan.create({
      data: {
        pegawai_id: pegGuruMath.pegawai_id,
        jadwal_id: jadwalMath.jadwal_id,
        judul_rpp: 'RPP Matematika: Sistem Persamaan Linear Tiga Variabel (SPLTV)',
        status_verifikasi_kepsek: 'Disetujui',
        verified_by_kepsek: pegKepsek.pegawai_id,
        status_verifikasi_direktur: 'Disetujui',
        verified_by_direktur: pegDirektur.pegawai_id,
        details: {
          create: [
            {
              pertemuan_ke: 1,
              topik_materi: 'Konsep Dasar SPLTV & Metode Substitusi',
              materi: 'Mengenal bentuk umum SPLTV dan menyelesaikan dengan metode substitusi murni',
              rencana_pelaksanaan_kbm: 'Diskusi kelompok dan pemecahan studi kasus kontekstual',
            },
            {
              pertemuan_ke: 2,
              topik_materi: 'Metode Eliminasi dan Campuran',
              materi: 'Menyelesaikan permasalahan SPLTV dengan metode eliminasi gauss & campuran',
              rencana_pelaksanaan_kbm: 'Presentasi hasil latihan siswa di papan tulis',
            },
          ],
        },
      },
      include: { details: true },
    });
  }

  const detailPertemuan1 = await prisma.lessonPlanDetail.findFirst({
    where: { lesson_plan_id: lpMath.lesson_plan_id, pertemuan_ke: 1 },
  });

  if (detailPertemuan1) {
    let jurnal1 = await prisma.jurnalMengajar.findFirst({
      where: { jadwal_id: jadwalMath.jadwal_id, lesson_plan_detail_id: detailPertemuan1.detail_id },
    });

    if (!jurnal1) {
      jurnal1 = await prisma.jurnalMengajar.create({
        data: {
          jadwal_id: jadwalMath.jadwal_id,
          lesson_plan_detail_id: detailPertemuan1.detail_id,
          pertemuan_ke: 1,
          tanggal: '2025-08-04',
          status: 'Sesuai',
          catatan_tambahan: 'Siswa sangat aktif dan memahami materi dengan baik.',
        },
      });

      // Buat absensi siswa untuk jurnal ini
      for (const [idx, s] of siswaList.entries()) {
        await prisma.absensiPelajaran.create({
          data: {
            siswa_id: s.siswa_id,
            jurnal_id: jurnal1.jurnal_id,
            waktu_kehadiran: '07:05',
            status: idx === 3 ? 'Sakit' : 'Hadir',
          },
        });
      }
    }
  }

  console.log('\n🎉 ========================================================');
  console.log('✅ SELURUH SEED DATA TRIAL BERHASIL DI-GENERATE LENGKAP!');
  console.log('========================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
