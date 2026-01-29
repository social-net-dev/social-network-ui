import api from "@/lib/axios";

export const changePasswordApi = {
    /**
     * Change user password
     * POST /auth/change-password
     */
    changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
        const formData = new FormData();
        formData.append("current_password", currentPassword);
        formData.append("new_password", newPassword);

        const response = await api.post<{ message: string }>("/auth/change-password", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },
};
