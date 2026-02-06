import { Home, User, MessageSquare, Bell, Sparkles, Hash } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { NavMain } from './sidebar/NavMain';
import { NavAdmin } from './sidebar/NavAdmin';
import { NavSecondary } from './sidebar/NavSecondary';
import { NavUser } from './sidebar/NavUser';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import logoEtechs from '@/assets/logo-etechs-ETS.svg';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { unreadCount } = useNotifications();
  const unreadMessagesCount = 0; // TODO: implement unread count for messages

  const menuItems = [
    { icon: Home, label: 'Trang chủ', path: '/' },
    { icon: User, label: 'Tôi', path: '/profile/me' },
    { icon: User, label: 'Trang cá nhân', path: '/profile' },
    { icon: Sparkles, label: 'Gợi ý kết nối', path: '/recommendations' },
    { icon: Hash, label: 'Lĩnh vực', path: '/fields/cong-nghe' },
    { icon: MessageSquare, label: 'Tin nhắn', path: '/messages', badge: unreadMessagesCount },
    { icon: Bell, label: 'Thông báo', path: '/notifications', badge: unreadCount },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <img src={logoEtechs} alt="ETECHS" className="h-9 w-auto" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">ETECHS</span>
                  <span className="truncate text-xs">Mạng xã hội</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menuItems} />
        <NavAdmin />
        <NavSecondary />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
