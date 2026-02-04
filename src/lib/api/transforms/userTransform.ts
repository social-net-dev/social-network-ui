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
 * Transform UserMeResponse to Frontend User model
 */
export const transformUserMe = (user: Models.UserMeResponse) => {
  return {
    ...user,
    displayName: user.display_name,
    avatar: appendAuthToken(user.avatar_path),
    // Map camelCase for frontend consistency
    createdAt: user.created_at,
    accountStatus: user.account_status,
  };
};
