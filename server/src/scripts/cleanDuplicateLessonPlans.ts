import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function deduplicateLessonPlans() {
  console.log("🧹 Starting Lesson Plan deduplication...");

  const allPlans = await prisma.lessonPlan.findMany({
    include: {
      details: {
        include: {
          jurnal_mengajar: true,
        },
      },
    },
    orderBy: { lesson_plan_id: "asc" },
  });

  // Group by (pegawai_id + '_' + (jadwal_id || 'null') + '_' + judul_rpp.trim().toLowerCase())
  const groups: Record<string, typeof allPlans> = {};

  for (const plan of allPlans) {
    const normJudul = (plan.judul_rpp || "").trim().toLowerCase();
    const key = `${plan.pegawai_id}_${plan.jadwal_id || 'null'}_${normJudul}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(plan);
  }

  let mergedCount = 0;
  let deletedPlanCount = 0;
  let deletedDetailCount = 0;
  let repointedJurnalCount = 0;

  for (const [key, planList] of Object.entries(groups)) {
    if (planList.length <= 1) continue;

    mergedCount++;

    // Sort to pick canonical plan:
    // 1. Both Kepsek & Direktur approved > Kepsek approved > Draft
    // 2. Has more details
    // 3. Has jurnals linked
    // 4. Lowest ID (first created)
    planList.sort((a, b) => {
      const scoreA = (a.status_verifikasi_direktur === 'Disetujui' ? 4 : 0) +
                     (a.status_verifikasi_kepsek === 'Disetujui' ? 2 : 0) +
                     (a.details.length > 0 ? 1 : 0);
      const scoreB = (b.status_verifikasi_direktur === 'Disetujui' ? 4 : 0) +
                     (b.status_verifikasi_kepsek === 'Disetujui' ? 2 : 0) +
                     (b.details.length > 0 ? 1 : 0);

      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.lesson_plan_id - b.lesson_plan_id;
    });

    const canonicalPlan = planList[0];
    const duplicatePlans = planList.slice(1);

    // Map pertemuan_ke -> detail_id in canonical plan
    const canonicalDetailMap = new Map<number, number>();
    for (const d of canonicalPlan.details) {
      canonicalDetailMap.set(d.pertemuan_ke, d.detail_id);
    }

    for (const dup of duplicatePlans) {
      for (const dupDetail of dup.details) {
        // If this duplicate detail has jurnals pointing to it, re-point them to canonical detail
        if (dupDetail.jurnal_mengajar && dupDetail.jurnal_mengajar.length > 0) {
          let targetDetailId = canonicalDetailMap.get(dupDetail.pertemuan_ke);
          
          // If canonical didn't have this pertemuan_ke, create it on canonical or use first detail
          if (!targetDetailId) {
            if (canonicalPlan.details.length > 0) {
              targetDetailId = canonicalPlan.details[0].detail_id;
            }
          }

          if (targetDetailId) {
            for (const j of dupDetail.jurnal_mengajar) {
              await prisma.jurnalMengajar.update({
                where: { jurnal_id: j.jurnal_id },
                data: { lesson_plan_detail_id: targetDetailId },
              });
              repointedJurnalCount++;
            }
          }
        }

        // Delete duplicate detail
        await prisma.lessonPlanDetail.delete({
          where: { detail_id: dupDetail.detail_id },
        });
        deletedDetailCount++;
      }

      // Delete duplicate plan
      await prisma.lessonPlan.delete({
        where: { lesson_plan_id: dup.lesson_plan_id },
      });
      deletedPlanCount++;
    }
  }

  console.log(`✅ Deduplication completed:`);
  console.log(`   - Groups merged: ${mergedCount}`);
  console.log(`   - Duplicate lesson_plans deleted: ${deletedPlanCount}`);
  console.log(`   - Duplicate lesson_plan_details deleted: ${deletedDetailCount}`);
  console.log(`   - Jurnals repointed: ${repointedJurnalCount}`);

  return { mergedCount, deletedPlanCount, deletedDetailCount, repointedJurnalCount };
}

// Auto-run if executed directly
if (require.main === module) {
  deduplicateLessonPlans()
    .catch((err) => {
      console.error("Error during deduplication:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
