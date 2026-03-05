/**
 * Shares API Service
 */

import socialClient from '../../socialApi';

import type { SharePostRequest } from '../types';

export const sharesApi = {
  // Returns the full share-post object (same shape as a regular post)
  async sharePost(postId: string, data?: SharePostRequest): Promise<Record<string, any>> {
    const res = await socialClient.post<Record<string, any>>(`/posts/${postId}/share/`, data);
    return res.data;
  },

  async unsharePost(postId: string): Promise<{ message: string }> {
    const res = await socialClient.delete<{ message: string }>(`/posts/${postId}/share/`);
    return res.data;
  },
};
