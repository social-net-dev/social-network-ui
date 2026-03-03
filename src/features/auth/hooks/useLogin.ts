import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage, mapAuthErrorMessage } from '@/lib/api/transforms';
import { LoginFormDataSchema, type LoginFormData } from '../types/auth.types';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { loginMiddleware } from '@/lib/api/manual-apis';

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;
const LOGIN_GUARD_STORAGE_KEY = 'login_guard_v1';

type LoginGuardMap = Record<string, { attempts: number; lockedUntil: number | null }>;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const readLoginGuard = (): LoginGuardMap => {
  try {
    const raw = localStorage.getItem(LOGIN_GUARD_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as LoginGuardMap;
  } catch {
    return {};
  }
};

const writeLoginGuard = (guard: LoginGuardMap) => {
  localStorage.setItem(LOGIN_GUARD_STORAGE_KEY, JSON.stringify(guard));
};

const clearLockForEmail = (email: string) => {
  const key = normalizeEmail(email);
  const guard = readLoginGuard();
  if (!guard[key]) return;
  delete guard[key];
  writeLoginGuard(guard);
};

const getLockInfo = (email: string) => {
  const key = normalizeEmail(email);
  const guard = readLoginGuard();
  const state = guard[key];
  if (!state) return { isLocked: false, attempts: 0, remainingSeconds: 0 };

  if (state.lockedUntil && state.lockedUntil > Date.now()) {
    const remainingSeconds = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    return { isLocked: true, attempts: state.attempts, remainingSeconds };
  }

  if (state.lockedUntil && state.lockedUntil <= Date.now()) {
    delete guard[key];
    writeLoginGuard(guard);
  }

  return { isLocked: false, attempts: state.attempts || 0, remainingSeconds: 0 };
};

const registerFailedAttempt = (email: string) => {
  const key = normalizeEmail(email);
  const guard = readLoginGuard();
  const current = guard[key] || { attempts: 0, lockedUntil: null };
  const attempts = (current.attempts || 0) + 1;

  const shouldLock = attempts >= LOGIN_MAX_ATTEMPTS;
  const lockedUntil = shouldLock ? Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000 : null;

  guard[key] = { attempts, lockedUntil };
  writeLoginGuard(guard);

  return {
    attempts,
    isLocked: shouldLock,
    lockedUntil,
  };
};

const formatRemainingTime = (remainingSeconds: number) => {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  if (minutes <= 0) return `${seconds} giây`;
  return `${minutes} phút ${seconds} giây`;
};

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state: { setAuth: (authResponse: any) => void }) => state.setAuth);
  const [manualError, setManualError] = useState('');

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
    onSuccess: async (response: any, variables) => {
      clearLockForEmail(variables.email);
      setManualError('');
      setAuth(response);

      let redirectPath = '/';
      try {
        const meRes = await apiClient.get('users/me/');
        const userData = meRes.data;
        useAuthStore.getState().setUser(userData);
        redirectPath = userData?.role === 'ADMIN' ? '/admin/accounts' : '/';
      } catch (error) {
        console.error('[useLogin] Failed to fetch user data:', error);
      }

      navigate(redirectPath);
    },
    onError: (error: any, variables) => {
      const raw = getErrorMessage(error);
      const normalized = raw.toLowerCase();

      if (normalized.includes('user not active') || normalized.includes('vô hiệu')) {
        setManualError('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.');
        return;
      }

      if (normalized.includes('invalid credentials') || normalized.includes('email hoặc mật khẩu không chính xác')) {
        const attemptState = registerFailedAttempt(variables.email);
        if (attemptState.isLocked) {
          setManualError(`Bạn đã nhập sai quá ${LOGIN_MAX_ATTEMPTS} lần. Tài khoản bị khóa tạm thời trong ${LOGIN_LOCK_MINUTES} phút.`);
          return;
        }

        const remaining = Math.max(0, LOGIN_MAX_ATTEMPTS - attemptState.attempts);
        setManualError(`Email hoặc mật khẩu không chính xác. Bạn còn ${remaining} lần thử.`);
        return;
      }

      if (normalized.includes('locked') || normalized.includes('too many')) {
        setManualError('Tài khoản đang bị khóa tạm thời do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.');
        return;
      }

      setManualError(mapAuthErrorMessage(raw));
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setManualError('');

    const lockInfo = getLockInfo(data.email);
    if (lockInfo.isLocked) {
      setManualError(`Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau ${formatRemainingTime(lockInfo.remainingSeconds)}.`);
      return;
    }

    mutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  return {
    form,
    onSubmit,
    error: manualError || getErrorMessage(mutation.error),
    isSuccess: mutation.isSuccess,
    isLoading: mutation.isPending,
  };
}
