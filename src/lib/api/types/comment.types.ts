/**
 * Comment related types
 */

import type { Author } from './user.types';
import type { ReactionType } from './common.types';

export interface CommentStats {
  reactions: number;
  replies: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: Author;
  parentCommentId: string | null;
  content: string;
  mediaUrls: string[];
  stats: CommentStats;
  userReaction: ReactionType | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  post_id: string;
  content_text: string;
  media_urls?: string[];
  files?: File[];
}

export interface UpdateCommentRequest {
  content_text: string;
}

export interface ReplyRequest {
  post_id: string;
  content_text: string;
  files?: File[];
}

export interface CommentResponse {
  comments: Comment[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}
