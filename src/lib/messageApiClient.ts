/**
 * Axios Instance for Message Microservice (port 8001)
 * Separate from main API (port 8000) because message is a different microservice
 */
import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getMessageApiUrl } from '@/lib/config';

const messageApiClient = axios.create({
  baseURL: getMessageApiUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// REQUEST INTERCEPTOR - Add Auth Token
// ============================================
messageApiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const cleanToken = token.replace(/"/g, '');
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    const tenantSlug = localStorage.getItem('tenant_slug');
    if (tenantSlug) {
      const cleanSlug = tenantSlug.replace(/"/g, '');
      config.headers['X-Tenant-Slug'] = cleanSlug;
      console.log(`[Message API] 🔑 Auto-added X-Tenant-Slug: ${cleanSlug} to ${config.url}`);
    }
    return config;
  },
  error => Promise.reject(error)
);

// ============================================
// RESPONSE INTERCEPTOR - Unwrap if needed
// ============================================
messageApiClient.interceptors.response.use(
  response => {
    // If message service returns { success, data } format, unwrap it
    const d = response.data;
    if (d && typeof d === 'object' && (d as Record<string, unknown>).success === true && 'data' in d) {
      response.data = (d as { data: unknown }).data;
    }
    return response;
  },
  error => Promise.reject(error)
);

export default messageApiClient;
