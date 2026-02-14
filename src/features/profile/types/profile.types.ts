import { z } from 'zod'
import type { User } from '@/lib/api/types/user.types'

/**
 * Unified Profile View (Frontend-specific)
 */
export type ProfileData = User & {
  isOwner: boolean;
  isFriend: boolean;
  privacy?: {
    displayNameVisibility: Visibility;
    birthDateVisibility: Visibility;
    bioVisibility: Visibility;
    avatarVisibility: Visibility;
  };
}

/**
 * UI Form Schemas
 */
export const EditProfileFormDataSchema = z.object({
  displayName: z.string().min(2, 'Tên hiển thị tối thiểu 2 ký tự'),
  username: z.string().regex(/^[A-Za-z0-9_.]{3,50}$/, 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới và dấu chấm').optional().or(z.literal('')),
  birthDate: z.string().optional(),
  bio: z.string().max(1000, 'Giới thiệu tối đa 1000 ký tự').optional(),
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

/**
 * Backend Model Aliases (Deprecated)
 */
export type PublicProfileResponse = any;
export type UserMeResponse = any;
export type UpdateProfileRequest = any;
export type ProfileVisibilityResponse = any;
export type ProfileVisibilityUpdateRequest = any;
