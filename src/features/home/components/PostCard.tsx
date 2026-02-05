import { Avatar } from "@/features/shared/components/Avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Edit,
} from "lucide-react";
import type { Post as PostType } from "../types/feed.types";
import { useState } from "react";
import { CommentSection } from "./CommentSection";
import { SharedPostCard } from "./SharedPostCard";
import { useMediaBlobs } from "../hooks/useMedia";
import { cn } from "@/lib/utils";

interface PostProps {
  post: PostType;
  onLike: (postId: string, liked: boolean) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  showComments?: boolean;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string, content: string) => void;
  currentUserId?: string;
}

export function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  showComments,
  onDelete,
  onEdit,
  currentUserId,
}: PostProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const createdAt = post.createdAt || new Date().toISOString();
  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: vi,
  });

  const content = post.content || "";
  const images = post.mediaUrls || [];
  const { data: blobUrls = [], isLoading: loadingImages } = useMediaBlobs(images);
  
  const likes = post.stats?.reactions ?? 0;
  const commentsCount = post.stats?.comments ?? 0;
  const shares = post.stats?.shares ?? 0;
  const likedByCurrentUser = !!post.userReaction;
  
  const isAuthor = currentUserId === post.author.id;
  const sharedPost = post.sharedPost;

  const handleDelete = () => {
    if (!onDelete) return;
    if (confirm("Bạn có chắc muốn xóa bài viết này?")) {
      onDelete(post.id);
    }
  };

  const handleEdit = () => {
    setEditContent(content);
    setIsEditing(true);
    setShowMenu(false);
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
            <div className="relative">
              <Avatar user={post.author} size="md" className="ring-2 ring-transparent hover:ring-primary/20 transition-all-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors-300 cursor-pointer">
                {post.author.displayName}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {timeAgo}
                {sharedPost && <span className="w-1 h-1 bg-muted-foreground/50 rounded-full"></span>}
                {sharedPost && <span className="text-primary">đã chia sẻ</span>}
              </p>
            </div>
          </div>
          {isAuthor && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
                className="hover:bg-muted/50 transition-colors-300"
              >
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border z-10 animate-scaleIn">
                  <button
                    onClick={handleEdit}
                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 flex items-center gap-2 transition-colors-300 first:rounded-t-lg"
                  >
                    <Edit className="w-4 h-4" />
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors-300 last:rounded-b-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mb-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:ring-primary/20 transition-all-300 resize-none"
              rows={3}
              placeholder="Nhập nội dung bài viết..."
            />
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors-300"
              >
                Lưu
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="hover:bg-muted/50 transition-colors-300"
              >
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-foreground/90 leading-relaxed mb-4 whitespace-pre-wrap text-sm">
              {content}
            </p>
            {sharedPost && <SharedPostCard post={sharedPost} />}
          </>
        )}

        {!sharedPost && images.length > 0 && (
          <div className="mb-4 grid gap-2">
            {loadingImages ? (
              <div className="w-full h-64 bg-muted/30 rounded-xl flex items-center justify-center animate-pulse">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/30 border-t-primary"></div>
              </div>
            ) : blobUrls.length === 1 ? (
              <img
                src={blobUrls[0]}
                alt="Post image"
                className="w-full rounded-xl max-h-[500px] object-cover hover:scale-[1.01] transition-transform duration-300"
              />
            ) : blobUrls.length > 1 ? (
              <div
                className="grid grid-cols-2 gap-2"
              >
                {blobUrls.map((blobUrl, index) => (
                  <img
                    key={index}
                    src={blobUrl}
                    alt={`Post image ${index + 1}`}
                    className={`rounded-xl hover:scale-[1.01] transition-transform duration-300 ${index === 0 && blobUrls.length > 1 ? "row-span-2 h-[452px]" : "h-56"} object-cover w-full`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post.id, !likedByCurrentUser)}
              className={cn(
                "rounded-full px-3 transition-all-300 hover:bg-red-50 dark:hover:bg-red-950/30",
                likedByCurrentUser
                  ? "text-red-500 dark:text-red-400"
                  : "text-muted-foreground hover:text-red-500 dark:hover:text-red-400"
              )}
            >
              <Heart
                className={cn("w-4.5 h-4.5 transition-transform", likedByCurrentUser ? "fill-current scale-110" : "")}
              />
              {likes > 0 && <span className="ml-1.5 text-xs font-medium">{likes}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment(post.id)}
              className={cn(
                "rounded-full px-3 transition-all-300 hover:bg-blue-50 dark:hover:bg-blue-950/30",
                "text-muted-foreground hover:text-blue-500 dark:hover:text-blue-400"
              )}
            >
              <MessageCircle className="w-4.5 h-4.5" />
              {commentsCount > 0 && <span className="ml-1.5 text-xs font-medium">{commentsCount}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(post.id)}
              className={cn(
                "rounded-full px-3 transition-all-300 hover:bg-green-50 dark:hover:bg-green-950/30",
                "text-muted-foreground hover:text-green-500 dark:hover:text-green-400"
              )}
            >
              <Share2 className="w-4.5 h-4.5" />
              {shares > 0 && <span className="ml-1.5 text-xs font-medium">{shares}</span>}
            </Button>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="border-t border-border/50">
          <CommentSection
            postId={post.id}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </article>
  );
}
