import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/features/shared/components/Avatar';
import { Search, UserPlus, UserCheck, Clock, UserX, Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/api/transforms';
import { searchApi } from '@/lib/api/services/search';
import { friendsApi } from '@/lib/api/services/friends';
import { useAuthStore } from '@/stores/authStore';
import { usersApi } from '@/lib/api/services';
import { extractUserIdFromTenantSlug } from '@/lib/api/utils';
import { callGetDMRoom, callCreateRoom } from '@/features/message/services/messageApi';
import { useFriendActions } from '@/lib/api/hooks/useFriends';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/lib/api/types/user.types';

interface SearchUser extends User {
  friendshipStatus: 'none' | 'friends' | 'request_sent' | 'request_received';
  friendRequestId: string | null;
}

function FriendshipStatusBadge({ status }: { status: SearchUser['friendshipStatus'] }) {
  switch (status) {
    case 'friends':
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <UserCheck className="h-3 w-3 mr-1" />
          Bạn bè
        </Badge>
      );
    case 'request_sent':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          <Clock className="h-3 w-3 mr-1" />
          Đã gửi lời mời
        </Badge>
      );
    case 'request_received':
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
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [creatingRoomFor, setCreatingRoomFor] = useState<string | null>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const addProcessing = (id: string) => setProcessingIds(prev => new Set(prev).add(id));
  const removeProcessing = (id: string) =>
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  // Replace generic search endpoint with exact-profile lookup
  const [data, setData] = useState<{ users: User[]; total: number } | undefined>(undefined);
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
        // Call search users endpoint for multiple results
        const { users } = await searchApi.searchUsers({ q: query.trim(), pageSize: 20 });
        if (!mounted) return;

        // Check friendship status for each user
        const usersWithStatus: SearchUser[] = await Promise.all(
          users.map(async u => {
            if (!currentUserId || u.id === currentUserId) {
              return { ...u, friendshipStatus: 'none' as const, friendRequestId: null };
            }
            try {
              const status = await friendsApi.checkFriendship(u.id);
              if (status.is_friend) {
                return { ...u, friendshipStatus: 'friends' as const, friendRequestId: null };
              } else if (status.is_requested) {
                return { ...u, friendshipStatus: 'request_sent' as const, friendRequestId: null };
              } else if (status.is_received) {
                return { ...u, friendshipStatus: 'request_received' as const, friendRequestId: null };
              }
              return { ...u, friendshipStatus: 'none' as const, friendRequestId: null };
            } catch {
              return { ...u, friendshipStatus: 'none' as const, friendRequestId: null };
            }
          })
        );

        if (!mounted) return;
        setData({ users: usersWithStatus, total: usersWithStatus.length });
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
  }, [query, currentUserId]);

  const { sendRequest, acceptRequest, cancelRequest } = useFriendActions();

  // Optimistically update a user's status in the search results cache
  const updateUserStatus = (userId: string, newStatus: SearchUser['friendshipStatus'], requestId?: string | null) => {
    qc.setQueryData(['search', 'users', { q: query }], (old: { users: SearchUser[]; total: number } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        users: old.users.map(u => (u.id === userId ? { ...u, friendshipStatus: newStatus, friendRequestId: requestId ?? u.friendRequestId } : u)),
      };
    });
  };

  const handleSendRequest = async (userId: string) => {
    addProcessing(userId);
    try {
      const res = await sendRequest({ addressee_id: userId });
      toast.success('Đã gửi lời mời kết bạn');
      const requestId = res?.id || null;
      updateUserStatus(userId, 'request_sent', requestId ? String(requestId) : null);
      qc.invalidateQueries({ queryKey: ['friends'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      removeProcessing(userId);
    }
  };

  const handleAcceptRequest = async (userId: string, requestId: string) => {
    addProcessing(userId);
    try {
      await acceptRequest(requestId);
      toast.success('Đã chấp nhận lời mời kết bạn');
      updateUserStatus(userId, 'friends');
      qc.invalidateQueries({ queryKey: ['friends'] });
    } catch (_err) {
      toast.error('Lỗi khi chấp nhận lời mời');
    } finally {
      removeProcessing(userId);
    }
  };

  const handleCancelRequest = async (userId: string, requestId: string) => {
    addProcessing(userId);
    try {
      await cancelRequest(requestId);
      toast.success('Đã hủy lời mời kết bạn');
      updateUserStatus(userId, 'none', null);
      qc.invalidateQueries({ queryKey: ['friends'] });
    } catch (_err) {
      toast.error('Lỗi khi hủy lời mời');
    } finally {
      removeProcessing(userId);
    }
  };

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
                return;
              }
            } catch (err: any) {
              if (err?.response?.status !== 404) {
                console.warn('[SearchPage] callGetDMRoom failed', err);
              }
            }

            // 2. Create new DM room — use UUID from search result, get my display name once
            const targetDisplayName = user.displayName || user.username || user.email || user.id;
            let myDisplayName: string | undefined;
            try {
              const me = await usersApi.getMe();
              myDisplayName = (me as any)?.displayName || (me as any)?.display_name || (me as any)?.username || (me as any)?.email;
            } catch (e) {
              console.error('[SearchPage] getMe failed', e);
            }
            if (!myDisplayName) {
              toast.error('Không lấy được tên hiển thị của bạn. Vui lòng cập nhật tên hiển thị.');
              return;
            }

            const res = await callCreateRoom({
              name: null as unknown as string,
              type: 'dm',
              members: [
                { user_id: currentUserId, display_name: myDisplayName },
                { user_id: user.id, display_name: targetDisplayName },
              ],
              creator_id: currentUserId,
            } as any);
            const roomId = res?.data?.id ?? (res?.data as any)?.room_id ?? null;
            if (roomId) {
              navigate(`/messages/${roomId}?user_id=${currentUserId}`);
            } else {
              toast.error('Tạo phòng chat thất bại');
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

    switch (user.friendshipStatus) {
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
              onClick={() => user.friendRequestId && handleCancelRequest(user.id, user.friendRequestId)}
              disabled={isProcessing || !user.friendRequestId}
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
            <Button size="sm" className="flex-shrink-0 rounded-full" onClick={() => user.friendRequestId && handleAcceptRequest(user.id, user.friendRequestId)} disabled={isProcessing || !user.friendRequestId}>
              {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <UserCheck className="h-4 w-4 mr-1" />}
              Chấp nhận
            </Button>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            {messageButton}
            <Button variant="outline" size="sm" className="flex-shrink-0 rounded-full" onClick={() => handleSendRequest(user.id)} disabled={isProcessing}>
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
                <Link to={`/profile/${user.username || user.email}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar user={user as any} size="lg" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{user.displayName || user.username}</p>
                      <FriendshipStatusBadge status={user.friendshipStatus} />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">@{user.username || user.email}</p>
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
