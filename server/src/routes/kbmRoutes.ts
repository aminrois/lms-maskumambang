import { Router } from 'express';
import * as kbmController from '../controllers/kbmController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Lesson Plan (RPP)
router.get('/lesson-plan', authenticate, kbmController.getLessonPlans);
router.get('/lesson-plan/:id', authenticate, kbmController.getLessonPlanById);
router.post('/lesson-plan', authenticate, kbmController.createLessonPlan);
router.patch('/lesson-plan/:id', authenticate, kbmController.updateLessonPlan);
router.delete('/lesson-plan/:id', authenticate, kbmController.deleteLessonPlan);

// Lesson Plan Detail
router.get('/lesson-plan-detail', authenticate, kbmController.getLessonPlanDetails);
router.post('/lesson-plan-detail', authenticate, kbmController.createLessonPlanDetail);
router.patch('/lesson-plan-detail/:id', authenticate, kbmController.updateLessonPlanDetail);
router.delete('/lesson-plan-detail/:id', authenticate, kbmController.deleteLessonPlanDetail);

// Jurnal Mengajar
router.get('/jurnal-mengajar', authenticate, kbmController.getJurnalMengajars);
router.get('/jurnal-mengajar/:id', authenticate, kbmController.getJurnalMengajarById);
router.post('/jurnal-mengajar', authenticate, kbmController.createJurnalMengajar);
router.patch('/jurnal-mengajar/:id', authenticate, kbmController.updateJurnalMengajar);
router.delete('/jurnal-mengajar/:id', authenticate, kbmController.deleteJurnalMengajar);

// Absensi Pelajaran
router.get('/absensi-pelajaran', authenticate, kbmController.getAbsensiPelajarans);
router.post('/absensi-pelajaran', authenticate, kbmController.createAbsensiPelajaran);
router.patch('/absensi-pelajaran/:id', authenticate, kbmController.updateAbsensiPelajaran);

// Absensi Harian
router.get('/absensi-harian', authenticate, kbmController.getAbsensiHarians);
router.post('/absensi-harian', authenticate, kbmController.createAbsensiHarian);
router.patch('/absensi-harian/:id', authenticate, kbmController.updateAbsensiHarian);

// Activity Plan
router.get('/activity-plan', authenticate, kbmController.getActivityPlans);
router.post('/activity-plan', authenticate, kbmController.createActivityPlan);
router.patch('/activity-plan/:id', authenticate, kbmController.updateActivityPlan);
router.delete('/activity-plan/:id', authenticate, kbmController.deleteActivityPlan);

export default router;
