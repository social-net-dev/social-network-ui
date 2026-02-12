/**
 * Common transformation and API utilities
 */

/**
 * Build the media stream URL for an R2 file path.
 * If the path is already an absolute URL or a stream URL, return it as-is.
 * Otherwise, construct: /media/stream/?path=<encoded_key>&access_token=<jwt>
 */
export const buildMediaUrl = (filePath: string | null | undefined): string => {
  if (!filePath) return '';

  // Already an absolute URL (e.g. https://cdn.example.com/...)
  if (filePath.startsWith('http')) return filePath;

  // Already a media stream URL
  if (filePath.startsWith('/media/stream') || filePath.startsWith('/api/media/stream')) {
    return appendAuthToken(filePath);
  }

  // Already a /api/social/media/ style URL (legacy)
  if (filePath.startsWith('/api/social/media/') || filePath.startsWith('/api/media/')) {
    return appendAuthToken(filePath);
  }

  // Raw R2 key → construct stream URL
  const streamUrl = `/media/stream/?path=${encodeURIComponent(filePath)}`;
  return appendAuthToken(streamUrl);
};

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
