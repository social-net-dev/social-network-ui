import api from "@/lib/axios";

export const accountSecurityApi = {
    /**
     * Self Deactivate
     * POST /users/me/deactivate
     */
    deactivateAccount: async (password: string): Promise<{ message?: string }> => {
        const formData = new FormData();
        formData.append("password", password);
        const response = await api.post<{ message?: string }>("/users/me/deactivate", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

    /**
     * Self Reactivate
     * POST /users/me/reactivate
     */
    reactivateAccount: async (): Promise<{ message?: string }> => {
        const response = await api.post<{ message?: string }>("/users/me/reactivate");
        return response.data;
    },

    /**
     * Create Reactivation Request (for locked/disabled accounts)
     * POST /users/me/reactivation-requests
     */
    createReactivationRequest: async (reason: string): Promise<{ id?: string; status?: string }> => {
        const response = await api.post<{ id?: string; status?: string }>("/users/me/reactivation-requests", {
            reason,
        });
        return response.data;
    },
};
