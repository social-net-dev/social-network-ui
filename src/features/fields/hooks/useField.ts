import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldsApi } from '@/lib/api/services/fields';
import { toast } from 'sonner';

export function useField(fieldId: string) {
  const queryClient = useQueryClient();

  const fieldQuery = useQuery({
    queryKey: ['fields', fieldId],
    queryFn: () => fieldsApi.getField(fieldId),
    enabled: !!fieldId,
  });

  const postsQuery = useInfiniteQuery({
    queryKey: ['fields', fieldId, 'posts'],
    queryFn: ({ pageParam = 1 }) => fieldsApi.getFieldPosts(fieldId, { page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page >= lastPage.total_pages) return undefined;
      return lastPage.page + 1;
    },
    enabled: !!fieldId,
  });

  const followMutation = useMutation({
    mutationFn: () => fieldsApi.followField(fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields', fieldId] });
      toast.success('Đã theo dõi lĩnh vực');
    },
    onError: () => {
      toast.error('Lỗi khi theo dõi lĩnh vực');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => fieldsApi.unfollowField(fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields', fieldId] });
      toast.success('Đã bỏ theo dõi lĩnh vực');
    },
    onError: () => {
      toast.error('Lỗi khi bỏ theo dõi lĩnh vực');
    },
  });

  const posts = postsQuery.data?.pages.flatMap(page => page.posts) ?? [];

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
