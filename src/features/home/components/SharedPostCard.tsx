import { Avatar } from "@/features/shared/components/Avatar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { Post as PostType } from "../types/feed.types";
import { useMediaBlobs } from "../hooks/useMedia";

interface SharedPostCardProps {
  post: PostType;
}

export function SharedPostCard({ post }: SharedPostCardProps) {
  const images = post.mediaUrls || [];
  const { data: blobUrls = [], isLoading: loadingImages } = useMediaBlobs(images);

  const createdAt = post.createdAt || new Date().toISOString();
  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: vi,
  });

  const content = post.content || "";

  return (
    <div className="bg-muted/50 rounded-xl p-4 border border-border/50 mb-4 animate-fadeIn">
      <div className="flex items-center gap-3 mb-3">
        <Avatar user={post.author} size="sm" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">
            {post.author.displayName}
          </h4>
          <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
        </div>
      </div>
      
      <p className="text-xs text-foreground/80 leading-relaxed mb-3 line-clamp-3">
        {content}
      </p>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {loadingImages ? (
            <div className="col-span-2 h-32 bg-muted/30 rounded-lg animate-pulse" />
          ) : (
            blobUrls.slice(0, 2).map((url, i) => (
              <img 
                key={i} 
                src={url} 
                className="h-32 w-full object-cover rounded-lg border border-border/30" 
                alt="Shared content" 
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
