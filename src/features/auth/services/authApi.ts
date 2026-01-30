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

            const response = await api.post<RegisterResponse>("/auth/register", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
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
     * POST /auth/otp/send
     */
    resendOTP: async (email: string): Promise<OTPResponse> => {
        const response = await api.post<OTPResponse>("/auth/otp/send", {
            destination: email,
            purpose: "REGISTER_VERIFY",
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
            // FastAPI OAuth2PasswordRequestForm requires form data
            const formData = new URLSearchParams();
            formData.append("username", data.email);
            formData.append("password", data.password);
            if (data.rememberMe) {
                formData.append("remember_me", "true");
            }

            const tokenResponse = await api.post("/auth/login", formData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });

            const { access_token, refresh_token } = tokenResponse.data;

            // Save tokens temporarily for the next request
            localStorage.setItem("auth_token", access_token);
            if (refresh_token) {
                localStorage.setItem("refresh_token", refresh_token);
            }

            // Get current user profile
            const userResponse = await api.get<User>("/users/me");

            return {
                user: userResponse.data,
                token: access_token,
                refreshToken: refresh_token || "",
            };
        } catch (error: any) {
            const detail = error?.response?.data?.detail || error?.message || "Đăng nhập thất bại";
            throw new Error(detail);
        }
    },

    /**
     * Logout user
     * POST /auth/logout
     */
    logout: async (): Promise<void> => {
        try {
            // Call backend logout to revoke tokens
            await api.post("/auth/logout");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // Clear local storage regardless
            localStorage.removeItem("auth_token");
            localStorage.removeItem("refresh_token");
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

        const response = await api.post<RefreshTokenResponse>("/auth/refresh", {
            refresh_token: refreshToken,
        });

        // Update access token in localStorage
        localStorage.setItem("auth_token", response.data.access_token);

        return response.data;
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
