import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "../services/authApi";
import { LoginFormDataSchema, type LoginFormData } from "../types/auth.types";

export function useLogin() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const form = useForm<LoginFormData>({
        resolver: zodResolver(LoginFormDataSchema),
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
    });

    const mutation = useMutation({
        mutationFn: (data: LoginFormData) => authApi.login(data),
        onSuccess: (response) => {
            setAuth(response);
            // Redirect admin users to accounts management, others to home
            const redirectPath = response.user?.role === "ADMIN" ? "/admin/accounts" : "/";
            navigate(redirectPath);
        },
    });

    const onSubmit = (data: LoginFormData) => {
        mutation.mutate(data);
    };

    // Format error message properly
    let errorMessage: string | null = null;
    if (mutation.error) {
        const err = mutation.error as any;
        if (err?.response?.data?.detail) {
            const detail = err.response.data.detail;
            // Handle array of error objects
            if (Array.isArray(detail)) {
                errorMessage = detail.map((d: any) => d.msg || d.message || String(d)).join(", ");
            } else if (typeof detail === "object") {
                errorMessage = detail.msg || detail.message || JSON.stringify(detail);
            } else {
                errorMessage = String(detail);
            }
        } else if (err instanceof Error) {
            errorMessage = err.message;
        } else {
            errorMessage = "Đăng nhập thất bại";
        }
    }

    return {
        form,
        onSubmit,
        error: errorMessage,
        isSuccess: mutation.isSuccess,
        isLoading: mutation.isPending,
    };
}
