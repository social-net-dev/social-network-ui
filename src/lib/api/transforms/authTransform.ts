import { transformAuthor } from './userTransform';

type Envelope<T> = { data?: T };

function unwrapEnvelope<T>(value: unknown): T | unknown {
  if (value && typeof value === 'object' && 'data' in value) {
    return (value as Envelope<T>).data;
  }
  return value;
}

/**
 * Transform RegisterResponse to Frontend format
 */
export const transformRegisterResponse = (response: unknown) => {
  const innerData = unwrapEnvelope<unknown>(response);
  return {
    message: "OTP đã được gửi",
    userId:
      innerData && typeof innerData === 'object' && 'id' in innerData
        ? String((innerData as { id: unknown }).id)
        : undefined,
    accountStatus:
      innerData && typeof innerData === 'object' && 'account_status' in innerData
        ? (innerData as { account_status: unknown }).account_status
        : undefined,
  };
};

/**
 * Transform Auth response (login) if needed
 */
export const transformAuthResponse = (data: unknown) => {
  const innerData = unwrapEnvelope<unknown>(data);
  return {
    user:
      innerData && typeof innerData === 'object' && 'user' in innerData
        ? transformAuthor(
            (innerData as { user: unknown }).user && typeof (innerData as { user: unknown }).user === 'object'
              ? ((innerData as { user: unknown }).user as Record<string, unknown>)
              : undefined
          )
        : null,
    token:
      innerData && typeof innerData === 'object'
        ? ((innerData as Record<string, unknown>).access ??
            (innerData as Record<string, unknown>).token ??
            (innerData as Record<string, unknown>).access_token)
        : undefined,
    refreshToken:
      innerData && typeof innerData === 'object'
        ? ((innerData as Record<string, unknown>).refresh ??
            (innerData as Record<string, unknown>).refresh_token ??
            (innerData as Record<string, unknown>).refreshToken)
        : undefined,
    tenantSlug:
      innerData && typeof innerData === 'object'
        ? ((innerData as Record<string, unknown>).tenant_slug ??
            (innerData as Record<string, unknown>).tenantSlug)
        : undefined,
  };
};
