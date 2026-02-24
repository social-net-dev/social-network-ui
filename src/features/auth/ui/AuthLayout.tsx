import type { ReactNode } from 'react'

interface AuthLayoutProps {
  leftPanel?: ReactNode
  rightPanel: ReactNode
}

export function AuthLayout({ leftPanel, rightPanel }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      {leftPanel && (
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0A2737]">
          {leftPanel}
        </div>
      )}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative bg-[#F8FAFC] dark:bg-[#02182B]">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(#0E4E5A 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="w-full max-w-md relative z-10">{rightPanel}</div>
      </div>
    </div>
  )
}
