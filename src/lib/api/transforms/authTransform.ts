import { transformAuthor } from './userTransform';

/**
 * Transform RegisterResponse to Frontend format
 */
export const transformRegisterResponse = (response: any) => {
  return {
    message: "OTP đã được gửi",
    userId: response.user_id,
    accountStatus: response.account_status,
  };
};

/**
 * Transform Auth response (login) if needed
 */
export const transformAuthResponse = (data: any) => {
  const innerData = data?.data || data;
  return {
    user: innerData?.user ? transformAuthor(innerData.user) : null,
    token: innerData?.access || innerData?.token || innerData?.access_token,
    refreshToken: innerData?.refresh || innerData?.refresh_token || innerData?.refreshToken,
    tenantSlug: innerData?.tenant_slug || innerData?.tenantSlug,
  };
};
