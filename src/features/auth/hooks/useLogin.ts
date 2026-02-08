import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { transformAuthResponse, getErrorMessage } from "@/lib/api/transforms";
import { LoginFormDataSchema, type LoginFormData } from "../types/auth.types";
import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import { loginMiddleware } from "@/lib/api/manual-apis";

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
        mutationFn: async (payload: { email: string; password: string }) => {
            return loginMiddleware(payload.email, payload.password);
        },
        onSuccess: async (response) => {
            const data = transformAuthResponse(response);
            setAuth(data);

            // Fetch /auth/me/ to hydrate user (optional, but improves UX)
            try {
                const meRes = await apiClient.get("auth/me/");
                useAuthStore.getState().setUser(meRes.data);
            } catch {
                // ignore
            }

            const redirectPath = data.user?.role === "ADMIN" ? "/admin/accounts" : "/";
            navigate(redirectPath);
        },
    });

    const onSubmit = (data: LoginFormData) => {
        mutation.mutate({
            email: data.email,
            password: data.password,
        });
    };

    return {
        form,
        onSubmit,
        error: getErrorMessage(mutation.error),
        isSuccess: mutation.isSuccess,
        isLoading: mutation.isPending,
    };
}
