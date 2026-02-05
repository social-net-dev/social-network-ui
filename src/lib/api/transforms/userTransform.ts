import { Models } from '../generated';
import { appendAuthToken } from './common';
import type { Author, PersonalInfo } from '@/features/home/types/feed.types';

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
      if (parsed.school || parsed.class || parsed.favoriteSubjects || parsed.hobbies || parsed.bioText !== undefined) {
        return {
          bioText: parsed.bioText || '',
          personalInfo: {
            school: parsed.school,
            class: parsed.class,
            favoriteSubjects: parsed.favoriteSubjects,
            hobbies: parsed.hobbies,
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
 * Transform Generated AuthorInfo/PublicProfileResponse to Frontend Author model
 */
export const transformAuthor = (author: Models.AuthorInfo | Models.PublicProfileResponse | null | undefined): Author => {
  if (!author) {
    return {
      id: '',
      displayName: 'Người dùng',
      avatar: null,
      username: '',
      role: 'USER',
    };
  }

  // bio might not exist on AuthorInfo, but exists on PublicProfileResponse
  const bio = (author as any).bio;
  const { bioText, personalInfo } = parseBioInfo(bio);

  return {
    id: author.id,
    displayName: author.display_name || 'Người dùng',
    avatar: appendAuthToken(author.avatar_path),
    username: author.username || '',
    bio: bioText,
    personalInfo,
    // Support legacy fields if needed by components
    firstName: (author.display_name || 'Người dùng').split(' ')[0] || '',
    lastName: (author.display_name || 'Người dùng').split(' ').slice(1).join(' ') || '',
  };
};

/**
 * Transform UserMeResponse to Frontend Author model (unified)
 */
export const transformUserMe = (user: Models.UserMeResponse): Author => {
  const { bioText, personalInfo } = parseBioInfo(user.bio);
  
  return {
    id: user.id,
    displayName: user.display_name,
    avatar: appendAuthToken(user.avatar_path),
    username: user.username || '',
    email: user.email,
    role: user.role,
    accountStatus: user.account_status,
    storageQuotaMb: user.storage_quota_mb,
    createdAt: user.created_at,
    bio: bioText,
    personalInfo,
    // Default stats for me if missing
    followers: 0,
    following: 0,
    postsCount: 0,
  };
};
