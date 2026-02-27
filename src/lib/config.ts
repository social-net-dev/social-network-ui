declare global {
  interface Window {
    __ENV__?: {
      VITE_API_BASE_URL?: string;
    };
  }
}

export const getApiBaseUrl = (): string => {
  // Ưu tiên runtime config -> environment variable -> default
  if (typeof window !== 'undefined' && window.__ENV__?.VITE_API_BASE_URL) {
    return window.__ENV__.VITE_API_BASE_URL;
  }

  if (import.meta.env.DEV) {
    // Dev: gọi thẳng etechs-middleware (Django API dưới /api/)
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';
  }

  return import.meta.env.VITE_API_BASE_URL || '/api';
};

/**
 * Get Message Service Base URL (different microservice)
 */
export const getMessageApiUrl = (): string => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL_MESSAGE || 'http://localhost:8001';
  }
  return import.meta.env.VITE_API_URL_MESSAGE || '/api-message';
};

/**
 * WebSocket URL cho notifications (etechs-middleware: ws/notifications/).
 * Từ API base URL suy ra host: http(s) -> ws(s), bỏ suffix /api.
 */
export const getNotificationWebSocketUrl = (): string => {
  const base = getApiBaseUrl().trim().replace(/\/$/, '');
  if (base.startsWith('http://')) {
    const host =
      base
        .slice(7)
        .replace(/\/api$/, '')
        .replace(/\/+$/g, '') || 'localhost:8001';
    return `ws://${host}/ws/social/notifications/`;
  }
  if (base.startsWith('https://')) {
    const host =
      base
        .slice(8)
        .replace(/\/api$/, '')
        .replace(/\/+$/g, '') ||
      window?.location?.host ||
      'localhost';
    return `wss://${host}/ws/social/notifications/`;
  }
  // Relative path (e.g. /api) -> same origin
  const protocol = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? 'wss:' : 'ws:';
  const origin = typeof window !== 'undefined' ? window.location.host : 'localhost';
  return `${protocol}//${origin}/ws/social/notifications/`;
};

/**
 * WebSocket URL cho chat (etechs-middleware: ws/ hoặc ws/chat/).
 * UI kết nối với query user_id & room_id.
 */
export const getChatWebSocketUrl = (): string => {
  // Use message service base (may be a different microservice host)
  const base = getMessageApiUrl().trim().replace(/\/$/, '');
  if (base.startsWith('http://')) {
    const host =
      base
        .slice(7)
        .replace(/\/api$/, '')
        .replace(/\/+$/g, '') || 'localhost:8000';
    return `ws://${host}/ws`;
  }
  if (base.startsWith('https://')) {
    const host =
      base
        .slice(8)
        .replace(/\/api$/, '')
        .replace(/\/+$/g, '') ||
      window?.location?.host ||
      'localhost';
    return `wss://${host}/ws`;
  }
  const protocol = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? 'wss:' : 'ws:';
  const origin = typeof window !== 'undefined' ? window.location.host : 'localhost';
  return `${protocol}//${origin}/ws`;
};
