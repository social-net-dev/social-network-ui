import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authLogout } from '@/lib/api/generated';
import { extractUserIdFromTenantSlug } from '@/lib/api/utils';
import { useE2EEStore } from './e2eeStore';
import { callSetPublicKey } from '@/features/message/services/messageApi';
import type { User } from '@/lib/api/types';
// import { clearAllE2EEKeys } from '@/features/message/lib/e2ee'; // NOT USED - keys must persist

/** Flexible auth payload — handles both backend snake_case and internal camelCase formats. */
interface AuthPayload {
  user?: User | null;
  token?: string;
  refreshToken?: string;
  tenantSlug?: string;
  /** Backend format */
  access?: string;
  refresh?: string;
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
  setAuth: (authResponse: AuthPayload) => void;
  setUser: (user: User | null) => void;
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
        // Handle both formats: backend (access/refresh/tenant_slug) and app (token/refreshToken/tenantSlug)
        const token = authResponse.token || authResponse.access;
        const refreshToken = authResponse.refreshToken || authResponse.refresh;
        const tenantSlug = authResponse.tenantSlug || authResponse.tenant_slug;

        if (token) {
          localStorage.setItem('auth_token', token);
        }
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        if (tenantSlug) {
          localStorage.setItem('tenant_slug', tenantSlug);
        }

        set({
          user: authResponse.user || null,
          token: token || null,
          refreshToken: refreshToken || null,
          tenantSlug: tenantSlug || null,
          isAuthenticated: true,
        });

        // Initialize E2EE keys and upload public key to messaging backend in background
        (async () => {
          try {
            const uid = get().getUserId();
            if (!uid) return;
            await useE2EEStore.getState().initialize(uid);
            const publicKey = useE2EEStore.getState().publicKeyString;
            if (publicKey) {
              await callSetPublicKey({ user_id: uid, public_key: publicKey });
            }
          } catch (err) {
            console.warn('[authStore] Failed to upload public key after login:', err);
          }
        })();
      },
      setUser: user => set({ user }),
      logout: async () => {
        try {
          // Call backend logout API
          await authLogout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear local state and storage regardless
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('tenant_slug');

          // Clear E2EE in-memory state (but keep keys in localStorage)
          // ⚠️ IMPORTANT: DO NOT clear E2EE keys from localStorage!
          // E2EE keys MUST persist across login/logout to decrypt old messages.
          // Keys are tied to DEVICE, not session.
          useE2EEStore.getState().clearKeys();

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
