import { z } from "zod";
import * as Models from "@/lib/api/generated/model";
import * as ZodModels from "@/lib/api/generated/zod";
import type { Author as FEAuthor, FeedPost as FEPost, FeedComment as FEComment, ReactionType as FEReactionType } from "@/features/home/types/feed.types";

/**
 * Single Source of Truth for Types
 * This file re-exports types from Orval and defines Frontend-specific views.
 */

// Re-export all backend models
export { Models };

// Re-export all validation schemas
export { ZodModels };

// Define Aliases for clarity
export type User = FEAuthor;
export type Post = FEPost;
export type Comment = FEComment;
export type ReactionType = FEReactionType;

// Standard Response Wrapper (Matching etechs-middleware)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Validation Schemas (Derived from Orval if possible, or defined manually for UI)
export const UserSchema = z.any(); // We prefer using FEAuthor type
export const PostSchema = z.any();
export const CommentSchema = z.any();
