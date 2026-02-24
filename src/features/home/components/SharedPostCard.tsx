import { Avatar } from '@/features/shared/components/Avatar';
import { FormattedContent } from '@/features/shared/components/FormattedContent';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { PostSummary as PostType } from '@/lib/api/generated/model';
import { useMediaBlobs } from '../hooks/useMedia';
import { cn } from '@/lib/utils';

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

  const content = post.content || '';

  return (
    <div className="bg-muted/30 dark:bg-muted/10 rounded-xl p-4 border border-border/80 mb-4 animate-fadeIn">
      <div className="flex items-center gap-3 mb-3">
        <Avatar user={post.author as any} size="sm" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{post.author?.displayName || 'Người dùng'}</h4>
          <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

      {content && <FormattedContent content={content} className="text-xs text-foreground/80 leading-relaxed mb-3 line-clamp-5 block" />}

      {images.length > 0 && (
        <div className={cn('grid gap-2', images.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
          {loadingImages ? <div className="col-span-full h-32 bg-muted/30 rounded-lg animate-pulse" /> : blobUrls.map((url, i) => <img key={i} src={url} className={cn('w-full object-cover rounded-lg border border-border/30', images.length === 1 ? 'h-48' : 'h-32')} alt="Nội dung chia sẻ" />)}
        </div>
      )}
    </div>
  );
}
