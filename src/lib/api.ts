/**
 * Unified Axios Instance
 * - Refresh token logic with queue
 * - Public auth paths (no token sent)
 * - Unwrap middleware response { success: true, data: T }
 * - Tenant header support
 *
 * Used by:
 * - Manual API services (authApi, feedApi, etc.)
 * - Orval generated hooks (via axios-instance.ts mutator)
 */
import axios, { AxiosError } from "axios";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { useAuthStore } from "@/stores/authStore";
import { getApiBaseUrl } from "@/lib/config";

// baseURL: dev -> social-be trực tiếp; production -> /api (Caddy -> social-be)
const baseURL = getApiBaseUrl();

const apiClient = axios.create({
    baseURL: baseURL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// ============================================
// REFRESH TOKEN QUEUE
// ============================================
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

// ============================================
// PUBLIC AUTH PATHS (No token sent)
// ============================================
const PUBLIC_AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/verify-otp", "/auth/otp/verify", "/auth/resend-otp"];

function isPublicAuthRequest(url: string | undefined): boolean {
    if (!url) return false;
    const path = url.replace(apiClient.defaults.baseURL || "", "").split("?")[0];
    return PUBLIC_AUTH_PATHS.some((p) => path === p || path === `${p}/`);
}

// ============================================
// REQUEST INTERCEPTOR
// ============================================
apiClient.interceptors.request.use(
    (config) => {
        if (!isPublicAuthRequest(config.url)) {
            const token = localStorage.getItem("auth_token");
            if (token) {
                const cleanToken = token.replace(/"/g, "");
                config.headers.Authorization = `Bearer ${cleanToken}`;
            }
            const tenantSlug = localStorage.getItem("tenant_slug");
            if (tenantSlug) {
                config.headers["X-Tenant-Slug"] = tenantSlug.replace(/"/g, "");
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// ============================================
// RESPONSE UNWRAP
// ============================================
// Unwrap middleware format: { success: true, data: T } -> response.data = T
function unwrapResponse(response: AxiosResponse): AxiosResponse {
    const d = response.data;
    if (d && typeof d === "object" && (d as Record<string, unknown>).success === true && "data" in d) {
        response.data = (d as { data: unknown }).data;
    }
    return response;
}

// ============================================
// RESPONSE INTERCEPTOR WITH REFRESH TOKEN
// ============================================
apiClient.interceptors.response.use(
    (response) => unwrapResponse(response),
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
            _retry?: boolean;
        };

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Wait for the refresh to complete
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        return apiClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem("refresh_token")?.replace(/"/g, "");

            if (!refreshToken) {
                // No refresh token, logout
                localStorage.removeItem("auth_token");
                localStorage.removeItem("refresh_token");
                try {
                    useAuthStore.getState().logout();
                } catch {
                    // ignore
                }
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                // Call refresh token endpoint (etechs-middleware expects "refresh")
                const refreshURL = baseURL.endsWith("/") ? `${baseURL}auth/refresh/` : `${baseURL}/auth/refresh/`;
                const response = await axios.post(refreshURL, { refresh: refreshToken, refresh_token: refreshToken });
                const payload = response.data?.data ?? response.data;
                const access_token = payload?.access_token ?? payload?.access;

                // Save new token
                localStorage.setItem("auth_token", access_token);

                // Update axios default header
                apiClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

                processQueue(null);

                // Retry original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as AxiosError);
                // Refresh token failed, logout
                localStorage.removeItem("auth_token");
                localStorage.removeItem("refresh_token");
                try {
                    useAuthStore.getState().logout();
                } catch {
                    // ignore
                }
                window.location.href = "/login";
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;
