import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "@/lib/api/generated";
import { getErrorMessage, transformRegisterResponse } from "@/lib/api/transforms";
import { RegisterFormDataSchema, type RegisterFormData } from "../types/auth.types";

export function useRegister() {
    const navigate = useNavigate();

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

    const mutation = AuthAPI.useRegisterAuthRegisterPost({
        mutation: {
            onSuccess: (response, variables) => {
                const data = transformRegisterResponse(response);
                const user_id = data.userId || "";
                
                sessionStorage.setItem("otp_verify_email", variables.data.email);
                sessionStorage.setItem("otp_verify_user_id", user_id);

                navigate("/verify-otp", {
                    state: { email: variables.data.email, user_id },
                    replace: true,
                });
            },
        },
    });

    const onSubmit = (data: RegisterFormData) => {
        // Prepare multipart form data as required by Orval/Axios
        // NOTE: Orval model types still require cccd_front/cccd_back, so we cast here
        // and rely on the generated client to append only when provided.
        mutation.mutate({
            data: {
                email: data.email,
                password: data.password,
                display_name: data.displayName,
                role: data.role,
                consent: data.consent,
                phone: data.phone,
                ...(data.idCardFront ? { cccd_front: data.idCardFront as any } : {}),
                ...(data.idCardBack ? { cccd_back: data.idCardBack as any } : {}),
            } as any
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
