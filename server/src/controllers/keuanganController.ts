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
      const lid = parseInt(lembaga_id as string, 10);
      where.OR = [
        { lembaga_id: lid },
        { target_lembaga_ids: { has: lid } },
        { lembaga_id: null, target_lembaga_ids: { isEmpty: true } },
      ];
    }

    const posList = await prisma.posPembayaran.findMany({
      where,
      include: {
        tarif: {
          include: {
            lembaga: {
              select: {
                lembaga_id: true,
                nama_lembaga: true,
                singkatan: true,
              },
            },
          },
          orderBy: { tarif_id: 'asc' },
        },
        sub_komponen: {
          where: { is_active: true },
          orderBy: { urutan: 'asc' },
        },
      },
      orderBy: { pos_id: 'asc' },
    });

    const rekeningList = await prisma.rekeningPesantren.findMany({
      where: { is_active: true },
      orderBy: { rekening_id: 'asc' },
    });

    const lembagaList = await prisma.lembaga.findMany({
      orderBy: { lembaga_id: 'asc' },
    });

    return res.json({
      success: true,
      data: {
        pos: posList,
        rekening: rekeningList,
        lembaga: lembagaList,
      },
    });
  } catch (error: any) {
    console.error('Error in getMasterPosKeuangan:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createPosPembayaran(req: Request, res: Response) {
  try {
    const { nama_pos, kode_pos, tipe_pembayaran, deskripsi, lembaga_id, target_lembaga_ids, tahun_id, has_kuota } = req.body;
    if (!nama_pos || !tipe_pembayaran) {
      return res.status(400).json({ success: false, message: 'Nama pos dan tipe pembayaran wajib diisi' });
    }

    let parsedLembagaIds: number[] = [];
    if (Array.isArray(target_lembaga_ids)) {
      parsedLembagaIds = target_lembaga_ids.map((id: any) => parseInt(id, 10)).filter((n) => !isNaN(n));
    } else if (lembaga_id) {
      parsedLembagaIds = [parseInt(lembaga_id, 10)];
    }

    const pos = await prisma.posPembayaran.create({
      data: {
        nama_pos,
        kode_pos: kode_pos || nama_pos.substring(0, 8).toUpperCase().replace(/\s/g, ''),
        tipe_pembayaran,
        has_kuota: has_kuota === true || has_kuota === 'true',
        deskripsi,
        lembaga_id: parsedLembagaIds.length > 0 ? parsedLembagaIds[0] : (lembaga_id ? parseInt(lembaga_id, 10) : null),
        target_lembaga_ids: parsedLembagaIds,
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

export async function updatePosPembayaran(req: Request, res: Response) {
  try {
    const { pos_id } = req.params;
    const { nama_pos, kode_pos, tipe_pembayaran, deskripsi, lembaga_id, target_lembaga_ids, tahun_id, is_active, has_kuota } = req.body;
    const data: any = {};
    if (nama_pos !== undefined) data.nama_pos = nama_pos;
    if (kode_pos !== undefined) data.kode_pos = kode_pos;
    if (tipe_pembayaran !== undefined) data.tipe_pembayaran = tipe_pembayaran;
    if (deskripsi !== undefined) data.deskripsi = deskripsi;
    if (has_kuota !== undefined) data.has_kuota = has_kuota === true || has_kuota === 'true';

    if (target_lembaga_ids !== undefined) {
      const parsedLembagaIds = Array.isArray(target_lembaga_ids)
        ? target_lembaga_ids.map((id: any) => parseInt(id, 10)).filter((n) => !isNaN(n))
        : [];
      data.target_lembaga_ids = parsedLembagaIds;
      data.lembaga_id = parsedLembagaIds.length > 0 ? parsedLembagaIds[0] : null;
    } else if (lembaga_id !== undefined) {
      data.lembaga_id = lembaga_id ? parseInt(lembaga_id, 10) : null;
    }

    if (tahun_id !== undefined) data.tahun_id = tahun_id ? parseInt(tahun_id, 10) : null;
    if (is_active !== undefined) data.is_active = is_active;

    const pos = await prisma.posPembayaran.update({
      where: { pos_id: parseInt(pos_id as string, 10) },
      data,
    });
    return res.json({ success: true, data: pos });
  } catch (error: any) {
    console.error('Error in updatePosPembayaran:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deletePosPembayaran(req: Request, res: Response) {
  try {
    const { pos_id } = req.params;
    await prisma.posPembayaran.update({
      where: { pos_id: parseInt(pos_id as string, 10) },
      data: { is_active: false },
    });
    return res.json({ success: true, message: 'Pos pembayaran berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in deletePosPembayaran:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createTarifPembayaran(req: Request, res: Response) {
  try {
    const { pos_id, nama_tarif, kuota, nominal, kelas_tingkat, keterangan, asrama, kategori_santri, jenis_kelamin, lembaga_id } = req.body;
    if (!pos_id || !nama_tarif || nominal === undefined) {
      return res.status(400).json({ success: false, message: 'Pos, nama tarif, dan nominal wajib diisi' });
    }

    const pId = parseInt(pos_id, 10);
    const lId = lembaga_id ? parseInt(lembaga_id, 10) : null;
    const nom = parseFloat(nominal);

    // Upsert or find existing matching tarif
    const existing = await prisma.tarifPembayaran.findFirst({
      where: {
        pos_id: pId,
        lembaga_id: lId,
        kuota: kuota || null,
        asrama: asrama || null,
        kategori_santri: kategori_santri || null,
        jenis_kelamin: jenis_kelamin || null,
      },
    });

    let tarif;
    if (existing) {
      tarif = await prisma.tarifPembayaran.update({
        where: { tarif_id: existing.tarif_id },
        data: {
          nama_tarif,
          nominal: nom,
          kelas_tingkat: kelas_tingkat ? parseInt(kelas_tingkat, 10) : null,
          keterangan: keterangan !== undefined ? keterangan : existing.keterangan,
        },
        include: {
          lembaga: { select: { lembaga_id: true, nama_lembaga: true, singkatan: true } },
        },
      });
    } else {
      tarif = await prisma.tarifPembayaran.create({
        data: {
          pos_id: pId,
          lembaga_id: lId,
          nama_tarif,
          kuota: kuota || null,
          asrama: asrama || null,
          kategori_santri: kategori_santri || null,
          jenis_kelamin: jenis_kelamin || null,
          nominal: nom,
          kelas_tingkat: kelas_tingkat ? parseInt(kelas_tingkat, 10) : null,
          keterangan,
        },
        include: {
          lembaga: { select: { lembaga_id: true, nama_lembaga: true, singkatan: true } },
        },
      });
    }

    return res.status(201).json({ success: true, data: tarif });
  } catch (error: any) {
    console.error('Error in createTarifPembayaran:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateTarifPembayaran(req: Request, res: Response) {
  try {
    const { tarif_id } = req.params;
    const { nama_tarif, kuota, nominal, kelas_tingkat, keterangan, asrama, kategori_santri, jenis_kelamin, lembaga_id } = req.body;
    const data: any = {};
    if (nama_tarif !== undefined) data.nama_tarif = nama_tarif;
    if (kuota !== undefined) data.kuota = kuota || null;
    if (asrama !== undefined) data.asrama = asrama || null;
    if (kategori_santri !== undefined) data.kategori_santri = kategori_santri || null;
    if (jenis_kelamin !== undefined) data.jenis_kelamin = jenis_kelamin || null;
    if (nominal !== undefined) data.nominal = parseFloat(nominal);
    if (kelas_tingkat !== undefined) data.kelas_tingkat = kelas_tingkat ? parseInt(kelas_tingkat, 10) : null;
    if (keterangan !== undefined) data.keterangan = keterangan;
    if (lembaga_id !== undefined) data.lembaga_id = lembaga_id ? parseInt(lembaga_id, 10) : null;

    const tarif = await prisma.tarifPembayaran.update({
      where: { tarif_id: parseInt(tarif_id as string, 10) },
      data,
      include: {
        lembaga: { select: { lembaga_id: true, nama_lembaga: true, singkatan: true } },
      },
    });
    return res.json({ success: true, data: tarif });
  } catch (error: any) {
    console.error('Error in updateTarifPembayaran:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function copyTarifPos(req: Request, res: Response) {
  try {
    const { pos_id, source_lembaga_id, target_lembaga_ids } = req.body;
    if (!pos_id || !Array.isArray(target_lembaga_ids) || target_lembaga_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Pos dan target lembaga wajib diisi' });
    }

    const pId = parseInt(pos_id, 10);
    const srcLId = source_lembaga_id ? parseInt(source_lembaga_id, 10) : null;

    // Get source tarifs
    const sourceTarifs = await prisma.tarifPembayaran.findMany({
      where: {
        pos_id: pId,
        lembaga_id: srcLId,
      },
    });

    if (sourceTarifs.length === 0) {
      return res.status(404).json({ success: false, message: 'Tidak ada tarif sumber untuk disalin' });
    }

    let copiedCount = 0;
    for (const targetId of target_lembaga_ids) {
      const tId = parseInt(targetId, 10);
      if (isNaN(tId) || tId === srcLId) continue;

      for (const st of sourceTarifs) {
        const existing = await prisma.tarifPembayaran.findFirst({
          where: {
            pos_id: pId,
            lembaga_id: tId,
            kuota: st.kuota,
            asrama: st.asrama,
            kategori_santri: st.kategori_santri,
            jenis_kelamin: st.jenis_kelamin,
          },
        });

        if (existing) {
          await prisma.tarifPembayaran.update({
            where: { tarif_id: existing.tarif_id },
            data: {
              nominal: st.nominal,
              nama_tarif: st.nama_tarif,
              kelas_tingkat: st.kelas_tingkat,
              keterangan: st.keterangan,
            },
          });
        } else {
          await prisma.tarifPembayaran.create({
            data: {
              pos_id: pId,
              lembaga_id: tId,
              nama_tarif: st.nama_tarif,
              kuota: st.kuota,
              asrama: st.asrama,
              kategori_santri: st.kategori_santri,
              jenis_kelamin: st.jenis_kelamin,
              nominal: st.nominal,
              kelas_tingkat: st.kelas_tingkat,
              keterangan: st.keterangan,
            },
          });
        }
        copiedCount++;
      }
    }

    return res.json({ success: true, message: `Berhasil menyalin ${copiedCount} tarif ke lembaga target!` });
  } catch (error: any) {
    console.error('Error in copyTarifPos:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteTarifPembayaran(req: Request, res: Response) {
  try {
    const { tarif_id } = req.params;
    await prisma.tarifPembayaran.delete({
      where: { tarif_id: parseInt(tarif_id as string, 10) },
    });
    return res.json({ success: true, message: 'Tarif pembayaran berhasil dihapus' });
  } catch (error: any) {
    console.error('Error in deleteTarifPembayaran:', error);
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

export async function deleteRekeningPesantren(req: Request, res: Response) {
  try {
    const { rekening_id } = req.params;
    await prisma.rekeningPesantren.update({
      where: { rekening_id: parseInt(rekening_id as string, 10) },
      data: { is_active: false },
    });
    return res.json({ success: true, message: 'Rekening berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in deleteRekeningPesantren:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// SUB-KOMPONEN POS PEMBAYARAN (Rincian Biaya Paket)
// ─────────────────────────────────────────────────────────────

export async function createPosSubKomponen(req: Request, res: Response) {
  try {
    const { pos_id } = req.params;
    const { nama_sub, nominal_default, kode_akun, urutan } = req.body;
    if (!pos_id || !nama_sub || nominal_default === undefined) {
      return res.status(400).json({ success: false, message: 'Pos, nama sub komponen, dan nominal wajib diisi' });
    }

    const sub = await prisma.posSubKomponen.create({
      data: {
        pos_id: parseInt(pos_id as string, 10),
        nama_sub,
        nominal_default: parseFloat(nominal_default),
        kode_akun: kode_akun || null,
        urutan: urutan ? parseInt(urutan, 10) : 1,
        is_active: true,
      },
    });

    return res.status(201).json({ success: true, data: sub });
  } catch (error: any) {
    console.error('Error in createPosSubKomponen:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updatePosSubKomponen(req: Request, res: Response) {
  try {
    const { sub_id } = req.params;
    const { nama_sub, nominal_default, kode_akun, urutan, is_active } = req.body;

    const data: any = {};
    if (nama_sub !== undefined) data.nama_sub = nama_sub;
    if (nominal_default !== undefined) data.nominal_default = parseFloat(nominal_default);
    if (kode_akun !== undefined) data.kode_akun = kode_akun;
    if (urutan !== undefined) data.urutan = parseInt(urutan, 10);
    if (is_active !== undefined) data.is_active = is_active;

    const updated = await prisma.posSubKomponen.update({
      where: { sub_id: parseInt(sub_id as string, 10) },
      data,
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error in updatePosSubKomponen:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deletePosSubKomponen(req: Request, res: Response) {
  try {
    const { sub_id } = req.params;
    await prisma.posSubKomponen.delete({
      where: { sub_id: parseInt(sub_id as string, 10) },
    });
    return res.json({ success: true, message: 'Sub-komponen berhasil dihapus' });
  } catch (error: any) {
    console.error('Error in deletePosSubKomponen:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// MASTER KATEGORI DISKON / KERINGANAN (Tahfidz, Anak Guru, dll)
// ─────────────────────────────────────────────────────────────

export async function getKategoriDiskonList(req: Request, res: Response) {
  try {
    const diskon = await prisma.masterKategoriDiskon.findMany({
      where: { is_active: true },
      include: {
        target_sub: {
          include: { pos: true },
        },
        _count: {
          select: { siswa_diskon: true },
        },
      },
      orderBy: { diskon_id: 'asc' },
    });
    return res.json({ success: true, data: diskon });
  } catch (error: any) {
    console.error('Error in getKategoriDiskonList:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createKategoriDiskon(req: Request, res: Response) {
  try {
    const { nama_diskon, kode_diskon, tipe_potongan, nilai_potongan, target_cakupan, target_sub_id, keterangan } = req.body;
    if (!nama_diskon || nilai_potongan === undefined) {
      return res.status(400).json({ success: false, message: 'Nama diskon dan nilai potongan wajib diisi' });
    }

    const diskon = await prisma.masterKategoriDiskon.create({
      data: {
        nama_diskon,
        kode_diskon: kode_diskon || nama_diskon.substring(0, 10).toUpperCase().replace(/\s/g, ''),
        tipe_potongan: tipe_potongan || 'PERSEN',
        nilai_potongan: parseFloat(nilai_potongan),
        target_cakupan: target_cakupan || 'GLOBAL_POS',
        target_sub_id: target_sub_id ? parseInt(target_sub_id, 10) : null,
        keterangan: keterangan || null,
        is_active: true,
      },
      include: {
        target_sub: { include: { pos: true } },
      },
    });

    return res.status(201).json({ success: true, data: diskon });
  } catch (error: any) {
    console.error('Error in createKategoriDiskon:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateKategoriDiskon(req: Request, res: Response) {
  try {
    const { diskon_id } = req.params;
    const { nama_diskon, kode_diskon, tipe_potongan, nilai_potongan, target_cakupan, target_sub_id, keterangan, is_active } = req.body;

    const data: any = {};
    if (nama_diskon !== undefined) data.nama_diskon = nama_diskon;
    if (kode_diskon !== undefined) data.kode_diskon = kode_diskon;
    if (tipe_potongan !== undefined) data.tipe_potongan = tipe_potongan;
    if (nilai_potongan !== undefined) data.nilai_potongan = parseFloat(nilai_potongan);
    if (target_cakupan !== undefined) data.target_cakupan = target_cakupan;
    if (target_sub_id !== undefined) data.target_sub_id = target_sub_id ? parseInt(target_sub_id, 10) : null;
    if (keterangan !== undefined) data.keterangan = keterangan;
    if (is_active !== undefined) data.is_active = is_active;

    const updated = await prisma.masterKategoriDiskon.update({
      where: { diskon_id: parseInt(diskon_id as string, 10) },
      data,
      include: {
        target_sub: { include: { pos: true } },
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error in updateKategoriDiskon:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteKategoriDiskon(req: Request, res: Response) {
  try {
    const { diskon_id } = req.params;
    await prisma.masterKategoriDiskon.update({
      where: { diskon_id: parseInt(diskon_id as string, 10) },
      data: { is_active: false },
    });
    return res.json({ success: true, message: 'Kategori keringanan berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in deleteKategoriDiskon:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// PENETAPAN DISKON SANTRI (Mapping Siswa & Keringanan)
// ─────────────────────────────────────────────────────────────

export async function getSiswaDiskonList(req: Request, res: Response) {
  try {
    const { siswa_id, diskon_id, kelas_id, lembaga_id } = req.query;
    const where: any = { is_active: true };

    if (siswa_id) where.siswa_id = parseInt(siswa_id as string, 10);
    if (diskon_id) where.diskon_id = parseInt(diskon_id as string, 10);
    if (kelas_id) {
      where.siswa = { ...(where.siswa || {}), kelas_id: parseInt(kelas_id as string, 10) };
    }
    if (lembaga_id) {
      where.siswa = {
        ...(where.siswa || {}),
        kelas: { lembaga_id: parseInt(lembaga_id as string, 10) },
      };
    }

    const list = await prisma.siswaKategoriDiskon.findMany({
      where,
      include: {
        siswa: {
          select: {
            siswa_id: true,
            nama: true,
            nis: true,
            keterangan_asrama: true,
            kelas: { select: { nama_kelas: true, lembaga_id: true } },
          },
        },
        diskon: {
          include: {
            target_sub: { include: { pos: true } },
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return res.json({ success: true, data: list });
  } catch (error: any) {
    console.error('Error in getSiswaDiskonList:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function assignSiswaDiskon(req: Request, res: Response) {
  try {
    const { siswa_id, diskon_id, tahun_id, catatan_sk } = req.body;
    if (!siswa_id || !diskon_id) {
      return res.status(400).json({ success: false, message: 'Santri dan kategori keringanan wajib dipilih' });
    }

    const existing = await prisma.siswaKategoriDiskon.findFirst({
      where: {
        siswa_id: parseInt(siswa_id, 10),
        diskon_id: parseInt(diskon_id, 10),
        is_active: true,
      },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Santri sudah terdaftar pada keringanan ini' });
    }

    const created = await prisma.siswaKategoriDiskon.create({
      data: {
        siswa_id: parseInt(siswa_id, 10),
        diskon_id: parseInt(diskon_id, 10),
        tahun_id: tahun_id ? parseInt(tahun_id, 10) : null,
        catatan_sk: catatan_sk || null,
        is_active: true,
      },
      include: {
        siswa: { select: { nama: true, nis: true } },
        diskon: true,
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    console.error('Error in assignSiswaDiskon:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function removeSiswaDiskon(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.siswaKategoriDiskon.delete({
      where: { id: parseInt(id as string, 10) },
    });
    return res.json({ success: true, message: 'Keringanan santri berhasil dihapus' });
  } catch (error: any) {
    console.error('Error in removeSiswaDiskon:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ═══════════════════════════════════════════════════════
// 2. TAGIHAN SISWA
// ═══════════════════════════════════════════════════════

export async function getTagihanSiswaList(req: Request, res: Response) {
  try {
    const { siswa_id, kelas_id, status, pos_id, search, lembaga_id, bulan, tahun_periode } = req.query;

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
    if (bulan) {
      where.bulan = parseInt(bulan as string, 10);
    }
    if (tahun_periode) {
      const tNum = parseInt(tahun_periode as string, 10);
      where.OR = [
        { tahun_periode: tNum },
        { tahun_periode: null },
      ];
    }
    if (kelas_id) {
      where.siswa = {
        ...(where.siswa || {}),
        kelas_id: parseInt(kelas_id as string, 10),
      };
    }
    if (lembaga_id) {
      where.siswa = {
        ...(where.siswa || {}),
        kelas: { lembaga_id: parseInt(lembaga_id as string, 10) },
      };
    }
    if (search) {
      where.siswa = {
        ...(where.siswa || {}),
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
            nisn: true,
            jenis_kelamin: true,
            keterangan_asrama: true,
            kategori_santri: true,
            kelas: {
              select: {
                kelas_id: true,
                nama_kelas: true,
                lembaga_id: true,
              },
            },
          },
        },
        pos: {
          include: {
            tarif: true,
            sub_komponen: {
              where: { is_active: true },
              orderBy: { urutan: 'asc' },
            },
          },
        },
        sub_items: {
          orderBy: { tagihan_sub_id: 'asc' },
        },
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
    const { siswa_id, pos_id, nama_tagihan, nominal_total, jatuh_tempo, keterangan, bulan, tahun_periode, kuota } = req.body;
    if (!siswa_id || !pos_id || !nominal_total) {
      return res.status(400).json({ success: false, message: 'Siswa, pos pembayaran, dan nominal wajib diisi' });
    }

    const sId = parseInt(siswa_id, 10);
    const pId = parseInt(pos_id, 10);

    const pos = await prisma.posPembayaran.findUnique({ where: { pos_id: pId } });
    if (!pos) {
      return res.status(404).json({ success: false, message: 'Pos pembayaran tidak ditemukan' });
    }

    const student = await prisma.siswa.findUnique({
      where: { siswa_id: sId },
      select: { keterangan_asrama: true, jenis_kelamin: true, kategori_santri: true },
    });
    const isAsrama = student?.keterangan_asrama === 'Ya' || student?.keterangan_asrama === 'Mukim';
    const asramaStr = isAsrama ? 'Asrama' : 'Non-Asrama';

    const total = parseFloat(nominal_total);
    const tagihan = await prisma.tagihanSiswa.create({
      data: {
        siswa_id: sId,
        pos_id: pId,
        nama_tagihan: nama_tagihan || (kuota ? `${pos.nama_pos} (${kuota})` : pos.nama_pos),
        kuota: kuota || null,
        asrama: asramaStr,
        jenis_kelamin: student?.jenis_kelamin || null,
        kategori_santri: student?.kategori_santri || 'Umum',
        nominal_total: total,
        nominal_terbayar: 0,
        sisa_tagihan: total,
        status: 'Belum Bayar',
        jatuh_tempo: jatuh_tempo || null,
        keterangan: keterangan || (kuota ? `Tagihan ${kuota}` : null),
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

// Set / Update Kuota Tagihan Santri (e.g. Uang Pangkal Kuota 1, Kuota 2, Kuota 3)
export async function setTagihanKuota(req: Request, res: Response) {
  try {
    const { siswa_id, pos_id, kuota, nominal, kategori_santri, tahun_periode } = req.body;
    if (!siswa_id || !pos_id || !kuota) {
      return res.status(400).json({ success: false, message: 'siswa_id, pos_id, dan kuota wajib diisi' });
    }

    const sId = parseInt(siswa_id, 10);
    const pId = parseInt(pos_id, 10);
    const targetTahun = tahun_periode ? parseInt(tahun_periode, 10) : new Date().getFullYear();

    const pos = await prisma.posPembayaran.findUnique({
      where: { pos_id: pId },
      include: { tarif: true },
    });
    if (!pos) {
      return res.status(404).json({ success: false, message: 'Pos pembayaran tidak ditemukan' });
    }

    const siswa = await prisma.siswa.findUnique({
      where: { siswa_id: sId },
      select: {
        siswa_id: true,
        nama: true,
        keterangan_asrama: true,
        kategori_santri: true,
        jenis_kelamin: true,
        kelas: {
          select: {
            lembaga_id: true,
          },
        },
      },
    });
    if (!siswa) {
      return res.status(404).json({ success: false, message: 'Data santri tidak ditemukan' });
    }

    let targetKategori = kategori_santri || siswa.kategori_santri || 'Umum';
    if (kategori_santri && kategori_santri !== siswa.kategori_santri) {
      await prisma.siswa.update({
        where: { siswa_id: sId },
        data: { kategori_santri },
      });
      targetKategori = kategori_santri;
    }

    const studentLembagaId = siswa.kelas?.lembaga_id || null;
    const isAsrama = siswa.keterangan_asrama === 'Ya' || siswa.keterangan_asrama === 'Mukim';
    const asramaStr = isAsrama ? 'Asrama' : 'Non-Asrama';

    // Find matching tarif for this kuota + asrama + kategori_santri + lembaga
    let targetNominal: number = nominal !== undefined ? parseFloat(nominal) : 0;
    if (nominal === undefined || isNaN(targetNominal)) {
      // 1. Exact lembaga + exact asrama + exact kategori
      let matchedTarif = pos.tarif.find(
        (t) =>
          t.kuota === kuota &&
          t.lembaga_id === studentLembagaId &&
          (!t.asrama || t.asrama === asramaStr) &&
          (!t.kategori_santri || t.kategori_santri === targetKategori)
      );

      // 2. Fallback to universal/default tarif (t.lembaga_id === null) + exact asrama + exact kategori
      if (!matchedTarif) {
        matchedTarif = pos.tarif.find(
          (t) =>
            t.kuota === kuota &&
            !t.lembaga_id &&
            (!t.asrama || t.asrama === asramaStr) &&
            (!t.kategori_santri || t.kategori_santri === targetKategori)
        );
      }

      // 3. Fallback to any tarif matching kuota for this lembaga
      if (!matchedTarif && studentLembagaId) {
        matchedTarif = pos.tarif.find((t) => t.kuota === kuota && t.lembaga_id === studentLembagaId);
      }

      // 4. Fallback to any tarif matching kuota in pos
      if (!matchedTarif) {
        matchedTarif = pos.tarif.find((t) => t.kuota === kuota);
      }

      targetNominal = matchedTarif ? matchedTarif.nominal : 0;
    }

    // Check if student already has a tagihan for this pos
    const existing = await prisma.tagihanSiswa.findFirst({
      where: {
        siswa_id: sId,
        pos_id: pId,
        OR: [
          { tahun_periode: targetTahun },
          { tahun_periode: null },
        ],
      },
    });

    if (existing) {
      const terbayar = existing.nominal_terbayar || 0;
      const newSisa = Math.max(0, targetNominal - terbayar);
      const newStatus = newSisa <= 0 ? 'Lunas' : (terbayar > 0 ? 'Sebagian' : 'Belum Bayar');

      const updated = await prisma.tagihanSiswa.update({
        where: { tagihan_id: existing.tagihan_id },
        data: {
          kuota,
          asrama: asramaStr,
          kategori_santri: targetKategori,
          nama_tagihan: `${pos.nama_pos} (${kuota})`,
          nominal_total: targetNominal,
          sisa_tagihan: newSisa,
          status: newStatus,
          tahun_periode: existing.tahun_periode || targetTahun,
          keterangan: `${kuota} • ${asramaStr} (${targetKategori})`,
        },
      });
      return res.json({ success: true, message: `Kuota ${kuota} berhasil diterapkan (${targetNominal > 0 ? `Rp ${targetNominal.toLocaleString('id-ID')}` : 'Rp 0'})`, data: updated });
    } else {
      const created = await prisma.tagihanSiswa.create({
        data: {
          siswa_id: sId,
          pos_id: pId,
          tahun_periode: targetTahun,
          nama_tagihan: `${pos.nama_pos} (${kuota})`,
          kuota,
          asrama: asramaStr,
          kategori_santri: targetKategori,
          nominal_total: targetNominal,
          nominal_terbayar: 0,
          sisa_tagihan: targetNominal,
          status: 'Belum Bayar',
          keterangan: `${kuota} • ${asramaStr} (${targetKategori})`,
        },
      });
      return res.status(201).json({ success: true, message: `Tagihan ${kuota} berhasil dibuat`, data: created });
    }
  } catch (error: any) {
    console.error('Error in setTagihanKuota:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Generate Tagihan SPP / Biaya Massal (dengan Otomatisasi Matriks Tarif & Dukungan Sub-Komponen)
export async function generateTagihanSppMassal(req: Request, res: Response) {
  try {
    const { pos_id, kelas_id, lembaga_id, bulan, tahun_periode, nominal, jatuh_tempo } = req.body;
    if (!pos_id || !tahun_periode) {
      return res.status(400).json({ success: false, message: 'Pos dan tahun periode wajib diisi' });
    }

    const pos = await prisma.posPembayaran.findUnique({
      where: { pos_id: parseInt(pos_id, 10) },
      include: {
        tarif: true,
        sub_komponen: {
          where: { is_active: true },
          orderBy: { urutan: 'asc' },
        },
      },
    });

    if (!pos) {
      return res.status(404).json({ success: false, message: 'Pos pembayaran tidak ditemukan' });
    }

    const isSpp = pos.kode_pos === 'SPP' || pos.nama_pos.toLowerCase().includes('spp');
    const isSeragam = pos.kode_pos === 'SERAGAM' || pos.nama_pos.toLowerCase().includes('seragam');
    const isKegiatan = pos.kode_pos === 'KEGIATAN' || pos.nama_pos.toLowerCase().includes('kegiatan');
    const isUjian = pos.kode_pos === 'UJIAN' || pos.nama_pos.toLowerCase().includes('ujian');

    const namaBulanList = [
      '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const bulanIndex = bulan ? parseInt(bulan, 10) : null;
    const bulanNama = bulanIndex ? namaBulanList[bulanIndex] || `Bulan ${bulanIndex}` : null;

    const whereSiswa: any = { status: 'Aktif' };
    if (kelas_id && kelas_id !== 'all') {
      whereSiswa.kelas_id = parseInt(kelas_id, 10);
    } else if (lembaga_id && lembaga_id !== 'SEMUA') {
      whereSiswa.kelas = { lembaga_id: parseInt(lembaga_id, 10) };
    } else if (pos.target_lembaga_ids && pos.target_lembaga_ids.length > 0) {
      whereSiswa.kelas = { lembaga_id: { in: pos.target_lembaga_ids } };
    } else if (pos.lembaga_id) {
      whereSiswa.kelas = { lembaga_id: pos.lembaga_id };
    }

    const students = await prisma.siswa.findMany({
      where: whereSiswa,
      select: {
        siswa_id: true,
        nama: true,
        jenis_kelamin: true,
        keterangan_asrama: true,
        kategori_santri: true,
        kelas: {
          select: {
            kelas_id: true,
            nama_kelas: true,
            lembaga_id: true,
          },
        },
        kategori_diskon: {
          where: { is_active: true },
          include: { diskon: true },
        },
      },
    });

    let createdCount = 0;
    const defaultNominal = nominal ? parseFloat(nominal) : (pos.tarif[0]?.nominal || 0);

    for (const s of students) {
      const whereExisting: any = {
        siswa_id: s.siswa_id,
        pos_id: pos.pos_id,
        tahun_periode: parseInt(tahun_periode, 10),
      };
      if (bulanIndex) {
        whereExisting.bulan = bulanIndex;
      }

      const existing = await prisma.tagihanSiswa.findFirst({
        where: whereExisting,
      });

      if (existing) continue;

      const studentLembagaId = s.kelas?.lembaga_id || null;
      const isAsrama = s.keterangan_asrama === 'Ya' || s.keterangan_asrama === 'Mukim';
      const asramaStr = isAsrama ? 'Asrama' : 'Non-Asrama';
      const isPutra = s.jenis_kelamin === 'L';

      let studentBaseNominal = defaultNominal;
      let namaTagihan = `${pos.nama_pos}${bulanNama ? ` - ${bulanNama}` : ''} ${tahun_periode}`;
      let tagihanAsrama: string | null = null;
      let tagihanJk: string | null = null;

      if (isSpp) {
        tagihanAsrama = asramaStr;
        let matchedTarif = pos.tarif.find((t) => t.lembaga_id === studentLembagaId && t.asrama === asramaStr);
        if (!matchedTarif) {
          matchedTarif = pos.tarif.find((t) => !t.lembaga_id && t.asrama === asramaStr);
        }
        studentBaseNominal = matchedTarif ? matchedTarif.nominal : (isAsrama ? 1900000 : 475000);
        namaTagihan = `${pos.nama_pos} (${asramaStr}) - ${bulanNama || ''} ${tahun_periode}`.replace('  ', ' ');
      } else if (isSeragam) {
        tagihanJk = isPutra ? 'L' : 'P';
        let matchedTarif = pos.tarif.find((t) => t.lembaga_id === studentLembagaId && t.jenis_kelamin === tagihanJk);
        if (!matchedTarif) {
          matchedTarif = pos.tarif.find((t) => !t.lembaga_id && t.jenis_kelamin === tagihanJk);
        }
        studentBaseNominal = matchedTarif ? matchedTarif.nominal : (isPutra ? 1100000 : 1600000);
        namaTagihan = `Seragam ${isPutra ? 'Putra' : 'Putri'} TA ${tahun_periode}`;
      } else if (isKegiatan) {
        let matchedTarif = pos.tarif.find((t) => t.lembaga_id === studentLembagaId);
        if (!matchedTarif) {
          matchedTarif = pos.tarif.find((t) => !t.lembaga_id) || pos.tarif[0];
        }
        studentBaseNominal = matchedTarif ? matchedTarif.nominal : 2250000;
        namaTagihan = `Kegiatan & Perlengkapan TA ${tahun_periode}`;
      } else if (isUjian) {
        let matchedTarif = pos.tarif.find((t) => t.lembaga_id === studentLembagaId);
        if (!matchedTarif) {
          matchedTarif = pos.tarif.find((t) => !t.lembaga_id) || pos.tarif[0];
        }
        studentBaseNominal = matchedTarif ? matchedTarif.nominal : 500000;
        namaTagihan = `Ujian 1 Tahun TA ${tahun_periode}`;
      }

      const studentDiscounts = s.kategori_diskon.map((kd: any) => kd.diskon);
      let subItemsToCreate: any[] = [];
      let totalTagihan = 0;
      let totalDiskon = 0;
      const diskonNames: string[] = [];

      const hasSub = pos.sub_komponen && pos.sub_komponen.length > 0;
      if (hasSub && isSpp) {
        for (const sub of pos.sub_komponen) {
          if (!isAsrama && (sub.kode_akun === 'KAS_DAPUR' || sub.kode_akun === 'KAS_ASRAMA' || sub.nama_sub.toLowerCase().includes('dapur') || sub.nama_sub.toLowerCase().includes('asrama'))) {
            continue;
          }
          let basePrice = sub.nominal_default;
          if (!isAsrama) {
            basePrice = studentBaseNominal;
          } else {
            if (sub.kode_akun === 'KAS_MADRASAH') basePrice = 450000;
            else if (sub.kode_akun === 'KAS_DAPUR') basePrice = 950000;
            else if (sub.kode_akun === 'KAS_ASRAMA') basePrice = 500000;
          }

          let itemDiscount = 0;
          let appliedDiscountName: string | null = null;
          const specificDisc = studentDiscounts.find(
            (d: any) => d.target_cakupan === 'SPECIFIC_SUB' && d.target_sub_id === sub.sub_id
          );
          const globalDisc = studentDiscounts.find((d: any) => d.target_cakupan === 'GLOBAL_POS');
          const matchedDisc = specificDisc || globalDisc;

          if (matchedDisc) {
            if (matchedDisc.tipe_potongan === 'PERSEN') {
              itemDiscount = basePrice * (matchedDisc.nilai_potongan / 100);
            } else {
              itemDiscount = Math.min(basePrice, matchedDisc.nilai_potongan);
            }
            appliedDiscountName = matchedDisc.nama_diskon;
            if (!diskonNames.includes(matchedDisc.nama_diskon)) {
              diskonNames.push(matchedDisc.nama_diskon);
            }
          }

          const finalPrice = Math.max(0, basePrice - itemDiscount);
          totalTagihan += finalPrice;
          totalDiskon += itemDiscount;

          subItemsToCreate.push({
            sub_id: sub.sub_id,
            nama_sub: sub.nama_sub,
            nominal_asli: basePrice,
            nominal_diskon: itemDiscount,
            nominal_final: finalPrice,
            keterangan_diskon: appliedDiscountName,
            kode_akun: sub.kode_akun,
          });
        }
      } else if (hasSub) {
        for (const sub of pos.sub_komponen) {
          const basePrice = sub.nominal_default;
          let itemDiscount = 0;
          let appliedDiscountName: string | null = null;
          const specificDisc = studentDiscounts.find(
            (d: any) => d.target_cakupan === 'SPECIFIC_SUB' && d.target_sub_id === sub.sub_id
          );
          const globalDisc = studentDiscounts.find((d: any) => d.target_cakupan === 'GLOBAL_POS');
          const matchedDisc = specificDisc || globalDisc;

          if (matchedDisc) {
            if (matchedDisc.tipe_potongan === 'PERSEN') {
              itemDiscount = basePrice * (matchedDisc.nilai_potongan / 100);
            } else {
              itemDiscount = Math.min(basePrice, matchedDisc.nilai_potongan);
            }
            appliedDiscountName = matchedDisc.nama_diskon;
            if (!diskonNames.includes(matchedDisc.nama_diskon)) {
              diskonNames.push(matchedDisc.nama_diskon);
            }
          }

          const finalPrice = Math.max(0, basePrice - itemDiscount);
          totalTagihan += finalPrice;
          totalDiskon += itemDiscount;

          subItemsToCreate.push({
            sub_id: sub.sub_id,
            nama_sub: sub.nama_sub,
            nominal_asli: basePrice,
            nominal_diskon: itemDiscount,
            nominal_final: finalPrice,
            keterangan_diskon: appliedDiscountName,
            kode_akun: sub.kode_akun,
          });
        }
      } else {
        let itemDiscount = 0;
        const globalDisc = studentDiscounts.find((d: any) => d.target_cakupan === 'GLOBAL_POS');
        if (globalDisc) {
          if (globalDisc.tipe_potongan === 'PERSEN') {
            itemDiscount = studentBaseNominal * (globalDisc.nilai_potongan / 100);
          } else {
            itemDiscount = Math.min(studentBaseNominal, globalDisc.nilai_potongan);
          }
          diskonNames.push(globalDisc.nama_diskon);
        }
        totalDiskon = itemDiscount;
        totalTagihan = Math.max(0, studentBaseNominal - itemDiscount);
      }

      await prisma.tagihanSiswa.create({
        data: {
          siswa_id: s.siswa_id,
          pos_id: pos.pos_id,
          bulan: bulanIndex,
          tahun_periode: parseInt(tahun_periode, 10),
          nama_tagihan: namaTagihan,
          asrama: tagihanAsrama,
          jenis_kelamin: tagihanJk,
          kategori_santri: s.kategori_santri || 'Umum',
          nominal_total: totalTagihan,
          nominal_diskon: totalDiskon,
          keterangan_diskon: diskonNames.length > 0 ? diskonNames.join(', ') : null,
          nominal_terbayar: 0,
          sisa_tagihan: totalTagihan,
          status: totalTagihan === 0 ? 'Lunas' : 'Belum Bayar',
          jatuh_tempo: jatuh_tempo || `${tahun_periode}-${bulanIndex ? String(bulanIndex).padStart(2, '0') : '07'}-10`,
          sub_items: subItemsToCreate.length > 0 ? { create: subItemsToCreate } : undefined,
        },
      });
      createdCount++;
    }

    return res.json({
      success: true,
      message: `Berhasil generate ${createdCount} tagihan ${pos.nama_pos} untuk santri terdaftar.`,
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
    const {
      siswa_id,
      status,
      metode,
      lembaga_id,
      tanggal,
      tanggal_mulai,
      tanggal_akhir,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const whereConditions: any[] = [];

    if (siswa_id) {
      whereConditions.push({ siswa_id: parseInt(siswa_id as string, 10) });
    }
    if (status && status !== 'Semua') {
      whereConditions.push({ status: status as string });
    }
    if (metode && metode !== 'Semua') {
      whereConditions.push({ metode_pembayaran: metode as string });
    }
    if (lembaga_id && String(lembaga_id).trim() !== '' && String(lembaga_id) !== 'Semua') {
      whereConditions.push({
        siswa: {
          kelas: {
            lembaga_id: parseInt(lembaga_id as string, 10),
          },
        },
      });
    }

    if (tanggal_mulai && tanggal_akhir) {
      whereConditions.push({
        tanggal_bayar: {
          gte: String(tanggal_mulai),
          lte: String(tanggal_akhir),
        },
      });
    } else if (tanggal_mulai) {
      whereConditions.push({
        tanggal_bayar: {
          gte: String(tanggal_mulai),
        },
      });
    } else if (tanggal_akhir) {
      whereConditions.push({
        tanggal_bayar: {
          lte: String(tanggal_akhir),
        },
      });
    } else if (tanggal) {
      whereConditions.push({
        tanggal_bayar: String(tanggal),
      });
    }

    if (search) {
      const s = String(search).trim();
      whereConditions.push({
        OR: [
          { nomor_transaksi: { contains: s, mode: 'insensitive' } },
          { siswa: { nama: { contains: s, mode: 'insensitive' } } },
          { siswa: { nis: { contains: s, mode: 'insensitive' } } },
          { siswa: { nisn: { contains: s, mode: 'insensitive' } } },
        ],
      });
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 50);
    const skip = (pageNum - 1) * limitNum;

    const whereTunai = {
      AND: [...whereConditions, { metode_pembayaran: { contains: 'Tunai', mode: 'insensitive' } }],
    };
    const whereNonTunai = {
      AND: [...whereConditions, { NOT: { metode_pembayaran: { contains: 'Tunai', mode: 'insensitive' } } }],
    };

    const [totalCount, aggregateBayar, aggregateTunai, aggregateNonTunai, transaksi] = await Promise.all([
      prisma.pembayaranTransaksi.count({ where }),
      prisma.pembayaranTransaksi.aggregate({
        where,
        _sum: { total_bayar: true },
      }),
      prisma.pembayaranTransaksi.aggregate({
        where: whereTunai,
        _sum: { total_bayar: true },
      }),
      prisma.pembayaranTransaksi.aggregate({
        where: whereNonTunai,
        _sum: { total_bayar: true },
      }),
      prisma.pembayaranTransaksi.findMany({
        where,
        include: {
          siswa: {
            select: {
              siswa_id: true,
              nama: true,
              nis: true,
              nisn: true,
              kelas: {
                select: {
                  nama_kelas: true,
                  lembaga: {
                    select: {
                      lembaga_id: true,
                      nama_lembaga: true,
                    },
                  },
                },
              },
              wali_murid: {
                select: {
                  nama_wali: true,
                  no_hp_wali: true,
                },
              },
            },
          },
          wali: {
            select: {
              wali_id: true,
              nama_wali: true,
              no_hp_wali: true,
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
        skip,
        take: limitNum,
      }),
    ]);

    // Ambil nama kasir jika diterima_oleh_user_id terisi
    const userIds = [...new Set(transaksi.map((t: any) => t.diterima_oleh_user_id).filter(Boolean))];
    const userMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { user_id: { in: userIds as string[] } },
        select: {
          user_id: true,
          username: true,
          pegawai: { select: { nama: true } },
        },
      });
      users.forEach((u: any) => {
        userMap[u.user_id] = u.pegawai?.[0]?.nama || u.username;
      });
    }

    const formatted = transaksi.map((t: any) => ({
      ...t,
      kasir_nama: t.diterima_oleh_user_id ? userMap[t.diterima_oleh_user_id] || 'Petugas Kasir' : 'Sistem / Mandiri',
    }));

    return res.json({
      success: true,
      data: formatted,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
      summary: {
        total_nominal: aggregateBayar._sum.total_bayar || 0,
        total_transaksi: totalCount,
        total_tunai: aggregateTunai._sum.total_bayar || 0,
        total_non_tunai: aggregateNonTunai._sum.total_bayar || 0,
      },
    });
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
    const { lembaga_id } = req.query;
    const lid = lembaga_id ? parseInt(lembaga_id as string, 10) : undefined;

    // 1. Total Penerimaan Kas
    const trxWhere: any = { status: { in: ['Disetujui', 'Success'] } };
    if (lid) {
      trxWhere.siswa = { kelas: { lembaga_id: lid } };
    }
    const sumPenerimaan = await prisma.pembayaranTransaksi.aggregate({
      where: trxWhere,
      _sum: { total_bayar: true },
    });

    // 2. Total Sisa Tunggakan
    const tagihanWhere: any = { status: { in: ['Belum Bayar', 'Sebagian'] } };
    if (lid) {
      tagihanWhere.siswa = { kelas: { lembaga_id: lid } };
    }
    const sumTunggakan = await prisma.tagihanSiswa.aggregate({
      where: tagihanWhere,
      _sum: { sisa_tagihan: true },
    });

    // Jumlah santri unik yang menunggak
    const santriMenunggak = await prisma.tagihanSiswa.groupBy({
      by: ['siswa_id'],
      where: tagihanWhere,
    });

    // 3. Penerimaan hari ini
    const today = new Date().toISOString().slice(0, 10);
    const sumToday = await prisma.pembayaranTransaksi.aggregate({
      where: { ...trxWhere, tanggal_bayar: today },
      _sum: { total_bayar: true },
      _count: { transaksi_id: true },
    });

    // 4. Pending verifikasi transfer
    const pendingWhere: any = { status: 'Menunggu Verifikasi' };
    if (lid) {
      pendingWhere.siswa = { kelas: { lembaga_id: lid } };
    }
    const countPending = await prisma.pembayaranTransaksi.count({
      where: pendingWhere,
    });

    // 5. Pos Pembayaran Breakdown
    const posList = await prisma.posPembayaran.findMany({
      include: {
        tagihan: {
          where: lid ? { siswa: { kelas: { lembaga_id: lid } } } : undefined,
          select: {
            nominal_total: true,
            nominal_terbayar: true,
            sisa_tagihan: true,
            status: true,
          },
        },
        sub_komponen: true,
      },
    });

    const breakdownPos = posList.map((p: any) => {
      const totalNominal = p.tagihan.reduce((acc: number, t: any) => acc + (t.nominal_total || 0), 0);
      const terbayar = p.tagihan.reduce((acc: number, t: any) => acc + (t.nominal_terbayar || 0), 0);
      const sisa = p.tagihan.reduce((acc: number, t: any) => acc + (t.sisa_tagihan || 0), 0);
      return {
        pos_id: p.pos_id,
        nama_pos: p.nama_pos,
        kode_pos: p.kode_pos,
        tipe_pembayaran: p.tipe_pembayaran,
        total_tagihan: totalNominal,
        total_terbayar: terbayar,
        total_sisa: sisa,
        count_tagihan: p.tagihan.length,
        persentase: totalNominal > 0 ? Math.round((terbayar / totalNominal) * 100) : 0,
      };
    });

    // 6. Distribusi Kas Akun Internal
    const subKomponenList = await prisma.tagihanSubItem.findMany({
      where: lid ? { tagihan: { siswa: { kelas: { lembaga_id: lid } } } } : undefined,
      select: {
        kode_akun: true,
        nominal_final: true,
        tagihan: {
          select: {
            nominal_total: true,
            nominal_terbayar: true,
          },
        },
      },
    });

    const kasMap: Record<string, { total_alokasi: number; terbayar_estimasi: number }> = {};
    subKomponenList.forEach((sk: any) => {
      const akun = sk.kode_akun || 'Kas Umum Yayasan';
      if (!kasMap[akun]) {
        kasMap[akun] = { total_alokasi: 0, terbayar_estimasi: 0 };
      }
      kasMap[akun].total_alokasi += sk.nominal_final || 0;
      const ratio = sk.tagihan?.nominal_total > 0 ? (sk.tagihan.nominal_terbayar / sk.tagihan.nominal_total) : 0;
      kasMap[akun].terbayar_estimasi += Math.round((sk.nominal_final || 0) * Math.min(1, ratio));
    });

    const distribusiKas = Object.entries(kasMap).map(([nama_kas, val]) => ({
      nama_kas,
      total_alokasi: val.total_alokasi,
      terbayar: val.terbayar_estimasi,
      sisa: Math.max(0, val.total_alokasi - val.terbayar_estimasi),
      persentase: val.total_alokasi > 0 ? Math.round((val.terbayar_estimasi / val.total_alokasi) * 100) : 0,
    }));

    // 7. Top 5 Santri dengan Tunggakan Terbesar
    const topSantriRaw = await prisma.tagihanSiswa.groupBy({
      by: ['siswa_id'],
      where: tagihanWhere,
      _sum: { sisa_tagihan: true },
      orderBy: { _sum: { sisa_tagihan: 'desc' } },
      take: 5,
    });

    const topSantriIds = topSantriRaw.map((s: any) => s.siswa_id);
    const santriDetailList = await prisma.siswa.findMany({
      where: { siswa_id: { in: topSantriIds } },
      select: {
        siswa_id: true,
        nama: true,
        nis: true,
        kelas: { select: { nama_kelas: true } },
        wali_murid: {
          select: {
            no_hp_wali: true,
            no_hp_ayah: true,
            no_hp_ibu: true,
          },
        },
      },
    });

    const topTunggakanSantri = topSantriRaw.map((item: any) => {
      const s = santriDetailList.find((x: any) => x.siswa_id === item.siswa_id);
      const hp = s?.wali_murid?.no_hp_wali || s?.wali_murid?.no_hp_ayah || s?.wali_murid?.no_hp_ibu || '-';
      return {
        siswa_id: item.siswa_id,
        nama: s?.nama || 'Santri',
        nis: s?.nis || '-',
        kelas: s?.kelas?.nama_kelas || '-',
        no_hp_wali: hp,
        total_tunggakan: item._sum?.sisa_tagihan || 0,
      };
    });

    // 8. 5 Transaksi Terkini
    const transaksiTerbaru = await prisma.pembayaranTransaksi.findMany({
      where: trxWhere,
      take: 5,
      orderBy: { transaksi_id: 'desc' },
      include: {
        siswa: {
          select: {
            siswa_id: true,
            nama: true,
            nis: true,
            kelas: { select: { nama_kelas: true } },
          },
        },
        items: {
          include: {
            tagihan: {
              include: { pos: true },
            },
          },
        },
      },
    });

    return res.json({
      success: true,
      data: {
        total_penerimaan: sumPenerimaan._sum.total_bayar || 0,
        total_tunggakan: sumTunggakan._sum.sisa_tagihan || 0,
        count_santri_menunggak: santriMenunggak.length,
        penerimaan_hari_ini: sumToday._sum.total_bayar || 0,
        count_transaksi_hari_ini: sumToday._count?.transaksi_id || 0,
        transaksi_menunggu_verifikasi: countPending,
        breakdown_pos: breakdownPos,
        distribusi_kas: distribusiKas,
        top_tunggakan_santri: topTunggakanSantri,
        transaksi_terbaru: transaksiTerbaru,
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
        sub_items: {
          orderBy: { tagihan_sub_id: 'asc' },
        },
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
