/**
 * Authentication related types
 */

import type { Gender, Role } from './common.types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  tenant_slug: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
  gender: Gender | string;
  role: Role;
  phone?: string;
  consent?: boolean;
  cccd_front?: File;
  cccd_back?: File;
}

export interface RegisterResponse {
  message?: string;
  user_id?: string;
  email?: string;
  display_name?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  tenant_id: string;
  tenant_slug: string;
  status: string;
}

export interface ResendOtpRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  user_id: string;
  otp: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
