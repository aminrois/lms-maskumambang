import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial roles...');

  const roles = [
    'Super Admin',
    'Direktur',
    'Kepala Sekolah',
    'Admin Lembaga',
    'WaKa Kurikulum',
    'Wali Kelas',
    'Guru',
    'Wali Murid',
  ];

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { nama_role: roleName },
      update: {},
      create: { nama_role: roleName },
    });
  }

  console.log('Roles seeded successfully.');

  // Create default Super Admin user
  const adminRole = await prisma.role.findUnique({
    where: { nama_role: 'Super Admin' },
  });

  if (adminRole) {
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (!existingAdmin) {
      console.log('Creating default superadmin account (admin / admin123)...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      const user = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@lms.local',
          password_hash: passwordHash,
        },
      });

      await prisma.userRole.create({
        data: {
          user_id: user.user_id,
          role_id: adminRole.role_id,
        },
      });
      console.log('Default superadmin created: username=admin, password=admin123');
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
