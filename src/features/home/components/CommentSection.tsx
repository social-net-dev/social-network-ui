import { useState } from 'react'
import { Avatar } from '@/features/shared/components/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, MessageCircle } from 'lucide-react'
import type { Comment } from '../types/feed.types'

interface CommentSectionProps {
  comments: Comment[]
  isLoading?: boolean
  onAddComment: (content: string) => void
}

export function CommentSection({ comments, isLoading = false, onAddComment }: CommentSectionProps) {
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onAddComment(content)
      setContent('')
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-[#0a1f29] rounded-xl p-4 mt-4">
      <div className="flex items-center mb-4">
        <MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
        <h4 className="font-semibold text-gray-900 dark:text-white">Bình luận</h4>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-4">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Viết bình luận..."
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!content.trim()}
          className="bg-[#1b7a78] hover:bg-teal-700"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1b7a78]"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-3">
              <Avatar user={comment.author} size="sm" />
              <div className="flex-1">
                <div className="bg-white dark:bg-[#0A2737] rounded-lg px-3 py-2">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {comment.author.firstName} {comment.author.lastName}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                </div>
                <div className="flex items-center gap-4 mt-1 ml-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                  <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    Thích
                  </button>
                  <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    Trả lời
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Chưa có bình luận nào
        </p>
      )}
    </div>
  )
}
