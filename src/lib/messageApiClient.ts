/**
 * Axios Instance for Message Microservice (port 8001)
 * Separate from main API (port 8000) because message is a different microservice
 */
import axios from 'axios';
import { getMessageApiUrl } from '@/lib/config';
import { useAuthStore } from '@/stores/authStore';

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
    const { token, tenantSlug } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tenantSlug) {
      config.headers['X-Tenant-Slug'] = tenantSlug;
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
