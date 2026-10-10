// server/src/routes/doaDzikirRoutes.ts
import { Router } from 'express';
import * as doaDzikirController from '../controllers/doaDzikirController';
import { authenticate, requireRoles } from '../middlewares/authMiddleware';

const router = Router();

// Public / Mobile readable routes
router.get('/', doaDzikirController.getDoaDzikirList);
router.get('/categories', doaDzikirController.getDoaDzikirCategories);
router.get('/:id', doaDzikirController.getDoaDzikirById);

// Admin / Direktur write routes
router.post(
  '/',
  authenticate,
  requireRoles(['Super Admin', 'Direktur']),
  doaDzikirController.createDoaDzikir
);

router.put(
  '/:id',
  authenticate,
  requireRoles(['Super Admin', 'Direktur']),
  doaDzikirController.updateDoaDzikir
);

router.delete(
  '/:id',
  authenticate,
  requireRoles(['Super Admin', 'Direktur']),
  doaDzikirController.deleteDoaDzikir
);

export default router;
