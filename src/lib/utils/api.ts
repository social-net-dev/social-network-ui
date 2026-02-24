import { getApiBaseUrl } from '@/lib/config';

const getAuthToken = (): string => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return '';
    return token.replace(/"/g, '');
  } catch {
    return '';
  }
};

export const getDefaultAvatar = (): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#E4E6EB"/>
      <path d="M50 50C61.0457 50 70 41.0457 70 30C70 18.9543 61.0457 10 50 10C38.9543 10 30 18.9543 30 30C30 41.0457 38.9543 50 50 50Z" fill="#8A8D91"/>
      <path d="M50 60C30 60 10 75 10 100H90C90 75 70 60 50 60Z" fill="#8A8D91"/>
    </svg>
  `)}`;

export const buildMediaUrl = (filePath: string | null | undefined): string => {
  if (!filePath) return getDefaultAvatar();
  if (filePath.startsWith('http')) return filePath;
  if (filePath.startsWith('data:')) return filePath;

  const apiBase = getApiBaseUrl();
  let mediaPath: string;

  if (
    filePath.startsWith('/api/media/stream') ||
    filePath.startsWith('/api/social/media/') ||
    filePath.startsWith('/api/media/')
  ) {
    mediaPath = filePath.replace(/^\/api/, '');
  } else if (filePath.startsWith('/media/')) {
    mediaPath = filePath;
  } else {
    mediaPath = `/media/stream/?path=${encodeURIComponent(filePath)}`;
  }

  const fullUrl = `${apiBase}${mediaPath}`;
  const cleanToken = getAuthToken();
  if (!cleanToken) return fullUrl;
  const separator = fullUrl.includes('?') ? '&' : '?';
  return `${fullUrl}${separator}access_token=${encodeURIComponent(cleanToken)}`;
};

export const buildMediaPath = (filePath: string | null | undefined): string => {
  if (!filePath) return '';
  if (filePath.startsWith('http')) return filePath;

  let mediaPath: string;

  if (
    filePath.startsWith('/api/media/stream') ||
    filePath.startsWith('/api/social/media/') ||
    filePath.startsWith('/api/media/')
  ) {
    mediaPath = filePath.replace(/^\/api/, '');
  } else if (filePath.startsWith('/media/')) {
    mediaPath = filePath;
  } else {
    mediaPath = `/media/stream/?path=${encodeURIComponent(filePath)}`;
  }

  const cleanToken = getAuthToken();
  if (!cleanToken) return mediaPath;
  const separator = mediaPath.includes('?') ? '&' : '?';
  return `${mediaPath}${separator}access_token=${encodeURIComponent(cleanToken)}`;
};

export const appendAuthToken = (url: string): string => {
  if (url.startsWith('http')) return url;
  try {
    const cleanToken = getAuthToken();
    if (!cleanToken) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}access_token=${encodeURIComponent(cleanToken)}`;
  } catch {
    return url;
  }
};

export const getErrorMessage = (error: unknown): string => {
  if (!error) return '';
  const e = error as { response?: { data?: { detail?: unknown; message?: string } }; message?: string };
  const detail = e?.response?.data?.detail;
  if (detail) {
    if (Array.isArray(detail)) return detail.map((d: unknown) => (d as { msg?: string; message?: string })?.msg || (d as { msg?: string; message?: string })?.message || String(d)).join(', ');
    if (typeof detail === 'object') return (detail as { msg?: string; message?: string })?.msg || (detail as { msg?: string; message?: string })?.message || JSON.stringify(detail);
    return String(detail);
  }
  return e?.response?.data?.message || e?.message || 'Đã có lỗi xảy ra';
};
