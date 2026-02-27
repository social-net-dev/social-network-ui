import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useInfiniteComments, useCommentActions } from '@/lib/api/hooks/useComments';
import { useReactions } from '@/lib/api/hooks/useReactions';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { FeedComment, ReactionType } from '../types/feed.types';

export function useComments(postId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const queryKey = ['comments', 'infinite', postId];

  const query = useInfiniteComments(postId);

  const { createComment: manualAddComment, updateComment: manualUpdateComment, deleteComment: manualDeleteComment, replyToComment: manualReplyToComment, isLoading: isActionLoading } = useCommentActions();
  const { reactToComment: manualReactToComment, unreactComment: manualUnreactComment } = useReactions();

  const updateCache = useCallback(
    (updater: (comments: FeedComment[]) => FeedComment[]) => {
      const all = (queryClient.getQueriesData && queryClient.getQueriesData({})) || [];
      all.forEach(([key]: any) => {
        try {
          if (!Array.isArray(key)) return;
          if (key[0] !== 'comments') return;

          queryClient.setQueryData(key as any, (old: any) => {
            if (!old) return old;

            // Infinite query shape: { pages: [...] }
            if (old.pages) {
              return {
                ...old,
                pages: old.pages.map((page: any) => {
                  const comments = Array.isArray(page) ? page : page.comments || [];
                  const updatedComments = updater(comments);
                  return Array.isArray(page) ? updatedComments : { ...page, comments: updatedComments };
                }),
              };
            }

            // Simple query that returns { comments: [...] }
            if (Array.isArray(old)) {
              return updater(old);
            }

            if (old.comments) {
              const comments = Array.isArray(old.comments) ? old.comments : [];
              return { ...old, comments: updater(comments) };
            }

            return old;
          });
        } catch (e) {
          // ignore errors per-query to avoid breaking others
        }
      });
    },
    [queryClient]
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
        mediaUrls: [],
        userReaction: null,
        stats: { reactions: 0, replies: 0 },
      };

      updateCache(comments => [newComment, ...comments]);

      try {
        await manualAddComment({
          post_id: postId,
          content_text: content,
          files,
        });
        toast.success('Đã gửi bình luận');
        queryClient.invalidateQueries({ queryKey });
      } catch (err) {
        queryClient.invalidateQueries({ queryKey });
        toast.error('Lỗi khi gửi bình luận');
        throw err;
      }
    },
    [postId, manualAddComment, queryClient, queryKey, user]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      updateCache(comments => comments.filter(c => c.id !== commentId));

      try {
        await manualDeleteComment(commentId);
        toast.success('Đã xóa bình luận');
      } catch (err) {
        queryClient.invalidateQueries({ queryKey });
        toast.error('Lỗi khi xóa bình luận');
        throw err;
      }
    },
    [manualDeleteComment, queryKey, updateCache, queryClient]
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
          await manualReactToComment({
            commentId,
            reaction: reaction || 'LIKE',
          });
        } else {
          await manualUnreactComment(commentId);
        }
      } catch (err) {
        queryClient.invalidateQueries({ queryKey });
        toast.error('Lỗi khi tương tác bình luận');
        throw err;
      }
    },
    [manualReactToComment, manualUnreactComment, queryKey, updateCache, queryClient]
  );

  const updateComment = useCallback(
    async (commentId: string, content: string) => {
      updateCache(comments => comments.map(c => (c.id === commentId ? { ...c, content } : c)));

      try {
        await manualUpdateComment({
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
    [manualUpdateComment, queryKey, updateCache, queryClient]
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
        mediaUrls: [],
        userReaction: null,
        stats: { reactions: 0, replies: 0 },
      };

      // Optimistic: append reply to all comment caches
      updateCache(comments => [...comments, newReply]);

      try {
        await manualReplyToComment({
          commentId,
          data: {
            post_id: postId,
            content_text: content,
            files,
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
    [postId, manualReplyToComment, queryClient, queryKey, user]
  );

  const comments = query.data?.pages.flatMap(page => (Array.isArray(page) ? page : page.comments || [])) || [];

  return {
    comments,
    isLoading: query.isPending,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    addComment,
    deleteComment,
    reactToComment,
    updateComment,
    replyToComment,
    isAdding: isActionLoading,
  };
}
