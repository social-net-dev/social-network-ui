import type { ReactNode } from 'react'
import { AppSidebar } from '../components/AppSidebar'
import { DynamicBreadcrumbs } from '../components/DynamicBreadcrumbs'
import { Toaster } from '@/components/ui/sonner'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { NotificationsDropdown } from '@/features/notifications/components/NotificationsDropdown'
import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MainLayoutProps {
  children: ReactNode
  showSidebar?: boolean
}

export function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <SidebarProvider>
      {showSidebar && <AppSidebar />}
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex w-full items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <DynamicBreadcrumbs />
            </div>
            
            <div className="flex items-center gap-2">
              <NotificationsDropdown />

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-colors-300"
                title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 pt-0">
          <div className="animate-fadeIn mt-6">
            {children}
          </div>
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
      </SidebarInset>
    </SidebarProvider>
  )
}
