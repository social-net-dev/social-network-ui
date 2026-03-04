import { z } from "zod";
import type { User, PostSummary as Post, Comment } from "@/lib/api/types";

/**
 * Single Source of Truth for Types
 * This file re-exports types from Orval-generated model.
 */

// Stub for ZodModels
export const ZodModels = {};

// Re-export generated model types
export type { User, Post, Comment };
export type ReactionType = string;

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
