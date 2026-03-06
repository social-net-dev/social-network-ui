import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePostsDeletePost, usePostsUpdatePost, useReactionsReactToPost, useReactionsUnreactPost, useSharesSharePost } from '@/lib/api/generated';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { PostSummary, ReactionType, UpdatePostRequest } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';

type QueryKey = readonly unknown[];
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function hasKey<K extends string>(obj: UnknownRecord, key: K): obj is UnknownRecord & Record<K, unknown> {
  return key in obj;
}

function updatePostsInUnknown(data: unknown, updater: (posts: PostSummary[]) => PostSummary[]): unknown {
  if (!data) return data;

  if (Array.isArray(data)) {
    return updater(data as PostSummary[]);
  }

  if (isRecord(data) && hasKey(data, 'items') && Array.isArray(data.items)) {
    return { ...data, items: updater(data.items as PostSummary[]) };
  }

  if (
    isRecord(data) &&
    hasKey(data, 'data') &&
    isRecord(data.data) &&
    hasKey(data.data, 'items') &&
    Array.isArray(data.data.items)
  ) {
    return { ...data, data: { ...data.data, items: updater(data.data.items as PostSummary[]) } };
  }

  if (isRecord(data) && hasKey(data, 'pages') && Array.isArray(data.pages)) {
    return {
      ...data,
      pages: (data.pages as unknown[]).map((page) => updatePostsInUnknown(page, updater)),
    };
  }

  return data;
}

function extractPostsFromUnknown(data: unknown): PostSummary[] {
  if (!data) return [];

  if (Array.isArray(data)) return data as PostSummary[];

  if (isRecord(data) && hasKey(data, 'items') && Array.isArray(data.items)) {
    return data.items as PostSummary[];
  }

  if (isRecord(data) && hasKey(data, 'data') && isRecord(data.data) && hasKey(data.data, 'items') && Array.isArray(data.data.items)) {
    return data.data.items as PostSummary[];
  }

  if (isRecord(data) && hasKey(data, 'pages') && Array.isArray(data.pages)) {
    for (const page of data.pages as unknown[]) {
      const posts = extractPostsFromUnknown(page);
      if (posts.length) return posts;
    }
  }

  return [];
}

export type UsePostActionsOptions = {
  affectedQueryKeys: QueryKey[];
};

type OptimisticPost = PostSummary & { sharedPost?: PostSummary | null };

export function usePostActions(options?: UsePostActionsOptions) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  // Use stable ref for affectedQueryKeys to avoid unnecessary re-renders
  const affectedQueryKeys = options?.affectedQueryKeys ?? [];

  const deletePostMutation = usePostsDeletePost({
    mutation: {
      onMutate: async ({ postId }) => {
        // Cancel outgoing refetches to avoid overwriting optimistic update
        await queryClient.cancelQueries({ queryKey: queryKeys.posts.all() });
        // Snapshot previous values
        const snapshots = affectedQueryKeys.map((key) => ({
          key,
          data: queryClient.getQueryData(key),
        }));
        // Optimistically remove the post
        for (const key of affectedQueryKeys) {
          queryClient.setQueryData<unknown>(key, (old: unknown) =>
            updatePostsInUnknown(old, (posts) => posts.filter((p) => p.id !== postId))
          );
        }
        return { snapshots };
      },
      onError: (_err: unknown, _vars: { postId: string }, context: unknown) => {
        // Rollback on error
        const ctx = context as { snapshots?: Array<{ key: QueryKey; data: unknown }> } | undefined;
        for (const { key, data } of ctx?.snapshots ?? []) {
          queryClient.setQueryData(key, data);
        }
        toast.error('Lỗi khi xóa bài viết');
      },
      onSuccess: () => {
        toast.success('Đã xóa bài viết');
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.all() });
      },
    },
  });

  const updatePostMutation = usePostsUpdatePost({
    mutation: {
      onMutate: async ({ postId, data }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.posts.all() });
        const snapshots = affectedQueryKeys.map((key) => ({
          key,
          data: queryClient.getQueryData(key),
        }));
        for (const key of affectedQueryKeys) {
          queryClient.setQueryData<unknown>(key, (old: unknown) =>
            updatePostsInUnknown(old, (posts) =>
              posts.map((p) => (p.id === postId ? { ...p, content: data.content_text ?? p.content } : p))
            )
          );
        }
        return { snapshots };
      },
      onError: (_err: unknown, _vars: { postId: string; data: UpdatePostRequest }, context: unknown) => {
        const ctx = context as { snapshots?: Array<{ key: QueryKey; data: unknown }> } | undefined;
        for (const { key, data } of ctx?.snapshots ?? []) {
          queryClient.setQueryData(key, data);
        }
        toast.error('Lỗi khi cập nhật bài viết');
      },
      onSuccess: () => {
        toast.success('Đã cập nhật bài viết');
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.all() });
      },
    },
  });

  const reactToPostMutation = useReactionsReactToPost();
  const unreactPostMutation = useReactionsUnreactPost();
  const sharePostMutation = useSharesSharePost();

  const deletePost = useCallback(
    (postId: string) => deletePostMutation.mutateAsync({ postId }),
    [deletePostMutation],
  );

  const updatePost = useCallback(
    (postId: string, content: string) =>
      updatePostMutation.mutateAsync({ postId, data: { content_text: content } }),
    [updatePostMutation],
  );

  const sharePost = useCallback(
    async (postId: string, message?: string) => {
      // Try to locate original post from affected caches only
      let originalPost: PostSummary | undefined;
      for (const key of affectedQueryKeys) {
        const data = queryClient.getQueryData(key) as unknown;
        const posts = extractPostsFromUnknown(data);
        originalPost = posts.find((p) => p.id === postId);
        if (originalPost) break;
      }

      if (originalPost && currentUser) {
        const optimisticSharedPost: OptimisticPost = {
          id: `temp-${Date.now()}`,
          author: {
            id: currentUser.id,
            display_name: currentUser.display_name || currentUser.username || 'Anonymous',
            avatar: currentUser.avatar || null,
            username: currentUser.username,
          },
          content: message || '',
          sharedPost: originalPost,
          visibility: 'PUBLIC',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          stats: { reactions: 0, comments: 0, shares: 0 },
          user_reaction: null as ReactionType | null,
          media_urls: [],
          post_type: 'SOCIAL',
        };

        for (const key of affectedQueryKeys) {
          queryClient.setQueryData<unknown>(key, (old: unknown) =>
            updatePostsInUnknown(old, (posts) => [optimisticSharedPost as PostSummary, ...posts])
          );
        }
      }

      try {
        await sharePostMutation.mutateAsync({ postId, data: { message: message || '' } });
        toast.success('Đã chia sẻ bài viết');
      } catch (err) {
        toast.error('Lỗi khi chia sẻ bài viết');
        throw err;
      } finally {
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.feed.all() });
      }
    },
    [affectedQueryKeys, sharePostMutation, queryClient, currentUser]
  );

  const likePost = useCallback(
    async (postId: string, liked: boolean) => {
      const reaction = liked ? 'LIKE' : null;

      // Optimistic update
      for (const key of affectedQueryKeys) {
        queryClient.setQueryData<unknown>(key, (old: unknown) =>
          updatePostsInUnknown(old, (posts) =>
            posts.map((post) => {
              if (post.id !== postId) return post;
              return {
                ...post,
                user_reaction: reaction,
                stats: {
                  ...post.stats,
                  reactions: Math.max(0, post.stats.reactions + (liked ? 1 : -1)),
                },
              };
            })
          )
        );
      }

      try {
        if (liked) {
          await reactToPostMutation.mutateAsync({ postId, data: { reaction: 'LIKE' } });
        } else {
          await unreactPostMutation.mutateAsync({ postId });
        }
      } catch (err) {
        // Rollback by invalidating
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.all() });
        toast.error('Lỗi khi tương tác bài viết');
        throw err;
      }
    },
    [affectedQueryKeys, queryClient, reactToPostMutation, unreactPostMutation]
  );

  return {
    deletePost,
    updatePost,
    sharePost,
    likePost,
    isDeleting: deletePostMutation.isPending,
    isUpdating: updatePostMutation.isPending,
    isSharing: sharePostMutation.isPending,
    isLiking: reactToPostMutation.isPending || unreactPostMutation.isPending,
  };
}
