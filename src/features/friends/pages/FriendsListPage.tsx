import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/features/shared/components/Avatar";
import {
  Search,
  Users,
  UserMinus,
  MessageCircle,
  Loader2,
} from "lucide-react";
import {
  useFriendsListFriends,
  useFriendsRemoveFriend,
  getFriendsListFriendsQueryKey,
} from "@/lib/api/generated";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { callGetDMRoom } from "@/features/message/services/messageApi";

export function FriendsListPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUserId = useAuthStore(state => state.user?.id);

  const handleOpenDM = useCallback(async (friendUserId: string) => {
    try {
      const resp = await callGetDMRoom(currentUserId ?? null, friendUserId);
      const roomId = (resp.data as any)?.id ?? (resp.data as any)?.room_id;
      if (roomId) {
        navigate(`/messages/${roomId}`);
      } else {
        navigate('/messages');
      }
    } catch {
      navigate('/messages');
    }
  }, [currentUserId, navigate]);

  const { data, isLoading, isError } = useFriendsListFriends(
    { limit: 100 } as any,
    { query: { staleTime: 1000 * 30 } }
  );

  const friends = useMemo(() => {
    const items = data?.items ?? [];
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (f) =>
        f.user.display_name?.toLowerCase().includes(q) ||
        f.user.username?.toLowerCase().includes(q)
    );
  }, [data?.items, searchQuery]);

  const removeFriendMutation = useFriendsRemoveFriend({
    mutation: {
      onSuccess: () => {
        toast.success("Đã hủy kết bạn");
        qc.invalidateQueries({ queryKey: getFriendsListFriendsQueryKey() });
      },
      onError: () => {
        toast.error("Lỗi khi hủy kết bạn");
      },
    },
  });

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSearchQuery(searchInput.trim());
    },
    [searchInput]
  );

  const handleRemoveFriend = (friendUserId: string, name: string) => {
    if (confirm(`Bạn có chắc muốn hủy kết bạn với ${name}?`)) {
      removeFriendMutation.mutate({ friendId: friendUserId });
    }
  };

  const total = data?.items?.length ?? 0;


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bạn bè</h1>
          <p className="text-sm text-muted-foreground">
            {total > 0 ? `Bạn có ${total} bạn bè` : "Danh sách bạn bè của bạn"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm bạn bè theo tên, username..."
          className="flex-1"
        />
        <Button type="submit">
          <Search className="h-4 w-4 mr-2" />
          Tìm
        </Button>
      </form>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {isError && (
        <Card className="border-destructive/20">
          <CardContent className="p-6 text-center text-destructive">
            Đã xảy ra lỗi khi tải danh sách bạn bè.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && friends.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">
              {searchQuery ? "Không tìm thấy bạn bè" : "Chưa có bạn bè nào"}
            </p>
            <p className="text-sm mt-1">
              {searchQuery ? "Thử tìm kiếm với từ khóa khác." : "Hãy kết bạn với mọi người!"}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => navigate("/search")}>
                Tìm kiếm người dùng
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {friends.length > 0 && (
        <div className="space-y-3">
          {friends.map((friend) => (
            <Card key={friend.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <Link
                  to={`/profile/${friend.user.username}`}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <Avatar user={friend.user as Parameters<typeof Avatar>[0]['user']} size="lg" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {friend.user.display_name || friend.user.username}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      @{friend.user.username}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleOpenDM(friend.user.id)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Nhắn tin
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveFriend(friend.id, friend.user.display_name || friend.user.username || '')}
                    disabled={removeFriendMutation.isPending}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

