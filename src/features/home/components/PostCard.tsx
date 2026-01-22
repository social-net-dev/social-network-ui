import { Avatar } from '@/features/shared/components/Avatar'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'
import type { Post as PostType } from '../types/feed.types'

interface PostProps {
  post: PostType
  onLike: (postId: string, liked: boolean) => void
  onComment: (postId: string) => void
  onShare: (postId: string) => void
}

export function PostCard({ post, onLike, onComment, onShare }: PostProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })

  return (
    <article className="bg-white dark:bg-[#0A2737] rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar user={post.author} size="md" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {post.author.firstName} {post.author.lastName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{timeAgo}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </Button>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>

        {post.images.length > 0 && (
          <div className="mb-4 grid gap-2">
            {post.images.length === 1 && (
              <img
                src={post.images[0]}
                alt="Post image"
                className="w-full rounded-xl max-h-96 object-cover"
              />
            )}
            {post.images.length > 1 && (
              <div className={`grid ${post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'} gap-2`}>
                {post.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Post image ${index + 1}`}
                    className={`rounded-xl ${index === 0 && post.images.length > 1 ? 'row-span-2' : ''} object-cover`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post.id, !post.likedByCurrentUser)}
              className={post.likedByCurrentUser ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}
            >
              <Heart className={`w-5 h-5 mr-1 ${post.likedByCurrentUser ? 'fill-current' : ''}`} />
              {post.likes}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment(post.id)}
              className="text-gray-500 dark:text-gray-400"
            >
              <MessageCircle className="w-5 h-5 mr-1" />
              {post.comments}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(post.id)}
              className="text-gray-500 dark:text-gray-400"
            >
              <Share2 className="w-5 h-5 mr-1" />
              {post.shares}
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
