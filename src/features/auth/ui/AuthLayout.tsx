import type { ReactNode } from 'react'

interface AuthLayoutProps {
  leftPanel?: ReactNode
  rightPanel: ReactNode
}

export function AuthLayout({ leftPanel, rightPanel }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      {leftPanel && (
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-etechs-secondary">
          {leftPanel}
        </div>
      )}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative bg-background">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="w-full max-w-md relative z-10">{rightPanel}</div>
      </div>
    </div>
  )
}
