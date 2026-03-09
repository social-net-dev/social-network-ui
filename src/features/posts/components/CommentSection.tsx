import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, Image as ImageIcon, X, Reply } from 'lucide-react';
import { useComments } from '../hooks/useComments';
import { CommentItem } from './CommentItem';
import type { FeedComment } from '../types/feed.types';

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  postAuthorId?: string;
}

interface InlineReplyInputProps {
  replyToName: string;
  onSubmit: (content: string, files: File[]) => Promise<void>;
  onCancel: () => void;
}

function InlineReplyInput({ replyToName, onSubmit, onCancel }: InlineReplyInputProps) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleMount = useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el;
    if (el) {
      setTimeout(() => {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await onSubmit(content, files);
      setContent('');
      setFiles([]);
    } catch {
      // error handled in hook
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files;
    if (!chosen) return;
    setFiles(prev => [...prev, ...Array.from(chosen)].slice(0, 4));
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 ml-10 animate-fadeIn">
      <div className="flex items-center gap-1.5 text-[11px] text-primary mb-1.5 bg-primary/5 rounded-md px-2 py-1">
        <Reply className="w-3 h-3 shrink-0" />
        <span>Đang trả lời</span>
        <span className="font-semibold">@{replyToName}</span>
        <button
          type="button"
          onClick={onCancel}
          className="ml-auto hover:text-destructive transition-colors"
          aria-label="Hủy trả lời"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Input
          ref={handleMount}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`Viết phản hồi cho @${replyToName}...`}
          className="h-9 text-sm border-border/50 focus:border-primary focus:ring-primary/20 transition-all-300"
          onKeyDown={e => { if (e.key === 'Escape') onCancel(); }}
        />
        <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 hover:bg-primary/10 transition-colors-300"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim()}
          className="h-9 w-9 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 transition-all-300"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={index} className="relative w-14 h-14 group">
              <img src={URL.createObjectURL(file)} alt="Xem trước" className="w-full h-full object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                className="absolute -top-1.5 -right-1.5 p-0.5 bg-destructive rounded-full text-white hover:bg-destructive/90"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}

export function CommentSection({ postId, currentUserId, postAuthorId }: CommentSectionProps) {
  const { organizedComments, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, addComment, deleteComment, reactToComment, updateComment, replyToComment } = useComments(postId);

  // New top-level comment form state
  const [newContent, setNewContent] = useState('');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const newFileInputRef = useRef<HTMLInputElement | null>(null);

  // Which comment is being replied to
  const [replyTarget, setReplyTarget] = useState<{ commentId: string; name: string } | null>(null);

  const handleCancelReply = useCallback(() => {
    setReplyTarget(null);
  }, []);

  const handleNewCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    try {
      await addComment(newContent, newFiles);
      setNewContent('');
      setNewFiles([]);
    } catch {
      // toast handled in hook
    }
  };

  const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files;
    if (!chosen) return;
    setNewFiles(prev => [...prev, ...Array.from(chosen)].slice(0, 4));
  };

  if (isLoading && organizedComments.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-xl p-5 mt-4 animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-muted-foreground" />
        <h4 className="font-semibold text-foreground">Bình luận</h4>
        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          {organizedComments.reduce((n, c) => n + 1 + c.replies.length, 0)}
        </span>
      </div>

      {/* New top-level comment input */}
      <form onSubmit={handleNewCommentSubmit} className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <Input
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Viết bình luận..."
            className="h-10 border-border/50 focus:border-primary focus:ring-primary/20 transition-all-300"
          />
          {newFiles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {newFiles.map((file, index) => (
                <div key={index} className="relative w-16 h-16 group">
                  <img src={URL.createObjectURL(file)} alt="Xem trước" className="w-full h-full object-cover rounded-lg shadow-sm" />
                  <button
                    type="button"
                    onClick={() => setNewFiles(prev => prev.filter((_, i) => i !== index))}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-destructive rounded-full text-white hover:bg-destructive/90 shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <input ref={newFileInputRef} type="file" multiple accept="image/*" onChange={handleNewFileChange} className="hidden" />
        <Button type="button" variant="ghost" size="icon" onClick={() => newFileInputRef.current?.click()} className="hover:bg-primary/10 transition-colors-300">
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button type="submit" disabled={!newContent.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all-300 hover-lift">
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {/* Comment list with inline reply inputs */}
      <div className="space-y-6">
        {organizedComments.map(comment => {
          // Determine if the active reply target belongs to this comment's thread
          const isReplyingInThisThread = replyTarget !== null && (
            replyTarget.commentId === comment.id ||
            comment.replies.some(r => r.id === replyTarget.commentId)
          );

          return (
            <div key={comment.id} className="space-y-3">
              <CommentItem
                comment={comment}
                currentUserId={currentUserId}
                postAuthorId={postAuthorId}
                onReply={(id, name) => setReplyTarget({ commentId: id, name })}
                onDelete={deleteComment}
                onUpdate={async (id, content) => { await updateComment(id, content); }}
                onLike={async (id, reaction) => { await reactToComment(id, reaction); }}
              />

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="ml-10 space-y-3 border-l-2 border-muted/50 pl-4">
                  {comment.replies.map((reply: FeedComment) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      postAuthorId={postAuthorId}
                      onReply={(id, name) => setReplyTarget({ commentId: id, name })}
                      onDelete={deleteComment}
                      onUpdate={async (id, content) => { await updateComment(id, content); }}
                      onLike={async (id, reaction) => { await reactToComment(id, reaction); }}
                    />
                  ))}
                </div>
              )}

              {/* Inline reply input — appears right below this thread when replying */}
              {isReplyingInThisThread && replyTarget && (
                <InlineReplyInput
                  replyToName={replyTarget.name}
                  onCancel={handleCancelReply}
                  onSubmit={async (content, files) => {
                    await replyToComment(replyTarget.commentId, content, files);
                    setReplyTarget(null);
                  }}
                />
              )}
            </div>
          );
        })}
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
