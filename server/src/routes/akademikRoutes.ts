import { Router } from 'express';
import * as akademikController from '../controllers/akademikController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Tahun Ajaran
router.get('/tahun-ajaran', authenticate, akademikController.getTahunAjarans);
router.get('/tahun-ajaran/:id', authenticate, akademikController.getTahunAjaranById);
router.post('/tahun-ajaran', authenticate, akademikController.createTahunAjaran);
router.patch('/tahun-ajaran/:id', authenticate, akademikController.updateTahunAjaran);
router.post('/tahun-ajaran/deactivate-all', authenticate, akademikController.deactivateAllTahunAjaran);
router.delete('/tahun-ajaran/:id', authenticate, akademikController.deleteTahunAjaran);

// Kelas
router.get('/kelas', authenticate, akademikController.getKelass);
router.get('/kelas/:id', authenticate, akademikController.getKelasById);
router.post('/kelas', authenticate, akademikController.createKelas);
router.patch('/kelas/:id', authenticate, akademikController.updateKelas);
router.delete('/kelas/:id', authenticate, akademikController.deleteKelas);

// Mata Pelajaran
router.get('/mata-pelajaran', authenticate, akademikController.getMataPelajarans);
router.get('/mata-pelajaran/:id', authenticate, akademikController.getMataPelajaranById);
router.post('/mata-pelajaran', authenticate, akademikController.createMataPelajaran);
router.patch('/mata-pelajaran/:id', authenticate, akademikController.updateMataPelajaran);
router.delete('/mata-pelajaran/:id', authenticate, akademikController.deleteMataPelajaran);

// Jam Akademik
router.get('/jam-akademik', authenticate, akademikController.getJamAkademiks);
router.post('/jam-akademik', authenticate, akademikController.createJamAkademik);
router.patch('/jam-akademik/:id', authenticate, akademikController.updateJamAkademik);
router.delete('/jam-akademik/:id', authenticate, akademikController.deleteJamAkademik);

// Jadwal Pelajaran
router.get('/jadwal-pelajaran', authenticate, akademikController.getJadwalPelajarans);
router.get('/jadwal-pelajaran/:id', authenticate, akademikController.getJadwalPelajaranById);
router.post('/jadwal-pelajaran', authenticate, akademikController.createJadwalPelajaran);
router.patch('/jadwal-pelajaran/:id', authenticate, akademikController.updateJadwalPelajaran);
router.delete('/jadwal-pelajaran/:id', authenticate, akademikController.deleteJadwalPelajaran);

// Kalender Akademik
router.get('/kalender-akademik', authenticate, akademikController.getKalenderAkademiks);
router.post('/kalender-akademik', authenticate, akademikController.createKalenderAkademik);
router.patch('/kalender-akademik/:id', authenticate, akademikController.updateKalenderAkademik);
router.delete('/kalender-akademik/:id', authenticate, akademikController.deleteKalenderAkademik);

export default router;
