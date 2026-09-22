// mobile/src/constants/config.ts

// ✅ Gunakan Production Server sebagai sumber data utama
export const DEFAULT_API_BASE_URL = "https://lms2.maskumambang.ac.id/api/v1";
export const PROD_API_BASE_URL = "https://lms2.maskumambang.ac.id/api/v1";
export const LOCAL_API_BASE_URL = "http://172.20.10.5:5001/api/v1"; // Local Dev (opsional)

export const STORAGE_KEYS = {
  AUTH_TOKEN: "@lms_auth_token",
  USER_DATA: "@lms_user_data",
  API_BASE_URL: "@lms_api_base_url",
  BIOMETRIC_ENABLED: "@lms_biometric_enabled",
  BIOMETRIC_CREDENTIALS: "lms_biometric_creds",
  BIOMETRIC_USER: "@lms_biometric_user",
};

export const APP_CONFIG = {
  appName: "LMS Maskumambang",
  appVersion: "1.0.0",
  schoolName: "Pondok Pesantren Maskumambang",
};
