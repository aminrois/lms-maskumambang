// server/src/routes/waliRoutes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import * as waliController from '../controllers/waliController';

const router = Router();

router.use(authenticate);

// Ambil daftar anak dari wali yang login
router.get('/anak', waliController.getDaftarAnak);

// Ambil detail perkembangan anak
router.get('/anak/:siswa_id/perkembangan', waliController.getPerkembanganAnak);

export default router;
