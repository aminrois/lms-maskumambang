import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

interface ModelConfig {
  model: string;
  idField: string;
  defaultInclude?: any;
}

const TABLE_CONFIGS: Record<string, ModelConfig> = {
  lembaga: {
    model: 'lembaga',
    idField: 'lembaga_id',
    defaultInclude: {
      kelas: {
        include: {
          siswa: true,
        },
      },
      pegawai_lembaga: true,
    },
  },
  pegawai: {
    model: 'pegawai',
    idField: 'pegawai_id',
    defaultInclude: {
      pegawai_lembaga: {
        include: {
          lembaga: true,
        },
      },
      user: {
        include: {
          user_roles: {
            include: {
              role: true,
              lembaga: true,
            },
          },
        },
      },
    },
  },
  pegawai_lembaga: {
    model: 'pegawaiLembaga',
    idField: 'pegawai_id',
    defaultInclude: {
      lembaga: true,
      pegawai: true,
    },
  },
  wali_murid: {
    model: 'waliMurid',
    idField: 'wali_id',
    defaultInclude: {
      siswa: true,
    },
  },
  siswa: {
    model: 'siswa',
    idField: 'siswa_id',
    defaultInclude: {
      kelas: {
        include: {
          lembaga: true,
        },
      },
      wali_murid: true,
    },
  },
  tahun_ajaran: {
    model: 'tahunAjaran',
    idField: 'tahun_id',
    defaultInclude: {
      lembaga: true,
    },
  },
  kelas: {
    model: 'kelas',
    idField: 'kelas_id',
    defaultInclude: {
      lembaga: true,
      tahun_ajaran: true,
      siswa: true,
      kelas_mapel: {
        include: {
          mapel: true,
        },
      },
    },
  },
  mata_pelajaran: {
    model: 'mataPelajaran',
    idField: 'mapel_id',
    defaultInclude: {
      lembaga: true,
      kelas_mapel: {
        include: {
          kelas: true,
        },
      },
    },
  },
  kelas_mapel: {
    model: 'kelasMapel',
    idField: 'kelas_id',
    defaultInclude: {
      kelas: true,
      mapel: true,
    },
  },
  jam_akademik: {
    model: 'jamAkademik',
    idField: 'jam_id',
    defaultInclude: {
      lembaga: true,
    },
  },
  jadwal_pelajaran: {
    model: 'jadwalPelajaran',
    idField: 'jadwal_id',
    defaultInclude: {
      kelas: true,
      mapel: true,
      pegawai: true,
    },
  },
  lesson_plan: {
    model: 'lessonPlan',
    idField: 'lesson_plan_id',
    defaultInclude: {
      pegawai: true,
      jadwal: {
        include: {
          kelas: true,
          mapel: true,
        },
      },
      details: true,
    },
  },
  lesson_plans: {
    model: 'lessonPlan',
    idField: 'lesson_plan_id',
    defaultInclude: {
      pegawai: true,
      jadwal: {
        include: {
          kelas: true,
          mapel: true,
        },
      },
      details: true,
    },
  },
  lesson_plan_detail: {
    model: 'lessonPlanDetail',
    idField: 'detail_id',
  },
  jurnal_mengajar: {
    model: 'jurnalMengajar',
    idField: 'jurnal_id',
    defaultInclude: {
      jadwal: {
        include: {
          kelas: true,
          mapel: true,
          pegawai: true,
        },
      },
      lesson_plan_detail: true,
      absensi_pelajaran: {
        include: {
          siswa: true,
        },
      },
    },
  },
  absensi_pelajaran: {
    model: 'absensiPelajaran',
    idField: 'absensi_pel_id',
    defaultInclude: {
      siswa: true,
      jurnal: true,
    },
  },
  absensi_siswa: {
    model: 'absensiPelajaran',
    idField: 'absensi_pel_id',
    defaultInclude: {
      siswa: true,
      jurnal: true,
    },
  },
  absensi_harian: {
    model: 'absensiHarian',
    idField: 'absensi_harian_id',
    defaultInclude: {
      siswa: true,
    },
  },
  kalender_akademik: {
    model: 'kalenderAkademik',
    idField: 'kalender_id',
    defaultInclude: {
      lembaga: true,
      tahun_ajaran: true,
    },
  },
  activity_plan: {
    model: 'activityPlan',
    idField: 'activity_id',
    defaultInclude: {
      lembaga: true,
      tahun_ajaran: true,
    },
  },
  users: {
    model: 'user',
    idField: 'user_id',
    defaultInclude: {
      user_roles: {
        include: {
          role: true,
          lembaga: true,
        },
      },
      pegawai: true,
    },
  },
  user_roles: {
    model: 'userRole',
    idField: 'user_role_id',
    defaultInclude: {
      role: true,
      lembaga: true,
      user: true,
    },
  },
  user_role: {
    model: 'userRole',
    idField: 'user_role_id',
    defaultInclude: {
      role: true,
      lembaga: true,
      user: true,
    },
  },
  roles: {
    model: 'role',
    idField: 'role_id',
  },
};

function parseFilterValue(val: string): any {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null') return null;
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  return val;
}

function parseWhere(query: Record<string, any>, idField: string, idParam?: string): any {
  const where: any = {};

  if (idParam !== undefined) {
    where[idField] = parseFilterValue(idParam);
  }

  for (const [key, rawVal] of Object.entries(query)) {
    if (['select', 'order', 'limit', 'offset', 'page', 'count'].includes(key)) continue;
    if (typeof rawVal !== 'string') {
      where[key] = rawVal;
      continue;
    }

    const val = rawVal.trim();
    if (val.startsWith('eq.')) {
      where[key] = parseFilterValue(val.substring(3));
    } else if (val.startsWith('neq.')) {
      where[key] = { not: parseFilterValue(val.substring(4)) };
    } else if (val.startsWith('gte.')) {
      where[key] = { gte: parseFilterValue(val.substring(4)) };
    } else if (val.startsWith('gt.')) {
      where[key] = { gt: parseFilterValue(val.substring(3)) };
    } else if (val.startsWith('lte.')) {
      where[key] = { lte: parseFilterValue(val.substring(4)) };
    } else if (val.startsWith('lt.')) {
      where[key] = { lt: parseFilterValue(val.substring(3)) };
    } else if (val.startsWith('is.null')) {
      where[key] = null;
    } else if (val.startsWith('not.is.null')) {
      where[key] = { not: null };
    } else if (val.startsWith('in.(') && val.endsWith(')')) {
      const items = val
        .substring(4, val.length - 1)
        .split(',')
        .map((s) => parseFilterValue(s.trim()));
      where[key] = { in: items };
    } else if (val.startsWith('like.') || val.startsWith('ilike.')) {
      const prefix = val.startsWith('like.') ? 'like.' : 'ilike.';
      const cleanVal = val.substring(prefix.length).replace(/%/g, '').replace(/\*/g, '');
      where[key] = { contains: cleanVal, mode: 'insensitive' };
    } else {
      where[key] = parseFilterValue(val);
    }
  }

  return where;
}

function parseOrderBy(orderQuery?: string): any {
  if (!orderQuery) return undefined;
  const parts = orderQuery.split(',');
  const orderBy: any[] = [];
  for (const part of parts) {
    const [field, dir] = part.trim().split('.');
    if (field) {
      orderBy.push({ [field]: dir === 'desc' ? 'desc' : 'asc' });
    }
  }
  return orderBy.length === 1 ? orderBy[0] : orderBy;
}

export const getTableRecords = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tableName = req.params.table.toLowerCase();
    const config = TABLE_CONFIGS[tableName];

    if (!config) {
      res.status(404).json({ success: false, message: `Table '${tableName}' not found` });
      return;
    }

    const idParam = req.params.id;
    const where = parseWhere(req.query, config.idField, idParam);
    const orderBy = parseOrderBy(req.query.order as string);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

    const preferHeader = (req.headers['prefer'] as string) || '';
    const wantCount = preferHeader.includes('count=exact') || req.query.count === 'exact';

    const prismaModel = (prisma as any)[config.model];

    let totalCount = 0;
    if (wantCount) {
      totalCount = await prismaModel.count({ where });
    }

    const queryOptions: any = {
      where,
    };

    if (config.defaultInclude) {
      queryOptions.include = config.defaultInclude;
    }
    if (orderBy) {
      queryOptions.orderBy = orderBy;
    }
    if (limit !== undefined) {
      queryOptions.take = limit;
    }
    if (offset !== undefined) {
      queryOptions.skip = offset;
    }

    const data = await prismaModel.findMany(queryOptions);

    if (wantCount) {
      const start = offset || 0;
      const end = Math.max(0, start + data.length - 1);
      res.setHeader('Content-Range', `${start}-${end}/${totalCount}`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Prefer');
    }

    // If single item was requested by /:id, return single or array as requested
    if (idParam !== undefined && !Array.isArray(data)) {
      res.json(data);
      return;
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const createTableRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tableName = req.params.table.toLowerCase();
    const config = TABLE_CONFIGS[tableName];

    if (!config) {
      res.status(404).json({ success: false, message: `Table '${tableName}' not found` });
      return;
    }

    const prismaModel = (prisma as any)[config.model];
    const preferHeader = (req.headers['prefer'] as string) || '';
    const wantRepresentation = preferHeader.includes('return=representation');

    if (Array.isArray(req.body)) {
      const createdItems = [];
      for (const item of req.body) {
        const created = await prismaModel.create({
          data: item,
          ...(config.defaultInclude ? { include: config.defaultInclude } : {}),
        });
        createdItems.push(created);
      }
      res.status(201).json(createdItems);
      return;
    }

    const created = await prismaModel.create({
      data: req.body,
      ...(config.defaultInclude ? { include: config.defaultInclude } : {}),
    });

    if (wantRepresentation) {
      res.status(201).json([created]);
    } else {
      res.status(201).json(created);
    }
  } catch (error) {
    next(error);
  }
};

export const updateTableRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tableName = req.params.table.toLowerCase();
    const config = TABLE_CONFIGS[tableName];

    if (!config) {
      res.status(404).json({ success: false, message: `Table '${tableName}' not found` });
      return;
    }

    const prismaModel = (prisma as any)[config.model];
    const idParam = req.params.id;
    const where = parseWhere(req.query, config.idField, idParam);

    const preferHeader = (req.headers['prefer'] as string) || '';
    const wantRepresentation = preferHeader.includes('return=representation');

    // If ID is specified in path or query
    if (where[config.idField] !== undefined) {
      const idVal = where[config.idField];
      const updated = await prismaModel.update({
        where: { [config.idField]: idVal },
        data: req.body,
        ...(config.defaultInclude ? { include: config.defaultInclude } : {}),
      });

      if (wantRepresentation) {
        res.json([updated]);
      } else {
        res.json(updated);
      }
      return;
    }

    // Multiple records update
    await prismaModel.updateMany({
      where,
      data: req.body,
    });

    const updatedList = await prismaModel.findMany({
      where,
      ...(config.defaultInclude ? { include: config.defaultInclude } : {}),
    });

    if (wantRepresentation) {
      res.json(updatedList);
    } else {
      res.json(updatedList);
    }
  } catch (error) {
    next(error);
  }
};

export const deleteTableRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tableName = req.params.table.toLowerCase();
    const config = TABLE_CONFIGS[tableName];

    if (!config) {
      res.status(404).json({ success: false, message: `Table '${tableName}' not found` });
      return;
    }

    const prismaModel = (prisma as any)[config.model];
    const idParam = req.params.id;
    const where = parseWhere(req.query, config.idField, idParam);

    const preferHeader = (req.headers['prefer'] as string) || '';
    const wantRepresentation = preferHeader.includes('return=representation');

    let deletedItems: any[] = [];
    if (wantRepresentation) {
      deletedItems = await prismaModel.findMany({ where });
    }

    if (where[config.idField] !== undefined) {
      const idVal = where[config.idField];
      await prismaModel.delete({
        where: { [config.idField]: idVal },
      });
    } else {
      await prismaModel.deleteMany({ where });
    }

    if (wantRepresentation) {
      res.json(deletedItems);
    } else {
      res.json({ success: true, message: 'Deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
};
