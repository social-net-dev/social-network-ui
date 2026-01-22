import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { feedApi } from '../services/feedApi'
import type { Post } from '../types/feed.types'
import { queryKeys } from '@/lib/query-keys'
import { useQueryClient } from '@tanstack/react-query'

export function useFeed() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const query = useQuery({
    queryKey: queryKeys.feed.posts(page),
    queryFn: async () => {
      const data = await feedApi.getPosts(page, 10)
      setHasMore(data.length > 0)
      return data
    },
  })

  const posts = useMemo(() => {
    const allPages: Post[] = []
    for (let i = 1; i <= page; i++) {
      const pageData = queryClient.getQueryData<Post[]>(queryKeys.feed.posts(i))
      if (pageData) {
        allPages.push(...pageData)
      }
    }
    return allPages
  }, [page, queryClient])

  const createMutation = useMutation({
    mutationFn: (data: { content: string; images: string[] }) =>
      feedApi.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.posts(1) })
    },
  })

  const likeMutation = useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      feedApi.likePost(postId, liked),
  })

  const createPost = useCallback((content: string, images: string[]) => {
    return createMutation.mutateAsync({ content, images: images || [] })
  }, [createMutation])

  const likePost = useCallback((postId: string, liked: boolean) => {
    for (let i = 1; i <= page; i++) {
      queryClient.setQueryData<Post[]>(
        queryKeys.feed.posts(i),
        (old) => {
          if (!old) return old
          return old.map((post) =>
            post.id === postId
              ? { ...post, likedByCurrentUser: liked, likes: post.likes + (liked ? 1 : -1) }
              : post
          )
        }
      )
    }
    return likeMutation.mutateAsync({ postId, liked })
  }, [page, queryClient, likeMutation])

  const loadMore = useCallback(() => {
    if (!query.isPending && hasMore) {
      setPage((prev) => prev + 1)
    }
  }, [query.isPending, hasMore])

  const refresh = useCallback(() => {
    setPage(1)
    setHasMore(true)
    queryClient.invalidateQueries({ queryKey: queryKeys.feed.posts(1) })
    for (let i = 2; i <= page; i++) {
      queryClient.removeQueries({ queryKey: queryKeys.feed.posts(i) })
    }
  }, [page, queryClient])

  return {
    posts,
    isLoading: query.isPending,
    error: query.error,
    hasMore,
    createPost,
    likePost,
    loadMore,
    refresh,
    isCreating: createMutation.isPending,
    isLiking: likeMutation.isPending,
  }
}
