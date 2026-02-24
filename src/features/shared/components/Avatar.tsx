import { cn } from '@/lib/utils'
import { buildMediaUrl, getDefaultAvatar } from '@/lib/utils/api'

type AvatarUser = { id?: string; displayName?: string; username?: string; avatar?: string | null; avatar_path?: string; display_name?: string; name?: string; email?: string; createdAt?: string }

interface AvatarProps {
  user?: AvatarUser
  src?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

export function Avatar({ user, src, alt, size = 'md', className }: AvatarProps) {
  // Support both transformed `avatar` (absolute URL) and raw `avatar_path` (R2 key)
  const rawAvatar = src || (user as any)?.avatar || (user as any)?.avatar_path
  const avatarSrc = rawAvatar
    ? (rawAvatar.startsWith('http') ? rawAvatar : buildMediaUrl(rawAvatar))
    : getDefaultAvatar()
  
  const displayName = (user as any)?.displayName || (user as any)?.display_name || (user as any)?.name || 'User'

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex items-center justify-center bg-muted shrink-0',
        sizeClasses[size],
        className
      )}
    >
      <img 
        src={avatarSrc} 
        alt={alt || displayName || 'Avatar'} 
        className="w-full h-full object-cover" 
        onError={(e) => {
          // Fallback if image fails to load
          (e.target as HTMLImageElement).src = getDefaultAvatar()
        }}
      />
    </div>
  )
}
