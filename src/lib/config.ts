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
    return import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  }

  return import.meta.env.VITE_API_BASE_URL || "/api";
};
