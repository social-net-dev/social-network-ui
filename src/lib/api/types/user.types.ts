/**
 * User related types
 */

import type { Visibility } from './common.types';

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  sourceLink?: string;
}

export interface PersonalInfo {
  educationLevel?: string;
  school?: string;
  class?: string;
  degree?: string;
  major?: string;
  graduationYear?: string;
  academicYear?: string;
  schoolYear?: string;
  favoriteSubjects?: string[];
  hobbies?: string[];
  projects?: Project[];
  location?: string;
}

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  username: string;
  displayName: string;
  bio?: string;
  personalInfo?: PersonalInfo;
  birthDate?: string | null;
  avatarPath?: string;
  avatar?: string | null;
  backgroundPath?: string;
  background?: string | null;
  accountStatus: string;
  role: string;
  storageQuotaMb?: number;
  createdAt: string;
  updatedAt?: string;
  privacy?: {
    visibility: Visibility;
    display_name_visibility?: Visibility;
    birth_date_visibility?: Visibility;
    bio_visibility?: Visibility;
    avatar_visibility?: Visibility;
  };
  // Stats
  followers?: number;
  following?: number;
  postsCount?: number;
  // Flags
  isFriend?: boolean;
  isOwner?: boolean;
  friendshipStatus?: string;
  friendRequestId?: string | null;
}

export interface Author {
  id: string;
  displayName: string;
  username: string;
  avatar: string | null;
  role?: string;
  accountStatus?: string;
}

export interface UpdateProfileRequest {
  display_name?: string;
  username?: string;
  bio?: string;
  birth_date?: string;
}

export interface UploadAvatarResponse {
  avatar_url: string;
}

export interface UploadBackgroundResponse {
  background_url: string;
}

export interface UpdatePrivacyRequest {
  visibility: Visibility;
}

export interface DeactivateRequest {
  password: string;
}

export interface ReactivationRequest {
  email: string;
}
