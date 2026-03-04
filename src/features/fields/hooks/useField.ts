import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customInstance } from '@/lib/api';
import { toast } from 'sonner';
import type { Field } from '../types/field.types';
import type { Post } from '@/lib/api/types';

export function useField(fieldId: string) {
  const queryClient = useQueryClient();

  const fieldQuery = useQuery({
    queryKey: ['fields', fieldId],
    queryFn: () => customInstance<Field>({ url: `/fields/${fieldId}/`, method: 'GET' }),
    enabled: !!fieldId,
  });

  const postsQuery = useInfiniteQuery({
    queryKey: ['fields', fieldId, 'posts'],
    queryFn: ({ pageParam = 1 }) => customInstance<{ posts: Post[]; page: number; total_pages: number }>({ url: `/fields/${fieldId}/posts/`, method: 'GET', params: { page: pageParam, limit: 10 } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page >= lastPage.total_pages) return undefined;
      return lastPage.page + 1;
    },
    enabled: !!fieldId,
  });

  const followMutation = useMutation({
    mutationFn: () => customInstance({ url: `/fields/${fieldId}/follow/`, method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields', fieldId] });
      toast.success('Đã theo dõi lĩnh vực');
    },
    onError: () => {
      toast.error('Lỗi khi theo dõi lĩnh vực');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => customInstance({ url: `/fields/${fieldId}/follow/`, method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields', fieldId] });
      toast.success('Đã bỏ theo dõi lĩnh vực');
    },
    onError: () => {
      toast.error('Lỗi khi bỏ theo dõi lĩnh vực');
    },
  });

  const posts = postsQuery.data?.pages.flatMap(page => page.posts?.filter(post => post != null) ?? []) ?? [];

  return {
    field: fieldQuery.data,
    isLoadingField: fieldQuery.isLoading,
    posts,
    isLoadingPosts: postsQuery.isPending,
    isFetchingNextPage: postsQuery.isFetchingNextPage,
    hasNextPage: postsQuery.hasNextPage,
    fetchNextPage: postsQuery.fetchNextPage,
    followField: followMutation.mutate,
    unfollowField: unfollowMutation.mutate,
    isFollowingLoading: followMutation.isPending || unfollowMutation.isPending,
    error: fieldQuery.error || postsQuery.error,
  };
}
