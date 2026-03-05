/**
 * Common transformation and API utilities
 */

import { getApiBaseUrl, getSocialApiUrl } from '@/lib/config';

/**
 * Read the JWT auth token from localStorage (remove surrounding quotes if any).
 */
const getAuthToken = (): string => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return '';
    return token.replace(/"/g, '');
  } catch {
    return '';
  }
};

/**
 * Get a default avatar URL (Facebook style silhouette)
 */
export const getDefaultAvatar = (): string => {
  // Trả về một SVG silhouette đơn giản giống Facebook
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#E4E6EB"/>
      <path d="M50 50C61.0457 50 70 41.0457 70 30C70 18.9543 61.0457 10 50 10C38.9543 10 30 18.9543 30 30C30 41.0457 38.9543 50 50 50Z" fill="#8A8D91"/>
      <path d="M50 60C30 60 10 75 10 100H90C90 75 70 60 50 60Z" fill="#8A8D91"/>
    </svg>
  `)}`;
};

/**
 * Build an **absolute** media stream URL for an R2 file path.
 *
 * Returns a full URL (including API base + auth token) that can be used
 * directly in `<img src>`, CSS `background-image`, etc.
 *
 * Examples (dev):
 *   "avatars/t/u/file.jpg"
 *     → "http://localhost:8001/api/media/stream/?path=avatars%2Ft%2Fu%2Ffile.jpg&access_token=…"
 *   "/media/stream/?path=…"
 *     → "http://localhost:8001/api/media/stream/?path=…&access_token=…"
 */
export const buildMediaUrl = (filePath: string | null | undefined): string => {
  if (!filePath) return '';

  // Already an absolute external URL — return as-is
  if (filePath.startsWith('http')) return filePath;

  const apiBase = getApiBaseUrl().replace(/\/+$/, '');
  // Social service host for static /media/ uploads (port 8003)
  const socialBase = getSocialApiUrl().replace(/\/api\/?$/, '');

  let mediaPath: string;
  let baseToUse = apiBase;

  // Already has /api prefix → strip it (apiBase already includes /api)
  if (filePath.startsWith('/api/media/stream') || filePath.startsWith('/api/social/media/') || filePath.startsWith('/api/media/')) {
    mediaPath = filePath.replace(/^\/api/, '');
  }
  // Static /media/ file served by social-servece (NOT the stream endpoint)
  else if (filePath.startsWith('/media/') && !filePath.startsWith('/media/stream')) {
    mediaPath = filePath;
    baseToUse = socialBase; // e.g. http://localhost:8003
  }
  // Relative /media/ path (includes stream)
  else if (filePath.startsWith('/media/')) {
    mediaPath = filePath;
  }
  // Raw R2 key → wrap in /media/stream/ endpoint
  else {
    mediaPath = `/media/stream/?path=${encodeURIComponent(filePath)}`;
  }

  const fullUrl = `${baseToUse}${mediaPath}`;

  // Append auth token
  const cleanToken = getAuthToken();
  if (!cleanToken) return fullUrl;
  const separator = fullUrl.includes('?') ? '&' : '?';
  return `${fullUrl}${separator}access_token=${encodeURIComponent(cleanToken)}`;
};

/**
 * Build a **relative** media stream path for an R2 file path.
 *
 * Returns a path like `/media/stream/?path=…&access_token=…` that is
 * suitable for fetching via axios (which already has baseURL configured).
 *
 * Use this for media fetched through `useMediaBlobs` / `customInstance`
 * (post images, comment images, etc.).
 */
export const buildMediaPath = (filePath: string | null | undefined): string => {
  if (!filePath) return '';

  // Already an absolute external URL — return as-is
  if (filePath.startsWith('http')) return filePath;

  let mediaPath: string;

  // Already a full /api/... stream URL → strip /api prefix (axios base already has /api)
  if (filePath.startsWith('/api/media/stream') || filePath.startsWith('/api/social/media/') || filePath.startsWith('/api/media/')) {
    mediaPath = filePath.replace(/^\/api/, '');
  }
  // Already a relative /media/ path
  else if (filePath.startsWith('/media/')) {
    mediaPath = filePath;
  }
  // Raw R2 key → wrap in /media/stream/ endpoint
  else {
    mediaPath = `/media/stream/?path=${encodeURIComponent(filePath)}`;
  }

  // Append auth token for URLs that might be used directly by the browser
  const cleanToken = getAuthToken();
  if (!cleanToken) return mediaPath;
  const separator = mediaPath.includes('?') ? '&' : '?';
  return `${mediaPath}${separator}access_token=${encodeURIComponent(cleanToken)}`;
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
