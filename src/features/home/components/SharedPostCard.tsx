import { Avatar } from "@/features/shared/components/Avatar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { Post as PostType } from "../types/feed.types";
import { useMediaBlobs } from "../hooks/useMedia";

interface SharedPostCardProps {
  post: PostType;
}

export function SharedPostCard({ post }: SharedPostCardProps) {
  const images = post.images ?? post.media_urls ?? post.media_paths ?? [];
  const { data: blobUrls = [], isLoading: loadingImages } = useMediaBlobs(images);

  const createdAt = post.createdAt ?? post.created_at ?? new Date().toISOString();
  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: vi,
  });

  const content = post.content ?? post.content_text ?? "";

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

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 mt-3">
      <div className="flex items-center space-x-3 mb-3">
        <Avatar user={userForAvatar} size="sm" />
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
            {display || `${first} ${last}`}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</p>
        </div>
      </div>

      {content && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
          {content}
        </p>
      )}

      {images.length > 0 && (
        <div className="grid gap-2">
          {loadingImages ? (
            <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ) : blobUrls.length === 1 ? (
            <img
              src={blobUrls[0]}
              alt="Shared post"
              className="w-full rounded-lg max-h-64 object-cover"
            />
          ) : blobUrls.length > 1 ? (
            <div className="grid grid-cols-2 gap-1">
              {blobUrls.slice(0, 4).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Shared ${idx + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
