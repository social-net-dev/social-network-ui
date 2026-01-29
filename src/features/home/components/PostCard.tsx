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
import type { Post as PostType, Comment } from "../types/feed.types";
import { feedApi } from "../services/feedApi";
import { useState, useEffect } from "react";
import { CommentSection } from "./CommentSection";
import { SharedPostCard } from "./SharedPostCard";

interface PostProps {
  post: PostType;
  onLike: (postId: string, liked: boolean) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  showComments?: boolean;
  comments?: Comment[];
  loadingComments?: boolean;
  onAddComment?: (content: string, files?: File[]) => void;
  onDeleteComment?: (commentId: string) => void;
  onRefreshComments?: () => void;
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
  comments = [],
  loadingComments = false,
  onAddComment,
  onDeleteComment,
  onRefreshComments,
  onDelete,
  onEdit,
  currentUserId,
}: PostProps) {
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const createdAt =
    post.createdAt ?? post.created_at ?? new Date().toISOString();
  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: vi,
  });

  const content = post.content ?? post.content_text ?? "";
  const images = post.images ?? post.media_urls ?? post.media_paths ?? [];
  const likes = post.likes ?? post.reaction_count ?? 0;
  const commentsCount = post.comments ?? post.comment_count ?? 0;
  const shares = post.shares ?? post.share_count ?? 0;
  const likedByCurrentUser = !!post.likedByCurrentUser || !!post.user_reaction;
  const isAuthor =
    currentUserId === (post.author_id || (post.author as any)?.id);
  const sharedPost = post.shared_post;

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

  // Fetch images with auth headers and convert to blob URLs
  useEffect(() => {
    if (images.length === 0) {
      setLoadingImages(false);
      return;
    }

    const fetchImages = async () => {
      setLoadingImages(true);
      const urls = await Promise.all(
        images.map((url) => feedApi.fetchMediaAsBlob(url)),
      );
      setBlobUrls(urls.filter((u) => u !== ""));
      setLoadingImages(false);
    };

    fetchImages();

    // Cleanup blob URLs when component unmounts
    return () => {
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [post.id, images.length]);

  return (
    <article className="bg-white dark:bg-[#0A2737] rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {(() => {
              const a = post.author as any;
              const display = a?.display_name || "";
              const [first = "", last = ""] = display
                ? display.split(" ")
                : [a?.firstName || "", a?.lastName || ""];
              const userForAvatar = {
                id: a?.id || "",
                firstName: a?.firstName ?? first ?? "",
                lastName: a?.lastName ?? last ?? "",
                email: a?.email ?? "",
                avatar: a?.avatar ?? a?.avatar_path ?? null,
              };
              return <Avatar user={userForAvatar} size="md" />;
            })()}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {post.author.displayName ||
                  `${post.author.firstName || ""} ${post.author.lastName || ""}`}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {timeAgo}
              </p>
            </div>
          </div>
          {isAuthor && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0A2737] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <button
                    onClick={handleEdit}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
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
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0a1f29] text-gray-900 dark:text-white"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                className="bg-[#1b7a78] hover:bg-teal-700"
              >
                Lưu
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
              {content}
            </p>
            {sharedPost && <SharedPostCard post={sharedPost} />}
          </>
        )}

        {!sharedPost && images.length > 0 && (
          <div className="mb-4 grid gap-2">
            {loadingImages ? (
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1b7a78]"></div>
              </div>
            ) : blobUrls.length === 1 ? (
              <img
                src={blobUrls[0]}
                alt="Post image"
                className="w-full rounded-xl max-h-96 object-cover"
              />
            ) : blobUrls.length > 1 ? (
              <div
                className={`grid ${blobUrls.length === 2 ? "grid-cols-2" : "grid-cols-2"} gap-2`}
              >
                {blobUrls.map((blobUrl, index) => (
                  <img
                    key={index}
                    src={blobUrl}
                    alt={`Post image ${index + 1}`}
                    className={`rounded-xl ${index === 0 && blobUrls.length > 1 ? "row-span-2" : ""} object-cover h-48`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post.id, !likedByCurrentUser)}
              className={
                likedByCurrentUser
                  ? "text-red-500"
                  : "text-gray-500 dark:text-gray-400"
              }
            >
              <Heart
                className={`w-5 h-5 mr-1 ${likedByCurrentUser ? "fill-current" : ""}`}
              />
              {likes}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment(post.id)}
              className="text-gray-500 dark:text-gray-400"
            >
              <MessageCircle className="w-5 h-5 mr-1" />
              {commentsCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(post.id)}
              className="text-gray-500 dark:text-gray-400"
            >
              <Share2 className="w-5 h-5 mr-1" />
              {shares}
            </Button>
          </div>
        </div>
      </div>

      {showComments && onAddComment && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <CommentSection
            postId={post.id}
            comments={comments}
            isLoading={loadingComments}
            onAddComment={onAddComment}
            onDeleteComment={onDeleteComment}
            currentUserId={currentUserId}
            onRefresh={onRefreshComments}
          />
        </div>
      )}
    </article>
  );
}
