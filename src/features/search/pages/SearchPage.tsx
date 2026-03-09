import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/features/shared/components/Avatar';
import { Search, UserCheck, UserX, Loader2, UserPlus } from 'lucide-react';
import { profilesGetProfile, usersGetMe } from '@/lib/api/generated';
import { useAuthStore } from '@/stores/authStore';
import { extractUserIdFromTenantSlug } from '@/lib/api/utils';
import { callGetDMRoom } from '@/features/message/services/messageApi';
import { useRoomManager } from '@/features/message/hooks/useRoomManager';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import type { UserPublic } from '@/lib/api/types';
import { FriendshipStatusBadge } from '@/features/friends/components/FriendshipStatusBadge';
import { useFriendActions } from '@/features/friends/hooks/useFriendActions';

interface SearchUser extends UserPublic {
}

export function SearchPage() {
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [creatingRoomFor, setCreatingRoomFor] = useState<string | null>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Replace generic search endpoint with exact-profile lookup
  const [data, setData] = useState<{ users: UserPublic[]; total: number } | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Messaging helpers
  const { tenantSlug, user: authUser } = useAuthStore();
  const currentUserId = tenantSlug ? extractUserIdFromTenantSlug(tenantSlug) : ((authUser as any)?.id ?? null);

  React.useEffect(() => {
    let mounted = true;
    if (!query || query.trim().length === 0) {
      setData(undefined);
      setIsError(false);
      setIsLoading(false);
      return;
    }

    (async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        // Call exact-match profile endpoint instead of search list
        const resp = await profilesGetProfile(query.trim());
        const p = resp;
        if (!mounted) return;
        setData({ users: p ? [p] : [], total: p ? 1 : 0 });
      } catch (err: any) {
        console.error('[SearchPage] searchApi.searchUsers error', err);
        if (!mounted) return;
        setData({ users: [], total: 0 });
        setIsError(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [query]);


  // Optimistically update a user's status in local state
  const updateUserStatus = useCallback((userId: string, newStatus: string | undefined, requestId?: string | null) => {
    qc.setQueryData(['search', 'users', { q: query }], (old: { users: SearchUser[]; total: number } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        users: old.users.map(u =>
          u.id === userId
            ? {
                ...u,
                viewer_context: {
                  ...u.viewer_context,
                  is_owner: u.viewer_context?.is_owner ?? false,
                  is_friend: newStatus === 'friends',
                  friendship_status: newStatus,
                  friend_request_id: requestId ?? u.viewer_context?.friend_request_id,
                },
              }
            : u
        ),
      };
    });
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        users: prev.users.map(u =>
          u.id === userId
            ? {
                ...u,
                viewer_context: {
                  ...u.viewer_context,
                  is_owner: u.viewer_context?.is_owner ?? false,
                  is_friend: newStatus === 'friends',
                  friendship_status: newStatus,
                  friend_request_id: requestId ?? u.viewer_context?.friend_request_id,
                },
              }
            : u
        ),
      };
    });
  }, [qc, query]);

  const { createRoom } = useRoomManager({ userId: currentUserId || '' });
  const { processingIds, sendRequest: handleSendRequest, acceptRequest: handleAcceptRequest, cancelRequest: handleCancelRequest } = useFriendActions({
    onStatusChange: updateUserStatus,
  });

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setQuery(searchInput.trim());
    },
    [searchInput]
  );

  const users = (data?.users || []) as SearchUser[];
  const total = data?.total || 0;

  const renderAction = (user: SearchUser) => {
    const isProcessing = processingIds.has(user.id);
    const messageButton = (
      <Button
        size="sm"
        className="flex-shrink-0 rounded-full"
        onClick={async () => {
          if (!currentUserId) return;
          setCreatingRoomFor(user.id);
          try {
            // 1. Check if DM room already exists
            try {
              const dmResp = await callGetDMRoom(currentUserId, user.id);
              const existingRoomId = dmResp?.data?.id || dmResp?.data?.room?.id || dmResp?.data?.room_id || dmResp?.data?.roomId;
              if (existingRoomId) {
                navigate(`/messages/${existingRoomId}?user_id=${currentUserId}`);
                setCreatingRoomFor(null);
                return;
              }
            } catch (err: any) {
              if (err?.response?.status !== 404) {
                console.warn('[SearchPage] callGetDMRoom failed', err);
              }
            }

            // 2. Create new DM room — fetch display names via API
            try {
              const meResp = await usersGetMe();
              const me = meResp;
              const myDisplay = me?.display_name || null;
              const otherDisplay = user.display_name || null;
              if (!myDisplay || !otherDisplay) {
                toast.error('Cần display name hợp lệ của cả hai người để tạo phòng. Vui lòng cập nhật tên hiển thị.');
                return;
              }
              const roomDisplay = `${myDisplay} & ${otherDisplay}`;
              const myUsername = me?.username || null;
              const otherUsername = user.username || null;
              if (!myUsername || !otherUsername) {
                toast.error('Không thể xác định username của một trong hai người.');
                return;
              }
              const roomId = await createRoom(roomDisplay, [myUsername, otherUsername]);
              if (roomId) {
                navigate(`/messages/${roomId}?user_id=${currentUserId}`);
              } else {
                toast.error('Tạo phòng chat thất bại');
              }
            } catch (e) {
              console.error('[SearchPage] create DM failed', e);
              toast.error('Không thể tạo phòng chat');
            }
          } catch (e) {
            console.error('[SearchPage] create DM failed', e);
            toast.error('Không thể tạo phòng chat');
          } finally {
            setCreatingRoomFor(null);
          }
        }}
        disabled={creatingRoomFor === user.id || user.id === currentUserId}
      >
        {creatingRoomFor === user.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-1" />}
        Nhắn tin
      </Button>
    );

    switch (user.viewer_context?.friendship_status) {
      case 'friends':
        return (
          <div className="flex items-center gap-2">
            {messageButton}
            <Button variant="secondary" size="sm" className="flex-shrink-0 rounded-full" disabled>
              <UserCheck className="h-4 w-4 mr-1" />
              Bạn bè
            </Button>
          </div>
        );
      case 'request_sent':
        return (
          <div className="flex items-center gap-2">
            {messageButton}
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 rounded-full text-yellow-600 border-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
              onClick={() => user.viewer_context?.friend_request_id && handleCancelRequest(user.id, user.viewer_context.friend_request_id)}
              disabled={isProcessing || !user.viewer_context?.friend_request_id}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <UserX className="h-4 w-4 mr-1" />}
              Hủy lời mời
            </Button>
          </div>
        );
      case 'request_received':
        return (
          <div className="flex items-center gap-2">
            {messageButton}
            <Button size="sm" className="flex-shrink-0 rounded-full" onClick={() => user.viewer_context?.friend_request_id && handleAcceptRequest(user.id, user.viewer_context.friend_request_id)} disabled={isProcessing || !user.viewer_context?.friend_request_id}>
              {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <UserCheck className="h-4 w-4 mr-1" />}
              Chấp nhận
            </Button>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            {messageButton}
            <Button variant="outline" size="sm" className="flex-shrink-0 rounded-full" onClick={() => handleSendRequest(user.id, user.username || '')} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />}
              Kết bạn
            </Button>
          </div>
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
          <p className="text-sm text-muted-foreground">Tìm kiếm người dùng, bạn bè theo tên, username hoặc email.</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <Input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Nhập tên, username hoặc email..." className="flex-1" />
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
          <CardContent className="p-6 text-center text-destructive">Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại.</CardContent>
        </Card>
      )}

      {query && !isLoading && users.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Không tìm thấy kết quả</p>
            <p className="text-sm mt-1">Thử tìm kiếm với từ khóa khác.</p>
          </CardContent>
        </Card>
      )}

      {users.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tìm thấy {total} kết quả cho &ldquo;{query}&rdquo;
          </p>
          {users.map(user => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <Link to={`/profile/${user.username}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar user={user as any} size="lg" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{user.display_name || user.username}</p>
                      <FriendshipStatusBadge status={user.viewer_context?.friendship_status} />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                    {user.bio && <p className="text-xs text-muted-foreground truncate mt-0.5">{user.bio}</p>}
                  </div>
                </Link>
                <div onClick={e => e.stopPropagation()}>{renderAction(user)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
