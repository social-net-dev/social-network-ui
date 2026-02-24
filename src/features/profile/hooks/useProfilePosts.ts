import { useMemo } from 'react'
import {
  getPostsGetMyPostsQueryKey,
  getPostsGetPostsByUserQueryKey,
  usePostsGetMyPosts,
  usePostsGetPostsByUser,
} from '@/lib/api/generated/posts/posts'
import type { PostSummary } from '@/lib/api/generated/model'

export type UseProfilePostsArgs = {
  mode: 'me' | 'other'
  subjectUserId: string | null
}

export function useProfilePosts({ mode, subjectUserId }: UseProfilePostsArgs) {
  const myPostsQuery = usePostsGetMyPosts(undefined, {
    query: {
      enabled: mode === 'me',
      select: (resp) => resp.data.items,
    },
  })

  const userPostsQuery = usePostsGetPostsByUser(String(subjectUserId ?? ''), undefined, {
    query: {
      enabled: mode === 'other' && !!subjectUserId,
      select: (resp) => resp.data.items,
    },
  })

  const query = mode === 'me' ? myPostsQuery : userPostsQuery

  const queryKey = useMemo(() => {
    if (mode === 'me') {
      return getPostsGetMyPostsQueryKey(undefined) as unknown as readonly unknown[]
    }

    if (subjectUserId) {
      return getPostsGetPostsByUserQueryKey(String(subjectUserId), undefined) as unknown as readonly unknown[]
    }

    return ['profile-posts'] as unknown as readonly unknown[]
  }, [mode, subjectUserId])

  const posts: PostSummary[] = useMemo(() => query.data ?? [], [query.data])

  return {
    posts,
    query,
    queryKey,
  }
}
