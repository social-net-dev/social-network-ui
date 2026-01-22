import type { ReactNode } from 'react'
import { Navbar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'

interface MainLayoutProps {
  children: ReactNode
  showNavbar?: boolean
  showSidebar?: boolean
}

export function MainLayout({ children, showNavbar = true, showSidebar = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1f29]">
      {showNavbar && <Navbar />}
      <div className={`flex ${showSidebar ? 'pt-16 lg:pl-64' : 'pt-16'}`}>
        {showSidebar && <Sidebar />}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
