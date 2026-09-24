import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import * as keuanganController from '../controllers/keuanganController';

const router = Router();

// Master Pos, Tarif, & Rekening
router.get('/master', authenticate, keuanganController.getMasterPosKeuangan);
router.post('/pos', authenticate, keuanganController.createPosPembayaran);
router.post('/tarif', authenticate, keuanganController.createTarifPembayaran);
router.post('/rekening', authenticate, keuanganController.createRekeningPesantren);

// Tagihan Siswa
router.get('/tagihan', authenticate, keuanganController.getTagihanSiswaList);
router.post('/tagihan/manual', authenticate, keuanganController.createTagihanManual);
router.post('/tagihan/generate-spp', authenticate, keuanganController.generateTagihanSppMassal);

// Transaksi Pembayaran
router.post('/bayar-loket', authenticate, keuanganController.bayarLoketKasir);
router.post('/ajukan-transfer', authenticate, keuanganController.ajukanPembayaranTransfer);
router.patch('/transaksi/:transaksi_id/verifikasi', authenticate, keuanganController.verifikasiPembayaranTransfer);
router.get('/riwayat', authenticate, keuanganController.getRiwayatTransaksi);
router.get('/kuitansi/:transaksi_id', authenticate, keuanganController.getKuitansiDetail);
router.get('/summary', authenticate, keuanganController.getDashboardSummaryKeuangan);

// Endpoint Khusus Wali Santri (Mobile & Web)
router.get('/wali-santri', authenticate, keuanganController.getKeuanganWaliSantri);

export default router;
