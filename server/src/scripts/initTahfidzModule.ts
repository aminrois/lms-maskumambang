// server/src/scripts/initTahfidzModule.ts
import prisma from '../config/prisma';

export async function initTahfidzModule(): Promise<void> {
  try {
    console.log('🔄 Initializing Tahfidz Module & Database Schema...');

    // 1. Ensure 'Guru Tahfidz' role exists in database
    await prisma.role.upsert({
      where: { nama_role: 'Guru Tahfidz' },
      update: {},
      create: { nama_role: 'Guru Tahfidz' },
    });
    console.log('✅ Role "Guru Tahfidz" verified/created.');

    const sqlStatements = [
      // 2. Create tahfidz_pengampu table
      `CREATE TABLE IF NOT EXISTS "public"."tahfidz_pengampu" (
        "pengampu_id" SERIAL PRIMARY KEY,
        "pegawai_id" INTEGER NOT NULL REFERENCES "public"."pegawai"("pegawai_id") ON DELETE CASCADE,
        "lembaga_id" INTEGER NOT NULL REFERENCES "public"."lembaga"("lembaga_id") ON DELETE CASCADE,
        "kelas_id" INTEGER NOT NULL REFERENCES "public"."kelas"("kelas_id") ON DELETE CASCADE,
        "tahun_id" INTEGER,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "tahfidz_pengampu_pegawai_id_kelas_id_key" ON "public"."tahfidz_pengampu"("pegawai_id", "kelas_id");`,
      `CREATE INDEX IF NOT EXISTS "tahfidz_pengampu_pegawai_id_idx" ON "public"."tahfidz_pengampu"("pegawai_id");`,
      `CREATE INDEX IF NOT EXISTS "tahfidz_pengampu_kelas_id_idx" ON "public"."tahfidz_pengampu"("kelas_id");`,
      `CREATE INDEX IF NOT EXISTS "tahfidz_pengampu_lembaga_id_idx" ON "public"."tahfidz_pengampu"("lembaga_id");`,

      // 3. Create tahfidz_target table
      `CREATE TABLE IF NOT EXISTS "public"."tahfidz_target" (
        "target_id" SERIAL PRIMARY KEY,
        "siswa_id" INTEGER NOT NULL REFERENCES "public"."siswa"("siswa_id") ON DELETE CASCADE,
        "kategori" TEXT NOT NULL,
        "target_deskripsi" TEXT NOT NULL,
        "target_nominal" DOUBLE PRECISION NOT NULL,
        "satuan" TEXT NOT NULL,
        "tanggal_mulai" TEXT NOT NULL,
        "tanggal_target" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Aktif',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS "tahfidz_target_siswa_id_idx" ON "public"."tahfidz_target"("siswa_id");`,
      `CREATE INDEX IF NOT EXISTS "tahfidz_target_kategori_idx" ON "public"."tahfidz_target"("kategori");`,

      // 4. Create tahfidz_setoran table
      `CREATE TABLE IF NOT EXISTS "public"."tahfidz_setoran" (
        "setoran_id" SERIAL PRIMARY KEY,
        "siswa_id" INTEGER NOT NULL REFERENCES "public"."siswa"("siswa_id") ON DELETE CASCADE,
        "pegawai_id" INTEGER NOT NULL REFERENCES "public"."pegawai"("pegawai_id") ON DELETE CASCADE,
        "kategori" TEXT NOT NULL,
        "jenis_hafalan" TEXT NOT NULL,
        "tanggal" TEXT NOT NULL,
        "durasi_menit" INTEGER,
        "kelancaran" TEXT NOT NULL,
        "catatan_guru" TEXT,
        "surat_mulai" INTEGER,
        "surat_mulai_nama" TEXT,
        "ayat_mulai" INTEGER,
        "surat_selesai" INTEGER,
        "surat_selesai_nama" TEXT,
        "ayat_selesai" INTEGER,
        "juz" INTEGER,
        "total_ayat" INTEGER,
        "kitab_hadits" TEXT,
        "hadits_no_mulai" INTEGER,
        "hadits_no_selesai" INTEGER,
        "total_hadits" INTEGER,
        "nama_matan" TEXT,
        "bait_mulai" INTEGER,
        "bait_selesai" INTEGER,
        "total_bait" INTEGER,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS "tahfidz_setoran_siswa_id_idx" ON "public"."tahfidz_setoran"("siswa_id");`,
      `CREATE INDEX IF NOT EXISTS "tahfidz_setoran_pegawai_id_idx" ON "public"."tahfidz_setoran"("pegawai_id");`,
      `CREATE INDEX IF NOT EXISTS "tahfidz_setoran_kategori_idx" ON "public"."tahfidz_setoran"("kategori");`,
      `CREATE INDEX IF NOT EXISTS "tahfidz_setoran_tanggal_idx" ON "public"."tahfidz_setoran"("tanggal");`
    ];

    for (const sql of sqlStatements) {
      await prisma.$executeRawUnsafe(sql);
    }

    console.log('✅ Tahfidz database schema verified & ready.');
  } catch (error) {
    console.error('⚠️ Warning: Error during Tahfidz module initialization:', error);
  }
}
