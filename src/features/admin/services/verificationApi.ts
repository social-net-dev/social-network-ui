import api from "@/lib/axios";

export interface VerificationRequest {
    id: string;
    user_id: string;
    status: string;
    requested_role: string;
    created_at: string;
    user?: {
        email: string;
        display_name: string;
        phone?: string;
        cccd_front_path?: string;
        cccd_back_path?: string;
        account_status?: string;
        storage_quota_mb?: number;
    };
}

export const verificationApi = {
    /**
     * Get pending verification requests
     * GET /admin/verification/requests
     */
    getRequests: async (status?: string): Promise<VerificationRequest[]> => {
        const params = new URLSearchParams();
        if (status) {
            params.append("status", status);
        }
        const response = await api.get<VerificationRequest[]>(`/admin/verification/requests${params.toString() ? "?" + params : ""}`);
        return response.data;
    },

    /**
     * Approve verification request
     * POST /admin/verification/requests/{request_id}/approve
     */
    approveRequest: async (requestId: string, role: string): Promise<VerificationRequest> => {
        const response = await api.post<VerificationRequest>(`/admin/verification/requests/${requestId}/approve`, { role });
        return response.data;
    },

    /**
     * Reject verification request
     * POST /admin/verification/requests/{request_id}/reject
     */
    rejectRequest: async (requestId: string, reason: string): Promise<VerificationRequest> => {
        const response = await api.post<VerificationRequest>(`/admin/verification/requests/${requestId}/reject`, { reason });
        return response.data;
    },
};
