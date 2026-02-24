import type { AxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from '@/lib/config';
import { createApiClient } from '@/lib/api/createApiClient';
import { attachRequestInterceptor } from '@/lib/api/attachRequestInterceptor';
import { attachResponseInterceptor } from '@/lib/api/attachResponseInterceptor';

const baseURL = getApiBaseUrl();

const apiClient = createApiClient(baseURL);
attachRequestInterceptor(apiClient);
attachResponseInterceptor(apiClient, baseURL);
/**
 * Custom instance wrapper for React Query compatibility.
 * Unwraps response data automatically.
 */
export const customInstance = <T,>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient({
    ...config,
    ...options,
    skipUnwrap: true,
  }).then(({ data }) => data as T);
};
export default apiClient;
