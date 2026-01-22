import { useQuery, useMutation } from '@tanstack/react-query'
import { feedApi } from '../services/feedApi'
import { queryKeys } from '@/lib/query-keys'
import { useQueryClient } from '@tanstack/react-query'
import type { Comment } from '@/types'

export function useComments(postId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.feed.comments(postId),
    queryFn: () => feedApi.getComments(postId),
    enabled: !!postId,
  })

  const addMutation = useMutation({
    mutationFn: (content: string) => feedApi.addComment(postId, content),
    onSuccess: (newComment) => {
      queryClient.setQueryData(
        queryKeys.feed.comments(postId),
        (old: Comment[] = []) => [...old, newComment]
      )
    },
  })

  return {
    comments: query.data || [],
    isLoading: query.isPending,
    error: query.error,
    addComment: addMutation.mutate,
    isAdding: addMutation.isPending,
  }
}
