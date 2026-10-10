// server/src/controllers/notifikasiController.ts
import { Request, Response } from 'express';
import prisma from '../config/prisma';

/** GET /api/v1/notifikasi — ambil semua notifikasi aktif (semua role bisa akses) */
export const getAll = async (req: Request, res: Response) => {
  try {
    const { limit = '20', offset = '0', kategori } = req.query;

    const where: any = { is_active: true };
    if (kategori && kategori !== 'Semua') where.kategori = kategori as string;

    const [data, total] = await Promise.all([
      prisma.notifikasi.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.notifikasi.count({ where }),
    ]);

    res.json({ data, total });
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal mengambil data notifikasi', error: err.message });
  }
};

/** GET /api/v1/notifikasi/admin — semua notifikasi termasuk non-aktif (admin only) */
export const getAdmin = async (req: Request, res: Response) => {
  try {
    const { limit = '50', offset = '0' } = req.query;
    const [data, total] = await Promise.all([
      prisma.notifikasi.findMany({
        orderBy: { created_at: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.notifikasi.count(),
    ]);
    res.json({ data, total });
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal mengambil data', error: err.message });
  }
};

/** POST /api/v1/notifikasi — buat notifikasi baru (Direktur / Super Admin) */
export const create = async (req: Request, res: Response) => {
  try {
    const { judul, isi, kategori = 'Umum', target_role = 'semua' } = req.body;
    if (!judul || !isi) {
      return res.status(400).json({ message: 'Judul dan isi wajib diisi.' });
    }

    const userId = (req as any).user?.userId;

    const item = await prisma.notifikasi.create({
      data: {
        judul,
        isi,
        kategori,
        target_role,
        created_by: userId || null,
      },
    });

    res.status(201).json({ message: 'Notifikasi berhasil dibuat.', data: item });
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal membuat notifikasi', error: err.message });
  }
};

/** PUT /api/v1/notifikasi/:id — update notifikasi */
export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { judul, isi, kategori, target_role, is_active } = req.body;

    const item = await prisma.notifikasi.update({
      where: { id },
      data: {
        ...(judul !== undefined && { judul }),
        ...(isi !== undefined && { isi }),
        ...(kategori !== undefined && { kategori }),
        ...(target_role !== undefined && { target_role }),
        ...(is_active !== undefined && { is_active }),
      },
    });
    res.json({ message: 'Notifikasi berhasil diperbarui.', data: item });
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal update notifikasi', error: err.message });
  }
};

/** DELETE /api/v1/notifikasi/:id — hapus notifikasi */
export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.notifikasi.delete({ where: { id } });
    res.json({ message: 'Notifikasi berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ message: 'Gagal menghapus notifikasi', error: err.message });
  }
};
