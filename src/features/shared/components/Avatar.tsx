import type { User } from '@/types'
import { cn } from '@/lib/utils'

interface AvatarProps {
  user?: User | null
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
  const avatarSrc = src || user?.avatar || (user?.id ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}` : null)
  const initials = user?.firstName?.[0] && user?.lastName?.[0] 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : (user?.displayName?.[0] || '?')

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
