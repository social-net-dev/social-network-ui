import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/authApi";
import { RegisterFormDataSchema, type RegisterFormData } from "../types/auth.types";

export function useRegister() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<RegisterFormData>({
        resolver: zodResolver(RegisterFormDataSchema),
        defaultValues: {
            email: "",
            password: "",
            displayName: "",
            phone: "",
            role: "USER",
            consent: false,
        },
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setError(null);
            await authApi.register(data);
            setIsSuccess(true);

            // Redirect to OTP verification page with email
            navigate("/verify-otp", {
                state: { email: data.email },
            });
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || "Đăng ký thất bại";
            setError(errorMessage);
            setIsSuccess(false);
        }
    };

    return {
        form,
        onSubmit,
        error,
        isSuccess,
        isLoading: form.formState.isSubmitting,
    };
}
