import { useCallback } from 'react';
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { PostsV2API } from '@/lib/api/generated';
import { transformComment } from '@/lib/api/transforms';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { FeedComment, ReactionType } from '../types/feed.types';

export function useComments(postId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const queryKey = queryKeys.feed.comments(postId) as unknown as readonly unknown[];
  const pageSize = 10;

  const query = useInfiniteQuery<FeedComment[], Error, InfiniteData<FeedComment[]>, readonly unknown[], number>({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const response = await PostsV2API.getPostCommentsV2PostsPostIdCommentsGet(postId, {
        page: pageParam,
        page_size: pageSize,
      });
      return Array.isArray(response) ? response.map(transformComment) : [];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === pageSize ? allPages.length + 1 : undefined;
    },
    enabled: !!postId,
  });

  const addCommentMutation = PostsV2API.useCommentOnPostV2PostsPostIdCommentsPost();
  const deleteCommentMutation = PostsV2API.useDeleteCommentV2PostsPostIdCommentsCommentIdDelete();
  const reactCommentMutation = PostsV2API.useReactToCommentV2CommentsCommentIdReactionsPost();
  const removeReactionMutation = PostsV2API.useRemoveCommentReactionV2CommentsCommentIdReactionsDelete();
  const updateCommentMutation = PostsV2API.useUpdateCommentV2PostsPostIdCommentsCommentIdPut();
  const replyMutation = PostsV2API.useReplyToCommentV2CommentsCommentIdRepliesPost();

  const updateCache = useCallback(
    (updater: (comments: FeedComment[]) => FeedComment[]) => {
      queryClient.setQueryData<InfiniteData<FeedComment[]>>(queryKey, old => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => updater(page)),
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
          displayName: user.display_name || user.username || 'Me',
          avatar: user.avatar,
          username: user.username,
        },
        content,
        createdAt: new Date().toISOString(),
        mediaUrls: [],
        userReaction: null,
        stats: { reactions: 0, replies: 0 },
      };

      queryClient.setQueryData<InfiniteData<FeedComment[]>>(queryKey, old => {
        if (!old) return { pages: [[newComment]], pageParams: [1] };
        return {
          ...old,
          pages: old.pages.map((page, i) => (i === 0 ? [newComment, ...page] : page)),
        };
      });

      try {
        await addCommentMutation.mutateAsync({
          postId,
          data: {
            content_text: content,
            files: files as Blob[],
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
    [postId, addCommentMutation, queryClient, queryKey, user]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      updateCache(comments => comments.filter(c => c.id !== commentId));

      try {
        await deleteCommentMutation.mutateAsync({ postId, commentId });
        toast.success('Đã xóa bình luận');
      } catch (err) {
        queryClient.invalidateQueries({ queryKey });
        toast.error('Lỗi khi xóa bình luận');
        throw err;
      }
    },
    [postId, deleteCommentMutation, queryKey, updateCache, queryClient]
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
          await reactCommentMutation.mutateAsync({
            commentId,
            data: { reaction: reaction || 'LIKE' },
            params: { post_id: postId },
          });
        } else {
          await removeReactionMutation.mutateAsync({
            commentId,
          });
        }
      } catch (err) {
        queryClient.invalidateQueries({ queryKey });
        toast.error('Lỗi khi tương tác bình luận');
        throw err;
      }
    },
    [postId, reactCommentMutation, removeReactionMutation, queryKey, updateCache, queryClient]
  );

  const updateComment = useCallback(
    async (commentId: string, content: string) => {
      updateCache(comments => comments.map(c => (c.id === commentId ? { ...c, content } : c)));

      try {
        await updateCommentMutation.mutateAsync({
          postId,
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
    [postId, updateCommentMutation, queryKey, updateCache, queryClient]
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
          displayName: user.display_name || user.username || 'Me',
          avatar: user.avatar,
          username: user.username,
        },
        content,
        createdAt: new Date().toISOString(),
        mediaUrls: [],
        userReaction: null,
        stats: { reactions: 0, replies: 0 },
      };

      // Optimistic: append reply to the flat list
      queryClient.setQueryData<InfiniteData<FeedComment[]>>(queryKey, old => {
        if (!old) return { pages: [[newReply]], pageParams: [1] };
        return {
          ...old,
          pages: old.pages.map((page, i) => (i === 0 ? [...page, newReply] : page)),
        };
      });

      try {
        await replyMutation.mutateAsync({
          commentId,
          data: {
            content_text: content,
            files: files as Blob[],
          },
          params: { post_id: postId },
        });
        toast.success('Đã gửi phản hồi');
        queryClient.invalidateQueries({ queryKey });
      } catch (err) {
        queryClient.invalidateQueries({ queryKey });
        toast.error('Lỗi khi gửi phản hồi');
        throw err;
      }
    },
    [postId, replyMutation, queryClient, queryKey, user]
  );

  const comments = query.data?.pages.flat() || [];

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
    isAdding: addCommentMutation.isPending,
  };
}
