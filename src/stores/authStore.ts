import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api/services';
import { extractUserIdFromTenantSlug } from '@/lib/api/utils';
import { transformUser } from '@/lib/api/transforms';
import { AUTH_STORAGE_KEYS, AUTH_STORE_NAME } from '@/lib/auth.constants';
import type { User } from '@/lib/api/types/user.types';

interface AuthResponse {
  user?: User | Record<string, unknown>;
  token?: string;
  access?: string;
  refreshToken?: string;
  refresh?: string;
  tenantSlug?: string;
  tenant_slug?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tenantSlug?: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  getUserId: () => string | null;
  setAuth: (authResponse: AuthResponse) => void;
  setUser: (user: Record<string, unknown> | null) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      tenantSlug: null,
      isAuthenticated: false,
      isLoading: true,
      getUserId: () => {
        const { tenantSlug } = get();
        return tenantSlug ? extractUserIdFromTenantSlug(tenantSlug) : null;
      },
      setAuth: (authResponse: AuthResponse) => {
        // Handle both formats: backend (access/refresh/tenant_slug) and app (token/refreshToken/tenantSlug)
        const token = authResponse.token || authResponse.access;
        const refreshToken = authResponse.refreshToken || authResponse.refresh;
        const tenantSlug = authResponse.tenantSlug || authResponse.tenant_slug;

        if (token) {
          localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
        }
        if (refreshToken) {
          localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }
        if (tenantSlug) {
          localStorage.setItem(AUTH_STORAGE_KEYS.TENANT_SLUG, tenantSlug);
        }

        set({
          user: authResponse.user ? transformUser(authResponse.user) : null,
          token: token || null,
          refreshToken: refreshToken || null,
          tenantSlug: tenantSlug || null,
          isAuthenticated: true,
        });
      },
      setUser: (user: Record<string, unknown> | null) =>
        set({ user: user ? transformUser(user) : null }),
      logout: async () => {
        try {
          // Call backend logout API
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear local state and storage regardless
          localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
          localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(AUTH_STORAGE_KEYS.TENANT_SLUG);
          
          // Clear persisted zustand store
          localStorage.removeItem(AUTH_STORE_NAME);

          // ⚠️ IMPORTANT: DO NOT clear E2EE keys on logout!
          // E2EE keys MUST persist across login/logout to decrypt old messages.
          // Keys are tied to DEVICE, not session.
          // Only clear keys when user explicitly "logs out from this device forever".

          set({
            user: null,
            token: null,
            refreshToken: null,
            tenantSlug: null,
            isAuthenticated: false,
          });
        }
      },
      setLoading: (isLoading: boolean) => set({ isLoading }),
    }),
    {
      name: AUTH_STORE_NAME,
      onRehydrateStorage: () => state => {
        // Restore tenant_slug from localStorage to zustand state
        if (state) {
          const tenantSlug = localStorage
            .getItem(AUTH_STORAGE_KEYS.TENANT_SLUG)
            ?.replace(/"/g, '');
          if (tenantSlug) {
            state.tenantSlug = tenantSlug;
          }
          state.setLoading(false);
        }
      },
      partialize: state => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        tenantSlug: state.tenantSlug,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
