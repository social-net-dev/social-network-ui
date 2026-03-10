import type { AxiosRequestConfig } from 'axios';
import type { ZodType } from 'zod';
import { getApiBaseUrl, getSocialApiUrl } from '@/lib/config';
import { createApiClient } from '@/lib/api/createApiClient';
import { attachRequestInterceptor } from '@/lib/api/attachRequestInterceptor';
import { attachResponseInterceptor } from '@/lib/api/attachResponseInterceptor';
import { safeParseResponse } from '@/lib/api/zodValidation';

const authBaseURL = getApiBaseUrl();
const socialBaseURL = getSocialApiUrl();

// Auth + Users service (Django middleware)
const authApiClient = createApiClient(authBaseURL);
attachRequestInterceptor(authApiClient);
attachResponseInterceptor(authApiClient, authBaseURL);

// Social service (FastAPI — posts, feed, comments, follows, friends, notifications, …)
// Token refresh always routes to the auth service URL.
const socialApiClient = createApiClient(socialBaseURL);
attachRequestInterceptor(socialApiClient);
attachResponseInterceptor(socialApiClient, socialBaseURL, authBaseURL);

// URL prefixes that belong to the auth/users service (Django)
const AUTH_SERVICE_PREFIXES = ['/auth', '/users'];

function isSocialEndpoint(url = ''): boolean {
  return !AUTH_SERVICE_PREFIXES.some(prefix => url === prefix || url.startsWith(`${prefix}/`));
}

type CustomInstanceOptions = AxiosRequestConfig & {
  /** Optional Zod schema for dev-mode response validation (non-throwing). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  zodSchema?: ZodType<any>;
};

/**
 * Core HTTP mutator for all Orval-generated API calls.
 * Routes requests to the correct Axios instance based on the URL prefix:
 *   - /auth/* and /users/* → authApiClient  (Django middleware)
 *   - everything else      → socialApiClient (FastAPI social service)
 *
 * Both clients share the same interceptors (auth token injection,
 * envelope unwrapping, token refresh via auth service).
 */
export const customInstance = <T,>(
  config: AxiosRequestConfig,
  options?: CustomInstanceOptions,
): Promise<T> => {
  const { zodSchema, ...axiosOptions } = options ?? {};
  const client = isSocialEndpoint(config.url) ? socialApiClient : authApiClient;
  return client({
    ...config,
    ...axiosOptions,
  }).then(({ data }) => {
    if (zodSchema) {
      return safeParseResponse(zodSchema, data);
    }
    return data as T;
  });
};

export default authApiClient;
