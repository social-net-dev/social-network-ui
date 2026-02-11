import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthAPI } from '@/lib/api/generated';
import { extractUserIdFromTenantSlug } from '@/lib/api/profileApi';
// import { clearAllE2EEKeys } from '@/features/message/lib/e2ee'; // NOT USED - keys must persist

interface AuthState {
  user: any | null; // Keep flexible until types are fully consolidated
  token: string | null;
  refreshToken: string | null;
  tenantSlug?: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  getUserId: () => string | null;
  setAuth: (authResponse: any) => void;
  setUser: (user: any | null) => void;
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
      setAuth: authResponse => {
        console.log('[authStore] setAuth received:', authResponse);

        // Handle both formats: backend (access/refresh/tenant_slug) and app (token/refreshToken/tenantSlug)
        const token = authResponse.token || authResponse.access;
        const refreshToken = authResponse.refreshToken || authResponse.refresh;
        const tenantSlug = authResponse.tenantSlug || authResponse.tenant_slug;

        console.log('[authStore] Extracted values:', { token: token?.substring(0, 20) + '...', refreshToken: '...', tenantSlug });

        if (token) {
          localStorage.setItem('auth_token', token);
        }
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        if (tenantSlug) {
          localStorage.setItem('tenant_slug', tenantSlug);
          console.log('[authStore] ✅ Saved tenant_slug to localStorage:', tenantSlug);
        }

        set({
          user: authResponse.user || null,
          token: token || null,
          refreshToken: refreshToken || null,
          tenantSlug: tenantSlug || null,
          isAuthenticated: true,
        });
      },
      setUser: user => set({ user }),
      logout: async () => {
        const { refreshToken } = get();
        try {
          // Call backend logout API with current refresh token
          if (refreshToken) {
            await AuthAPI.useLogoutAuthLogoutPost().mutateAsync({
              data: { refresh_token: refreshToken },
            });
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear local state and storage regardless
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('tenant_slug');

          // ⚠️ IMPORTANT: DO NOT clear E2EE keys on logout!
          // E2EE keys MUST persist across login/logout to decrypt old messages.
          // Keys are tied to DEVICE, not session.
          // Only clear keys when user explicitly "logs out from this device forever".
          // clearAllE2EEKeys(); // ❌ REMOVED

          set({
            user: null,
            token: null,
            refreshToken: null,
            tenantSlug: null,
            isAuthenticated: false,
          });
        }
      },
      setLoading: isLoading => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => state => {
        // Restore tenant_slug from localStorage to zustand state
        if (state) {
          const tenantSlug = localStorage.getItem('tenant_slug')?.replace(/"/g, '');
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
