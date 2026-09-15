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
      jam_mulai: true,
      jam_selesai: true,
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
          jam_mulai: true,
          jam_selesai: true,
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
          jam_mulai: true,
          jam_selesai: true,
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
          jam_mulai: true,
          jam_selesai: true,
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
  user: {
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
  role: {
    model: 'role',
    idField: 'role_id',
  },
  roles: {
    model: 'role',
    idField: 'role_id',
  },
};

const MANY_RELATIONS = new Set([
  'pegawai_lembaga',
  'user_roles',
  'siswa',
  'kelas_mapel',
  'details',
  'absensi_pelajaran',
  'absensi_harian',
  'jadwal_pelajaran',
]);

const RELATION_ALIASES: Record<string, string> = {
  jadwal_pelajaran: 'jadwal',
  mata_pelajaran: 'mapel',
};

function normalizeRelationKey(rel: string): string {
  return RELATION_ALIASES[rel] || rel;
}

function parseFilterValue(val: string): any {
  val = decodeURIComponent(val.replace(/\+/g, ' ')).trim();
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null') return null;
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  return val;
}

function parseOpAndValue(opWithVal: string): any {
  if (opWithVal.startsWith('eq.')) {
    return parseFilterValue(opWithVal.substring(3));
  }
  if (opWithVal.startsWith('neq.')) {
    return { not: parseFilterValue(opWithVal.substring(4)) };
  }
  if (opWithVal.startsWith('gte.')) {
    return { gte: parseFilterValue(opWithVal.substring(4)) };
  }
  if (opWithVal.startsWith('gt.')) {
    return { gt: parseFilterValue(opWithVal.substring(3)) };
  }
  if (opWithVal.startsWith('lte.')) {
    return { lte: parseFilterValue(opWithVal.substring(4)) };
  }
  if (opWithVal.startsWith('lt.')) {
    return { lt: parseFilterValue(opWithVal.substring(3)) };
  }
  if (opWithVal.startsWith('is.null')) {
    return null;
  }
  if (opWithVal.startsWith('not.is.null')) {
    return { not: null };
  }
  if (opWithVal.startsWith('in.(') && opWithVal.endsWith(')')) {
    const items = opWithVal
      .substring(4, opWithVal.length - 1)
      .split(',')
      .map((s) => parseFilterValue(s.trim()));
    return { in: items };
  }
  if (opWithVal.startsWith('like.') || opWithVal.startsWith('ilike.')) {
    const prefix = opWithVal.startsWith('like.') ? 'like.' : 'ilike.';
    let cleanVal = opWithVal.substring(prefix.length);
    cleanVal = cleanVal.replace(/^\*|\*$/g, '').replace(/^%|%$/g, '');
    cleanVal = decodeURIComponent(cleanVal.replace(/\+/g, ' '));
    return { contains: cleanVal, mode: 'insensitive' };
  }
  return parseFilterValue(opWithVal);
}

function buildNestedCondition(pathParts: string[], filterObj: any): any {
  if (pathParts.length === 0) return filterObj;
  if (pathParts.length === 1) {
    const fieldName = normalizeRelationKey(pathParts[0]);
    return { [fieldName]: filterObj };
  }

  const [head, ...tail] = pathParts;
  const relName = normalizeRelationKey(head);
  const isMany = MANY_RELATIONS.has(relName);

  const inner = buildNestedCondition(tail, filterObj);
  if (isMany) {
    return { [relName]: { some: inner } };
  } else {
    return { [relName]: inner };
  }
}

function parseConditionExpression(expr: string): any {
  expr = expr.trim();
  if (!expr) return null;

  const opRegex = /\.(eq|neq|gte|gt|lte|lt|is|not\.is|in|like|ilike)\./;
  const match = expr.match(opRegex);

  if (match && match.index !== undefined) {
    const fieldPath = expr.substring(0, match.index).split('.');
    const opAndVal = expr.substring(match.index + 1);
    const condition = parseOpAndValue(opAndVal);
    return buildNestedCondition(fieldPath, condition);
  }

  const parts = expr.split('.');
  if (parts.length >= 2) {
    const field = parts[0];
    const opAndVal = parts.slice(1).join('.');
    return { [field]: parseOpAndValue(opAndVal) };
  }

  return null;
}

function splitParenthesesList(content: string): string[] {
  if (content.startsWith('(') && content.endsWith(')')) {
    content = content.substring(1, content.length - 1);
  }

  const results: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;

    if (char === ',' && depth === 0) {
      if (current.trim()) results.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) results.push(current.trim());
  return results;
}

function parseWhere(query: Record<string, any>, idField: string, idParam?: string): any {
  const andList: any[] = [];

  if (idParam !== undefined) {
    andList.push({ [idField]: parseFilterValue(idParam) });
  }

  for (const [rawKey, rawVal] of Object.entries(query)) {
    if (['select', 'order', 'limit', 'offset', 'page', 'count'].includes(rawKey)) continue;

    // Handle array values when the same query param key appears multiple times
    // e.g. ?tanggal=gte.2026-09-01&tanggal=lte.2026-09-30 → rawVal = ["gte.2026-09-01", "lte.2026-09-30"]
    if (Array.isArray(rawVal)) {
      for (const item of rawVal) {
        if (typeof item !== 'string') continue;
        const key = rawKey.trim();
        const val = item.trim();
        if (key.includes('.')) {
          const pathParts = key.split('.');
          const condition = parseOpAndValue(val);
          andList.push(buildNestedCondition(pathParts, condition));
        } else {
          andList.push({ [key]: parseOpAndValue(val) });
        }
      }
      continue;
    }

    if (typeof rawVal !== 'string') {
      continue;
    }

    const key = rawKey.trim();
    const val = rawVal.trim();

    // 1. Handle global `or=(cond1,cond2,...)`
    if (key === 'or') {
      const subExprs = splitParenthesesList(val);
      const orConditions = subExprs
        .map(parseConditionExpression)
        .filter(Boolean);
      if (orConditions.length > 0) {
        andList.push({ OR: orConditions });
      }
      continue;
    }

    // 2. Handle global `and=(cond1,cond2,...)`
    if (key === 'and') {
      const subExprs = splitParenthesesList(val);
      const andConditions = subExprs
        .map(parseConditionExpression)
        .filter(Boolean);
      if (andConditions.length > 0) {
        andList.push({ AND: andConditions });
      }
      continue;
    }

    // 3. Handle relation `or` like `jadwal_pelajaran.or=(kelas.nama_kelas.ilike.*X*,...)`
    if (key.endsWith('.or')) {
      const relPath = key.substring(0, key.length - 3).split('.');
      const subExprs = splitParenthesesList(val);
      const orConditions = subExprs
        .map(parseConditionExpression)
        .filter(Boolean);
      if (orConditions.length > 0) {
        const nestedOr = buildNestedCondition(relPath, { OR: orConditions });
        andList.push(nestedOr);
      }
      continue;
    }

    // 4. Handle nested dot notation keys: `kelas.lembaga_id=eq.4` or `pegawai_lembaga.lembaga_id=eq.4`
    if (key.includes('.')) {
      const pathParts = key.split('.');
      const condition = parseOpAndValue(val);
      const nested = buildNestedCondition(pathParts, condition);
      andList.push(nested);
      continue;
    }

    // 5. Standard single field filter: `nama=ilike.*budi*` or `status=eq.Aktif`
    const condition = parseOpAndValue(val);
    andList.push({ [key]: condition });
  }

  if (andList.length === 0) return {};
  if (andList.length === 1) return andList[0];
  return { AND: andList };
}

function parseOrderBy(orderQuery?: string): any {
  if (!orderQuery) return undefined;
  const parts = orderQuery.split(',');
  const orderBy: any[] = [];
  for (const part of parts) {
    const raw = part.trim();
    const segments = raw.split('.');
    if (segments.length >= 1) {
      const field = segments[0];
      const dir = segments[1]?.toLowerCase() === 'desc' ? 'desc' : 'asc';
      orderBy.push({ [field]: dir });
    }
  }
  return orderBy.length === 1 ? orderBy[0] : orderBy;
}

export const getTableRecords = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tableName = String(req.params.table || '').toLowerCase();
    const config = TABLE_CONFIGS[tableName];

    if (!config) {
      res.status(404).json({ success: false, message: `Table '${tableName}' not found` });
      return;
    }

    const idParam = req.params.id ? String(req.params.id) : undefined;
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

const KNOWN_INT_FIELDS = new Set([
  'siswa_id', 'wali_murid_id', 'kelas_id', 'tahun_id', 'lembaga_id', 'tahun_masuk',
  'mapel_id', 'pegawai_id', 'jam_mulai_id', 'jam_selesai_id', 'jam_id', 'urutan_jam',
  'jadwal_id', 'lesson_plan_id', 'detail_id', 'pertemuan_ke', 'jurnal_id',
  'absensi_pel_id', 'absensi_harian_id', 'activity_id', 'kalender_id', 'wali_id',
  'user_id', 'role_id', 'wali_kelas_id',
]);

const KNOWN_BOOL_FIELDS = new Set(['is_active']);

function sanitizeData(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  const clean: Record<string, any> = {};

  for (const [key, val] of Object.entries(raw)) {
    // Skip relation nested objects or arrays unless meant as relation data
    if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      continue;
    }

    if (KNOWN_INT_FIELDS.has(key) || key.endsWith('_id')) {
      if (val === '' || val === null || val === undefined) {
        clean[key] = null;
      } else if (typeof val === 'string' && /^-?\d+$/.test(val.trim())) {
        clean[key] = parseInt(val.trim(), 10);
      } else {
        clean[key] = val;
      }
    } else if (KNOWN_BOOL_FIELDS.has(key)) {
      if (typeof val === 'string') {
        clean[key] = val.toLowerCase() === 'true';
      } else {
        clean[key] = Boolean(val);
      }
    } else if (val === '' && (key.endsWith('_id') || key.startsWith('tanggal_') || key === 'nik' || key === 'pin' || key === 'no_un_sebelumnya' || key === 'ruangan')) {
      clean[key] = null;
    } else {
      clean[key] = val;
    }
  }

  return clean;
}

export const createTableRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tableName = String(req.params.table || '').toLowerCase();
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
        const sanitized = sanitizeData(item);
        const created = await prismaModel.create({
          data: sanitized,
          ...(config.defaultInclude ? { include: config.defaultInclude } : {}),
        });
        createdItems.push(created);
      }
      res.status(201).json(createdItems);
      return;
    }

    const sanitized = sanitizeData(req.body);
    const created = await prismaModel.create({
      data: sanitized,
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
    const tableName = String(req.params.table || '').toLowerCase();
    const config = TABLE_CONFIGS[tableName];

    if (!config) {
      res.status(404).json({ success: false, message: `Table '${tableName}' not found` });
      return;
    }

    const prismaModel = (prisma as any)[config.model];
    const idParam = req.params.id ? String(req.params.id) : undefined;
    const where = parseWhere(req.query, config.idField, idParam);

    const preferHeader = (req.headers['prefer'] as string) || '';
    const wantRepresentation = preferHeader.includes('return=representation');
    const sanitized = sanitizeData(req.body);

    // If ID is specified in path or query
    if (where[config.idField] !== undefined) {
      const idVal = where[config.idField];
      const updated = await prismaModel.update({
        where: { [config.idField]: idVal },
        data: sanitized,
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
      data: sanitized,
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
    const tableName = String(req.params.table || '').toLowerCase();
    const config = TABLE_CONFIGS[tableName];

    if (!config) {
      res.status(404).json({ success: false, message: `Table '${tableName}' not found` });
      return;
    }

    const prismaModel = (prisma as any)[config.model];
    const idParam = req.params.id ? String(req.params.id) : undefined;
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
