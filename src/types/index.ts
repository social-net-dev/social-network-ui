import { z } from "zod";

export const UserSchema = z.object({
    id: z.string(),
    username: z.string().nullable().optional(),
    displayName: z.string().nullable().optional(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    avatar: z.string().url().nullable().optional(),
    bio: z.string().nullable().optional(),
    followers: z.number().optional(),
    following: z.number().optional(),
    postsCount: z.number().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    role: z.string().optional(),
    account_status: z.enum(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED", "LOCKED", "DISABLED", "DEACTIVATED", "TERMINATED"]).optional(),
    storage_quota_mb: z.number().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const PostSchema = z.object({
    id: z.string(),
    authorId: z.string(),
    author: UserSchema,
    content: z.string(),
    images: z.array(z.string().url()),
    likes: z.number(),
    comments: z.number(),
    shares: z.number(),
    likedByCurrentUser: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type Post = z.infer<typeof PostSchema>;

export const CommentSchema = z.object({
    id: z.string(),
    postId: z.string(),
    authorId: z.string(),
    author: UserSchema,
    content: z.string(),
    likes: z.number(),
    likedByCurrentUser: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type Comment = z.infer<typeof CommentSchema>;
