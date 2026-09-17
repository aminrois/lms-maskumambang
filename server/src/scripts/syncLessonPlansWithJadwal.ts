import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAY_ORDER: Record<string, number> = {
  Ahad: 1,
  Senin: 2,
  Selasa: 3,
  Rabu: 4,
  Kamis: 5,
  Jumat: 6,
  Sabtu: 7,
};

export async function syncLessonPlansWithJadwal() {
  console.log("🔄 Starting full synchronization of Lesson Plans with Jadwal Pelajaran...");

  const allPlans = await prisma.lessonPlan.findMany({
    include: {
      pegawai: true,
      jadwal: {
        include: {
          kelas: true,
          mapel: true,
          jam_mulai: true,
          jam_selesai: true,
        },
      },
    },
    orderBy: { lesson_plan_id: "asc" },
  });

  const allJadwals = await prisma.jadwalPelajaran.findMany({
    include: {
      kelas: true,
      mapel: true,
      jam_mulai: true,
      jam_selesai: true,
      pegawai: true,
    },
    orderBy: [
      { hari: "asc" },
      { jam_mulai: { urutan_jam: "asc" } },
    ],
  });

  let syncedCount = 0;

  for (const plan of allPlans) {
    let targetPegawaiId = plan.pegawai_id;

    // Extract class name and subject name from judul_rpp ("Mapel - Kelas" or "Mapel I - Kelas")
    const parts = (plan.judul_rpp || "").split(/\s+[-–]\s+/);
    const rawMapelStr = parts[0] || "";
    const rawKelasStr = parts[1] || "";

    // Clean Roman numerals from subject name to find base subject:
    // e.g. "Adab/Akhlaq II" -> base "Adab/Akhlaq", roman "II"
    let baseMapelName = rawMapelStr;
    let romanIndex = 0; // 0 for I or single, 1 for II, 2 for III, etc.

    if (/\bIV\b/i.test(rawMapelStr)) {
      romanIndex = 3;
      baseMapelName = rawMapelStr.replace(/\bIV\b/i, "").trim();
    } else if (/\bIII\b/i.test(rawMapelStr)) {
      romanIndex = 2;
      baseMapelName = rawMapelStr.replace(/\bIII\b/i, "").trim();
    } else if (/\bII\b/i.test(rawMapelStr)) {
      romanIndex = 1;
      baseMapelName = rawMapelStr.replace(/\bII\b/i, "").trim();
    } else if (/\bI\b/i.test(rawMapelStr)) {
      romanIndex = 0;
      baseMapelName = rawMapelStr.replace(/\bI\b/i, "").trim();
    }

    // Find candidate schedules for this teacher + class + mapel
    let candidateJadwals = allJadwals.filter((j) => {
      const matchPegawai = targetPegawaiId ? j.pegawai_id === targetPegawaiId : true;
      const matchKelas = rawKelasStr 
        ? j.kelas?.nama_kelas?.toLowerCase() === rawKelasStr.toLowerCase()
        : (plan.jadwal?.kelas_id ? j.kelas_id === plan.jadwal.kelas_id : true);
      
      const mapelName = j.mapel?.nama_mapel?.toLowerCase() || "";
      const matchMapel = baseMapelName 
        ? (mapelName === baseMapelName.toLowerCase() || mapelName.includes(baseMapelName.toLowerCase()) || baseMapelName.toLowerCase().includes(mapelName))
        : (plan.jadwal?.mapel_id ? j.mapel_id === plan.jadwal.mapel_id : true);

      return matchPegawai && matchKelas && matchMapel;
    });

    // If no candidate for targetPegawaiId, try matching by plan.jadwal.pegawai_id
    if (candidateJadwals.length === 0 && plan.jadwal?.pegawai_id) {
      targetPegawaiId = plan.jadwal.pegawai_id;
      candidateJadwals = allJadwals.filter((j) => {
        const matchPegawai = j.pegawai_id === targetPegawaiId;
        const matchKelas = rawKelasStr ? j.kelas?.nama_kelas?.toLowerCase() === rawKelasStr.toLowerCase() : true;
        const mapelName = j.mapel?.nama_mapel?.toLowerCase() || "";
        const matchMapel = baseMapelName 
          ? (mapelName === baseMapelName.toLowerCase() || mapelName.includes(baseMapelName.toLowerCase()) || baseMapelName.toLowerCase().includes(mapelName))
          : true;
        return matchPegawai && matchKelas && matchMapel;
      });
    }

    // If STILL no candidate, find the actual teacher who teaches this Mapel + Kelas in jadwal_pelajaran
    if (candidateJadwals.length === 0 && rawKelasStr && baseMapelName) {
      candidateJadwals = allJadwals.filter((j) => {
        const matchKelas = j.kelas?.nama_kelas?.toLowerCase() === rawKelasStr.toLowerCase();
        const mapelName = j.mapel?.nama_mapel?.toLowerCase() || "";
        const matchMapel = mapelName === baseMapelName.toLowerCase() || 
                           mapelName.includes(baseMapelName.toLowerCase()) || 
                           baseMapelName.toLowerCase().includes(mapelName);
        return matchKelas && matchMapel;
      });
    }

    if (candidateJadwals.length === 0) {
      continue;
    }

    // Group candidates by Day and take the first slot of each day
    const dayMap = new Map<string, typeof allJadwals[0]>();
    for (const j of candidateJadwals) {
      if (!dayMap.has(j.hari)) {
        dayMap.set(j.hari, j);
      }
    }

    // Sort distinct days chronologically: Ahad, Senin, Selasa, Rabu, Kamis, Jumat, Sabtu
    const sortedDays = Array.from(dayMap.keys()).sort(
      (a, b) => (DAY_ORDER[a] || 99) - (DAY_ORDER[b] || 99)
    );

    // Pick the matching day based on romanIndex
    const targetDay = sortedDays[romanIndex] || sortedDays[sortedDays.length - 1] || sortedDays[0];
    const correctJadwal = dayMap.get(targetDay);

    if (correctJadwal && (plan.jadwal_id !== correctJadwal.jadwal_id || plan.pegawai_id !== correctJadwal.pegawai_id)) {
      await prisma.lessonPlan.update({
        where: { lesson_plan_id: plan.lesson_plan_id },
        data: {
          jadwal_id: correctJadwal.jadwal_id,
          pegawai_id: correctJadwal.pegawai_id || plan.pegawai_id,
        },
      });
      syncedCount++;
    }
  }

  console.log(`✅ Synchronization completed: ${syncedCount} lesson plans updated and synced to their exact jadwal slot.`);
  return { syncedCount };
}

// Auto-run if executed directly
if (require.main === module) {
  syncLessonPlansWithJadwal()
    .catch((err) => {
      console.error("Error during sync:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
