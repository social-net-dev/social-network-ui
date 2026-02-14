/**
 * Common types used across the application
 */

export type PaginationParams = {
  page?: number;
  pageSize?: number;
  field_id?: string;
  post_type?: string;
};

export type PaginatedResponse<T> = {
  items?: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  request_id?: string;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message?: string;
    details?: Record<string, unknown>;
  };
  request_id?: string;
};

export type Visibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

export type PostType = 'SOCIAL' | 'JOB' | 'QUESTION';

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'STAFF';

export type NotificationType =
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPT'
  | 'POST_LIKE'
  | 'POST_COMMENT'
  | 'COMMENT_REPLY'
  | 'MENTION'
  | 'SYSTEM';
