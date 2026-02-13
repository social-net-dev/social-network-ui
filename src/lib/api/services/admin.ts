/**
 * Admin API Service
 */

import apiClient from '../../api';
import type { 
  VerificationRequest, 
  ApproveVerificationRequest, 
  RejectVerificationRequest,
  AdminUser
} from '../types';

export const adminApi = {
  async getVerificationRequests(status: string = 'PENDING'): Promise<VerificationRequest[]> {
    const res = await apiClient.get<VerificationRequest[]>('/admin/verification-requests/', {
      params: { status }
    });
    return res.data;
  },

  async approveVerification(requestId: string, data: ApproveVerificationRequest): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>(`/admin/verification-requests/${requestId}/approve/`, data);
    return res.data;
  },

  async rejectVerification(requestId: string, data: RejectVerificationRequest): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>(`/admin/verification-requests/${requestId}/reject/`, data);
    return res.data;
  },

  async getAdminUsers(): Promise<AdminUser[]> {
    const res = await apiClient.get<AdminUser[]>('/admin/users/');
    return res.data;
  },

  async reactivateUser(userId: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>(`/admin/users/${userId}/reactivate/`);
    return res.data;
  },
};
