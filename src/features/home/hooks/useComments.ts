import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
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
      queryClient.setQueryData<InfiniteData<any>>(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => {
            const comments = Array.isArray(page) ? page : page.comments || [];
            const updatedComments = updater(comments);
            return Array.isArray(page) ? updatedComments : { ...page, comments: updatedComments };
          }),
        };
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
        mediaUrls: [],
        userReaction: null,
        stats: { reactions: 0, replies: 0 },
      };

      queryClient.setQueryData<InfiniteData<any>>(queryKey, (old: any) => {
        if (!old) return { pages: [{ comments: [newComment], page: 1, total: 1, total_pages: 1 }], pageParams: [1] };
        return {
          ...old,
          pages: old.pages.map((page: any, i: number) => {
            if (i !== 0) return page;
            const comments = Array.isArray(page) ? page : page.comments || [];
            const updatedComments = [newComment, ...comments];
            return Array.isArray(page) ? updatedComments : { ...page, comments: updatedComments };
          }),
        };
      });

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

      // Optimistic: append reply to the flat list
      queryClient.setQueryData<InfiniteData<any>>(queryKey, (old: any) => {
        if (!old) return { pages: [{ comments: [newReply], page: 1 }], pageParams: [1] };
        return {
          ...old,
          pages: old.pages.map((page: any) => {
            const comments = Array.isArray(page) ? page : page.comments || [];
            const updatedComments = [...comments, newReply];
            return Array.isArray(page) ? updatedComments : { ...page, comments: updatedComments };
          }),
        };
      });

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

  const comments = query.data?.pages.flatMap(page => Array.isArray(page) ? page : page.comments || []) || [];

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
