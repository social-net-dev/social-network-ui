import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/api/hooks/useAuth";
import { getErrorMessage, transformRegisterResponse } from "@/lib/api/transforms";
import { RegisterFormDataSchema, type RegisterFormData } from "../types/auth.types";
import type { RegisterRequest } from "@/lib/api/types";

export function useRegister() {
    const navigate = useNavigate();
    const { register, isLoading, errors } = useAuth();

    const form = useForm<RegisterFormData>({
        resolver: zodResolver(RegisterFormDataSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
            displayName: "",
            phone: "",
            role: "STUDENT",
            gender: "",
            consent: false,
            personalDocuments: [],
        },
    });

    const onSubmit = async (data: RegisterFormData) => {
        const personalDocs = data.personalDocuments || [];
        
        try {
            const registerData: RegisterRequest = {
                email: data.email,
                password: data.password,
                display_name: data.displayName,
                role: data.role as any,
                gender: data.gender || "",
                consent: data.consent,
                phone: data.phone,
                ...(personalDocs[0] ? { cccd_front: personalDocs[0] } : {}),
                ...(personalDocs[1] ? { cccd_back: personalDocs[1] } : {}),
            };

            const response = await register(registerData);
            const transformed = transformRegisterResponse(response);
            const user_id = transformed.userId || "";
            
            sessionStorage.setItem("otp_verify_email", data.email);
            sessionStorage.setItem("otp_verify_user_id", user_id);

            navigate("/verify-otp", {
                state: { email: data.email, user_id },
                replace: true,
            });
        } catch (error) {
            console.error("Registration error:", error);
        }
    };

    return {
        form,
        onSubmit,
        error: getErrorMessage(errors.register),
        isSuccess: !errors.register && !isLoading && form.formState.isSubmitSuccessful,
        isLoading,
    };
}
