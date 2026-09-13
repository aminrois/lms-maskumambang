import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        username: true,
        email: true,
        fcm_device_token: true,
        created_at: true,
        user_roles: {
          include: {
            role: true,
            lembaga: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { user_id: id },
      select: {
        user_id: true,
        username: true,
        email: true,
        fcm_device_token: true,
        created_at: true,
        user_roles: {
          include: {
            role: true,
            lembaga: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      return;
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, password = 'password123', fcm_device_token, role_ids = [] } = req.body;

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password_hash,
        fcm_device_token,
        user_roles: {
          create: role_ids.map((role_id: number) => ({
            role_id: Number(role_id),
          })),
        },
      },
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { username, email, password, fcm_device_token } = req.body;

    const dataToUpdate: any = {};
    if (username) dataToUpdate.username = username;
    if (email) dataToUpdate.email = email;
    if (fcm_device_token !== undefined) dataToUpdate.fcm_device_token = fcm_device_token;
    if (password) {
      dataToUpdate.password_hash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { user_id: id },
      data: dataToUpdate,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.user.delete({ where: { user_id: id } });
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// ROLES
export const getRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roles = await prisma.role.findMany({ orderBy: { role_id: 'asc' } });
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const role = await prisma.role.findUnique({ where: { role_id: Number(id) } });
    if (!role) {
      res.status(404).json({ success: false, message: 'Role tidak ditemukan' });
      return;
    }
    res.json(role);
  } catch (error) {
    next(error);
  }
};

// USER ROLES
export const getUserRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user_id } = req.query;
    const userRoles = await prisma.userRole.findMany({
      where: user_id ? { user_id: String(user_id) } : undefined,
      include: { role: true, lembaga: true },
    });
    res.json(userRoles);
  } catch (error) {
    next(error);
  }
};

export const createUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user_id, role_id, lembaga_id } = req.body;
    const ur = await prisma.userRole.create({
      data: {
        user_id,
        role_id: Number(role_id),
        lembaga_id: lembaga_id ? Number(lembaga_id) : null,
      },
      include: { role: true, lembaga: true },
    });
    res.status(201).json(ur);
  } catch (error) {
    next(error);
  }
};

export const deleteUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.userRole.delete({ where: { user_role_id: Number(id) } });
    res.json({ success: true, message: 'User role berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
