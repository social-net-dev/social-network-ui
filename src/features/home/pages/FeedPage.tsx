import { useState, lazy, Suspense, useRef, useEffect } from 'react';
import { useFeed, FeedList, ShareDialog, usePostActions } from '@/features/posts';
import { CreatePostFAB } from '@/features/posts/components/CreatePostFAB';
import { PostComposerCard } from '@/features/posts/components/PostComposerCard';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { AlertCircle, CheckCircle, GraduationCap, HardDrive, MessageSquareText, Users, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  const handleCreatePost = async (content: string, files: File[], _hashtags: string[], postType?: string, fieldId?: string) => {
    try {
      setIsCreating(true);
      await createPost(content, files, postType, fieldId);
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLike = async (postId: string, liked: boolean) => {
    await likePost(postId, liked);
  };

  const handleComment = (postId: string) => {
    setOpenCommentPostIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId],
    );
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

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem('etechs_unverified_banner_dismissed', 'true');
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
          <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Tài khoản chưa xác minh</p>
              <p className="text-sm text-muted-foreground mt-1">
                Dung lượng hiện tại: <span className="font-semibold text-foreground">{currentUser?.storage_quota_mb || 100}MB</span>. Khi admin phê duyệt, bạn sẽ nhận được 5GB dung lượng.
              </p>
            </div>
            <button
              onClick={handleDismissBanner}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
              aria-label="Đóng thông báo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {currentUser?.account_status === 'VERIFIED' && (
          <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-secondary">Tài khoản đã xác minh</p>
              <p className="text-sm text-secondary/80 mt-1">
                <HardDrive className="inline h-4 w-4 mr-1" />
                Dung lượng sử dụng: <span className="font-semibold">{currentUser?.storage_quota_mb || 5120}MB (5GB)</span>
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

        <FeedList posts={posts} isLoading={isLoading} onLike={handleLike} onComment={handleComment} onShare={handleShare} onDelete={handleDeletePost} onEdit={handleEditPost} openCommentPostIds={openCommentPostIds} currentUserId={currentUser?.id} />

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
        <Card className="border border-border/50 shadow-sm bg-card overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-primary" />
              </div>
              Cộng đồng đang tham gia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 pb-3 px-2">
            {communities.map(community => (
              <Link key={community.id} to={`/groups/${community.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 transition-all hover:bg-primary/5 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage src={community.avatar} alt={community.name} />
                    <AvatarFallback className="text-xs">{community.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">{community.name}</p>
                    <p className="text-[10px] text-muted-foreground">{community.tag}</p>
                  </div>
                </div>
                <Badge variant="outline" className="rounded-full text-[10px] px-1.5 py-0 h-4 shrink-0 ml-1">
                  {(community.members / 1000).toFixed(1)}k
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm bg-card overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <MessageSquareText className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              Bạn bè đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 pb-3 px-2">
            {activeFriends.map(friend => (
              <Link key={friend.id} to={`/messages?user=${friend.username}`} className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-all hover:bg-emerald-500/8 group">
                <div className="relative shrink-0">
                  <Avatar className="size-8">
                    <AvatarImage src={friend.avatar} alt={friend.name} />
                    <AvatarFallback className="text-xs">{friend.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="online-dot" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{friend.name}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{friend.status}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-primary/15 shadow-sm bg-gradient-to-br from-primary/5 via-card to-secondary/5 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Tăng điểm uy tín</p>
              <p className="text-xs text-muted-foreground">Hoàn thiện hồ sơ để tăng uy tín.</p>
            </div>
            <Button size="sm" className="ml-auto rounded-full h-7 text-xs shrink-0">
              Thực hiện
            </Button>
          </CardContent>
        </Card>
      </div>

      <ShareDialog isOpen={sharePostId !== null} onClose={() => setSharePostId(null)} onShare={handleShareSubmit} />
    </div>
  );
}
