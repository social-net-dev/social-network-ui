import type { CursorPaginatedResponse, ReactionType, Visibility, PostType } from './common';
import type { Author } from './user';
import type { MediaAssetSummary } from './media';

// ─── Post Models ───────────────────────────────────────────────────────────────

export interface PostStats {
  reactions: number;
  comments: number;
  shares: number;
}

export interface PostSummary {
  id: string;
  author: Author;
  content: string;
  media_urls: string[];
  media?: MediaAssetSummary[];
  stats: PostStats;
  user_reaction: ReactionType | null;
  visibility: Visibility;
  post_type: PostType;
  field_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Post extends PostSummary {
  shared_post: PostSummary | null;
}

export type FeedResponse = CursorPaginatedResponse<PostSummary>;

// ─── Request Payloads ──────────────────────────────────────────────────────────

export interface CreatePostRequest {
  content_text: string;
  visibility?: Visibility;
  post_type?: PostType;
  field_id?: string;
  media_asset_ids?: string[];
}

export interface UpdatePostRequest {
  content_text?: string;
  visibility?: Visibility;
  media_uploads?: string[];
}

// ─── Share ─────────────────────────────────────────────────────────────────────

export interface SharePostRequest {
  message?: string;
}

export interface ShareResponse {
  id: string;
  post_id: string;
  user_id: string;
  message?: string;
  created_at: string;
}
