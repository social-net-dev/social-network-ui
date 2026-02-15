/**
 * Shares Smart Hook
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sharesApi } from '../services';

export function useShares() {
  const queryClient = useQueryClient();

  const sharePostMutation = useMutation({
    mutationFn: ({ postId, message }: { postId: string; message?: string }) =>
      sharesApi.sharePost(postId, message ? { message } : undefined),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['posts', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const unsharePostMutation = useMutation({
    mutationFn: (postId: string) => sharesApi.unsharePost(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['posts', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return {
    share: sharePostMutation.mutateAsync,
    unshare: unsharePostMutation.mutateAsync,
    isSharing: sharePostMutation.isPending,
    isUnsharing: unsharePostMutation.isPending,
  };
}
