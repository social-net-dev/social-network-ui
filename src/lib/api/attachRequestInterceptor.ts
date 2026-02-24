import type { AxiosInstance } from 'axios';
import { getTenantSlugFromStorage, getTokenFromStorage, isPublicAuthRequest } from './authRequestGuards';

export function attachRequestInterceptor(apiClient: AxiosInstance): void {
  apiClient.interceptors.request.use(
    config => {
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }

      if (!isPublicAuthRequest(apiClient, config.url)) {
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
    error => Promise.reject(error)
  );
}
