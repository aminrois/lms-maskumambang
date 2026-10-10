import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

// LESSON PLAN (RPP)
export const getLessonPlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pegawai_id, jadwal_id } = req.query;
    const where: any = {};
    if (pegawai_id) where.pegawai_id = Number(pegawai_id);
    if (jadwal_id) where.jadwal_id = Number(jadwal_id);

    const list = await prisma.lessonPlan.findMany({
      where,
      include: {
        pegawai: true,
        jadwal: {
          include: { kelas: true, mapel: true },
        },
        details: true,
      },
      orderBy: { lesson_plan_id: 'desc' },
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const getLessonPlanById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await prisma.lessonPlan.findUnique({
      where: { lesson_plan_id: Number(id) },
      include: {
        pegawai: true,
        jadwal: {
          include: { kelas: true, mapel: true },
        },
        details: { orderBy: { pertemuan_ke: 'asc' } },
      },
    });
    if (!item) {
      res.status(404).json({ success: false, message: 'Lesson plan tidak ditemukan' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const createLessonPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    data.pegawai_id = Number(data.pegawai_id);
    if (data.jadwal_id) data.jadwal_id = Number(data.jadwal_id);
    if (data.verified_by_kepsek) data.verified_by_kepsek = Number(data.verified_by_kepsek);
    if (data.verified_by_direktur) data.verified_by_direktur = Number(data.verified_by_direktur);

    const item = await prisma.lessonPlan.create({ data });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateLessonPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.pegawai_id) data.pegawai_id = Number(data.pegawai_id);
    if (data.jadwal_id !== undefined) data.jadwal_id = data.jadwal_id ? Number(data.jadwal_id) : null;
    if (data.verified_by_kepsek !== undefined) data.verified_by_kepsek = data.verified_by_kepsek ? Number(data.verified_by_kepsek) : null;
    if (data.verified_by_direktur !== undefined) data.verified_by_direktur = data.verified_by_direktur ? Number(data.verified_by_direktur) : null;

    const item = await prisma.lessonPlan.update({
      where: { lesson_plan_id: Number(id) },
      data,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteLessonPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.lessonPlan.delete({ where: { lesson_plan_id: Number(id) } });
    res.json({ success: true, message: 'Lesson plan berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// LESSON PLAN DETAIL
export const getLessonPlanDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lesson_plan_id } = req.query;
    const list = await prisma.lessonPlanDetail.findMany({
      where: lesson_plan_id ? { lesson_plan_id: Number(lesson_plan_id) } : undefined,
      orderBy: { pertemuan_ke: 'asc' },
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const createLessonPlanDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    data.lesson_plan_id = Number(data.lesson_plan_id);
    data.pertemuan_ke = Number(data.pertemuan_ke);
    const item = await prisma.lessonPlanDetail.create({ data });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateLessonPlanDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.lesson_plan_id) data.lesson_plan_id = Number(data.lesson_plan_id);
    if (data.pertemuan_ke) data.pertemuan_ke = Number(data.pertemuan_ke);
    const item = await prisma.lessonPlanDetail.update({
      where: { detail_id: Number(id) },
      data,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteLessonPlanDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.lessonPlanDetail.delete({ where: { detail_id: Number(id) } });
    res.json({ success: true, message: 'Lesson plan detail berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// JURNAL MENGAJAR
export const getJurnalMengajars = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jadwal_id, tanggal, pegawai_id, kelas_id } = req.query;
    const where: any = {};
    if (jadwal_id) where.jadwal_id = Number(jadwal_id);
    if (tanggal) where.tanggal = String(tanggal);
    if (pegawai_id || kelas_id) {
      where.jadwal = {};
      if (pegawai_id) where.jadwal.pegawai_id = Number(pegawai_id);
      if (kelas_id) where.jadwal.kelas_id = Number(kelas_id);
    }

    const list = await prisma.jurnalMengajar.findMany({
      where,
      include: {
        jadwal: {
          include: { kelas: true, mapel: true, pegawai: true },
        },
        lesson_plan_detail: true,
        absensi_pelajaran: {
          include: { siswa: true },
        },
      },
      orderBy: [{ tanggal: 'desc' }, { jurnal_id: 'desc' }],
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const getJurnalMengajarById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await prisma.jurnalMengajar.findUnique({
      where: { jurnal_id: Number(id) },
      include: {
        jadwal: {
          include: { kelas: true, mapel: true, pegawai: true },
        },
        lesson_plan_detail: true,
        absensi_pelajaran: {
          include: { siswa: true },
        },
      },
    });
    if (!item) {
      res.status(404).json({ success: false, message: 'Jurnal mengajar tidak ditemukan' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const createJurnalMengajar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    const todayDateJakarta = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const INDONESIAN_DAYS = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayDayIndex = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getDay();
    const todayDayName = INDONESIAN_DAYS[todayDayIndex];

    const itemTanggal = data.tanggal ? String(data.tanggal).split('T')[0].trim() : todayDateJakarta;
    if (itemTanggal < todayDateJakarta) {
      res.status(403).json({
        success: false,
        message: 'Batas waktu pengisian absensi telah berakhir (maksimal pukul 23:59 WIB pada hari jadwal).'
      });
      return;
    }

    if (data.jadwal_id) {
      const jadwalItem = await prisma.jadwalPelajaran.findUnique({
        where: { jadwal_id: Number(data.jadwal_id) },
        select: { hari: true }
      });
      if (jadwalItem?.hari && jadwalItem.hari !== todayDayName) {
        res.status(403).json({
          success: false,
          message: `Batas waktu pengisian absensi telah berakhir (hanya dapat diisi pada hari ${jadwalItem.hari} maksimal pukul 23:59 WIB).`
        });
        return;
      }
    }

    data.jadwal_id = Number(data.jadwal_id);
    if (data.lesson_plan_detail_id) data.lesson_plan_detail_id = Number(data.lesson_plan_detail_id);
    if (data.pertemuan_ke) data.pertemuan_ke = Number(data.pertemuan_ke);

    const item = await prisma.jurnalMengajar.create({ data });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateJurnalMengajar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.jadwal_id) data.jadwal_id = Number(data.jadwal_id);
    if (data.lesson_plan_detail_id !== undefined) {
      data.lesson_plan_detail_id = data.lesson_plan_detail_id ? Number(data.lesson_plan_detail_id) : null;
    }
    if (data.pertemuan_ke) data.pertemuan_ke = Number(data.pertemuan_ke);

    const item = await prisma.jurnalMengajar.update({
      where: { jurnal_id: Number(id) },
      data,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteJurnalMengajar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.jurnalMengajar.delete({ where: { jurnal_id: Number(id) } });
    res.json({ success: true, message: 'Jurnal mengajar berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// ABSENSI PELAJARAN
export const getAbsensiPelajarans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jurnal_id, siswa_id } = req.query;
    const where: any = {};
    if (jurnal_id) where.jurnal_id = Number(jurnal_id);
    if (siswa_id) where.siswa_id = Number(siswa_id);

    const list = await prisma.absensiPelajaran.findMany({
      where,
      include: { siswa: true },
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const createAbsensiPelajaran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    data.siswa_id = Number(data.siswa_id);
    data.jurnal_id = Number(data.jurnal_id);
    const item = await prisma.absensiPelajaran.create({ data });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const submitAbsensiPelajaranSesi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      jadwal_id,
      pertemuan_ke,
      tanggal,
      catatan_tambahan,
      catatan_guru,
      materi_diajarkan,
      lesson_plan_detail_id,
      status,
      detail_absensi = [],
    } = req.body;

    if (!jadwal_id) {
      res.status(400).json({ success: false, message: 'jadwal_id wajib diisi' });
      return;
    }

    const jadwalIdNum = Number(jadwal_id);
    const pertemuanNum = pertemuan_ke ? Number(pertemuan_ke) : 1;
    const todayStr = tanggal ? String(tanggal) : new Date().toISOString().split('T')[0];
    const finalCatatan = (catatan_tambahan || catatan_guru || materi_diajarkan || '').trim();
    const lessonPlanDetailIdNum = lesson_plan_detail_id ? Number(lesson_plan_detail_id) : null;

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const currentTime = formatter.format(new Date()).replace(/\./g, ':');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek apakah sudah ada jurnal mengajar untuk jadwal & pertemuan ini
      let existingJurnal = await tx.jurnalMengajar.findFirst({
        where: {
          jadwal_id: jadwalIdNum,
          pertemuan_ke: pertemuanNum,
        },
      });

      let jurnalId: number;

      if (existingJurnal) {
        const updated = await tx.jurnalMengajar.update({
          where: { jurnal_id: existingJurnal.jurnal_id },
          data: {
            tanggal: todayStr,
            catatan_tambahan: finalCatatan || existingJurnal.catatan_tambahan,
            lesson_plan_detail_id: lessonPlanDetailIdNum || existingJurnal.lesson_plan_detail_id,
            status: status || existingJurnal.status || 'Sesuai',
          },
        });
        jurnalId = updated.jurnal_id;
      } else {
        // Validasi batas waktu 23:59 hari jadwal untuk pengisian baru
        const todayDateJakarta = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date());
        const INDONESIAN_DAYS = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayDayIndex = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getDay();
        const todayDayName = INDONESIAN_DAYS[todayDayIndex];

        if (todayStr < todayDateJakarta) {
          throw new Error('Batas waktu pengisian absensi telah berakhir (maksimal pukul 23:59 WIB pada hari jadwal).');
        }

        const jadwalItem = await tx.jadwalPelajaran.findUnique({
          where: { jadwal_id: jadwalIdNum },
          select: { hari: true }
        });
        if (jadwalItem?.hari && jadwalItem.hari !== todayDayName) {
          throw new Error(`Batas waktu pengisian absensi telah berakhir (hanya dapat diisi pada hari ${jadwalItem.hari} maksimal pukul 23:59 WIB).`);
        }

        const created = await tx.jurnalMengajar.create({
          data: {
            jadwal_id: jadwalIdNum,
            pertemuan_ke: pertemuanNum,
            tanggal: todayStr,
            catatan_tambahan: finalCatatan,
            lesson_plan_detail_id: lessonPlanDetailIdNum,
            status: status || 'Sesuai',
          },
        });
        jurnalId = created.jurnal_id;
      }

      // 2. Simpan detail absensi siswa
      if (Array.isArray(detail_absensi) && detail_absensi.length > 0) {
        await tx.absensiPelajaran.deleteMany({
          where: { jurnal_id: jurnalId },
        });

        const absensiData = detail_absensi.map((item: any) => ({
          siswa_id: Number(item.siswa_id),
          jurnal_id: jurnalId,
          status: String(item.status || 'Hadir'),
          waktu_kehadiran: String(item.waktu_kehadiran || currentTime),
        }));

        await tx.absensiPelajaran.createMany({
          data: absensiData,
        });
      }

      return tx.jurnalMengajar.findUnique({
        where: { jurnal_id: jurnalId },
        include: {
          jadwal: {
            include: { kelas: true, mapel: true, pegawai: true },
          },
          lesson_plan_detail: true,
          absensi_pelajaran: {
            include: { siswa: true },
          },
        },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Presensi dan jurnal mengajar berhasil disimpan',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAbsensiPelajaran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await prisma.absensiPelajaran.update({
      where: { absensi_pel_id: Number(id) },
      data: req.body,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

// ABSENSI HARIAN
export const getAbsensiHarians = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tanggal, siswa_id, kelas_id, tanggal_mulai, tanggal_akhir } = req.query;
    const where: any = {};
    if (tanggal) where.tanggal = String(tanggal);
    if (tanggal_mulai || tanggal_akhir) {
      where.tanggal = {};
      if (tanggal_mulai) where.tanggal.gte = String(tanggal_mulai);
      if (tanggal_akhir) where.tanggal.lte = String(tanggal_akhir);
    }
    if (siswa_id) where.siswa_id = Number(siswa_id);
    if (kelas_id) {
      where.siswa = { kelas_id: Number(kelas_id) };
    }

    const list = await prisma.absensiHarian.findMany({
      where,
      include: { siswa: true },
      orderBy: { tanggal: 'desc' },
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const createAbsensiHarian = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const raw = req.body;
    let items: any[] = [];

    if (Array.isArray(raw)) {
      items = raw;
    } else if (raw && Array.isArray(raw.data)) {
      items = raw.data;
    } else if (raw) {
      items = [raw];
    }

    const results = [];
    for (const item of items) {
      const siswa_id = Number(item.siswa_id);
      const tanggal = String(item.tanggal);
      const status = String(item.status || 'Hadir');

      if (!siswa_id || !tanggal) continue;

      const existing = await prisma.absensiHarian.findFirst({
        where: { siswa_id, tanggal },
      });

      if (existing) {
        const updated = await prisma.absensiHarian.update({
          where: { absensi_harian_id: existing.absensi_harian_id },
          data: { status },
        });
        results.push(updated);
      } else {
        const created = await prisma.absensiHarian.create({
          data: { siswa_id, tanggal, status },
        });
        results.push(created);
      }
    }

    res.status(201).json(Array.isArray(raw) ? results : (results[0] || { success: true }));
  } catch (error) {
    next(error);
  }
};

export const updateAbsensiHarian = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await prisma.absensiHarian.update({
      where: { absensi_harian_id: Number(id) },
      data: req.body,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

// ACTIVITY PLAN
export const getActivityPlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lembaga_id, tahun_id } = req.query;
    const where: any = {};
    if (lembaga_id) where.lembaga_id = Number(lembaga_id);
    if (tahun_id) where.tahun_id = Number(tahun_id);

    const list = await prisma.activityPlan.findMany({
      where,
      orderBy: { tanggal_mulai: 'asc' },
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const createActivityPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    data.lembaga_id = Number(data.lembaga_id);
    data.tahun_id = Number(data.tahun_id);
    if (data.verified_by) data.verified_by = Number(data.verified_by);

    const item = await prisma.activityPlan.create({ data });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateActivityPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.lembaga_id) data.lembaga_id = Number(data.lembaga_id);
    if (data.tahun_id) data.tahun_id = Number(data.tahun_id);
    if (data.verified_by !== undefined) data.verified_by = data.verified_by ? Number(data.verified_by) : null;

    const item = await prisma.activityPlan.update({
      where: { activity_id: Number(id) },
      data,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteActivityPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.activityPlan.delete({ where: { activity_id: Number(id) } });
    res.json({ success: true, message: 'Activity plan berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// REKAP & MONITORING PENGAWASAN LESSON PLAN (DIREKTUR / KEPSEK)
export const getLessonPlanMonitoringRekap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lembaga_id, target_pertemuan } = req.query;
    const targetCount = Number(target_pertemuan) || 16;

    // Filter guru yang statusnya Aktif
    const pegawaiWhere: any = { status: 'Aktif' };
    if (lembaga_id) {
      pegawaiWhere.pegawai_lembaga = {
        some: { lembaga_id: Number(lembaga_id) },
      };
    }

    const allLembaga = await prisma.lembaga.findMany({
      select: { lembaga_id: true, nama_lembaga: true, singkatan: true },
      orderBy: { lembaga_id: 'asc' },
    });

    const listPegawai = await prisma.pegawai.findMany({
      where: pegawaiWhere,
      include: {
        pegawai_lembaga: {
          include: { lembaga: true },
        },
        jadwal_pelajaran: {
          include: {
            kelas: { include: { lembaga: true } },
            mapel: true,
          },
        },
        lesson_plans: {
          include: {
            details: {
              orderBy: { pertemuan_ke: 'asc' },
            },
            jadwal: {
              include: { kelas: true, mapel: true },
            },
          },
        },
      },
      orderBy: { nama: 'asc' },
    });

    // Kalkulasi rekap per guru
    const guruRekap = listPegawai.map((guru) => {
      const allDetails = guru.lesson_plans.flatMap((lp) => lp.details || []);
      const totalRpp = guru.lesson_plans.length;

      // Ambil kumpulan nomor pertemuan_ke unik yang telah dibuat
      const uniquePertemuanSet = new Set(allDetails.map((d) => d.pertemuan_ke));
      const pertemuanDibuat = Array.from(uniquePertemuanSet).sort((a, b) => a - b);
      const totalPertemuanDibuat = pertemuanDibuat.length;

      // Hitung pertemuan yang belum dibuat (dari 1 s/d targetCount)
      const pertemuanBelumDibuat: number[] = [];
      for (let i = 1; i <= targetCount; i++) {
        if (!uniquePertemuanSet.has(i)) {
          pertemuanBelumDibuat.push(i);
        }
      }

      // Status Verifikasi Direktur
      const disetujuiDirekturCount = guru.lesson_plans.filter((lp) => lp.status_verifikasi_direktur === 'Disetujui').length;
      const menungguDirekturCount = guru.lesson_plans.filter((lp) => lp.status_verifikasi_direktur === 'Menunggu Verifikasi').length;
      const revisiDirekturCount = guru.lesson_plans.filter((lp) => lp.status_verifikasi_direktur === 'Revisi').length;

      // Status Kepatuhan:
      // 'Belum Buat' jika totalPertemuanDibuat === 0
      // 'Lengkap' jika totalPertemuanDibuat >= targetCount
      // 'Sebagian' jika 0 < totalPertemuanDibuat < targetCount
      let statusKepatuhan: 'Belum Buat' | 'Sebagian' | 'Lengkap' = 'Belum Buat';
      if (totalPertemuanDibuat >= targetCount) {
        statusKepatuhan = 'Lengkap';
      } else if (totalPertemuanDibuat > 0) {
        statusKepatuhan = 'Sebagian';
      }

      // Lembaga list
      const lembagaList = guru.pegawai_lembaga.map((pl) => pl.lembaga.singkatan || pl.lembaga.nama_lembaga);
      const primaryLembaga = guru.pegawai_lembaga[0]?.lembaga?.nama_lembaga || '-';

      // Mapel & Kelas yang diampu
      const mapelList = Array.from(new Set(guru.jadwal_pelajaran.map((j) => j.mapel?.nama_mapel).filter(Boolean))) as string[];
      const kelasList = Array.from(new Set(guru.jadwal_pelajaran.map((j) => j.kelas?.nama_kelas).filter(Boolean))) as string[];

      return {
        pegawai_id: guru.pegawai_id,
        nig: guru.nig,
        nip: guru.nip,
        nama: guru.nama,
        jabatan: guru.jabatan,
        lembaga_list: lembagaList,
        primary_lembaga: primaryLembaga,
        total_jadwal: guru.jadwal_pelajaran.length,
        mapel_diampu: mapelList,
        kelas_diampu: kelasList,
        total_rpp: totalRpp,
        total_pertemuan_dibuat: totalPertemuanDibuat,
        target_pertemuan: targetCount,
        persentase: Math.min(100, Math.round((totalPertemuanDibuat / targetCount) * 100)),
        status_kepatuhan: statusKepatuhan,
        pertemuan_dibuat: pertemuanDibuat,
        pertemuan_belum_dibuat: pertemuanBelumDibuat,
        verifikasi_direktur: {
          disetujui: disetujuiDirekturCount,
          menunggu: menungguDirekturCount,
          revisi: revisiDirekturCount,
        },
        lesson_plans: guru.lesson_plans.map((lp) => ({
          lesson_plan_id: lp.lesson_plan_id,
          judul_rpp: lp.judul_rpp,
          status_verifikasi_direktur: lp.status_verifikasi_direktur,
          catatan_revisi_direktur: lp.catatan_revisi_direktur,
          total_detail: lp.details.length,
          pertemuan_list: lp.details.map((d) => d.pertemuan_ke),
        })),
      };
    });

    // KPI Summary
    const totalGuru = guruRekap.length;
    const totalLengkap = guruRekap.filter((g) => g.status_kepatuhan === 'Lengkap').length;
    const totalSebagian = guruRekap.filter((g) => g.status_kepatuhan === 'Sebagian').length;
    const totalBelumBuat = guruRekap.filter((g) => g.status_kepatuhan === 'Belum Buat').length;
    const totalRppMenungguVerifikasi = guruRekap.reduce((acc, g) => acc + g.verifikasi_direktur.menunggu, 0);
    const persentaseKepatuhan = totalGuru > 0 ? Math.round((totalLengkap / totalGuru) * 100) : 0;

    // Rekap per Lembaga
    const rekapPerLembaga = allLembaga.map((lembaga) => {
      const guruInLembaga = listPegawai.filter((p) =>
        p.pegawai_lembaga.some((pl) => pl.lembaga_id === lembaga.lembaga_id)
      );
      const ids = new Set(guruInLembaga.map((g) => g.pegawai_id));
      const rekapInLembaga = guruRekap.filter((g) => ids.has(g.pegawai_id));

      const lenLembaga = rekapInLembaga.length;
      const lengkap = rekapInLembaga.filter((g) => g.status_kepatuhan === 'Lengkap').length;
      const sebagian = rekapInLembaga.filter((g) => g.status_kepatuhan === 'Sebagian').length;
      const belum = rekapInLembaga.filter((g) => g.status_kepatuhan === 'Belum Buat').length;

      return {
        lembaga_id: lembaga.lembaga_id,
        nama_lembaga: lembaga.nama_lembaga,
        singkatan: lembaga.singkatan,
        total_guru: lenLembaga,
        lengkap,
        sebagian,
        belum,
        persentase: lenLembaga > 0 ? Math.round((lengkap / lenLembaga) * 100) : 0,
      };
    });

    res.json({
      summary: {
        total_guru: totalGuru,
        total_lengkap: totalLengkap,
        total_sebagian: totalSebagian,
        total_belum_buat: totalBelumBuat,
        persentase_kepatuhan: persentaseKepatuhan,
        total_menunggu_verifikasi: totalRppMenungguVerifikasi,
        target_pertemuan: targetCount,
      },
      rekap_per_lembaga: rekapPerLembaga,
      guru_rekap: guruRekap,
    });
  } catch (error) {
    next(error);
  }
};
