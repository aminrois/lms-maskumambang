import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import masterRoutes from './masterRoutes';
import akademikRoutes from './akademikRoutes';
import kbmRoutes from './kbmRoutes';
import rpcRoutes from './rpcRoutes';
import tableRoutes from './tableRoutes';

const router = Router();

// Sub-routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/master', masterRoutes);
router.use('/akademik', akademikRoutes);
router.use('/kbm', kbmRoutes);
router.use('/rpc', rpcRoutes);

// Direct table router (e.g. /lembaga, /pegawai, /siswa, /kelas, /tahun_ajaran, etc.)
router.use('/', tableRoutes);

export default router;
