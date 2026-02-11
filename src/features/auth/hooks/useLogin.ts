import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/lib/api/transforms';
import { LoginFormDataSchema, type LoginFormData } from '../types/auth.types';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { loginMiddleware } from '@/lib/api/manual-apis';

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginFormDataSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      return loginMiddleware(payload.email, payload.password);
    },
    onSuccess: async response => {
      // Response đã được axios interceptor unwrap: { access, refresh, tenant_slug }
      // Truyền TRỰC TIẾP cho authStore - KHÔNG transform, KHÔNG modify!
      console.log('[useLogin] Backend response (after unwrap):', response);
      setAuth(response);

      // Fetch /auth/me/ to hydrate user and get role for redirect
      let redirectPath = '/';
      try {
        const meRes = await apiClient.get('auth/me/');
        const userData = meRes.data;
        useAuthStore.getState().setUser(userData);

        // Redirect based on user role
        redirectPath = userData?.role === 'ADMIN' ? '/admin/accounts' : '/';
      } catch (error) {
        console.error('[useLogin] Failed to fetch user data:', error);
        // Fallback to home page if /auth/me/ fails
      }

      navigate(redirectPath);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    mutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  return {
    form,
    onSubmit,
    error: getErrorMessage(mutation.error),
    isSuccess: mutation.isSuccess,
    isLoading: mutation.isPending,
  };
}
