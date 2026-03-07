import type { AxiosInstance } from 'axios';
import { PUBLIC_AUTH_PATHS } from '@/lib/auth.constants';
import { useAuthStore } from '@/stores/authStore';

export function isPublicAuthRequest(apiClient: AxiosInstance, url: string | undefined): boolean {
  if (!url) return false;
  const path = url.replace(apiClient.defaults.baseURL || '', '').split('?')[0];
  return PUBLIC_AUTH_PATHS.some(p => path === p || path === `${p}/`);
}

export function getTokenFromStorage(): string | null {
  return useAuthStore.getState().token;
}

export function getRefreshTokenFromStorage(): string | null {
  return useAuthStore.getState().refreshToken;
}

export function getTenantSlugFromStorage(): string | null {
  return useAuthStore.getState().tenantSlug ?? null;
}
