import { useState } from "react";
import { useFeed } from "../hooks/useFeed";
import { CreatePostForm } from "../components/CreatePostForm";
import { FeedList } from "../components/FeedList";
import { ShareDialog } from "../components/ShareDialog";
import { MainLayout } from "@/features/shared/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { feedApi } from "../services/feedApi";
import { useAuthStore } from "@/stores/authStore";
import { AlertCircle, CheckCircle, HardDrive } from "lucide-react";
import type { Comment } from "../types/feed.types";

export function FeedPage() {
    const { posts, isLoading, error, createPost, likePost, refresh } = useFeed();
    const { user: currentUser } = useAuthStore();
    const [isCreating, setIsCreating] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [sharePostId, setSharePostId] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});

    const handleCreatePost = async (content: string, files: File[]) => {
        try {
            setIsCreating(true);
            await createPost(content, files);
        } catch (err) {
            console.error("Failed to create post:", err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleLike = async (postId: string, liked: boolean) => {
        await likePost(postId, liked);
    };

    const handleComment = (postId: string) => {
        setSelectedPostId(selectedPostId === postId ? null : postId);
        if (!comments[postId]) {
            loadComments(postId);
        }
    };

    const handleShare = (postId: string) => {
        setSharePostId(postId);
    };

    const handleShareSubmit = async (content: string) => {
        if (!sharePostId) return;
        try {
            await feedApi.sharePost(sharePostId, content);
            refresh();
        } catch (err) {
            console.error("Failed to share post:", err);
            throw err;
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            await feedApi.deletePost(postId);
            refresh();
        } catch (err) {
            console.error("Failed to delete post:", err);
        }
    };

    const handleEditPost = async (postId: string, content: string) => {
        try {
            await feedApi.updatePost(postId, content);
            refresh();
        } catch (err) {
            console.error("Failed to edit post:", err);
            alert("Không thể sửa bài viết. Vui lòng thử lại.");
        }
    };

    const loadComments = async (postId: string) => {
        try {
            setLoadingComments((prev) => ({ ...prev, [postId]: true }));
            const data = await feedApi.getComments(postId);
            setComments((prev) => ({ ...prev, [postId]: data }));
        } catch (err) {
            console.error("Failed to load comments:", err);
        } finally {
            setLoadingComments((prev) => ({ ...prev, [postId]: false }));
        }
    };

    const handleAddComment = async (postId: string, content: string, files?: File[]) => {
        try {
            const newComment = await feedApi.addComment(postId, content, files);
            setComments((prev) => ({
                ...prev,
                [postId]: [...(prev[postId] || []), newComment],
            }));
        } catch (err) {
            console.error("Failed to add comment:", err);
        }
    };

    const handleDeleteComment = async (postId: string, commentId: string) => {
        setComments((prev) => ({
            ...prev,
            [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
        }));
    };

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto">
                {/* Account Status Banner */}
                {currentUser?.account_status === "UNVERIFIED" && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium text-blue-900 dark:text-blue-200">Tài khoản chưa xác minh</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                Dung lượng hiện tại: <span className="font-semibold">{currentUser?.storage_quota_mb || 100}MB</span>. Khi admin phê
                                duyệt, bạn sẽ nhận được 5GB dung lượng.
                            </p>
                        </div>
                    </div>
                )}

                {currentUser?.account_status === "VERIFIED" && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium text-green-900 dark:text-green-200">Tài khoản đã xác minh</p>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                <HardDrive className="inline h-4 w-4 mr-1" />
                                Dung lượng sử dụng: <span className="font-semibold">{currentUser?.storage_quota_mb || 5120}MB (5GB)</span>
                            </p>
                        </div>
                    </div>
                )}

                <CreatePostForm onSubmit={handleCreatePost} isLoading={isCreating} />

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <p className="text-red-800 dark:text-red-400">{error instanceof Error ? error.message : "Đã có lỗi xảy ra"}</p>
                            <Button variant="outline" size="sm" onClick={refresh}>
                                Thử lại
                            </Button>
                        </div>
                    </div>
                )}

                <FeedList
                    posts={posts}
                    isLoading={isLoading}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onDelete={handleDeletePost}
                    onEdit={handleEditPost}
                    selectedPostId={selectedPostId}
                    comments={comments}
                    loadingComments={loadingComments}
                    onAddComment={handleAddComment}
                    onDeleteComment={handleDeleteComment}
                    currentUserId={currentUser?.id}
                    onRefreshComment={(postId) => loadComments(postId)}
                />

                <ShareDialog isOpen={sharePostId !== null} onClose={() => setSharePostId(null)} onShare={handleShareSubmit} />
            </div>
        </MainLayout>
    );
}
