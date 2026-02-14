/**
 * Post related types
 */

import type { Author } from './user.types';
import type { Visibility, PostType, ReactionType } from './common.types';

export interface MediaFile {
  id: string;
  file_url: string;
  file_path?: string;
  media_type?: string;
}

export interface PostStats {
  reactions: number;
  comments: number;
  shares: number;
}

export interface Post {
  id: string;
  author: Author;
  content: string;
  mediaUrls: string[];
  stats: PostStats;
  userReaction: ReactionType | null;
  sharedPost: Post | null;
  visibility: Visibility;
  postType: PostType;
  fieldId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostRequest {
  content_text: string;
  media_urls?: string[];
  visibility?: Visibility;
  post_type?: PostType;
  field_id?: string;
  tags?: string[];
  files?: File[];
}

export interface UpdatePostRequest {
  content_text?: string;
  visibility?: Visibility;
  media_uploads?: string[];
}

export interface FeedResponse {
  posts: Post[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}
