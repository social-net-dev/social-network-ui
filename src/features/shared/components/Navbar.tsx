import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface NavbarProps {
  children?: ReactNode
}

export function Navbar({ children }: NavbarProps) {
  return (
    <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-[#0a1f29]/90 backdrop-blur-md">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <Link to="/" className="flex items-center space-x-3">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#1b7a78] opacity-20 rounded-full animate-pulse"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1b7a78]">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
            <span className="self-center text-xl font-bold whitespace-nowrap dark:text-white">ETECHS</span>
          </div>
        </Link>
        {children}
      </div>
    </nav>
  )
}
