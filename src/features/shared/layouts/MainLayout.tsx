import type { ReactNode } from 'react';
import { AppSidebar } from '../components/AppSidebar';
import { DynamicBreadcrumbs } from '../components/DynamicBreadcrumbs';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { Toaster } from '@/components/ui/sonner';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { NotificationsDropdown } from '@/features/notifications/components/NotificationsDropdown';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { useAuthStore } from '@/stores/authStore';

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showNavbar?: boolean;
}

export function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuthStore();

  return (
    <SidebarProvider>
      {showSidebar && <AppSidebar />}
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border/40 bg-background/90 backdrop-blur-md sticky top-0 z-30">
          <div className="flex w-full items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
              <Separator orientation="vertical" className="mr-1 h-4 opacity-50" />
              <DynamicBreadcrumbs />
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground hidden md:flex"
                asChild
              >
                <Link to="/search" aria-label="Tìm kiếm">
                  <Search className="h-4 w-4" />
                </Link>
              </Button>

              <NotificationsDropdown />

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8 rounded-lg hover:bg-primary/10 transition-colors-300 text-muted-foreground hover:text-foreground"
                title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>

              <Link to="/me" className="hidden md:flex h-8 w-8 rounded-full ml-1 shrink-0 overflow-hidden ring-2 ring-transparent hover:ring-primary/40 transition-all" aria-label="Hồ sơ cá nhân">
                <Avatar user={user as any} size="sm" className="h-8 w-8" />
              </Link>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 pt-0 pb-20 md:pb-6">
          <div className="animate-fadeIn mt-4">{children}</div>
        </div>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: 'glass-effect rounded-xl',
              title: 'font-semibold',
              description: 'text-sm',
            },
          }}
        />
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
