import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import type { FieldResponse, FieldPostsResponse } from '../types/field.types';
import { transformPost } from '@/lib/api/transforms';
import { Models } from '@/lib/api/generated';
import { toast } from 'sonner';

export function useField(fieldId: string) {
  const queryClient = useQueryClient();

  const fieldQuery = useQuery({
    queryKey: ['fields', fieldId],
    queryFn: async () => {
      const response = await apiClient.get<FieldResponse>(`/fields/${fieldId}`);
      return response.data.field;
    },
    enabled: !!fieldId,
  });

  const postsQuery = useInfiniteQuery({
    queryKey: ['fields', fieldId, 'posts'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<FieldPostsResponse>(`/fields/${fieldId}/posts`, {
        params: { page: pageParam, limit: 10 },
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: FieldPostsResponse, allPages: FieldPostsResponse[]) => {
      if (!lastPage.posts || lastPage.posts.length < 10) return undefined;
      return allPages.length + 1;
    },
    enabled: !!fieldId,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/fields/${fieldId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields', fieldId] });
      toast.success('Đã theo dõi lĩnh vực');
    },
    onError: () => {
      toast.error('Lỗi khi theo dõi lĩnh vực');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete(`/fields/${fieldId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields', fieldId] });
      toast.success('Đã bỏ theo dõi lĩnh vực');
    },
    onError: () => {
      toast.error('Lỗi khi bỏ theo dõi lĩnh vực');
    },
  });

  const posts = postsQuery.data?.pages.flatMap(page => (page.posts || []).map((post: Models.PostOut) => transformPost(post))) ?? [];

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
