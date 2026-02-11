import { useState, lazy, Suspense, useRef, useEffect } from 'react';
import { useFeed } from '../hooks/useFeed';
import { CreatePostTrigger } from '../components/CreatePostTrigger';
import { FeedList } from '../components/FeedList';
import { ShareDialog } from '../components/ShareDialog';
import { SearchUsersMini } from '../components/SearchUsersMini';
import { Button } from '@/components/ui/button';
import { usePostActions } from '../hooks/usePostActions';
import { useAuthStore } from '@/stores/authStore';
import { AlertCircle, CheckCircle, GraduationCap, HardDrive, MessageSquareText, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

// Lazy load CreatePostModal để giảm bundle size
const CreatePostModal = lazy(() =>
  import('../components/CreatePostModal').then(module => ({
    default: module.CreatePostModal,
  }))
);

export function FeedPage() {
  const { posts, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, error, createPost, refresh } = useFeed();
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

  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);

  const handleCreatePost = async (content: string, files: File[], hashtags: string[], postType?: string, fieldId?: string) => {
    try {
      setIsCreating(true);
      // V2 API doesn't support separate hashtags field, append to content
      const contentWithHashtags = hashtags.length > 0 ? `${content}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}` : content;

      await createPost(contentWithHashtags, files, postType, fieldId);
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
        {currentUser?.account_status === 'UNVERIFIED' && (
          <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Tài khoản chưa xác minh</p>
              <p className="text-sm text-muted-foreground mt-1">
                Dung lượng hiện tại: <span className="font-semibold text-foreground">{currentUser?.storage_quota_mb || 100}MB</span>. Khi admin phê duyệt, bạn sẽ nhận được 5GB dung lượng.
              </p>
            </div>
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

        <CreatePostTrigger onClick={() => setShowCreateModal(true)} />

        <Suspense fallback={<div className="text-center py-4 text-muted-foreground">Đang tải...</div>}>
          <CreatePostModal open={showCreateModal} onOpenChange={setShowCreateModal} onSubmit={handleCreatePost} isLoading={isCreating} />
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

        <FeedList posts={posts} isLoading={isLoading} onLike={handleLike} onComment={handleComment} onShare={handleShare} onDelete={handleDeletePost} onEdit={handleEditPost} selectedPostId={selectedPostId} currentUserId={currentUser?.id || currentUser?.user_id} />

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

      <div className="lg:sticky lg:top-24 h-[calc(100vh-7rem)] overflow-y-auto pr-1 space-y-6 sidebar-scroll">
        {/* Search Users Mini */}
        <SearchUsersMini />

        <Card className="border-none shadow-xl bg-white dark:bg-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Cộng đồng đang tham gia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {communities.map(community => (
              <Link key={community.id} to={`/groups/${community.id}`} className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-primary/5 group">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage src={community.avatar} alt={community.name} />
                    <AvatarFallback>{community.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary">{community.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{community.tag}</p>
                  </div>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {(community.members / 1000).toFixed(1)}k
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white dark:bg-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-emerald-500" />
              Bạn bè đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeFriends.map(friend => (
              <Link key={friend.id} to={`/messages?user=${friend.username}`} className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-emerald-500/10 group">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage src={friend.avatar} alt={friend.name} />
                    <AvatarFallback>{friend.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-emerald-600">{friend.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nhấn để nhắn tin</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 rounded-full" variant="secondary">
                  {friend.status}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-amber-900/20 dark:via-card dark:to-emerald-900/20">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Tăng điểm nón</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hoàn thiện hồ sơ để tăng uy tín.</p>
            </div>
            <Button size="sm" className="ml-auto rounded-full">
              Thực hiện
            </Button>
          </CardContent>
        </Card>
      </div>

      <ShareDialog isOpen={sharePostId !== null} onClose={() => setSharePostId(null)} onShare={handleShareSubmit} />
    </div>
  );
}
