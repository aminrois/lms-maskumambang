import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = 'gurutahfidz';
  const passwordPrimary = 'passowrd123'; // User's requested password
  const passwordHash = await bcrypt.hash(passwordPrimary, 10);

  // 1. Ensure Role 'Guru Tahfidz' exists
  const role = await prisma.role.upsert({
    where: { nama_role: 'Guru Tahfidz' },
    update: {},
    create: { nama_role: 'Guru Tahfidz' },
  });

  console.log('Role Guru Tahfidz ID:', role.role_id);

  // 2. Create / Upsert User
  let user = await prisma.user.findUnique({
    where: { username },
  });

  if (user) {
    user = await prisma.user.update({
      where: { username },
      data: {
        password_hash: passwordHash,
        email: 'gurutahfidz@maskumambang.ac.id',
      },
    });
    console.log('Updated existing user:', user.username);
  } else {
    user = await prisma.user.create({
      data: {
        username,
        email: 'gurutahfidz@maskumambang.ac.id',
        password_hash: passwordHash,
      },
    });
    console.log('Created new user:', user.username);
  }

  // 3. Create / Link Pegawai
  let pegawai = await prisma.pegawai.findUnique({
    where: { nig: 'THZ001' },
  });

  if (pegawai) {
    pegawai = await prisma.pegawai.update({
      where: { nig: 'THZ001' },
      data: {
        user_id: user.user_id,
        nama: 'Ustadz Tahfidz Al-Qur\'an',
        jabatan: 'Guru Tahfidz',
        status: 'Aktif',
      },
    });
  } else {
    pegawai = await prisma.pegawai.create({
      data: {
        user_id: user.user_id,
        nig: 'THZ001',
        nama: 'Ustadz Tahfidz Al-Qur\'an',
        jenis_kelamin: 'L',
        jabatan: 'Guru Tahfidz',
        status: 'Aktif',
      },
    });
  }

  console.log('Pegawai linked:', pegawai.nama, 'ID:', pegawai.pegawai_id);

  // 4. Link User Role
  // Find first lembaga
  const lembaga = await prisma.lembaga.findFirst();
  const lembagaId = lembaga?.lembaga_id || 3;

  await prisma.userRole.deleteMany({
    where: {
      user_id: user.user_id,
    },
  });

  await prisma.userRole.create({
    data: {
      user_id: user.user_id,
      role_id: role.role_id,
      lembaga_id: lembagaId,
    },
  });

  // Link Pegawai Lembaga
  await prisma.pegawaiLembaga.upsert({
    where: {
      pegawai_id_lembaga_id: {
        pegawai_id: pegawai.pegawai_id,
        lembaga_id: lembagaId,
      },
    },
    update: {},
    create: {
      pegawai_id: pegawai.pegawai_id,
      lembaga_id: lembagaId,
    },
  });

  // 5. Assign classes for testing
  const sampleClasses = await prisma.kelas.findMany({
    take: 3,
  });

  for (const k of sampleClasses) {
    await prisma.tahfidzPengampu.upsert({
      where: {
        pegawai_id_kelas_id: {
          pegawai_id: pegawai.pegawai_id,
          kelas_id: k.kelas_id,
        },
      },
      update: {
        lembaga_id: k.lembaga_id,
      },
      create: {
        pegawai_id: pegawai.pegawai_id,
        lembaga_id: k.lembaga_id,
        kelas_id: k.kelas_id,
      },
    });
    console.log(`Assigned class ${k.nama_kelas} (ID: ${k.kelas_id}) to Guru Tahfidz`);
  }

  console.log('=== USER GURU TAHFIDZ SIAP DIGUNAKAN ===');
  console.log('Username:', username);
  console.log('Password:', passwordPrimary);
}

main()
  .catch((e) => {
    console.error('Error creating user:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
