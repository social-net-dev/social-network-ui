import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PostsAPI, PostsV2API } from "@/lib/api/generated";
import { transformComment } from "@/lib/api/transforms";

export function useComments(postId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["comments", postId];

  const query = PostsAPI.useListCommentsPostsPostIdCommentsGet(postId, {}, {
    query: {
      select: (data: any) => {
        const items = data.data || data || [];
        return Array.isArray(items) ? items.map(transformComment) : [];
      }
    }
  });

  const addCommentMutation = PostsV2API.useCommentOnPostV2PostsPostIdCommentsPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
      }
    }
  });

  const deleteCommentMutation = PostsV2API.useDeleteCommentV2PostsPostIdCommentsCommentIdDelete();

  const reactCommentMutation = PostsV2API.useReactToCommentV2CommentsCommentIdReactionsPost();

  const updateCommentMutation = PostsV2API.useUpdateCommentV2PostsPostIdCommentsCommentIdPut();

  const replyMutation = PostsV2API.useReplyToCommentV2CommentsCommentIdRepliesPost();

  const addComment = useCallback((content: string, files?: File[]) => {
    return addCommentMutation.mutateAsync({
      postId,
      data: {
        content_text: content,
        files: files as any
      }
    });
  }, [postId, addCommentMutation]);

  const deleteComment = useCallback((commentId: string) => {
    return deleteCommentMutation.mutateAsync({ postId, commentId });
  }, [postId, deleteCommentMutation]);

  const reactToComment = useCallback((commentId: string, reaction: string | null) => {
    return reactCommentMutation.mutateAsync({
      commentId,
      data: { reaction: reaction || "" }
    });
  }, [reactCommentMutation]);

  const updateComment = useCallback((commentId: string, content: string) => {
    return updateCommentMutation.mutateAsync({
      postId,
      commentId,
      data: { content_text: content }
    });
  }, [postId, updateCommentMutation]);

  const replyToComment = useCallback((commentId: string, content: string, files?: File[]) => {
    return replyMutation.mutateAsync({
      commentId,
      data: {
        content_text: content,
        files: files as any
      },
      params: {}
    });
  }, [replyMutation]);

  return {
    comments: query.data || [],
    isLoading: query.isPending,
    addComment,
    deleteComment,
    reactToComment,
    updateComment,
    replyToComment,
    isAdding: addCommentMutation.isPending,
  };
}
