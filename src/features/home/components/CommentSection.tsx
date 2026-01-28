import { useState, useRef, useEffect } from "react";
import { Avatar } from "@/features/shared/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  MessageCircle,
  Image,
  X,
  Heart,
  Reply,
  Trash2,
  Edit,
} from "lucide-react";
import type { Comment } from "../types/feed.types";
import { feedApi } from "../services/feedApi";

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  isLoading?: boolean;
  onAddComment: (content: string, files?: File[]) => void;
  onDeleteComment?: (commentId: string) => void;
  currentUserId?: string;
  onRefresh?: () => void;
}

export function CommentSection({
  postId,
  comments,
  isLoading = false,
  onAddComment,
  onDeleteComment,
  currentUserId,
  onRefresh,
}: CommentSectionProps) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [commentBlobUrls, setCommentBlobUrls] = useState<
    Record<string, string[]>
  >({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );
  const [replies, setReplies] = useState<Record<string, Comment[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync likedComments with backend user_reaction on mount/update
  useEffect(() => {
    const liked = new Set<string>();
    comments.forEach((c) => {
      if (c.user_reaction) liked.add(c.id);
    });
    Object.values(replies).forEach((replyList) => {
      replyList.forEach((r) => {
        if (r.user_reaction) liked.add(r.id);
      });
    });
    setLikedComments(liked);
  }, [comments, replies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      // If replying to a comment, use reply API
      if (replyToId) {
        try {
          const reply = await feedApi.replyToComment(
            postId,
            replyToId,
            content,
            files,
          );
          // Add reply to local state
          setReplies((prev) => ({
            ...prev,
            [replyToId]: [...(prev[replyToId] || []), reply],
          }));
          // Expand replies to show the new one
          setExpandedReplies((prev) => new Set(prev).add(replyToId));
        } catch (error) {
          console.error("Failed to reply to comment:", error);
          alert("Không thể trả lời bình luận. Vui lòng thử lại.");
        }
        setReplyToId(null);
      } else {
        // Regular comment
        onAddComment(content, files);
      }
      setContent("");
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files;
    if (!chosen) return;
    const arr = Array.from(chosen);
    setFiles((prev) => [...prev, ...arr].slice(0, 4));
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLikeComment = async (commentId: string) => {
    const wasLiked = likedComments.has(commentId);
    const reaction = wasLiked ? null : "LIKE";

    // Optimistic UI update
    setLikedComments((prev) => {
      const newSet = new Set(prev);
      if (wasLiked) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });

    try {
      await feedApi.reactToComment(postId, commentId, reaction);
    } catch (error) {
      console.error("Failed to react to comment:", error);
      // Revert on error
      setLikedComments((prev) => {
        const newSet = new Set(prev);
        if (wasLiked) {
          newSet.add(commentId);
        } else {
          newSet.delete(commentId);
        }
        return newSet;
      });
    }
  };

  const handleReply = (commentId: string, displayName: string) => {
    setReplyToId(commentId);
    setContent(`@${displayName} `);
    // Focus input
    setTimeout(() => {
      const input = document.querySelector(
        'input[placeholder="Viết bình luận..."]',
      ) as HTMLInputElement;
      input?.focus();
    }, 0);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!onDeleteComment) return;
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;

    try {
      await feedApi.deleteComment(postId, commentId);
      onDeleteComment(commentId);
      // Refresh UI to show updated comments
      onRefresh?.();
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Không thể xóa bình luận. Vui lòng thử lại.");
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content_text || comment.content || "");
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await feedApi.updateComment(postId, commentId, editContent);
      setEditingCommentId(null);
      setEditContent("");
      // Notify parent to refresh comments if provided
      onRefresh?.();
    } catch (error) {
      console.error("Failed to edit comment:", error);
      alert("Không thể sửa bình luận. Vui lòng thử lại.");
    }
  };

  const handleToggleReplies = async (commentId: string) => {
    const isExpanded = expandedReplies.has(commentId);

    if (isExpanded) {
      // Collapse replies
      setExpandedReplies((prev) => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    } else {
      // Expand and load replies if not already loaded
      setExpandedReplies((prev) => new Set(prev).add(commentId));

      if (!replies[commentId]) {
        try {
          setLoadingReplies((prev) => new Set(prev).add(commentId));
          const replyList = await feedApi.getCommentReplies(postId, commentId);
          setReplies((prev) => ({ ...prev, [commentId]: replyList }));
        } catch (error) {
          console.error("Failed to load replies:", error);
        } finally {
          setLoadingReplies((prev) => {
            const newSet = new Set(prev);
            newSet.delete(commentId);
            return newSet;
          });
        }
      }
    }
  };

  // Fetch comment and reply media as blobs
  useEffect(() => {
    const fetchCommentMedia = async () => {
      const urlMap: Record<string, string[]> = {};

      // Fetch media for top-level comments (support media_files, media_urls, media_paths)
      for (const comment of comments) {
        const mediaFiles = comment.media_files || [];
        let urls: string[] = [];

        if (mediaFiles.length > 0) {
          urls = await Promise.all(
            mediaFiles.map((file) => {
              const url = file.file_url || file.file_path;
              return feedApi.fetchMediaAsBlob(url);
            }),
          );
        } else if (
          Array.isArray(comment.media_urls) &&
          comment.media_urls.length > 0
        ) {
          urls = await Promise.all(
            comment.media_urls.map((u) => feedApi.fetchMediaAsBlob(u)),
          );
        } else if (
          Array.isArray(comment.media_paths) &&
          comment.media_paths.length > 0
        ) {
          urls = await Promise.all(
            comment.media_paths.map((p) => feedApi.fetchMediaAsBlob(p)),
          );
        }

        if (urls.length > 0) {
          urlMap[comment.id] = urls.filter((u) => u !== "");
        }
      }

      // Fetch media for replies (support media_files, media_urls, media_paths)
      for (const replyList of Object.values(replies)) {
        for (const reply of replyList) {
          const mediaFiles = reply.media_files || [];
          let urls: string[] = [];

          if (mediaFiles.length > 0) {
            urls = await Promise.all(
              mediaFiles.map((file) => {
                const url = file.file_url || file.file_path;
                return feedApi.fetchMediaAsBlob(url);
              }),
            );
          } else if (
            Array.isArray(reply.media_urls) &&
            reply.media_urls.length > 0
          ) {
            urls = await Promise.all(
              reply.media_urls.map((u) => feedApi.fetchMediaAsBlob(u)),
            );
          } else if (
            Array.isArray(reply.media_paths) &&
            reply.media_paths.length > 0
          ) {
            urls = await Promise.all(
              reply.media_paths.map((p) => feedApi.fetchMediaAsBlob(p)),
            );
          }

          if (urls.length > 0) {
            urlMap[reply.id] = urls.filter((u) => u !== "");
          }
        }
      }

      setCommentBlobUrls(urlMap);
    };

    if (comments.length > 0 || Object.keys(replies).length > 0) {
      fetchCommentMedia();
    }

    return () => {
      Object.values(commentBlobUrls).forEach((urls) =>
        urls.forEach((url) => URL.revokeObjectURL(url)),
      );
    };
  }, [comments, replies]);

  // Helper to render a reply node recursively
  const renderReplyNode = (reply: Comment, level = 0) => {
    const replyAuthor = reply.author;
    const replyDisplayName = replyAuthor?.displayName || "";
    const [replyFirst = "", replyLast = ""] = replyDisplayName.split(" ");
    const replyUserForAvatar = {
      id: replyAuthor?.id || "",
      firstName: replyFirst || "",
      lastName: replyLast || "",
      email: "",
      avatar: replyAuthor?.avatar || undefined,
    };
    const replyBlobUrls = commentBlobUrls[reply.id] || [];
    const isReplyAuthor =
      currentUserId === (replyAuthor?.id || reply.author_id);

    return (
      <div key={reply.id} className="space-y-2">
        <div className="flex items-start space-x-2">
          <Avatar user={replyUserForAvatar} size="sm" />
          <div className="flex-1">
            <div className="bg-white dark:bg-[#0A2737] rounded-lg px-3 py-2">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                {replyDisplayName}
              </p>
              {editingCommentId === reply.id ? (
                <div className="mt-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#0a1f29] text-gray-900 dark:text-white"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSaveEdit(reply.id)}
                      className="text-xs px-3 py-1 bg-[#1b7a78] text-white rounded hover:bg-teal-700"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="text-xs px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {reply.content_text || reply.content}
                </p>
              )}
              {replyBlobUrls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {replyBlobUrls.map((blobUrl, idx) => (
                    <img
                      key={idx}
                      src={blobUrl}
                      alt="Reply media"
                      className="w-16 h-16 object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 ml-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(
                  reply.created_at || reply.createdAt || "",
                ).toLocaleDateString("vi-VN")}
              </span>
              <button
                onClick={() => handleLikeComment(reply.id)}
                className={`text-xs flex items-center gap-1 ${likedComments.has(reply.id) ? "text-red-500" : "text-gray-500 dark:text-gray-400"} hover:text-red-500 dark:hover:text-red-400 transition-colors`}
                title="Thích"
              >
                <Heart
                  className={`w-3 h-3 ${likedComments.has(reply.id) ? "fill-current" : ""}`}
                />
                {(reply.reaction_count || reply.likes || 0) > 0 && (
                  <span>{reply.reaction_count || reply.likes}</span>
                )}
              </button>

              <button
                onClick={() => handleReply(reply.id, replyDisplayName)}
                className="text-xs flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-[#1b7a78] dark:hover:text-teal-400 transition-colors"
                title="Trả lời"
              >
                <Reply className="w-3 h-3" />
              </button>

              {isReplyAuthor && (
                <>
                  <button
                    onClick={() => handleEditComment(reply)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#1b7a78] dark:hover:text-teal-400 transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteComment(reply.id)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>

            {/* Toggle nested replies for this reply */}
            {(reply.reply_count || 0) > 0 && (
              <button
                onClick={() => handleToggleReplies(reply.id)}
                className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-[#1b7a78] dark:hover:text-teal-400 mt-2 ml-3"
              >
                {expandedReplies.has(reply.id)
                  ? `Ẩn ${reply.reply_count} câu trả lời`
                  : `Xem ${reply.reply_count} câu trả lời`}
              </button>
            )}

            {/* Render nested replies if expanded */}
            {expandedReplies.has(reply.id) && replies[reply.id] && (
              <div className="ml-6 mt-3 space-y-3">
                {replies[reply.id].map((child) =>
                  renderReplyNode(child, level + 1),
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-[#0a1f29] rounded-xl p-4 mt-4">
      <div className="flex items-center mb-4">
        <MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
        <h4 className="font-semibold text-gray-900 dark:text-white">
          Bình luận
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết bình luận..."
            className="flex-1"
          />
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((file, index) => {
                const url = URL.createObjectURL(file);
                return (
                  <div key={index} className="relative w-16 h-16">
                    <img
                      src={url}
                      alt={`Preview ${index}`}
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute -top-1 -right-1 p-0.5 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => inputRef.current?.click()}
        >
          <Image className="w-4 h-4" />
        </Button>
        <Button
          type="submit"
          disabled={!content.trim()}
          className="bg-[#1b7a78] hover:bg-teal-700"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1b7a78]"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => {
            const author = comment.author;
            const displayName = author?.displayName || "";
            const [firstName = "", lastName = ""] = displayName.split(" ");
            const userForAvatar = {
              id: author?.id || "",
              firstName: firstName || "",
              lastName: lastName || "",
              email: "",
              avatar: author?.avatar || undefined,
            };
            const blobUrls = commentBlobUrls[comment.id] || [];
            const isAuthor =
              currentUserId === (author?.id || comment.author_id);

            return (
              <div key={comment.id} className="flex items-start space-x-3">
                <Avatar user={userForAvatar} size="sm" />
                <div className="flex-1">
                  <div className="bg-white dark:bg-[#0A2737] rounded-lg px-3 py-2">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {displayName}
                    </p>
                    {editingCommentId === comment.id ? (
                      <div className="mt-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#0a1f29] text-gray-900 dark:text-white"
                          rows={2}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="text-xs px-3 py-1 bg-[#1b7a78] text-white rounded hover:bg-teal-700"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="text-xs px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {comment.content_text || comment.content}
                      </p>
                    )}
                    {blobUrls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {blobUrls.map((blobUrl, idx) => (
                          <img
                            key={idx}
                            src={blobUrl}
                            alt="Comment media"
                            className="w-20 h-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 ml-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(
                        comment.created_at || comment.createdAt || "",
                      ).toLocaleDateString("vi-VN")}
                    </span>
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className={`text-xs flex items-center gap-1 ${likedComments.has(comment.id) ? "text-red-500" : "text-gray-500 dark:text-gray-400"} hover:text-red-500 dark:hover:text-red-400 transition-colors`}
                      title="Thích"
                    >
                      <Heart
                        className={`w-4 h-4 ${likedComments.has(comment.id) ? "fill-current" : ""}`}
                      />
                      {(comment.reaction_count || comment.likes || 0) > 0 && (
                        <span>{comment.reaction_count || comment.likes}</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleReply(comment.id, displayName)}
                      className="text-xs flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-[#1b7a78] dark:hover:text-teal-400 transition-colors"
                      title="Trả lời"
                    >
                      <Reply className="w-4 h-4" />
                      {(comment.reply_count || 0) > 0 && (
                        <span>{comment.reply_count}</span>
                      )}
                    </button>
                    {isAuthor && (
                      <>
                        <button
                          onClick={() => handleEditComment(comment)}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#1b7a78] dark:hover:text-teal-400 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Show/Hide replies button */}
                  {(comment.reply_count || 0) > 0 && (
                    <button
                      onClick={() => handleToggleReplies(comment.id)}
                      className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-[#1b7a78] dark:hover:text-teal-400 mt-2 ml-3"
                    >
                      {expandedReplies.has(comment.id)
                        ? `Ẩn ${comment.reply_count} câu trả lời`
                        : `Xem ${comment.reply_count} câu trả lời`}
                    </button>
                  )}

                  {/* Nested replies */}
                  {expandedReplies.has(comment.id) && (
                    <div className="ml-8 mt-3 space-y-3">
                      {loadingReplies.has(comment.id) ? (
                        <div className="flex justify-center py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1b7a78]"></div>
                        </div>
                      ) : (
                        replies[comment.id]?.map((reply) =>
                          renderReplyNode(reply),
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Chưa có bình luận nào
        </p>
      )}
    </div>
  );
}
