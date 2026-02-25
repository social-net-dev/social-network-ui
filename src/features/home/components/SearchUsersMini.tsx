import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { profilesGetProfile } from '@/lib/api/generated/profiles/profiles';
import { usersGetMe } from '@/lib/api/generated/users/users';
import { extractUserIdFromTenantSlug } from '@/lib/api/utils';
import { callGetDMRoom } from '@/features/message/services/messageApi';
import { useRoomManager } from '@/features/message/hooks/useRoomManager';
import type { UserPublic } from '@/lib/api/generated/model';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MessageCircle, Loader2 } from 'lucide-react';

export const SearchUsersMini: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingRoomFor, setCreatingRoomFor] = useState<string | null>(null);

  const currentUserId = tenantSlug ? extractUserIdFromTenantSlug(tenantSlug) : null;

  // Debug: Log component state
  console.log('[SearchUsersMini] Component state:', {
    tenantSlug,
    currentUserId,
    searchQuery,
    resultsCount: searchResults.length,
    loading,
  });

  const handleSearch = async () => {
    console.log('[SearchUsersMini] handleSearch called!');
    console.log('[SearchUsersMini] searchQuery:', searchQuery);
    console.log('[SearchUsersMini] tenantSlug:', tenantSlug);

    if (!searchQuery.trim()) {
      console.log('[SearchUsersMini] Empty search query');
      return;
    }

    if (!tenantSlug) {
      console.log('[SearchUsersMini] No tenantSlug found!');
      alert('Không tìm thấy tenant slug. Vui lòng đăng nhập lại.');
      return;
    }

    console.log('[SearchUsersMini] Starting search:', { query: searchQuery, tenantSlug });
    setLoading(true);
    setSearchResults([]);

    try {
      // Use Orval-generated profilesGetProfile for type-safe API call
      const response = await profilesGetProfile(searchQuery.trim());
      const p = response.data;
      if (p) {
        setSearchResults([p]);
      } else {
        setSearchResults([]);
      }
    } catch (err: unknown) {
      console.error('[SearchUsersMini] profilesGetProfile error:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const { createRoom } = useRoomManager({ userId: currentUserId || '' });

  const handleStartChat = async (targetUser: UserPublic) => {
    if (!currentUserId) {
      console.error('[SearchUsersMini] No current user ID');
      return;
    }

    setCreatingRoomFor(targetUser.id);
    try {
      // Fetch current user info using Orval-generated usersGetMe
      const meResponse = await usersGetMe();
      const me = meResponse.data;
      const myDisplay = me.displayName || null;
      const myUsername = me.username || me.email || null;
      const otherDisplay = targetUser.displayName || null;
      const otherUsername = targetUser.username || null;

      if (!myDisplay || !otherDisplay) {
        alert('Cần display name hợp lệ của cả hai người để tạo phòng. Vui lòng cập nhật tên hiển thị.');
        setCreatingRoomFor(null);
        return;
      }

      if (!myUsername || !otherUsername) {
        alert('Không thể xác định username của một trong hai người.');
        setCreatingRoomFor(null);
        return;
      }

      // Check if DM room already exists using UUIDs (backend expects UUIDs)
      try {
        if (currentUserId && targetUser.id) {
          const dmResp = await callGetDMRoom(currentUserId, targetUser.id);
          const existingRoomId = dmResp?.data?.id || dmResp?.data?.room?.id || dmResp?.data?.room_id || dmResp?.data?.roomId;
          if (existingRoomId) {
            navigate(`/messages/${existingRoomId}?user_id=${currentUserId}`);
            setSearchQuery('');
            setSearchResults([]);
            setCreatingRoomFor(null);
            return;
          }
          console.log('[SearchUsersMini] callGetDMRoom returned no room (200 but empty)', dmResp);
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          console.log('[SearchUsersMini] callGetDMRoom returned 404 — will create room');
        } else {
          console.warn('[SearchUsersMini] callGetDMRoom failed (lookup by UUID)', err);
        }
      }

      // Create room using usernames so profilesApi lookup succeeds
      try {
        const roomDisplay = `${myDisplay} & ${otherDisplay}`;
        const roomId = await createRoom(roomDisplay, [myUsername, otherUsername]);

        if (roomId) {
          console.log('[SearchUsersMini] ✅ Room created, navigating to:', {
            roomId,
            currentUserId,
          });
          navigate(`/messages/${roomId}?user_id=${currentUserId}`);

          // Reset search state
          setSearchQuery('');
          setSearchResults([]);
        } else {
          console.error('[SearchUsersMini] Room ID not found in response');
        }
      } catch (err: any) {
        console.error('[SearchUsersMini] Create room failed:', err);
        alert('Không thể tạo phòng chat. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('[SearchUsersMini] Create room failed:', err);
      console.error('[SearchUsersMini] Error details:', err.response?.data);
      alert('Không thể tạo phòng chat. Vui lòng thử lại.');
    } finally {
      setCreatingRoomFor(null);
    }
  };

  return (
    <Card className="border-none shadow-xl bg-white dark:bg-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-500" />
          Tìm bạn bè
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} placeholder="Tên, username hoặc email..." className="flex-1 text-sm" disabled={loading} />
          <Button size="sm" onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchResults.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  {user.avatar ? <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary text-white flex items-center justify-center text-sm font-semibold">{user.displayName.charAt(0).toUpperCase()}</div>}
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.displayName}</p>
                  <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                </div>

                <Button size="sm" variant="ghost" onClick={() => handleStartChat(user)} disabled={creatingRoomFor === user.id || user.id === currentUserId} className="flex-shrink-0">
                  {creatingRoomFor === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : user.id === currentUserId ? <span className="text-xs">Bạn</span> : <MessageCircle className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
