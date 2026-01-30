import api from "@/lib/axios";

export interface AdminUserAccount {
    id: string;
    email: string;
    phone?: string | null;
    username?: string | null;
    display_name: string;
    account_status: string;
    role: string;
    storage_quota_mb: number;
    created_at: string;
    deactivated_at?: string | null;
    cccd_front_path?: string | null;
    cccd_back_path?: string | null;
}

export const accountsApi = {
    /**
     * Admin list users
     * GET /admin/users
     */
    getUsers: async (status?: string): Promise<AdminUserAccount[]> => {
        const params = status ? { status } : undefined;
        const response = await api.get<AdminUserAccount[]>("/admin/users", { params });
        return response.data;
    },

    /**
     * Admin reactivate user
     * POST /admin/users/{user_id}/reactivate
     */
    reactivateUser: async (userId: string): Promise<void> => {
        await api.post(`/admin/users/${userId}/reactivate`);
    },
};
