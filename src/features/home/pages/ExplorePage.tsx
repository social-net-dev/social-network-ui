import { useState, useRef, useEffect } from 'react';
import { useFeed } from '../hooks/useFeed';
import { FeedList } from '../components/FeedList';
import { ShareDialog } from '../components/ShareDialog';
import { usePostActions } from '../hooks/usePostActions';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Compass, Search } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { ACADEMIC_FIELDS } from '../constants/fields';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export function ExplorePage() {
  const [selectedField, setSelectedField] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { posts, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, error, refresh } = useFeed({
    fieldId: selectedField,
  });
  const { deletePost, updatePost, sharePost, likePost } = usePostActions();
  const { user: currentUser } = useAuthStore();

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const entry = useIntersectionObserver(loadMoreRef, { threshold: 0.1 });
  const isVisible = !!entry?.isIntersecting;

  useEffect(() => {
    if (isVisible && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isVisible, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);

  const handleLike = async (postId: string, liked: boolean) => {
    await likePost(postId, liked);
  };

  const handleComment = (postId: string) => {
    setSelectedPostId(selectedPostId === postId ? null : postId);
  };

  const handleShare = (postId: string) => {
    setSharePostId(postId);
  };

  const handleShareSubmit = async (content: string) => {
    if (!sharePostId) return;
    try {
      await sharePost(sharePostId, content);
      refresh();
    } catch (err) {
      console.error('Failed to share post:', err);
      throw err;
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      refresh();
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleEditPost = async (postId: string, content: string) => {
    try {
      await updatePost(postId, content);
      refresh();
    } catch (err) {
      console.error('Failed to edit post:', err);
    }
  };

  const filteredFields = searchQuery
    ? ACADEMIC_FIELDS.filter(f =>
        f.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : ACADEMIC_FIELDS;

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_minmax(0,2fr)] gap-6">
      {/* Sidebar: Field List */}
      <div className="lg:sticky lg:top-24 h-fit">
        <div className="bg-card rounded-xl shadow-sm border border-border/50 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Compass className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg text-foreground">Khám phá lĩnh vực</h2>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm lĩnh vực..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            <button
              onClick={() => setSelectedField('')}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                !selectedField
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground hover:bg-muted/50'
              )}
            >
              <span className="text-base">🌐</span>
              <span>Tất cả lĩnh vực</span>
            </button>

            {filteredFields.map(field => (
              <button
                key={field.value}
                onClick={() => setSelectedField(field.value)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  selectedField === field.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:bg-muted/50'
                )}
              >
                <span className="text-base">{field.icon}</span>
                <span className="flex-1 text-left">{field.label}</span>
                {selectedField === field.value && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary-foreground/20">
                    Đang xem
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Feed */}
      <div className="space-y-6">
        {/* Current Filter Badge */}
        {selectedField && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Đang lọc:</span>
            {(() => {
              const field = ACADEMIC_FIELDS.find(f => f.value === selectedField);
              return field ? (
                <Badge
                  variant="secondary"
                  className={cn('text-sm px-3 py-1 cursor-pointer hover:opacity-80', field.color)}
                  onClick={() => setSelectedField('')}
                >
                  {field.icon} {field.label} ✕
                </Badge>
              ) : null;
            })()}
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-destructive font-medium">{error instanceof Error ? error.message : 'Đã có lỗi xảy ra'}</p>
              <Button variant="outline" size="sm" onClick={refresh} className="border-destructive/30 hover:bg-destructive/10 text-destructive">
                Thử lại
              </Button>
            </div>
          </div>
        )}

        <FeedList
          posts={posts}
          isLoading={isLoading}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          onDelete={handleDeletePost}
          onEdit={handleEditPost}
          selectedPostId={selectedPostId}
          currentUserId={currentUser?.id || currentUser?.user_id}
        />

        {/* Sentinel for Infinite Scroll */}
        <div ref={loadMoreRef} className="flex justify-center pt-4 pb-8 min-h-16">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-primary font-medium">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Đang tải thêm bài viết...</span>
            </div>
          )}
          {!hasNextPage && posts.length > 0 && (
            <p className="text-muted-foreground text-sm">
              {selectedField ? 'Đã xem hết bài viết trong lĩnh vực này' : 'Đã xem hết bài viết'}
            </p>
          )}
          {!isLoading && posts.length === 0 && selectedField && (
            <div className="text-center py-12">
              <Compass className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có bài viết</h3>
              <p className="text-muted-foreground text-sm">
                Chưa có bài viết nào trong lĩnh vực này.
              </p>
            </div>
          )}
        </div>
      </div>

      <ShareDialog isOpen={sharePostId !== null} onClose={() => setSharePostId(null)} onShare={handleShareSubmit} />
    </div>
  );
}
