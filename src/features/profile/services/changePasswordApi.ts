import api from "@/lib/axios";

export const changePasswordApi = {
    /**
     * Change user password
     * POST /auth/change-password
     */
    changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>("/auth/change-password", {
            current_password: currentPassword,
            new_password: newPassword,
        });
        return response.data;
    },
};
