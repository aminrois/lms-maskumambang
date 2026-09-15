import { Router } from 'express';
import * as rpcController from '../controllers/rpcController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/verify_lesson_plan_kepsek', authenticate, rpcController.verifyLessonPlanKepsek);
router.post('/verify_lesson_plan_direktur', authenticate, rpcController.verifyLessonPlanDirektur);
router.post('/verify_lesson_plan_detail_kepsek', authenticate, rpcController.verifyLessonPlanDetailKepsek);
router.post('/verify_lesson_plan_detail_direktur', authenticate, rpcController.verifyLessonPlanDetailDirektur);
router.post('/verify_activity_plan', authenticate, rpcController.verifyActivityPlan);
router.post('/monitoring_kbm', authenticate, rpcController.monitoringKbm);
router.post('/absensi_summary', authenticate, rpcController.absensiSummary);
router.post('/absensi_harian_summary', authenticate, rpcController.absensiHarianSummary);
router.post('/reset_absensi', authenticate, rpcController.resetAbsensi);
router.post('/jurnal_mengajar_monitoring', authenticate, rpcController.jurnalMengajarMonitoring);

export default router;

