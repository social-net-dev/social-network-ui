/**
 * Posts API Service
 */

import socialClient from '../../socialApi';
import { transformPost, transformComment } from '../transforms';

import type { Post, CreatePostRequest, CreateCommentRequest, UpdateCommentRequest, Comment, CommentResponse, FeedResponse, PaginationParams, ReplyRequest } from '../types';

export const postsApi = {
  async getFeed(params?: PaginationParams): Promise<FeedResponse> {
    const res = await socialClient.get<Record<string, any>>('/feed/', {
      params: {
        page: params?.page,
        page_size: params?.pageSize,
        field_id: params?.field_id,
        post_type: params?.post_type,
      },
    });
    const data = res?.data || res;
    const items = (Array.isArray(data) ? data : data.posts || data.items || []) as Record<string, any>[];

    return {
      posts: items.map(p => transformPost(p)),
      page: (data.page || 1) as number,
      page_size: (data.page_size || items.length) as number,
      total: (data.total || items.length) as number,
      total_pages: (data.total_pages || 1) as number,
    };
  },

  async getPosts(params?: PaginationParams): Promise<FeedResponse> {
    const res = await socialClient.get<Record<string, any>>('/posts/', { params });
    const data = res?.data || res;
    const items = (Array.isArray(data) ? data : data.posts || data.items || []) as Record<string, any>[];

    return {
      posts: items.map(p => transformPost(p)),
      page: (data.page || 1) as number,
      page_size: (data.page_size || items.length) as number,
      total: (data.total || items.length) as number,
      total_pages: (data.total_pages || 1) as number,
    };
  },

  async getPostDetail(postId: string): Promise<Post> {
    const res = await socialClient.get<Record<string, any>>(`/posts/${postId}/`);
    return transformPost((res?.data || res) as Record<string, any>);
  },

  async createPost(data: CreatePostRequest): Promise<Post> {
    const formData = new FormData();
    formData.append('content_text', data.content_text);
    formData.append('visibility', data.visibility || 'PUBLIC');
    if (data.post_type) formData.append('post_type', data.post_type);
    if (data.field_id) formData.append('field_id', data.field_id);
    if (data.files && data.files.length > 0) {
      data.files.forEach(file => formData.append('files', file));
    }

    const res = await socialClient.post<Record<string, any>>('/posts/create/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return transformPost((res?.data || res) as Record<string, any>);
  },

  async updatePost(postId: string, data: FormData | Record<string, unknown>): Promise<Post> {
    if (data instanceof FormData) {
      const res = await socialClient.post<Record<string, any>>(`/posts/${postId}/update/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return transformPost((res?.data || res) as Record<string, any>);
    }
    const res = await socialClient.post<Record<string, any>>(`/posts/${postId}/update/`, data);
    return transformPost((res?.data || res) as Record<string, any>);
  },

  async deletePost(postId: string): Promise<{ message: string }> {
    const res = await socialClient.post<{ message: string }>(`/posts/${postId}/delete/`);
    return res.data;
  },

  async getMyPosts(params?: PaginationParams): Promise<FeedResponse> {
    const res = await socialClient.get<Record<string, any>>('/posts/me/list/', { params });
    const data = res?.data || res;
    const items = (Array.isArray(data) ? data : data.posts || data.items || []) as Record<string, any>[];

    return {
      posts: items.map(p => transformPost(p)),
      page: (data.page || 1) as number,
      page_size: (data.page_size || items.length) as number,
      total: (data.total || items.length) as number,
      total_pages: (data.total_pages || 1) as number,
    };
  },

  async getPostsByUser(userId: string, params?: PaginationParams): Promise<FeedResponse> {
    const res = await socialClient.get<Record<string, any>>(`/posts/user/${userId}/`, { params });
    const data = res?.data || res;
    const items = (Array.isArray(data) ? data : data.posts || data.items || []) as Record<string, any>[];

    return {
      posts: items.map(p => transformPost(p)),
      page: (data.page || 1) as number,
      page_size: (data.page_size || items.length) as number,
      total: (data.total || items.length) as number,
      total_pages: (data.total_pages || 1) as number,
    };
  },

  async getPostComments(postId: string, params?: PaginationParams): Promise<CommentResponse> {
    const res = await socialClient.get<Record<string, any>>(`/posts/${postId}/comments/`, { params });
    const data = res?.data || res;
    const items = (Array.isArray(data) ? data : data.comments || data.items || []) as Record<string, any>[];

    return {
      comments: items.map(c => transformComment(c)),
      page: (data.page || 1) as number,
      page_size: (data.page_size || items.length) as number,
      total: (data.total || items.length) as number,
      total_pages: (data.total_pages || 1) as number,
    };
  },

  async createComment(data: CreateCommentRequest): Promise<Comment> {
    // Prefer post-scoped endpoint: /posts/{post_id}/comments/
    const formData = new FormData();
    formData.append('content_text', data.content_text);
    if (data.files && data.files.length > 0) {
      data.files.forEach(file => formData.append('files', file));
      const res = await socialClient.post<Record<string, any>>(`/posts/${data.post_id}/comments/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return transformComment((res?.data || res) as Record<string, any>);
    }

    // No files -> send JSON payload to post-scoped comments endpoint
    const payload = { content_text: data.content_text };
    const res = await socialClient.post<Record<string, any>>(`/posts/${data.post_id}/comments/`, payload);
    return transformComment((res?.data || res) as Record<string, any>);
  },

  async updateComment(commentId: string, data: FormData | UpdateCommentRequest): Promise<Comment> {
    if (data instanceof FormData) {
      const res = await socialClient.post<Record<string, any>>(`/comments/${commentId}/update/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return transformComment((res?.data || res) as Record<string, any>);
    }
    const res = await socialClient.post<Record<string, any>>(`/comments/${commentId}/update/`, data);
    return transformComment((res?.data || res) as Record<string, any>);
  },

  async deleteComment(commentId: string): Promise<{ message: string }> {
    const res = await socialClient.post<{ message: string }>(`/comments/${commentId}/delete/`);
    return res.data;
  },

  async replyToComment(commentId: string, data: ReplyRequest): Promise<Comment> {
    const formData = new FormData();
    formData.append('post_id', data.post_id);
    formData.append('content_text', data.content_text);
    if (data.files && data.files.length > 0) {
      data.files.forEach(file => formData.append('files', file));
    }
    const res = await socialClient.post<Record<string, any>>(`/comments/${commentId}/replies/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return transformComment((res?.data || res) as Record<string, any>);
  },

  async getCommentReplies(commentId: string, page = 1, pageSize = 20): Promise<{ replies: Comment[]; total: number; total_pages: number; page: number }> {
    const res = await socialClient.get<{ replies: Record<string, any>[]; total: number; total_pages: number; page: number }>(`/comments/${commentId}/replies/?page=${page}&page_size=${pageSize}`);
    const data = res.data || (res as any);
    return {
      ...data,
      replies: (data.replies || []).map((r: Record<string, any>) => transformComment(r)),
    };
  },
};
