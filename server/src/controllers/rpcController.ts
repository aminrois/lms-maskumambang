import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// Helper to sync parent LessonPlan status from details
const syncParentLessonPlanStatus = async (lessonPlanId: number) => {
  try {
    const details = await prisma.lessonPlanDetail.findMany({
      where: { lesson_plan_id: lessonPlanId },
    });

    if (details.length === 0) return;

    let kepsekStatus = 'Disetujui';
    if (details.some((d: any) => d.status_verifikasi_kepsek === 'Revisi')) {
      kepsekStatus = 'Revisi';
    } else if (details.some((d: any) => d.status_verifikasi_kepsek !== 'Disetujui')) {
      kepsekStatus = 'Menunggu Verifikasi';
    }

    let direkturStatus = 'Disetujui';
    if (details.some((d: any) => d.status_verifikasi_direktur === 'Revisi')) {
      direkturStatus = 'Revisi';
    } else if (details.some((d: any) => d.status_verifikasi_direktur !== 'Disetujui')) {
      direkturStatus = 'Menunggu Verifikasi';
    }

    await prisma.lessonPlan.update({
      where: { lesson_plan_id: lessonPlanId },
      data: {
        status_verifikasi_kepsek: kepsekStatus,
        status_verifikasi_direktur: direkturStatus,
      },
    });
  } catch (err) {
    console.error('Error syncing parent lesson plan status:', err);
  }
};

const getPegawaiIdFromReq = async (req: AuthRequest): Promise<number | null> => {
  if (req.body.p_verified_by) return Number(req.body.p_verified_by);
  if (req.body.verified_by) return Number(req.body.verified_by);
  if (!req.user?.user_id) return null;
  const user = await prisma.user.findUnique({
    where: { user_id: req.user.user_id },
    select: { pegawai: { select: { pegawai_id: true } } },
  });
  return user?.pegawai?.[0]?.pegawai_id || null;
};

// Verify Lesson Plan Detail Kepsek (Per-Pertemuan)
export const verifyLessonPlanDetailKepsek = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const detailId = req.body.p_detail_id || req.body.detail_id;
    const action = req.body.p_action || req.body.action;
    const catatanRevisi = req.body.p_catatan_revisi || req.body.catatan_revisi || '';
    const pegawaiId = await getPegawaiIdFromReq(req);

    const updated = await prisma.lessonPlanDetail.update({
      where: { detail_id: Number(detailId) },
      data: {
        status_verifikasi_kepsek: action,
        catatan_revisi_kepsek: action === 'Revisi' ? catatanRevisi : '',
        verified_by_kepsek: pegawaiId,
        // Jika disetujui kepsek, reset status direktur ke Menunggu Verifikasi jika sebelumnya revisi/kosong
        ...(action === 'Disetujui' ? { status_verifikasi_direktur: 'Menunggu Verifikasi', catatan_revisi_direktur: '' } : {}),
      },
    });

    if (updated.lesson_plan_id) {
      await syncParentLessonPlanStatus(updated.lesson_plan_id);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Verify Lesson Plan Detail Direktur (Per-Pertemuan)
export const verifyLessonPlanDetailDirektur = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const detailId = req.body.p_detail_id || req.body.detail_id;
    const action = req.body.p_action || req.body.action;
    const catatanRevisi = req.body.p_catatan_revisi || req.body.catatan_revisi || '';
    const pegawaiId = await getPegawaiIdFromReq(req);

    const updated = await prisma.lessonPlanDetail.update({
      where: { detail_id: Number(detailId) },
      data: {
        status_verifikasi_direktur: action,
        catatan_revisi_direktur: action === 'Revisi' ? catatanRevisi : '',
        verified_by_direktur: pegawaiId,
      },
    });

    if (updated.lesson_plan_id) {
      await syncParentLessonPlanStatus(updated.lesson_plan_id);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Verify Lesson Plan Kepsek (Bulk / Package level)
export const verifyLessonPlanKepsek = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { p_lesson_plan_id, p_action, p_catatan_revisi } = req.body;
    const planId = Number(p_lesson_plan_id);
    const pegawaiId = await getPegawaiIdFromReq(req);

    // Update all details for this plan
    await prisma.lessonPlanDetail.updateMany({
      where: { lesson_plan_id: planId },
      data: {
        status_verifikasi_kepsek: p_action,
        catatan_revisi_kepsek: p_action === 'Revisi' ? (p_catatan_revisi || '') : '',
        verified_by_kepsek: pegawaiId,
        ...(p_action === 'Disetujui' ? { status_verifikasi_direktur: 'Menunggu Verifikasi', catatan_revisi_direktur: '' } : {}),
      },
    });

    const updated = await prisma.lessonPlan.update({
      where: { lesson_plan_id: planId },
      data: {
        status_verifikasi_kepsek: p_action,
        catatan_revisi_kepsek: p_catatan_revisi || '',
        verified_by_kepsek: pegawaiId,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Verify Lesson Plan Direktur (Bulk / Package level)
export const verifyLessonPlanDirektur = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { p_lesson_plan_id, p_action, p_catatan_revisi } = req.body;
    const planId = Number(p_lesson_plan_id);
    const pegawaiId = await getPegawaiIdFromReq(req);

    // Update all details that were approved by Kepsek
    await prisma.lessonPlanDetail.updateMany({
      where: {
        lesson_plan_id: planId,
        status_verifikasi_kepsek: 'Disetujui',
      },
      data: {
        status_verifikasi_direktur: p_action,
        catatan_revisi_direktur: p_action === 'Revisi' ? (p_catatan_revisi || '') : '',
        verified_by_direktur: pegawaiId,
      },
    });

    const updated = await prisma.lessonPlan.update({
      where: { lesson_plan_id: planId },
      data: {
        status_verifikasi_direktur: p_action,
        catatan_revisi_direktur: p_catatan_revisi || '',
        verified_by_direktur: pegawaiId,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Verify Activity Plan
export const verifyActivityPlan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activity_id, action, catatan_revisi } = req.body;

    const updated = await prisma.activityPlan.update({
      where: { activity_id: Number(activity_id) },
      data: {
        status_verifikasi: action,
        catatan_revisi: catatan_revisi || '',
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Monitoring KBM
export const monitoringKbm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { p_lembaga_id, p_kelas_id, p_tanggal_mulai, p_tanggal_akhir } = req.body;

    const whereJurnal: any = {};
    if (p_tanggal_mulai && p_tanggal_akhir) {
      whereJurnal.tanggal = {
        gte: p_tanggal_mulai,
        lte: p_tanggal_akhir,
      };
    }

    const jurnals = await prisma.jurnalMengajar.findMany({
      where: {
        ...whereJurnal,
        jadwal: {
          ...(p_kelas_id && p_kelas_id !== 0 ? { kelas_id: Number(p_kelas_id) } : {}),
          ...(p_lembaga_id && p_lembaga_id !== 0
            ? { kelas: { lembaga_id: Number(p_lembaga_id) } }
            : {}),
        },
      },
      include: {
        jadwal: {
          include: {
            kelas: true,
            mapel: true,
            pegawai: true,
          },
        },
        lesson_plan_detail: true,
        absensi_pelajaran: true,
      },
      orderBy: { tanggal: 'desc' },
    });

    res.json(jurnals);
  } catch (error) {
    next(error);
  }
};

// Absensi Summary
export const absensiSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lembaga_id, kelas_id, mapel_id, tanggal_mulai, tanggal_akhir } = req.body;

    const absensis = await prisma.absensiPelajaran.findMany({
      where: {
        jurnal: {
          ...(tanggal_mulai && tanggal_akhir
            ? { tanggal: { gte: tanggal_mulai, lte: tanggal_akhir } }
            : {}),
          jadwal: {
            ...(kelas_id ? { kelas_id: Number(kelas_id) } : {}),
            ...(mapel_id ? { mapel_id: Number(mapel_id) } : {}),
            ...(lembaga_id ? { kelas: { lembaga_id: Number(lembaga_id) } } : {}),
          },
        },
      },
      include: {
        siswa: true,
        jurnal: {
          include: {
            jadwal: {
              include: { kelas: true, mapel: true },
            },
          },
        },
      },
    });

    res.json(absensis);
  } catch (error) {
    next(error);
  }
};

// Absensi Harian Summary
export const absensiHarianSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { p_lembaga_id, p_kelas_id, p_tanggal_mulai, p_tanggal_akhir } = req.body;

    const whereClause: any = {};
    if (p_tanggal_mulai && p_tanggal_akhir) {
      whereClause.tanggal = {
        gte: p_tanggal_mulai,
        lte: p_tanggal_akhir,
      };
    }
    if (p_kelas_id && p_kelas_id !== 0) {
      whereClause.siswa = {
        kelas_id: Number(p_kelas_id),
      };
    } else if (p_lembaga_id && p_lembaga_id !== 0) {
      whereClause.siswa = {
        kelas: {
          lembaga_id: Number(p_lembaga_id),
        },
      };
    }

    const records = await prisma.absensiHarian.findMany({
      where: whereClause,
      include: {
        siswa: {
          include: {
            kelas: true,
          },
        },
      },
    });

    res.json(records);
  } catch (error) {
    next(error);
  }
};
