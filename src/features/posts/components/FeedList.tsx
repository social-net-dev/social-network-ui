import { FileText, Loader2 } from "lucide-react";
import { PostCard } from "./PostCard";
import type { PostSummary } from "@/lib/api/types";
import { useRef } from "react";

type PostWithShared = PostSummary & { sharedPost?: PostSummary | null };

interface FeedListProps {
  posts: PostWithShared[];
  isLoading: boolean;
  onLike: (postId: string, liked: boolean) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  openCommentPostIds?: string[];
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string, content: string) => void;
  currentUserId?: string;
  onOpenDetail?: (postId: string) => void;
}

function PostSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-5 animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full skeleton-shimmer flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 skeleton-shimmer rounded w-1/3" />
          <div className="h-3 skeleton-shimmer rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3.5 skeleton-shimmer rounded w-full" />
        <div className="h-3.5 skeleton-shimmer rounded w-5/6" />
        <div className="h-3.5 skeleton-shimmer rounded w-2/3" />
      </div>
      <div className="pt-4 border-t border-border/50 flex gap-2">
        <div className="h-7 w-16 skeleton-shimmer rounded-full" />
        <div className="h-7 w-16 skeleton-shimmer rounded-full" />
        <div className="h-7 w-16 skeleton-shimmer rounded-full" />
      </div>
    </div>
  );
}

export function FeedList({
  posts,
  isLoading,
  onLike,
  onComment,
  onShare,
  openCommentPostIds = [],
  onDelete,
  onEdit,
  currentUserId,
  onOpenDetail,
}: FeedListProps) {
  // Track the post IDs seen on initial load to apply entrance animation only once
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isInitialRender = seenIdsRef.current.size === 0 && posts.length > 0;

  if (isInitialRender) {
    posts.forEach((p) => seenIdsRef.current.add(p.id));
  }

  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-12 text-center animate-fadeIn">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
          <FileText className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Chưa có bài viết nào
        </h3>
        <p className="text-sm text-muted-foreground">
          Hãy đăng bài đầu tiên của bạn!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.filter(post => post != null).map((post) => {
        // Apply entrance animation only for posts seen on initial render
        const isNew = !seenIdsRef.current.has(post.id);
        if (isNew) seenIdsRef.current.add(post.id);
        const enterClass = isInitialRender ? "feed-item-enter" : isNew ? "animate-fadeInUp" : "";

        return (
          <div key={post.id} className={enterClass}>
            <PostCard
              post={post}
              onLike={onLike}
              onComment={onOpenDetail ?? onComment}
              onShare={onShare}
              onDelete={onDelete}
              onEdit={onEdit}
              currentUserId={currentUserId}
              showComments={openCommentPostIds.includes(post.id)}
              onOpenDetail={onOpenDetail}
            />
          </div>
        );
      })}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
