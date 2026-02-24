import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/lib/utils/api';
import { LoginFormDataSchema, type LoginFormData } from '../types/auth.types';
import apiClient from '@/lib/api';
import { useE2EEStore } from '@/stores/e2eeStore';
import { extractUserIdFromTenantSlug } from '@/lib/api/utils';
import { useAuthLogin } from '@/lib/api/generated/auth/auth';

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const loginMutation = useAuthLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginFormDataSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    const response = await loginMutation.mutateAsync({
      data: {
        email: data.email,
        password: data.password,
      },
    });

    const payload = response.data;
    setAuth(payload);

    let redirectPath = '/';
    try {
      const meRes = await apiClient.get('users/me/');
      const userData = meRes.data;
      useAuthStore.getState().setUser(userData);

      const tenantSlug = payload.tenant_slug;
      if (tenantSlug) {
        const userId = extractUserIdFromTenantSlug(tenantSlug);
        if (userId) {
          try {
            await useE2EEStore.getState().initialize(userId);
          } catch {
            // ignore
          }
        }
      }

      redirectPath = userData?.role === 'ADMIN' ? '/admin/accounts' : '/';
    } catch {
      // ignore
    }

    navigate(redirectPath);
  };

  return {
    form,
    onSubmit,
    error: getErrorMessage(loginMutation.error),
    isSuccess: loginMutation.isSuccess,
    isLoading: loginMutation.isPending,
  };
}
