/**
 * Common transformation and API utilities
 */

import { getApiBaseUrl } from '@/lib/config';

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

  let mediaPath: string;

  // Already has /api prefix → strip it (apiBase already includes /api)
  if (filePath.startsWith('/api/media/stream') || filePath.startsWith('/api/social/media/') || filePath.startsWith('/api/media/')) {
    mediaPath = filePath.replace(/^\/api/, '');
  }
  // Relative /media/ path
  else if (filePath.startsWith('/media/')) {
    mediaPath = filePath;
  }
  // Raw R2 key → wrap in /media/stream/ endpoint
  else {
    mediaPath = `/media/stream/?path=${encodeURIComponent(filePath)}`;
  }

  const fullUrl = `${apiBase}${mediaPath}`;

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
 * Normalize auth-related backend errors to friendly Vietnamese messages.
 */
export const mapAuthErrorMessage = (input: string): string => {
  const message = (input || '').trim();
  const normalized = message.toLowerCase();

  if (!message) return 'Đã có lỗi xảy ra';

  if (normalized.includes('user not active') || normalized.includes('inactive') || normalized.includes('disabled') || normalized.includes('deactivated')) {
    return 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.';
  }

  if (normalized.includes('too many') || normalized.includes('locked') || normalized.includes('temporarily locked')) {
    return 'Bạn đã nhập sai quá số lần cho phép. Tài khoản đang bị khóa tạm thời, vui lòng thử lại sau.';
  }

  if (normalized.includes('invalid credentials') || normalized.includes('incorrect password') || normalized.includes('wrong password')) {
    return 'Email hoặc mật khẩu không chính xác.';
  }

  if (normalized.includes('missing email') || normalized.includes('email is required')) {
    return 'Vui lòng nhập email.';
  }

  if (normalized.includes('invalid email') || normalized.includes('email format')) {
    return 'Email không đúng định dạng.';
  }

  if (normalized.includes('email not found') || normalized.includes('email chưa đăng ký') || normalized.includes('user not found') || normalized.includes('account not found')) {
    return 'Email chưa được đăng ký tài khoản.';
  }

  if (normalized.includes('missing email or otp') || normalized.includes('otp is required') || normalized.includes('missing otp') || normalized.includes('empty otp')) {
    return 'Vui lòng nhập mã OTP.';
  }

  if (normalized.includes('invalid otp') || normalized.includes('otp không đúng') || normalized.includes('incorrect otp')) {
    return 'Mã OTP không chính xác.';
  }

  if (normalized.includes('otp expired') || normalized.includes('expired otp') || normalized.includes('otp hết hạn')) {
    return 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại OTP.';
  }

  if (normalized.includes('too many otp attempts') || (normalized.includes('otp') && normalized.includes('attempt'))) {
    return 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu gửi mã OTP mới.';
  }

  if (normalized.includes('same as old password') || normalized.includes('new password must be different') || normalized.includes('trùng mật khẩu cũ')) {
    return 'Mật khẩu mới không được trùng với mật khẩu cũ.';
  }

  if (normalized.includes('not found') && normalized.includes('forgot')) {
    return 'Chức năng quên mật khẩu hiện chưa khả dụng trên môi trường này. Vui lòng liên hệ quản trị viên.';
  }

  return message;
};

/**
 * Handle generic error messages
 */
export const getErrorMessage = (error: any): string => {
  if (!error) return '';

  const detail = error?.response?.data?.detail;
  const message = error?.response?.data?.message;
  const status = error?.response?.status;

  let resolved = '';

  if (detail) {
    if (Array.isArray(detail)) {
      resolved = detail.map((d: any) => d.msg || d.message || String(d)).join(', ');
    } else if (typeof detail === 'object') {
      resolved = detail.msg || detail.message || JSON.stringify(detail);
    } else {
      resolved = String(detail);
    }
  } else {
    resolved = message || error?.message || 'Đã có lỗi xảy ra';
  }

  if (status === 404 && (String(error?.config?.url || '').includes('/auth/forgot-password') || String(error?.config?.url || '').includes('/auth/reset-password'))) {
    return 'Chức năng quên mật khẩu hiện chưa khả dụng trên môi trường này. Vui lòng liên hệ quản trị viên.';
  }

  return mapAuthErrorMessage(resolved);
};
