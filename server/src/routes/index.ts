import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import masterRoutes from './masterRoutes';
import akademikRoutes from './akademikRoutes';
import kbmRoutes from './kbmRoutes';
import tahfidzRoutes from './tahfidzRoutes';
import waliRoutes from './waliRoutes';
import keuanganRoutes from './keuanganRoutes';
import guidanceRoutes from './guidanceRoutes';
import rpcRoutes from './rpcRoutes';
import tableRoutes from './tableRoutes';
import { authenticate } from '../middlewares/authMiddleware';
import * as userController from '../controllers/userController';

const router = Router();

// Sub-routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/master', masterRoutes);
router.use('/akademik', akademikRoutes);
router.use('/kbm', kbmRoutes);
router.use('/tahfidz', tahfidzRoutes);
router.use('/wali', waliRoutes);
router.use('/keuangan', keuanganRoutes);
router.use('/guidance', guidanceRoutes);
router.use('/rpc', rpcRoutes);

// User Auth Management Actions
router.post('/create_user', authenticate, userController.createUserAuth);
router.post('/update_user', authenticate, userController.updateUserAuth);
router.post('/delete_user', authenticate, userController.deleteUserAuth);

// Direct table router (e.g. /lembaga, /pegawai, /siswa, /kelas, /tahun_ajaran, etc.)
router.use('/', tableRoutes);

export default router;
