import { Heart, MessageCircle, UserPlus, AtSign, Bell } from "lucide-react";
import type { Notification, NotificationType } from "@/types/notification";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClose?: () => void;
}

const ICON_MAP: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
  system: Bell,
};

const ICON_COLORS: Record<NotificationType, string> = {
  like: "text-red-500",
  comment: "text-blue-500",
  follow: "text-green-500",
  mention: "text-yellow-500",
  system: "text-gray-500",
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "vừa xong";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
  return `${Math.floor(seconds / 604800)} tuần trước`;
}

export function NotificationItem({ notification, onMarkAsRead, onClose }: NotificationItemProps) {
  const Icon = ICON_MAP[notification.type];
  const iconColor = ICON_COLORS[notification.type];
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      onClose?.();
      navigate(notification.actionUrl);
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-accent",
        !notification.isRead && "bg-primary/5",
        notification.actionUrl && "hover:bg-accent"
      )}
      onClick={handleClick}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={notification.avatar} alt="Avatar" />
          <AvatarFallback>
            {notification.title.split(" ")[0].charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-background flex items-center justify-center",
            iconColor
          )}
        >
          <Icon className="w-3 h-3" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground line-clamp-2">
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>

      {!notification.isRead && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-primary rounded-full" />
        </div>
      )}
    </div>
  );
}
