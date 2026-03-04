import { Badge } from '@/components/ui/badge';
import { UserCheck, Clock, UserPlus } from 'lucide-react';

interface FriendshipStatusBadgeProps {
  status: string | undefined;
}

export function FriendshipStatusBadge({ status }: FriendshipStatusBadgeProps) {
  switch (status) {
    case 'friends':
    case 'FRIENDS':
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <UserCheck className="h-3 w-3 mr-1" />
          Bạn bè
        </Badge>
      );
    case 'request_sent':
    case 'REQUEST_SENT':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          <Clock className="h-3 w-3 mr-1" />
          Đã gửi lời mời
        </Badge>
      );
    case 'request_received':
    case 'REQUEST_RECEIVED':
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
