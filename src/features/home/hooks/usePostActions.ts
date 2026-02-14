import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePostActions as useManualPostActions } from '@/lib/api/hooks/usePosts';
import { useReactions } from '@/lib/api/hooks/useReactions';
import { useShares } from '@/lib/api/hooks/useShares';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { FeedPost } from '../types/feed.types';

export function usePostActions(customQueryKey?: readonly unknown[]) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const { deletePost: manualDelete, updatePost: manualUpdate, isLoading: isPostActionLoading } = useManualPostActions();
  const { reactToPost, unreactPost, isLoading: isReactionLoading } = useReactions();
  const { share, isSharing } = useShares();

  const updateCache = useCallback(
    (updater: (posts: FeedPost[]) => FeedPost[]) => {
      // Tìm tất cả các query có thể chứa bài viết
      const allQueries = queryClient.getQueryCache().findAll({ 
        predicate: (query) => 
          query.queryKey.includes('feed') || 
          query.queryKey.includes('posts') || 
          query.queryKey.includes('recommendation') ||
          query.queryKey.includes('search')
      });

      const updateData = (data: any): any => {
        if (!data) return data;
        
        // Nếu data là mảng bài viết (hiếm gặp trong React Query data root nhưng có thể ở pages)
        if (Array.isArray(data)) return updater(data);
        
        // Nếu data có cấu trúc { posts: [...] } (getFeed response)
        if ('posts' in data && Array.isArray(data.posts)) {
          return { ...data, posts: updater(data.posts) };
        }
        
        // Nếu data có cấu trúc { items: [...] } (PaginatedResponse)
        if ('items' in data && Array.isArray(data.items)) {
          return { ...data, items: updater(data.items) };
        }

        // Nếu data có cấu trúc { data: { posts: [...] } }
        if (data.data && 'posts' in data.data && Array.isArray(data.data.posts)) {
          return { ...data, data: { ...data.data, posts: updater(data.data.posts) } };
        }

        // Trường hợp data chính là 1 bài viết (getPostDetail)
        if ('id' in data && 'content' in data && 'author' in data) {
          const updated = updater([data as FeedPost]);
          return updated.length > 0 ? updated[0] : data;
        }

        return data;
      };

      for (const query of allQueries) {
        queryClient.setQueryData<any>(query.queryKey, (old: any) => {
          if (!old) return old;
          
          // Xử lý Infinite Query
          if ('pages' in old && Array.isArray(old.pages)) {
            return {
              ...old,
              pages: old.pages.map((page: any) => updateData(page)),
            };
          }
          
          return updateData(old);
        });
      }
    },
    [queryClient]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      updateCache(posts => posts.filter(p => p.id !== postId));

      try {
        await manualDelete(postId);
        toast.success('Đã xóa bài viết');
      } catch (err) {
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        toast.error('Lỗi khi xóa bài viết');
        throw err;
      }
    },
    [manualDelete, queryClient, updateCache]
  );

  const updatePost = useCallback(
    async (postId: string, content: string) => {
      updateCache(posts => posts.map(p => (p.id === postId ? { ...p, content } : p)));

      try {
        await manualUpdate({
          postId,
          data: { content_text: content },
        });
        toast.success('Đã cập nhật bài viết');
      } catch (err) {
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        toast.error('Lỗi khi cập nhật bài viết');
        throw err;
      }
    },
    [manualUpdate, queryClient, updateCache]
  );

  const sharePost = useCallback(
    async (postId: string, message?: string) => {
      // Search ALL feed queries for the original post
      let postsArray: FeedPost[] = [];
      const allQueries = queryClient.getQueryCache().findAll({ 
        predicate: (query) => query.queryKey.includes('feed')
      });
      
      for (const query of allQueries) {
        const allData = query.state.data as any;
        if (!allData) continue;
        if ('pages' in allData) {
          postsArray = allData.pages.flatMap((page: any) => 
            Array.isArray(page) ? page : 'posts' in page ? page.posts : 'items' in page ? page.items : 'data' in page ? page.data.posts : []
          );
        } else {
          postsArray = Array.isArray(allData) ? allData : 'posts' in allData ? allData.posts : 'items' in allData ? allData.items : 'data' in allData ? allData.data.posts : [];
        }
        if (postsArray.length) break;
      }

      const originalPost = postsArray.find(p => p.id === postId);

      if (originalPost && currentUser) {
        const optimisticSharedPost: FeedPost = {
          id: `temp-${Date.now()}`,
          author: {
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username || 'Anonymous',
            avatar: currentUser.avatar || null,
            username: currentUser.username,
          },
          content: message || '',
          sharedPost: originalPost,
          visibility: 'PUBLIC',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stats: {
            reactions: 0,
            comments: 0,
            shares: 0,
          },
          userReaction: null,
          mediaUrls: [],
        };

        updateCache(posts => [optimisticSharedPost, ...posts]);
      }

      try {
        await share({
          postId,
          message: message || '',
        });
        toast.success('Đã chia sẻ bài viết');
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        if (customQueryKey) {
          queryClient.invalidateQueries({ queryKey: customQueryKey });
        }
      } catch (err) {
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        toast.error('Lỗi khi chia sẻ bài viết');
        throw err;
      }
    },
    [share, queryClient, currentUser, customQueryKey, updateCache]
  );

  const likePost = useCallback(
    async (postId: string, liked: boolean) => {
      const reaction = liked ? 'LIKE' : null;

      updateCache(posts =>
        posts.map(post => {
          if (post.id !== postId) return post;
          const currentLikes = post.stats.reactions;
          const delta = liked ? 1 : -1;
          return {
            ...post,
            userReaction: reaction,
            stats: {
              ...post.stats,
              reactions: Math.max(0, currentLikes + delta),
            },
          };
        })
      );

      try {
        if (liked) {
          await reactToPost({
            postId,
            reaction: 'LIKE',
          });
        } else {
          await unreactPost(postId);
        }
      } catch (err) {
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        toast.error('Lỗi khi tương tác bài viết');
        throw err;
      }
    },
    [queryClient, reactToPost, unreactPost, updateCache]
  );

  return {
    deletePost,
    updatePost,
    sharePost,
    likePost,
    isDeleting: isPostActionLoading,
    isUpdating: isPostActionLoading,
    isSharing: isSharing,
    isLiking: isReactionLoading,
  };
}
