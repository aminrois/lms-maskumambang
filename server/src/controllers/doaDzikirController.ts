// server/src/controllers/doaDzikirController.ts
import { Request, Response } from 'express';
import prisma from '../config/prisma';

// GET /api/doa-dzikir
export const getDoaDzikirList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, kategori, is_active } = req.query;

    const where: any = {};

    if (is_active !== undefined) {
      where.is_active = is_active === 'true' || is_active === '1';
    }

    if (kategori && typeof kategori === 'string' && kategori !== 'Semua') {
      where.kategori = kategori;
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { judul: { contains: q, mode: 'insensitive' } },
        { arti: { contains: q, mode: 'insensitive' } },
        { latin: { contains: q, mode: 'insensitive' } },
        { riwayat: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.doaDzikir.findMany({
      where,
      orderBy: [
        { urutan: 'asc' },
        { id: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: items,
      total: items.length,
    });
  } catch (error: any) {
    console.error('Error fetching doa & dzikir list:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data doa & dzikir', error: error?.message });
  }
};

// GET /api/doa-dzikir/categories
export const getDoaDzikirCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.doaDzikir.findMany({
      select: { kategori: true },
      distinct: ['kategori'],
      where: { is_active: true },
      orderBy: { kategori: 'asc' },
    });

    res.json({
      success: true,
      data: categories.map((c) => c.kategori),
    });
  } catch (error: any) {
    console.error('Error fetching doa categories:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil kategori doa', error: error?.message });
  }
};

// GET /api/doa-dzikir/:id
export const getDoaDzikirById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'ID tidak valid' });
      return;
    }

    const item = await prisma.doaDzikir.findUnique({
      where: { id },
    });

    if (!item) {
      res.status(404).json({ success: false, message: 'Data doa & dzikir tidak ditemukan' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error fetching doa by id:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail doa', error: error?.message });
  }
};

// POST /api/doa-dzikir
export const createDoaDzikir = async (req: Request, res: Response): Promise<void> => {
  try {
    const { judul, kategori, arab, latin, arti, riwayat, urutan, is_active } = req.body;

    if (!judul || !kategori || !arab || !arti) {
      res.status(400).json({
        success: false,
        message: 'Field judul, kategori, arab, dan arti wajib diisi',
      });
      return;
    }

    const newItem = await prisma.doaDzikir.create({
      data: {
        judul: judul.trim(),
        kategori: kategori.trim(),
        arab: arab.trim(),
        latin: latin ? latin.trim() : null,
        arti: arti.trim(),
        riwayat: riwayat ? riwayat.trim() : null,
        urutan: typeof urutan === 'number' ? urutan : parseInt(urutan, 10) || 0,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Doa & Dzikir berhasil ditambahkan',
      data: newItem,
    });
  } catch (error: any) {
    console.error('Error creating doa & dzikir:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan doa & dzikir', error: error?.message });
  }
};

// PUT /api/doa-dzikir/:id
export const updateDoaDzikir = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'ID tidak valid' });
      return;
    }

    const { judul, kategori, arab, latin, arti, riwayat, urutan, is_active } = req.body;

    const existing = await prisma.doaDzikir.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Data doa & dzikir tidak ditemukan' });
      return;
    }

    const updated = await prisma.doaDzikir.update({
      where: { id },
      data: {
        ...(judul !== undefined && { judul: judul.trim() }),
        ...(kategori !== undefined && { kategori: kategori.trim() }),
        ...(arab !== undefined && { arab: arab.trim() }),
        ...(latin !== undefined && { latin: latin ? latin.trim() : null }),
        ...(arti !== undefined && { arti: arti.trim() }),
        ...(riwayat !== undefined && { riwayat: riwayat ? riwayat.trim() : null }),
        ...(urutan !== undefined && { urutan: typeof urutan === 'number' ? urutan : parseInt(urutan, 10) || 0 }),
        ...(is_active !== undefined && { is_active: Boolean(is_active) }),
      },
    });

    res.json({
      success: true,
      message: 'Doa & Dzikir berhasil diperbarui',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating doa & dzikir:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui doa & dzikir', error: error?.message });
  }
};

// DELETE /api/doa-dzikir/:id
export const deleteDoaDzikir = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'ID tidak valid' });
      return;
    }

    const existing = await prisma.doaDzikir.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Data doa & dzikir tidak ditemukan' });
      return;
    }

    await prisma.doaDzikir.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Doa & Dzikir berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting doa & dzikir:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus doa & dzikir', error: error?.message });
  }
};
