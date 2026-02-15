/**
 * Users API Service
 */

import apiClient from '../../api';

import { transformUser } from '../transforms';
import type {
  User,
  UpdateProfileRequest,
  UploadAvatarResponse,
  UploadBackgroundResponse,
  UpdatePrivacyRequest,
  DeactivateRequest,
  ReactivationRequest,
} from '../types';

export const usersApi = {
  async getMe(): Promise<User> {
    const res = await apiClient.get<Record<string, any>>('/users/me/');
    const data = res?.data?.data ?? res?.data ?? res;
    return transformUser(data);
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const res = await apiClient.patch<User>('/users/me/profile/', data);
    return res.data;
  },

  async uploadAvatar(file: File): Promise<UploadAvatarResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<UploadAvatarResponse>('/users/me/avatar/', formData);
    return res.data;
  },

  async uploadBackground(file: File): Promise<UploadBackgroundResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<UploadBackgroundResponse>('/users/me/background/', formData);
    return res.data;
  },

  async updatePrivacy(data: UpdatePrivacyRequest): Promise<{ visibility: string }> {
    const res = await apiClient.patch<{ visibility: string }>('/users/me/privacy/', data);
    return res.data;
  },

  async deactivate(data: DeactivateRequest): Promise<{ message?: string }> {
    const formData = new FormData();
    formData.append('password', data.password);
    const res = await apiClient.post<{ message?: string }>('/users/me/deactivate/', formData);
    return res.data;
  },

  async reactivate(data: ReactivationRequest): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>('/users/me/reactivate/', data);
    return res.data;
  },

  async createReactivationRequest(data: ReactivationRequest): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>('/users/me/reactivation-requests/', data);
    return res.data;
  },
};
