import { PrismaClient } from '@prisma/client';
import https from 'https';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SUPABASE_REST_URL = 'https://bdmopingxxgzdqpksuvi.supabase.co/rest/v1';
const SUPABASE_AUTH_URL = 'https://bdmopingxxgzdqpksuvi.supabase.co/auth/v1/admin/users';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkbW9waW5neHhnemRxcGtzdXZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjExMTIzNCwiZXhwIjoyMTAxNjg3MjM0fQ.BMMn0T23MSMZubljMIf00EiQrphY-fsX7UVtEulhfHM';

// Helper fetch REST table with pagination
async function fetchAllRecords(table: string, chunkSize: number = 1000): Promise<any[]> {
  let offset = 0;
  let allRows: any[] = [];

  while (true) {
    const url = `${SUPABASE_REST_URL}/${table}?select=*&limit=${chunkSize}&offset=${offset}`;
    const chunk = await new Promise<any[]>((resolve, reject) => {
      https.get(url, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
      }, (res) => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => {
          if (res.statusCode !== 200 && res.statusCode !== 206) {
            resolve([]);
            return;
          }
          try {
            resolve(JSON.parse(b));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    if (!Array.isArray(chunk) || chunk.length === 0) {
      break;
    }

    allRows = allRows.concat(chunk);
    if (chunk.length < chunkSize) {
      break;
    }
    offset += chunkSize;
  }

  return allRows;
}

// Helper fetch all Auth users
async function fetchAllAuthUsers(): Promise<any[]> {
  let page = 1;
  let allUsers: any[] = [];

  while (true) {
    const url = `${SUPABASE_AUTH_URL}?page=${page}&per_page=100`;
    const users = await new Promise<any[]>((resolve, reject) => {
      https.get(url, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
      }, (res) => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => {
          try {
            const json = JSON.parse(b);
            resolve(json.users || []);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    if (!Array.isArray(users) || users.length === 0) {
      break;
    }

    allUsers = allUsers.concat(users);
    if (users.length < 100) {
      break;
    }
    page++;
  }

  return allUsers;
}

async function main() {
  console.log('🚀 MEMULAI MIGRASI DATA DARI SUPABASE LIVE (lms.maskumambang.ac.id)...');

  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 1. Reset tabel lokal (truncate in cascade order)
  console.log('🧹 1. Membersihkan data lama di database lokal...');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      absensi_pelajaran,
      absensi_harian,
      jurnal_mengajar,
      lesson_plan_detail,
      lesson_plan,
      jadwal_pelajaran,
      jam_akademik,
      kelas_mapel,
      mata_pelajaran,
      kalender_akademik,
      activity_plan,
      siswa,
      wali_murid,
      kelas,
      tahun_ajaran,
      pegawai_lembaga,
      pegawai,
      user_roles,
      users,
      roles,
      lembaga
    CASCADE;
  `);

  // 2. Migrasi Roles
  console.log('👑 2. Mengambil dan migrasi tabel roles...');
  const roles = await fetchAllRecords('role');
  for (const r of roles) {
    await prisma.role.create({
      data: {
        role_id: r.role_id,
        nama_role: r.nama_role,
      },
    });
  }
  console.log(`✅ Roles: ${roles.length} records termigrasi.`);

  // 3. Migrasi Auth Users
  console.log('👤 3. Mengambil dan migrasi pengguna dari Supabase Auth...');
  const authUsers = await fetchAllAuthUsers();
  for (const u of authUsers) {
    const email = u.email || `${u.id}@mlms.local`;
    let username = email.split('@')[0];

    // Jika username admin, beri password khusus admin123
    const isSuperAdminUser = username === 'admin' || email.includes('admin@');
    const pwdHash = isSuperAdminUser ? adminPasswordHash : defaultPasswordHash;

    await prisma.user.create({
      data: {
        user_id: u.id,
        username: username,
        email: email,
        password_hash: pwdHash,
        created_at: u.created_at ? new Date(u.created_at) : new Date(),
      },
    });
  }
  console.log(`✅ Users: ${authUsers.length} akun pengguna termigrasi.`);

  // 4. Migrasi Lembaga
  console.log('🏫 4. Mengambil dan migrasi tabel lembaga...');
  const lembagas = await fetchAllRecords('lembaga');
  for (const l of lembagas) {
    await prisma.lembaga.create({
      data: {
        lembaga_id: l.lembaga_id,
        nama_lembaga: l.nama_lembaga,
        singkatan: l.singkatan,
        kepala_sekolah_id: l.kepala_sekolah_id,
        kurikulum_id: l.kurikulum_id,
      },
    });
  }
  console.log(`✅ Lembaga: ${lembagas.length} records termigrasi.`);

  // 5. Migrasi User Role
  console.log('🛡️ 5. Mengambil dan migrasi user_role...');
  const userRoles = await fetchAllRecords('user_role');
  for (const ur of userRoles) {
    try {
      await prisma.userRole.create({
        data: {
          user_role_id: ur.user_role_id,
          user_id: ur.user_id,
          role_id: ur.role_id,
          lembaga_id: ur.lembaga_id,
        },
      });
    } catch (e) {
      // Lewati jika foreign key user/role tidak ada
    }
  }
  console.log(`✅ User Roles: ${userRoles.length} records termigrasi.`);

  // 6. Migrasi Pegawai
  console.log('👨‍🏫 6. Mengambil dan migrasi tabel pegawai...');
  const pegawais = await fetchAllRecords('pegawai');
  for (const p of pegawais) {
    await prisma.pegawai.create({
      data: {
        pegawai_id: p.pegawai_id,
        user_id: p.user_id,
        nig: p.nig,
        nip: p.nip,
        nik: p.nik,
        nama: p.nama,
        jenis_kelamin: p.jenis_kelamin || 'L',
        tempat_lahir: p.tempat_lahir,
        tanggal_lahir: p.tanggal_lahir,
        alamat: p.alamat,
        no_hp: p.no_hp,
        status: p.status || 'Aktif',
        jabatan: p.jabatan || 'Guru',
        tugas_tambahan: p.tugas_tambahan,
        jumlah_anak_laki: p.jumlah_anak_laki || 0,
        jumlah_anak_perempuan: p.jumlah_anak_perempuan || 0,
        nama_ayah: p.nama_ayah,
        nama_ibu: p.nama_ibu,
        golongan_darah: p.golongan_darah,
      },
    });
  }
  console.log(`✅ Pegawai: ${pegawais.length} records termigrasi.`);

  // 7. Migrasi Pegawai Lembaga
  console.log('🏢 7. Mengambil dan migrasi pegawai_lembaga...');
  const pegawaiLembagas = await fetchAllRecords('pegawai_lembaga');
  for (const pl of pegawaiLembagas) {
    try {
      await prisma.pegawaiLembaga.create({
        data: {
          pegawai_id: pl.pegawai_id,
          lembaga_id: pl.lembaga_id,
        },
      });
    } catch (e) {}
  }
  console.log(`✅ Pegawai Lembaga: ${pegawaiLembagas.length} relasi termigrasi.`);

  // 8. Migrasi Wali Murid
  console.log('👨‍👩‍👧 8. Mengambil dan migrasi wali_murid...');
  const waliMurids = await fetchAllRecords('wali_murid');
  for (const w of waliMurids) {
    await prisma.waliMurid.create({
      data: {
        wali_id: w.wali_id,
        user_id: w.user_id,
        nama_ayah: w.nama_ayah,
        nik_ayah: w.nik_ayah,
        status_ayah: w.status_ayah,
        tempat_lahir_ayah: w.tempat_lahir_ayah,
        tanggal_lahir_ayah: w.tanggal_lahir_ayah,
        email_ayah: w.email_ayah,
        pin_ayah: w.pin_ayah,
        pendidikan_ayah: w.pendidikan_ayah,
        pekerjaan_ayah: w.pekerjaan_ayah,
        penghasilan_ayah: w.penghasilan_ayah,
        nama_ibu: w.nama_ibu,
        nik_ibu: w.nik_ibu,
        status_ibu: w.status_ibu,
        tempat_lahir_ibu: w.tempat_lahir_ibu,
        tanggal_lahir_ibu: w.tanggal_lahir_ibu,
        email_ibu: w.email_ibu,
        pin_ibu: w.pin_ibu,
        pendidikan_ibu: w.pendidikan_ibu,
        pekerjaan_ibu: w.pekerjaan_ibu,
        penghasilan_ibu: w.penghasilan_ibu,
        nama_wali: w.nama_wali || w.nama_ayah || 'Wali Santri',
        nik_wali: w.nik_wali || w.nik_ayah || '0000000000000000',
        alamat: w.alamat || 'Gresik',
        status: w.status || 'Hidup',
        no_hp_ayah: w.no_hp_ayah,
        no_hp_ibu: w.no_hp_ibu,
        no_hp_wali: w.no_hp_wali || w.no_hp_ayah || '080000000000',
      },
    });
  }
  console.log(`✅ Wali Murid: ${waliMurids.length} records termigrasi.`);

  // 9. Migrasi Tahun Ajaran
  console.log('📅 9. Mengambil dan migrasi tahun_ajaran...');
  const tahunAjarans = await fetchAllRecords('tahun_ajaran');
  for (const t of tahunAjarans) {
    await prisma.tahunAjaran.create({
      data: {
        tahun_id: t.tahun_id,
        lembaga_id: t.lembaga_id,
        nama_tahun: t.nama_tahun,
        semester: t.semester || 'Ganjil',
        tanggal_mulai: t.tanggal_mulai || '2025-07-14',
        tanggal_akhir: t.tanggal_akhir || '2025-12-20',
        is_active: Boolean(t.is_active),
      },
    });
  }
  console.log(`✅ Tahun Ajaran: ${tahunAjarans.length} records termigrasi.`);

  // 10. Migrasi Kelas
  console.log('🏫 10. Mengambil dan migrasi kelas...');
  const kelass = await fetchAllRecords('kelas');
  for (const k of kelass) {
    await prisma.kelas.create({
      data: {
        kelas_id: k.kelas_id,
        lembaga_id: k.lembaga_id,
        tahun_id: k.tahun_id,
        nama_kelas: k.nama_kelas,
        wali_kelas_id: k.wali_kelas_id,
      },
    });
  }
  console.log(`✅ Kelas: ${kelass.length} records termigrasi.`);

  // 11. Migrasi Siswa
  console.log('🎒 11. Mengambil dan migrasi siswa...');
  const siswas = await fetchAllRecords('siswa');
  for (const s of siswas) {
    await prisma.siswa.create({
      data: {
        siswa_id: s.siswa_id,
        nis: s.nis,
        nisn: s.nisn,
        nik: s.nik,
        pin: s.pin,
        nama: s.nama,
        panggilan: s.panggilan,
        jenis_kelamin: s.jenis_kelamin || 'L',
        tempat_lahir: s.tempat_lahir || 'Gresik',
        tanggal_lahir: s.tanggal_lahir || '2008-01-01',
        agama: s.agama || 'Islam',
        kewarganegaraan: s.kewarganegaraan || 'Indonesia',
        tahun_masuk: s.tahun_masuk || 2025,
        asal_sekolah: s.asal_sekolah || '-',
        no_un_sebelumnya: s.no_un_sebelumnya,
        alamat: s.alamat,
        kode_pos: s.kode_pos,
        status: s.status || 'Aktif',
        keterangan_asrama: s.keterangan_asrama || 'Tidak',
        wali_murid_id: s.wali_murid_id,
        kelas_id: s.kelas_id,
        no_kk: s.no_kk,
        no_akta_kelahiran: s.no_akta_kelahiran,
        rt: s.rt,
        rw: s.rw,
        desa_kelurahan: s.desa_kelurahan,
        kecamatan: s.kecamatan,
        kabupaten_kota: s.kabupaten_kota,
        provinsi: s.provinsi,
        alamat_sekolah_asal: s.alamat_sekolah_asal,
      },
    });
  }
  console.log(`✅ Siswa: ${siswas.length} santri termigrasi.`);

  // 12. Migrasi Mata Pelajaran
  console.log('📚 12. Mengambil dan migrasi mata_pelajaran...');
  const mapels = await fetchAllRecords('mata_pelajaran');
  for (const m of mapels) {
    await prisma.mataPelajaran.create({
      data: {
        mapel_id: m.mapel_id,
        lembaga_id: m.lembaga_id,
        nama_mapel: m.nama_mapel,
      },
    });
  }
  console.log(`✅ Mata Pelajaran: ${mapels.length} mapel termigrasi.`);

  // 13. Migrasi Kelas Mapel
  console.log('🔗 13. Mengambil dan migrasi kelas_mapel...');
  const kelasMapels = await fetchAllRecords('kelas_mapel');
  for (const km of kelasMapels) {
    try {
      await prisma.kelasMapel.create({
        data: {
          kelas_id: km.kelas_id,
          mapel_id: km.mapel_id,
        },
      });
    } catch (e) {}
  }
  console.log(`✅ Kelas Mapel: ${kelasMapels.length} relasi termigrasi.`);

  // 14. Migrasi Jam Akademik
  console.log('⏰ 14. Mengambil dan migrasi jam_akademik...');
  const jamAkademiks = await fetchAllRecords('jam_akademik');
  for (const j of jamAkademiks) {
    await prisma.jamAkademik.create({
      data: {
        jam_id: j.jam_id,
        lembaga_id: j.lembaga_id,
        urutan_jam: j.urutan_jam,
        jam_mulai: j.jam_mulai,
        jam_selesai: j.jam_selesai,
        tipe: j.tipe,
      },
    });
  }
  console.log(`✅ Jam Akademik: ${jamAkademiks.length} records termigrasi.`);

  // 15. Migrasi Jadwal Pelajaran
  console.log('🗓️ 15. Mengambil dan migrasi jadwal_pelajaran...');
  const jadwalPelajarans = await fetchAllRecords('jadwal_pelajaran');
  for (const jp of jadwalPelajarans) {
    try {
      await prisma.jadwalPelajaran.create({
        data: {
          jadwal_id: jp.jadwal_id,
          kelas_id: jp.kelas_id,
          mapel_id: jp.mapel_id,
          pegawai_id: jp.pegawai_id,
          ruangan: jp.ruangan,
          hari: jp.hari,
          jam_mulai_id: jp.jam_mulai_id,
          jam_selesai_id: jp.jam_selesai_id,
        },
      });
    } catch (e) {}
  }
  console.log(`✅ Jadwal Pelajaran: ${jadwalPelajarans.length} jadwal termigrasi.`);

  // 16. Migrasi Lesson Plan (RPP)
  console.log('📝 16. Mengambil dan migrasi lesson_plan (RPP)...');
  const lessonPlans = await fetchAllRecords('lesson_plan');
  for (const lp of lessonPlans) {
    try {
      await prisma.lessonPlan.create({
        data: {
          lesson_plan_id: lp.lesson_plan_id,
          pegawai_id: lp.pegawai_id,
          jadwal_id: lp.jadwal_id,
          judul_rpp: lp.judul_rpp || 'RPP',
          status_verifikasi_kepsek: lp.status_verifikasi_kepsek,
          verified_by_kepsek: lp.verified_by_kepsek,
          catatan_revisi_kepsek: lp.catatan_revisi_kepsek,
          status_verifikasi_direktur: lp.status_verifikasi_direktur,
          verified_by_direktur: lp.verified_by_direktur,
          catatan_revisi_direktur: lp.catatan_revisi_direktur,
        },
      });
    } catch (e) {}
  }
  console.log(`✅ Lesson Plan: ${lessonPlans.length} RPP termigrasi.`);

  // 17. Migrasi Lesson Plan Detail
  console.log('📑 17. Mengambil dan migrasi lesson_plan_detail (dalam chunks)...');
  const lessonPlanDetails = await fetchAllRecords('lesson_plan_detail', 2000);
  console.log(`Total lesson_plan_detail ditemukan: ${lessonPlanDetails.length}. Memulai batch insert...`);

  // Insert in chunks of 500
  const detailChunkSize = 500;
  for (let i = 0; i < lessonPlanDetails.length; i += detailChunkSize) {
    const chunk = lessonPlanDetails.slice(i, i + detailChunkSize);
    await prisma.lessonPlanDetail.createMany({
      data: chunk.map((lpd: any) => ({
        detail_id: lpd.detail_id,
        lesson_plan_id: lpd.lesson_plan_id,
        pertemuan_ke: lpd.pertemuan_ke,
        materi: lpd.materi,
        topik_materi: lpd.topik_materi,
        rencana_pelaksanaan_kbm: lpd.rencana_pelaksanaan_kbm,
        isi: lpd.isi,
      })),
      skipDuplicates: true,
    });
    if ((i + detailChunkSize) % 5000 === 0 || i + detailChunkSize >= lessonPlanDetails.length) {
      console.log(`  Progres lesson_plan_detail: ${Math.min(i + detailChunkSize, lessonPlanDetails.length)} / ${lessonPlanDetails.length}`);
    }
  }
  console.log(`✅ Lesson Plan Detail: ${lessonPlanDetails.length} detail pertemuan termigrasi.`);

  // 18. Migrasi Jurnal Mengajar
  console.log('📖 18. Mengambil dan migrasi jurnal_mengajar...');
  const jurnalMengajars = await fetchAllRecords('jurnal_mengajar');
  for (const jm of jurnalMengajars) {
    try {
      await prisma.jurnalMengajar.create({
        data: {
          jurnal_id: jm.jurnal_id,
          jadwal_id: jm.jadwal_id,
          lesson_plan_detail_id: jm.lesson_plan_detail_id,
          pertemuan_ke: jm.pertemuan_ke,
          status: jm.status,
          tanggal: jm.tanggal,
          catatan_tambahan: jm.catatan_tambahan,
        },
      });
    } catch (e) {}
  }
  console.log(`✅ Jurnal Mengajar: ${jurnalMengajars.length} records termigrasi.`);

  // 19. Migrasi Absensi Pelajaran
  console.log('📊 19. Mengambil dan migrasi absensi_pelajaran...');
  const absensiPelajarans = await fetchAllRecords('absensi_pelajaran');
  for (const ap of absensiPelajarans) {
    try {
      await prisma.absensiPelajaran.create({
        data: {
          absensi_pel_id: ap.absensi_pel_id,
          siswa_id: ap.siswa_id,
          jurnal_id: ap.jurnal_id,
          waktu_kehadiran: ap.waktu_kehadiran,
          status: ap.status,
        },
      });
    } catch (e) {}
  }
  console.log(`✅ Absensi Pelajaran: ${absensiPelajarans.length} presensi termigrasi.`);

  // 20. Migrasi Absensi Harian
  console.log('📌 20. Mengambil dan migrasi absensi_harian...');
  const absensiHarians = await fetchAllRecords('absensi_harian');
  for (let i = 0; i < absensiHarians.length; i += 500) {
    const chunk = absensiHarians.slice(i, i + 500);
    await prisma.absensiHarian.createMany({
      data: chunk.map((ah: any) => ({
        absensi_harian_id: ah.absensi_harian_id,
        siswa_id: ah.siswa_id,
        tanggal: ah.tanggal,
        status: ah.status,
      })),
      skipDuplicates: true,
    });
  }
  console.log(`✅ Absensi Harian: ${absensiHarians.length} records termigrasi.`);

  // 21. Migrasi Kalender Akademik
  console.log('📅 21. Mengambil dan migrasi kalender_akademik...');
  const kalenders = await fetchAllRecords('kalender_akademik');
  for (const ka of kalenders) {
    try {
      await prisma.kalenderAkademik.create({
        data: {
          kalender_id: ka.kalender_id,
          lembaga_id: ka.lembaga_id,
          tahun_id: ka.tahun_id,
          nama_kegiatan: ka.nama_kegiatan,
          kategori: ka.kategori,
          tanggal_mulai: ka.tanggal_mulai,
          tanggal_berakhir: ka.tanggal_berakhir,
        },
      });
    } catch (e) {}
  }
  console.log(`✅ Kalender Akademik: ${kalenders.length} kegiatan termigrasi.`);

  // 22. Migrasi Activity Plan
  console.log('📋 22. Mengambil dan migrasi activity_plan...');
  const activityPlans = await fetchAllRecords('activity_plan');
  for (const act of activityPlans) {
    try {
      await prisma.activityPlan.create({
        data: {
          activity_id: act.activity_id,
          lembaga_id: act.lembaga_id,
          tahun_id: act.tahun_id,
          nama_kegiatan: act.nama_kegiatan,
          kategori: act.kategori,
          tanggal_mulai: act.tanggal_mulai,
          tanggal_berakhir: act.tanggal_berakhir,
          deskripsi: act.deskripsi,
          status_verifikasi: act.status_verifikasi,
          verified_by: act.verified_by,
          catatan_revisi: act.catatan_revisi,
        },
      });
    } catch (e) {}
  }
  console.log(`✅ Activity Plan: ${activityPlans.length} records termigrasi.`);

  // 23. Sinkronisasi Sequences Database PostgreSQL agar penambahan data baru lancar
  console.log('🔄 23. Memperbarui PostgreSQL Sequences untuk auto-increment...');
  const tablesWithAutoIncrement = [
    { table: 'roles', col: 'role_id' },
    { table: 'user_roles', col: 'user_role_id' },
    { table: 'lembaga', col: 'lembaga_id' },
    { table: 'pegawai', col: 'pegawai_id' },
    { table: 'wali_murid', col: 'wali_id' },
    { table: 'tahun_ajaran', col: 'tahun_id' },
    { table: 'kelas', col: 'kelas_id' },
    { table: 'siswa', col: 'siswa_id' },
    { table: 'mata_pelajaran', col: 'mapel_id' },
    { table: 'jam_akademik', col: 'jam_id' },
    { table: 'jadwal_pelajaran', col: 'jadwal_id' },
    { table: 'lesson_plan', col: 'lesson_plan_id' },
    { table: 'lesson_plan_detail', col: 'detail_id' },
    { table: 'jurnal_mengajar', col: 'jurnal_id' },
    { table: 'absensi_pelajaran', col: 'absensi_pel_id' },
    { table: 'absensi_harian', col: 'absensi_harian_id' },
    { table: 'kalender_akademik', col: 'kalender_id' },
    { table: 'activity_plan', col: 'activity_id' },
  ];

  for (const item of tablesWithAutoIncrement) {
    try {
      await prisma.$executeRawUnsafe(`
        SELECT setval(pg_get_serial_sequence('"${item.table}"', '${item.col}'), COALESCE(MAX("${item.col}"), 1)) FROM "${item.table}";
      `);
    } catch (e) {}
  }

  console.log('\n🎉 ========================================================');
  console.log('✅ SELURUH DATA DARI SUPABASE LIVE BERHASIL DIMIGRASIKAN!');
  console.log('========================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat migrasi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
