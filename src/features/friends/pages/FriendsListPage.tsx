import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { customInstance } from "@/lib/api";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import type { Friend } from "@/lib/api/generated/model";

interface FriendsResponse {
  friends: Friend[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

function useFriendsList(query: string, page: number) {
  return useQuery({
    queryKey: ["friends", "list", query, page],
    queryFn: async () => {
      const params: Record<string, any> = { page, page_size: 20 };
      if (query) params.q = query;
      const res = await customInstance<FriendsResponse>({
        url: `/friends/`,
        method: "GET",
        params,
      });
      return res;
    },
    staleTime: 1000 * 30,
  });
}

export function FriendsListPage() {
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useFriendsList(query, currentPage);

  const friends = useMemo(() => data?.friends || [], [data?.friends]);

  const removeFriendMutation = useMutation({
    mutationFn: (friendId: string) =>
      customInstance({
        url: `/friends/${friendId}/`,
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Đã hủy kết bạn");
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: () => {
      toast.error("Lỗi khi hủy kết bạn");
    },
  });

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setQuery(searchInput.trim());
      setCurrentPage(1);
    },
    [searchInput]
  );

  const handleRemoveFriend = (friendId: string, name: string) => {
    if (confirm(`Bạn có chắc muốn hủy kết bạn với ${name}?`)) {
      removeFriendMutation.mutate(friendId);
    }
  };

  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Bạn bè
          </h1>
          <p className="text-sm text-muted-foreground">
            {total > 0
              ? `Bạn có ${total} bạn bè`
              : "Danh sách bạn bè của bạn"}
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

      {!isLoading && friends.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">
              {query ? "Không tìm thấy bạn bè" : "Chưa có bạn bè nào"}
            </p>
            <p className="text-sm mt-1">
              {query ? "Thử tìm kiếm với từ khóa khác." : "Hãy kết bạn với mọi người!"}
            </p>
            {!query && (
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
                    onClick={() => navigate(`/messages?user=${friend.user.username}`)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Nhắn tin
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveFriend(friend.id, friend.user.display_name || friend.user.username)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Trang trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}
