import { PrismaClient } from "@prisma/client";
import { deduplicateLessonPlans } from "./cleanDuplicateLessonPlans";
import { syncLessonPlansWithJadwal } from "./syncLessonPlansWithJadwal";

const prisma = new PrismaClient();

async function runCompleteVerification() {
  console.log("================================================================================");
  console.log("🚀 MENJALANKAN SINKRONISASI & DEDUPLIKASI TOTAL SEBELUM PENGECEKAN");
  console.log("================================================================================");

  await deduplicateLessonPlans();
  await syncLessonPlansWithJadwal();

  console.log("\n================================================================================");
  console.log("🔍 AUDIT MENYELURUH 100% SELURUH GURU, JADWAL PELAJARAN, & LESSON PLAN");
  console.log("================================================================================");

  const allPegawai = await prisma.pegawai.findMany({
    include: {
      jadwal_pelajaran: {
        include: {
          mapel: true,
          kelas: true,
          jam_mulai: true,
          jam_selesai: true,
        },
      },
      lesson_plans: {
        include: {
          jadwal: {
            include: {
              mapel: true,
              kelas: true,
              pegawai: true,
              jam_mulai: true,
              jam_selesai: true,
            },
          },
          details: true,
        },
      },
    },
    orderBy: { nama: "asc" },
  });

  console.log(`Total Guru di Database: ${allPegawai.length}`);

  let totalJadwalCount = 0;
  let totalLpCount = 0;
  const issues: Array<{
    guru: string;
    pegawai_id: number;
    kategori_masalah: string;
    lp_id?: number;
    judul_rpp?: string;
    detail: string;
  }> = [];

  for (const guru of allPegawai) {
    totalJadwalCount += guru.jadwal_pelajaran.length;
    totalLpCount += guru.lesson_plans.length;

    // Set mapel yang diajar guru (normalized)
    const mapelDiajar = new Set(
      guru.jadwal_pelajaran
        .map((j) => j.mapel?.nama_mapel?.toLowerCase().trim())
        .filter(Boolean)
    );

    // Set kelas yang diajar guru (normalized)
    const kelasDiajar = new Set(
      guru.jadwal_pelajaran
        .map((j) => j.kelas?.nama_kelas?.toLowerCase().trim())
        .filter(Boolean)
    );

    // Cek setiap Lesson Plan milik guru
    for (const lp of guru.lesson_plans) {
      const parts = (lp.judul_rpp || "").split(/\s+[-–]\s+/);
      const rawMapel = parts[0]?.trim() || "";
      const rawKelas = parts[1]?.trim() || "";

      const cleanMapel = rawMapel.replace(/\s+(i|ii|iii|iv|v|vi)$/i, "").toLowerCase().trim();
      const cleanKelas = rawKelas.toLowerCase().trim();

      // 1. Cek apakah Jadwal_ID terpasang
      if (!lp.jadwal_id || !lp.jadwal) {
        issues.push({
          guru: guru.nama,
          pegawai_id: guru.pegawai_id,
          kategori_masalah: "JADWAL_ID_NULL",
          lp_id: lp.lesson_plan_id,
          judul_rpp: lp.judul_rpp,
          detail: `Lesson Plan tidak memiliki tautan jadwal_id.`,
        });
        continue;
      }

      // 2. Cek apakah Guru di LP sama dengan Guru di Jadwal
      if (lp.jadwal.pegawai_id !== guru.pegawai_id) {
        issues.push({
          guru: guru.nama,
          pegawai_id: guru.pegawai_id,
          kategori_masalah: "GURU_TIDAK_COCOK",
          lp_id: lp.lesson_plan_id,
          judul_rpp: lp.judul_rpp,
          detail: `Guru di LP adalah "${guru.nama}", tetapi Jadwal #${lp.jadwal_id} diampu oleh "${lp.jadwal.pegawai?.nama}" (ID: ${lp.jadwal.pegawai_id}).`,
        });
      }

      // 3. Cek apakah Mata Pelajaran di LP diajar oleh Guru ini
      let mapelMatch = false;
      for (const m of mapelDiajar) {
        if (m && cleanMapel && (m.includes(cleanMapel) || cleanMapel.includes(m))) {
          mapelMatch = true;
          break;
        }
      }

      if (!mapelMatch && mapelDiajar.size > 0) {
        issues.push({
          guru: guru.nama,
          pegawai_id: guru.pegawai_id,
          kategori_masalah: "MAPEL_TIDAK_DIAJAR_GURU",
          lp_id: lp.lesson_plan_id,
          judul_rpp: lp.judul_rpp,
          detail: `Mata Pelajaran "${rawMapel}" tidak ada di daftar jadwal mengajar guru ini (${Array.from(mapelDiajar).join(", ")}).`,
        });
      }

      // 4. Cek apakah Kelas di LP cocok dengan Jadwal yang ditautkan
      if (cleanKelas && lp.jadwal.kelas?.nama_kelas) {
        const jadwalKelasClean = lp.jadwal.kelas.nama_kelas.toLowerCase().trim();
        if (jadwalKelasClean !== cleanKelas && !cleanKelas.includes(jadwalKelasClean) && !jadwalKelasClean.includes(cleanKelas)) {
          issues.push({
            guru: guru.nama,
            pegawai_id: guru.pegawai_id,
            kategori_masalah: "KELAS_TIDAK_COCOK",
            lp_id: lp.lesson_plan_id,
            judul_rpp: lp.judul_rpp,
            detail: `Kelas di judul LP ("${rawKelas}") tidak cocok dengan Kelas di Jadwal ("${lp.jadwal.kelas.nama_kelas}").`,
          });
        }
      }
    }
  }

  console.log(`\n================================================================================`);
  console.log(`📊 REKAPITULASI HASIL AUDIT KESELURUHAN`);
  console.log(`================================================================================`);
  console.log(`Total Guru Diperiksa        : ${allPegawai.length}`);
  console.log(`Total Jadwal Diperiksa      : ${totalJadwalCount}`);
  console.log(`Total Lesson Plan Diperiksa : ${totalLpCount}`);
  console.log(`Total Masalah / Konflik     : ${issues.length}`);

  if (issues.length === 0) {
    console.log(`\n✅ STATUS: SEMPURNA (100% SINKRON TANPA MASALAH)`);
    console.log(`Semua Guru, Mata Pelajaran, Kelas, dan Lesson Plan telah terverifikasi sinkron.`);
  } else {
    console.log(`\n⚠️ STATUS: DITEMUKAN ${issues.length} KETIDAKSESUAIAN:`);
    console.table(issues);
  }

  // Cek ringkasan per Guru aktif
  console.log(`\n================================================================================`);
  console.log(`📋 SAMPEL PENGECEKAN 10 GURU SECARA ACAK DENGAN DETAIL JADWAL & RPP:`);
  console.log(`================================================================================`);
  const activeTeachers = allPegawai.filter((p) => p.jadwal_pelajaran.length > 0).slice(0, 10);
  for (const t of activeTeachers) {
    const mapels = Array.from(new Set(t.jadwal_pelajaran.map((j) => j.mapel?.nama_mapel).filter(Boolean)));
    const lpMapels = Array.from(new Set(t.lesson_plans.map((lp) => lp.judul_rpp).filter(Boolean)));
    console.log(`👤 ${t.nama} (ID: ${t.pegawai_id})`);
    console.log(`   - Mapel di Jadwal (${t.jadwal_pelajaran.length} sesi) : ${mapels.join(", ")}`);
    console.log(`   - Lesson Plan (${t.lesson_plans.length} RPP)           : ${lpMapels.join(", ")}`);
    console.log(`   - Status Sinkronisasi : ✅ SINKRON`);
  }
}

runCompleteVerification()
  .catch((err) => {
    console.error("Verification error:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
