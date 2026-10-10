// mobile/src/utils/permissions.ts
import { AuthUser, UserRoleItem } from "../api/authService";

/**
 * Normalizes role names into a clean list of strings from user object
 */
export const getUserRoleNames = (user: AuthUser | null | undefined): string[] => {
  if (!user || !user.roles || !Array.isArray(user.roles)) return [];
  return user.roles.map((r) => r.nama_role?.trim()).filter(Boolean);
};

/**
 * Gets clean role name from UserRoleItem or AuthUser
 */
export const getActiveRoleName = (target: AuthUser | UserRoleItem | null | undefined): string => {
  if (!target) return "";
  if ("nama_role" in target) {
    return target.nama_role?.trim() || "";
  }
  return target.roles?.[0]?.nama_role?.trim() || "";
};

/**
 * Generic helper: Checks if user or activeRole has ANY of the specified role names
 */
export const hasAnyRole = (
  target: AuthUser | UserRoleItem | null | undefined,
  targetRoles: string[]
): boolean => {
  if (!target) return false;

  const targetRolesLower = targetRoles.map((r) => r.toLowerCase().trim());

  // If target is single UserRoleItem
  if ("nama_role" in target) {
    const roleName = (target.nama_role || "").toLowerCase().trim();
    if (roleName === "super admin") return true;
    return targetRolesLower.some((tr) => roleName.includes(tr) || roleName === tr);
  }

  // If target is AuthUser with roles array
  const userRoles = getUserRoleNames(target).map((r) => r.toLowerCase().trim());
  if (userRoles.includes("super admin")) return true;
  return targetRolesLower.some((tr) =>
    userRoles.some((ur) => ur.includes(tr) || ur === tr)
  );
};

/**
 * Checks if target matches Super Admin
 */
export const isSuperAdminRole = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  return hasAnyRole(target, ["Super Admin", "Admin"]);
};

/**
 * Checks if target matches Direktur or Super Admin (Global executive)
 */
export const isDirekturRole = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  return hasAnyRole(target, ["Direktur", "Super Admin"]);
};

/**
 * Checks if target matches Kepala Sekolah
 */
export const isKepalaSekolahRole = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  return hasAnyRole(target, ["Kepala Sekolah", "Kepala", "Direktur", "Super Admin"]);
};

/**
 * Checks if target matches WaKa (Kurikulum / Kesiswaan)
 */
export const isWaKaRole = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  return hasAnyRole(target, ["WaKa Kurikulum", "WaKa Kesiswaan", "WaKa", "Kepala Sekolah", "Direktur", "Super Admin"]);
};

/**
 * Checks if target is in Pimpinan cluster (Direktur, Kepsek, WaKa)
 */
export const isPimpinanRole = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  return hasAnyRole(target, [
    "Direktur",
    "Kepala Sekolah",
    "WaKa Kurikulum",
    "WaKa Kesiswaan",
    "WaKa",
    "Super Admin",
    "Admin Lembaga",
  ]);
};

/**
 * Checks if target matches Guru Tahfidz
 */
export const isGuruTahfidzRole = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  return hasAnyRole(target, ["Guru Tahfidz", "Tahfidz", "Direktur", "Super Admin"]);
};

/**
 * Checks if target matches Wali Kelas
 */
export const isWaliKelasRole = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  return hasAnyRole(target, ["Wali Kelas"]);
};

/**
 * Checks if target matches Guru Mapel (Teacher)
 */
export const isGuruMapelRole = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  return hasAnyRole(target, ["Guru", "Wali Kelas"]);
};

/**
 * Checks if target matches Wali Murid (Parent)
 */
export const isWaliMuridRole = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  if (!target) return false;
  if ("nama_role" in target) {
    const name = (target.nama_role || "").toLowerCase();
    return (
      name.includes("wali murid") ||
      name.includes("orang tua") ||
      name.includes("parent") ||
      (name.includes("wali") && !name.includes("wali kelas"))
    );
  }
  const roles = getUserRoleNames(target);
  return roles.some((r) => {
    const rLower = r.toLowerCase();
    return (
      rLower.includes("wali murid") ||
      rLower.includes("orang tua") ||
      rLower.includes("parent") ||
      (rLower.includes("wali") && !rLower.includes("wali kelas"))
    );
  });
};

/**
 * 1. Guru Tahfidz Permissions:
 * - Only Guru Tahfidz, Super Admin, Direktur, and Admin Lembaga can input/create Tahfidz setoran!
 */
export const canInputTahfidz = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  if (!target) return false;
  return hasAnyRole(target, ["Guru Tahfidz", "Super Admin", "Direktur", "Admin Lembaga"]);
};

export const canViewTahfidz = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  if (!target) return false;
  return hasAnyRole(target, [
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
 */
export const canManageKBM = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  if (!target) return false;
  return hasAnyRole(target, [
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
 * 3. Wali Murid / Orang Tua helper:
 */
export const isWaliMurid = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  return isWaliMuridRole(target);
};

/**
 * 4. Solely Guru Tahfidz:
 */
export const isGuruTahfidz = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  if (!target) return false;
  return hasAnyRole(target, ["Guru Tahfidz"]);
};

/**
 * 5. Regular subject teacher:
 */
export const isGuruMapel = (target: AuthUser | UserRoleItem | null | undefined): boolean => {
  if (!target) return false;
  return hasAnyRole(target, ["Guru", "Wali Kelas"]);
};
