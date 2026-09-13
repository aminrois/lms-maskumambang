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
    const { jadwal_id, tanggal } = req.query;
    const where: any = {};
    if (jadwal_id) where.jadwal_id = Number(jadwal_id);
    if (tanggal) where.tanggal = String(tanggal);

    const list = await prisma.jurnalMengajar.findMany({
      where,
      include: {
        jadwal: {
          include: { kelas: true, mapel: true, pegawai: true },
        },
        lesson_plan_detail: true,
      },
      orderBy: { tanggal: 'desc' },
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
    const { tanggal, siswa_id } = req.query;
    const where: any = {};
    if (tanggal) where.tanggal = String(tanggal);
    if (siswa_id) where.siswa_id = Number(siswa_id);

    const list = await prisma.absensiHarian.findMany({
      where,
      include: { siswa: true },
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const createAbsensiHarian = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    data.siswa_id = Number(data.siswa_id);
    const item = await prisma.absensiHarian.create({ data });
    res.status(201).json(item);
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
