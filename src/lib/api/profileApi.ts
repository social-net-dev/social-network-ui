import api from '@/lib/api';
import type { ProfileResponse } from '@/types/profile.types';

/**
 * Get user profile by username
 * @param username - Email or username (e.g., alice2@test.com)
 * @param tenantSlug - Tenant slug from auth (e.g., t-bd8565ff-be35-454a-b873-db6c84498afd)
 * @returns User profile data (already unwrapped by axios interceptor)
 */
export const getProfile = (username: string, tenantSlug: string) => {
  console.log('[ProfileAPI] Calling getProfile:', { username, tenantSlug, url: `/profiles/${username}/` });
  // Axios interceptor unwraps { success, data } -> response.data is the actual user object
  return api.get<ProfileResponse['data']>(`/profiles/${username}/`, {
    headers: {
      'x-tenant-slug': tenantSlug,
    },
  });
};

/**
 * Extract user ID from tenant slug
 * Removes "t-" prefix from tenant slug to get user ID
 * @param tenantSlug - Tenant slug (e.g., "t-bd8565ff-be35-454a-b873-db6c84498afd")
 * @returns User ID (e.g., "bd8565ff-be35-454a-b873-db6c84498afd")
 */
export const extractUserIdFromTenantSlug = (tenantSlug: string): string => {
  if (tenantSlug && tenantSlug.startsWith('t-')) {
    return tenantSlug.substring(2); // Remove "t-" prefix
  }
  return tenantSlug;
};
