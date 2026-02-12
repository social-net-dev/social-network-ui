import type { User } from '@/types'
import { cn } from '@/lib/utils'
import { buildMediaUrl } from '@/lib/api/transforms/common'

interface AvatarProps {
  user?: User | (Record<string, any>) | null
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

export function Avatar({ user, src, alt, size = 'md', className }: AvatarProps) {
  // Support both transformed `avatar` (absolute URL) and raw `avatar_path` (R2 key)
  const rawAvatar = src || (user as any)?.avatar || (user as any)?.avatar_path
  const avatarSrc = rawAvatar
    ? (rawAvatar.startsWith('http') ? rawAvatar : buildMediaUrl(rawAvatar))
    : (user?.id ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}` : null)
  const displayName = (user as any)?.displayName || (user as any)?.display_name || ''
  const initials = user?.firstName?.[0] && user?.lastName?.[0] 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : (displayName?.[0] || '?')

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-gradient-to-br from-[#1b7a78] to-[#26a69a] flex items-center justify-center text-white font-semibold shadow-md',
        sizeClasses[size],
        className
      )}
    >
      {avatarSrc ? (
        <img src={avatarSrc} alt={alt || user?.firstName || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <span className="uppercase">{initials}</span>
      )}
    </div>
  )
}
