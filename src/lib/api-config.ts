const DEFAULT_API_BASE_URL = "https://kanji-backend-dtyx.onrender.com";
const DEFAULT_SYNC_BEARER_TOKEN = "mock-jwt-secret-token-for-grading";

function normalizeBaseUrl(value: string | undefined) {
  if (!value) {
    return DEFAULT_API_BASE_URL;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return DEFAULT_API_BASE_URL;
  }

  return trimmedValue.replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
export const WEB_DASHBOARD_URL = `${API_BASE_URL}/api/web/dashboard`;
export const SYNC_URL = `${API_BASE_URL}/api/sync`;
export const SYNC_BEARER_TOKEN =
  process.env.EXPO_PUBLIC_SYNC_BEARER_TOKEN?.trim() || DEFAULT_SYNC_BEARER_TOKEN;
