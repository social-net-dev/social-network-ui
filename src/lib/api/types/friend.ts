import type { Author } from './user';

// ─── Friend Models ─────────────────────────────────────────────────────────────

export interface Friend {
  id: string;
  user: Author;
  created_at: string;
}

export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface FriendRequest {
  id: string;
  requester: Author;
  addressee: Author;
  status: FriendRequestStatus;
  created_at: string;
}

export interface FriendshipStatus {
  is_friend: boolean;
  is_requested?: boolean;
  is_received?: boolean;
}

// ─── Request Payloads ──────────────────────────────────────────────────────────

export interface CreateFriendRequestRequest {
  addressee_id?: string;
  addressee_username?: string;
}
