import { Router } from 'express';
import { authenticate, requireRoles } from '../middlewares/authMiddleware';
import * as keuanganController from '../controllers/keuanganController';

const router = Router();

// Master Pos, Tarif, & Rekening
router.get('/master', authenticate, keuanganController.getMasterPosKeuangan);
router.post('/pos', authenticate, keuanganController.createPosPembayaran);
router.put('/pos/:pos_id', authenticate, keuanganController.updatePosPembayaran);
router.delete('/pos/:pos_id', authenticate, keuanganController.deletePosPembayaran);
router.post('/tarif', authenticate, keuanganController.createTarifPembayaran);
router.post('/tarif/copy', authenticate, keuanganController.copyTarifPos);
router.put('/tarif/:tarif_id', authenticate, keuanganController.updateTarifPembayaran);
router.delete('/tarif/:tarif_id', authenticate, keuanganController.deleteTarifPembayaran);
router.post('/rekening', authenticate, keuanganController.createRekeningPesantren);
router.delete('/rekening/:rekening_id', authenticate, keuanganController.deleteRekeningPesantren);

// Sub-Komponen Pos Pembayaran
router.post('/pos/:pos_id/sub', authenticate, keuanganController.createPosSubKomponen);
router.put('/sub/:sub_id', authenticate, keuanganController.updatePosSubKomponen);
router.delete('/sub/:sub_id', authenticate, keuanganController.deletePosSubKomponen);

// Master Kategori Diskon / Keringanan
router.get('/diskon', authenticate, keuanganController.getKategoriDiskonList);
router.post('/diskon', authenticate, keuanganController.createKategoriDiskon);
router.put('/diskon/:diskon_id', authenticate, keuanganController.updateKategoriDiskon);
router.delete('/diskon/:diskon_id', authenticate, keuanganController.deleteKategoriDiskon);

// Siswa Diskon (Mapping Keringanan)
router.get('/siswa-diskon', authenticate, keuanganController.getSiswaDiskonList);
router.post('/siswa-diskon', authenticate, keuanganController.assignSiswaDiskon);
router.delete('/siswa-diskon/:id', authenticate, keuanganController.removeSiswaDiskon);

// Tagihan Siswa
router.get('/tagihan', authenticate, keuanganController.getTagihanSiswaList);
router.post('/tagihan/manual', authenticate, keuanganController.createTagihanManual);
router.post('/tagihan/set-kuota', authenticate, keuanganController.setTagihanKuota);
router.post('/tagihan/generate-spp', authenticate, keuanganController.generateTagihanSppMassal);

// Transaksi Pembayaran
router.post('/bayar-loket', authenticate, keuanganController.bayarLoketKasir);
router.post('/ajukan-transfer', authenticate, keuanganController.ajukanPembayaranTransfer);
router.patch('/transaksi/:transaksi_id/verifikasi', authenticate, keuanganController.verifikasiPembayaranTransfer);
router.get('/riwayat', authenticate, keuanganController.getRiwayatTransaksi);
router.get('/kuitansi/:transaksi_id', authenticate, keuanganController.getKuitansiDetail);
router.get(
  '/summary',
  authenticate,
  requireRoles(['Super Admin', 'Direktur', 'Admin Lembaga', 'Kepala Sekolah', 'Bendahara']),
  keuanganController.getDashboardSummaryKeuangan
);

// Endpoint Khusus Wali Santri (Mobile & Web)
router.get('/wali-santri', authenticate, keuanganController.getKeuanganWaliSantri);

export default router;
