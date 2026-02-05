/**
 * Common transformation and API utilities
 */

/**
 * Append auth token to URL for browser-native requests (img src, etc.)
 */
export const appendAuthToken = (url: string | null | undefined): string => {
  if (!url) return '';

  // Don't append token to absolute URLs (external resources)
  if (url.startsWith('http')) return url;

  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return url;

    // Clean token if it has quotes from JSON.stringify
    const cleanToken = token.replace(/"/g, '');
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}access_token=${encodeURIComponent(cleanToken)}`;
  } catch (e) {
    return url;
  }
};

/**
 * Handle generic error messages
 */
export const getErrorMessage = (error: any): string => {
  if (!error) return '';

  const detail = error?.response?.data?.detail;

  if (detail) {
    if (Array.isArray(detail)) {
      return detail.map((d: any) => d.msg || d.message || String(d)).join(', ');
    }
    if (typeof detail === 'object') {
      return detail.msg || detail.message || JSON.stringify(detail);
    }
    return String(detail);
  }

  return error?.response?.data?.message || error?.message || 'Đã có lỗi xảy ra';
};
