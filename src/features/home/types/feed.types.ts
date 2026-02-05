import { z } from 'zod';
import type { ProfileVisibilityResponse } from '@/lib/api/generated/model';

// ===========================
// 🎯 FRONTEND MODELS (Chuẩn FE)
// ===========================

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  sourceLink?: string;
}

export interface PersonalInfo {
  school?: string;
  class?: string;
  degree?: string;
  major?: string;
  graduationYear?: string;
  favoriteSubjects?: string[];
  hobbies?: string[];
  projects?: Project[];
}

/**
 * Frontend Author Model
 */
export interface Author {
  id: string;
  displayName: string;
  avatar: string | null;
  username?: string | null;
  role?: string;
  bio?: string;
  personalInfo?: PersonalInfo;
  birthDate?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  accountStatus?: string;
  storageQuotaMb?: number;
  privacy?: ProfileVisibilityResponse;
  // Legacy support
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * Frontend Media Model
 */
export interface MediaFile {
  id: string;
  url: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

/**
 * Frontend Post Model - Schema FE RÕ RÀNG
 */
export interface FeedPost {
  id: string;
  author: Author;
  content: string;
  mediaUrls: string[];
  stats: {
    reactions: number;
    comments: number;
    shares: number;
  };
  userReaction: ReactionType | null;
  sharedPost: FeedPost | null;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Frontend Comment Model
 */
export interface FeedComment {
  id: string;
  postId: string;
  author: Author;
  parentCommentId: string | null;
  content: string;
  mediaUrls: string[];
  stats: {
    reactions: number;
    replies: number;
  };
  userReaction: ReactionType | null;
  createdAt: string;
}

// ===========================
// 📝 FORM SCHEMAS (Validated against Generated Zod)
// ===========================

export const CreatePostFormDataSchema = z.object({
  content: z.string().min(1, 'Nội dung không được để trống').max(2000, 'Nội dung tối đa 2000 ký tự'),
  images: z.array(z.instanceof(File)).max(4, 'Tối đa 4 hình ảnh').optional(),
});

export type CreatePostFormData = z.infer<typeof CreatePostFormDataSchema>;

// ===========================
// 🔄 LEGACY SUPPORT (tương thích ngược)
// ===========================

/**
 * @deprecated Dùng FeedPost thay thế
 */
export type Post = FeedPost & {
  author_id?: string;
  content_text?: string;
  reaction_count?: number;
  comment_count?: number;
  share_count?: number;
  user_reaction?: string | null;
  shared_post_id?: string | null;
  shared_post?: Post | null;
};

/**
 * @deprecated Dùng FeedComment thay thế
 */
export type Comment = FeedComment & {
  post_id?: string;
  author_id?: string;
  parent_comment_id?: string | null;
  content_text?: string;
  reaction_count?: number;
  reply_count?: number;
  user_reaction?: string | null;
};

/**
 * Re-exporting Backend Models for use in transforms
 */
export type { PostOut as IBackendPost, AuthorInfo as IBackendAuthor, CommentOut as IBackendComment, FeedResponse as IBackendFeedResponse } from '@/lib/api/generated/model';
