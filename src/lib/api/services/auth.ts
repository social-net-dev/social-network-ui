/**
 * Authentication API Service
 */

import apiClient from '../../api';

import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, VerifyOtpRequest, VerifyOtpResponse, ResendOtpRequest, RefreshTokenRequest, RefreshTokenResponse, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest } from '../types/auth.types';
import type { User } from '@/lib/api/types';

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/auth/login/', data);
    return res.data;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });
    const res = await apiClient.post<RegisterResponse>('/register/email/request/', formData);
    return res.data;
  },

  async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const res = await apiClient.post<VerifyOtpResponse>('/register/email/confirm/', data);
    return res.data;
  },

  async resendOtp(data: ResendOtpRequest): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>('/register/email/request/', data);
    return res.data;
  },

  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const res = await apiClient.post<RefreshTokenResponse>('/auth/refresh/', data);
    return res.data;
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string; user_id?: string }> {
    const res = await apiClient.post<{ message: string; user_id?: string }>('/auth/forgot-password/', data);
    return res.data;
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>('/auth/reset-password/', data);
    return res.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('current_password', data.current_password);
    formData.append('new_password', data.new_password);
    const res = await apiClient.post<{ message: string }>('/auth/change-password/', formData);
    return res.data;
  },

  async logout(): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>('/auth/logout/');
    return res.data;
  },

  async whoAmI(): Promise<User> {
    const res = await apiClient.get<User>('/auth/me/');
    return res.data;
  },
};
