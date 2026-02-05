import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { AuthAPI } from "@/lib/api/generated";
import { transformAuthResponse, getErrorMessage } from "@/lib/api/transforms";
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

    const mutation = AuthAPI.useLoginAuthLoginPost({
        mutation: {
            onSuccess: (response) => {
                const data = transformAuthResponse(response);
                setAuth(data);
                // Redirect admin users to accounts management, others to home
                const redirectPath = data.user?.role === "ADMIN" ? "/admin/accounts" : "/";
                navigate(redirectPath);
            },
        },
    });

    const onSubmit = (data: LoginFormData) => {
        mutation.mutate({ 
            data: {
                username: data.email, 
                password: data.password,
                remember_me: data.rememberMe
            } 
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
