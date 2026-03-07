import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { LoginFormDataSchema, type LoginFormData } from '../types/auth.types';
import { useE2EEStore } from '@/stores/e2eeStore';
import { extractUserIdFromTenantSlug } from '@/lib/api/utils';
import { useAuthLogin, getUsersGetMeQueryOptions } from '@/lib/api/generated';

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    let response;
    try {
      response = await loginMutation.mutateAsync({
        data: { email: data.email, password: data.password },
      });
    } catch {
      return; // error toast handled globally by MutationCache
    }

    const payload = response;
    setAuth(payload);

    let redirectPath = '/';
    try {
      const userData = await queryClient.fetchQuery(getUsersGetMeQueryOptions());
      useAuthStore.getState().setUser(userData);

      const tenantSlug = payload.tenant_slug;
      if (tenantSlug) {
        const userId = extractUserIdFromTenantSlug(tenantSlug);
        if (userId) {
          try {
            await useE2EEStore.getState().initialize(userId);
          } catch { /* ignore */ }
        }
      }

      redirectPath = userData?.role === 'ADMIN' ? '/admin/accounts' : '/';
    } catch { /* ignore */ }

    navigate(redirectPath);
  };

  return {
    form,
    onSubmit,
    isSuccess: loginMutation.isSuccess,
    isLoading: loginMutation.isPending,
  };
}
