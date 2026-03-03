import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerificationBadgeProps {
  accountStatus?: string | null
  size?: 'sm' | 'md'
  className?: string
}

export function VerificationBadge({ accountStatus, size = 'sm', className }: VerificationBadgeProps) {
  const isVerified = accountStatus === 'VERIFIED'
  const sizeClass = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'

  return (
    <div
      title={isVerified ? 'Đã được cộng đồng xác minh' : 'Chưa được xác minh bởi cộng đồng'}
    >
      <BadgeCheck
        className={cn(
          sizeClass,
          'flex-shrink-0',
          isVerified ? 'text-blue-500' : 'text-muted-foreground/30',
          className,
        )}
      />
    </div>
  )
}
