import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Loader2, Lock } from 'lucide-react';
import { useFriendsListFriends } from '@/lib/api/generated';
import { getDefaultAvatar } from '@/lib/utils/api';

interface ProfileFriendsTabProps {
  userId: string | null;
  isCurrentUser?: boolean;
}

export function ProfileFriendsTab({ userId, isCurrentUser = false }: ProfileFriendsTabProps) {
  const { data, isLoading } = useFriendsListFriends(
    { page: 1, page_size: 24 },
    { query: { enabled: !!userId && isCurrentUser } }
  );

  // For other users' profiles, the API doesn't support fetching their friend list
  if (!isCurrentUser) {
    return (
      <Card className="rounded-xl border-2 border-dashed border-border bg-muted/20">
        <CardContent className="p-12 text-center">
          <Lock className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">Danh sách bạn bè</h3>
          <p className="text-xs text-muted-foreground/60">Danh sách bạn bè của người dùng này không được công khai.</p>
        </CardContent>
      </Card>
    );
  }

  const friends = (data as any)?.data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <Card className="rounded-xl border-2 border-dashed border-border bg-muted/20">
        <CardContent className="p-12 text-center">
          <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">Chưa có bạn bè nào</h3>
          <p className="text-xs text-muted-foreground/60">Danh sách bạn bè sẽ xuất hiện ở đây.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4">{friends.length} bạn bè</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {friends.map((friend: any) => {
          const user = friend.user ?? friend;
          const displayName = user.displayName ?? user.display_name ?? user.username ?? 'Người dùng';
          const username = user.username ?? '';
          const avatarSrc = user.avatar ?? user.avatar_path ?? getDefaultAvatar();
          const initials = displayName.slice(0, 2).toUpperCase();

          return (
            <Link
              key={user.id ?? friend.id}
              to={`/profile/${user.username ?? user.id}`}
              className="group"
            >
              <Card className="rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all overflow-hidden">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Avatar className="w-16 h-16 ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                    <AvatarImage src={avatarSrc} alt={displayName} className="object-cover" />
                    <AvatarFallback className="text-lg font-bold bg-muted text-muted-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 w-full">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {displayName}
                    </p>
                    {username && (
                      <p className="text-xs text-muted-foreground truncate">@{username}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
