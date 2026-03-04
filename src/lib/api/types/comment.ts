import type { CursorPaginatedResponse, ReactionType } from './common';
import type { Author } from './user';

// ─── Comment Models ────────────────────────────────────────────────────────────

export interface CommentStats {
  reactions: number;
  replies: number;
}

export interface Comment {
  id: string;
  post_id: string;
  author: Author;
  parent_comment_id: string | null;
  content: string;
  media_urls: string[];
  stats: CommentStats;
  user_reaction: ReactionType | null;
  created_at: string;
  updated_at: string;
}

export type CommentResponse = CursorPaginatedResponse<Comment>;

// ─── Request Payloads ──────────────────────────────────────────────────────────

export interface CreateCommentRequest {
  post_id: string;
  content_text: string;
  media_asset_ids?: string[];
}

export interface UpdateCommentRequest {
  content_text: string;
}

export interface ReplyRequest {
  post_id: string;
  content_text: string;
  media_asset_ids?: string[];
}
