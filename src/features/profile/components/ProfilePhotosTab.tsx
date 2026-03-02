import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ImageOff, X, ExternalLink } from 'lucide-react';
import { useProfilePosts } from '../hooks/useProfilePosts';
import { Button } from '@/components/ui/button';

interface ProfilePhotosTabProps {
  mode: 'me' | 'other';
  subjectUserId: string | null;
}

interface PhotoItem {
  url: string;
  postId: string;
}

export function ProfilePhotosTab({ mode, subjectUserId }: ProfilePhotosTabProps) {
  const { posts, query } = useProfilePosts({ mode, subjectUserId });
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const photos = useMemo<PhotoItem[]>(() => {
    const items: PhotoItem[] = [];
    for (const post of posts) {
      // Prefer rich media assets first
      if (post.media && post.media.length > 0) {
        for (const asset of post.media) {
          const url = asset.cdn_url || asset.original_url || asset.thumbnail_url;
          if (url && asset.type === 'IMAGE') {
            items.push({ url, postId: post.id });
          }
        }
      } else if (post.mediaUrls && post.mediaUrls.length > 0) {
        for (const url of post.mediaUrls) {
          items.push({ url, postId: post.id });
        }
      }
    }
    return items;
  }, [posts]);

  if (query.isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <Card className="rounded-xl border-2 border-dashed border-border bg-muted/20">
        <CardContent className="p-12 text-center">
          <ImageOff className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">Chưa có ảnh nào</h3>
          <p className="text-xs text-muted-foreground/60">Ảnh từ các bài viết sẽ xuất hiện ở đây.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <p className="text-xs text-muted-foreground mb-4">{photos.length} ảnh</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((photo, idx) => (
          <button
            key={`${photo.postId}-${idx}`}
            className="aspect-square rounded-xl overflow-hidden group relative focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => setLightboxUrl(photo.url)}
          >
            <img
              src={photo.url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
