import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/features/shared/components/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, UserCheck, Loader2, UserX } from 'lucide-react';
import { customInstance } from '@/lib/axios-instance';
import { FriendsAPI } from '@/lib/api/generated';
import { toast } from 'sonner';

interface SearchUser {
  id: string;
  display_name: string;
  username: string;
  email: string;
  avatar_path: string;
  bio: string;
  friendship_status: 'none' | 'friends' | 'request_sent' | 'request_received';
  friend_request_id: string | null;
}

export const SearchUsersMini: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) return;

    setLoading(true);
    setResults([]);
    try {
      const res = await customInstance<{ users: SearchUser[]; total: number }>({
        url: '/search/users/',
        method: 'GET',
        params: { q, limit: 5 },
      });
      setResults(res.users || []);
    } catch (err) {
      console.error('[SearchUsersMini] Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (user: SearchUser) => {
    setProcessingId(user.id);
    try {
      await FriendsAPI.createFriendRequestFriendsRequestsPost({
        addressee_username: user.username,
      });
      setResults(prev =>
        prev.map(u => (u.id === user.id ? { ...u, friendship_status: 'request_sent' as const } : u))
      );
      toast.success('Đã gửi lời mời kết bạn');
    } catch (err) {
      console.error('[SearchUsersMini] Send request failed:', err);
      toast.error('Lỗi khi gửi lời mời');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAccept = async (user: SearchUser) => {
    if (!user.friend_request_id) return;
    setProcessingId(user.id);
    try {
      await customInstance({ url: `/friends/requests/${user.friend_request_id}/accept/`, method: 'POST' });
      setResults(prev =>
        prev.map(u => (u.id === user.id ? { ...u, friendship_status: 'friends' as const } : u))
      );
      toast.success('Đã chấp nhận lời mời kết bạn');
    } catch (err) {
      console.error('[SearchUsersMini] Accept failed:', err);
      toast.error('Lỗi khi chấp nhận');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (user: SearchUser) => {
    if (!user.friend_request_id) return;
    setProcessingId(user.id);
    try {
      await customInstance({ url: `/friends/requests/${user.friend_request_id}/cancel/`, method: 'POST' });
      setResults(prev =>
        prev.map(u => (u.id === user.id ? { ...u, friendship_status: 'none' as const, friend_request_id: null } : u))
      );
      toast.success('Đã hủy lời mời');
    } catch (err) {
      console.error('[SearchUsersMini] Cancel failed:', err);
      toast.error('Lỗi khi hủy lời mời');
    } finally {
      setProcessingId(null);
    }
  };

  const renderStatusButton = (user: SearchUser) => {
    const isProcessing = processingId === user.id;
    switch (user.friendship_status) {
      case 'friends':
        return (
          <Badge variant="secondary" className="text-xs gap-1">
            <UserCheck className="h-3 w-3" /> Bạn bè
          </Badge>
        );
      case 'request_sent':
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleCancel(user)}
            disabled={isProcessing}
            className="h-7 px-2 text-yellow-600 hover:text-yellow-700"
            title="Hủy lời mời"
          >
            {isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserX className="h-3.5 w-3.5" />
            )}
          </Button>
        );
      case 'request_received':
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAccept(user)}
            disabled={isProcessing}
            className="h-7 px-2 text-primary"
            title="Chấp nhận"
          >
            {isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserCheck className="h-3.5 w-3.5" />
            )}
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleSendRequest(user)}
            disabled={isProcessing}
            className="h-7 px-2"
          >
            {isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserPlus className="h-3.5 w-3.5" />
            )}
          </Button>
        );
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
          <Input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Tên, username hoặc email..."
            className="flex-1 text-sm"
            disabled={loading}
          />
          <Button size="sm" onClick={handleSearch} disabled={loading || searchQuery.trim().length < 2}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/profile/${user.username}`)}
              >
                <Avatar user={user} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                </div>
                <div onClick={e => e.stopPropagation()}>
                  {renderStatusButton(user)}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && searchQuery.trim().length >= 2 && results.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">Không tìm thấy kết quả</p>
        )}
      </CardContent>
    </Card>
  );
};
