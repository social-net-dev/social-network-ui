import { customInstance } from '@/lib/api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResendOtpRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '../types';

export const authLogin = (body: LoginRequest, signal?: AbortSignal): Promise<LoginResponse> =>
  customInstance({ url: '/auth/login', method: 'POST', data: body, signal });

export const authRegister = (body: RegisterRequest, signal?: AbortSignal): Promise<RegisterResponse> =>
  customInstance({ url: '/auth/register', method: 'POST', data: body, signal });

export const authVerifyOtp = (body: VerifyOtpRequest, signal?: AbortSignal): Promise<VerifyOtpResponse> =>
  customInstance({ url: '/auth/verify-otp', method: 'POST', data: body, signal });

export const authResendOtp = (body: ResendOtpRequest, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: '/auth/resend-otp', method: 'POST', data: body, signal });

export const authRefresh = (body: RefreshTokenRequest, signal?: AbortSignal): Promise<RefreshTokenResponse> =>
  customInstance({ url: '/auth/refresh', method: 'POST', data: body, signal });

export const authForgotPassword = (body: ForgotPasswordRequest, signal?: AbortSignal): Promise<ForgotPasswordResponse> =>
  customInstance({ url: '/auth/forgot-password', method: 'POST', data: body, signal });

export const authResetPassword = (body: ResetPasswordRequest, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: '/auth/reset-password', method: 'POST', data: body, signal });

export const authChangePassword = (body: ChangePasswordRequest, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: '/auth/change-password', method: 'POST', data: body, signal });

export const authLogout = (signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: '/auth/logout', method: 'POST', signal });
