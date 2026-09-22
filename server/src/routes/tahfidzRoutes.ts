// server/src/routes/tahfidzRoutes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import * as tahfidzController from '../controllers/tahfidzController';

const router = Router();

// Semua rute tahfidz membutuhkan otentikasi login
router.use(authenticate);

// 1. Penugasan Guru Tahfidz (Direktur / Superadmin)
router.get('/pengampu', tahfidzController.getPengampu);
router.post('/pengampu', tahfidzController.assignPengampu);
router.post('/pengampu/multi', tahfidzController.assignMultiKelas);
router.patch('/pengampu/:id', tahfidzController.updatePengampu);
router.delete('/pengampu/:id', tahfidzController.deletePengampu);

// 1B. Kelola Data Guru Tahfidz (Direktur)
router.get('/guru', tahfidzController.getGuruTahfidzList);
router.post('/guru', tahfidzController.createGuruTahfidz);
router.patch('/guru/:id', tahfidzController.updateGuruTahfidz);
router.delete('/guru/:id', tahfidzController.deleteGuruTahfidz);

// 2. Santri Binaan Guru Tahfidz
router.get('/santri', tahfidzController.getSantriTahfidz);

// 3. Target Hafalan
router.get('/target/:siswa_id', tahfidzController.getTargetsBySiswa);
router.post('/target', tahfidzController.createTarget);
router.patch('/target/:id', tahfidzController.updateTarget);
router.delete('/target/:id', tahfidzController.deleteTarget);

// 4. Setoran Hafalan
router.get('/setoran', tahfidzController.getSetoranList);
router.post('/setoran', tahfidzController.createSetoran);
router.delete('/setoran/:id', tahfidzController.deleteSetoran);

// 5. Statistik & Progres
router.get('/statistik/dashboard', tahfidzController.getTahfidzDashboardSummary);
router.get('/statistik/siswa/:siswa_id', tahfidzController.getStatistikSiswa);

// 6. Kelompok Halaqoh
router.get('/halaqah', tahfidzController.getHalaqahList);
router.get('/halaqah/:id', tahfidzController.getHalaqahDetail);
router.post('/halaqah', tahfidzController.createHalaqah);
router.post('/halaqah/kolosal', tahfidzController.createKolosalHalaqah);
router.patch('/halaqah/:id', tahfidzController.updateHalaqah);
router.delete('/halaqah/:id', tahfidzController.deleteHalaqah);
router.post('/halaqah/:id/anggota', tahfidzController.addAnggotaHalaqah);
router.delete('/halaqah/:id/anggota/:siswa_id', tahfidzController.removeAnggotaHalaqah);

export default router;
