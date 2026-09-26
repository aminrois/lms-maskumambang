import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import * as guidanceController from '../controllers/guidanceController';

const router = Router();

// Guidance Detail Santri 360°
router.get('/siswa', authenticate, guidanceController.getGuidanceSiswaList);
router.get('/siswa/:siswa_id', authenticate, guidanceController.getGuidanceDetailBySiswaId);
router.put('/siswa/:siswa_id', authenticate, guidanceController.upsertGuidanceDetail);
router.patch('/siswa/:siswa_id/foto', authenticate, guidanceController.updateFotoSiswa);

// Sesi Konsultasi / Konseling
router.get('/konseling', authenticate, guidanceController.getKonselingSesiList);
router.post('/konseling', authenticate, guidanceController.createKonselingSesi);
router.put('/konseling/:konseling_id', authenticate, guidanceController.updateKonselingSesi);
router.patch('/konseling/:konseling_id', authenticate, guidanceController.updateKonselingSesi);
router.delete('/konseling/:konseling_id', authenticate, guidanceController.deleteKonselingSesi);

export default router;
