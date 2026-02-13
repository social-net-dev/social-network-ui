/**
 * User Transforms (Simplified)
 */

import { buildMediaUrl } from './common';
import type { User, Author, PersonalInfo } from '../types/user.types';

/**
 * Extract personal info from bio string if it's JSON
 */
const parseBioInfo = (bio: string | null | undefined): { bioText: string; personalInfo: PersonalInfo } => {
  if (!bio) return { bioText: '', personalInfo: {} };
  
  try {
    // Check if it's JSON
    if (bio.startsWith('{') && bio.endsWith('}')) {
      const parsed = JSON.parse(bio);
      // If it has our expected fields, it's our structured bio
      if (parsed.school || parsed.class || parsed.educationLevel || parsed.academicYear || parsed.schoolYear || parsed.favoriteSubjects || parsed.hobbies || parsed.projects || parsed.bioText !== undefined) {
        return {
          bioText: parsed.bioText || '',
          personalInfo: {
            educationLevel: parsed.educationLevel,
            school: parsed.school,
            class: parsed.class,
            degree: parsed.degree,
            major: parsed.major,
            graduationYear: parsed.graduationYear,
            academicYear: parsed.academicYear,
            schoolYear: parsed.schoolYear,
            favoriteSubjects: parsed.favoriteSubjects,
            hobbies: parsed.hobbies,
            location: parsed.location,
          }
        };
      }
    }
  } catch (e) {
    // Not JSON or parse error
  }
  
  return { bioText: bio, personalInfo: {} };
};

/**
 * Transform Backend User to Frontend Author model
 */
export const transformAuthor = (author: Record<string, any> | null | undefined): Author => {
  if (!author) {
    return {
      id: '',
      displayName: 'Người dùng',
      avatar: null,
      username: '',
    };
  }

  return {
    id: String(author.id || ''),
    displayName: String(author.display_name || author.displayName || author.username || 'Người dùng'),
    avatar: buildMediaUrl(author.avatar_url || author.avatar_path || author.avatar),
    username: String(author.username || ''),
    role: author.role as Author['role'],
    accountStatus: (author.account_status || author.accountStatus) as Author['accountStatus'],
  };
};

/**
 * Transform Backend User to Frontend User model
 */
export const transformUser = (user: Record<string, any> | null | undefined): User => {
  if (!user) return {} as User;

  const { bioText, personalInfo } = parseBioInfo(user.bio as string);

  return {
    id: String(user.id || ''),
    email: String(user.email || ''),
    phone: user.phone as string | undefined,
    username: String(user.username || ''),
    displayName: String(user.display_name || user.displayName || user.username || 'Người dùng'),
    bio: bioText,
    personalInfo,
    birthDate: (user.birth_date || user.birthDate) as string,
    avatarPath: (user.avatar_path || user.avatarPath) as string,
    avatar: buildMediaUrl(user.avatar_url || user.avatar_path || user.avatar),
    backgroundPath: (user.background_path || user.backgroundPath) as string,
    background: buildMediaUrl(user.background_url || user.background_path || user.background),
    accountStatus: (user.account_status || user.accountStatus || 'UNVERIFIED') as User['accountStatus'],
    role: (user.role || 'USER') as User['role'],
    storageQuotaMb: (user.storage_quota_mb || user.storageQuotaMb) as number,
    createdAt: (user.created_at || user.createdAt || '') as string,
    updatedAt: (user.updated_at || user.updatedAt || '') as string,
    privacy: user.privacy ? {
      visibility: (user.privacy as any).visibility || 'PUBLIC',
      display_name_visibility: (user.privacy as any).display_name_visibility || (user.privacy as any).displayNameVisibility,
      birth_date_visibility: (user.privacy as any).birth_date_visibility || (user.privacy as any).birthDateVisibility,
      bio_visibility: (user.privacy as any).bio_visibility || (user.privacy as any).bioVisibility,
      avatar_visibility: (user.privacy as any).avatar_visibility || (user.privacy as any).avatarVisibility,
    } : undefined,
    // Stats
    followers: (user.followers_count ?? user.followers ?? 0) as number,
    following: (user.following_count ?? user.following ?? 0) as number,
    postsCount: (user.posts_count ?? user.posts ?? 0) as number,
    // Flags
    isFriend: (user.is_friend ?? user.isFriend) as boolean,
    isOwner: (user.is_owner ?? user.isOwner) as boolean,
  };
};
