/**
 * Common transformation and API utilities
 */

/**
 * Append auth token to URL for browser-native requests (img src, etc.)
 */
export const appendAuthToken = (url: string | null | undefined): string => {
  if (!url) return '';
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) return url;
    
    // Clean token if it has quotes from JSON.stringify
    const cleanToken = token.replace(/"/g, "");
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}access_token=${encodeURIComponent(cleanToken)}`;
  } catch (e) {
    return url;
  }
};

/**
 * Handle generic error messages
 */
export const getErrorMessage = (error: any): string => {
  return error?.response?.data?.detail || error?.message || "Đã có lỗi xảy ra";
};
