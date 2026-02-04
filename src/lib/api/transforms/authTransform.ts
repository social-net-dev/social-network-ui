import { Models } from '../generated';
import { transformAuthor } from './userTransform';

/**
 * Transform RegisterResponse to Frontend format
 */
export const transformRegisterResponse = (response: Models.RegisterResponse) => {
  return {
    message: "OTP đã được gửi", // Standard message as it's missing from BE response
    userId: response.user_id,
    accountStatus: response.account_status,
  };
};

/**
 * Transform Auth response (login) if needed
 * Note: Our current generated model might differ from manual AuthResponse
 */
export const transformAuthResponse = (data: any) => {
  // Manual check of the actual response structure from dev-tools/interceptors
  const innerData = data?.data || data;
  return {
    user: transformAuthor(innerData.user),
    token: innerData.token || innerData.access_token,
    refreshToken: innerData.refresh_token || innerData.refreshToken,
  };
};
