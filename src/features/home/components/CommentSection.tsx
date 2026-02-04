import { useState, useRef } from "react";
import { Avatar } from "@/features/shared/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  MessageCircle,
  Image as ImageIcon,
  X,
  Heart,
  Reply,
  Trash2,
  Edit,
} from "lucide-react";
import { useComments } from "../hooks/useComments";
import { useMediaBlobs } from "../hooks/useMedia";
import { getErrorMessage } from "@/lib/api/transforms";
import type { FeedComment } from "../types/feed.types";

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
}

export function CommentSection({
  postId,
  currentUserId,
}: CommentSectionProps) {
  const { 
    comments, 
    isLoading, 
    addComment, 
    deleteComment, 
    reactToComment, 
    updateComment, 
    replyToComment 
  } = useComments(postId);

  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
      setContent("");
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      alert(getErrorMessage(error));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files;
    if (!chosen) return;
    setFiles((prev) => [...prev, ...Array.from(chosen)].slice(0, 4));
  };

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1b7a78]"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-[#0a1f29] rounded-xl p-4 mt-4">
      <div className="flex items-center mb-4">
        <MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
        <h4 className="font-semibold text-gray-900 dark:text-white">Bình luận</h4>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyToId ? "Viết phản hồi..." : "Viết bình luận..."}
            className="flex-1"
          />
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div key={index} className="relative w-16 h-16">
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover rounded" />
                  <button onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))} className="absolute -top-1 -right-1 bg-black/50 rounded-full p-0.5 text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
        <Button type="button" variant="ghost" size="icon" onClick={() => inputRef.current?.click()}>
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button type="submit" disabled={!content.trim()} className="bg-[#1b7a78] hover:bg-teal-700">
          <Send className="w-4 h-4" />
        </Button>
      </form>

      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            currentUserId={currentUserId}
            onReply={(id: string, name: string) => {
              setReplyToId(id);
              setContent(`@${name} `);
              inputRef.current?.focus();
            }}
            onDelete={deleteComment}
            onUpdate={async (id, content) => { await updateComment(id, content); }}
            onLike={async (id, reaction) => { await reactToComment(id, reaction); }}
          />
        ))}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: FeedComment;
  currentUserId?: string;
  onReply: (id: string, name: string) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, content: string) => Promise<void>;
  onLike: (id: string, reaction: string | null) => Promise<void>;
}

function CommentItem({ comment, currentUserId, onReply, onDelete, onUpdate, onLike }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const { data: mediaUrls = [] } = useMediaBlobs(comment.mediaUrls || []);
  const isAuthor = currentUserId === comment.author.id;

  return (
    <div className="flex items-start space-x-3">
      <Avatar user={comment.author} size="sm" />
      <div className="flex-1">
        <div className="bg-white dark:bg-[#0A2737] rounded-lg px-3 py-2">
          <p className="font-semibold text-sm">{comment.author.displayName}</p>
          {isEditing ? (
            <div className="mt-2">
              <textarea 
                value={editContent} 
                onChange={e => setEditContent(e.target.value)}
                className="w-full p-2 text-sm border rounded dark:bg-[#0a1f29]"
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={async () => {
                  await onUpdate(comment.id, editContent);
                  setIsEditing(false);
                }}>Lưu</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Hủy</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm">{comment.content}</p>
          )}
          {mediaUrls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {mediaUrls.map((url, i) => <img key={i} src={url} className="w-20 h-20 object-cover rounded" alt="media" />)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 ml-2 text-xs text-gray-500">
          <span>{new Date(comment.createdAt).toLocaleDateString("vi-VN")}</span>
          <button onClick={() => onLike(comment.id, comment.userReaction ? null : "LIKE")} className={`flex items-center gap-1 ${comment.userReaction ? 'text-red-500' : ''}`}>
            <Heart className={`w-3 h-3 ${comment.userReaction ? 'fill-current' : ''}`} />
            {comment.stats.reactions}
          </button>
          <button onClick={() => onReply(comment.id, comment.author.displayName)} className="flex items-center gap-1">
            <Reply className="w-3 h-3" />
            Phản hồi
          </button>
          {isAuthor && (
            <>
              <button onClick={() => setIsEditing(true)}><Edit className="w-3 h-3" /></button>
              <button onClick={() => onDelete(comment.id)}><Trash2 className="w-3 h-3" /></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
