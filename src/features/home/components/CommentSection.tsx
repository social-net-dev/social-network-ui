import { useState, useRef, useMemo } from 'react';
import { Avatar } from '@/features/shared/components/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, Image as ImageIcon, X, Heart, Reply, Trash2, Edit } from 'lucide-react';
import { useComments } from '../hooks/useComments';
import { useMediaBlobs } from '../hooks/useMedia';
import { FormattedContent } from '@/features/shared/components/FormattedContent';
import { getErrorMessage } from '@/lib/api/transforms';
import type { FeedComment, ReactionType } from '../types/feed.types';
import { cn } from '@/lib/utils';

const ROLE_MAP: Record<string, { label: string; class: string }> = {
  STUDENT: { label: 'Người học', class: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  INSTRUCTOR: { label: 'Người dạy', class: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
};

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  VERIFIED: { label: '✓', class: 'text-green-600 dark:text-green-400' },
  UNVERIFIED: { label: '', class: '' },
};

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  postAuthorId?: string;
}

export function CommentSection({ postId, currentUserId, postAuthorId }: CommentSectionProps) {
  const { comments, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, addComment, deleteComment, reactToComment, updateComment, replyToComment } = useComments(postId);

  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const organizedComments = useMemo(() => {
    const topLevel = comments.filter(c => !c.parentCommentId);
    const replies = comments.filter(c => !!c.parentCommentId);

    // Group replies: map each reply to its top-level parent
    // (handles replying to a reply — still shows under the original top-level comment)
    const topLevelIds = new Set(topLevel.map(c => c.id));
    const replyMap = new Map<string, FeedComment[]>();

    for (const reply of replies) {
      // Find the top-level ancestor
      let parentId = reply.parentCommentId!;
      // If parentId is not a top-level comment, it's a reply-to-reply
      // Walk up to find the top-level parent
      const visited = new Set<string>();
      while (parentId && !topLevelIds.has(parentId) && !visited.has(parentId)) {
        visited.add(parentId);
        const parentReply = replies.find(r => r.id === parentId);
        if (parentReply?.parentCommentId) {
          parentId = parentReply.parentCommentId;
        } else {
          break;
        }
      }
      const arr = replyMap.get(parentId) || [];
      arr.push(reply);
      replyMap.set(parentId, arr);
    }

    return topLevel.map(comment => ({
      ...comment,
      replies: replyMap.get(comment.id) || [],
    }));
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      if (replyToId) {
        await replyToComment(replyToId, content, files);
        setReplyToId(null);
      } else {
        await addComment(content, files);
      }
      setContent('');
      setFiles([]);
      if (inputRef.current) inputRef.current.value = '';
    } catch {
      // toast is already handled in hook, but we can keep alert as fallback if needed
      // Actually we should use toast here too if we want, but let's stick to toast in hook
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files;
    if (!chosen) return;
    setFiles(prev => [...prev, ...Array.from(chosen)].slice(0, 4));
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-xl p-5 mt-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-muted-foreground" />
          <h4 className="font-semibold text-foreground">Bình luận</h4>
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{comments.length}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <div className="relative">
            {replyToId && (
              <div className="absolute -top-6 left-0 flex items-center gap-1 text-[10px] text-primary animate-fadeIn">
                <span>Đang trả lời...</span>
                <button
                  onClick={() => {
                    setReplyToId(null);
                    setContent('');
                  }}
                  className="hover:underline font-bold text-destructive"
                >
                  Hủy
                </button>
              </div>
            )}
            <Input value={content} onChange={e => setContent(e.target.value)} placeholder={replyToId ? 'Viết phản hồi...' : 'Viết bình luận...'} className="flex-1 h-10 border-border/50 focus:border-primary focus:ring-primary/20 transition-all-300" />
          </div>
          {files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 animate-fadeInUp">
              {files.map((file, index) => (
                <div key={index} className="relative w-16 h-16 group">
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover rounded-lg shadow-sm group-hover:shadow-md transition-all-300" />
                  <button onClick={() => handleRemoveFile(index)} className="absolute -top-1.5 -right-1.5 p-1 bg-destructive rounded-full text-white hover:bg-destructive/90 shadow-lg transition-all-300 hover:scale-110">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
        <Button type="button" variant="ghost" size="icon" onClick={() => inputRef.current?.click()} className="hover:bg-primary/10 transition-colors-300">
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button type="submit" disabled={!content.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all-300 hover-lift">
          <Send className="w-4 h-4" />
        </Button>
      </form>

      <div className="space-y-6">
        {organizedComments.map(comment => (
          <div key={comment.id} className="space-y-4">
            <CommentItem
              comment={comment}
              currentUserId={currentUserId}
              postAuthorId={postAuthorId}
              onReply={(id: string, name: string) => {
                setReplyToId(id);
                setContent(`@${name} `);
                inputRef.current?.focus();
              }}
              onDelete={deleteComment}
              onUpdate={async (id, content) => {
                await updateComment(id, content);
              }}
              onLike={async (id, reaction) => {
                await reactToComment(id, reaction);
              }}
            />
            {comment.replies.length > 0 && (
              <div className="ml-10 space-y-4 border-l-2 border-muted/50 pl-4">
                {comment.replies.map(reply => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    currentUserId={currentUserId}
                    postAuthorId={postAuthorId}
                    onReply={(id, name) => {
                      setReplyToId(id);
                      setContent(`@${name} `);
                      inputRef.current?.focus();
                    }}
                    onDelete={deleteComment}
                    onUpdate={async (id, content) => {
                      await updateComment(id, content);
                    }}
                    onLike={async (id, reaction) => {
                      await reactToComment(id, reaction);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="text-xs text-muted-foreground hover:text-primary">
            {isFetchingNextPage ? 'Đang tải...' : 'Xem thêm bình luận'}
          </Button>
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: FeedComment;
  currentUserId?: string;
  postAuthorId?: string;
  onReply: (id: string, name: string) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, content: string) => Promise<void>;
  onLike: (id: string, reaction: ReactionType | null) => Promise<void>;
}

function CommentItem({ comment, currentUserId, postAuthorId, onReply, onDelete, onUpdate, onLike }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const { data: mediaUrls = [] } = useMediaBlobs(comment.mediaUrls || []);
  const isAuthor = currentUserId === comment.author.id;
  const isPostOwner = currentUserId === postAuthorId;
  const canDelete = isAuthor || isPostOwner;

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await onUpdate(comment.id, editContent);
      setIsEditing(false);
    } catch (error) {
      alert(getErrorMessage(error));
    }
  };

  return (
    <div className="flex items-start gap-3 animate-fadeIn">
      <div className="relative">
        <Avatar user={comment.author} size="sm" className="ring-2 ring-transparent hover:ring-primary/20 transition-all-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-card rounded-lg px-4 py-3 shadow-sm border border-border/30">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <p className="font-semibold text-sm text-foreground">{comment.author.displayName}</p>
            {comment.author.role && ROLE_MAP[comment.author.role] && (
              <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', ROLE_MAP[comment.author.role].class)}>
                {ROLE_MAP[comment.author.role].label}
              </span>
            )}
            {comment.author.accountStatus === 'VERIFIED' && (
              <span className={cn('text-[10px] font-bold', STATUS_MAP.VERIFIED.class)} title="Đã xác minh">
                {STATUS_MAP.VERIFIED.label}
              </span>
            )}
          </div>
          {isEditing ? (
            <div className="mt-2">
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full p-3 text-sm border border-border rounded-lg bg-background text-foreground focus:border-primary focus:ring-primary/20 transition-all-300 resize-none" rows={2} />
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
                <img key={i} src={url} className="w-24 h-24 object-cover rounded-lg hover:scale-[1.02] transition-transform duration-300 cursor-pointer" alt="media" />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 ml-1">
          <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
          <button onClick={() => onLike(comment.id, comment.userReaction ? null : 'LIKE')} className={cn('text-xs flex items-center gap-1.5 transition-all-300', comment.userReaction ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground hover:text-red-500 dark:hover:text-red-400')}>
            <Heart className={cn('w-4 h-4 transition-transform', comment.userReaction ? 'fill-current scale-110' : '')} />
            {comment.stats.reactions > 0 && <span className="font-medium">{comment.stats.reactions}</span>}
          </button>
          <button onClick={() => onReply(comment.id, comment.author.displayName)} className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors-300">
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
                onClick={() => {
                  if (confirm('Xóa bình luận?')) onDelete(comment.id);
                }}
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
