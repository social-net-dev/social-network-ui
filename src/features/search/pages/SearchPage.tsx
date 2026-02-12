import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/features/shared/components/Avatar";
import { Search, UserPlus, UserCheck, Clock, UserX, Loader2 } from "lucide-react";
import { customInstance } from "@/lib/axios-instance";
import { buildMediaUrl } from "@/lib/api/transforms/common";
import { createFriendRequestFriendsRequestsPost } from "@/lib/api/generated/friends/friends";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface SearchUser {
  id: string;
  display_name: string;
  username: string;
  email: string;
  avatar_path: string;
  bio: string;
  friendship_status: "none" | "friends" | "request_sent" | "request_received";
  friend_request_id: string | null;
}

function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["search", "users", query],
    queryFn: async () => {
      if (!query || query.length < 2) return { users: [], total: 0 };
      const res = await customInstance<{ users: SearchUser[]; total: number }>({
        url: `/search/users/`,
        method: "GET",
        params: { q: query, limit: 20 },
      });
      return res;
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 30,
  });
}

function FriendshipStatusBadge({ status }: { status: SearchUser["friendship_status"] }) {
  switch (status) {
    case "friends":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <UserCheck className="h-3 w-3 mr-1" />
          Bạn bè
        </Badge>
      );
    case "request_sent":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          <Clock className="h-3 w-3 mr-1" />
          Đã gửi lời mời
        </Badge>
      );
    case "request_received":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <UserPlus className="h-3 w-3 mr-1" />
          Đã gửi cho bạn
        </Badge>
      );
    default:
      return null;
  }
}

export function SearchPage() {
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const qc = useQueryClient();

  const { data, isLoading, isError } = useSearchUsers(query);

  const sendRequestMutation = useMutation({
    mutationFn: (username: string) =>
      createFriendRequestFriendsRequestsPost({ addressee_username: username }),
    onSuccess: () => {
      toast.success("Đã gửi lời mời kết bạn");
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["search", "users", query] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err?.response?.data?.detail || "Lỗi khi gửi lời mời";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) =>
      customInstance({ url: `/friends/requests/${requestId}/accept/`, method: "POST" }),
    onSuccess: () => {
      toast.success("Đã chấp nhận lời mời kết bạn");
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["search", "users", query] });
    },
    onError: () => {
      toast.error("Lỗi khi chấp nhận lời mời");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) =>
      customInstance({ url: `/friends/requests/${requestId}/cancel/`, method: "POST" }),
    onSuccess: () => {
      toast.success("Đã hủy lời mời kết bạn");
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["search", "users", query] });
    },
    onError: () => {
      toast.error("Lỗi khi hủy lời mời");
    },
  });

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setQuery(searchInput.trim());
    },
    [searchInput]
  );

  const users = data?.users || [];
  const total = data?.total || 0;
  const busy = sendRequestMutation.isPending || acceptMutation.isPending || cancelMutation.isPending;

  const renderAction = (user: SearchUser) => {
    switch (user.friendship_status) {
      case "friends":
        return (
          <Button variant="secondary" size="sm" className="flex-shrink-0 rounded-full" disabled>
            <UserCheck className="h-4 w-4 mr-1" />
            Bạn bè
          </Button>
        );
      case "request_sent":
        return (
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 rounded-full text-yellow-600 border-yellow-300 hover:bg-yellow-50"
            onClick={() => user.friend_request_id && cancelMutation.mutate(user.friend_request_id)}
            disabled={busy}
          >
            <UserX className="h-4 w-4 mr-1" />
            Hủy lời mời
          </Button>
        );
      case "request_received":
        return (
          <Button
            size="sm"
            className="flex-shrink-0 rounded-full"
            onClick={() => user.friend_request_id && acceptMutation.mutate(user.friend_request_id)}
            disabled={busy}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Chấp nhận
          </Button>
        );
      default:
        return (
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 rounded-full"
            onClick={() => sendRequestMutation.mutate(user.username || user.email)}
            disabled={busy}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Kết bạn
          </Button>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Search className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tìm kiếm</h1>
          <p className="text-sm text-muted-foreground">
            Tìm kiếm người dùng, bạn bè theo tên, username hoặc email.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Nhập tên, username hoặc email..."
          className="flex-1"
        />
        <Button type="submit" disabled={searchInput.trim().length < 2}>
          <Search className="h-4 w-4 mr-2" />
          Tìm kiếm
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
            Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại.
          </CardContent>
        </Card>
      )}

      {query && !isLoading && users.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Không tìm thấy kết quả</p>
            <p className="text-sm mt-1">
              Thử tìm kiếm với từ khóa khác.
            </p>
          </CardContent>
        </Card>
      )}

      {users.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tìm thấy {total} kết quả cho "{query}"
          </p>
          {users.map((user: SearchUser) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <Link
                  to={`/profile/${user.username || user.email}`}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <Avatar
                    user={{
                      id: user.id,
                      displayName: user.display_name,
                      username: user.username,
                      avatar: buildMediaUrl(user.avatar_path),
                    }}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">
                        {user.display_name || user.username}
                      </p>
                      <FriendshipStatusBadge status={user.friendship_status} />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      @{user.username || user.email}
                    </p>
                    {user.bio && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </Link>
                {renderAction(user)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
