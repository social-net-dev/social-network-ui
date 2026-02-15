import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { profilesApi } from '@/lib/api/services';
import { extractUserIdFromTenantSlug } from '@/lib/api/utils';
import { callGetDMRoom } from '@/features/message/services/messageApi';
import { useRoomManager } from '@/features/message/hooks/useRoomManager';
import { usersApi } from '@/lib/api/services';
import type { User } from '@/lib/api/types/user.types';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Loader2 } from 'lucide-react';

export const SearchUsers: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingRoomFor, setCreatingRoomFor] = useState<string | null>(null);

  // Get current user ID from tenant slug
  const currentUserId = tenantSlug ? extractUserIdFromTenantSlug(tenantSlug) : null;

  // Debug: Log component state
  console.log('[SearchUsers] Component state:', {
    tenantSlug,
    currentUserId,
    searchQuery,
    resultsCount: searchResults.length,
    loading,
    error,
  });

  const handleSearch = async () => {
    console.log('[SearchUsers] handleSearch called!');
    console.log('[SearchUsers] searchQuery:', searchQuery);
    console.log('[SearchUsers] tenantSlug:', tenantSlug);

    if (!searchQuery.trim()) {
      setError('Vui lòng nhập tên người dùng');
      console.log('[SearchUsers] Empty search query');
      return;
    }

    if (!tenantSlug) {
      setError('Không tìm thấy tenant slug. Vui lòng đăng nhập lại.');
      console.log('[SearchUsers] No tenantSlug found!');
      return;
    }

    console.log('[SearchUsers] Starting search:', { query: searchQuery, tenantSlug });
    setLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      // Gọi trực tiếp profilesApi để tìm theo username/email (exact match)
      const p = await profilesApi.getProfile(searchQuery.trim());
      if (p) {
        setSearchResults([p as User]);
        setError(null);
      } else {
        setError('Không tìm thấy người dùng');
        setSearchResults([]);
      }
    } catch (err: any) {
      console.error('[SearchUsers] profilesApi search error:', err);
      setError(err?.response?.data?.message || 'Không tìm thấy người dùng');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const { createRoom } = useRoomManager({ userId: currentUserId || '' });

  const handleStartChat = async (targetUser: User) => {
    if (!currentUserId) {
      alert('Không xác định được user hiện tại');
      return;
    }

    setCreatingRoomFor(targetUser.id);
    try {
      const me = await usersApi.getMe();
      const myDisplay = (me as any)?.displayName || (me as any)?.display_name || null;
      const myUsername = (me as any)?.username || (me as any)?.email || null;
      const otherDisplay = (targetUser as any).displayName || (targetUser as any).display_name || null;
      const otherUsername = targetUser.username || targetUser.email || null;

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

      // Check existing DM by UUID (backend expects UUIDs)
      try {
        if (currentUserId && targetUser.id) {
          const dmResp = await callGetDMRoom(currentUserId, targetUser.id);
          const existingRoomId = dmResp?.data?.id || dmResp?.data?.room?.id || dmResp?.data?.room_id || dmResp?.data?.roomId;
          if (existingRoomId) {
            navigate(`/messages/${existingRoomId}?user_id=${currentUserId}`);
            setCreatingRoomFor(null);
            return;
          }
        }
      } catch (err) {
        console.warn('[SearchUsers] callGetDMRoom failed (lookup by UUID)', err);
      }

      try {
        const roomDisplay = `${myDisplay} & ${otherDisplay}`;
        const roomId = await createRoom(roomDisplay, [myUsername, otherUsername]);
        if (roomId) {
          navigate(`/messages/${roomId}?user_id=${currentUserId}`);
        } else {
          alert('Tạo phòng chat thất bại');
        }
      } catch (err) {
        console.error('Create room failed:', err);
        alert('Không thể tạo phòng chat');
      }
    } catch (err) {
      console.error('Create room failed:', err);
      alert('Không thể tạo phòng chat');
    } finally {
      setCreatingRoomFor(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Search Section */}
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Tìm kiếm bạn bè</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Tìm kiếm theo tên, username hoặc email</p>
        <div className="flex gap-3">
          <Input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={handleKeyPress} placeholder="Nhập tên, username hoặc email (vd: thieu@gmail.com)" className="flex-1" disabled={loading} />
          <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </Button>
        </div>

        {error && <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">{error}</div>}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Kết quả tìm kiếm ({searchResults.length})</h3>
          <div className="space-y-3">
            {searchResults.map(user => (
              <div key={user.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                {/* Avatar */}
                <Avatar className="w-14 h-14 flex-shrink-0">
                  {user.avatarPath ? <img src={user.avatarPath} alt={user.displayName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary text-white flex items-center justify-center text-lg font-semibold">{user.displayName.charAt(0).toUpperCase()}</div>}
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base">{user.displayName}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>
                  {user.bio && <p className="text-sm mt-1 text-gray-700 dark:text-gray-300 line-clamp-2">{user.bio}</p>}
                </div>

                {/* Action Button */}
                <Button onClick={() => handleStartChat(user)} disabled={creatingRoomFor === user.id || user.id === currentUserId} className="flex-shrink-0 gap-2" variant={user.id === currentUserId ? 'secondary' : 'default'}>
                  {creatingRoomFor === user.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : user.id === currentUserId ? (
                    'Bạn'
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4" />
                      Nhắn tin
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && !loading && !error && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>Nhập tên, username hoặc email để bắt đầu tìm kiếm</p>
        </div>
      )}
    </div>
  );
};
