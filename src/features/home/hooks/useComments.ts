import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePostsGetPostComments,
  getPostsGetPostCommentsQueryKey,
} from '@/lib/api/generated/posts/posts';
import {
  useCommentsCreateComment,
  useCommentsDeleteComment,
  useCommentsReplyToComment,
  useCommentsUpdateComment,
} from '@/lib/api/generated/comments/comments';
import {
  useReactionsReactToComment,
  useReactionsUnreactComment,
} from '@/lib/api/generated/reactions/reactions';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { FeedComment, ReactionType } from '../types/feed.types';
import { uploadMediaAsset } from '@/features/posts/lib/uploadMediaAsset';

export function useComments(postId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const queryKey = useMemo(
    () => getPostsGetPostCommentsQueryKey(postId, undefined) as unknown as readonly unknown[],
    [postId],
  );

  const query = usePostsGetPostComments(postId, undefined, {
    query: {
      enabled: !!postId,
      select: (resp) => resp.data.items,
    },
  });

  const createCommentMutation = useCommentsCreateComment();
  const updateCommentMutation = useCommentsUpdateComment();
  const deleteCommentMutation = useCommentsDeleteComment();
  const replyToCommentMutation = useCommentsReplyToComment();
  const reactToCommentMutation = useReactionsReactToComment();
  const unreactCommentMutation = useReactionsUnreactComment();

  const updateCache = useCallback(
    (updater: (comments: FeedComment[]) => FeedComment[]) => {
      queryClient.setQueryData<unknown>(queryKey, (old: unknown) => {
        if (!old) return old;
        const rec = old as Record<string, unknown>;
        if (typeof old === 'object' && old !== null) {
          if ('items' in rec && Array.isArray(rec.items)) {
            return { ...rec, items: updater(rec.items as FeedComment[]) };
          }
          if ('data' in rec && typeof rec.data === 'object' && rec.data !== null) {
            const data = rec.data as Record<string, unknown>;
            if ('items' in data && Array.isArray(data.items)) {
              return { ...rec, data: { ...data, items: updater(data.items as FeedComment[]) } };
            }
          }
        }
        return old;
      });
    },
    [queryClient, queryKey]
  );

  const addComment = useCallback(
    async (content: string, files?: File[]) => {
      if (!user) return;

      const tempId = `temp-${Date.now()}`;
      const newComment: FeedComment = {
        id: tempId,
        postId: postId,
        parentCommentId: null,
        author: {
          id: user.id,
          displayName: user.displayName || user.username || 'Anonymous',
          avatar: user.avatar || null,
          username: user.username,
        },
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mediaUrls: [],
        userReaction: null,
        stats: { reactions: 0, replies: 0 },
      };

      updateCache((comments) => [newComment, ...comments]);

      try {
        const media_asset_ids = files?.length
          ? await Promise.all(files.map((f) => uploadMediaAsset(f, 'comment')))
          : undefined;

        await createCommentMutation.mutateAsync({
          data: {
            post_id: postId,
            content_text: content,
            media_asset_ids: media_asset_ids?.length ? media_asset_ids : undefined,
          },
        });
        toast.success('Đã gửi bình luận');
        queryClient.invalidateQueries({ queryKey });
      } catch (err) {
        queryClient.invalidateQueries({ queryKey });
        toast.error('Lỗi khi gửi bình luận');
        throw err;
      }
    },
    [createCommentMutation, postId, queryClient, queryKey, updateCache, user]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      updateCache(comments => comments.filter(c => c.id !== commentId));

      try {
        await deleteCommentMutation.mutateAsync({ commentId });
        toast.success('Đã xóa bình luận');
      } catch (err) {
        queryClient.invalidateQueries({ queryKey });
        toast.error('Lỗi khi xóa bình luận');
        throw err;
      }
    },
    [deleteCommentMutation, queryClient, queryKey, updateCache]
  );

  const reactToComment = useCallback(
    async (commentId: string, reaction: ReactionType | null) => {
      const isLiked = !!reaction;

      updateCache(comments =>
        comments.map(comment => {
          if (comment.id !== commentId) return comment;

          const currentLikes = comment.stats.reactions;
          const delta = isLiked ? 1 : -1;

          return {
            ...comment,
            userReaction: reaction,
            stats: {
              ...comment.stats,
              reactions: Math.max(0, currentLikes + delta),
            },
          };
        })
      );

      try {
        if (isLiked) {
          await reactToCommentMutation.mutateAsync({
            commentId,
            data: { reaction: reaction || 'LIKE' },
          });
        } else {
          await unreactCommentMutation.mutateAsync({ commentId });
        }
      } catch (err) {
        queryClient.invalidateQueries({ queryKey });
        toast.error('Lỗi khi tương tác bình luận');
        throw err;
      }
    },
    [queryClient, queryKey, reactToCommentMutation, unreactCommentMutation, updateCache]
  );

  const updateComment = useCallback(
    async (commentId: string, content: string) => {
      updateCache(comments => comments.map(c => (c.id === commentId ? { ...c, content } : c)));

      try {
        await updateCommentMutation.mutateAsync({
          commentId,
          data: { content_text: content },
        });
        toast.success('Đã cập nhật bình luận');
      } catch (err) {
        queryClient.invalidateQueries({ queryKey });
        toast.error('Lỗi khi cập nhật bình luận');
        throw err;
      }
    },
    [queryClient, queryKey, updateCache, updateCommentMutation]
  );

  const replyToComment = useCallback(
    async (commentId: string, content: string, files?: File[]) => {
      if (!user) return;

      const tempId = `temp-${Date.now()}`;
      const newReply: FeedComment = {
        id: tempId,
        postId: postId,
        parentCommentId: commentId,
        author: {
          id: user.id,
          displayName: user.displayName || user.username || 'Anonymous',
          avatar: user.avatar || null,
          username: user.username,
        },
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mediaUrls: [],
        userReaction: null,
        stats: { reactions: 0, replies: 0 },
      };

      updateCache((comments) => [...comments, newReply]);

      try {
        const media_asset_ids = files?.length
          ? await Promise.all(files.map((f) => uploadMediaAsset(f, 'comment')))
          : undefined;

        await replyToCommentMutation.mutateAsync({
          commentId,
          data: {
            post_id: postId,
            content_text: content,
            media_asset_ids: media_asset_ids?.length ? media_asset_ids : undefined,
          },
        });
        toast.success('Đã gửi phản hồi');
        queryClient.invalidateQueries({ queryKey });
      } catch (err) {
        queryClient.invalidateQueries({ queryKey });
        toast.error('Lỗi khi gửi phản hồi');
        throw err;
      }
    },
    [postId, queryClient, queryKey, replyToCommentMutation, updateCache, user]
  );

  const comments: FeedComment[] = (query.data as FeedComment[]) || [];

  return {
    comments,
    isLoading: query.isPending,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: async () => {},
    addComment,
    deleteComment,
    reactToComment,
    updateComment,
    replyToComment,
    isAdding:
      createCommentMutation.isPending ||
      updateCommentMutation.isPending ||
      deleteCommentMutation.isPending ||
      replyToCommentMutation.isPending,
  };
}
