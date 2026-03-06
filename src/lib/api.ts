import type { AxiosRequestConfig } from 'axios';
import type { ZodType } from 'zod';
import { getApiBaseUrl } from '@/lib/config';
import { createApiClient } from '@/lib/api/createApiClient';
import { attachRequestInterceptor } from '@/lib/api/attachRequestInterceptor';
import { attachResponseInterceptor } from '@/lib/api/attachResponseInterceptor';
import { safeParseResponse } from '@/lib/api/zodValidation';

const baseURL = getApiBaseUrl();

const apiClient = createApiClient(baseURL);
attachRequestInterceptor(apiClient);
attachResponseInterceptor(apiClient, baseURL);

type CustomInstanceOptions = AxiosRequestConfig & {
  /** Optional Zod schema for dev-mode response validation (non-throwing). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  zodSchema?: ZodType<any>;
};

/**
 * Core HTTP client for all API calls.
 * The response interceptor automatically unwraps ApiResponse<T> envelopes,
 * so T here is the final payload type (not the envelope).
 * Optionally validates responses against a Zod schema in development mode.
 */
export const customInstance = <T,>(
  config: AxiosRequestConfig,
  options?: CustomInstanceOptions,
): Promise<T> => {
  const { zodSchema, ...axiosOptions } = options ?? {};
  return apiClient({
    ...config,
    ...axiosOptions,
  }).then(({ data }) => {
    if (zodSchema) {
      return safeParseResponse(zodSchema, data);
    }
    return data as T;
  });
};
export default apiClient;
