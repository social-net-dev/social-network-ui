/**
 * Manual API definitions for endpoints missing from OpenAPI spec
 * Follows the same pattern as generated code using customInstance
 */
import { customInstance } from '../axios-instance';

// ============================================================
// Auth (etechs-middleware)
// ============================================================

export type MiddlewareLoginResponse = {
  access: string;
  refresh: string;
  tenant_slug: string;
};

export const loginMiddleware = (email: string, password: string) => {
  return customInstance<MiddlewareLoginResponse>({
    url: '/auth/login/',
    method: 'POST',
    data: { email, password },
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export type VerifyRegisterOtpResponse = {
  tenant_id: string;
  tenant_slug: string;
  status: string;
};

export const verifyRegisterOtp = (user_id: string, otp: string) => {
  return customInstance<VerifyRegisterOtpResponse>({
    url: '/auth/verify-otp/',
    method: 'POST',
    data: { user_id, otp },
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const resendRegisterOtp = (user_id: string) => {
  return customInstance<{ message: string }>({
    url: '/auth/resend-otp/',
    method: 'POST',
    data: { user_id },
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// ============================================================
// Forgot password (etechs-middleware)
// ============================================================

export type ForgotPasswordResponse = {
  message: string;
  user_id?: string;
};

export const forgotPassword = (email: string) => {
  return customInstance<ForgotPasswordResponse>({
    url: '/auth/forgot-password/',
    method: 'POST',
    data: { email },
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const resetPassword = (user_id: string, otp: string, new_password: string) => {
  return customInstance<{ message: string }>({
    url: '/auth/reset-password/',
    method: 'POST',
    data: { user_id, otp, new_password },
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Change user password
 * POST /auth/change-password
 */
export const changePassword = (currentPassword: string, newPassword: string) => {
  const formData = new FormData();
  formData.append('current_password', currentPassword);
  formData.append('new_password', newPassword);

  return customInstance<{ message: string }>({
    url: '/auth/change-password/',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Self Deactivate with password
 * POST /users/me/deactivate
 * (Note: Generated version lacks password field)
 */
export const deactivateAccount = (password: string) => {
  const formData = new FormData();
  formData.append('password', password);

  return customInstance<{ message?: string }>({
    url: '/users/me/deactivate/',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * List all users for admin
 * GET /admin/users
 */
export const getAdminUsers = () => {
  return customInstance<any[]>({
    url: '/admin/users/',
    method: 'GET',
  });
};

/**
 * List verification requests
 * GET /admin/verification/requests
 */
export const getVerificationRequests = (status?: string) => {
  return customInstance<any[]>({
    url: '/admin/verification/requests/',
    method: 'GET',
    params: { status },
  });
};

/**
 * List posts by user ID (backend: users/<uuid:user_id>/posts/)
 * GET /users/:userId/posts
 */
export const getPostsByUserId = (userId: string) => {
  return customInstance<any[]>({
    url: `/users/${encodeURIComponent(userId)}/posts/`,
    method: 'GET',
  });
};
