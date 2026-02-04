import { useState, useMemo, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PostsV2API, PostsAPI } from "@/lib/api/generated";
import { transformPost } from "@/lib/api/transforms";
import type { Post } from "../types/feed.types";
import { queryKeys } from "@/lib/query-keys";

export function useFeed() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 10;
  
  const query = PostsV2API.useGetFeedV2FeedGet({
    all_tenants: true,
  }, {
    query: {
      refetchOnMount: "always",
      staleTime: 0,
    }
  });

  const posts = useMemo(() => {
    const allPages: Post[] = [];
    for (let i = 1; i <= page; i++) {
      const pageData = queryClient.getQueryData<any>(queryKeys.feed.posts(i));
      const rawPosts = pageData?.data?.posts || pageData?.posts || pageData?.items || [];
      if (Array.isArray(rawPosts)) {
        allPages.push(...rawPosts.map(transformPost) as Post[]);
      }
    }
    return allPages;
  }, [page, queryClient]);

  const hasMoreData = useMemo(() => {
    const data = query.data as any;
    if (!data) return true;
    const totalPages = data.total_pages || data.data?.total_pages || 1;
    return page < totalPages;
  }, [query.data, page]);

  const createMutation = PostsV2API.useCreatePostV2PostsPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed.posts(1) });
      },
    }
  });

  const reactMutation = PostsV2API.useReactToPostV2PostsPostIdReactionsPost();

  const createPost = useCallback(
    (content: string, files: File[]) => {
      return createMutation.mutateAsync({
        data: {
          content_text: content,
          visibility: "PUBLIC",
          files,
        }
      });
    },
    [createMutation],
  );


  const likePost = useCallback(
    (postId: string, liked: boolean) => {
      const reaction = liked ? "LIKE" : null;
      for (let i = 1; i <= page; i++) {
        queryClient.setQueryData<any>(queryKeys.feed.posts(i), (old: any) => {
          if (!old) return old;
          const postsKey = old.posts ? 'posts' : 'items';
          if (!old[postsKey]) return old;
          
          return {
            ...old,
            [postsKey]: old[postsKey].map((post: any) => {
              if (post.id !== postId) return post;
              const currentLikes = post.reaction_count ?? post.likes ?? 0;
              const delta = liked ? 1 : -1;
              return {
                ...post,
                user_reaction: reaction,
                reaction_count: Math.max(0, currentLikes + delta),
              };
            }),
          };
        });
      }
      return reactMutation.mutateAsync({ 
        postId, 
        data: { reaction: reaction as string } 
      });
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
    hasMore: hasMoreData,
    createPost,
    likePost,
    loadMore,
    refresh,
    isCreating: createMutation.isPending,
    isLiking: reactMutation.isPending,
  };
}
