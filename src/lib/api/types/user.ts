import type { Visibility, PrivacyField } from './common';

// ─── Author ────────────────────────────────────────────────────────────────────

export interface Author {
  id: string;
  display_name: string;
  username: string;
  avatar: string | null;
  role?: string;
  account_status?: string;
}

// ─── Personal Info ─────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string;
  source_link?: string;
}

export interface PersonalInfo {
  education_level?: string;
  school?: string;
  class?: string;
  degree?: string;
  major?: string;
  graduation_year?: string;
  academic_year?: string;
  school_year?: string;
  favorite_subjects?: string[];
  hobbies?: string[];
  location?: string;
  projects?: Project[];
}

// ─── User Models ───────────────────────────────────────────────────────────────

export interface UserBase {
  id: string;
  username: string;
  display_name: string;
  avatar?: string | null;
  account_status: string;
  role: string;
  created_at: string;
  updated_at?: string;
}

export interface UserPublic extends UserBase {
  bio?: string;
  personal_info?: PersonalInfo;
  birth_date?: string | null;
  background?: string | null;
  followers?: number;
  following?: number;
  posts_count?: number;
  viewer_context?: {
    is_owner: boolean;
    is_friend: boolean;
    friendship_status?: string;
    friend_request_id?: string | null;
  };
  redacted_fields?: PrivacyField[];
}

export interface UserMe extends UserPublic {
  email: string;
  phone?: string | null;
  storage_quota_mb?: number;
  privacy?: UserPrivacy;
}

export type User = UserMe;

// ─── Privacy ───────────────────────────────────────────────────────────────────

export interface PrivacyOverride {
  field: PrivacyField;
  visibility: Visibility;
}

export interface UserPrivacy {
  default_visibility: Visibility;
  overrides?: PrivacyOverride[];
}

// ─── Request Payloads ──────────────────────────────────────────────────────────

export interface UpdateProfileRequest {
  display_name?: string;
  username?: string;
  bio?: string;
  birth_date?: string;
  personal_info?: PersonalInfo;
}

export interface UpdatePrivacyRequest {
  default_visibility?: Visibility;
  overrides?: PrivacyOverride[];
}

export interface SetAvatarRequest {
  asset_id: string;
}

export interface SetBackgroundRequest {
  asset_id: string;
}

export interface UploadAvatarResponse {
  avatar_url: string;
}

export interface UploadBackgroundResponse {
  background_url: string;
}

export interface DeactivateRequest {
  password: string;
}

export interface ReactivationRequest {
  email: string;
}
