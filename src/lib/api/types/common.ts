// ─── Error Types ───────────────────────────────────────────────────────────────

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'USER_LOCKED'
  | 'INVALID_CREDENTIALS'
  | 'INTERNAL_ERROR';

export interface ValidationErrorItem {
  loc: string[];
  msg: string;
  type: string;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: ValidationErrorItem[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  request_id?: string;
}

// ─── Envelope ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
  request_id?: string;
}

// ─── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface CursorPaginationMeta {
  next_cursor: string | null;
  has_next_page: boolean;
}

export interface CursorPaginatedResponse<T> {
  items: T[];
  pagination: CursorPaginationMeta;
}

// ─── Enums ─────────────────────────────────────────────────────────────────────

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

export type PrivacyField =
  | 'display_name'
  | 'birth_date'
  | 'bio'
  | 'avatar'
  | 'background'
  | 'personal_info';
