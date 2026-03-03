import { useState, useRef } from 'react';
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

export function CommentSection({ postId, currentUserId, postAuthorId }: CommentSectionProps) {
  const { organizedComments, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, addComment, deleteComment, reactToComment, updateComment, replyToComment } = useComments(postId);

  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToName, setReplyToName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleReply = (id: string, name: string) => {
    setReplyToId(id);
    setReplyToName(name);
    setContent('');
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const handleCancelReply = () => {
    setReplyToId(null);
    setReplyToName(null);
    setContent('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      if (replyToId) {
        await replyToComment(replyToId, content, files);
        setReplyToId(null);
        setReplyToName(null);
      } else {
        await addComment(content, files);
      }
      setContent('');
      setFiles([]);
    } catch {
      // toast is handled in hook
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

  if (isLoading && organizedComments.length === 0) {
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
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{organizedComments.reduce((n, c) => n + 1 + c.replies.length, 0)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <div>
            {replyToId && replyToName && (
              <div className="flex items-center gap-1.5 text-[11px] text-primary mb-1.5 animate-fadeIn bg-primary/5 rounded-md px-2 py-1">
                <Reply className="w-3 h-3" />
                <span>Đang trả lời</span>
                <span className="font-semibold">@{replyToName}</span>
                <button
                  type="button"
                  onClick={handleCancelReply}
                  className="ml-auto hover:text-destructive transition-colors"
                  aria-label="Hủy trả lời"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <Input ref={inputRef} value={content} onChange={e => setContent(e.target.value)} placeholder={replyToName ? `Viết phản hồi cho @${replyToName}...` : 'Viết bình luận...'} className="flex-1 h-10 border-border/50 focus:border-primary focus:ring-primary/20 transition-all-300" />
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
        <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
        <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="hover:bg-primary/10 transition-colors-300">
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
              onReply={handleReply}
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
                {comment.replies.map((reply: FeedComment) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    currentUserId={currentUserId}
                    postAuthorId={postAuthorId}
                    onReply={handleReply}
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
