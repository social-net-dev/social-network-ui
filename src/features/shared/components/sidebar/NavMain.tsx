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
}

export function NavMain({ items }: NavMainProps) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Điều hướng</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                <Link to={item.path}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <SidebarMenuBadge
                  className={cn(
                    // Keep badge muted even when the menu item is active so it
                    // doesn't blend into the active background.
                    'bg-muted-foreground/10 text-muted-foreground'
                  )}
                >
                  {item.badge}
                </SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
