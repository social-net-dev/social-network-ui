import { cn } from '@/lib/utils'
import { buildMediaUrl, getDefaultAvatar } from '@/lib/utils/api'

type AvatarUser = { id?: string; displayName?: string; username?: string; avatar?: string | null; avatar_path?: string; display_name?: string; name?: string; email?: string; createdAt?: string; account_status?: string }

interface AvatarProps {
  user?: AvatarUser
  src?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showStatus?: boolean
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

// Badge size relative to avatar size
const badgeSizeClasses = {
  xs: 'h-1.5 w-1.5 bottom-0 right-0',
  sm: 'h-2 w-2 bottom-0 right-0',
  md: 'h-2.5 w-2.5 bottom-0.5 right-0.5',
  lg: 'h-3 w-3 bottom-0.5 right-0.5',
  xl: 'h-3.5 w-3.5 bottom-1 right-1',
}

// Status color & title mapping
const STATUS_BADGE: Record<string, { color: string; title: string } | null> = {
  ACTIVE:      { color: 'bg-slate-400', title: 'Chưa được xác minh' },
  VERIFIED:    { color: 'bg-blue-500',  title: 'Đã được cộng đồng xác minh' },
  UNVERIFIED:  { color: 'bg-yellow-400', title: 'Chưa xác minh' },
  LOCKED:      { color: 'bg-red-500',   title: 'Bị khóa' },
  DISABLED:    { color: 'bg-gray-400',  title: 'Vô hiệu hóa' },
  DEACTIVATED: { color: 'bg-gray-400',  title: 'Đã hủy kích hoạt' },
  TERMINATED:  { color: 'bg-gray-600',  title: 'Đã xóa' },
}

export function Avatar({ user, src, alt, size = 'md', className, showStatus = true }: AvatarProps) {
  // Support both transformed `avatar` (absolute URL) and raw `avatar_path` (R2 key)
  const rawAvatar = src || (user as any)?.avatar || (user as any)?.avatar_path
  const avatarSrc = rawAvatar
    ? (rawAvatar.startsWith('http') ? rawAvatar : buildMediaUrl(rawAvatar))
    : getDefaultAvatar()
  
  const displayName = (user as any)?.displayName || (user as any)?.display_name || (user as any)?.name || 'User'
  const accountStatus = ((user as any)?.account_status as string | undefined)?.toUpperCase()
  const badge = accountStatus ? STATUS_BADGE[accountStatus] ?? null : null

  return (
    <div className={cn('relative shrink-0 inline-block', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center bg-muted',
          sizeClasses[size],
        )}
      >
        <img 
          src={avatarSrc} 
          alt={alt || displayName || 'Avatar'} 
          className="w-full h-full object-cover" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = getDefaultAvatar()
          }}
        />
      </div>
      {showStatus && badge && (
        <span
          className={cn(
            'absolute rounded-full ring-2 ring-background',
            badge.color,
            badgeSizeClasses[size],
          )}
          title={badge.title}
        />
      )}
    </div>
  )
}
