import { z } from "zod";

// ===========================
// 🎯 FRONTEND MODELS (Chuẩn FE)
// ===========================

export type ReactionType = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";

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
  birthDate?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  accountStatus?: string;
  storageQuotaMb?: number;
  privacy?: any;
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
// 🔧 BACKEND RESPONSE TYPES
// ===========================

/**
 * Backend Author Response
 */
export interface IBackendAuthor {
  id: string;
  username: string | null;
  display_name: string;
  avatar_path: string | null;
  avatar_url?: string | null;
}

/**
 * Backend Media File Response
 */
export interface IBackendMediaFile {
  id: string;
  file_path: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  order_index: number;
  thumbnail_path: string | null;
  thumbnail_url: string | null;
  upload_status: string;
  created_at: string;
}

/**
 * Backend Post Response
 */
export interface IBackendPost {
  id: string;
  author_id: string;
  author: IBackendAuthor;
  content_text: string;
  media_path: string | null;
  media_paths: string[] | null;
  media_urls: string[] | null;
  media_files?: IBackendMediaFile[];
  visibility: string;
  shared_post_id: string | null;
  shared_post: IBackendPost | null;
  is_original_deleted?: boolean;
  created_at: string;
  updated_at: string;
  reaction_count: number;
  comment_count: number;
  share_count: number;
  user_reaction: string | null;
}

/**
 * Backend Comment Response
 */
export interface IBackendComment {
  id: string;
  post_id: string;
  author_id: string;
  author: IBackendAuthor;
  parent_comment_id: string | null;
  content_text: string;
  media_paths: string[] | null;
  media_urls: string[] | null;
  media_files: IBackendMediaFile[];
  created_at: string;
  reaction_count: number;
  reply_count: number;
  user_reaction: string | null;
}

/**
 * Backend Feed Response
 */
export interface IBackendFeedResponse {
  posts: IBackendPost[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

// ===========================
// 📝 FORM SCHEMAS
// ===========================

export const CreatePostFormDataSchema = z.object({
  content: z
    .string()
    .min(1, "Nội dung không được để trống")
    .max(2000, "Nội dung tối đa 2000 ký tự"),
  images: z.array(z.string().url()).max(4, "Tối đa 4 hình ảnh").optional(),
});

export type CreatePostFormData = z.infer<typeof CreatePostFormDataSchema>;

export interface CreatePostPayload {
  content_text: string;
  visibility: string;
  files?: File[];
}

// ===========================
// 🔄 LEGACY SUPPORT (tương thích ngược)
// ===========================

/**
 * @deprecated Dùng FeedPost thay thế
 */
export type Post = FeedPost & {
  // Support legacy fields
  author_id?: string;
  authorId?: string;
  content_text?: string;
  images?: string[];
  media_path?: string;
  media_paths?: string[];
  media_urls?: string[];
  likes?: number;
  comments?: number;
  shares?: number;
  likedByCurrentUser?: boolean;
  reaction_count?: number;
  comment_count?: number;
  share_count?: number;
  user_reaction?: string | null;
  shared_post_id?: string | null;
  shared_post?: Post | null;
  created_at?: string;
  updated_at?: string;
};

/**
 * @deprecated Dùng FeedComment thay thế
 */
export type Comment = FeedComment & {
  // Support legacy fields
  post_id?: string;
  author_id?: string;
  parent_comment_id?: string | null;
  content_text?: string;
  media_paths?: string[] | null;
  media_urls?: string[] | null;
  media_files?: IBackendMediaFile[];
  created_at?: string;
  postId?: string;
  authorId?: string;
  likes?: number;
  likedByCurrentUser?: boolean;
  createdAt?: string;
  reaction_count?: number;
  reply_count?: number;
  user_reaction?: string | null;
};
