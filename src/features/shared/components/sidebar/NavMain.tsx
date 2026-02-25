import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuBadge } from '@/components/ui/sidebar';

interface NavMainProps {
  items: {
    icon: LucideIcon;
    label: string;
    path: string;
    badge?: number;
  }[];
  groupLabel?: string;
}

export function NavMain({ items, groupLabel = 'Điều hướng' }: NavMainProps) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(item => {
          // Check exact match first, then prefix match only for nested routes
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path + '/') && 
             !items.some(otherItem => otherItem.path !== item.path && location.pathname.startsWith(otherItem.path)));
          return (
            <SidebarMenuItem key={item.path} className={cn(isActive && 'nav-active-accent')}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                <Link to={item.path}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <SidebarMenuBadge
                  className={cn(
                    'bg-primary/15 text-primary font-semibold text-[10px] min-w-[18px]',
                    item.badge > 0 && 'badge-pulse'
                  )}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
