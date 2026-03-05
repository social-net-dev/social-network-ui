/**
 * Social Service Axios Client
 * Points to social-servece (FastAPI, port 8003/api).
 * Handles: posts, comments, reactions, friends, shares, feed.
 *
 * Auth: same JWT from localStorage as authClient.
 * NOTE: FastAPI returns plain JSON — NO { success: true, data: T } unwrap needed.
 */
import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { getSocialApiUrl, getApiBaseUrl } from '@/lib/config';
import { AUTH_STORAGE_KEYS } from '@/lib/auth.constants';

const socialBaseURL = getSocialApiUrl();

const socialClient = axios.create({
  baseURL: socialBaseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// REFRESH STATE (independent from authClient)
// ============================================
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// ============================================
// HELPERS
// ============================================
function getTokenFromStorage(): string | null {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
  return token ? token.replace(/"/g, '') : null;
}

function getTenantSlugFromStorage(): string | null {
  const slug = localStorage.getItem(AUTH_STORAGE_KEYS.TENANT_SLUG);
  return slug ? slug.replace(/"/g, '') : null;
}

// ============================================
// REQUEST INTERCEPTOR — attach token
// ============================================
socialClient.interceptors.request.use(
  config => {
    // Let browser set multipart boundary automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const token = getTokenFromStorage();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tenantSlug = getTenantSlugFromStorage();
    if (tenantSlug) {
      config.headers['X-Tenant-Slug'] = tenantSlug;
    }

    return config;
  },
  error => Promise.reject(error)
);

// ============================================
// RESPONSE INTERCEPTOR — refresh on 401
// ============================================
socialClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => socialClient(originalRequest))
        .catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)?.replace(/"/g, '');

    if (!refreshToken) {
      processQueue(error);
      isRefreshing = false;
      localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
      localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
      try {
        useAuthStore.getState().logout();
      } catch {
        /* ignore */
      }
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // Always call the middleware refresh endpoint (auth lives on port 8001)
      const authBase = getApiBaseUrl().replace(/\/$/, '');
      const refreshURL = `${authBase}/auth/refresh/`;
      const response = await axios.post(refreshURL, { refresh: refreshToken });

      const payload = response.data?.data ?? response.data;
      const newAccessToken = payload?.access ?? payload?.access_token;

      if (!newAccessToken) throw new Error('No access token in refresh response');

      localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, JSON.stringify(newAccessToken));
      socialClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

      processQueue(null);
      isRefreshing = false;

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return socialClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError);
      isRefreshing = false;
      localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
      localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
      try {
        useAuthStore.getState().logout();
      } catch {
        /* ignore */
      }
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

export default socialClient;
