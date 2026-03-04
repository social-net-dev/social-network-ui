import { useState, lazy, Suspense, useRef, useEffect, useCallback } from 'react';
import { useFeed, FeedList, ShareDialog, usePostActions } from '@/features/posts';
import { CreatePostFAB } from '@/features/posts/components/CreatePostFAB';
import { PostComposerCard } from '@/features/posts/components/PostComposerCard';
import { PostDetailModal } from '@/features/posts/components/PostDetailModal';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { AlertCircle, CheckCircle, GraduationCap, HardDrive, MessageSquareText, Users, Loader2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

// Lazy load CreatePostModal để giảm bundle size
const CreatePostModal = lazy(() =>
  import('@/features/posts/components/CreatePostModal').then(module => ({
    default: module.CreatePostModal,
  }))
);

export function FeedPage() {
  const { posts, queryKey, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, error, createPost, refresh } = useFeed();
  const { deletePost, updatePost, sharePost, likePost } = usePostActions({
    affectedQueryKeys: [queryKey],
  });
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const entry = useIntersectionObserver(loadMoreRef, { threshold: 0.1 });
  const isVisible = !!entry?.isIntersecting;

  useEffect(() => {
    if (isVisible && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isVisible, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [initialPostType, setInitialPostType] = useState("SOCIAL");
  const [openCommentPostIds, setOpenCommentPostIds] = useState<string[]>([]);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(() =>
    localStorage.getItem('etechs_unverified_banner_dismissed') === 'true'
  );

  // Auto-open composer when navigated with ?compose=true (e.g. from mobile bottom nav)
  useEffect(() => {
    if (searchParams.get('compose') === 'true') {
      setShowCreateModal(true);
      navigate('/', { replace: true });
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreatePost = useCallback(async (content: string, files: File[], _hashtags: string[], postType?: string, fieldId?: string) => {
    try {
      setIsCreating(true);
      await createPost(content, files, postType, fieldId);
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsCreating(false);
    }
  }, [createPost]);

  const handleLike = useCallback(async (postId: string, liked: boolean) => {
    await likePost(postId, liked);
  }, [likePost]);

  const handleComment = useCallback((postId: string) => {
    setOpenCommentPostIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId],
    );
  }, []);

  const handleShare = useCallback((postId: string) => {
    setSharePostId(postId);
  }, []);

  const handleShareSubmit = useCallback(async (content: string) => {
    if (!sharePostId) return;
    try {
      await sharePost(sharePostId, content);
      refresh();
    } catch (err) {
      console.error('Failed to share post:', err);
      throw err;
    }
  }, [sharePostId, sharePost, refresh]);

  const handleDismissBanner = useCallback(() => {
    setBannerDismissed(true);
    localStorage.setItem('etechs_unverified_banner_dismissed', 'true');
  }, []);

  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      await deletePost(postId);
      refresh();
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  }, [deletePost, refresh]);

  const handleEditPost = useCallback(async (postId: string, content: string) => {
    try {
      await updatePost(postId, content);
      refresh();
    } catch (err) {
      console.error('Failed to edit post:', err);
    }
  }, [updatePost, refresh]);

  const communities = [
    {
      id: 'math-club',
      name: 'CLB Toán học nâng cao',
      members: 2300,
      tag: 'Học thuật',
      avatar: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=120&q=80',
    },
    {
      id: 'stem-2026',
      name: 'Diễn đàn STEM 2026',
      members: 1100,
      tag: 'Công nghệ',
      avatar: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=120&q=80',
    },
    {
      id: 'chem-teachers',
      name: 'Cộng đồng Giáo viên Hóa',
      members: 820,
      tag: 'Giáo dục',
      avatar: 'https://images.unsplash.com/photo-1517976547714-720226b864c1?auto=format&fit=crop&w=120&q=80',
    },
    {
      id: 'thpt-exam',
      name: 'Nhóm Ôn thi THPT',
      members: 640,
      tag: 'Kỳ thi',
      avatar: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=120&q=80',
    },
  ];

  const activeFriends = [
    { id: 'f1', name: 'Trần Hoàng Phúc', username: 'hoangphuc', status: 'Đang học', avatar: 'https://i.pravatar.cc/120?img=15' },
    { id: 'f2', name: 'Phạm Thu Hà', username: 'thuhap', status: 'Online', avatar: 'https://i.pravatar.cc/120?img=45' },
    { id: 'f3', name: 'Nguyễn Minh Anh', username: 'minhanh', status: 'Vừa kết nối', avatar: 'https://i.pravatar.cc/120?img=32' },
  ];

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
      <div className="space-y-6">
        {/* Account Status Banner */}
        {currentUser?.account_status === 'UNVERIFIED' && !bannerDismissed && (
          <div className="rounded-xl border border-amber-200/60 dark:border-amber-700/30 bg-amber-50/80 dark:bg-amber-900/10 p-4 flex items-start gap-3 animate-fadeInDown">
            <AlertCircle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Tài khoản chưa xác minh</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-0.5">
                Dung lượng: <span className="font-bold">{currentUser?.storage_quota_mb || 100}MB</span>. Sau khi admin phê duyệt, bạn nhận được <span className="font-bold">5GB</span>.
              </p>
            </div>
            <button onClick={handleDismissBanner} className="text-amber-500 hover:text-amber-700 transition-colors shrink-0" aria-label="Đóng">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {currentUser?.account_status === 'VERIFIED' && (
          <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-700/30 bg-emerald-50/80 dark:bg-emerald-900/10 p-4 flex items-start gap-3 animate-fadeInDown">
            <CheckCircle className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">Tài khoản đã xác minh</p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70 mt-0.5">
                <HardDrive className="inline h-3.5 w-3.5 mr-1" />
                Dung lượng: <span className="font-bold">{currentUser?.storage_quota_mb || 5120}MB (5GB)</span>
              </p>
            </div>
          </div>
        )}

        <CreatePostFAB onClick={() => setShowCreateModal(true)} scrollThreshold={100} />

        <PostComposerCard
          onOpen={(type) => {
            setInitialPostType(type ?? "SOCIAL");
            setShowCreateModal(true);
          }}
        />

        <Suspense fallback={<div className="text-center py-4 text-muted-foreground">Đang tải...</div>}>
          <CreatePostModal open={showCreateModal} onOpenChange={setShowCreateModal} onSubmit={handleCreatePost} isLoading={isCreating} initialPostType={initialPostType} />
        </Suspense>

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

        <FeedList posts={posts} isLoading={isLoading} onLike={handleLike} onComment={handleComment} onShare={handleShare} onDelete={handleDeletePost} onEdit={handleEditPost} openCommentPostIds={openCommentPostIds} currentUserId={currentUser?.id} onOpenDetail={setDetailPostId} />

        {/* Sentinel for Infinite Scroll */}
        <div ref={loadMoreRef} className="flex justify-center pt-4 pb-8 min-h-16">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-primary font-medium">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Đang tải thêm bài viết...</span>
            </div>
          )}
          {!hasNextPage && posts.length > 0 && <p className="text-muted-foreground text-sm">Bạn đã xem hết bài viết</p>}
        </div>
      </div>

      <div className="lg:sticky lg:top-20 h-[calc(100vh-6rem)] overflow-y-auto pr-1 space-y-4 sidebar-scroll">
        {/* Communities Widget */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground tracking-tight">Cộng đồng</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">đang tham gia</span>
          </div>
          <div className="p-2 space-y-0.5">
            {communities.map((community, i) => (
              <Link key={community.id} to={`/groups/${community.id}`}
                className="flex items-center justify-between rounded-xl px-2.5 py-2 transition-all hover:bg-primary/5 group"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="size-8 shrink-0 ring-1 ring-border">
                    <AvatarImage src={community.avatar} alt={community.name} />
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">{community.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">{community.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{community.tag}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-full shrink-0 ml-1 tabular-nums">
                  {(community.members / 1000).toFixed(1)}k
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Active Friends Widget */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <MessageSquareText className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <span className="text-xs font-semibold text-foreground tracking-tight">Bạn bè</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              đang hoạt động
            </span>
          </div>
          <div className="p-2 space-y-0.5">
            {activeFriends.map(friend => (
              <Link key={friend.id} to={`/messages?user=${friend.username}`}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all hover:bg-emerald-500/5 group"
              >
                <div className="relative shrink-0">
                  <Avatar className="size-8 ring-1 ring-border">
                    <AvatarImage src={friend.avatar} alt={friend.name} />
                    <AvatarFallback className="text-xs font-semibold">{friend.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="online-dot-glow" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{friend.name}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{friend.status}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Card */}
        <div className="rounded-2xl border border-[#e2f046]/25 dark:border-[#e2f046]/15 bg-gradient-to-br from-[#e2f046]/8 via-card to-primary/5 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#e2f046]/15 text-amber-600 dark:text-[#e2f046] flex items-center justify-center shrink-0 mt-0.5">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground tracking-tight">Tăng điểm uy tín</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Hoàn thiện hồ sơ để nhận thêm tính năng & kết nối.</p>
              <Button size="sm" className="btn-lime-glow mt-3 rounded-lg h-7 px-4 text-[11px]">
                Hoàn thiện ngay
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ShareDialog isOpen={sharePostId !== null} onClose={() => setSharePostId(null)} onShare={handleShareSubmit} />
      <PostDetailModal
        post={detailPostId ? (posts.find(p => p.id === detailPostId) ?? null) : null}
        open={detailPostId !== null}
        onClose={() => setDetailPostId(null)}
        onLike={handleLike}
        onShare={handleShare}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
