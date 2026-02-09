import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hash, Users, FileText, Share2 } from 'lucide-react';
import type { Field } from '../types/field.types';
import { Skeleton } from '@/components/ui/skeleton';

interface FieldHeaderProps {
  field?: Field;
  isLoading?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  isActionLoading?: boolean;
}

export function FieldHeader({ field, isLoading, onFollow, onUnfollow, isActionLoading }: FieldHeaderProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50 mb-6">
        <Skeleton className="h-48 w-full" />
        <div className="p-6 relative">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Skeleton className="w-24 h-24 rounded-2xl -mt-16 border-4 border-card" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!field) return null;

  const handleFollowClick = () => {
    if (field.isFollowing) {
      onUnfollow?.();
    } else {
      onFollow?.();
    }
  };

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50 mb-6 animate-fadeIn">
      {/* Banner */}
      <div className="h-48 w-full relative overflow-hidden group">
        <img src={field.bannerUrl || 'https://picsum.photos/1200/400?random=default-banner'} alt={field.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Info Section */}
      <div className="p-6 relative">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar/Icon */}
          <div className="w-24 h-24 rounded-2xl -mt-16 border-4 border-card bg-primary/10 flex items-center justify-center overflow-hidden shadow-lg z-10">
            {field.avatarUrl ? <img src={field.avatarUrl} alt={field.name} className="w-full h-full object-cover" /> : <Hash className="w-10 h-10 text-primary" />}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">{field.name}</h1>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {field.hashtag}
                  </Badge>
                </div>
                <p className="text-muted-foreground line-clamp-2 max-w-2xl text-sm md:text-base leading-relaxed">{field.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant={field.isFollowing ? 'outline' : 'default'} className="rounded-full px-6" onClick={handleFollowClick} disabled={isActionLoading}>
                  {isActionLoading ? 'Đang xử lý...' : field.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">{field.stats.postsCount.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm">bài viết</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">{field.stats.followersCount.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm">người theo dõi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
