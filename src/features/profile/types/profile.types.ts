import { z } from 'zod'

export const ProfileDataSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  displayName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  bio: z.string().optional(),
  birthDate: z.string().optional(),
  role: z.string().optional(),
  accountStatus: z.string().optional(),
  storageQuotaMb: z.number().optional(),

  // Stats - will come from friends/posts endpoints
  followers: z.number().default(0),
  following: z.number().default(0),
  postsCount: z.number().default(0),

  createdAt: z.string(),
  updatedAt: z.string(),

  // Relationships
  isOwner: z.boolean().default(false),
  isFriend: z.boolean().default(false),

  // Privacy settings (only available for own profile)
  privacy: z.object({
    displayNameVisibility: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']),
    birthDateVisibility: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']),
    bioVisibility: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']),
    avatarVisibility: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']),
  }).optional(),
})

export type ProfileData = z.infer<typeof ProfileDataSchema>

export const EditProfileFormDataSchema = z.object({
  displayName: z.string().min(2, 'Tên hiển thị tối thiểu 2 ký tự'),
  username: z.string().regex(/^[A-Za-z0-9_.]{3,50}$/, 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới và dấu chấm').optional().or(z.literal('')),
  birthDate: z.string().optional(),
  bio: z.string().max(500, 'Giới thiệu tối đa 500 ký tự').optional(),
})

export type EditProfileFormData = z.infer<typeof EditProfileFormDataSchema>

export const VisibilitySchema = z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE'])
export type Visibility = z.infer<typeof VisibilitySchema>

export const ProfileVisibilitySchema = z.object({
  displayNameVisibility: VisibilitySchema,
  birthDateVisibility: VisibilitySchema,
  bioVisibility: VisibilitySchema,
  avatarVisibility: VisibilitySchema,
})

export type ProfileVisibility = z.infer<typeof ProfileVisibilitySchema>

export interface ProfileStats {
  posts: number
  followers: number
  following: number
}

// Backend Response Types
export interface PublicProfileResponse {
  id: string
  username: string | null
  display_name: string | null
  birth_date: string | null
  bio: string | null
  avatar_path: string | null
  is_friend: boolean
  is_owner: boolean
}

export interface UserMeResponse {
  id: string
  email: string
  phone: string | null
  username: string | null
  display_name: string
  birth_date: string | null
  bio: string | null
  avatar_path: string | null
  account_status: string
  role: string
  storage_quota_mb: number
  created_at: string
}

export interface UpdateProfileRequest {
  username?: string | null
  display_name?: string | null
  birth_date?: string | null
  bio?: string | null
}

export interface ProfileVisibilityResponse {
  user_id: string
  display_name_visibility: string
  birth_date_visibility: string
  bio_visibility: string
  avatar_visibility: string
  created_at: string
  updated_at: string
}

export interface ProfileVisibilityUpdateRequest {
  display_name_visibility?: string | null
  birth_date_visibility?: string | null
  bio_visibility?: string | null
  avatar_visibility?: string | null
}
