import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'

interface LikeButtonProps {
  liked: boolean
  count: number
  onToggle: (liked: boolean) => void
}

export function LikeButton({ liked, count, onToggle }: LikeButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onToggle(!liked)}
      className={liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}
    >
      <Heart className={`w-5 h-5 mr-1 ${liked ? 'fill-current' : ''}`} />
      {count}
    </Button>
  )
}
