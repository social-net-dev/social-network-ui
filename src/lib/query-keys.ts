export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
  },

  profile: {
    all: ['profile'] as const,
    detail: (userId: string) => [...queryKeys.profile.all, userId] as const,
  },

  feed: {
    all: ['feed'] as const,
    posts: (page: number = 1) => [...queryKeys.feed.all, 'posts', page] as const,
    post: (postId: string) => [...queryKeys.feed.all, 'post', postId] as const,
    comments: (postId: string) => [...queryKeys.feed.all, 'comments', postId] as const,
    userPosts: (userId: string) => [...queryKeys.feed.all, 'userPosts', userId] as const,
  },
} as const
