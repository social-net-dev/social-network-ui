import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (matching the key used in authStore)
    const token = localStorage.getItem("auth_token");
    if (token) {
      // Remove quotes if they exist (sometimes persist middleware adds them)
      const cleanToken = token.replace(/"/g, "");
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        // Clear tokens from localStorage
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        // Attempt to update the zustand auth store state
        if (useAuthStore && typeof useAuthStore.getState === "function") {
          useAuthStore.getState().logout();
        }
      } catch (err) {
        // ignore
      }
      // Redirect to login page
      try {
        const currentPath = window.location.pathname;
        if (currentPath !== "/login") {
          window.location.href = "/login";
        }
      } catch (err) {
        // ignore if not running in browser
      }
    }
    return Promise.reject(error);
  },
);

export default api;
