import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

// TAHUN AJARAN
export const getTahunAjarans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lembaga_id, is_active } = req.query;
    const where: any = {};
    if (lembaga_id) where.lembaga_id = Number(lembaga_id);
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const list = await prisma.tahunAjaran.findMany({
      where,
      orderBy: { tahun_id: 'desc' },
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const getTahunAjaranById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await prisma.tahunAjaran.findUnique({ where: { tahun_id: Number(id) } });
    if (!item) {
      res.status(404).json({ success: false, message: 'Tahun ajaran tidak ditemukan' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const createTahunAjaran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    if (data.lembaga_id) data.lembaga_id = Number(data.lembaga_id);
    const item = await prisma.tahunAjaran.create({ data });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateTahunAjaran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.lembaga_id) data.lembaga_id = Number(data.lembaga_id);
    const item = await prisma.tahunAjaran.update({
      where: { tahun_id: Number(id) },
      data,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deactivateAllTahunAjaran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lembaga_id } = req.body;
    await prisma.tahunAjaran.updateMany({
      where: lembaga_id ? { lembaga_id: Number(lembaga_id) } : undefined,
      data: { is_active: false },
    });
    res.json({ success: true, message: 'Semua tahun ajaran dinonaktifkan' });
  } catch (error) {
    next(error);
  }
};

export const deleteTahunAjaran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.tahunAjaran.delete({ where: { tahun_id: Number(id) } });
    res.json({ success: true, message: 'Tahun ajaran berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// KELAS
export const getKelass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lembaga_id, tahun_id } = req.query;
    const where: any = {};
    if (lembaga_id) where.lembaga_id = Number(lembaga_id);
    if (tahun_id) where.tahun_id = Number(tahun_id);

    const list = await prisma.kelas.findMany({
      where,
      include: {
        lembaga: true,
        tahun_ajaran: true,
        siswa: true,
        wali_kelas: true,
      },
      orderBy: { nama_kelas: 'asc' },
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const getKelasById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await prisma.kelas.findUnique({
      where: { kelas_id: Number(id) },
      include: { lembaga: true, tahun_ajaran: true, siswa: true, wali_kelas: true },
    });
    if (!item) {
      res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const createKelas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    data.lembaga_id = Number(data.lembaga_id);
    data.tahun_id = Number(data.tahun_id);
    if (data.wali_kelas_id) data.wali_kelas_id = Number(data.wali_kelas_id);

    const item = await prisma.kelas.create({ data });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateKelas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.lembaga_id) data.lembaga_id = Number(data.lembaga_id);
    if (data.tahun_id) data.tahun_id = Number(data.tahun_id);
    if (data.wali_kelas_id !== undefined) {
      data.wali_kelas_id = data.wali_kelas_id ? Number(data.wali_kelas_id) : null;
    }

    const item = await prisma.kelas.update({
      where: { kelas_id: Number(id) },
      data,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteKelas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.kelas.delete({ where: { kelas_id: Number(id) } });
    res.json({ success: true, message: 'Kelas berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// MATA PELAJARAN
export const getMataPelajarans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lembaga_id } = req.query;
    const list = await prisma.mataPelajaran.findMany({
      where: lembaga_id ? { lembaga_id: Number(lembaga_id) } : undefined,
      orderBy: { nama_mapel: 'asc' },
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const getMataPelajaranById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await prisma.mataPelajaran.findUnique({ where: { mapel_id: Number(id) } });
    if (!item) {
      res.status(404).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const createMataPelajaran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    data.lembaga_id = Number(data.lembaga_id);
    const item = await prisma.mataPelajaran.create({ data });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateMataPelajaran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await prisma.mataPelajaran.update({
      where: { mapel_id: Number(id) },
      data: req.body,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteMataPelajaran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.mataPelajaran.delete({ where: { mapel_id: Number(id) } });
    res.json({ success: true, message: 'Mata pelajaran berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// JAM AKADEMIK
export const getJamAkademiks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lembaga_id } = req.query;
    const list = await prisma.jamAkademik.findMany({
      where: lembaga_id ? { lembaga_id: Number(lembaga_id) } : undefined,
      orderBy: { urutan_jam: 'asc' },
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const createJamAkademik = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    data.lembaga_id = Number(data.lembaga_id);
    data.urutan_jam = Number(data.urutan_jam);
    const item = await prisma.jamAkademik.create({ data });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateJamAkademik = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.lembaga_id) data.lembaga_id = Number(data.lembaga_id);
    if (data.urutan_jam) data.urutan_jam = Number(data.urutan_jam);
    const item = await prisma.jamAkademik.update({
      where: { jam_id: Number(id) },
      data,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteJamAkademik = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.jamAkademik.delete({ where: { jam_id: Number(id) } });
    res.json({ success: true, message: 'Jam akademik berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// JADWAL PELAJARAN
export const getJadwalPelajarans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { kelas_id, pegawai_id, hari } = req.query;
    const where: any = {};
    if (kelas_id) where.kelas_id = Number(kelas_id);
    if (pegawai_id) where.pegawai_id = Number(pegawai_id);
    if (hari) where.hari = String(hari);

    const list = await prisma.jadwalPelajaran.findMany({
      where,
      include: {
        kelas: true,
        mapel: true,
        pegawai: true,
        jam_mulai: true,
        jam_selesai: true,
      },
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const getJadwalPelajaranById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await prisma.jadwalPelajaran.findUnique({
      where: { jadwal_id: Number(id) },
      include: {
        kelas: true,
        mapel: true,
        pegawai: true,
        jam_mulai: true,
        jam_selesai: true,
      },
    });
    if (!item) {
      res.status(404).json({ success: false, message: 'Jadwal pelajaran tidak ditemukan' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const createJadwalPelajaran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    if (data.kelas_id) data.kelas_id = Number(data.kelas_id);
    if (data.mapel_id) data.mapel_id = Number(data.mapel_id);
    if (data.pegawai_id) data.pegawai_id = Number(data.pegawai_id);
    if (data.jam_mulai_id) data.jam_mulai_id = Number(data.jam_mulai_id);
    if (data.jam_selesai_id) data.jam_selesai_id = Number(data.jam_selesai_id);

    const item = await prisma.jadwalPelajaran.create({ data });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateJadwalPelajaran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.kelas_id) data.kelas_id = Number(data.kelas_id);
    if (data.mapel_id) data.mapel_id = Number(data.mapel_id);
    if (data.pegawai_id) data.pegawai_id = Number(data.pegawai_id);
    if (data.jam_mulai_id) data.jam_mulai_id = Number(data.jam_mulai_id);
    if (data.jam_selesai_id) data.jam_selesai_id = Number(data.jam_selesai_id);

    const item = await prisma.jadwalPelajaran.update({
      where: { jadwal_id: Number(id) },
      data,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteJadwalPelajaran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.jadwalPelajaran.delete({ where: { jadwal_id: Number(id) } });
    res.json({ success: true, message: 'Jadwal pelajaran berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// KALENDER AKADEMIK
export const getKalenderAkademiks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tahun_id, lembaga_id } = req.query;
    const where: any = {};
    if (tahun_id) where.tahun_id = Number(tahun_id);
    if (lembaga_id) where.lembaga_id = Number(lembaga_id);

    const list = await prisma.kalenderAkademik.findMany({
      where,
      orderBy: { tanggal_mulai: 'asc' },
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const createKalenderAkademik = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    data.tahun_id = Number(data.tahun_id);
    if (data.lembaga_id) data.lembaga_id = Number(data.lembaga_id);
    const item = await prisma.kalenderAkademik.create({ data });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateKalenderAkademik = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.tahun_id) data.tahun_id = Number(data.tahun_id);
    if (data.lembaga_id) data.lembaga_id = Number(data.lembaga_id);
    const item = await prisma.kalenderAkademik.update({
      where: { kalender_id: Number(id) },
      data,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteKalenderAkademik = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.kalenderAkademik.delete({ where: { kalender_id: Number(id) } });
    res.json({ success: true, message: 'Kalender akademik berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
