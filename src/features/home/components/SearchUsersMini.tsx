import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getProfile, extractUserIdFromTenantSlug } from '@/lib/api/profileApi';
import { callCreateRoom, callGetDMRoom } from '@/features/message/services/messageApi';
import { useRoomManager } from '@/features/message/hooks/useRoomManager';
import type { ProfileResponse } from '@/types/profile.types';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MessageCircle } from 'lucide-react';

export const SearchUsersMini: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<ProfileResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const currentUserId = tenantSlug ? extractUserIdFromTenantSlug(tenantSlug) : null;

  // Debug: Log component state
  console.log('[SearchUsersMini] Component state:', {
    tenantSlug,
    currentUserId,
    searchQuery,
    hasResult: !!searchResult,
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
    setSearchResult(null);

    try {
      const response = await getProfile(searchQuery.trim(), tenantSlug);
      console.log('[SearchUsersMini] API response:', response);

      // Axios interceptor đã unwrap { success, data } -> response.data là user object trực tiếp
      if (response.data) {
        setSearchResult(response.data);
        console.log('[SearchUsersMini] Result set:', response.data);
      }
    } catch (err: any) {
      console.error('[SearchUsersMini] Search failed:', err);
      console.error('[SearchUsersMini] Error details:', err.response?.data);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const { createRoom } = useRoomManager({ userId: currentUserId || '' });

  const handleStartChat = async (targetUserId: string, targetDisplayName?: string) => {
    if (!currentUserId) {
      console.error('[SearchUsersMini] No current user ID');
      return;
    }

    setCreatingRoom(true);
    try {
      // Check if DM room already exists
      try {
        const dmResp = await callGetDMRoom(currentUserId, targetUserId);
        const existingRoomId = dmResp?.data?.id || dmResp?.data?.room?.id || dmResp?.data?.room_id || dmResp?.data?.roomId;
        if (existingRoomId) {
          navigate(`/messages/${existingRoomId}?user_id=${currentUserId}`);
          setSearchQuery('');
          setSearchResult(null);
          setCreatingRoom(false);
          return;
        }
      } catch (err) {
        // ignore and fallback to creating a room
      }

      // Use createRoom from room manager so members/display names are populated
      // and set the room name to the recipient's display name when available
      const roomId = await createRoom(targetDisplayName || '', [currentUserId, targetUserId]);

      if (roomId) {
        // Navigate với user_id tự động điền sẵn để WebSocket connect đúng
        console.log('[SearchUsersMini] ✅ Room created, navigating to:', {
          roomId,
          currentUserId,
        });
        navigate(`/messages/${roomId}?user_id=${currentUserId}`);

        // Reset search state
        setSearchQuery('');
        setSearchResult(null);
      } else {
        console.error('[SearchUsersMini] Room ID not found in response');
      }
    } catch (err: any) {
      console.error('[SearchUsersMini] Create room failed:', err);
      console.error('[SearchUsersMini] Error details:', err.response?.data);
      alert('Không thể tạo phòng chat. Vui lòng thử lại.');
    } finally {
      setCreatingRoom(false);
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
          <Input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} placeholder="Tên hoặc email..." className="flex-1 text-sm" disabled={loading} />
          <Button size="sm" onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {searchResult && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Avatar className="w-10 h-10">
              {searchResult.avatar_path ? (
                <img src={searchResult.avatar_path} alt={searchResult.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary text-white flex items-center justify-center text-sm font-semibold">{searchResult.display_name.charAt(0).toUpperCase()}</div>
              )}
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{searchResult.display_name}</p>
              <p className="text-xs text-gray-500 truncate">{searchResult.username}</p>
            </div>

            <Button size="sm" variant="ghost" onClick={() => handleStartChat(searchResult.username || searchResult.id, searchResult.display_name)} disabled={creatingRoom || searchResult.id === currentUserId} className="flex-shrink-0">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
