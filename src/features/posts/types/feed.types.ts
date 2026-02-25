import { z } from 'zod';
import type { 
  MediaAssetSummary, 
  PostSummary, 
  Author as GeneratedAuthor,
  PersonalInfo as GeneratedPersonalInfo,
  Project as GeneratedProject,
  ReactionType as GeneratedReactionType,
  Comment as GeneratedComment,
  CommentStats as GeneratedCommentStats,
  PostStats as GeneratedPostStats
} from '@/lib/api/generated/model';

export type ProfileVisibilityResponse = {
  visibility: string;
  display_name_visibility?: string;
  birth_date_visibility?: string;
  bio_visibility?: string;
  avatar_visibility?: string;
};

// ===========================
// 🎯 FRONTEND MODELS (Chuẩn FE)
// ===========================

/**
 * Re-export types from generated models
 */
export type ReactionType = GeneratedReactionType;
export type Project = GeneratedProject;
export type PersonalInfo = GeneratedPersonalInfo;
export type PostStats = GeneratedPostStats;
export type CommentStats = GeneratedCommentStats;

/**
 * Frontend Author Model - extends generated Author with optional legacy fields
 */
export type Author = GeneratedAuthor & {
  background?: string | null;
  bio?: string;
  personalInfo?: PersonalInfo;
  birthDate?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  storageQuotaMb?: number;
  privacy?: ProfileVisibilityResponse;
  isFriend?: boolean;
  isOwner?: boolean;
  // Legacy support
  firstName?: string;
  lastName?: string;
  email?: string;
};

/**
 * Frontend Media Model
 * @deprecated Sử dụng MediaAssetSummary từ generated model
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
 * Re-export MediaAssetSummary for convenience
 */
export type { MediaAssetSummary };

/**
 * Frontend Post Model - extends PostSummary with sharedPost field
 * Align với TypeSpec contract: có mediaUrls + media?: MediaAssetSummary[]
 */
export interface FeedPost {
  id: string;
  author: Author;
  content: string;
  mediaUrls: string[];
  media?: MediaAssetSummary[];
  stats: PostStats;
  userReaction: ReactionType | null;
  sharedPost: PostSummary | null;
  visibility: string;
  postType?: string;
  fieldId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Frontend Comment Model - uses generated Comment type
 */
export type FeedComment = GeneratedComment & {
  author: Author;
};

// ===========================
// 📝 FORM SCHEMAS (Validated against Generated Zod)
// ===========================

export const CreatePostFormDataSchema = z.object({
  content: z.string().min(1, 'Nội dung không được để trống').max(2000, 'Nội dung tối đa 2000 ký tự'),
  images: z.array(z.instanceof(File)).max(4, 'Tối đa 4 hình ảnh').optional(),
});

export type CreatePostFormData = z.infer<typeof CreatePostFormDataSchema>;

/**
 * @deprecated Use FeedPost directly
 */
export type Post = FeedPost;

/**
 * @deprecated Use FeedComment directly
 */
export type Comment = FeedComment;
