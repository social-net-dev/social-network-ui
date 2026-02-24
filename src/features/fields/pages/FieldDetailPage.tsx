import { useParams } from 'react-router-dom';
import { useField } from '../hooks/useField';
import { FieldHeader } from '../components/FieldHeader';
import { FieldExplorer } from '../components/FieldExplorer';
import { FeedList, usePostActions } from '@/features/posts';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function FieldDetailPage() {
  const { fieldId } = useParams<{ fieldId: string }>();
  const { user } = useAuthStore();
  const { field, isLoadingField, posts, isLoadingPosts, fetchNextPage, hasNextPage, isFetchingNextPage, followField, unfollowField, isFollowingLoading } = useField(fieldId || '');

  const [openCommentPostIds, setOpenCommentPostIds] = useState<string[]>([]);

  const { likePost, sharePost, deletePost, updatePost } = usePostActions({
    affectedQueryKeys: [['fields', fieldId, 'posts']],
  });

  const onComment = (postId: string) => {
    setOpenCommentPostIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId],
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Explorer */}
        <aside className="lg:col-span-4 space-y-6">
          <FieldExplorer />

          <div className="hidden lg:block bg-primary/5 rounded-2xl p-6 border border-primary/10">
            <h4 className="font-bold text-primary mb-2">Thông tin thêm</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Các bài viết được gắn thẻ với hashtag của lĩnh vực này sẽ tự động xuất hiện tại đây. Hãy theo dõi để cập nhật thông tin mới nhất!</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-8 space-y-6">
          <FieldHeader field={field} isLoading={isLoadingField} onFollow={followField} onUnfollow={unfollowField} isActionLoading={isFollowingLoading} />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Bài viết mới nhất</h2>
            </div>

            <FeedList posts={posts} isLoading={isLoadingPosts} onLike={likePost} onComment={onComment} onShare={sharePost} onDelete={deletePost} onEdit={updatePost} currentUserId={user?.id} openCommentPostIds={openCommentPostIds} />

            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="text-primary hover:underline font-medium text-sm">
                  {isFetchingNextPage ? 'Đang tải...' : 'Xem thêm bài viết'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
