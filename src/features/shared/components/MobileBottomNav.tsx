import { Home, Search, PenSquare, Bell, User } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/60">
      <div className="flex items-center h-14">
        {/* Left: Home + Search */}
        <div className="flex flex-1 justify-around">
          <NavLink
            to="/"
            end
            className={({ isActive }) => cn(
              'flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Trang chủ</span>
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) => cn(
              'flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px] font-medium">Tìm kiếm</span>
          </NavLink>
        </div>

        {/* Center: POST button */}
        <button
          onClick={() => navigate('/?compose=true')}
          className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:scale-105 transition-all duration-200 mx-3 shrink-0"
          aria-label="Đăng bài"
        >
          <PenSquare className="h-5 w-5" />
        </button>

        {/* Right: Notifications + Profile */}
        <div className="flex flex-1 justify-around">
          <NavLink
            to="/notifications"
            className={({ isActive }) => cn(
              'flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Thông báo</span>
          </NavLink>
          <NavLink
            to="/me"
            className={({ isActive }) => cn(
              'flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Hồ sơ</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
