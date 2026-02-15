import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Home, User, MessageSquare, Bell, LogOut, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMessageStore } from '@/stores/messageStore';

const menuItems = [
  { icon: Home, label: 'Trang chủ', path: '/' },
  { icon: User, label: 'Tôi', path: '/profile/me' },
  { icon: User, label: 'Trang cá nhân', path: '/profile' },
  { icon: MessageSquare, label: 'Tin nhắn', path: '/messages' },
  { icon: Bell, label: 'Thông báo', path: '/notifications' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.role === 'ADMIN';
  const totalUnread = useMessageStore(state => state.totalUnread);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen pt-16 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a1f29] transition-all w-64 hidden lg:block">
      <div className="h-full px-3 pb-4 overflow-y-auto">
        <ul className="space-y-2 font-medium mt-4">
          {menuItems.map(item => {
            const pathname = location.pathname;
            let isActive = false;

            if (item.path === '/') {
              isActive = pathname === '/';
            } else if (item.path === '/profile/me') {
              isActive = pathname === '/profile/me';
            } else if (item.path === '/profile') {
              // profile should be active for /profile and /profile/:userId but not for /profile/me
              isActive = pathname === '/profile' || (pathname.startsWith('/profile/') && !pathname.startsWith('/profile/me'));
            } else {
              isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            }

            return (
              <li key={item.path}>
                <Link to={item.path} className={cn('flex items-center p-3 rounded-lg group', isActive ? 'bg-primary text-primary-foreground' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')}>
                  <item.icon className={cn('w-5 h-5', isActive ? 'text-primary-foreground' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white')} />
                  <span className="ml-3 flex items-center gap-2">
                    {item.label}
                    {item.path === '/messages' && totalUnread > 0 ? <span className="min-w-[1.5rem] h-6 px-2 rounded-full bg-secondary text-black text-xs font-semibold flex items-center justify-center shadow-md ring-2 ring-secondary/30 animate-pulse">{totalUnread}</span> : null}
                  </span>
                </Link>
              </li>
            );
          })}
          {isAdmin && (
            <li className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link to="/admin/accounts" className={cn('flex items-center p-3 rounded-lg group', location.pathname.startsWith('/admin') ? 'bg-primary text-primary-foreground' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')}>
                <Users className={cn('w-5 h-5', location.pathname.startsWith('/admin') ? 'text-primary-foreground' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white')} />
                <span className="ml-3">Quản lý tài khoản</span>
              </Link>
            </li>
          )}
          <li className={isAdmin ? '' : 'mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'}>
            <Link to="/settings" className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 group">
              <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              <span className="ml-3">Cài đặt</span>
            </Link>
          </li>
          <li>
            <button
              className="w-full flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 group"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              <span className="ml-3">Đăng xuất</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
