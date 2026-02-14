/**
 * Unified Axios Instance
 * - Refresh token logic with queue
 * - Public auth paths (no token sent)
 * - Unwrap middleware response { success: true, data: T }
 * - Tenant header support
 *
 * Used by:
 * - Manual API services (authApi, postsApi, usersApi, etc.)
 */
import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { getApiBaseUrl } from '@/lib/config';
import { AUTH_STORAGE_KEYS, PUBLIC_AUTH_PATHS } from '@/lib/auth.constants';

// baseURL: dev -> etechs-middleware (http://localhost:8000/api); production -> /api (Caddy -> etechs-middleware)
const baseURL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// REFRESH TOKEN QUEUE
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
// HELPER FUNCTIONS
// ============================================
function isPublicAuthRequest(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.replace(apiClient.defaults.baseURL || '', '').split('?')[0];
  return PUBLIC_AUTH_PATHS.some(p => path === p || path === `${p}/`);
}

function getTokenFromStorage(): string | null {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
  return token ? token.replace(/"/g, '') : null;
}

function getTenantSlugFromStorage(): string | null {
  const slug = localStorage.getItem(AUTH_STORAGE_KEYS.TENANT_SLUG);
  return slug ? slug.replace(/"/g, '') : null;
}

// ============================================
// REQUEST INTERCEPTOR
// ============================================
apiClient.interceptors.request.use(
  config => {
    // When sending FormData, remove explicit Content-Type so the browser
    // auto-sets it with the correct multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    if (!isPublicAuthRequest(config.url)) {
      const token = getTokenFromStorage();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const tenantSlug = getTenantSlugFromStorage();
      if (tenantSlug) {
        config.headers['X-Tenant-Slug'] = tenantSlug;
      }
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE UNWRAP
// ============================================
// Unwrap middleware format: { success: true, data: T } -> response.data = T
function unwrapResponse(response: AxiosResponse): AxiosResponse {
  const d = response.data;
  if (d && typeof d === 'object' && (d as Record<string, unknown>).success === true && 'data' in d) {
    response.data = (d as { data: unknown }).data;
  }
  return response;
}

// ============================================
// RESPONSE INTERCEPTOR WITH REFRESH TOKEN
// ============================================
apiClient.interceptors.response.use(
  response => unwrapResponse(response),
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and not already retrying, AND NOT a public auth request
    if (error.response?.status === 401 && !originalRequest._retry && !isPublicAuthRequest(originalRequest.url)) {
      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)?.replace(/"/g, '');

      if (!refreshToken) {
        // No refresh token, logout
        localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
        localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
        try {
          useAuthStore.getState().logout();
        } catch {
          // ignore
        }
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Call refresh token endpoint (etechs-middleware expects "refresh")
        const refreshURL = baseURL.endsWith('/') ? `${baseURL}auth/refresh/` : `${baseURL}/auth/refresh/`;
        const response = await axios.post(refreshURL, { refresh: refreshToken });
        
        // Handle wrapped response: { data: { access: "..." } } or { access: "..." }
        const payload = response.data?.data ?? response.data;
        const newAccessToken = payload?.access ?? payload?.access_token;

        if (!newAccessToken) {
          throw new Error('No access token in refresh response');
        }

        // Save new token to localStorage
        localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, newAccessToken);

        // Update auth store state
        const authStore = useAuthStore.getState();
        authStore.setAuth({
          token: newAccessToken,
          refreshToken: refreshToken,
          tenantSlug: authStore.tenantSlug ?? undefined,
          user: authStore.user ?? undefined,
        });

        // Update axios default header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

        processQueue(null);

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        // Refresh token failed, logout
        localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
        localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
        try {
          useAuthStore.getState().logout();
        } catch {
          // ignore
        }
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
/**
 * Custom instance wrapper for React Query compatibility.
 * Unwraps response data automatically.
 */
export const customInstance = <T,>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient({
    ...config,
    ...options,
  }).then(({ data }) => data as T);
};
export default apiClient;
