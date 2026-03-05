import { useState, useRef, useMemo, useCallback, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/features/shared/components/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, Image as ImageIcon, X, Heart, Reply, Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { useComments } from '../hooks/useComments';
import { useMediaBlobs } from '../hooks/useMedia';
import { FormattedContent } from '@/features/shared/components/FormattedContent';
import type { FeedComment, ReactionType } from '../types/feed.types';
import { cn } from '@/lib/utils';
import { postsApi } from '@/lib/api/services';

// ────────────────────────────────────────────────────────────
// Context: lets nested CommentItems register a "refresh replies"
// callback so CommentSection can trigger it after a reply submit
// ────────────────────────────────────────────────────────────
interface RefreshCtxType {
  register: (id: string, fn: () => Promise<void>) => void;
  unregister: (id: string) => void;
  trigger: (id: string) => Promise<void>;
}
const CommentRefreshCtx = createContext<RefreshCtxType>({
  register: () => {},
  unregister: () => {},
  trigger: async () => {},
});

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
  const { comments, totalCount, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, addComment, deleteComment, reactToComment, updateComment, replyToComment } = useComments(postId);

  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Refresh context: CommentItems register their "re-fetch replies" fns here
  const refreshMap = useRef<Map<string, () => Promise<void>>>(new Map());
  const register = useCallback((id: string, fn: () => Promise<void>) => {
    refreshMap.current.set(id, fn);
  }, []);
  const unregister = useCallback((id: string) => {
    refreshMap.current.delete(id);
  }, []);
  const trigger = useCallback(async (id: string) => {
    await refreshMap.current.get(id)?.();
  }, []);
  const ctxValue = useMemo(() => ({ register, unregister, trigger }), [register, unregister, trigger]);

  // Only top-level comments
  const topLevelComments = useMemo(() => comments.filter(c => !c.parentCommentId), [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      if (replyToId) {
        await replyToComment(replyToId, content, files);
        // Tell that CommentItem to refresh its replies list
        await ctxValue.trigger(replyToId);
        setReplyToId(null);
      } else {
        await addComment(content, files);
      }
      setContent('');
      setFiles([]);
      if (inputRef.current) inputRef.current.value = '';
    } catch {
      // errors handled inside hook
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
    <CommentRefreshCtx.Provider value={ctxValue}>
      <div className="bg-muted/30 rounded-xl p-5 mt-4 animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
            <h4 className="font-semibold text-foreground">Bình luận</h4>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{totalCount || comments.length}</span>
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
                    <img src={URL.createObjectURL(file)} alt="Xem trước" className="w-full h-full object-cover rounded-lg shadow-sm group-hover:shadow-md transition-all-300" />
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
          {topLevelComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              postAuthorId={postAuthorId}
              onReply={(id, name) => {
                setReplyToId(id);
                setContent(`@${name} `);
                inputRef.current?.focus();
              }}
              onDelete={deleteComment}
              onUpdate={async (id, formData) => {
                await updateComment(id, formData);
              }}
              onLike={async (id, reaction) => {
                await reactToComment(id, reaction);
              }}
            />
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
    </CommentRefreshCtx.Provider>
  );
}

interface CommentItemProps {
  comment: FeedComment;
  currentUserId?: string;
  postAuthorId?: string;
  onReply: (id: string, name: string) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, formData: FormData) => Promise<void>;
  onLike: (id: string, reaction: ReactionType | null) => Promise<void>;
  depth?: number;
}

/**
 * Self-contained comment item:
 * - Local reaction state → heart turns red immediately on click
 * - Local replies state → lazy-fetched, supports infinite nesting
 * - Registers its "refresh replies" fn in CommentRefreshCtx so
 *   CommentSection can call it after a reply is submitted
 */
function CommentItem({ comment, currentUserId, postAuthorId, onReply, onDelete, onUpdate, onLike, depth = 0 }: CommentItemProps) {
  const navigate = useNavigate();
  const { register, unregister } = useContext(CommentRefreshCtx);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  // displayContent is the source-of-truth for what's rendered — updated locally on save
  const [displayContent, setDisplayContent] = useState(comment.content);
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [keepMediaItems, setKeepMediaItems] = useState<{ id: string; url: string; mime_type?: string }[]>(comment.mediaFiles ?? []);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  // Guard: prevents useEffect from overwriting displayContent mid-save
  const isSavingRef = useRef(false);
  const { data: mediaUrls = [] } = useMediaBlobs(comment.mediaUrls || []);

  // Sync keepMediaItems when comment prop refreshes (e.g. after React Query invalidation)
  useEffect(() => {
    if (!isEditing) {
      setKeepMediaItems(comment.mediaFiles ?? []);
    }
  }, [comment.mediaFiles, isEditing]);

  // Sync displayContent when comment prop refreshes outside of edit mode
  // Guard: skip if we just saved (isSavingRef) to avoid race with optimistic update
  useEffect(() => {
    if (!isEditing && !isSavingRef.current) {
      setDisplayContent(comment.content);
    }
  }, [comment.content, isEditing]);

  // Local reaction state — immediate optimistic feedback
  const [userReaction, setUserReaction] = useState<ReactionType | null>(comment.userReaction ?? null);
  const [reactionCount, setReactionCount] = useState(comment.stats.reactions);

  // Local replies state — supports infinite depth
  const [isExpanded, setIsExpanded] = useState(false);
  const [replies, setReplies] = useState<FeedComment[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [replyCount, setReplyCount] = useState(comment.stats.replies ?? 0);

  const isAuthor = !!currentUserId && String(currentUserId) === String(comment.author?.id ?? '');
  const canDelete = isAuthor;

  // Fetch (or refresh) replies from the API
  const doFetchReplies = useCallback(async () => {
    setIsLoadingReplies(true);
    try {
      const data = await postsApi.getCommentReplies(comment.id);
      setReplies(data.replies as unknown as FeedComment[]);
      setReplyCount(data.total);
      setIsExpanded(true);
    } catch (e) {
      console.error('Failed to fetch replies', e);
    } finally {
      setIsLoadingReplies(false);
    }
  }, [comment.id]);

  // Register so CommentSection can trigger refresh after a reply is submitted
  useEffect(() => {
    register(comment.id, doFetchReplies);
    return () => unregister(comment.id);
  }, [comment.id, register, unregister, doFetchReplies]);

  const toggleReplies = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else if (replies.length > 0) {
      // Use cached replies — no extra fetch needed
      setIsExpanded(true);
    } else {
      doFetchReplies();
    }
  };

  // Optimistic like — updates locally, reverts on error
  const handleLike = async () => {
    const newReaction: ReactionType | null = userReaction ? null : 'LIKE';
    const prevReaction = userReaction;
    const prevCount = reactionCount;
    setUserReaction(newReaction);
    setReactionCount(c => (newReaction ? c + 1 : Math.max(0, c - 1)));
    try {
      await onLike(comment.id, newReaction);
    } catch {
      setUserReaction(prevReaction);
      setReactionCount(prevCount);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() && editFiles.length === 0 && keepMediaItems.length === 0) return;
    const savedContent = editContent;
    // Close edit mode optimistically so UI feels instant
    isSavingRef.current = true;
    setDisplayContent(savedContent);
    setIsEditing(false);
    setEditFiles([]);
    try {
      const formData = new FormData();
      formData.append('content_text', savedContent);
      formData.append('keep_media_urls', JSON.stringify(keepMediaItems.map(m => m.url)));
      editFiles.forEach(f => formData.append('files', f));
      await onUpdate(comment.id, formData);
    } catch {
      // error handled upstream — restore edit mode
      setIsEditing(true);
    } finally {
      isSavingRef.current = false;
    }
  };

  return (
    <div className="flex items-start gap-3 animate-fadeIn">
      <div className="relative cursor-pointer flex-shrink-0" onClick={() => navigate(`/profile/${comment.author.username}`)}>
        <Avatar user={comment.author as any} size="sm" className="ring-2 ring-transparent hover:ring-primary/20 transition-all-300" />
      </div>
      <div className="flex-1 min-w-0">
        {/* Comment bubble */}
        <div className="bg-card rounded-lg px-4 py-3 shadow-sm border border-border/30">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <p className="font-semibold text-sm text-foreground hover:text-primary transition-colors-300 cursor-pointer" onClick={() => navigate(`/profile/${comment.author.username}`)}>
              {comment.author.displayName}
            </p>
            {comment.author.role && ROLE_MAP[comment.author.role] && <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', ROLE_MAP[comment.author.role].class)}>{ROLE_MAP[comment.author.role].label}</span>}
            {comment.author.accountStatus === 'VERIFIED' && (
              <span className={cn('text-[10px] font-bold', STATUS_MAP.VERIFIED.class)} title="Đã xác minh">
                {STATUS_MAP.VERIFIED.label}
              </span>
            )}
          </div>
          {isEditing ? (
            <div className="mt-2">
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full p-3 text-sm border border-border rounded-lg bg-background text-foreground focus:border-primary focus:ring-primary/20 transition-all-300 resize-none" rows={2} />
              {/* Existing media — click X to remove from keep list */}
              {keepMediaItems.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {keepMediaItems.map((m, i) => (
                    <div key={m.url || i} className="relative group flex-shrink-0">
                      <img src={m.url} className="w-16 h-16 object-cover rounded-lg" alt="media" />
                      <button type="button" onClick={() => setKeepMediaItems(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* New files preview */}
              {editFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editFiles.map((f, i) => (
                    <div key={i} className="relative group">
                      <img src={URL.createObjectURL(f)} className="w-16 h-16 object-cover rounded-lg" alt="new media" />
                      <button type="button" onClick={() => setEditFiles(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={editFileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files) setEditFiles(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 5));
                }}
              />
              <div className="flex gap-2 mt-2 items-center">
                <button type="button" onClick={() => editFileInputRef.current?.click()} className="text-xs text-muted-foreground hover:text-primary transition-colors-300 p-1.5 rounded-lg border border-border hover:border-primary">
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button onClick={handleSaveEdit} className="text-xs px-4 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors-300">
                  Lưu
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditFiles([]);
                    setKeepMediaItems(comment.mediaFiles ?? []);
                  }}
                  className="text-xs px-4 py-1.5 border border-border rounded-lg hover:bg-muted/50 transition-colors-300"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <FormattedContent content={displayContent} className="text-sm text-foreground/90 leading-relaxed block" />
          )}
          {mediaUrls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {mediaUrls.map((url, i) => (
                <img key={i} src={url} className="w-24 h-24 object-cover rounded-lg hover:scale-[1.02] transition-transform duration-300 cursor-pointer" alt="Ảnh bình luận" />
              ))}
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-4 mt-2 ml-1">
          <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>

          {/* Like — local state so heart turns red immediately */}
          <button onClick={handleLike} className={cn('text-xs flex items-center gap-1.5 transition-all-300', userReaction ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground hover:text-red-500 dark:hover:text-red-400')}>
            <Heart className={cn('w-4 h-4 transition-transform', userReaction ? 'fill-current scale-110' : '')} />
            {reactionCount > 0 && <span className="font-medium">{reactionCount}</span>}
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

        {/* Toggle replies (shown when this comment has replies) */}
        {replyCount > 0 && (
          <div className="mt-1.5 ml-1">
            <button onClick={toggleReplies} className="flex items-center gap-1 text-xs text-primary hover:underline transition-colors-300">
              {isLoadingReplies ? <span className="animate-spin rounded-full h-3 w-3 border border-primary/40 border-t-primary inline-block" /> : isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {isExpanded ? 'Ẩn trả lời' : `Xem ${replyCount} trả lời`}
            </button>
          </div>
        )}

        {/* Replies — recursively rendered, supports any depth */}
        {isExpanded && replies.length > 0 && (
          <div className="mt-3 space-y-4 border-l-2 border-muted/50 pl-4">
            {replies.map((reply: FeedComment) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                postAuthorId={postAuthorId}
                onReply={onReply}
                onDelete={async id => {
                  await onDelete(id);
                  // Remove from local replies state immediately
                  setReplies(prev => prev.filter(r => r.id !== id));
                  setReplyCount(c => Math.max(0, c - 1));
                }}
                onUpdate={async (id, formData) => {
                  await onUpdate(id, formData);
                  // Re-fetch replies from server so updated content + media are correct
                  await doFetchReplies();
                }}
                onLike={onLike}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
