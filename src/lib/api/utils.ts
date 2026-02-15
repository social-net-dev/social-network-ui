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
