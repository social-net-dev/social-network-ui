/**
 * Centralized Query Key Factory
 *
 * Best practice: hierarchical keys cho phép invalidate theo domain.
 * Ví dụ: queryKeys.posts.all() → invalidates mọi posts query.
 *
 * Cấu trúc: [domain, scope?, id?, params?]
 */

// ── Shared param types (inline để tránh circular imports) ──────────────────

export interface CursorParams {
  cursor?: string;
  limit?: number;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface FeedParams extends CursorParams {
  field_id?: string;
  post_type?: string;
}

export interface SearchUsersParams {
  q: string;
  limit?: number;
  page?: number;
}

export interface GetPostReactionsParams extends CursorParams {
  reaction_type?: string;
}

// ── Query Key Factory ───────────────────────────────────────────────────────

export const queryKeys = {
  // ── Posts ────────────────────────────────────────────────────────────────
  posts: {
    /** Invalidates ALL post-related queries */
    all: () => ['posts'] as const,
    lists: () => ['posts', 'list'] as const,
    list: (params?: CursorParams) => ['posts', 'list', params ?? {}] as const,
    details: () => ['posts', 'detail'] as const,
    detail: (postId: string) => ['posts', 'detail', postId] as const,
    me: (params?: CursorParams) => ['posts', 'me', params ?? {}] as const,
    byUser: (userId: string, params?: CursorParams) =>
      ['posts', 'byUser', userId, params ?? {}] as const,
    comments: (postId: string, params?: CursorParams) =>
      ['posts', 'detail', postId, 'comments', params ?? {}] as const,
    reactions: (postId: string, params?: GetPostReactionsParams) =>
      ['posts', 'detail', postId, 'reactions', params ?? {}] as const,
  },

  // ── Feed ─────────────────────────────────────────────────────────────────
  feed: {
    /** Invalidates ALL feed queries */
    all: () => ['feed'] as const,
    infinite: (params?: FeedParams) => ['feed', 'infinite', params ?? {}] as const,
  },

  // ── Comments ─────────────────────────────────────────────────────────────
  comments: {
    all: () => ['comments'] as const,
    replies: (commentId: string, params?: CursorParams) =>
      ['comments', 'replies', commentId, params ?? {}] as const,
  },

  // ── Friends ──────────────────────────────────────────────────────────────
  friends: {
    all: () => ['friends'] as const,
    list: (params?: PaginationParams) => ['friends', 'list', params ?? {}] as const,
    incoming: (params?: PaginationParams) => ['friends', 'requests', 'incoming', params ?? {}] as const,
    outgoing: (params?: PaginationParams) => ['friends', 'requests', 'outgoing', params ?? {}] as const,
    status: (userId: string) => ['friends', 'status', userId] as const,
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    all: () => ['notifications'] as const,
    list: (params?: CursorParams) => ['notifications', 'list', params ?? {}] as const,
    unreadCount: () => ['notifications', 'unreadCount'] as const,
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  users: {
    all: () => ['users'] as const,
    me: () => ['users', 'me'] as const,
    privacy: () => ['users', 'me', 'privacy'] as const,
    detail: (userId: string) => ['users', 'detail', userId] as const,
    followers: (userId: string, params?: CursorParams) =>
      ['users', 'detail', userId, 'followers', params ?? {}] as const,
    following: (userId: string, params?: CursorParams) =>
      ['users', 'detail', userId, 'following', params ?? {}] as const,
  },

  // ── Profiles ──────────────────────────────────────────────────────────────
  profiles: {
    all: () => ['profiles'] as const,
    detail: (username: string) => ['profiles', 'detail', username] as const,
  },

  // ── Search ────────────────────────────────────────────────────────────────
  search: {
    all: () => ['search'] as const,
    users: (params: SearchUsersParams) => ['search', 'users', params] as const,
  },

  // ── Recommendations ───────────────────────────────────────────────────────
  recommendations: {
    all: () => ['recommendations'] as const,
    suggestions: (filter: string) => ['recommendations', 'suggestions', filter] as const,
  },
} as const;
