// mobile/src/utils/permissions.ts
import { AuthUser } from "../api/authService";

/**
 * Normalizes role names into a clean list of strings from user object
 */
export const getUserRoleNames = (user: AuthUser | null): string[] => {
  if (!user || !user.roles || !Array.isArray(user.roles)) return [];
  return user.roles.map((r) => r.nama_role?.trim()).filter(Boolean);
};

/**
 * Checks if user has ANY of the specified role names
 */
export const hasAnyRole = (user: AuthUser | null, targetRoles: string[]): boolean => {
  const userRoles = getUserRoleNames(user);
  if (userRoles.includes("Super Admin")) return true; // Super admin always passes
  return targetRoles.some((tr) => userRoles.includes(tr));
};

/**
 * 1. Guru Tahfidz Permissions:
 * - Only Guru Tahfidz, Super Admin, Direktur, and Admin Lembaga can input/create Tahfidz setoran!
 * - Regular Guru Mapel, Wali Kelas, Wali Murid CANNOT input tahfidz setoran.
 */
export const canInputTahfidz = (user: AuthUser | null): boolean => {
  if (!user) return false;
  return hasAnyRole(user, ["Guru Tahfidz", "Super Admin", "Direktur", "Admin Lembaga"]);
};

export const canViewTahfidz = (user: AuthUser | null): boolean => {
  if (!user) return false;
  return hasAnyRole(user, [
    "Guru Tahfidz",
    "Super Admin",
    "Direktur",
    "Admin Lembaga",
    "Kepala Sekolah",
    "WaKa Kurikulum",
    "Wali Kelas",
    "Wali Murid",
  ]);
};

/**
 * 2. Guru Mapel & KBM Permissions:
 * - Regular teacher / Wali Kelas / Kurikulum / Super Admin can manage KBM & take attendance
 */
export const canManageKBM = (user: AuthUser | null): boolean => {
  if (!user) return false;
  return hasAnyRole(user, [
    "Guru",
    "Wali Kelas",
    "WaKa Kurikulum",
    "Kepala Sekolah",
    "Direktur",
    "Super Admin",
    "Admin Lembaga",
  ]);
};

/**
 * 3. Wali Murid / Orang Tua:
 */
export const isWaliMurid = (user: AuthUser | null): boolean => {
  if (!user) return false;
  const roles = getUserRoleNames(user);
  return roles.includes("Wali Murid") || roles.includes("Wali");
};

/**
 * 4. Check if user is solely a Guru Tahfidz
 */
export const isGuruTahfidz = (user: AuthUser | null): boolean => {
  if (!user) return false;
  return hasAnyRole(user, ["Guru Tahfidz"]);
};

/**
 * 5. Check if user is a regular subject teacher (Guru Mapel)
 */
export const isGuruMapel = (user: AuthUser | null): boolean => {
  if (!user) return false;
  return hasAnyRole(user, ["Guru", "Wali Kelas"]);
};
