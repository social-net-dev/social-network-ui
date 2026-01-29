import { z } from "zod";

export const UserSchema = z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    avatar: z.string().url().optional(),
    bio: z.string().optional(),
    followers: z.number().optional(),
    following: z.number().optional(),
    postsCount: z.number().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    role: z.enum(["USER", "ADMIN"]).optional(),
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
