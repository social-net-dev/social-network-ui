/**
 * Reactions API Service
 */

import apiClient from '../../api';

import type { ReactRequest, PostReaction, CommentReaction } from '../types';

export const reactionsApi = {
  async reactToPost(postId: string, data: ReactRequest): Promise<PostReaction> {
    const res = await apiClient.post<PostReaction>(`/posts/${postId}/reactions/`, data);
    return res.data;
  },

  async unreactPost(postId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/posts/${postId}/reactions/`);
    return res.data;
  },

  async reactToComment(commentId: string, data: ReactRequest): Promise<CommentReaction> {
    const res = await apiClient.post<CommentReaction>(`/comments/${commentId}/reactions/`, data);
    return res.data;
  },

  async unreactComment(commentId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/comments/${commentId}/reactions/`);
    return res.data;
  },
};
