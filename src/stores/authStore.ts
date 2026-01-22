import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import type { AuthResponse } from '@/features/auth/types/auth.types'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (authResponse: AuthResponse) => void
  setUser: (user: User | null) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      setAuth: (authResponse) => {
        localStorage.setItem("auth_token", authResponse.token);
        localStorage.setItem("refresh_token", authResponse.refreshToken);
        set({
          user: authResponse.user,
          token: authResponse.token,
          refreshToken: authResponse.refreshToken,
          isAuthenticated: true,
        })
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem("auth_token")
        localStorage.removeItem("refresh_token")
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false)
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
