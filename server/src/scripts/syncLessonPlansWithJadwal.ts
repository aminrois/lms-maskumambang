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
  console.log("🔄 Memulai sinkronisasi & auto-generate Lesson Plan dengan Jadwal Pelajaran...");

  // 1. Ambil semua jadwal pelajaran aktif beserta relasinya
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

  // 2. Ambil semua lesson plan yang ada
  const allPlans = await prisma.lessonPlan.findMany({
    include: {
      pegawai: true,
      details: true,
      jadwal: {
        include: {
          kelas: true,
          mapel: true,
        },
      },
    },
    orderBy: { lesson_plan_id: "asc" },
  });

  let syncedCount = 0;
  let createdCount = 0;
  let fixedDetailsCount = 0;

  // 3. Step 1: Perbaiki RPP yang sudah ada (judul tidak standar seperti 'tes', link jadwal_id, dan kelengkapan 16 pertemuan)
  for (const plan of allPlans) {
    let targetPegawaiId = plan.pegawai_id;

    // Deteksi jika judul adalah placeholder/tes
    const isPlaceholderTitle = !plan.judul_rpp || plan.judul_rpp.trim().length <= 3 || plan.judul_rpp.trim().toLowerCase() === "tes";

    // Jika placeholder dan ada linked jadwal, kita ambil nama mapel dan kelas dari jadwalnya
    let rawMapelStr = "";
    let rawKelasStr = "";

    if (isPlaceholderTitle && plan.jadwal) {
      rawMapelStr = plan.jadwal.mapel?.nama_mapel || "";
      rawKelasStr = plan.jadwal.kelas?.nama_kelas || "";
    } else {
      const parts = (plan.judul_rpp || "").split(/\s+[-–]\s+/);
      rawMapelStr = parts[0] || "";
      rawKelasStr = parts[1] || "";
    }

    // Clean Roman numerals from subject name to find base subject:
    let baseMapelName = rawMapelStr;
    let romanIndex = 0;

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

    let correctJadwal = candidateJadwals[0];
    if (candidateJadwals.length > 0) {
      const dayMap = new Map<string, typeof allJadwals[0]>();
      for (const j of candidateJadwals) {
        if (!dayMap.has(j.hari)) {
          dayMap.set(j.hari, j);
        }
      }
      const sortedDays = Array.from(dayMap.keys()).sort(
        (a, b) => (DAY_ORDER[a] || 99) - (DAY_ORDER[b] || 99)
      );
      const targetDay = sortedDays[romanIndex] || sortedDays[sortedDays.length - 1] || sortedDays[0];
      correctJadwal = dayMap.get(targetDay) || candidateJadwals[0];
    }

    const updateData: any = {};

    if (correctJadwal && (plan.jadwal_id !== correctJadwal.jadwal_id || plan.pegawai_id !== correctJadwal.pegawai_id)) {
      updateData.jadwal_id = correctJadwal.jadwal_id;
      updateData.pegawai_id = correctJadwal.pegawai_id || plan.pegawai_id;
    }

    // Jika judul RPP berupa placeholder "tes" atau terlalu pendek, ubah menjadi nama mapel & kelas yang benar
    if (isPlaceholderTitle && (correctJadwal || plan.jadwal)) {
      const jRef = correctJadwal || plan.jadwal;
      const cleanTitle = `${jRef?.mapel?.nama_mapel || "Mata Pelajaran"} - ${jRef?.kelas?.nama_kelas || "Kelas"}`;
      updateData.judul_rpp = cleanTitle;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.lessonPlan.update({
        where: { lesson_plan_id: plan.lesson_plan_id },
        data: updateData,
      });
      syncedCount++;
    }

    // Pastikan 16 slot detail pertemuan tersedia
    const existingMeetingNumbers = new Set(plan.details.map((d) => d.pertemuan_ke));
    const missingMeetings: number[] = [];
    for (let m = 1; m <= 16; m++) {
      if (!existingMeetingNumbers.has(m)) {
        missingMeetings.push(m);
      }
    }

    if (missingMeetings.length > 0) {
      for (const meetNo of missingMeetings) {
        await prisma.lessonPlanDetail.create({
          data: {
            lesson_plan_id: plan.lesson_plan_id,
            pertemuan_ke: meetNo,
            materi: null,
            topik_materi: null,
            status_verifikasi_kepsek: plan.status_verifikasi_kepsek || "Menunggu Verifikasi",
            status_verifikasi_direktur: plan.status_verifikasi_direktur || "Menunggu Verifikasi",
          },
        });
        fixedDetailsCount++;
      }
    }
  }

  // 4. Step 2: Auto-generate RPP untuk semua kombinasi Jadwal Pelajaran (Guru, Mapel, Kelas) yang belum memiliki RPP
  const currentAllPlans = await prisma.lessonPlan.findMany({
    include: {
      details: true,
      jadwal: {
        include: {
          mapel: true,
          kelas: true,
        },
      },
    },
  });

  // Group jadwals by (pegawai_id, mapel_id, kelas_id)
  const distinctJadwalGroups = new Map<string, {
    pegawai_id: number;
    mapel_id: number;
    kelas_id: number;
    nama_mapel: string;
    nama_kelas: string;
    jadwal_id: number;
    all_jadwal_ids: number[];
  }>();

  for (const j of allJadwals) {
    if (!j.pegawai_id || !j.mapel_id || !j.kelas_id || !j.mapel || !j.kelas) continue;
    const key = `${j.pegawai_id}_${j.mapel_id}_${j.kelas_id}`;
    if (!distinctJadwalGroups.has(key)) {
      distinctJadwalGroups.set(key, {
        pegawai_id: j.pegawai_id,
        mapel_id: j.mapel_id,
        kelas_id: j.kelas_id,
        nama_mapel: j.mapel.nama_mapel,
        nama_kelas: j.kelas.nama_kelas,
        jadwal_id: j.jadwal_id,
        all_jadwal_ids: [j.jadwal_id],
      });
    } else {
      distinctJadwalGroups.get(key)!.all_jadwal_ids.push(j.jadwal_id);
    }
  }

  for (const [key, group] of distinctJadwalGroups.entries()) {
    // Cek apakah sudah ada RPP untuk kombinasi Guru + Mapel + Kelas ini
    const hasLp = currentAllPlans.some((lp) => {
      if (lp.pegawai_id !== group.pegawai_id) return false;
      if (lp.jadwal_id && group.all_jadwal_ids.includes(lp.jadwal_id)) return true;

      const judul = (lp.judul_rpp || "").toLowerCase();
      const mapelNorm = group.nama_mapel.toLowerCase();
      const kelasNorm = group.nama_kelas.toLowerCase();

      return (judul.includes(mapelNorm) || mapelNorm.includes(judul.split("-")[0].trim())) &&
             (judul.includes(kelasNorm));
    });

    if (!hasLp) {
      console.log(`➕ Auto-generating missing Lesson Plan untuk Guru ID ${group.pegawai_id}: "${group.nama_mapel} - ${group.nama_kelas}"...`);
      
      const newPlan = await prisma.lessonPlan.create({
        data: {
          pegawai_id: group.pegawai_id,
          jadwal_id: group.jadwal_id,
          judul_rpp: `${group.nama_mapel} - ${group.nama_kelas}`,
          status_verifikasi_kepsek: "Menunggu Verifikasi",
          status_verifikasi_direktur: "Menunggu Verifikasi",
        },
      });

      // Buat langsung 16 slot pertemuan (1 - 16)
      const detailsData = Array.from({ length: 16 }, (_, i) => ({
        lesson_plan_id: newPlan.lesson_plan_id,
        pertemuan_ke: i + 1,
        materi: null,
        topik_materi: null,
        status_verifikasi_kepsek: "Menunggu Verifikasi",
        status_verifikasi_direktur: "Menunggu Verifikasi",
      }));

      await prisma.lessonPlanDetail.createMany({
        data: detailsData,
      });

      createdCount++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`✅ SINKRONISASI SELESAI:`);
  console.log(`   - Lesson Plan disinkronkan & diperbarui: ${syncedCount}`);
  console.log(`   - Lesson Plan baru dibuat otomatis (16 pertemuan): ${createdCount}`);
  console.log(`   - Detail pertemuan yang dilengkapi: ${fixedDetailsCount}`);
  console.log(`======================================================\n`);

  return { syncedCount, createdCount, fixedDetailsCount };
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
