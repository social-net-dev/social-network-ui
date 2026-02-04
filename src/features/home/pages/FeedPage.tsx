import { useState } from "react";
import { useFeed } from "../hooks/useFeed";
import { CreatePostForm } from "../components/CreatePostForm";
import { FeedList } from "../components/FeedList";
import { ShareDialog } from "../components/ShareDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { feedApi } from "../services/feedApi";
import { useAuthStore } from "@/stores/authStore";
import { AlertCircle, CheckCircle, GraduationCap, HardDrive, MessageSquareText, Users } from "lucide-react";
import { Link } from "react-router-dom";
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

    const communities = [
        {
            id: "math-club",
            name: "CLB Toán học nâng cao",
            members: 2300,
            tag: "Học thuật",
            avatar: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=120&q=80",
        },
        {
            id: "stem-2026",
            name: "Diễn đàn STEM 2026",
            members: 1100,
            tag: "Công nghệ",
            avatar: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=120&q=80",
        },
        {
            id: "chem-teachers",
            name: "Cộng đồng Giáo viên Hóa",
            members: 820,
            tag: "Giáo dục",
            avatar: "https://images.unsplash.com/photo-1517976547714-720226b864c1?auto=format&fit=crop&w=120&q=80",
        },
        {
            id: "thpt-exam",
            name: "Nhóm Ôn thi THPT",
            members: 640,
            tag: "Kỳ thi",
            avatar: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=120&q=80",
        },
    ];

    const activeFriends = [
        { id: "f1", name: "Trần Hoàng Phúc", username: "hoangphuc", status: "Đang học", avatar: "https://i.pravatar.cc/120?img=15" },
        { id: "f2", name: "Phạm Thu Hà", username: "thuhap", status: "Online", avatar: "https://i.pravatar.cc/120?img=45" },
        { id: "f3", name: "Nguyễn Minh Anh", username: "minhanh", status: "Vừa kết nối", avatar: "https://i.pravatar.cc/120?img=32" },
    ];

    return (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
            <div className="space-y-6">
                {/* Account Status Banner */}
                {currentUser?.account_status === "UNVERIFIED" && (
                    <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium text-foreground">Tài khoản chưa xác minh</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Dung lượng hiện tại: <span className="font-semibold text-foreground">{currentUser?.storage_quota_mb || 100}MB</span>.
                                Khi admin phê duyệt, bạn sẽ nhận được 5GB dung lượng.
                            </p>
                        </div>
                    </div>
                )}

                {currentUser?.account_status === "VERIFIED" && (
                    <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 flex items-start gap-3">
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

                <CreatePostForm onSubmit={handleCreatePost} isLoading={isCreating} />

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-destructive font-medium">{error instanceof Error ? error.message : "Đã có lỗi xảy ra"}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={refresh}
                                className="border-destructive/30 hover:bg-destructive/10 text-destructive"
                            >
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
            </div>

            <div className="lg:sticky lg:top-24 h-[calc(100vh-7rem)] overflow-y-auto pr-1 space-y-6 sidebar-scroll">
                <Card className="border-none shadow-xl bg-white dark:bg-card overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-etechs-primary" />
                            Cộng đồng đang tham gia
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {communities.map((community) => (
                            <Link
                                key={community.id}
                                to={`/groups/${community.id}`}
                                className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-etechs-primary/5 group"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="size-10">
                                        <AvatarImage src={community.avatar} alt={community.name} />
                                        <AvatarFallback>{community.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-etechs-primary">
                                            {community.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{community.tag}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="rounded-full">
                                    {(community.members / 1000).toFixed(1)}k
                                </Badge>
                            </Link>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white dark:bg-card overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquareText className="h-5 w-5 text-emerald-500" />
                            Bạn bè đang hoạt động
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {activeFriends.map((friend) => (
                            <Link
                                key={friend.id}
                                to={`/messages?user=${friend.username}`}
                                className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-emerald-500/10 group"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="size-10">
                                        <AvatarImage src={friend.avatar} alt={friend.name} />
                                        <AvatarFallback>{friend.name.slice(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-emerald-600">
                                            {friend.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Nhấn để nhắn tin</p>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-500/10 text-emerald-600 rounded-full" variant="secondary">
                                    {friend.status}
                                </Badge>
                            </Link>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-amber-900/20 dark:via-card dark:to-emerald-900/20">
                    <CardContent className="p-5 flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Tăng điểm nón</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Hoàn thiện hồ sơ để tăng uy tín.</p>
                        </div>
                        <Button size="sm" className="ml-auto rounded-full">
                            Thực hiện
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <ShareDialog isOpen={sharePostId !== null} onClose={() => setSharePostId(null)} onShare={handleShareSubmit} />
        </div>
    );
}
