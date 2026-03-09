import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { profilesGetProfile, usersGetMe } from '@/lib/api/generated';
import { extractUserIdFromTenantSlug } from '@/lib/api/utils';
import { callGetDMRoom } from '@/features/message/services/messageApi';
import { useRoomManager } from '@/features/message/hooks/useRoomManager';
import type { UserPublic } from '@/lib/api/types';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Loader2, UserPlus, UserCheck, Clock } from 'lucide-react';

export const SearchUsers: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug, user: authUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingRoomFor, setCreatingRoomFor] = useState<string | null>(null);
  // Track per-user friend request state: userId -> 'idle' | 'sending' | 'sent' | 'friends'
  const [friendStates, setFriendStates] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'friends'>>({});

  // Get current user ID from tenant slug, fall back to user.id in auth store
  const currentUserId = tenantSlug ? extractUserIdFromTenantSlug(tenantSlug) : ((authUser as any)?.id ?? null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Vui lòng nhập tên người dùng');
      return;
    }

    if (!tenantSlug) {
      setError('Không tìm thấy tenant slug. Vui lòng đăng nhập lại.');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchResults([]);
    setFriendStates({});

    try {
      // Use Orval-generated profilesGetProfile for type-safe API call
      const response = await profilesGetProfile(searchQuery.trim());
      const p = response;
      if (p) {
        setSearchResults([p]);
        setError(null);
      } else {
        setError('Không tìm thấy người dùng');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không tìm thấy người dùng';
      console.error('[SearchUsers] profilesGetProfile error:', err);
      setError(errorMessage);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const { createRoom } = useRoomManager({ userId: currentUserId || '' });

  const handleStartChat = async (targetUser: UserPublic) => {
    if (!currentUserId) {
      alert('Không xác định được user hiện tại');
      return;
    }

    setCreatingRoomFor(targetUser.id);
    try {
      // Fetch current user info using Orval-generated usersGetMe
      const meResponse = await usersGetMe();
      const me = meResponse;
      const myDisplay = me.display_name || null;
      const otherDisplay = targetUser.display_name || null;
      const myUsername = me.username || me.email || null;
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
                  {user.avatar ? <img src={user.avatar} alt={user.display_name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary text-white flex items-center justify-center text-lg font-semibold">{user.display_name.charAt(0).toUpperCase()}</div>}
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base">{user.display_name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>
                  {user.bio && <p className="text-sm mt-1 text-gray-700 dark:text-gray-300 line-clamp-2">{user.bio}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {user.id !== currentUserId && (
                    <>
                      {/* Friend status indicator */}
                      {friendStates[user.id] === 'friends' ? (
                        <Button variant="secondary" size="sm" disabled className="gap-2">
                          <UserCheck className="h-4 w-4" />
                          Bạn bè
                        </Button>
                      ) : friendStates[user.id] === 'sent' ? (
                        <Button variant="outline" size="sm" disabled className="gap-2">
                          <Clock className="h-4 w-4" />
                          Đã gửi
                        </Button>
                      ) : (
                        <Button size="sm" className="gap-2" disabled>
                          <UserPlus className="h-4 w-4" />
                          Thêm bạn
                        </Button>
                      )}

                      {/* Chat button */}
                      <Button variant="outline" size="sm" onClick={() => handleStartChat(user)} disabled={creatingRoomFor === user.id} className="gap-2">
                        {creatingRoomFor === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                        Nhắn tin
                      </Button>
                    </>
                  )}
                  {user.id === currentUserId && (
                    <Button variant="secondary" size="sm" disabled>
                      Bạn
                    </Button>
                  )}
                </div>
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
