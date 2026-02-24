import type { AxiosInstance } from 'axios';
import { AUTH_STORAGE_KEYS, PUBLIC_AUTH_PATHS } from '@/lib/auth.constants';

export function isPublicAuthRequest(apiClient: AxiosInstance, url: string | undefined): boolean {
  if (!url) return false;
  const path = url.replace(apiClient.defaults.baseURL || '', '').split('?')[0];
  return PUBLIC_AUTH_PATHS.some(p => path === p || path === `${p}/`);
}

export function getTokenFromStorage(): string | null {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
  return token ? token.replace(/"/g, '') : null;
}

export function getRefreshTokenFromStorage(): string | null {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  return token ? token.replace(/"/g, '') : null;
}

export function getTenantSlugFromStorage(): string | null {
  const slug = localStorage.getItem(AUTH_STORAGE_KEYS.TENANT_SLUG);
  return slug ? slug.replace(/"/g, '') : null;
}
