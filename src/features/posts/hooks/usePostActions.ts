import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePostsDeletePost, usePostsUpdatePost } from '@/lib/api/hooks/posts.hooks';
import { useReactionsReactToPost, useReactionsUnreactPost } from '@/lib/api/hooks/reactions.hooks';
import { useSharesSharePost } from '@/lib/api/hooks/shares.hooks';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { PostSummary, ReactionType } from '@/lib/api/types';

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

  const affectedQueryKeys = useMemo<QueryKey[]>(
    () => options?.affectedQueryKeys ?? [],
    [options?.affectedQueryKeys],
  );

  const deletePostMutation = usePostsDeletePost();
  const updatePostMutation = usePostsUpdatePost();
  const reactToPostMutation = useReactionsReactToPost();
  const unreactPostMutation = useReactionsUnreactPost();
  const sharePostMutation = useSharesSharePost();

  const updateCache = useCallback(
    (updater: (posts: PostSummary[]) => PostSummary[]) => {
      for (const key of affectedQueryKeys) {
        queryClient.setQueryData<unknown>(key, (old: unknown) => updatePostsInUnknown(old, updater));
      }
    },
    [affectedQueryKeys, queryClient]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      updateCache(posts => posts.filter(p => p.id !== postId));

      try {
        await deletePostMutation.mutateAsync({ postId });
        toast.success('Đã xóa bài viết');
      } catch (err) {
        for (const key of affectedQueryKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
        toast.error('Lỗi khi xóa bài viết');
        throw err;
      }
    },
    [affectedQueryKeys, deletePostMutation, queryClient, updateCache]
  );

  const updatePost = useCallback(
    async (postId: string, content: string) => {
      updateCache(posts => posts.map(p => (p.id === postId ? { ...p, content } : p)));

      try {
        await updatePostMutation.mutateAsync({
          postId,
          data: { content_text: content },
        });
        toast.success('Đã cập nhật bài viết');
      } catch (err) {
        for (const key of affectedQueryKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
        toast.error('Lỗi khi cập nhật bài viết');
        throw err;
      }
    },
    [affectedQueryKeys, queryClient, updateCache, updatePostMutation]
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
          stats: {
            reactions: 0,
            comments: 0,
            shares: 0,
          },
          user_reaction: null as ReactionType | null,
          media_urls: [],
          post_type: 'SOCIAL',
        };

        updateCache(posts => [optimisticSharedPost as PostSummary, ...posts]);
      }

      try {
        await sharePostMutation.mutateAsync({
          postId,
          data: { message: message || '' },
        });
        toast.success('Đã chia sẻ bài viết');
        for (const key of affectedQueryKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      } catch (err) {
        for (const key of affectedQueryKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
        toast.error('Lỗi khi chia sẻ bài viết');
        throw err;
      }
    },
    [affectedQueryKeys, sharePostMutation, queryClient, currentUser, updateCache]
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
            user_reaction: reaction,
            stats: {
              ...post.stats,
              reactions: Math.max(0, currentLikes + delta),
            },
          };
        })
      );

      try {
        if (liked) {
          await reactToPostMutation.mutateAsync({
            postId,
            data: { reaction: 'LIKE' },
          });
        } else {
          await unreactPostMutation.mutateAsync({ postId });
        }
      } catch (err) {
        for (const key of affectedQueryKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
        toast.error('Lỗi khi tương tác bài viết');
        throw err;
      }
    },
    [affectedQueryKeys, queryClient, reactToPostMutation, unreactPostMutation, updateCache]
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
