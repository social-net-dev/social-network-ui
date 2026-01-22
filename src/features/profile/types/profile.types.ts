import { z } from 'zod'

export const ProfileDataSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  avatar: z.string().url().optional(),
  bio: z.string().optional(),
  followers: z.number(),
  following: z.number(),
  postsCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ProfileData = z.infer<typeof ProfileDataSchema>

export const EditProfileFormDataSchema = z.object({
  firstName: z.string().min(2, 'Họ tối thiểu 2 ký tự'),
  lastName: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  bio: z.string().max(500, 'Giới thiệu tối đa 500 ký tự').optional(),
  avatar: z.string().url().optional(),
})

export type EditProfileFormData = z.infer<typeof EditProfileFormDataSchema>

export interface ProfileStats {
  posts: number
  followers: number
  following: number
}
