import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

// Helper to get authenticated user info
const getAuthInfo = (req: Request) => {
  const user = (req as any).user;
  return user;
};

// ==========================================
// 1. PENUGASAN GURU TAHFIDZ (DIREKTUR / ADMIN)
// ==========================================

export const getPengampu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lembaga_id, pegawai_id, tahun_id } = req.query;
    const where: any = {};
    if (lembaga_id) where.lembaga_id = Number(lembaga_id);
    if (pegawai_id) where.pegawai_id = Number(pegawai_id);
    if (tahun_id) where.tahun_id = Number(tahun_id);

    const pengampuList = await prisma.tahfidzPengampu.findMany({
      where,
      include: {
        pegawai: true,
        kelas: {
          include: {
            lembaga: true,
            tahun_ajaran: true,
            siswa: {
              select: { siswa_id: true }
            }
          }
        },
        lembaga: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, data: pengampuList });
  } catch (error) {
    next(error);
  }
};

export const assignPengampu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pegawai_id, lembaga_id, kelas_id, tahun_id } = req.body;

    if (!pegawai_id || !lembaga_id || !kelas_id) {
      res.status(400).json({ success: false, message: 'Pegawai, Lembaga, dan Kelas wajib dipilih' });
      return;
    }

    const pengampu = await prisma.tahfidzPengampu.upsert({
      where: {
        pegawai_id_kelas_id: {
          pegawai_id: Number(pegawai_id),
          kelas_id: Number(kelas_id),
        },
      },
      update: {
        lembaga_id: Number(lembaga_id),
        tahun_id: tahun_id ? Number(tahun_id) : null,
      },
      create: {
        pegawai_id: Number(pegawai_id),
        lembaga_id: Number(lembaga_id),
        kelas_id: Number(kelas_id),
        tahun_id: tahun_id ? Number(tahun_id) : null,
      },
      include: {
        pegawai: true,
        kelas: true,
        lembaga: true,
      },
    });

    res.status(201).json({ success: true, data: pengampu, message: 'Penugasan Guru Tahfidz berhasil disimpan' });
  } catch (error) {
    next(error);
  }
};

export const deletePengampu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.tahfidzPengampu.delete({
      where: { pengampu_id: Number(id) },
    });
    res.json({ success: true, message: 'Penugasan Guru Tahfidz berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. SANTRI BINAAN TAHFIDZ
// ==========================================

export const getSantriTahfidz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { kelas_id, lembaga_id, pegawai_id } = req.query;
    const authUser = getAuthInfo(req);

    let targetKelasIds: number[] = [];

    // Jika filter kelas_id spesifik diberikan
    if (kelas_id) {
      targetKelasIds = [Number(kelas_id)];
    } else if (pegawai_id) {
      // Jika memfilter berdasarkan pegawai_id tertentu
      const pengampuRows = await prisma.tahfidzPengampu.findMany({
        where: { pegawai_id: Number(pegawai_id) },
        select: { kelas_id: true },
      });
      targetKelasIds = pengampuRows.map(p => p.kelas_id);
    } else {
      // Cek apakah user adalah Guru Tahfidz (bukan Super Admin / Direktur)
      const userRoles = authUser?.roles || [];
      const isGlobal = userRoles.includes('Super Admin') || userRoles.includes('Direktur') || userRoles.includes('Kepala Sekolah');

      if (!isGlobal && authUser?.pegawai_id) {
        const pengampuRows = await prisma.tahfidzPengampu.findMany({
          where: { pegawai_id: authUser.pegawai_id },
          select: { kelas_id: true },
        });
        targetKelasIds = pengampuRows.map(p => p.kelas_id);
      }
    }

    const whereSiswa: any = { status: 'Aktif' };
    if (targetKelasIds.length > 0) {
      whereSiswa.kelas_id = { in: targetKelasIds };
    } else if (lembaga_id) {
      whereSiswa.kelas = { lembaga_id: Number(lembaga_id) };
    }

    const santriList = await prisma.siswa.findMany({
      where: whereSiswa,
      include: {
        kelas: {
          include: { lembaga: true }
        },
        tahfidz_target: {
          where: { status: 'Aktif' }
        },
        tahfidz_setoran: {
          take: 1,
          orderBy: { tanggal: 'desc' },
          include: {
            pegawai: { select: { nama: true } }
          }
        },
      },
      orderBy: [
        { kelas: { nama_kelas: 'asc' } },
        { nama: 'asc' },
      ],
    });

    res.json({ success: true, data: santriList });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. TARGET HAFALAN SANTRI
// ==========================================

export const getTargetsBySiswa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { siswa_id } = req.params;
    const targets = await prisma.tahfidzTarget.findMany({
      where: { siswa_id: Number(siswa_id) },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: targets });
  } catch (error) {
    next(error);
  }
};

export const createTarget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { siswa_id, kategori, target_deskripsi, target_nominal, satuan, tanggal_mulai, tanggal_target, status } = req.body;

    if (!siswa_id || !kategori || !target_deskripsi || target_nominal === undefined) {
      res.status(400).json({ success: false, message: 'Semua field wajib target harus diisi' });
      return;
    }

    const target = await prisma.tahfidzTarget.create({
      data: {
        siswa_id: Number(siswa_id),
        kategori,
        target_deskripsi,
        target_nominal: Number(target_nominal),
        satuan: satuan || (kategori === 'Al-Quran' ? 'Juz' : kategori === 'Hadits' ? 'Hadits' : 'Bait'),
        tanggal_mulai: tanggal_mulai || new Date().toISOString().split('T')[0],
        tanggal_target: tanggal_target || null,
        status: status || 'Aktif',
      },
    });

    res.status(201).json({ success: true, data: target, message: 'Target hafalan berhasil ditambahkan' });
  } catch (error) {
    next(error);
  }
};

export const updateTarget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.target_nominal !== undefined) data.target_nominal = Number(data.target_nominal);
    if (data.siswa_id !== undefined) data.siswa_id = Number(data.siswa_id);

    const target = await prisma.tahfidzTarget.update({
      where: { target_id: Number(id) },
      data,
    });

    res.json({ success: true, data: target, message: 'Target hafalan berhasil diperbarui' });
  } catch (error) {
    next(error);
  }
};

export const deleteTarget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.tahfidzTarget.delete({
      where: { target_id: Number(id) },
    });
    res.json({ success: true, message: 'Target hafalan berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. PENCATATAN SETORAN HAFALAN
// ==========================================

export const getSetoranList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      siswa_id,
      kelas_id,
      kategori,
      jenis_hafalan,
      pegawai_id,
      tanggal_mulai,
      tanggal_akhir,
      limit = 50,
      offset = 0,
    } = req.query;

    const where: any = {};
    if (siswa_id) where.siswa_id = Number(siswa_id);
    if (kategori) where.kategori = String(kategori);
    if (jenis_hafalan) where.jenis_hafalan = String(jenis_hafalan);
    if (pegawai_id) where.pegawai_id = Number(pegawai_id);

    if (tanggal_mulai && tanggal_akhir) {
      where.tanggal = {
        gte: String(tanggal_mulai),
        lte: String(tanggal_akhir),
      };
    } else if (tanggal_mulai) {
      where.tanggal = { gte: String(tanggal_mulai) };
    }

    if (kelas_id) {
      where.siswa = { kelas_id: Number(kelas_id) };
    }

    const [total, setoranList] = await Promise.all([
      prisma.tahfidzSetoran.count({ where }),
      prisma.tahfidzSetoran.findMany({
        where,
        include: {
          siswa: {
            include: {
              kelas: {
                include: { lembaga: true }
              }
            }
          },
          pegawai: {
            select: { pegawai_id: true, nama: true, nig: true }
          },
        },
        orderBy: [{ tanggal: 'desc' }, { setoran_id: 'desc' }],
        take: Number(limit),
        skip: Number(offset),
      }),
    ]);

    res.json({
      success: true,
      data: setoranList,
      meta: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createSetoran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = getAuthInfo(req);
    const {
      siswa_id,
      pegawai_id,
      kategori,
      jenis_hafalan,
      tanggal,
      durasi_menit,
      kelancaran,
      catatan_guru,
      // Al-Quran
      surat_mulai,
      surat_mulai_nama,
      ayat_mulai,
      surat_selesai,
      surat_selesai_nama,
      ayat_selesai,
      juz,
      total_ayat,
      // Hadits
      kitab_hadits,
      hadits_no_mulai,
      hadits_no_selesai,
      total_hadits,
      // Matan Ilmu
      nama_matan,
      bait_mulai,
      bait_selesai,
      total_bait,
    } = req.body;

    // Fallback pegawai_id from authenticated user if not provided in body
    const effectivePegawaiId = pegawai_id ? Number(pegawai_id) : (authUser?.pegawai_id || null);

    if (!siswa_id || !effectivePegawaiId || !kategori || !jenis_hafalan || !kelancaran) {
      res.status(400).json({
        success: false,
        message: 'Santri, Guru Penilai, Kategori, Jenis Hafalan, dan Kelancaran wajib diisi',
      });
      return;
    }

    const newSetoran = await prisma.tahfidzSetoran.create({
      data: {
        siswa_id: Number(siswa_id),
        pegawai_id: effectivePegawaiId,
        kategori,
        jenis_hafalan,
        tanggal: tanggal || new Date().toISOString().split('T')[0],
        durasi_menit: durasi_menit ? Number(durasi_menit) : null,
        kelancaran,
        catatan_guru: catatan_guru || null,

        // Al-Quran
        surat_mulai: surat_mulai ? Number(surat_mulai) : null,
        surat_mulai_nama: surat_mulai_nama || null,
        ayat_mulai: ayat_mulai ? Number(ayat_mulai) : null,
        surat_selesai: surat_selesai ? Number(surat_selesai) : null,
        surat_selesai_nama: surat_selesai_nama || null,
        ayat_selesai: ayat_selesai ? Number(ayat_selesai) : null,
        juz: juz ? Number(juz) : null,
        total_ayat: total_ayat ? Number(total_ayat) : null,

        // Hadits
        kitab_hadits: kitab_hadits || null,
        hadits_no_mulai: hadits_no_mulai ? Number(hadits_no_mulai) : null,
        hadits_no_selesai: hadits_no_selesai ? Number(hadits_no_selesai) : null,
        total_hadits: total_hadits ? Number(total_hadits) : null,

        // Matan Ilmu
        nama_matan: nama_matan || null,
        bait_mulai: bait_mulai ? Number(bait_mulai) : null,
        bait_selesai: bait_selesai ? Number(bait_selesai) : null,
        total_bait: total_bait ? Number(total_bait) : null,
      },
      include: {
        siswa: true,
        pegawai: { select: { nama: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: newSetoran,
      message: 'Pencatatan setoran hafalan berhasil disimpan',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSetoran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.tahfidzSetoran.delete({
      where: { setoran_id: Number(id) },
    });
    res.json({ success: true, message: 'Data setoran hafalan berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. STATISTIK & PROGRES GRAFIK
// ==========================================

export const getStatistikSiswa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { siswa_id } = req.params;

    const [siswa, targets, setoranList] = await Promise.all([
      prisma.siswa.findUnique({
        where: { siswa_id: Number(siswa_id) },
        include: { kelas: { include: { lembaga: true } } },
      }),
      prisma.tahfidzTarget.findMany({
        where: { siswa_id: Number(siswa_id) },
        orderBy: { created_at: 'desc' },
      }),
      prisma.tahfidzSetoran.findMany({
        where: { siswa_id: Number(siswa_id) },
        orderBy: { tanggal: 'asc' },
        include: { pegawai: { select: { nama: true } } },
      }),
    ]);

    if (!siswa) {
      res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
      return;
    }

    // Akumulasi per kategori untuk 'Setoran Baru' (Ziyadah)
    let totalAyatQuranZiyadah = 0;
    let totalHaditsZiyadah = 0;
    let totalBaitMatanZiyadah = 0;

    let totalSetoranBaru = 0;
    let totalSetoranUlang = 0;

    const kelancaranCount: Record<string, number> = {
      'Sangat Lancar': 0,
      'Lancar': 0,
      'Kurang Lancar': 0,
      'Belum Lancar': 0,
    };

    // Timeline data untuk grafik progres bulanan / mingguan
    const timelineMap: Record<string, { tanggal: string; quran_ayat: number; hadits_count: number; matan_bait: number }> = {};

    setoranList.forEach((s) => {
      if (s.jenis_hafalan === 'Setoran Baru') {
        totalSetoranBaru++;
        if (s.kategori === 'Al-Quran' && s.total_ayat) totalAyatQuranZiyadah += s.total_ayat;
        if (s.kategori === 'Hadits' && s.total_hadits) totalHaditsZiyadah += s.total_hadits;
        if (s.kategori === 'Matan Ilmu' && s.total_bait) totalBaitMatanZiyadah += s.total_bait;
      } else {
        totalSetoranUlang++;
      }

      if (kelancaranCount[s.kelancaran] !== undefined) {
        kelancaranCount[s.kelancaran]++;
      }

      // Group by date for chart timeline
      if (!timelineMap[s.tanggal]) {
        timelineMap[s.tanggal] = { tanggal: s.tanggal, quran_ayat: 0, hadits_count: 0, matan_bait: 0 };
      }
      if (s.kategori === 'Al-Quran') timelineMap[s.tanggal].quran_ayat += s.total_ayat || 1;
      if (s.kategori === 'Hadits') timelineMap[s.tanggal].hadits_count += s.total_hadits || 1;
      if (s.kategori === 'Matan Ilmu') timelineMap[s.tanggal].matan_bait += s.total_bait || 1;
    });

    const timelineChart = Object.values(timelineMap).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    res.json({
      success: true,
      data: {
        siswa,
        targets,
        summary: {
          totalSetoran: setoranList.length,
          totalSetoranBaru,
          totalSetoranUlang,
          totalAyatQuranZiyadah,
          totalHaditsZiyadah,
          totalBaitMatanZiyadah,
          kelancaranCount,
        },
        timelineChart,
        recentSetoran: setoranList.slice(-10).reverse(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTahfidzDashboardSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lembaga_id, kelas_id, pegawai_id } = req.query;
    const authUser = getAuthInfo(req);

    const whereSetoran: any = {};
    const whereSiswa: any = { status: 'Aktif' };

    if (kelas_id) {
      whereSetoran.siswa = { kelas_id: Number(kelas_id) };
      whereSiswa.kelas_id = Number(kelas_id);
    } else if (pegawai_id) {
      whereSetoran.pegawai_id = Number(pegawai_id);
    } else if (authUser?.roles?.includes('Guru Tahfidz') && !authUser?.roles?.includes('Direktur') && !authUser?.roles?.includes('Super Admin')) {
      if (authUser.pegawai_id) {
        const pengampuRows = await prisma.tahfidzPengampu.findMany({
          where: { pegawai_id: authUser.pegawai_id },
          select: { kelas_id: true },
        });
        const kIds = pengampuRows.map(p => p.kelas_id);
        if (kIds.length > 0) {
          whereSetoran.siswa = { kelas_id: { in: kIds } };
          whereSiswa.kelas_id = { in: kIds };
        }
      }
    }

    if (lembaga_id) {
      whereSiswa.kelas = { lembaga_id: Number(lembaga_id) };
    }

    // Tanggal 7 hari terakhir
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateLimit = sevenDaysAgo.toISOString().split('T')[0];

    const [totalSantri, totalSetoranAll, setoranPekanIni, recentActivities] = await Promise.all([
      prisma.siswa.count({ where: whereSiswa }),
      prisma.tahfidzSetoran.count({ where: whereSetoran }),
      prisma.tahfidzSetoran.count({
        where: {
          ...whereSetoran,
          tanggal: { gte: dateLimit },
        },
      }),
      prisma.tahfidzSetoran.findMany({
        where: whereSetoran,
        take: 8,
        orderBy: { created_at: 'desc' },
        include: {
          siswa: { include: { kelas: true } },
          pegawai: { select: { nama: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalSantri,
        totalSetoranAll,
        setoranPekanIni,
        recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
};
