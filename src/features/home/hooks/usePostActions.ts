import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { PostsV2API } from '@/lib/api/generated';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { FeedPost } from '../types/feed.types';

type PostContainer = FeedPost[] | { posts: FeedPost[] } | { items: FeedPost[] } | { data: { posts: FeedPost[] } };

export function usePostActions(customQueryKey?: readonly unknown[]) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const defaultQueryKey = queryKeys.feed.posts(1) as unknown as readonly unknown[];
  const targetKey = customQueryKey || defaultQueryKey;

  const deleteMutation = PostsV2API.useDeletePostV2PostsPostIdDelete();
  const updateMutation = PostsV2API.useUpdatePostV2PostsPostIdPut();
  const shareMutation = PostsV2API.useSharePostV2PostsPostIdSharePost();
  const reactMutation = PostsV2API.useReactToPostV2PostsPostIdReactionsPost();
  const removeReactionMutation = PostsV2API.useRemoveReactionV2PostsPostIdReactionsDelete();

  const updateCache = useCallback(
    (updater: (posts: FeedPost[]) => FeedPost[]) => {
      queryClient.setQueryData<PostContainer | InfiniteData<PostContainer>>(targetKey, old => {
        if (!old) return old;

        const updateData = (data: PostContainer): PostContainer => {
          if (Array.isArray(data)) return updater(data);
          if ('posts' in data) return { ...data, posts: updater(data.posts) };
          if ('items' in data) return { ...data, items: updater(data.items) };
          if ('data' in data && 'posts' in data.data) return { ...data, data: { ...data.data, posts: updater(data.data.posts) } };
          return data;
        };

        if ('pages' in old) {
          return {
            ...old,
            pages: old.pages.map(page => updateData(page)),
          };
        }

        return updateData(old);
      });
    },
    [queryClient, targetKey]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      updateCache(posts => posts.filter(p => p.id !== postId));

      try {
        await deleteMutation.mutateAsync({ postId });
        toast.success('Đã xóa bài viết');
      } catch (err) {
        queryClient.invalidateQueries({ queryKey: targetKey });
        toast.error('Lỗi khi xóa bài viết');
        throw err;
      }
    },
    [deleteMutation, queryClient, targetKey, updateCache]
  );

  const updatePost = useCallback(
    async (postId: string, content: string) => {
      updateCache(posts => posts.map(p => (p.id === postId ? { ...p, content } : p)));

      try {
        await updateMutation.mutateAsync({
          postId,
          data: { content_text: content },
        });
        toast.success('Đã cập nhật bài viết');
      } catch (err) {
        queryClient.invalidateQueries({ queryKey: targetKey });
        toast.error('Lỗi khi cập nhật bài viết');
        throw err;
      }
    },
    [updateMutation, queryClient, targetKey, updateCache]
  );

  const sharePost = useCallback(
    async (postId: string, message?: string) => {
      const allData = queryClient.getQueryData<PostContainer | InfiniteData<PostContainer>>(targetKey);
      let postsArray: FeedPost[] = [];

      if (allData) {
        if ('pages' in allData) {
          postsArray = allData.pages.flatMap(page => (Array.isArray(page) ? page : 'posts' in page ? page.posts : 'items' in page ? page.items : 'data' in page ? page.data.posts : []));
        } else {
          postsArray = Array.isArray(allData) ? allData : 'posts' in allData ? allData.posts : 'items' in allData ? allData.items : 'data' in allData ? allData.data.posts : [];
        }
      }

      const originalPost = postsArray.find(p => p.id === postId);

      if (originalPost && currentUser) {
        const optimisticSharedPost: FeedPost = {
          id: `temp-${Date.now()}`,
          author: {
            id: currentUser.id,
            displayName: currentUser.display_name || currentUser.username || 'Me',
            avatar: currentUser.avatar,
            username: currentUser.username,
          },
          content: message || '',
          sharedPost: originalPost,
          visibility: 'PUBLIC',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stats: {
            reactions: 0,
            comments: 0,
            shares: 0,
          },
          userReaction: null,
          mediaUrls: [],
        };

        updateCache(posts => [optimisticSharedPost, ...posts]);
      }

      try {
        await shareMutation.mutateAsync({
          postId,
          data: { message: message || '' },
        });
        toast.success('Đã chia sẻ bài viết');
        queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
        if (customQueryKey) {
          queryClient.invalidateQueries({ queryKey: customQueryKey });
        }
      } catch (err) {
        queryClient.invalidateQueries({ queryKey: targetKey });
        toast.error('Lỗi khi chia sẻ bài viết');
        throw err;
      }
    },
    [shareMutation, queryClient, targetKey, currentUser, customQueryKey, updateCache]
  );

  const likePost = useCallback(
    async (postId: string, liked: boolean) => {
      const reaction = liked ? 'LIKE' : null;

      updateCache(posts =>
        posts.map(post => {
          if (post.id !== postId) return post;
          const currentLikes = post.stats.reactions;
          const delta = liked ? 1 : -1;
          return {
            ...post,
            userReaction: reaction,
            stats: {
              ...post.stats,
              reactions: Math.max(0, currentLikes + delta),
            },
          };
        })
      );

      try {
        if (liked) {
          await reactMutation.mutateAsync({
            postId,
            data: { reaction: 'LIKE' },
          });
        } else {
          await removeReactionMutation.mutateAsync({
            postId,
          });
        }
      } catch (err) {
        queryClient.invalidateQueries({ queryKey: targetKey });
        toast.error('Lỗi khi tương tác bài viết');
        throw err;
      }
    },
    [queryClient, targetKey, reactMutation, removeReactionMutation, updateCache]
  );

  return {
    deletePost,
    updatePost,
    sharePost,
    likePost,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSharing: shareMutation.isPending,
    isLiking: reactMutation.isPending || removeReactionMutation.isPending,
  };
}
