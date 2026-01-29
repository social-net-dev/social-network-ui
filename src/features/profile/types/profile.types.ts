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
  location: z.string().optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  joinDate: z.string().optional(),
  skills: z.array(z.object({
    name: z.string(),
    level: z.number(),
    category: z.enum(['technical', 'soft', 'certification']),
    iconName: z.string().optional(),
  })).optional(),
  experience: z.array(z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    location: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    current: z.boolean().optional(),
    description: z.string().optional(),
    achievements: z.array(z.string()).optional(),
    technologies: z.array(z.string()).optional(),
  })).optional(),
  achievements: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    iconName: z.string(),
    level: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']),
    earnedDate: z.string().optional(),
    progress: z.number().optional(),
    total: z.number().optional(),
  })).optional(),
  socialLinks: z.array(z.object({
    platform: z.enum(['facebook', 'linkedin', 'twitter', 'github', 'website']),
    url: z.string().url(),
    label: z.string(),
  })).optional(),
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

export const PrivacySettingSchema = z.enum(['everyone', 'connections', 'only_me'])
export type PrivacySetting = z.infer<typeof PrivacySettingSchema>

export const ProfilePrivacySchema = z.object({
  email: PrivacySettingSchema,
  phone: PrivacySettingSchema,
  academicHistory: PrivacySettingSchema,
  certificates: PrivacySettingSchema,
  courseGrades: PrivacySettingSchema,
  searchEngineIndexing: z.boolean(),
})

export type ProfilePrivacy = z.infer<typeof ProfilePrivacySchema>

export interface ProfileStats {
  posts: number
  followers: number
  following: number
}
