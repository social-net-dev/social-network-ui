import { Avatar } from '@/features/shared/components/Avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import type { PostSummary } from '@/lib/api/generated/model';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommentSection } from './CommentSection';
import { SharedPostCard } from './SharedPostCard';
import { FormattedContent } from '@/features/shared/components/FormattedContent';
import { cn } from '@/lib/utils';
import { POST_TYPES, ACADEMIC_FIELDS } from '../constants/fields';

type PostWithShared = PostSummary & { sharedPost?: PostSummary | null };

const ROLE_MAP: Record<string, { label: string; class: string }> = {
  STUDENT: { label: 'Người học', class: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  INSTRUCTOR: { label: 'Người dạy', class: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
};

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  VERIFIED: { label: 'Đã xác minh', class: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  UNVERIFIED: { label: 'Chưa xác minh', class: 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400' },
};

interface PostProps {
  post: PostWithShared;
  onLike: (postId: string, liked: boolean) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  showComments?: boolean;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string, content: string) => void;
  currentUserId?: string;
}

export function PostCard({ post, onLike, onComment, onShare, showComments, onDelete, onEdit, currentUserId }: PostProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isCommentsMounted, setIsCommentsMounted] = useState(Boolean(showComments));

  // Optimistic Like State
  const [optimisticLike, setOptimisticLike] = useState({
    liked: !!post.user_reaction,
    count: post.stats?.reactions ?? 0
  });

  // Sync with props when post changes (e.g. after API settles)
  useEffect(() => {
    setOptimisticLike({
      liked: !!post.user_reaction,
      count: post.stats?.reactions ?? 0
    });
  }, [post.user_reaction, post.stats?.reactions]);

  useEffect(() => {
    if (showComments) {
      setIsCommentsMounted(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsCommentsMounted(false);
    }, 260);

    return () => window.clearTimeout(timer);
  }, [showComments]);

  const createdAt = post.created_at || new Date().toISOString();

  const dateObj = new Date(createdAt);
  const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;

  const timeAgo = formatDistanceToNow(validDate, {
    addSuffix: true,
    locale: vi,
  });

  const content = post.content || '';

  const mediaAssets = post.media || [];
  const legacyUrls = post.media_urls || [];

  const mediaUrls = mediaAssets.length > 0 
    ? mediaAssets.map(asset => asset.cdn_url || asset.original_url).filter(Boolean)
    : legacyUrls.map(url => url.startsWith('http') ? url : `${window.location.origin}${url}`);

  const validMediaUrls = mediaUrls.filter(Boolean);

  const isAuthor = currentUserId === post.author.id;
  const sharedPost = post.sharedPost;

  const handleLikeClick = () => {
    const newLiked = !optimisticLike.liked;
    const newCount = optimisticLike.count + (newLiked ? 1 : -1);
    
    // 1. Update UI instantly
    setOptimisticLike({
      liked: newLiked,
      count: Math.max(0, newCount)
    });

    // 2. Trigger heartbeat animation on like
    if (newLiked) {
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 400);
    }

    // 3. Call parent onLike (which handles API and global cache)
    onLike(post.id, newLiked);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
      onDelete(post.id);
    }
  };

  const handleEdit = () => {
    setEditContent(content);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!onEdit || !editContent.trim()) return;
    onEdit(post.id, editContent);
    setIsEditing(false);
  };

  return (
    <article className="bg-card rounded-xl shadow-sm hover:shadow-md transition-all-300 hover-lift animate-fadeIn border border-border/50">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${post.author.username}`)}>
              <Avatar user={post.author as any} size="md" className="ring-2 ring-transparent hover:ring-primary/20 transition-all-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors-300 cursor-pointer" onClick={() => navigate(`/profile/${post.author.username}`)}>
                  {post.author.display_name}
                </h3>
                {post.author.role && ROLE_MAP[post.author.role] && (
                  <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', ROLE_MAP[post.author.role].class)}>
                    {ROLE_MAP[post.author.role].label}
                  </span>
                )}
                {post.author.account_status && STATUS_MAP[post.author.account_status] && (
                  <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', STATUS_MAP[post.author.account_status].class)}>
                    {STATUS_MAP[post.author.account_status].label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {timeAgo}
                  {sharedPost && <span className="w-1 h-1 bg-muted-foreground/50 rounded-full"></span>}
                  {sharedPost && <span className="text-primary">đã chia sẻ</span>}
                </p>
                {post.post_type && post.post_type !== 'SOCIAL' && (() => {
                  const pt = POST_TYPES.find(t => t.value === post.post_type);
                  return pt ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">{pt.icon} {pt.label}</span>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/60 transition-colors-300">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 animate-scaleIn">
                <DropdownMenuItem onClick={handleEdit} className="gap-2 cursor-pointer">
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                  Xóa bài viết
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <div className="mb-4">
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:ring-primary/20 transition-all-300 resize-none" rows={3} placeholder="Nhập nội dung bài viết..." />
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleSaveEdit} className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors-300">
                Lưu
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="hover:bg-muted/50 transition-colors-300">
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <>
            <FormattedContent content={content} className="text-foreground/90 leading-relaxed mb-3 text-sm block" />
            {post.field_id && (() => {
              const f = ACADEMIC_FIELDS.find(af => af.value === post.field_id);
              return f ? (
                <div className="mb-3">
                  <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', f.color)}>{f.icon} {f.label}</span>
                </div>
              ) : null;
            })()}
            {sharedPost && <SharedPostCard post={sharedPost} />}
          </>
        )}

        {!sharedPost && validMediaUrls.length > 0 && (
          <div className="mb-4 grid gap-2">
            {validMediaUrls.length === 1 ? (
              <img src={validMediaUrls[0]} alt="Ảnh bài viết" className="w-full rounded-xl max-h-[500px] object-cover hover:scale-[1.01] transition-transform duration-300" />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {validMediaUrls.map((url, index) => (
                  <img key={index} src={url} alt={`Ảnh bài viết ${index + 1}`} className={`rounded-xl hover:scale-[1.01] transition-transform duration-300 ${index === 0 && validMediaUrls.length > 1 ? 'row-span-2 h-[452px]' : 'h-56'} object-cover w-full`} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center pt-3 border-t border-border/40">
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLikeClick}
              className={cn(
                'rounded-full px-3 h-8 gap-1.5 transition-all-300',
                'hover:bg-red-50 dark:hover:bg-red-950/30',
                optimisticLike.liked
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-muted-foreground hover:text-red-500 dark:hover:text-red-400'
              )}
            >
              <Heart
                className={cn(
                  'w-4 h-4 transition-all',
                  optimisticLike.liked ? 'fill-current' : '',
                  isLikeAnimating ? 'animate-heart-beat' : ''
                )}
              />
              <span className={cn(
                'text-xs font-medium tabular-nums transition-all',
                optimisticLike.count === 0 && 'opacity-40'
              )}>
                {optimisticLike.count > 0 ? optimisticLike.count : ''}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment(post.id)}
              className={cn(
                'rounded-full px-3 h-8 gap-1.5 transition-all-300',
                'text-muted-foreground hover:text-blue-500 dark:hover:text-blue-400',
                'hover:bg-blue-50 dark:hover:bg-blue-950/30',
                showComments && 'text-blue-500 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/20'
              )}
            >
              <MessageCircle className="w-4 h-4" />
              {(post.stats?.comments ?? 0) > 0 && (
                <span className="text-xs font-medium tabular-nums">{post.stats.comments}</span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(post.id)}
              className={cn(
                'rounded-full px-3 h-8 gap-1.5 transition-all-300',
                'text-muted-foreground hover:text-emerald-500 dark:hover:text-emerald-400',
                'hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              )}
            >
              <Share2 className="w-4 h-4" />
              {(post.stats?.shares ?? 0) > 0 && (
                <span className="text-xs font-medium tabular-nums">{post.stats.shares}</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {isCommentsMounted && (
        <div
          className={cn(
            'border-t border-border/50 overflow-hidden transition-all duration-300 ease-out',
            showComments ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <CommentSection postId={post.id} currentUserId={currentUserId} postAuthorId={post.author.id} />
        </div>
      )}
    </article>
  );
}
