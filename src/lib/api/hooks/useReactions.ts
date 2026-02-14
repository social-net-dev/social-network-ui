/**
 * Reactions Smart Hook
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reactionsApi } from '../services';
import type { ReactionType } from '../types/common.types';

export function useReactions() {
  const queryClient = useQueryClient();

  const reactToPostMutation = useMutation({
    mutationFn: ({ postId: pid, reaction }: { postId: string; reaction: ReactionType }) =>
      reactionsApi.reactToPost(pid, { reaction }),
    onSuccess: (_data, { postId: _pid }) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['recommendation'] });
    },
  });

  const unreactPostMutation = useMutation({
    mutationFn: (pid: string) => reactionsApi.unreactPost(pid),
    onSuccess: (_data, _pid) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['recommendation'] });
    },
  });

  const reactToCommentMutation = useMutation({
    mutationFn: ({
      commentId,
      reaction,
    }: {
      commentId: string;
      reaction: ReactionType;
    }) => reactionsApi.reactToComment(commentId, { reaction }),
    onSuccess: (_, { commentId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', commentId] });
    },
  });

  const unreactCommentMutation = useMutation({
    mutationFn: (commentId: string) => reactionsApi.unreactComment(commentId),
    onSuccess: (_, commentId) => {
      queryClient.invalidateQueries({ queryKey: ['comments', commentId] });
    },
  });

  return {
    reactToPost: reactToPostMutation.mutateAsync,
    unreactPost: unreactPostMutation.mutateAsync,
    reactToComment: reactToCommentMutation.mutateAsync,
    unreactComment: unreactCommentMutation.mutateAsync,
    isLoading:
      reactToPostMutation.isPending ||
      unreactPostMutation.isPending ||
      reactToCommentMutation.isPending ||
      unreactCommentMutation.isPending,
  };
}
