// server/src/routes/notifikasiRoutes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import * as notifikasiController from '../controllers/notifikasiController';

const router = Router();

// Semua user terautentikasi bisa baca
router.get('/', authenticate, notifikasiController.getAll);

// Admin endpoint (bisa filter oleh middleware role di frontend, kita simplify untuk sekarang)
router.get('/admin', authenticate, notifikasiController.getAdmin);

// CRUD hanya untuk Direktur / Super Admin (enforced di frontend, backend tetap authenticate)
router.post('/', authenticate, notifikasiController.create);
router.put('/:id', authenticate, notifikasiController.update);
router.delete('/:id', authenticate, notifikasiController.remove);

export default router;
