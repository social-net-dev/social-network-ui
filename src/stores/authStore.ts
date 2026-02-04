import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { AuthAPI } from "@/lib/api/generated";

interface AuthState {
    user: any | null; // Keep flexible until types are fully consolidated
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
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
                });
            },
            setUser: (user) => set({ user }),
            logout: async () => {
                const { refreshToken } = get();
                try {
                    // Call backend logout API with current refresh token
                    if (refreshToken) {
                        await AuthAPI.AuthAPI.logoutAuthLogoutPost({ 
                            refresh_token: refreshToken 
                        });
                    }
                } catch (error) {
                    console.error("Logout error:", error);
                } finally {
                    // Clear local state and storage regardless
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("refresh_token");
                    set({
                        user: null,
                        token: null,
                        refreshToken: null,
                        isAuthenticated: false,
                    });
                }
            },
            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: "auth-storage",
            onRehydrateStorage: () => (state) => {
                state?.setLoading(false);
            },
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
);
