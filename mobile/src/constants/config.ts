// mobile/src/constants/config.ts

export const DEFAULT_API_BASE_URL = "http://192.168.1.100:3000/api"; // Default Local Dev / Change to VPS
export const PROD_API_BASE_URL = "https://lms.maskumambang.sch.id/api";

export const STORAGE_KEYS = {
  AUTH_TOKEN: "@lms_auth_token",
  USER_DATA: "@lms_user_data",
  API_BASE_URL: "@lms_api_base_url",
};

export const APP_CONFIG = {
  appName: "LMS Maskumambang",
  appVersion: "1.0.0",
  schoolName: "Pondok Pesantren Maskumambang",
};
