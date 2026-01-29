import api from "@/lib/axios";

export const forgotPasswordApi = {
    /**
     * Send OTP to email for password reset
     * POST /auth/forgot-password
     */
    sendResetOtp: async (email: string): Promise<{ sent: boolean }> => {
        const response = await api.post<{ sent: boolean }>("/auth/forgot-password", {
            destination: email,
            purpose: "PASSWORD_RESET",
        });
        return response.data;
    },

    /**
     * Verify OTP and reset password
     * POST /auth/reset-password
     */
    resetPassword: async (email: string, otpCode: string, newPassword: string): Promise<{ success: boolean }> => {
        const formData = new FormData();
        formData.append("email", email);
        formData.append("otp_code", otpCode);
        formData.append("new_password", newPassword);

        const response = await api.post<{ success: boolean }>("/auth/reset-password", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },
};
