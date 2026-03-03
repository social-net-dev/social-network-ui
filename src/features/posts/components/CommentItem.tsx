import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Reply, Trash2, Edit } from 'lucide-react';
import { VerificationBadge } from '@/features/shared/components/VerificationBadge';
import { Avatar } from '@/features/shared/components/Avatar';
import { FormattedContent } from '@/features/shared/components/FormattedContent';
import { useMediaBlobs } from '../hooks/useMedia';
import type { FeedComment, ReactionType } from '../types/feed.types';
import { cn } from '@/lib/utils';

const ROLE_MAP: Record<string, { label: string; class: string }> = {
  STUDENT: { label: 'Người học', class: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  INSTRUCTOR: { label: 'Người dạy', class: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
};

export interface CommentItemProps {
  comment: FeedComment;
  currentUserId?: string;
  postAuthorId?: string;
  onReply: (id: string, name: string) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, content: string) => Promise<void>;
  onLike: (id: string, reaction: ReactionType | null) => Promise<void>;
}

export function CommentItem({ comment, currentUserId, postAuthorId, onReply, onDelete, onUpdate, onLike }: CommentItemProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const { data: mediaUrls = [] } = useMediaBlobs(comment.media_urls || []);
  const isAuthor = currentUserId === comment.author.id;
  const isPostOwner = currentUserId === postAuthorId;
  const canDelete = isAuthor || isPostOwner;

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await onUpdate(comment.id, editContent);
      setIsEditing(false);
    } catch {
      // error handled in hook
    }
  };

  return (
    <div className="flex items-start gap-3 animate-fadeIn">
      <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${comment.author.username}`)}>
        <Avatar user={comment.author as any} size="sm" className="ring-2 ring-transparent hover:ring-primary/20 transition-all-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-card rounded-lg px-4 py-3 shadow-sm border border-border/30">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <p
              className="font-semibold text-sm text-foreground hover:text-primary transition-colors-300 cursor-pointer"
              onClick={() => navigate(`/profile/${comment.author.username}`)}
            >
              {comment.author.display_name}
            </p>
            {comment.author.role && ROLE_MAP[comment.author.role] && (
              <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', ROLE_MAP[comment.author.role].class)}>
                {ROLE_MAP[comment.author.role].label}
              </span>
            )}
            <VerificationBadge accountStatus={comment.author.account_status} />
          </div>

          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full p-3 text-sm border border-border rounded-lg bg-background text-foreground focus:border-primary focus:ring-primary/20 transition-all-300 resize-none"
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveEdit} className="text-xs px-4 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors-300">
                  Lưu
                </button>
                <button onClick={() => setIsEditing(false)} className="text-xs px-4 py-1.5 border border-border rounded-lg hover:bg-muted/50 transition-colors-300">
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <FormattedContent content={comment.content} className="text-sm text-foreground/90 leading-relaxed block" />
          )}

          {mediaUrls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {mediaUrls.map((url, i) => (
                <img key={i} src={url} className="w-24 h-24 object-cover rounded-lg hover:scale-[1.02] transition-transform duration-300 cursor-pointer" alt="Ảnh bình luận" />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2 ml-1">
          <span className="text-xs text-muted-foreground">
            {new Date(comment.created_at).toLocaleDateString('vi-VN')}
          </span>
          <button
            onClick={() => onLike(comment.id, comment.user_reaction ? null : 'LIKE')}
            className={cn(
              'text-xs flex items-center gap-1.5 transition-all-300',
              comment.user_reaction
                ? 'text-red-500 dark:text-red-400'
                : 'text-muted-foreground hover:text-red-500 dark:hover:text-red-400'
            )}
          >
            <Heart className={cn('w-4 h-4 transition-transform', comment.user_reaction ? 'fill-current scale-110' : '')} />
            {comment.stats.reactions > 0 && <span className="font-medium">{comment.stats.reactions}</span>}
          </button>
          <button
            onClick={() => onReply(comment.id, comment.author.display_name)}
            className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors-300"
          >
            <Reply className="w-4 h-4" />
            <span className="font-medium">Trả lời</span>
          </button>
          {isAuthor && (
            <button onClick={() => setIsEditing(true)} className="text-xs text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors-300">
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => { if (confirm('Xóa bình luận?')) onDelete(comment.id); }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors-300"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
