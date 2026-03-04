import type { Gender, Role } from './common';

// ─── Login ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  tenant_slug: string;
}

// ─── Register ──────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
  gender: Gender;
  role: Role;
  phone?: string;
  consent?: boolean;
  verification_media_asset_ids?: string[];
}

export interface RegisterResponse {
  id: string;
  email: string;
  username: string;
}

// ─── OTP ───────────────────────────────────────────────────────────────────────

export interface VerifyOtpRequest {
  user_id: string;
  otp: string;
}

export interface VerifyOtpResponse {
  tenant_id: string;
  tenant_slug: string;
  status: string;
}

export interface ResendOtpRequest {
  user_id: string;
}

// ─── Token ─────────────────────────────────────────────────────────────────────

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

// ─── Password ──────────────────────────────────────────────────────────────────

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  user_id?: string;
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
