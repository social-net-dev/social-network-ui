import api from "@/lib/axios";
import type {
    AuthResponse,
    LoginFormData,
    RegisterFormData,
    OTPVerifyData,
    RegisterResponse,
    OTPResponse,
    RefreshTokenResponse,
} from "../types/auth.types";
import type { User } from "@/types";

export const authApi = {
    /**
     * Register new user with ID card images
     * POST /auth/register
     */
    register: async (data: RegisterFormData): Promise<RegisterResponse> => {
        try {
            const formData = new FormData();
            formData.append("email", data.email);
            formData.append("password", data.password);
            formData.append("display_name", data.displayName);
            formData.append("role", data.role);
            formData.append("consent", String(data.consent));

            if (data.phone) {
                formData.append("phone", data.phone);
            }

            // Upload ID card images
            formData.append("cccd_front", data.idCardFront);
            formData.append("cccd_back", data.idCardBack);

            const response = await api.post<Record<string, unknown>>("/auth/register/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            const resData = response.data as Record<string, unknown>;
            const inner = resData?.data as Record<string, unknown> | undefined;
            const user_id =
                (resData?.user_id ?? resData?.id ?? inner?.user_id ?? inner?.id) != null
                    ? String(resData?.user_id ?? resData?.id ?? inner?.user_id ?? inner?.id)
                    : "";
            const message = (resData?.message ?? inner?.message) != null ? String(resData?.message ?? inner?.message) : "OTP sent";
            return { user_id, message } as RegisterResponse;
        } catch (error: any) {
            const detail = error?.response?.data?.detail || error?.message || "Đăng ký thất bại";
            throw new Error(detail);
        }
    },

    /**
     * Verify OTP code after registration
     * POST /auth/otp/verify
     */
    verifyOTP: async (data: OTPVerifyData): Promise<OTPResponse> => {
        const response = await api.post<OTPResponse>("/auth/otp/verify", {
            destination: data.email,
            purpose: "REGISTER_VERIFY",
            code: data.otpCode,
        });
        return response.data;
    },

    /**
     * Resend OTP code
     * POST /auth/resend-otp/ (etechs-middleware)
     */
    resendOTP: async (userId: string): Promise<OTPResponse> => {
        const response = await api.post<OTPResponse>("/auth/resend-otp/", {
            user_id: userId,
        });
        return response.data;
    },

    /**
     * Login user
     * POST /auth/login
     * Returns access_token and refresh_token
     */
    login: async (data: LoginFormData): Promise<AuthResponse> => {
        try {
            // Backend expects form-urlencoded with username field
            const formData = new URLSearchParams();
            formData.append("username", data.email);
            formData.append("password", data.password);
            formData.append("remember_me", data.rememberMe ? "true" : "false");

            const tokenResponse = await api.post("/auth/login", formData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });

            // Axios interceptor đã unwrap { success, data } -> data là payload
            const payload = tokenResponse.data as Record<string, unknown>;
            const access_token = (payload?.access_token ?? payload?.access) as string;
            const refresh_token = (payload?.refresh_token ?? payload?.refresh) as string;
            const tenant_slug = payload?.tenant_slug as string | undefined;

            if (access_token) {
                localStorage.setItem("auth_token", access_token);
            }
            if (refresh_token) {
                localStorage.setItem("refresh_token", refresh_token);
            }
            if (tenant_slug) {
                localStorage.setItem("tenant_slug", tenant_slug);
            }

            // Current user from tenant API (interceptor đã unwrap)
            const userResponse = await api.get<Record<string, unknown>>("/users/me", {
                headers: tenant_slug ? { "X-Tenant-Slug": tenant_slug } : {},
            });
            const raw = userResponse.data as Record<string, unknown>;
            const user: User = {
                id: String(raw?.id ?? ""),
                email: String(raw?.email ?? ""),
                username: raw?.username != null ? String(raw.username) : undefined,
                displayName: raw?.display_name != null ? String(raw.display_name) : undefined,
                firstName: (raw?.display_name as string)?.split?.(" ")?.[0] ?? "",
                lastName: (raw?.display_name as string)?.split?.(" ")?.slice(1)?.join?.(" ") ?? "",
                avatar: raw?.avatar_path ? undefined : undefined,
                role: raw?.role != null ? String(raw.role) : undefined,
            };

            return {
                user,
                token: access_token,
                refreshToken: refresh_token || "",
            };
        } catch (error: any) {
            const detail = error?.response?.data?.detail || error?.message || "Đăng nhập thất bại";
            throw new Error(detail);
        }
    },

    /**
     * Logout user (etechs-middleware has no logout endpoint; clear local state)
     */
    logout: async (): Promise<void> => {
        try {
            // Optional: call backend if endpoint exists
            await api.post("/auth/logout/").catch(() => {});
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("tenant_slug");
        }
    },

    /**
     * Refresh access token
     * POST /auth/refresh
     */
    refreshToken: async (): Promise<RefreshTokenResponse> => {
        const refreshToken = localStorage.getItem("refresh_token")?.replace(/"/g, "");

        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        const response = await api.post<RefreshTokenResponse>("/auth/refresh/", {
            refresh: refreshToken,
        });

        const access_token = response.data.access_token ?? (response.data as any).access;
        if (access_token) {
            localStorage.setItem("auth_token", access_token);
        }

        return {
            access_token: access_token ?? response.data.access_token,
            token_type: (response.data as any).token_type ?? "bearer",
        };
    },

    /**
     * Get current user profile
     * GET /users/me
     */
    getCurrentUser: async (): Promise<User> => {
        const response = await api.get<User>("/users/me");
        return response.data;
    },
};
