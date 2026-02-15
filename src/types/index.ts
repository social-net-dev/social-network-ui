import { z } from "zod";
import * as Models from "@/lib/api/types";
import type { Post as FEPost, ReactionType as FEReactionType } from "@/lib/api/types";
import type { Comment as FEComment } from "@/lib/api/types";

/**
 * Single Source of Truth for Types
 * This file re-exports types from Orval and defines Frontend-specific views.
 */

// Re-export all manual api types
export { Models };

// Stub for ZodModels
export const ZodModels = {};

// Define Aliases for clarity
export type User = Models.User;
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
