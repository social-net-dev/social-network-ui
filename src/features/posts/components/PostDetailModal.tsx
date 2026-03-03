import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Avatar } from '@/features/shared/components/Avatar';
import { Button } from '@/components/ui/button';
import { Heart, Share2, Clock, X } from 'lucide-react';
import { VerificationBadge } from '@/features/shared/components/VerificationBadge';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { CommentSection } from './CommentSection';
import { SharedPostCard } from './SharedPostCard';
import { FormattedContent } from '@/features/shared/components/FormattedContent';
import { cn } from '@/lib/utils';
import { POST_TYPES, ACADEMIC_FIELDS } from '../constants/fields';
import type { PostSummary } from '@/lib/api/generated/model';
import { useState, useCallback } from 'react';

type PostWithShared = PostSummary & { sharedPost?: PostSummary | null };

const ROLE_MAP: Record<string, { label: string; class: string }> = {
  STUDENT: { label: 'Người học', class: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-700/40' },
  INSTRUCTOR: { label: 'Người dạy', class: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-700/40' },
};

interface PostDetailModalProps {
  post: PostWithShared | null;
  open: boolean;
  onClose: () => void;
  onLike: (postId: string, liked: boolean) => void;
  onShare: (postId: string) => void;
  currentUserId?: string;
}

export function PostDetailModal({ post, open, onClose, onLike, onShare, currentUserId }: PostDetailModalProps) {
  const navigate = useNavigate();
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  const liked = !!post?.user_reaction;
  const likeCount = post?.stats?.reactions ?? 0;

  const handleLikeClick = useCallback(() => {
    if (!post) return;
    const newLiked = !liked;
    if (newLiked) {
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 400);
    }
    onLike(post.id, newLiked);
  }, [liked, onLike, post]);

  if (!post) return null;

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
  const validMediaUrls = mediaUrls.filter(Boolean) as string[];

  const roleInfo = post.author.role ? ROLE_MAP[post.author.role] : null;
  const postTypeInfo = post.post_type && post.post_type !== 'SOCIAL' ? POST_TYPES.find(t => t.value === post.post_type) : null;
  const fieldInfo = post.field_id ? ACADEMIC_FIELDS.find(af => af.value === post.field_id) : null;
  const sharedPost = post.sharedPost;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-2xl w-full p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Chi tiết bài viết</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { onClose(); navigate(`/profile/${post.author.username}`); }}
              className="relative flex-shrink-0 rounded-full"
            >
              <Avatar user={post.author as any} size="md" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => { onClose(); navigate(`/profile/${post.author.username}`); }}
                  className="font-semibold text-foreground hover:text-primary transition-colors text-sm"
                >
                  {post.author.display_name}
                </button>
                <VerificationBadge accountStatus={post.author.account_status} />
                {roleInfo && (
                  <span className={cn('px-1.5 py-0.5 rounded-md text-[10px] font-semibold', roleInfo.class)}>
                    {roleInfo.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />{timeAgo}
                </span>
                {postTypeInfo && (
                  <span className="post-type-chip">{postTypeInfo.icon} {postTypeInfo.label}</span>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Post content */}
          <div className="px-5 py-4">
            <FormattedContent content={content} className="font-serif-content text-foreground/88 leading-relaxed text-[15px]" />
            {fieldInfo && (
              <div className="mt-3">
                <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium', fieldInfo.color)}>
                  {fieldInfo.icon} {fieldInfo.label}
                </span>
              </div>
            )}
            {sharedPost && <div className="mt-3"><SharedPostCard post={sharedPost} /></div>}
          </div>

          {/* Media */}
          {!sharedPost && validMediaUrls.length > 0 && (
            <div className="px-5 pb-4">
              {validMediaUrls.length === 1 ? (
                <img src={validMediaUrls[0]} alt="Ảnh bài viết" className="w-full max-h-[360px] object-cover rounded-xl" />
              ) : (
                <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden">
                  {validMediaUrls.map((url, index) => (
                    <img key={index} src={url} alt={`Ảnh ${index + 1}`}
                      className={cn('object-cover w-full', index === 0 ? 'h-[300px] row-span-2' : 'h-[148px]')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reaction bar */}
          <div className="flex items-center gap-1 px-5 pb-3 border-b border-border/40">
            <Button
              variant="ghost" size="sm"
              onClick={handleLikeClick}
              className={cn(
                'rounded-full px-3 h-8 gap-1.5 transition-all duration-200',
                liked ? 'text-red-500 bg-red-50 dark:bg-red-950/30' : 'text-muted-foreground'
              )}
            >
              <Heart className={cn('w-3.5 h-3.5', liked ? 'fill-current' : '', isLikeAnimating ? 'animate-heart-beat' : '')} />
              {likeCount > 0 && <span className="text-xs font-semibold tabular-nums">{likeCount}</span>}
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => onShare(post.id)}
              className="rounded-full px-3 h-8 gap-1.5 text-muted-foreground"
            >
              <Share2 className="w-3.5 h-3.5" />
              {(post.stats?.shares ?? 0) > 0 && <span className="text-xs font-semibold tabular-nums">{post.stats!.shares}</span>}
            </Button>
          </div>

          {/* Comments always visible */}
          <div className="px-1">
            <CommentSection postId={post.id} currentUserId={currentUserId} postAuthorId={post.author.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
