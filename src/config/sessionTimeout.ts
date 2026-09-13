export const SESSION_TIMEOUT_CONFIG: Record<string, {
  inactivityMs: number;
  warningMs: number;
  tabClosedGraceMs: number;
}> = {
  'Super Admin': { inactivityMs: 60 * 60_000, warningMs: 5 * 60_000, tabClosedGraceMs: 65 * 60_000 },
  'Direktur': { inactivityMs: 60 * 60_000, warningMs: 5 * 60_000, tabClosedGraceMs: 65 * 60_000 },
  'Kepala Sekolah': { inactivityMs: 60 * 60_000, warningMs: 5 * 60_000, tabClosedGraceMs: 65 * 60_000 },
  'WaKa Kurikulum': { inactivityMs: 60 * 60_000, warningMs: 5 * 60_000, tabClosedGraceMs: 65 * 60_000 },
  'Admin Lembaga': { inactivityMs: 60 * 60_000, warningMs: 5 * 60_000, tabClosedGraceMs: 65 * 60_000 },
  'Wali Kelas': { inactivityMs: 60 * 60_000, warningMs: 5 * 60_000, tabClosedGraceMs: 65 * 60_000 },
  'Guru': { inactivityMs: 60 * 60_000, warningMs: 5 * 60_000, tabClosedGraceMs: 65 * 60_000 },
};

export const TIMEOUT_WHITELIST_PATHS = [
  '/kbm/face-recognition',
] as const;

export const LAST_ACTIVITY_KEY = 'mlms_last_activity';
export const TAB_HIDDEN_AT_KEY = 'mlms_tab_hidden_at';
