/**
 * Friend related types
 */

import type { Author } from './user.types';

export interface Friend {
  id: string;
  user: Author;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  requester: Author;
  addressee: Author;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  created_at: string;
}

export interface CreateFriendRequestRequest {
  addressee_id?: string;
  addressee_username?: string;
}

export interface FriendshipStatus {
  is_friend: boolean;
  is_requested?: boolean;
  is_received?: boolean;
}
