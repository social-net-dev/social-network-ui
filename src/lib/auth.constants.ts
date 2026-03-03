/**
 * Auth constants and storage keys
 */

export const AUTH_STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  TENANT_SLUG: 'tenant_slug',
} as const;

export const AUTH_STORE_NAME = 'auth-storage';

/**
 * Public auth paths that don't require token
 */
export const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/me', '/register/email/request', '/register/email/confirm', '/auth/forgot-password', '/auth/reset-password', '/auth/refresh'] as const;
