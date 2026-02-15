/**
 * TanStack React Query Key Factory
 * Centralized query key management for all features
 * Reference: https://tkdodo.eu/blog/effective-react-query-keys
 */

export const queryKeys = {
  // ============================================
  // AUTH
  // ============================================
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
    login: () => [...queryKeys.auth.all, 'login'] as const,
    register: () => [...queryKeys.auth.all, 'register'] as const,
  },

  // ============================================
  // PROFILE / USER
  // ============================================
  profile: {
    all: ['profile'] as const,
    detail: (userId: string) => [...queryKeys.profile.all, userId] as const,
    settings: () => [...queryKeys.profile.all, 'settings'] as const,
  },

  user: {
    all: ['user'] as const,
    detail: (userId: string) => [...queryKeys.user.all, userId] as const,
    search: (query: string) => [...queryKeys.user.all, 'search', query] as const,
  },

  // ============================================
  // FEED / POSTS
  // ============================================
  feed: {
    all: ['feed'] as const,
    posts: (page: number = 1, limit: number = 10) =>
      [...queryKeys.feed.all, 'posts', page, limit] as const,
    post: (postId: string) => [...queryKeys.feed.all, 'post', postId] as const,
    comments: (postId: string, page: number = 1) =>
      [...queryKeys.feed.all, 'comments', postId, page] as const,
    userPosts: (userId: string, page: number = 1) =>
      [...queryKeys.feed.all, 'userPosts', userId, page] as const,
  },

  // ============================================
  // EXPLORE
  // ============================================
  explore: {
    all: ['explore'] as const,
    posts: (page: number = 1, filter?: string) =>
      [...queryKeys.explore.all, 'posts', page, filter] as const,
  },

  // ============================================
  // SEARCH
  // ============================================
  search: {
    all: ['search'] as const,
    users: (query: string, page: number = 1) =>
      [...queryKeys.search.all, 'users', query, page] as const,
    posts: (query: string, page: number = 1) =>
      [...queryKeys.search.all, 'posts', query, page] as const,
    groups: (query: string, page: number = 1) =>
      [...queryKeys.search.all, 'groups', query, page] as const,
  },

  // ============================================
  // FRIENDS
  // ============================================
  friends: {
    all: ['friends'] as const,
    list: (userId?: string) =>
      userId
        ? [...queryKeys.friends.all, 'list', userId]
        : [...queryKeys.friends.all, 'list'] as const,
    requests: (page: number = 1) =>
      [...queryKeys.friends.all, 'requests', page] as const,
    suggestions: (page: number = 1) =>
      [...queryKeys.friends.all, 'suggestions', page] as const,
  },

  // ============================================
  // MESSAGES / CONVERSATIONS
  // ============================================
  messages: {
    all: ['messages'] as const,
    conversations: (page: number = 1, limit: number = 20) =>
      [...queryKeys.messages.all, 'conversations', page, limit] as const,
    conversation: (conversationId: string) =>
      [...queryKeys.messages.all, 'conversation', conversationId] as const,
    threadMessages: (conversationId: string, page: number = 1) =>
      [...queryKeys.messages.all, 'threadMessages', conversationId, page] as const,
  },

  // ============================================
  // NOTIFICATIONS
  // ============================================
  notifications: {
    all: ['notifications'] as const,
    list: (page: number = 1, limit: number = 20) =>
      [...queryKeys.notifications.all, 'list', page, limit] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
  },

  // ============================================
  // GROUPS
  // ============================================
  groups: {
    all: ['groups'] as const,
    list: (page: number = 1, limit: number = 10) =>
      [...queryKeys.groups.all, 'list', page, limit] as const,
    detail: (groupId: string) =>
      [...queryKeys.groups.all, 'detail', groupId] as const,
    members: (groupId: string, page: number = 1) =>
      [...queryKeys.groups.all, 'members', groupId, page] as const,
    posts: (groupId: string, page: number = 1) =>
      [...queryKeys.groups.all, 'posts', groupId, page] as const,
  },

  // ============================================
  // FIELDS (Interest Categories)
  // ============================================
  fields: {
    all: ['fields'] as const,
    list: () => [...queryKeys.fields.all, 'list'] as const,
    detail: (fieldId: string) =>
      [...queryKeys.fields.all, 'detail', fieldId] as const,
    posts: (fieldId: string, page: number = 1) =>
      [...queryKeys.fields.all, 'posts', fieldId, page] as const,
  },

  // ============================================
  // MARKETPLACE
  // ============================================
  marketplace: {
    all: ['marketplace'] as const,
    products: (page: number = 1, filter?: string) =>
      [...queryKeys.marketplace.all, 'products', page, filter] as const,
    product: (productId: string) =>
      [...queryKeys.marketplace.all, 'product', productId] as const,
  },

  // ============================================
  // RECOMMENDATIONS
  // ============================================
  recommendations: {
    all: ['recommendations'] as const,
    people: (page: number = 1, limit: number = 10) =>
      [...queryKeys.recommendations.all, 'people', page, limit] as const,
    groups: (page: number = 1, limit: number = 10) =>
      [...queryKeys.recommendations.all, 'groups', page, limit] as const,
  },

  // ============================================
  // ADMIN
  // ============================================
  admin: {
    all: ['admin'] as const,
    accounts: (page: number = 1, filters?: Record<string, unknown>) =>
      [...queryKeys.admin.all, 'accounts', page, filters] as const,
    verification: (status?: string) =>
      [...queryKeys.admin.all, 'verification', status] as const,
  },

  // ============================================
  // MEDIA / FILES
  // ============================================
  media: {
    all: ['media'] as const,
    blob: (url: string) => [...queryKeys.media.all, 'blob', url] as const,
  },
} as const;
