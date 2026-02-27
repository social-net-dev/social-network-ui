/**
 * Authentication Smart Hook
 */

import { useMutation } from '@tanstack/react-query';
import { authApi } from '../services';
import { useAuthStore } from '@/stores/authStore';
import { useE2EEStore } from '@/stores/e2eeStore';
import { callSetPublicKey } from '@/features/message/services/messageApi';
import type { LoginRequest, RegisterRequest, VerifyOtpRequest } from '../types';

export function useAuth() {
  const { setAuth, logout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: data => {
      setAuth({
        access: data.access,
        refresh: data.refresh,
        tenant_slug: data.tenant_slug,
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: async data => {
      try {
        const userId = (data as any).user_id || (data as any).userId || (data as any).id;
        if (!userId) return;

        // Ensure E2EE keys exist for this device/user and upload public key to message service
        await useE2EEStore.getState().initialize(userId);
        const publicKey = useE2EEStore.getState().publicKeyString;
        if (publicKey) {
          await callSetPublicKey({ user_id: userId, public_key: publicKey });
        }
      } catch (err) {
        // Do not block registration flow on key upload errors
        console.warn('[useAuth] Failed to initialize/upload public key on register:', err);
      }
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (data: VerifyOtpRequest) => authApi.verifyOtp(data),
  });

  const resendOtpMutation = useMutation({
    mutationFn: (data: { user_id: string }) => authApi.resendOtp(data),
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: async () => {
      await logout();
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: { email: string }) => authApi.forgotPassword(data),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { user_id: string; otp: string; new_password: string }) => authApi.resetPassword(data),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) => authApi.changePassword(data),
  });

  return {
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    verifyOtp: verifyOtpMutation.mutateAsync,
    resendOtp: resendOtpMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    isLoading: loginMutation.isPending || registerMutation.isPending || verifyOtpMutation.isPending || logoutMutation.isPending,
    errors: {
      login: loginMutation.error,
      register: registerMutation.error,
      verifyOtp: verifyOtpMutation.error,
    },
  };
}
