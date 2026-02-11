import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getProfile, extractUserIdFromTenantSlug } from '@/lib/api/profileApi';
import { callCreateRoom } from '@/features/message/services/messageApi';
import type { ProfileResponse } from '@/types/profile.types';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const SearchUsers: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<ProfileResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Get current user ID from tenant slug
  const currentUserId = tenantSlug ? extractUserIdFromTenantSlug(tenantSlug) : null;

  // Debug: Log component state
  console.log('[SearchUsers] Component state:', {
    tenantSlug,
    currentUserId,
    searchQuery,
    hasResult: !!searchResult,
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
    setSearchResult(null);

    try {
      const response = await getProfile(searchQuery.trim(), tenantSlug);
      console.log('[SearchUsers] API response:', response);

      // Axios interceptor đã unwrap { success, data } -> response.data là user object trực tiếp
      if (response.data) {
        setSearchResult(response.data);
        console.log('[SearchUsers] Result set:', response.data);
      } else {
        setError('Không tìm thấy người dùng');
      }
    } catch (err: any) {
      console.error('[SearchUsers] Search failed:', err);
      console.error('[SearchUsers] Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Không tìm thấy người dùng');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (userId: string) => {
    if (!currentUserId) {
      alert('Không xác định được user hiện tại');
      return;
    }

    setCreatingRoom(true);
    try {
      // Create 1-1 room with the selected user
      const roomPayload = {
        name: '',
        type: 'direct',
        member_ids: [currentUserId, userId],
        creator_id: currentUserId,
      };

      const response = await callCreateRoom(roomPayload);
      const roomId = response.data?.id;

      if (roomId) {
        // Navigate to the chat page
        navigate(`/messages/${roomId}?user_id=${currentUserId}`);
      } else {
        alert('Tạo phòng chat thất bại');
      }
    } catch (err) {
      console.error('Create room failed:', err);
      alert('Không thể tạo phòng chat');
    } finally {
      setCreatingRoom(false);
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
        <h2 className="text-2xl font-semibold mb-4">Tìm kiếm người dùng</h2>
        <div className="flex gap-3">
          <Input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={handleKeyPress} placeholder="Nhập email hoặc tên người dùng (vd: alice2@test.com)" className="flex-1" disabled={loading} />
          <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </Button>
        </div>

        {error && <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">{error}</div>}
      </div>

      {/* Search Results */}
      {searchResult && (
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Kết quả tìm kiếm</h3>
          <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {/* Avatar */}
            <Avatar className="w-16 h-16">
              {searchResult.avatar_path ? (
                <img src={searchResult.avatar_path} alt={searchResult.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary text-white flex items-center justify-center text-xl font-semibold">{searchResult.display_name.charAt(0).toUpperCase()}</div>
              )}
            </Avatar>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-lg">{searchResult.display_name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{searchResult.username}</p>
              {searchResult.bio && <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">{searchResult.bio}</p>}
            </div>

            {/* Action Button */}
            <Button onClick={() => handleStartChat(searchResult.id)} disabled={creatingRoom || searchResult.id === currentUserId} className="flex-shrink-0">
              {creatingRoom ? 'Đang tạo...' : searchResult.id === currentUserId ? 'Bạn' : 'Nhắn tin'}
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!searchResult && !loading && !error && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>Nhập tên người dùng để bắt đầu tìm kiếm</p>
        </div>
      )}
    </div>
  );
};
