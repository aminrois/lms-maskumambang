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
          ...(p_kelas_id && Number(p_kelas_id) > 0 ? { kelas_id: Number(p_kelas_id) } : {}),
          ...(p_lembaga_id && Number(p_lembaga_id) > 0
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
            jam_mulai: true,
            jam_selesai: true,
          },
        },
        lesson_plan_detail: true,
        absensi_pelajaran: true,
      },
      orderBy: { tanggal: 'desc' },
    });

    const result = jurnals.map((j) => {
      const rencanaStr = j.lesson_plan_detail?.rencana_pelaksanaan_kbm || null;
      let status = "Sesuai";
      if (rencanaStr && j.tanggal) {
        const rDate = String(rencanaStr).split(' ')[0].trim();
        const tDate = String(j.tanggal).split(' ')[0].trim();
        if (tDate === rDate) {
          status = "Sesuai";
        } else if (tDate > rDate) {
          status = "Terlambat";
        } else if (tDate < rDate) {
          status = "Terlalu Cepat";
        }
      }

      const jmMulai = j.jadwal?.jam_mulai?.jam_mulai?.substring(0, 5) || "";
      const jmSelesai = j.jadwal?.jam_selesai?.jam_selesai?.substring(0, 5) || "";
      const jamStr = (jmMulai && jmSelesai) 
        ? `${jmMulai} - ${jmSelesai}` 
        : (j.jadwal?.jam_mulai ? `Jam ${j.jadwal.jam_mulai.urutan_jam}` : `Pertemuan ke-${j.pertemuan_ke || 1}`);

      const hadir = j.absensi_pelajaran ? j.absensi_pelajaran.filter(a => a.status === 'Hadir').length : 0;
      const totalSiswa = j.absensi_pelajaran ? j.absensi_pelajaran.length : 0;

      return {
        id: j.jurnal_id,
        jurnal_id: j.jurnal_id,
        nama_guru: j.jadwal?.pegawai?.nama || "Guru",
        nama_mapel: j.jadwal?.mapel?.nama_mapel || "Mata Pelajaran",
        nama_kelas: j.jadwal?.kelas?.nama_kelas || "Kelas",
        kelas_id: j.jadwal?.kelas_id,
        lembaga_id: j.jadwal?.kelas?.lembaga_id,
        pertemuan_ke: j.pertemuan_ke || 1,
        lp_pertemuan_ke: j.lesson_plan_detail?.pertemuan_ke || j.pertemuan_ke || 1,
        status: status,
        tanggal: j.tanggal,
        tanggal_rencana: rencanaStr || j.tanggal,
        catatan_tambahan: j.catatan_tambahan || null,
        hari: j.jadwal?.hari || "-",
        jam: jamStr,
        materi: j.lesson_plan_detail?.materi || "",
        total_hadir: hadir,
        total_siswa: totalSiswa,
        // Also keep nested objects for compatibility
        jadwal: j.jadwal,
        lesson_plan_detail: j.lesson_plan_detail,
        absensi_pelajaran: j.absensi_pelajaran,
      };
    });

    res.json(result);
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

// Bulk Verify Lesson Plans (Kepala Sekolah, Direktur, Super Admin)
export const bulkVerifyLessonPlans = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role: requestedRole, lembaga_id, lesson_plan_ids } = req.body;
    const userRoles = req.user?.roles || [];
    const effectiveRole = requestedRole || (userRoles.includes('Direktur') ? 'Direktur' : userRoles.includes('Super Admin') ? 'Super Admin' : userRoles.includes('Kepala Sekolah') ? 'Kepala Sekolah' : null);

    if (!effectiveRole || (!userRoles.includes('Direktur') && !userRoles.includes('Super Admin') && !userRoles.includes('Kepala Sekolah'))) {
      res.status(403).json({ error: 'Akses ditolak. Hanya Kepala Sekolah, Direktur, atau Super Admin yang berwenang.' });
      return;
    }

    const pegawaiId = await getPegawaiIdFromReq(req);

    // Build filter for lesson plans to verify
    const planWhere: any = {};
    if (lesson_plan_ids && Array.isArray(lesson_plan_ids) && lesson_plan_ids.length > 0) {
      planWhere.lesson_plan_id = { in: lesson_plan_ids.map(Number) };
    }
    if (lembaga_id && Number(lembaga_id) > 0) {
      planWhere.jadwal = {
        kelas: { lembaga_id: Number(lembaga_id) }
      };
    }

    if (effectiveRole === 'Kepala Sekolah') {
      // Kepala Sekolah menyetujui semua RPP dan pertemuannya
      const plans = await prisma.lessonPlan.findMany({
        where: planWhere,
        select: { lesson_plan_id: true }
      });
      const planIds = plans.map(p => p.lesson_plan_id);

      if (planIds.length > 0) {
        await prisma.lessonPlanDetail.updateMany({
          where: { lesson_plan_id: { in: planIds } },
          data: {
            status_verifikasi_kepsek: 'Disetujui',
            catatan_revisi_kepsek: '',
            verified_by_kepsek: pegawaiId,
          }
        });

        await prisma.lessonPlan.updateMany({
          where: { lesson_plan_id: { in: planIds } },
          data: {
            status_verifikasi_kepsek: 'Disetujui',
            catatan_revisi_kepsek: '',
            verified_by_kepsek: pegawaiId,
          }
        });
      }

      res.json({
        success: true,
        message: `Berhasil menyetujui ${planIds.length} Lesson Plan dari sisi Kepala Sekolah.`,
        verifiedCount: planIds.length
      });
    } else {
      // Direktur atau Super Admin menyetujui RPP (dan memastikan status kepsek & direktur Disetujui)
      const plans = await prisma.lessonPlan.findMany({
        where: planWhere,
        select: { lesson_plan_id: true }
      });
      const planIds = plans.map(p => p.lesson_plan_id);

      if (planIds.length > 0) {
        await prisma.lessonPlanDetail.updateMany({
          where: { lesson_plan_id: { in: planIds } },
          data: {
            status_verifikasi_kepsek: 'Disetujui',
            status_verifikasi_direktur: 'Disetujui',
            catatan_revisi_direktur: '',
            verified_by_direktur: pegawaiId,
          }
        });

        await prisma.lessonPlan.updateMany({
          where: { lesson_plan_id: { in: planIds } },
          data: {
            status_verifikasi_kepsek: 'Disetujui',
            status_verifikasi_direktur: 'Disetujui',
            catatan_revisi_direktur: '',
            verified_by_direktur: pegawaiId,
          }
        });
      }

      res.json({
        success: true,
        message: `Berhasil menyetujui ${planIds.length} Lesson Plan dari sisi Direktur.`,
        verifiedCount: planIds.length
      });
    }
  } catch (error) {
    next(error);
  }
};

// Reset Verification Lesson Plans (Khusus Direktur & Super Admin dengan PIN 1859)
export const resetVerificationLessonPlans = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pin, target = 'both', lembaga_id, kelas_id, pegawai_id, lesson_plan_ids } = req.body;

    if (String(pin).trim() !== '1859') {
      res.status(400).json({ error: 'PIN konfirmasi salah! Reset verifikasi dibatalkan.' });
      return;
    }

    const userRoles = req.user?.roles || [];
    const hasAuthority = userRoles.includes('Direktur') || userRoles.includes('Super Admin');
    if (req.user && !hasAuthority) {
      res.status(403).json({ error: 'Akses ditolak. Hanya Direktur atau Super Admin yang berwenang.' });
      return;
    }

    const planWhere: any = {};
    if (lesson_plan_ids && Array.isArray(lesson_plan_ids) && lesson_plan_ids.length > 0) {
      planWhere.lesson_plan_id = { in: lesson_plan_ids.map(Number) };
    }
    if (pegawai_id && Number(pegawai_id) > 0) {
      planWhere.pegawai_id = Number(pegawai_id);
    }
    if (kelas_id && Number(kelas_id) > 0) {
      planWhere.jadwal = {
        ...planWhere.jadwal,
        kelas_id: Number(kelas_id)
      };
    }
    if (lembaga_id && Number(lembaga_id) > 0) {
      planWhere.jadwal = {
        ...planWhere.jadwal,
        kelas: { lembaga_id: Number(lembaga_id) }
      };
    }

    const plans = await prisma.lessonPlan.findMany({
      where: planWhere,
      select: { lesson_plan_id: true }
    });
    const planIds = plans.map(p => p.lesson_plan_id);

    if (planIds.length === 0) {
      res.json({ success: true, message: 'Tidak ada Lesson Plan yang cocok untuk direset.', resetCount: 0 });
      return;
    }

    const updateDetailData: any = {};
    const updatePlanData: any = {};

    if (target === 'direktur' || target === 'both') {
      updateDetailData.status_verifikasi_direktur = 'Menunggu Verifikasi';
      updateDetailData.catatan_revisi_direktur = '';
      updateDetailData.verified_by_direktur = null;

      updatePlanData.status_verifikasi_direktur = 'Menunggu Verifikasi';
      updatePlanData.catatan_revisi_direktur = '';
      updatePlanData.verified_by_direktur = null;
    }

    if (target === 'kepsek' || target === 'both') {
      updateDetailData.status_verifikasi_kepsek = 'Menunggu Verifikasi';
      updateDetailData.catatan_revisi_kepsek = '';
      updateDetailData.verified_by_kepsek = null;

      updatePlanData.status_verifikasi_kepsek = 'Menunggu Verifikasi';
      updatePlanData.catatan_revisi_kepsek = '';
      updatePlanData.verified_by_kepsek = null;
    }

    await prisma.lessonPlanDetail.updateMany({
      where: { lesson_plan_id: { in: planIds } },
      data: updateDetailData
    });

    await prisma.lessonPlan.updateMany({
      where: { lesson_plan_id: { in: planIds } },
      data: updatePlanData
    });

    const targetLabel = target === 'both' ? 'Kepala Sekolah dan Direktur' : target === 'direktur' ? 'Direktur' : 'Kepala Sekolah';

    res.json({
      success: true,
      message: `Status verifikasi ${planIds.length} Lesson Plan berhasil direset ke 'Menunggu Verifikasi' (${targetLabel}).`,
      resetCount: planIds.length
    });
  } catch (error) {
    next(error);
  }
};

// Reset Absensi (Khusus Direktur & Super Admin dengan PIN 1859)
export const resetAbsensi = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pin, type, lembaga_id, kelas_id, mapel_id, pertemuan_ke, tanggal, tanggal_mulai, tanggal_akhir } = req.body;

    // 1. Validasi PIN konfirmasi (1859)
    if (String(pin).trim() !== '1859') {
      res.status(400).json({ error: 'PIN konfirmasi salah! Reset absensi dibatalkan.' });
      return;
    }

    // 2. Validasi role (hanya Direktur atau Super Admin)
    const userRoles = req.user?.roles || [];
    const hasAuthority = userRoles.includes('Direktur') || userRoles.includes('Super Admin');
    if (req.user && !hasAuthority) {
      res.status(403).json({ error: 'Akses ditolak. Hanya Direktur atau Super Admin yang berwenang melakukan reset absensi.' });
      return;
    }

    let deletedJurnalCount = 0;
    let deletedAbsensiPelajaranCount = 0;
    let deletedAbsensiHarianCount = 0;

    const resetMapel = type === 'mapel' || type === 'all' || !type;
    const resetHarian = type === 'harian' || type === 'all' || !type;

    // Reset Absensi Mapel & Jurnal Mengajar
    if (resetMapel) {
      const jurnalWhere: any = {};
      if (pertemuan_ke && Number(pertemuan_ke) > 0) {
        jurnalWhere.pertemuan_ke = Number(pertemuan_ke);
      }
      if (tanggal_mulai && tanggal_akhir) {
        jurnalWhere.tanggal = {
          gte: String(tanggal_mulai),
          lte: String(tanggal_akhir)
        };
      } else if (tanggal) {
        jurnalWhere.tanggal = String(tanggal);
      }

      // Filter jadwal berdasarkan kelas, mapel, lembaga
      const jadwalWhere: any = {};
      if (kelas_id && Number(kelas_id) > 0) {
        jadwalWhere.kelas_id = Number(kelas_id);
      }
      if (mapel_id && Number(mapel_id) > 0) {
        jadwalWhere.mapel_id = Number(mapel_id);
      }
      if (lembaga_id && Number(lembaga_id) > 0) {
        jadwalWhere.kelas = {
          lembaga_id: Number(lembaga_id)
        };
      }

      if (Object.keys(jadwalWhere).length > 0) {
        jurnalWhere.jadwal = jadwalWhere;
      }

      // Cari ID jurnal yang cocok
      const matchedJurnals = await prisma.jurnalMengajar.findMany({
        where: jurnalWhere,
        select: { jurnal_id: true }
      });

      const jurnalIds = matchedJurnals.map((j: any) => j.jurnal_id);

      if (jurnalIds.length > 0) {
        const absensiPelRes = await prisma.absensiPelajaran.deleteMany({
          where: { jurnal_id: { in: jurnalIds } }
        });
        deletedAbsensiPelajaranCount += absensiPelRes.count;

        const jurnalRes = await prisma.jurnalMengajar.deleteMany({
          where: { jurnal_id: { in: jurnalIds } }
        });
        deletedJurnalCount += jurnalRes.count;
      }

      // Jika mereset tanpa filter pertemuan khusus dan tanpa filter tanggal, pastikan tidak ada absensi pelajaran tersisa yang cocok
      if (!pertemuan_ke && !tanggal && !tanggal_mulai) {
        if (kelas_id && mapel_id) {
          const extraAbs = await prisma.absensiPelajaran.deleteMany({
            where: {
              siswa: { kelas_id: Number(kelas_id) },
              jurnal: { jadwal: { mapel_id: Number(mapel_id) } }
            }
          });
          deletedAbsensiPelajaranCount += extraAbs.count;
        } else if (kelas_id) {
          const extraAbs = await prisma.absensiPelajaran.deleteMany({
            where: {
              siswa: { kelas_id: Number(kelas_id) }
            }
          });
          deletedAbsensiPelajaranCount += extraAbs.count;
        } else if (mapel_id) {
          const extraAbs = await prisma.absensiPelajaran.deleteMany({
            where: {
              jurnal: { jadwal: { mapel_id: Number(mapel_id) } }
            }
          });
          deletedAbsensiPelajaranCount += extraAbs.count;
        } else if (lembaga_id) {
          const extraAbs = await prisma.absensiPelajaran.deleteMany({
            where: {
              siswa: { kelas: { lembaga_id: Number(lembaga_id) } }
            }
          });
          deletedAbsensiPelajaranCount += extraAbs.count;
        } else {
          // Reset ALL Mapel
          const allAbsPel = await prisma.absensiPelajaran.deleteMany({});
          deletedAbsensiPelajaranCount += allAbsPel.count;
          const allJurnal = await prisma.jurnalMengajar.deleteMany({});
          deletedJurnalCount += allJurnal.count;
        }
      }
    }

    // Reset Absensi Harian
    if (resetHarian) {
      const harianWhere: any = {};
      if (tanggal_mulai && tanggal_akhir) {
        harianWhere.tanggal = {
          gte: String(tanggal_mulai),
          lte: String(tanggal_akhir)
        };
      } else if (tanggal) {
        harianWhere.tanggal = String(tanggal);
      }

      const siswaWhere: any = {};
      if (kelas_id && Number(kelas_id) > 0) {
        siswaWhere.kelas_id = Number(kelas_id);
      }
      if (lembaga_id && Number(lembaga_id) > 0) {
        siswaWhere.kelas = {
          lembaga_id: Number(lembaga_id)
        };
      }

      if (Object.keys(siswaWhere).length > 0) {
        harianWhere.siswa = siswaWhere;
      }

      const harianRes = await prisma.absensiHarian.deleteMany({
        where: harianWhere
      });
      deletedAbsensiHarianCount = harianRes.count;
    }

    res.json({
      success: true,
      message: `Reset absensi berhasil dilakukan. Data yang dihapus: ${deletedJurnalCount} sesi jurnal mapel (${deletedAbsensiPelajaranCount} data absensi siswa) dan ${deletedAbsensiHarianCount} data absensi harian. Seluruh rekap telah kembali ke 0.`,
      deletedJurnalCount,
      deletedAbsensiPelajaranCount,
      deletedAbsensiHarianCount
    });
  } catch (error) {
    next(error);
  }
};

// Monitoring Jurnal Mengajar Terpadu (Direktur, Wali Kelas, Guru, dll.)
export const jurnalMengajarMonitoring = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      p_tanggal_mulai,
      p_tanggal_akhir,
      p_lembaga_id,
      p_kelas_id,
      p_status_filter,
      p_search,
      p_role,
      p_pegawai_id
    } = req.body;

    const userRoles = req.user?.roles || [];
    const isDirectorOrAdmin = p_role ? (p_role === 'Direktur' || p_role === 'Super Admin') : (userRoles.includes('Direktur') || userRoles.includes('Super Admin'));
    const isWaliKelas = p_role ? (p_role === 'Wali Kelas') : userRoles.includes('Wali Kelas');
    const isGuruOnly = p_role ? (p_role === 'Guru') : (userRoles.includes('Guru') && !isDirectorOrAdmin && !isWaliKelas);

    // Ambil pegawai_id user
    let pegawaiId: number | null = p_pegawai_id ? Number(p_pegawai_id) : null;
    if (!pegawaiId && req.user?.user_id) {
      const userObj = await prisma.user.findUnique({
        where: { user_id: req.user.user_id },
        select: { pegawai: { select: { pegawai_id: true } } }
      });
      pegawaiId = userObj?.pegawai?.[0]?.pegawai_id || null;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const startDate = p_tanggal_mulai || todayStr;
    const endDate = p_tanggal_akhir || todayStr;

    // 1. Tentukan filter Jadwal Pelajaran berdasarkan role
    const jadwalWhere: any = {};

    if (p_kelas_id && Number(p_kelas_id) > 0) {
      jadwalWhere.kelas_id = Number(p_kelas_id);
    } else if (p_lembaga_id && Number(p_lembaga_id) > 0) {
      jadwalWhere.kelas = { lembaga_id: Number(p_lembaga_id) };
    }

    if (isGuruOnly && pegawaiId) {
      jadwalWhere.pegawai_id = pegawaiId;
    } else if (isWaliKelas && pegawaiId) {
      // Cari kelas yang diampu oleh Wali Kelas ini
      const kelasWali = await prisma.kelas.findMany({
        where: { wali_kelas_id: pegawaiId },
        select: { kelas_id: true }
      });
      const kelasIds = kelasWali.map(k => k.kelas_id);
      if (kelasIds.length > 0) {
        if (!jadwalWhere.kelas_id) {
          jadwalWhere.kelas_id = { in: kelasIds };
        }
      }
    }

    // Ambil seluruh jadwal pelajaran aktif
    const activeJadwals = await prisma.jadwalPelajaran.findMany({
      where: jadwalWhere,
      include: {
        kelas: true,
        mapel: true,
        pegawai: true,
        jam_mulai: true,
        jam_selesai: true
      },
      orderBy: [
        { kelas: { nama_kelas: 'asc' } },
        { jam_mulai: { urutan_jam: 'asc' } }
      ]
    });

    const activeJadwalIds = activeJadwals.map(j => j.jadwal_id);

    // 2. Ambil seluruh Jurnal Mengajar yang sudah dibuat pada rentang tanggal
    const jurnals = await prisma.jurnalMengajar.findMany({
      where: {
        tanggal: {
          gte: startDate,
          lte: endDate
        },
        jadwal_id: { in: activeJadwalIds }
      },
      include: {
        jadwal: {
          include: {
            kelas: true,
            mapel: true,
            pegawai: true,
            jam_mulai: true
          }
        },
        lesson_plan_detail: true,
        absensi_pelajaran: {
          select: {
            absensi_pel_id: true,
            status: true,
            siswa_id: true
          }
        }
      },
      orderBy: { tanggal: 'desc' }
    });

    // Map jurnal existing berdasarkan `jadwal_id_tanggal`
    const completedJurnalMap = new Map<string, any>();
    jurnals.forEach(j => {
      const key = `${j.jadwal_id}_${j.tanggal}`;
      completedJurnalMap.set(key, j);
    });

    const dayNames = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    // Generate list tanggal dalam rentang startDate .. endDate
    const dateList: string[] = [];
    let curr = new Date(startDate);
    const end = new Date(endDate);
    while (curr <= end) {
      dateList.push(curr.toISOString().slice(0, 10));
      curr.setDate(curr.getDate() + 1);
    }

    const items: any[] = [];

    // Kumpulkan sesi KBM dari tanggal yang dipilih dan jadwal yang sesuai
    dateList.forEach(tgl => {
      const dayOfWeek = dayNames[new Date(tgl).getDay()];

      activeJadwals.forEach(j => {
        // Cek apakah jadwal ini jatuh pada hari tersebut
        if (j.hari !== dayOfWeek) return;

        const key = `${j.jadwal_id}_${tgl}`;
        const existingJurnal = completedJurnalMap.get(key);

        if (existingJurnal) {
          // Hitung status_kbm berdasarkan perbandingan tanggal jurnal vs rencana_pelaksanaan_kbm
          const rencanaStr = existingJurnal.lesson_plan_detail?.rencana_pelaksanaan_kbm || null;
          let status_kbm = "Sesuai Target";
          if (rencanaStr) {
            // Ambil tanggal pertama jika formatnya range (misal "2026-09-01 - 2026-09-07")
            const rencanaDate = rencanaStr.split(' ')[0].trim();
            const tglJurnal = tgl; // format YYYY-MM-DD
            if (tglJurnal < rencanaDate) {
              status_kbm = "Terlalu Cepat";
            } else if (tglJurnal > rencanaDate) {
              status_kbm = "Terlambat";
            } else {
              status_kbm = "Sesuai Target";
            }
          }

          // Status: Sudah Mengajar & Mengisi Absensi
          const hadir = existingJurnal.absensi_pelajaran.filter((a: any) => a.status === 'Hadir').length;
          const totalSiswa = existingJurnal.absensi_pelajaran.length;

          items.push({
            jurnal_id: existingJurnal.jurnal_id,
            jadwal_id: j.jadwal_id,
            tanggal: tgl,
            hari: j.hari,
            pertemuan_ke: existingJurnal.pertemuan_ke || 1,
            status: status_kbm,
            is_completed: true,
            is_danger: false,
            kelas: j.kelas?.nama_kelas || "Kelas Tidak Diketahui",
            kelas_id: j.kelas_id,
            lembaga_id: j.kelas?.lembaga_id,
            mapel: j.mapel?.nama_mapel || "Mata Pelajaran",
            mapel_id: j.mapel_id,
            guru: j.pegawai?.nama || "Guru Pengampu",
            pegawai_id: j.pegawai_id,
            jam_label: j.jam_mulai ? `Jam ${j.jam_mulai.urutan_jam}` : "-",
            materi: existingJurnal.lesson_plan_detail?.materi || "Materi Pembelajaran",
            topik: existingJurnal.lesson_plan_detail?.topik_materi || "",
            catatan: existingJurnal.catatan_tambahan || "",
            total_hadir: hadir,
            total_siswa: totalSiswa
          });
        } else {
          // Jika role Guru: skip card merah (belum mengajar)
          if (isGuruOnly) return;

          // Status: Belum Mengajar & Belum Mengisi Absensi (Card Merah untuk Direktur & Wali Kelas)
          items.push({
            jurnal_id: null,
            jadwal_id: j.jadwal_id,
            tanggal: tgl,
            hari: j.hari,
            pertemuan_ke: null,
            status: "Belum Absensi",
            is_completed: false,
            is_danger: true,
            kelas: j.kelas?.nama_kelas || "Kelas Tidak Diketahui",
            kelas_id: j.kelas_id,
            lembaga_id: j.kelas?.lembaga_id,
            mapel: j.mapel?.nama_mapel || "Mata Pelajaran",
            mapel_id: j.mapel_id,
            guru: j.pegawai?.nama || "Guru Pengampu",
            pegawai_id: j.pegawai_id,
            jam_label: j.jam_mulai ? `Jam ${j.jam_mulai.urutan_jam}` : "-",
            materi: "Belum diisi",
            topik: "",
            catatan: "Guru belum mengisi jurnal mengajar & absensi kelas ini.",
            total_hadir: 0,
            total_siswa: 0
          });
        }
      });
    });

    // Tambahkan jurnal yang mungkin tanggalnya tidak pas nama hari jadwal (misal kelas pengganti)
    jurnals.forEach(j => {
      const key = `${j.jadwal_id}_${j.tanggal}`;
      const alreadyInList = items.some(it => it.jurnal_id === j.jurnal_id);
      if (!alreadyInList) {
        if (isGuruOnly && pegawaiId && j.jadwal?.pegawai_id !== pegawaiId) return;
        const hadir = j.absensi_pelajaran.filter((a: any) => a.status === 'Hadir').length;

        // Hitung status_kbm untuk jurnal extra (kelas pengganti)
        const rencanaStr2 = j.lesson_plan_detail?.rencana_pelaksanaan_kbm || null;
        let status_kbm2 = "Sesuai Target";
        if (rencanaStr2) {
          const rencanaDate2 = rencanaStr2.split(' ')[0].trim();
          const tglJurnal2 = j.tanggal;
          if (tglJurnal2 < rencanaDate2) {
            status_kbm2 = "Terlalu Cepat";
          } else if (tglJurnal2 > rencanaDate2) {
            status_kbm2 = "Terlambat";
          }
        }

        items.push({
          jurnal_id: j.jurnal_id,
          jadwal_id: j.jadwal_id,
          tanggal: j.tanggal,
          hari: j.jadwal?.hari || "-",
          pertemuan_ke: j.pertemuan_ke || 1,
          status: status_kbm2,
          is_completed: true,
          is_danger: false,
          kelas: j.jadwal?.kelas?.nama_kelas || "Kelas",
          kelas_id: j.jadwal?.kelas_id,
          lembaga_id: j.jadwal?.kelas?.lembaga_id,
          mapel: j.jadwal?.mapel?.nama_mapel || "Mata Pelajaran",
          mapel_id: j.jadwal?.mapel_id,
          guru: j.jadwal?.pegawai?.nama || "Guru",
          pegawai_id: j.jadwal?.pegawai_id,
          jam_label: j.jadwal?.jam_mulai ? `Jam ${j.jadwal.jam_mulai.urutan_jam}` : "-",
          materi: j.lesson_plan_detail?.materi || "Materi Pembelajaran",
          topik: j.lesson_plan_detail?.topik_materi || "",
          catatan: j.catatan_tambahan || "",
          total_hadir: hadir,
          total_siswa: j.absensi_pelajaran.length
        });
      }
    });

    // Filter Search
    let filteredItems = items;
    if (p_search && String(p_search).trim()) {
      const q = String(p_search).toLowerCase().trim();
      filteredItems = filteredItems.filter(it =>
        (it.kelas && it.kelas.toLowerCase().includes(q)) ||
        (it.mapel && it.mapel.toLowerCase().includes(q)) ||
        (it.guru && it.guru.toLowerCase().includes(q))
      );
    }

    // Filter Status: 'Sudah' | 'Belum' | 'Semua'
    if (p_status_filter === 'Sudah') {
      filteredItems = filteredItems.filter(it => it.is_completed);
    } else if (p_status_filter === 'Belum') {
      filteredItems = filteredItems.filter(it => !it.is_completed);
    }

    // Urutkan: tanggal desc, lalu yang belum absensi (merah) di atas jika pada tanggal yang sama, lalu kelas asc
    filteredItems.sort((a, b) => {
      if (a.tanggal !== b.tanggal) return b.tanggal.localeCompare(a.tanggal);
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      return (a.kelas || '').localeCompare(b.kelas || '');
    });

    const totalSesi = items.length;
    const totalSudahMengajar = items.filter(it => it.is_completed).length;
    const totalBelumMengajar = items.filter(it => !it.is_completed).length;

    res.json({
      data: filteredItems,
      summary: {
        totalSesi,
        totalSudahMengajar,
        totalBelumMengajar,
        persentase: totalSesi > 0 ? Math.round((totalSudahMengajar / totalSesi) * 100) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};


