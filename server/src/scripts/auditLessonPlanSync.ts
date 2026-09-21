import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runAudit() {
  console.log("==================================================");
  console.log("🔍 AUDIT SINKRONISASI JADWAL PELAJARAN VS LESSON PLAN");
  console.log("==================================================");

  // Cek jadwal hari Kamis di kelas 6B
  console.log("\n=== JADWAL HARI KAMIS DI KELAS 6B ===");
  const kamis6BJadwals = await prisma.jadwalPelajaran.findMany({
    where: {
      hari: "Kamis",
      kelas: { nama_kelas: "6B" },
    },
    include: {
      mapel: true,
      kelas: true,
      pegawai: true,
      jam_mulai: true,
      jam_selesai: true,
      lesson_plans: {
        include: {
          pegawai: true,
        },
      },
    },
  });

  for (const j of kamis6BJadwals) {
    console.log(`Jadwal #${j.jadwal_id}: Hari: ${j.hari}, Jam: ${j.jam_mulai?.jam_mulai} - ${j.jam_selesai?.jam_selesai}, Mapel: "${j.mapel?.nama_mapel}" (ID: ${j.mapel_id}), Guru: "${j.pegawai?.nama}" (ID: ${j.pegawai_id})`);
    for (const lp of j.lesson_plans) {
      console.log(`   Linked LP #${lp.lesson_plan_id}: "${lp.judul_rpp}", Guru di LP: "${lp.pegawai?.nama}" (ID: ${lp.pegawai_id})`);
    }
  }

  // Cek LP Tajwid/Tahsin - 6B
  console.log("\n=== LP TAJWID/TAHSIN - 6B ===");
  const tajwid6b = await prisma.lessonPlan.findMany({
    where: {
      judul_rpp: { contains: "Tajwid", mode: "insensitive" },
      AND: { judul_rpp: { contains: "6B", mode: "insensitive" } },
    },
    include: {
      pegawai: true,
      jadwal: {
        include: {
          mapel: true,
          kelas: true,
          pegawai: true,
          jam_mulai: true,
          jam_selesai: true,
        },
      },
    },
  });

  for (const lp of tajwid6b) {
    console.log(`LP #${lp.lesson_plan_id}: "${lp.judul_rpp}"`);
    console.log(`- Guru LP: "${lp.pegawai?.nama}" (pegawai_id: ${lp.pegawai_id})`);
    console.log(`- Linked Jadwal #${lp.jadwal_id}:`);
    console.log(`  * Hari: ${lp.jadwal?.hari}`);
    console.log(`  * Jam: ${lp.jadwal?.jam_mulai?.jam_mulai} - ${lp.jadwal?.jam_selesai?.jam_selesai}`);
    console.log(`  * Mapel: "${lp.jadwal?.mapel?.nama_mapel}"`);
    console.log(`  * Kelas: "${lp.jadwal?.kelas?.nama_kelas}"`);
    console.log(`  * Guru di Jadwal: "${lp.jadwal?.pegawai?.nama}" (pegawai_id: ${lp.jadwal?.pegawai_id})`);
  }

  // 1b. Cek siapa yang punya LP Tajwid / Tahsin
  console.log("\n=== DAFTAR SEMUA LESSON PLAN TAJWID / TAHSIN ===");
  const tajwidTahsinLPs = await prisma.lessonPlan.findMany({
    where: {
      OR: [
        { judul_rpp: { contains: "Tajwid", mode: "insensitive" } },
        { judul_rpp: { contains: "Tahsin", mode: "insensitive" } },
      ],
    },
    include: {
      pegawai: true,
      jadwal: {
        include: {
          mapel: true,
          kelas: true,
          pegawai: true,
        },
      },
    },
  });

  for (const lp of tajwidTahsinLPs) {
    console.log(`- LP #${lp.lesson_plan_id}: "${lp.judul_rpp}" | Guru LP: ${lp.pegawai?.nama} (${lp.pegawai_id}) | Jadwal #${lp.jadwal_id}: Mapel "${lp.jadwal?.mapel?.nama_mapel}", Kelas "${lp.jadwal?.kelas?.nama_kelas}", Guru Jadwal: ${lp.jadwal?.pegawai?.nama} (${lp.jadwal?.pegawai_id})`);
  }

  // 2. Audit SEMUA Guru & Lesson Plan di Database
  console.log("\n==================================================");
  console.log("🔍 AUDIT MENYELURUH SEMUA GURU DI SISTEM");
  console.log("==================================================");

  const allPegawai = await prisma.pegawai.findMany({
    include: {
      jadwal_pelajaran: {
        include: {
          mapel: true,
          kelas: true,
        },
      },
      lesson_plans: {
        include: {
          jadwal: {
            include: {
              mapel: true,
              kelas: true,
              pegawai: true,
            },
          },
        },
      },
    },
    orderBy: { nama: "asc" },
  });

  const discrepancies: Array<{
    guru: string;
    pegawai_id: number;
    issue: string;
    detail: string;
  }> = [];

  for (const p of allPegawai) {
    const taughtMapelSet = new Set(
      p.jadwal_pelajaran
        .map((j) => j.mapel?.nama_mapel?.toLowerCase().trim())
        .filter(Boolean)
    );

    const taughtClassSet = new Set(
      p.jadwal_pelajaran
        .map((j) => j.kelas?.nama_kelas?.toLowerCase().trim())
        .filter(Boolean)
    );

    for (const lp of p.lesson_plans) {
      const parts = (lp.judul_rpp || "").split(/\s+[-–]\s+/);
      const lpMapel = parts[0]?.trim();
      const lpKelas = parts[1]?.trim();

      // Clean Roman numerals
      const baseLpMapel = lpMapel?.replace(/\s+(i|ii|iii|iv|v|vi)$/i, "").toLowerCase().trim();

      let mapelMatch = false;
      for (const tm of taughtMapelSet) {
        if (tm && baseLpMapel && (tm.includes(baseLpMapel) || baseLpMapel.includes(tm))) {
          mapelMatch = true;
          break;
        }
      }

      if (!mapelMatch && taughtMapelSet.size > 0) {
        discrepancies.push({
          guru: p.nama,
          pegawai_id: p.pegawai_id,
          issue: "Mata Pelajaran LP tidak ada di Jadwal Guru",
          detail: `LP #${lp.lesson_plan_id} "${lp.judul_rpp}" (Mapel: "${lpMapel}") padahal guru hanya mengajar: [${Array.from(taughtMapelSet).join(", ")}]`,
        });
      }

      if (lp.jadwal && lp.jadwal.pegawai_id !== p.pegawai_id) {
        discrepancies.push({
          guru: p.nama,
          pegawai_id: p.pegawai_id,
          issue: "Jadwal LP dipegang guru lain",
          detail: `LP #${lp.lesson_plan_id} "${lp.judul_rpp}" terhubung ke Jadwal #${lp.jadwal_id} milik guru "${lp.jadwal.pegawai?.nama}" (ID: ${lp.jadwal.pegawai_id})`,
        });
      }
    }
  }

  console.log(`\n📊 TOTAL DISKREPANSI / KESALAHAN MAPEL: ${discrepancies.length}`);
  if (discrepancies.length > 0) {
    console.table(discrepancies);
  } else {
    console.log("✅ Semua Lesson Plan sinkron 100% dengan mata pelajaran yang diajar guru di jadwal pelajaran!");
  }
}

runAudit()
  .catch((err) => {
    console.error("Audit error:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
