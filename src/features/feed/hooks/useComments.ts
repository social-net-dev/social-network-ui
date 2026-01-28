import { useQuery, useMutation } from "@tanstack/react-query";
import { feedApi } from "../services/feedApi";
import { queryKeys } from "@/lib/query-keys";
import { useQueryClient } from "@tanstack/react-query";

export function useComments(postId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.feed.comments(postId),
    queryFn: () => feedApi.getComments(postId),
    enabled: !!postId,
  });

  const addMutation = useMutation<
    any,
    any,
    { content: string; files?: File[] }
  >({
    mutationFn: (payload) =>
      feedApi.addComment(postId, payload.content, payload.files),
    onSuccess: (newComment: any) => {
      queryClient.setQueryData(
        queryKeys.feed.comments(postId),
        (old: any[] = []) => [...old, newComment],
      );
    },
  });

  return {
    comments: query.data || [],
    isLoading: query.isPending,
    error: query.error,
    addComment: (content: string, files?: File[]) =>
      addMutation.mutate({ content, files }),
    isAdding: addMutation.isPending,
  };
}
