import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PostsV2API } from "@/lib/api/generated";
import { queryKeys } from "@/lib/query-keys";

export function usePostActions() {
  const queryClient = useQueryClient();

  const deleteMutation = PostsV2API.useDeletePostV2PostsPostIdDelete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      }
    }
  });

  const updateMutation = PostsV2API.useUpdatePostV2PostsPostIdPut({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      }
    }
  });

  const shareMutation = PostsV2API.useSharePostV2PostsPostIdSharePost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      }
    }
  });

  const deletePost = useCallback((postId: string) => {
    return deleteMutation.mutateAsync({ postId });
  }, [deleteMutation]);

  const updatePost = useCallback((postId: string, content: string) => {
    return updateMutation.mutateAsync({ 
      postId, 
      data: { content_text: content } 
    });
  }, [updateMutation]);

  const sharePost = useCallback((postId: string, content?: string) => {
    return shareMutation.mutateAsync({ 
      postId, 
      data: { message: content || "" } 
    });
  }, [shareMutation]);

  return {
    deletePost,
    updatePost,
    sharePost,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSharing: shareMutation.isPending,
  };
}
