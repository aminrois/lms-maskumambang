import { Router } from 'express';
import * as masterController from '../controllers/masterController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Lembaga
router.get('/lembaga', authenticate, masterController.getLembagas);
router.get('/lembaga/:id', authenticate, masterController.getLembagaById);
router.post('/lembaga', authenticate, masterController.createLembaga);
router.patch('/lembaga/:id', authenticate, masterController.updateLembaga);
router.delete('/lembaga/:id', authenticate, masterController.deleteLembaga);

// Siswa
router.get('/siswa', authenticate, masterController.getSiswas);
router.get('/siswa/:id', authenticate, masterController.getSiswaById);
router.post('/siswa', authenticate, masterController.createSiswa);
router.patch('/siswa/:id', authenticate, masterController.updateSiswa);
router.delete('/siswa/:id', authenticate, masterController.deleteSiswa);

// Pegawai
router.get('/pegawai', authenticate, masterController.getPegawais);
router.get('/pegawai/:id', authenticate, masterController.getPegawaiById);
router.post('/pegawai', authenticate, masterController.createPegawai);
router.patch('/pegawai/:id', authenticate, masterController.updatePegawai);
router.delete('/pegawai/:id', authenticate, masterController.deletePegawai);

// Wali Murid
router.get('/wali-murid', authenticate, masterController.getWaliMurids);
router.get('/wali-murid/:id', authenticate, masterController.getWaliMuridById);
router.post('/wali-murid', authenticate, masterController.createWaliMurid);
router.patch('/wali-murid/:id', authenticate, masterController.updateWaliMurid);
router.delete('/wali-murid/:id', authenticate, masterController.deleteWaliMurid);

export default router;
