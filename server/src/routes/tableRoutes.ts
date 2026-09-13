import { Router } from 'express';
import * as tableController from '../controllers/tableController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Universal table routes
router.get('/:table', authenticate, tableController.getTableRecords);
router.get('/:table/:id', authenticate, tableController.getTableRecords);
router.post('/:table', authenticate, tableController.createTableRecord);
router.patch('/:table', authenticate, tableController.updateTableRecord);
router.patch('/:table/:id', authenticate, tableController.updateTableRecord);
router.delete('/:table', authenticate, tableController.deleteTableRecord);
router.delete('/:table/:id', authenticate, tableController.deleteTableRecord);

export default router;
