// mobile/src/utils/lembagaUtil.ts
/**
 * Utility untuk mengelompokkan dan mendeteksi lembaga dalam satu jenjang pendidikan yang sama.
 * Contoh di Yayasan:
 * - MI: MI Putra (MIPA - 1) & MI Putri (MIPI - 2)
 * - MTs: MTs YKUI (3) & MTs Progresif (4)
 * - MA: MA YKUI (5)
 * - SMK: SMK 1 (6) & SMK 2 (7)
 * - STIT: STIT Maskumambang (10)
 * - Asrama: Asrama Putra (11) & Asrama Putri (12)
 */

export interface BaseLembaga {
  lembaga_id: number;
  nama_lembaga?: string;
  singkatan?: string;
}

export const JENJANG_MAP: Record<string, number[]> = {
  MI: [1, 2],
  MTS: [3, 4],
  MA: [5],
  SMK: [6, 7],
  STIT: [10],
  ASRAMA: [11, 12],
};

/**
 * Mengembalikan array lembaga_id yang berada dalam 1 jenjang yang sama dengan lembagaId target.
 */
export const getJenjangLembagaIds = (
  targetLembagaId: number | null | undefined,
  allLembagas?: BaseLembaga[]
): number[] => {
  if (!targetLembagaId) return [];

  // 1. Cek langsung dari mapping konstan ID
  for (const key of Object.keys(JENJANG_MAP)) {
    if (JENJANG_MAP[key].includes(targetLembagaId)) {
      return JENJANG_MAP[key];
    }
  }

  // 2. Fallback dinamis berdasarkan nama atau singkatan lembaga jika ada penambahan baru
  if (allLembagas && allLembagas.length > 0) {
    const target = allLembagas.find((l) => l.lembaga_id === targetLembagaId);
    if (target) {
      const name = (target.nama_lembaga || "").toUpperCase();
      const code = (target.singkatan || "").toUpperCase();

      if (code.startsWith("MI") || name.includes(" MI ") || name.startsWith("MI ")) {
        return allLembagas
          .filter(
            (l) =>
              (l.singkatan || "").toUpperCase().startsWith("MI") ||
              (l.nama_lembaga || "").toUpperCase().includes(" MI ") ||
              (l.nama_lembaga || "").toUpperCase().startsWith("MI ")
          )
          .map((l) => l.lembaga_id);
      }

      if (code.startsWith("SMK") || name.includes("SMK")) {
        return allLembagas
          .filter(
            (l) =>
              (l.singkatan || "").toUpperCase().startsWith("SMK") ||
              (l.nama_lembaga || "").toUpperCase().includes("SMK")
          )
          .map((l) => l.lembaga_id);
      }

      if (code.startsWith("MTS") || name.includes("MTS")) {
        return allLembagas
          .filter(
            (l) =>
              (l.singkatan || "").toUpperCase().startsWith("MTS") ||
              (l.nama_lembaga || "").toUpperCase().includes("MTS")
          )
          .map((l) => l.lembaga_id);
      }
    }
  }

  return [targetLembagaId];
};

/**
 * Mengembalikan nama representatif dari 1 jenjang lembaga
 */
export const getJenjangDisplayName = (
  targetLembagaId: number | null | undefined,
  defaultName?: string
): string => {
  if (!targetLembagaId) return defaultName || "";

  if ([1, 2].includes(targetLembagaId)) return "MI Maskumambang (Putra & Putri)";
  if ([3, 4].includes(targetLembagaId)) return "MTs Maskumambang";
  if ([5].includes(targetLembagaId)) return "MA Maskumambang";
  if ([6, 7].includes(targetLembagaId)) return "SMK Maskumambang (1 & 2)";
  if ([10].includes(targetLembagaId)) return "STIT Maskumambang";
  if ([11, 12].includes(targetLembagaId)) return "Asrama (Putra & Putri)";

  return defaultName || "";
};
