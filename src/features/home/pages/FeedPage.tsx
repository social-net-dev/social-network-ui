import { useState, lazy, Suspense } from "react";
import { useFeed } from "../hooks/useFeed";
import { CreatePostTrigger } from "../components/CreatePostTrigger";
import { FeedList } from "../components/FeedList";
import { ShareDialog } from "../components/ShareDialog";
import { Button } from "@/components/ui/button";
import { usePostActions } from "../hooks/usePostActions";
import { useAuthStore } from "@/stores/authStore";
import { AlertCircle, CheckCircle, HardDrive } from "lucide-react";

// Lazy load CreatePostModal để giảm bundle size
const CreatePostModal = lazy(() => 
  import("../components/CreatePostModal").then(module => ({ 
    default: module.CreatePostModal 
  }))
);

export function FeedPage() {
    const { posts, isLoading, error, createPost, likePost, refresh } = useFeed();
    const { deletePost, updatePost, sharePost } = usePostActions();
    const { user: currentUser } = useAuthStore();
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [sharePostId, setSharePostId] = useState<string | null>(null);

    const handleCreatePost = async (content: string, files: File[], hashtags: string[]) => {
        try {
            setIsCreating(true);
            // TODO: Update createPost to accept hashtags
            await createPost(content, files);
            console.log("Hashtags:", hashtags); // For now, just log
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
    };

    const handleShare = (postId: string) => {
        setSharePostId(postId);
    };

    const handleShareSubmit = async (content: string) => {
        if (!sharePostId) return;
        try {
            await sharePost(sharePostId, content);
            refresh();
        } catch (err) {
            console.error("Failed to share post:", err);
            throw err;
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            await deletePost(postId);
            refresh();
        } catch (err) {
            console.error("Failed to delete post:", err);
        }
    };

    const handleEditPost = async (postId: string, content: string) => {
        try {
            await updatePost(postId, content);
            refresh();
        } catch (err) {
            console.error("Failed to edit post:", err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Account Status Banner */}
            {currentUser?.account_status === "UNVERIFIED" && (
                <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="font-medium text-foreground">Tài khoản chưa xác minh</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Dung lượng hiện tại: <span className="font-semibold text-foreground">{currentUser?.storage_quota_mb || 100}MB</span>. Khi admin phê
                            duyệt, bạn sẽ nhận được 5GB dung lượng.
                        </p>
                    </div>
                </div>
            )}

            {currentUser?.account_status === "VERIFIED" && (
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="font-medium text-secondary">Tài khoản đã xác minh</p>
                        <p className="text-sm text-secondary/80 mt-1">
                            <HardDrive className="inline h-4 w-4 mr-1" />
                            Dung lượng sử dụng: <span className="font-semibold">{currentUser?.storage_quota_mb || 5120}MB (5GB)</span>
                        </p>
                    </div>
                </div>
            )}

            <CreatePostTrigger onClick={() => setShowCreateModal(true)} />

            <Suspense fallback={<div className="text-center py-4 text-muted-foreground">Đang tải...</div>}>
                <CreatePostModal
                    open={showCreateModal}
                    onOpenChange={setShowCreateModal}
                    onSubmit={handleCreatePost}
                    isLoading={isCreating}
                />
            </Suspense>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <p className="text-destructive font-medium">{error instanceof Error ? error.message : "Đã có lỗi xảy ra"}</p>
                        <Button variant="outline" size="sm" onClick={refresh} className="border-destructive/30 hover:bg-destructive/10 text-destructive">
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
                currentUserId={currentUser?.id}
            />

            <ShareDialog isOpen={sharePostId !== null} onClose={() => setSharePostId(null)} onShare={handleShareSubmit} />
        </div>
    );
}

