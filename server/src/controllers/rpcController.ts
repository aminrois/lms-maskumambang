import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// Verify Lesson Plan Kepsek
export const verifyLessonPlanKepsek = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { p_lesson_plan_id, p_action, p_catatan_revisi } = req.body;

    const updated = await prisma.lessonPlan.update({
      where: { lesson_plan_id: Number(p_lesson_plan_id) },
      data: {
        status_verifikasi_kepsek: p_action,
        catatan_revisi_kepsek: p_catatan_revisi || '',
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Verify Lesson Plan Direktur
export const verifyLessonPlanDirektur = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { p_lesson_plan_id, p_action, p_catatan_revisi } = req.body;

    const updated = await prisma.lessonPlan.update({
      where: { lesson_plan_id: Number(p_lesson_plan_id) },
      data: {
        status_verifikasi_direktur: p_action,
        catatan_revisi_direktur: p_catatan_revisi || '',
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
