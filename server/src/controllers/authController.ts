import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { generateToken } from '../config/jwt';
import { AuthRequest } from '../middlewares/authMiddleware';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    const identifier = username || email;

    const cleanIdentifier = String(identifier).trim();
    const cleanPassword = String(password).trim();

    // 1. Cari user berdasarkan username atau email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanIdentifier, mode: 'insensitive' } },
          { email: { equals: cleanIdentifier, mode: 'insensitive' } },
        ],
      },
      include: {
        user_roles: {
          include: {
            role: true,
            lembaga: true,
          },
        },
        pegawai: {
          include: {
            pegawai_lembaga: {
              include: {
                lembaga: true,
              },
            },
          },
        },
      },
    });

    // 2. Jika belum ditemukan, cari berdasarkan NIG dari tabel Pegawai
    if (!user) {
      const pegawai = await prisma.pegawai.findFirst({
        where: {
          nig: { equals: cleanIdentifier, mode: 'insensitive' },
        },
        include: {
          user: {
            include: {
              user_roles: {
                include: {
                  role: true,
                  lembaga: true,
                },
              },
              pegawai: {
                include: {
                  pegawai_lembaga: {
                    include: {
                      lembaga: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (pegawai && pegawai.user) {
        user = pegawai.user;
      }
    }

    if (!user) {
      res.status(401).json({ success: false, message: 'NIG/Username tidak ditemukan. Silakan periksa kembali.' });
      return;
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password_hash);

    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Kata sandi yang Anda masukkan salah.' });
      return;
    }

    const roles = user.user_roles.map((ur) => ur.role.nama_role);
    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      roles,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          roles: user.user_roles.map((ur) => ({
            role_id: ur.role_id,
            nama_role: ur.role.nama_role,
            lembaga_id: ur.lembaga_id,
            lembaga: ur.lembaga,
          })),
          pegawai: user.pegawai[0] || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, password, role_id = 7 } = req.body; // default role Guru (7) or as requested

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, ...(email ? [{ email }] : [])],
      },
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: 'Username atau email sudah digunakan' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password_hash,
        user_roles: {
          create: {
            role_id: Number(role_id),
          },
        },
      },
      include: {
        user_roles: {
          include: { role: true },
        },
      },
    });

    const roles = newUser.user_roles.map((ur) => ur.role.nama_role);
    const token = generateToken({
      user_id: newUser.user_id,
      username: newUser.username,
      email: newUser.email,
      roles,
    });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        token,
        user: {
          user_id: newUser.user_id,
          username: newUser.username,
          email: newUser.email,
          roles: newUser.user_roles.map((ur) => ({
            role_id: ur.role_id,
            nama_role: ur.role.nama_role,
            lembaga_id: ur.lembaga_id,
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      include: {
        user_roles: {
          include: {
            role: true,
            lembaga: true,
          },
        },
        pegawai: {
          include: {
            pegawai_lembaga: {
              include: {
                lembaga: true,
              },
            },
          },
        },
        wali_murid: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      return;
    }

    res.json({
      success: true,
      data: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        roles: user.user_roles.map((ur) => ({
          role_id: ur.role_id,
          nama_role: ur.role.nama_role,
          lembaga_id: ur.lembaga_id,
          lembaga: ur.lembaga,
        })),
        pegawai: user.pegawai[0] || null,
        wali_murid: user.wali_murid[0] || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      return;
    }

    const isMatch = await bcrypt.compare(old_password, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Password lama tidak sesuai' });
      return;
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: { password_hash: newHash },
    });

    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    next(error);
  }
};
