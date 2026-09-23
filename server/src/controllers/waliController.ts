// server/src/controllers/waliController.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

interface AuthUser {
  user_id: string;
  roles: string[];
  pegawai_id?: number;
}

const getAuthUser = (req: Request): AuthUser | null => {
  return (req as any).user || null;
};

// 1. Ambil daftar anak dari wali murid yang login
export const getDaftarAnak = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser?.user_id;

    let waliMurid = null;
    if (userId) {
      waliMurid = await prisma.waliMurid.findFirst({
        where: { user_id: userId },
      });
    }

    let siswaList: any[] = [];

    if (waliMurid) {
      // Ambil anak-anak dari wali murid ini
      siswaList = await prisma.siswa.findMany({
        where: {
          wali_murid_id: waliMurid.wali_id,
          NOT: { status: 'Tidak Aktif' },
        },
        include: {
          kelas: {
            include: { lembaga: true },
          },
          tahfidz_target: {
            where: { status: 'Aktif' },
          },
          tahfidz_setoran: {
            take: 1,
            orderBy: { tanggal: 'desc' },
            include: { pegawai: { select: { nama: true } } },
          },
        },
        orderBy: { nama: 'asc' },
      });
    }

    // Jika belum ada data anak yang tertaut (atau sedang preview/demo), ambil siswa aktif pertama sebagai fallback contoh
    if (siswaList.length === 0) {
      siswaList = await prisma.siswa.findMany({
        take: 3,
        where: { NOT: { status: 'Tidak Aktif' } },
        include: {
          kelas: {
            include: { lembaga: true },
          },
          tahfidz_target: {
            where: { status: 'Aktif' },
          },
          tahfidz_setoran: {
            take: 1,
            orderBy: { tanggal: 'desc' },
            include: { pegawai: { select: { nama: true } } },
          },
        },
        orderBy: { nama: 'asc' },
      });
    }

    res.json({
      success: true,
      data: siswaList,
      wali: waliMurid,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Ambil detail perkembangan anak (Presensi, Tahfidz, Jadwal)
export const getPerkembanganAnak = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { siswa_id } = req.params;
    const sId = Number(siswa_id);

    if (!sId) {
      res.status(400).json({ success: false, message: 'ID Siswa tidak valid' });
      return;
    }

    const siswa = await prisma.siswa.findUnique({
      where: { siswa_id: sId },
      include: {
        kelas: {
          include: { lembaga: true },
        },
        wali_murid: true,
      },
    });

    if (!siswa) {
      res.status(404).json({ success: false, message: 'Data santri tidak ditemukan' });
      return;
    }

    // Hari ini (YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];

    // Ambil data dalam paralel:
    // 1. Presensi Harian 30 hari terakhir
    // 2. Presensi Harian Hari Ini
    // 3. Setoran Tahfidz 15 terakhir
    // 4. Target Tahfidz
    // 5. Jadwal Pelajaran Kelas Hari Ini
    const [absensiHarianList, absensiHariIni, tahfidzSetoranList, tahfidzTargets, jadwalKelas] = await Promise.all([
      prisma.absensiHarian.findMany({
        where: { siswa_id: sId },
        take: 30,
        orderBy: { tanggal: 'desc' },
      }),
      prisma.absensiHarian.findFirst({
        where: { siswa_id: sId, tanggal: todayStr },
      }),
      prisma.tahfidzSetoran.findMany({
        where: { siswa_id: sId },
        take: 50,
        orderBy: { tanggal: 'desc' },
        include: { pegawai: { select: { nama: true } } },
      }),
      prisma.tahfidzTarget.findMany({
        where: { siswa_id: sId },
        orderBy: { created_at: 'desc' },
      }),
      siswa.kelas_id
        ? prisma.jadwalPelajaran.findMany({
            where: { kelas_id: siswa.kelas_id },
            include: {
              mapel: true,
              pegawai: { select: { nama: true } },
              jam_mulai: true,
              jam_selesai: true,
            },
            orderBy: { hari: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    // Hitung ringkasan presensi
    const rekapPresensi = {
      total: absensiHarianList.length,
      hadir: absensiHarianList.filter((a) => a.status === 'Hadir').length,
      sakit: absensiHarianList.filter((a) => a.status === 'Sakit').length,
      izin: absensiHarianList.filter((a) => a.status === 'Izin').length,
      alpa: absensiHarianList.filter((a) => a.status === 'Alpa' || a.status === 'Tanpa Keterangan').length,
    };

    // Hitung ringkasan tahfidz
    let totalAyatZiyadah = 0;
    let totalHaditsZiyadah = 0;
    let totalBaitZiyadah = 0;

    tahfidzSetoranList.forEach((s) => {
      if (s.jenis_hafalan === 'Setoran Baru') {
        if (s.kategori === 'Al-Quran' && s.total_ayat) totalAyatZiyadah += s.total_ayat;
        if (s.kategori === 'Hadits' && s.total_hadits) totalHaditsZiyadah += s.total_hadits;
        if (s.kategori === 'Matan Ilmu' && s.total_bait) totalBaitZiyadah += s.total_bait;
      }
    });

    const totalJuzZiyadah = Number(((totalAyatZiyadah / 6236) * 30).toFixed(2));

    res.json({
      success: true,
      data: {
        siswa,
        presensi: {
          hariIni: absensiHariIni || null,
          rekap30Hari: rekapPresensi,
          riwayat: absensiHarianList.slice(0, 10),
        },
        tahfidz: {
          summary: {
            totalSetoran: tahfidzSetoranList.length,
            totalJuzZiyadah,
            totalAyatZiyadah,
            totalHaditsZiyadah,
            totalBaitZiyadah,
          },
          targetAktif: tahfidzTargets.find((t) => t.status === 'Aktif') || null,
          targets: tahfidzTargets,
          recentSetoran: tahfidzSetoranList,
        },
        jadwalPelajaran: jadwalKelas,
      },
    });
  } catch (error) {
    next(error);
  }
};
