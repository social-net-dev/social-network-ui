/**
 * Shares API Service
 */

import apiClient from '../../api';

import type { SharePostRequest, ShareResponse } from '../types';

export const sharesApi = {
  async sharePost(postId: string, data?: SharePostRequest): Promise<ShareResponse> {
    const res = await apiClient.post<ShareResponse>(`/posts/${postId}/share/`, data);
    return res.data;
  },

  async unsharePost(postId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/posts/${postId}/share/`);
    return res.data;
  },
};
