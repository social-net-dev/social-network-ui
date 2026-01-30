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
            role: "STUDENT",
            consent: false,
        },
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setError(null);
            const res = await authApi.register(data);
            setIsSuccess(true);

            const user_id = res.user_id != null ? String(res.user_id) : "";
            sessionStorage.setItem("otp_verify_email", data.email);
            sessionStorage.setItem("otp_verify_user_id", user_id);

            navigate("/verify-otp", {
                state: { email: data.email, user_id },
                replace: true,
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
