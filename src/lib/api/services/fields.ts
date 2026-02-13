/**
 * Fields API Service
 */

import apiClient from '../../api';
import { transformPost } from '../transforms';
import type { Field } from '@/features/fields/types/field.types';
import type { Post } from '../types';

export interface FieldResponse {
  field: Field;
}

export interface FieldPostsResponse {
  posts: Post[];
  page: number;
  total: number;
  total_pages: number;
}

export const fieldsApi = {
  async getField(fieldId: string): Promise<Field> {
    const res = await apiClient.get<FieldResponse>(`/fields/${fieldId}/`);
    return res.data.field;
  },

  async getFieldPosts(fieldId: string, params?: { page?: number; limit?: number }): Promise<FieldPostsResponse> {
    const res = await apiClient.get<Record<string, any>>(`/fields/${fieldId}/posts/`, { params });
    const data = res.data;
    const items = (data.posts || data.items || []) as Record<string, any>[];
    return {
      posts: items.map(p => transformPost(p)),
      page: (data.page || 1) as number,
      total: (data.total || 0) as number,
      total_pages: (data.total_pages || 1) as number,
    };
  },

  async followField(fieldId: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>(`/fields/${fieldId}/follow/`);
    return res.data;
  },

  async unfollowField(fieldId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/fields/${fieldId}/follow/`);
    return res.data;
  },
};
