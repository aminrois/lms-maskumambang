import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Helper generate nomor transaksi
function generateNomorTransaksi() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${dateStr}-${randomSuffix}`;
}

// ═══════════════════════════════════════════════════════
// 1. MASTER POS, TARIF, & REKENING
// ═══════════════════════════════════════════════════════

export async function getMasterPosKeuangan(req: Request, res: Response) {
  try {
    const { lembaga_id } = req.query;
    const where: any = { is_active: true };
    if (lembaga_id) {
      where.OR = [
        { lembaga_id: parseInt(lembaga_id as string, 10) },
        { lembaga_id: null },
      ];
    }

    const posList = await prisma.posPembayaran.findMany({
      where,
      include: {
        tarif: {
          orderBy: { tarif_id: 'asc' },
        },
      },
      orderBy: { pos_id: 'asc' },
    });

    const rekeningList = await prisma.rekeningPesantren.findMany({
      where: { is_active: true },
      orderBy: { rekening_id: 'asc' },
    });

    return res.json({
      success: true,
      data: {
        pos: posList,
        rekening: rekeningList,
      },
    });
  } catch (error: any) {
    console.error('Error in getMasterPosKeuangan:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createPosPembayaran(req: Request, res: Response) {
  try {
    const { nama_pos, kode_pos, tipe_pembayaran, deskripsi, lembaga_id, tahun_id } = req.body;
    if (!nama_pos || !tipe_pembayaran) {
      return res.status(400).json({ success: false, message: 'Nama pos dan tipe pembayaran wajib diisi' });
    }

    const pos = await prisma.posPembayaran.create({
      data: {
        nama_pos,
        kode_pos: kode_pos || nama_pos.substring(0, 8).toUpperCase().replace(/\s/g, ''),
        tipe_pembayaran,
        deskripsi,
        lembaga_id: lembaga_id ? parseInt(lembaga_id, 10) : null,
        tahun_id: tahun_id ? parseInt(tahun_id, 10) : null,
        is_active: true,
      },
    });

    return res.status(201).json({ success: true, data: pos });
  } catch (error: any) {
    console.error('Error in createPosPembayaran:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createTarifPembayaran(req: Request, res: Response) {
  try {
    const { pos_id, nama_tarif, kuota, nominal, kelas_tingkat, keterangan } = req.body;
    if (!pos_id || !nama_tarif || nominal === undefined) {
      return res.status(400).json({ success: false, message: 'Pos, nama tarif, dan nominal wajib diisi' });
    }

    const tarif = await prisma.tarifPembayaran.create({
      data: {
        pos_id: parseInt(pos_id, 10),
        nama_tarif,
        kuota: kuota || null,
        nominal: parseFloat(nominal),
        kelas_tingkat: kelas_tingkat ? parseInt(kelas_tingkat, 10) : null,
        keterangan,
      },
    });

    return res.status(201).json({ success: true, data: tarif });
  } catch (error: any) {
    console.error('Error in createTarifPembayaran:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createRekeningPesantren(req: Request, res: Response) {
  try {
    const { nama_bank, nomor_rekening, atas_nama, cabang, lembaga_id } = req.body;
    if (!nama_bank || !nomor_rekening || !atas_nama) {
      return res.status(400).json({ success: false, message: 'Data rekening belum lengkap' });
    }

    const rekening = await prisma.rekeningPesantren.create({
      data: {
        nama_bank,
        nomor_rekening,
        atas_nama,
        cabang,
        lembaga_id: lembaga_id ? parseInt(lembaga_id, 10) : null,
        is_active: true,
      },
    });

    return res.status(201).json({ success: true, data: rekening });
  } catch (error: any) {
    console.error('Error in createRekeningPesantren:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ═══════════════════════════════════════════════════════
// 2. TAGIHAN SISWA
// ═══════════════════════════════════════════════════════

export async function getTagihanSiswaList(req: Request, res: Response) {
  try {
    const { siswa_id, kelas_id, status, pos_id, search } = req.query;

    const where: any = {};
    if (siswa_id) {
      where.siswa_id = parseInt(siswa_id as string, 10);
    }
    if (status) {
      where.status = status as string;
    }
    if (pos_id) {
      where.pos_id = parseInt(pos_id as string, 10);
    }
    if (kelas_id) {
      where.siswa = {
        ...where.siswa,
        kelas_id: parseInt(kelas_id as string, 10),
      };
    }
    if (search) {
      where.siswa = {
        ...where.siswa,
        OR: [
          { nama: { contains: search as string, mode: 'insensitive' } },
          { nis: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const tagihan = await prisma.tagihanSiswa.findMany({
      where,
      include: {
        siswa: {
          select: {
            siswa_id: true,
            nama: true,
            nis: true,
            kelas: {
              select: {
                kelas_id: true,
                nama_kelas: true,
              },
            },
          },
        },
        pos: true,
      },
      orderBy: [
        { status: 'asc' },
        { tagihan_id: 'desc' },
      ],
    });

    return res.json({ success: true, data: tagihan });
  } catch (error: any) {
    console.error('Error in getTagihanSiswaList:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createTagihanManual(req: Request, res: Response) {
  try {
    const { siswa_id, pos_id, nama_tagihan, nominal_total, jatuh_tempo, keterangan, bulan, tahun_periode } = req.body;
    if (!siswa_id || !pos_id || !nominal_total) {
      return res.status(400).json({ success: false, message: 'Siswa, pos pembayaran, dan nominal wajib diisi' });
    }

    const pos = await prisma.posPembayaran.findUnique({ where: { pos_id: parseInt(pos_id, 10) } });
    if (!pos) {
      return res.status(404).json({ success: false, message: 'Pos pembayaran tidak ditemukan' });
    }

    const total = parseFloat(nominal_total);
    const tagihan = await prisma.tagihanSiswa.create({
      data: {
        siswa_id: parseInt(siswa_id, 10),
        pos_id: parseInt(pos_id, 10),
        nama_tagihan: nama_tagihan || pos.nama_pos,
        nominal_total: total,
        nominal_terbayar: 0,
        sisa_tagihan: total,
        status: 'Belum Bayar',
        jatuh_tempo: jatuh_tempo || null,
        keterangan: keterangan || null,
        bulan: bulan ? parseInt(bulan, 10) : null,
        tahun_periode: tahun_periode ? parseInt(tahun_periode, 10) : null,
      },
    });

    return res.status(201).json({ success: true, data: tagihan });
  } catch (error: any) {
    console.error('Error in createTagihanManual:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Generate Tagihan SPP Massal
export async function generateTagihanSppMassal(req: Request, res: Response) {
  try {
    const { pos_id, kelas_id, bulan, tahun_periode, nominal, jatuh_tempo } = req.body;
    if (!pos_id || !bulan || !tahun_periode || !nominal) {
      return res.status(400).json({ success: false, message: 'Data generate SPP belum lengkap' });
    }

    const namaBulanList = [
      '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const bulanIndex = parseInt(bulan, 10);
    const bulanNama = namaBulanList[bulanIndex] || `Bulan ${bulanIndex}`;
    const namaTagihan = `SPP ${bulanNama} ${tahun_periode}`;

    const whereSiswa: any = { status: 'Aktif' };
    if (kelas_id) {
      whereSiswa.kelas_id = parseInt(kelas_id, 10);
    }

    const students = await prisma.siswa.findMany({
      where: whereSiswa,
      select: { siswa_id: true },
    });

    let createdCount = 0;
    const nominalNum = parseFloat(nominal);

    for (const s of students) {
      const existing = await prisma.tagihanSiswa.findFirst({
        where: {
          siswa_id: s.siswa_id,
          pos_id: parseInt(pos_id, 10),
          bulan: bulanIndex,
          tahun_periode: parseInt(tahun_periode, 10),
        },
      });

      if (!existing) {
        await prisma.tagihanSiswa.create({
          data: {
            siswa_id: s.siswa_id,
            pos_id: parseInt(pos_id, 10),
            bulan: bulanIndex,
            tahun_periode: parseInt(tahun_periode, 10),
            nama_tagihan: namaTagihan,
            nominal_total: nominalNum,
            nominal_terbayar: 0,
            sisa_tagihan: nominalNum,
            status: 'Belum Bayar',
            jatuh_tempo: jatuh_tempo || `${tahun_periode}-${String(bulanIndex).padStart(2, '0')}-10`,
          },
        });
        createdCount++;
      }
    }

    return res.json({
      success: true,
      message: `Berhasil generate ${createdCount} tagihan SPP untuk ${students.length} santri.`,
      createdCount,
    });
  } catch (error: any) {
    console.error('Error in generateTagihanSppMassal:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ═══════════════════════════════════════════════════════
// 3. TRANSAKSI PEMBAYARAN & LOKET KASIR
// ═══════════════════════════════════════════════════════

export async function bayarLoketKasir(req: Request, res: Response) {
  try {
    const { siswa_id, items, tanggal_bayar, catatan } = req.body;
    if (!siswa_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Siswa dan item pembayaran wajib disertakan' });
    }

    const user = (req as any).user;
    const nomorTransaksi = generateNomorTransaksi();
    const tgl = tanggal_bayar || new Date().toISOString().slice(0, 10);

    let totalBayar = 0;
    for (const it of items) {
      totalBayar += parseFloat(it.nominal_bayar || 0);
    }

    if (totalBayar <= 0) {
      return res.status(400).json({ success: false, message: 'Nominal pembayaran harus lebih dari 0' });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const trx = await tx.pembayaranTransaksi.create({
        data: {
          nomor_transaksi: nomorTransaksi,
          siswa_id: parseInt(siswa_id, 10),
          tanggal_bayar: tgl,
          total_bayar: totalBayar,
          metode_pembayaran: 'Tunai / Loket',
          status: 'Disetujui',
          catatan: catatan || 'Pembayaran langsung di loket kasir pesantren',
          diterima_oleh_user_id: user?.user_id || null,
          waktu_verifikasi: new Date(),
        },
      });

      for (const it of items) {
        const tagihanId = parseInt(it.tagihan_id, 10);
        const nominalItem = parseFloat(it.nominal_bayar);

        const currentTagihan = await tx.tagihanSiswa.findUnique({
          where: { tagihan_id: tagihanId },
        });

        if (!currentTagihan) continue;

        await tx.pembayaranTransaksiItem.create({
          data: {
            transaksi_id: trx.transaksi_id,
            tagihan_id: tagihanId,
            nominal_bayar: nominalItem,
          },
        });

        const newTerbayar = currentTagihan.nominal_terbayar + nominalItem;
        const newSisa = Math.max(0, currentTagihan.nominal_total - newTerbayar);
        const newStatus = newSisa <= 0 ? 'Lunas' : (newTerbayar > 0 ? 'Sebagian' : 'Belum Bayar');

        await tx.tagihanSiswa.update({
          where: { tagihan_id: tagihanId },
          data: {
            nominal_terbayar: newTerbayar,
            sisa_tagihan: newSisa,
            status: newStatus,
          },
        });
      }

      return trx;
    });

    return res.status(201).json({
      success: true,
      message: 'Pembayaran loket berhasil diproses.',
      data: result,
    });
  } catch (error: any) {
    console.error('Error in bayarLoketKasir:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function ajukanPembayaranTransfer(req: Request, res: Response) {
  try {
    const {
      siswa_id,
      items,
      rekening_tujuan_id,
      bank_pengirim,
      nomor_rekening_pengirim,
      atas_nama_pengirim,
      bukti_transfer_url,
      catatan,
    } = req.body;

    if (!siswa_id || !Array.isArray(items) || items.length === 0 || !rekening_tujuan_id) {
      return res.status(400).json({ success: false, message: 'Data konfirmasi transfer belum lengkap' });
    }

    const nomorTransaksi = generateNomorTransaksi();
    const tgl = new Date().toISOString().slice(0, 10);

    let totalBayar = 0;
    for (const it of items) {
      totalBayar += parseFloat(it.nominal_bayar || 0);
    }

    const user = (req as any).user;

    let waliId: number | null = null;
    if (user?.user_id) {
      const wali = await prisma.waliMurid.findFirst({ where: { user_id: user.user_id } });
      if (wali) waliId = wali.wali_id;
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const trx = await tx.pembayaranTransaksi.create({
        data: {
          nomor_transaksi: nomorTransaksi,
          siswa_id: parseInt(siswa_id, 10),
          wali_id: waliId,
          tanggal_bayar: tgl,
          total_bayar: totalBayar,
          metode_pembayaran: 'Transfer Bank',
          rekening_tujuan_id: parseInt(rekening_tujuan_id, 10),
          bank_pengirim,
          nomor_rekening_pengirim,
          atas_nama_pengirim,
          bukti_transfer_url,
          status: 'Menunggu Verifikasi',
          catatan: catatan || 'Konfirmasi transfer bank online oleh wali santri',
        },
      });

      for (const it of items) {
        await tx.pembayaranTransaksiItem.create({
          data: {
            transaksi_id: trx.transaksi_id,
            tagihan_id: parseInt(it.tagihan_id, 10),
            nominal_bayar: parseFloat(it.nominal_bayar),
          },
        });
      }

      return trx;
    });

    return res.status(201).json({
      success: true,
      message: 'Konfirmasi pembayaran transfer berhasil dikirim. Menunggu verifikasi bagian keuangan.',
      data: result,
    });
  } catch (error: any) {
    console.error('Error in ajukanPembayaranTransfer:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function verifikasiPembayaranTransfer(req: Request, res: Response) {
  try {
    const transaksi_id = String(req.params.transaksi_id);
    const { status, alasan_penolakan } = req.body;

    if (!['Disetujui', 'Ditolak'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status verifikasi harus Disetujui atau Ditolak' });
    }

    const user = (req as any).user;
    const trxId = parseInt(transaksi_id, 10);

    const existingTrx = await prisma.pembayaranTransaksi.findUnique({
      where: { transaksi_id: trxId },
      include: { items: true },
    });

    if (!existingTrx) {
      return res.status(404).json({ success: false, message: 'Data transaksi tidak ditemukan' });
    }

    if (existingTrx.status !== 'Menunggu Verifikasi') {
      return res.status(400).json({ success: false, message: `Transaksi sudah berstatus ${existingTrx.status}` });
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const trx = await tx.pembayaranTransaksi.update({
        where: { transaksi_id: trxId },
        data: {
          status,
          alasan_penolakan: status === 'Ditolak' ? alasan_penolakan : null,
          diterima_oleh_user_id: user?.user_id || null,
          waktu_verifikasi: new Date(),
        },
      });

      if (status === 'Disetujui') {
        for (const it of existingTrx.items) {
          const currentTagihan = await tx.tagihanSiswa.findUnique({
            where: { tagihan_id: it.tagihan_id },
          });

          if (!currentTagihan) continue;

          const newTerbayar = currentTagihan.nominal_terbayar + it.nominal_bayar;
          const newSisa = Math.max(0, currentTagihan.nominal_total - newTerbayar);
          const newStatus = newSisa <= 0 ? 'Lunas' : (newTerbayar > 0 ? 'Sebagian' : 'Belum Bayar');

          await tx.tagihanSiswa.update({
            where: { tagihan_id: it.tagihan_id },
            data: {
              nominal_terbayar: newTerbayar,
              sisa_tagihan: newSisa,
              status: newStatus,
            },
          });
        }
      }

      return trx;
    });

    return res.json({
      success: true,
      message: `Transaksi berhasil di-${status.toLowerCase()}`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error in verifikasiPembayaranTransfer:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ═══════════════════════════════════════════════════════
// 4. RIWAYAT, KUITANSI & SUMMARY KEUANGAN
// ═══════════════════════════════════════════════════════

export async function getRiwayatTransaksi(req: Request, res: Response) {
  try {
    const { siswa_id, status, metode, search, limit = 50 } = req.query;

    const where: any = {};
    if (siswa_id) {
      where.siswa_id = parseInt(siswa_id as string, 10);
    }
    if (status) {
      where.status = status as string;
    }
    if (metode) {
      where.metode_pembayaran = metode as string;
    }
    if (search) {
      where.OR = [
        { nomor_transaksi: { contains: search as string, mode: 'insensitive' } },
        { siswa: { nama: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const transaksi = await prisma.pembayaranTransaksi.findMany({
      where,
      include: {
        siswa: {
          select: {
            siswa_id: true,
            nama: true,
            nis: true,
            kelas: { select: { nama_kelas: true } },
          },
        },
        rekening_tujuan: true,
        items: {
          include: {
            tagihan: {
              include: { pos: true },
            },
          },
        },
      },
      orderBy: { transaksi_id: 'desc' },
      take: parseInt(limit as string, 10),
    });

    return res.json({ success: true, data: transaksi });
  } catch (error: any) {
    console.error('Error in getRiwayatTransaksi:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getKuitansiDetail(req: Request, res: Response) {
  try {
    const transaksi_id = String(req.params.transaksi_id);
    const trx = await prisma.pembayaranTransaksi.findUnique({
      where: { transaksi_id: parseInt(transaksi_id, 10) },
      include: {
        siswa: {
          include: {
            kelas: true,
            wali_murid: true,
          },
        },
        rekening_tujuan: true,
        items: {
          include: {
            tagihan: {
              include: { pos: true },
            },
          },
        },
      },
    });

    if (!trx) {
      return res.status(404).json({ success: false, message: 'Kuitansi tidak ditemukan' });
    }

    return res.json({ success: true, data: trx });
  } catch (error: any) {
    console.error('Error in getKuitansiDetail:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getDashboardSummaryKeuangan(req: Request, res: Response) {
  try {
    const sumPenerimaan = await prisma.pembayaranTransaksi.aggregate({
      where: { status: 'Disetujui' },
      _sum: { total_bayar: true },
    });

    const sumTunggakan = await prisma.tagihanSiswa.aggregate({
      where: { status: { in: ['Belum Bayar', 'Sebagian'] } },
      _sum: { sisa_tagihan: true },
    });

    const countPending = await prisma.pembayaranTransaksi.count({
      where: { status: 'Menunggu Verifikasi' },
    });

    const today = new Date().toISOString().slice(0, 10);
    const sumToday = await prisma.pembayaranTransaksi.aggregate({
      where: { status: 'Disetujui', tanggal_bayar: today },
      _sum: { total_bayar: true },
    });

    const posList = await prisma.posPembayaran.findMany({
      include: {
        tagihan: {
          select: {
            nominal_total: true,
            nominal_terbayar: true,
            sisa_tagihan: true,
            status: true,
          },
        },
      },
    });

    const breakdownPos = posList.map((p: any) => {
      const totalNominal = p.tagihan.reduce((acc: number, t: any) => acc + t.nominal_total, 0);
      const terbayar = p.tagihan.reduce((acc: number, t: any) => acc + t.nominal_terbayar, 0);
      const sisa = p.tagihan.reduce((acc: number, t: any) => acc + t.sisa_tagihan, 0);
      return {
        pos_id: p.pos_id,
        nama_pos: p.nama_pos,
        kode_pos: p.kode_pos,
        tipe_pembayaran: p.tipe_pembayaran,
        total_tagihan: totalNominal,
        total_terbayar: terbayar,
        total_sisa: sisa,
        count_tagihan: p.tagihan.length,
      };
    });

    return res.json({
      success: true,
      data: {
        total_penerimaan: sumPenerimaan._sum.total_bayar || 0,
        total_tunggakan: sumTunggakan._sum.sisa_tagihan || 0,
        penerimaan_hari_ini: sumToday._sum.total_bayar || 0,
        transaksi_menunggu_verifikasi: countPending,
        breakdown_pos: breakdownPos,
      },
    });
  } catch (error: any) {
    console.error('Error in getDashboardSummaryKeuangan:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ═══════════════════════════════════════════════════════
// 5. KHUSUS WALI SANTRI (MOBILE & WEB WALI)
// ═══════════════════════════════════════════════════════

export async function getKeuanganWaliSantri(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    let siswaList: any[] = [];

    if (user?.user_id) {
      const wali = await prisma.waliMurid.findFirst({
        where: { user_id: user.user_id },
        include: {
          siswa: {
            include: {
              kelas: true,
            },
          },
        },
      });

      if (wali && wali.siswa.length > 0) {
        siswaList = wali.siswa;
      }
    }

    if (siswaList.length === 0) {
      const targetSiswaId = req.query.siswa_id ? parseInt(req.query.siswa_id as string, 10) : null;
      if (targetSiswaId) {
        const s = await prisma.siswa.findUnique({
          where: { siswa_id: targetSiswaId },
          include: { kelas: true },
        });
        if (s) siswaList = [s];
      } else {
        const defaultS = await prisma.siswa.findFirst({
          include: { kelas: true },
          orderBy: { siswa_id: 'asc' },
        });
        if (defaultS) siswaList = [defaultS];
      }
    }

    const selectedSiswaId = req.query.siswa_id 
      ? parseInt(req.query.siswa_id as string, 10) 
      : (siswaList[0]?.siswa_id || 0);

    const tagihanList = await prisma.tagihanSiswa.findMany({
      where: { siswa_id: selectedSiswaId },
      include: {
        pos: true,
      },
      orderBy: [
        { status: 'asc' },
        { tagihan_id: 'asc' },
      ],
    });

    const tagihanPangkal = tagihanList.filter((t: any) => t.pos.kode_pos === 'PANGKAL');
    const tagihanSpp = tagihanList.filter((t: any) => t.pos.kode_pos === 'SPP');
    const tagihanKegiatan = tagihanList.filter((t: any) => t.pos.kode_pos === 'KEGIATAN');
    const tagihanSeragam = tagihanList.filter((t: any) => t.pos.kode_pos === 'SERAGAM');
    const tagihanLainnya = tagihanList.filter(
      (t: any) => !['PANGKAL', 'SPP', 'KEGIATAN', 'SERAGAM'].includes(t.pos.kode_pos || '')
    );

    const riwayatTransaksi = await prisma.pembayaranTransaksi.findMany({
      where: { siswa_id: selectedSiswaId },
      include: {
        rekening_tujuan: true,
        items: {
          include: {
            tagihan: true,
          },
        },
      },
      orderBy: { transaksi_id: 'desc' },
    });

    const rekeningList = await prisma.rekeningPesantren.findMany({
      where: { is_active: true },
    });

    const totalTunggakan = tagihanList.reduce((acc: number, t: any) => acc + t.sisa_tagihan, 0);
    const totalTerbayar = tagihanList.reduce((acc: number, t: any) => acc + t.nominal_terbayar, 0);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const sppBulanIni = tagihanSpp.find(
      (t: any) => t.bulan === currentMonth && t.tahun_periode === currentYear
    ) || tagihanSpp.find((t: any) => t.bulan === 9);

    return res.json({
      success: true,
      data: {
        siswaList: siswaList.map((s: any) => ({
          siswa_id: s.siswa_id,
          nama: s.nama,
          nis: s.nis,
          kelas: s.kelas?.nama_kelas || '-',
        })),
        selectedSiswaId,
        ringkasan: {
          total_tunggakan: totalTunggakan,
          total_terbayar: totalTerbayar,
          status_spp_bulan_ini: sppBulanIni?.status || 'Belum Ada Tagihan',
          spp_bulan_ini: sppBulanIni,
        },
        kategori: {
          uang_pangkal: tagihanPangkal,
          spp: tagihanSpp,
          kegiatan: tagihanKegiatan,
          seragam: tagihanSeragam,
          lainnya: tagihanLainnya,
        },
        riwayat_transaksi: riwayatTransaksi,
        rekening_pesantren: rekeningList,
      },
    });
  } catch (error: any) {
    console.error('Error in getKeuanganWaliSantri:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
