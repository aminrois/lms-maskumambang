import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

// LEMBAGA
export const getLembagas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const lembagas = await prisma.lembaga.findMany({ orderBy: { lembaga_id: 'asc' } });
    res.json(lembagas);
  } catch (error) {
    next(error);
  }
};

export const getLembagaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const lembaga = await prisma.lembaga.findUnique({ where: { lembaga_id: Number(id) } });
    if (!lembaga) {
      res.status(404).json({ success: false, message: 'Lembaga tidak ditemukan' });
      return;
    }
    res.json(lembaga);
  } catch (error) {
    next(error);
  }
};

export const createLembaga = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nama_lembaga, singkatan, kepala_sekolah_id, kurikulum_id } = req.body;
    const lembaga = await prisma.lembaga.create({
      data: {
        nama_lembaga,
        singkatan,
        kepala_sekolah_id: kepala_sekolah_id ? Number(kepala_sekolah_id) : null,
        kurikulum_id: kurikulum_id ? Number(kurikulum_id) : null,
      },
    });
    res.status(201).json(lembaga);
  } catch (error) {
    next(error);
  }
};

export const updateLembaga = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const lembaga = await prisma.lembaga.update({
      where: { lembaga_id: Number(id) },
      data: req.body,
    });
    res.json(lembaga);
  } catch (error) {
    next(error);
  }
};

export const deleteLembaga = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.lembaga.delete({ where: { lembaga_id: Number(id) } });
    res.json({ success: true, message: 'Lembaga berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// SISWA
export const getSiswas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { kelas_id, status } = req.query;
    const where: any = {};
    if (kelas_id) where.kelas_id = Number(kelas_id);
    if (status) where.status = String(status);

    const siswas = await prisma.siswa.findMany({
      where,
      include: {
        kelas: true,
        wali_murid: true,
      },
      orderBy: { nama: 'asc' },
    });
    res.json(siswas);
  } catch (error) {
    next(error);
  }
};

export const getSiswaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const siswa = await prisma.siswa.findUnique({
      where: { siswa_id: Number(id) },
      include: { kelas: true, wali_murid: true },
    });
    if (!siswa) {
      res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
      return;
    }
    res.json(siswa);
  } catch (error) {
    next(error);
  }
};

export const createSiswa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    if (data.tahun_masuk) data.tahun_masuk = Number(data.tahun_masuk);
    if (data.wali_murid_id) data.wali_murid_id = Number(data.wali_murid_id);
    if (data.kelas_id) data.kelas_id = Number(data.kelas_id);

    const siswa = await prisma.siswa.create({ data });
    res.status(201).json(siswa);
  } catch (error) {
    next(error);
  }
};

export const updateSiswa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.tahun_masuk) data.tahun_masuk = Number(data.tahun_masuk);
    if (data.wali_murid_id) data.wali_murid_id = Number(data.wali_murid_id);
    if (data.kelas_id) data.kelas_id = Number(data.kelas_id);

    const siswa = await prisma.siswa.update({
      where: { siswa_id: Number(id) },
      data,
    });
    res.json(siswa);
  } catch (error) {
    next(error);
  }
};

export const deleteSiswa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.siswa.delete({ where: { siswa_id: Number(id) } });
    res.json({ success: true, message: 'Siswa berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// PEGAWAI
export const getPegawais = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, jabatan } = req.query;
    const where: any = {};
    if (status) where.status = String(status);
    if (jabatan) where.jabatan = String(jabatan);

    const pegawais = await prisma.pegawai.findMany({
      where,
      include: {
        pegawai_lembaga: {
          include: { lembaga: true },
        },
      },
      orderBy: { nama: 'asc' },
    });
    res.json(pegawais);
  } catch (error) {
    next(error);
  }
};

export const getPegawaiById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const pegawai = await prisma.pegawai.findUnique({
      where: { pegawai_id: Number(id) },
      include: {
        pegawai_lembaga: {
          include: { lembaga: true },
        },
      },
    });
    if (!pegawai) {
      res.status(404).json({ success: false, message: 'Pegawai tidak ditemukan' });
      return;
    }
    res.json(pegawai);
  } catch (error) {
    next(error);
  }
};

export const createPegawai = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    const pegawai = await prisma.pegawai.create({ data });
    res.status(201).json(pegawai);
  } catch (error) {
    next(error);
  }
};

export const updatePegawai = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const pegawai = await prisma.pegawai.update({
      where: { pegawai_id: Number(id) },
      data: req.body,
    });
    res.json(pegawai);
  } catch (error) {
    next(error);
  }
};

export const deletePegawai = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.pegawai.delete({ where: { pegawai_id: Number(id) } });
    res.json({ success: true, message: 'Pegawai berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// WALI MURID
export const getWaliMurids = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const walis = await prisma.waliMurid.findMany({ orderBy: { nama_wali: 'asc' } });
    res.json(walis);
  } catch (error) {
    next(error);
  }
};

export const getWaliMuridById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const wali = await prisma.waliMurid.findUnique({ where: { wali_id: Number(id) } });
    if (!wali) {
      res.status(404).json({ success: false, message: 'Wali murid tidak ditemukan' });
      return;
    }
    res.json(wali);
  } catch (error) {
    next(error);
  }
};

export const createWaliMurid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const wali = await prisma.waliMurid.create({ data: req.body });
    res.status(201).json(wali);
  } catch (error) {
    next(error);
  }
};

export const updateWaliMurid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const wali = await prisma.waliMurid.update({
      where: { wali_id: Number(id) },
      data: req.body,
    });
    res.json(wali);
  } catch (error) {
    next(error);
  }
};

export const deleteWaliMurid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.waliMurid.delete({ where: { wali_id: Number(id) } });
    res.json({ success: true, message: 'Wali murid berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
