import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { generateToken } from '../config/jwt';
import { AuthRequest } from '../middlewares/authMiddleware';

const verifyGoogleRecaptcha = async (token?: string, remoteIp?: string): Promise<boolean> => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LesLNgtAAAAACm0ucBneXXkZ8ZGMxDprTztKrkP';
  if (!secretKey) return true;
  if (!token) return false;
  if (token === 'disabled') return true;

  try {
    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token);
    if (remoteIp) params.append('remoteip', remoteIp);

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = (await response.json()) as { success: boolean; [key: string]: any };
    return Boolean(data && data.success);
  } catch (error) {
    console.error('Error verifying reCAPTCHA token:', error);
    return false;
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, password, captchaToken } = req.body;
    const identifier = username || email;

    const cleanIdentifier = String(identifier || '').trim();
    const cleanPassword = String(password || '').trim();

    // Deteksi apakah request berasal dari Mobile App (React Native / Expo) atau testing lokal / IP private
    const clientPlatform = (req.headers['x-client-platform'] as string)?.toLowerCase();
    const clientApp = (req.headers['x-client-app'] as string)?.toLowerCase();
    const userAgent = (req.headers['user-agent'] as string)?.toLowerCase() || '';

    const isMobileClient =
      clientPlatform === 'mobile' ||
      clientApp === 'masdico-mobile' ||
      req.body.isMobile === true ||
      req.body.captchaToken === 'mobile' ||
      req.body.captchaToken === 'disabled' ||
      userAgent.includes('okhttp') ||
      userAgent.includes('cfnetwork') ||
      userAgent.includes('expo') ||
      userAgent.includes('reactnative') ||
      userAgent.includes('mobile-app');

    const isPrivateOrLocalIp = (h: string) => {
      if (!h) return false;
      const cleanHost = h.split(':')[0].toLowerCase();
      return (
        cleanHost === 'localhost' ||
        cleanHost === '127.0.0.1' ||
        cleanHost.startsWith('192.168.') ||
        cleanHost.startsWith('10.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanHost) ||
        cleanHost.endsWith('.local') ||
        cleanHost.endsWith('.lan') ||
        cleanHost.includes('ngrok') ||
        cleanHost.includes('loca.lt') ||
        cleanHost.includes('trycloudflare')
      );
    };

    const host = req.headers.host || '';
    const hostname = req.hostname || '';
    const origin = req.headers.origin || '';

    const isLocalhostRequest =
      isPrivateOrLocalIp(hostname) ||
      isPrivateOrLocalIp(host) ||
      (origin && isPrivateOrLocalIp(origin.replace(/^https?:\/\//, ''))) ||
      process.env.NODE_ENV === 'development';

    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || '6LesLNgtAAAAACm0ucBneXXkZ8ZGMxDprTztKrkP';

    // Verifikasi Google reCAPTCHA (hanya diaktifkan pada client Web browser di lingkungan production publik)
    if (recaptchaSecret && !isLocalhostRequest && !isMobileClient) {
      if (!captchaToken || captchaToken === 'disabled' || captchaToken === 'mobile') {
        res.status(400).json({ success: false, message: 'Harap selesaikan verifikasi Google reCAPTCHA.' });
        return;
      }
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;
      const isValid = await verifyGoogleRecaptcha(captchaToken, clientIp);
      if (!isValid) {
        res.status(400).json({ success: false, message: 'Verifikasi Google reCAPTCHA tidak valid. Silakan coba lagi.' });
        return;
      }
    }

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
