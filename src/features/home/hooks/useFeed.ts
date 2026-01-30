import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { feedApi } from "../services/feedApi";
import type { Post } from "../types/feed.types";
import { queryKeys } from "@/lib/query-keys";
import { useQueryClient } from "@tanstack/react-query";

export function useFeed() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 10;
  const query = useQuery({
    queryKey: queryKeys.feed.posts(page),
    queryFn: async () => {
      const result = await feedApi.getPosts(page, pageSize, {
        all_tenants: true,
      });
      setHasMore(page < result.total_pages);
      return result;
    },
    refetchOnMount: "always",
    staleTime: 0,
  });

  const posts = useMemo(() => {
    const allPages: Post[] = [];
    for (let i = 1; i <= page; i++) {
      const pageData = queryClient.getQueryData<{
        posts: Post[];
        total_pages: number;
        total: number;
      }>(queryKeys.feed.posts(i));
      if (pageData?.posts) {
        allPages.push(...pageData.posts);
      }
    }
    return allPages;
  }, [page, queryClient, query.data]);

  useEffect(() => {
    try {
      console.debug("[useFeed] posts count=", posts.length, "page=", page);
    } catch (e) {}
  }, [posts, page]);

  const createMutation = useMutation({
    // mutation expects FormData
    mutationFn: (form: FormData) => feedApi.createPost(form as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.posts(1) });
    },
  });

  const reactMutation = useMutation({
    mutationFn: ({
      postId,
      reaction,
    }: {
      postId: string;
      reaction: string | null;
    }) => feedApi.reactToPost(postId, reaction),
  });

  const createPost = useCallback(
    (content: string, files: File[]) => {
      const form = new FormData();
      form.append("content_text", content);
      form.append("visibility", "PUBLIC");
      files?.forEach((f) => form.append("files", f));
      return createMutation.mutateAsync(form);
    },
    [createMutation],
  );

  const likePost = useCallback(
    (postId: string, liked: boolean) => {
      const reaction = liked ? "LIKE" : null;
      for (let i = 1; i <= page; i++) {
        queryClient.setQueryData<{
          posts: Post[];
          total_pages: number;
          total: number;
        }>(queryKeys.feed.posts(i), (old) => {
          if (!old?.posts) return old;
          return {
            ...old,
            posts: old.posts.map((post) => {
              if (post.id !== postId) return post;
              const currentLikes =
                (post as any).likes ?? (post as any).reaction_count ?? 0;
              const delta = liked ? 1 : -1;
              const newLikes = Math.max(0, currentLikes + delta);
              return {
                ...post,
                likedByCurrentUser: liked,
                user_reaction: reaction,
                likes: newLikes,
                reaction_count: newLikes,
              } as Post;
            }),
          };
        });
      }
      return reactMutation.mutateAsync({ postId, reaction });
    },
    [page, queryClient, reactMutation],
  );

  const loadMore = useCallback(() => {
    if (!query.isPending && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [query.isPending, hasMore]);

  const refresh = useCallback(() => {
    // Reset to first page and invalidate all feed queries so data is refetched.
    setPage(1);
    setHasMore(true);
    queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
  }, [page, queryClient]);

  return {
    posts,
    isLoading: query.isPending,
    error: query.error,
    hasMore,
    createPost,
    likePost,
    loadMore,
    refresh,
    isCreating: createMutation.isPending,
    isLiking: reactMutation.isPending,
  };
}
