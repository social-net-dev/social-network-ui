import { Models } from '../generated';
import { appendAuthToken } from './common';
import type { Author } from '@/features/home/types/feed.types';

/**
 * Transform Generated AuthorInfo to Frontend Author model
 */
export const transformAuthor = (author: Models.AuthorInfo | null | undefined): Author => {
  if (!author) {
    return {
      id: '',
      displayName: 'Người dùng',
      avatar: null,
      username: '',
    };
  }

  return {
    id: author.id,
    displayName: author.display_name,
    avatar: appendAuthToken(author.avatar_path),
    username: author.username || '',
    // Support legacy fields if needed by components
    firstName: author.display_name.split(' ')[0] || '',
    lastName: author.display_name.split(' ').slice(1).join(' ') || '',
  };
};

/**
 * Transform UserMeResponse to Frontend Author model (unified)
 */
export const transformUserMe = (user: Models.UserMeResponse): Author => {
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
    bio: user.bio || '',
    // Default stats for me if missing
    followers: 0,
    following: 0,
    postsCount: 0,
  };
};
