import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { ApiError } from '../types';
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
import {
  authLogin,
  authRegister,
  authVerifyOtp,
  authResendOtp,
  authRefresh,
  authForgotPassword,
  authResetPassword,
  authChangePassword,
  authLogout,
} from '../endpoints/auth';

export const useAuthLogin = (
  options?: UseMutationOptions<LoginResponse, ApiError, LoginRequest>
) =>
  useMutation({ mutationFn: (data) => authLogin(data), mutationKey: ['authLogin'], ...options });

export const useAuthRegister = (
  options?: UseMutationOptions<RegisterResponse, ApiError, RegisterRequest>
) =>
  useMutation({ mutationFn: (data) => authRegister(data), mutationKey: ['authRegister'], ...options });

export const useAuthVerifyOtp = (
  options?: UseMutationOptions<VerifyOtpResponse, ApiError, VerifyOtpRequest>
) =>
  useMutation({ mutationFn: (data) => authVerifyOtp(data), mutationKey: ['authVerifyOtp'], ...options });

export const useAuthResendOtp = (
  options?: UseMutationOptions<{ message: string }, ApiError, ResendOtpRequest>
) =>
  useMutation({ mutationFn: (data) => authResendOtp(data), mutationKey: ['authResendOtp'], ...options });

export const useAuthRefresh = (
  options?: UseMutationOptions<RefreshTokenResponse, ApiError, RefreshTokenRequest>
) =>
  useMutation({ mutationFn: (data) => authRefresh(data), mutationKey: ['authRefresh'], ...options });

export const useAuthForgotPassword = (
  options?: UseMutationOptions<ForgotPasswordResponse, ApiError, ForgotPasswordRequest>
) =>
  useMutation({ mutationFn: (data) => authForgotPassword(data), mutationKey: ['authForgotPassword'], ...options });

export const useAuthResetPassword = (
  options?: UseMutationOptions<{ message: string }, ApiError, ResetPasswordRequest>
) =>
  useMutation({ mutationFn: (data) => authResetPassword(data), mutationKey: ['authResetPassword'], ...options });

export const useAuthChangePassword = (
  options?: UseMutationOptions<{ message: string }, ApiError, ChangePasswordRequest>
) =>
  useMutation({ mutationFn: (data) => authChangePassword(data), mutationKey: ['authChangePassword'], ...options });

export const useAuthLogout = (
  options?: UseMutationOptions<{ message: string }, ApiError, void>
) =>
  useMutation({ mutationFn: () => authLogout(), mutationKey: ['authLogout'], ...options });
