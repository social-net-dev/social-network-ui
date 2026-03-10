import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { AUTH_STORAGE_KEYS } from '@/lib/auth.constants';
import { getRefreshTokenFromStorage, isPublicAuthRequest } from './authRequestGuards';

function unwrapResponse(response: AxiosResponse): AxiosResponse {
  const d = response.data;
  if (d && typeof d === 'object' && (d as Record<string, unknown>).success === true && 'data' in d) {
    response.data = (d as { data: unknown }).data;
  }
  return response;
}

export function attachResponseInterceptor(apiClient: AxiosInstance, baseURL: string, refreshBaseURL?: string): void {
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

  apiClient.interceptors.response.use(
    response => {
      const cfg = response.config as unknown as { skipUnwrap?: boolean };
      if (cfg.skipUnwrap) return response;
      return unwrapResponse(response);
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !isPublicAuthRequest(apiClient, originalRequest.url)
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => apiClient(originalRequest))
            .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = getRefreshTokenFromStorage();

        if (!refreshToken) {
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
          const refreshRoot = (refreshBaseURL ?? baseURL).replace(/\/$/, '');
          const refreshURL = `${refreshRoot}/auth/refresh/`;
          const response = await axios.post(refreshURL, { refresh: refreshToken });

          const responseData = response.data as unknown;
          const payload =
            responseData && typeof responseData === 'object' && 'data' in responseData
              ? (responseData as { data: unknown }).data
              : responseData;

          const tokenSource = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : undefined;
          const newAccessToken = (tokenSource?.access ?? tokenSource?.access_token) as string | undefined;

          if (!newAccessToken) {
            throw new Error('No access token in refresh response');
          }

          localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, newAccessToken);

          const authStore = useAuthStore.getState();
          authStore.setAuth({
            token: newAccessToken,
            refreshToken: refreshToken,
            tenantSlug: authStore.tenantSlug ?? undefined,
            user: authStore.user ?? undefined,
          });

          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

          processQueue(null);

          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError as AxiosError);

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
}
