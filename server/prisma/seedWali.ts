import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Menyiapkan Akun Wali Murid...');

  const username = 'wali_test';
  const plainPassword = 'wali123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // 1. Role Wali Murid
  let waliRole = await prisma.role.findFirst({
    where: { nama_role: { equals: 'Wali Murid', mode: 'insensitive' } }
  });

  if (!waliRole) {
    waliRole = await prisma.role.create({
      data: { nama_role: 'Wali Murid' }
    });
    console.log('✅ Role Wali Murid dibuat dengan ID:', waliRole.role_id);
  }

  // 2. Buat atau update User wali_test
  let user = await prisma.user.findFirst({
    where: { username }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        username,
        email: 'wali_test@maskumambang.sch.id',
        password_hash: hashedPassword
      }
    });
    console.log('✅ User wali_test berhasil dibuat:', user.user_id);
  } else {
    user = await prisma.user.update({
      where: { user_id: user.user_id },
      data: { password_hash: hashedPassword }
    });
    console.log('✅ Password user wali_test berhasil diupdate.');
  }

  // 3. Pastikan user_roles memiliki Wali Murid
  const existingUserRole = await prisma.userRole.findFirst({
    where: { user_id: user.user_id, role_id: waliRole.role_id }
  });

  if (!existingUserRole) {
    await prisma.userRole.create({
      data: {
        user_id: user.user_id,
        role_id: waliRole.role_id
      }
    });
    console.log('✅ Role Wali Murid ditambahkan ke user wali_test.');
  }

  // 4. Buat Profil WaliMurid
  let waliProfile = await prisma.waliMurid.findFirst({
    where: { user_id: user.user_id }
  });

  if (!waliProfile) {
    waliProfile = await prisma.waliMurid.create({
      data: {
        user_id: user.user_id,
        nama_wali: 'H. Sudirman Al-Hafidz',
        nik_wali: '3525010101780001',
        alamat: 'Jl. Raya Maskumambang No. 45, Dukun, Gresik',
        status: 'Hidup',
        no_hp_wali: '081234567890',
        nama_ayah: 'H. Sudirman Al-Hafidz',
        nik_ayah: '3525010101780001',
        status_ayah: 'Hidup',
        pekerjaan_ayah: 'Wiraswasta / Dosen',
        pendidikan_ayah: 'S1',
        nama_ibu: 'Hj. Siti Aminah',
        nik_ibu: '3525015005820002',
        status_ibu: 'Hidup',
        pekerjaan_ibu: 'Guru',
        pendidikan_ibu: 'S1',
        no_hp_ayah: '081234567890',
        no_hp_ibu: '081234567891'
      }
    });
    console.log('✅ Profil WaliMurid dibuat dengan ID:', waliProfile.wali_id);
  }

  // 5. Hubungkan santri (ambil 2 santri aktif pertama yang punya kelas & tahfidz)
  const siswaList = await prisma.siswa.findMany({
    take: 2,
    where: { NOT: { status: 'Tidak Aktif' } },
    orderBy: { siswa_id: 'asc' }
  });

  for (const s of siswaList) {
    await prisma.siswa.update({
      where: { siswa_id: s.siswa_id },
      data: { wali_murid_id: waliProfile.wali_id }
    });
    console.log(`✅ Santri ${s.nama} (ID: ${s.siswa_id}) dihubungkan ke wali_id: ${waliProfile.wali_id}`);
  }

  // 6. Update user 0001 agar juga memiliki role Wali Murid
  const user0001 = await prisma.user.findFirst({ where: { username: '0001' } });
  if (user0001) {
    const r0001 = await prisma.userRole.findFirst({
      where: { user_id: user0001.user_id, role_id: waliRole.role_id }
    });
    if (!r0001) {
      await prisma.userRole.create({
        data: { user_id: user0001.user_id, role_id: waliRole.role_id }
      });
      console.log('✅ User 0001 juga diberikan role Wali Murid.');
    }
  }

  console.log('🎉 Selesai! Kredensial siap:');
  console.log('Username: wali_test');
  console.log('Password: wali123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding wali:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
