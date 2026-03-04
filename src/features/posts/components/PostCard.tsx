import { Avatar } from '@/features/shared/components/Avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Edit, Clock } from 'lucide-react';
import { VerificationBadge } from '@/features/shared/components/VerificationBadge';
import type { PostSummary } from '@/lib/api/types';
import { memo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommentSection } from './CommentSection';
import { SharedPostCard } from './SharedPostCard';
import { FormattedContent } from '@/features/shared/components/FormattedContent';
import { cn } from '@/lib/utils';
import { POST_TYPES, ACADEMIC_FIELDS } from '../constants/fields';

type PostWithShared = PostSummary & { sharedPost?: PostSummary | null };

const ROLE_MAP: Record<string, { label: string; class: string }> = {
  STUDENT: { label: 'Người học', class: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-700/40' },
  INSTRUCTOR: { label: 'Người dạy', class: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-700/40' },
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
  onOpenDetail?: (postId: string) => void;
}

export const PostCard = memo(function PostCard({ post, onLike, onComment, onShare, showComments, onDelete, onEdit, currentUserId, onOpenDetail }: PostProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isCommentsMounted, setIsCommentsMounted] = useState(Boolean(showComments));

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

  // Derive like state directly from props — no local state mirror
  const liked = !!post.user_reaction;
  const likeCount = post.stats?.reactions ?? 0;

  const createdAt = post.created_at || new Date().toISOString();
  const dateObj = new Date(createdAt);
  const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
  const timeAgo = formatDistanceToNow(validDate, { addSuffix: true, locale: vi });

  const content = post.content || '';
  const mediaAssets = post.media || [];
  const legacyUrls = post.media_urls || [];
  const mediaUrls = mediaAssets.length > 0
    ? mediaAssets.map(asset => asset.cdn_url || asset.original_url).filter(Boolean)
    : legacyUrls.map(url => url.startsWith('http') ? url : `${window.location.origin}${url}`);
  const validMediaUrls = mediaUrls.filter(Boolean);
  const isAuthor = currentUserId === post.author.id;
  const sharedPost = post.sharedPost;
  const roleInfo = post.author.role ? ROLE_MAP[post.author.role] : null;
  const postTypeInfo = post.post_type && post.post_type !== 'SOCIAL' ? POST_TYPES.find(t => t.value === post.post_type) : null;
  const fieldInfo = post.field_id ? ACADEMIC_FIELDS.find(af => af.value === post.field_id) : null;

  const handleLikeClick = useCallback(() => {
    const newLiked = !liked;
    if (newLiked) {
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 400);
    }
    onLike(post.id, newLiked);
  }, [liked, onLike, post.id]);

  const handleDelete = () => {
    if (!onDelete) return;
    if (confirm('Bạn có chắc muốn xóa bài viết này?')) onDelete(post.id);
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
    <article className={cn(
      'post-card-accent bg-card rounded-xl border border-border/60 shadow-sm',
      'hover:shadow-lg hover:border-border dark:hover:border-white/10',
      'transition-all duration-300 overflow-hidden stagger-item'
    )}>
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(`/profile/${post.author.username}`)}
              className="relative flex-shrink-0 rounded-full transition-transform duration-200 hover:scale-105"
            >
              <Avatar user={post.author as any} size="md" className="ring-2 ring-transparent hover:ring-[#e2f046]/50 dark:hover:ring-[#e2f046]/40 transition-all duration-200" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <button
                  onClick={() => navigate(`/profile/${post.author.username}`)}
                  className="font-semibold text-foreground hover:text-primary transition-colors duration-200 text-sm truncate max-w-[180px]"
                >
                  {post.author.display_name}
                </button>
                <VerificationBadge accountStatus={post.author.account_status} />
                {roleInfo && (
                  <span className={cn('px-1.5 py-0.5 rounded-md text-[10px] font-semibold flex-shrink-0', roleInfo.class)}>
                    {roleInfo.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {timeAgo}
                  {sharedPost && <><span className="mx-0.5 opacity-40">·</span><span className="text-primary font-medium">đã chia sẻ</span></>}
                </span>
                {postTypeInfo && (
                  <span className="post-type-chip">
                    {postTypeInfo.icon} {postTypeInfo.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted/70 flex-shrink-0">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 animate-scaleIn rounded-xl shadow-lg">
                <DropdownMenuItem onClick={handleEdit} className="gap-2 cursor-pointer rounded-lg">
                  <Edit className="w-4 h-4" /> Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg">
                  <Trash2 className="w-4 h-4" /> Xóa bài viết
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mb-4">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full p-3 border border-border rounded-xl bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm font-serif-content"
              rows={3}
              placeholder="Nhập nội dung bài viết..."
            />
            <div className="flex gap-2 mt-2.5">
              <Button size="sm" onClick={handleSaveEdit} className="btn-lime-glow rounded-lg h-8 px-4 text-xs">
                Lưu thay đổi
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="rounded-lg h-8 px-4 text-xs hover:bg-muted/60">
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <>
            <FormattedContent
              content={content}
              className={cn(
                'font-serif-content text-foreground/88 leading-relaxed mb-3 block',
                onOpenDetail && 'cursor-pointer hover:text-foreground transition-colors'
              )}
              onClick={onOpenDetail ? () => onOpenDetail(post.id) : undefined}
            />
            {fieldInfo && (
              <div className="mb-3">
                <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium', fieldInfo.color)}>
                  {fieldInfo.icon} {fieldInfo.label}
                </span>
              </div>
            )}
            {sharedPost && <SharedPostCard post={sharedPost} />}
          </>
        )}

        {/* Media grid */}
        {!sharedPost && validMediaUrls.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-xl">
            {validMediaUrls.length === 1 ? (
              <img
                src={validMediaUrls[0]}
                alt="Ảnh bài viết"
                className="w-full max-h-[480px] object-cover hover:scale-[1.01] transition-transform duration-500"
              />
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {validMediaUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Ảnh ${index + 1}`}
                    className={cn(
                      'object-cover w-full hover:brightness-105 hover:scale-[1.01] transition-all duration-300',
                      index === 0 && validMediaUrls.length > 1 ? 'row-span-2 h-[420px]' : 'h-[206px]',
                      index === 0 ? 'rounded-l-lg' : index === 1 ? 'rounded-tr-lg' : 'rounded-br-lg'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLikeClick}
              className={cn(
                'rounded-full px-3 h-8 gap-1.5 transition-all duration-200 action-btn-like',
                liked
                  ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
                  : 'text-muted-foreground'
              )}
            >
              <Heart className={cn('w-3.5 h-3.5 transition-all', liked ? 'fill-current' : '', isLikeAnimating ? 'animate-heart-beat' : '')} />
              <span className={cn('text-xs font-semibold tabular-nums', likeCount === 0 && 'opacity-0 w-0 overflow-hidden')}>
                {likeCount > 0 ? likeCount : ''}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment(post.id)}
              className={cn(
                'rounded-full px-3 h-8 gap-1.5 transition-all duration-200 action-btn-comment',
                showComments
                  ? 'text-primary bg-primary/8'
                  : 'text-muted-foreground'
              )}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {(post.stats?.comments ?? 0) > 0 && (
                <span className="text-xs font-semibold tabular-nums">{post.stats.comments}</span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(post.id)}
              className="rounded-full px-3 h-8 gap-1.5 transition-all duration-200 action-btn-share text-muted-foreground"
            >
              <Share2 className="w-3.5 h-3.5" />
              {(post.stats?.shares ?? 0) > 0 && (
                <span className="text-xs font-semibold tabular-nums">{post.stats.shares}</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Comment section */}
      {isCommentsMounted && (
        <div className={cn(
          'border-t border-border/50 overflow-hidden transition-all duration-300 ease-out',
          showComments ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0',
        )}>
          <CommentSection postId={post.id} currentUserId={currentUserId} postAuthorId={post.author.id} />
        </div>
      )}
    </article>
  );
});
