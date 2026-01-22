import { useState } from 'react'
import { useFeed } from '../hooks/useFeed'
import { CreatePostForm } from '../components/CreatePostForm'
import { FeedList } from '../components/FeedList'
import { CommentSection } from '../components/CommentSection'
import { MainLayout } from '@/features/shared/layouts/MainLayout'
import { Button } from '@/components/ui/button'
import { feedApi } from '../services/feedApi'
import type { Comment } from '../types/feed.types'

export function FeedPage() {
  const { posts, isLoading, error, createPost, likePost, refresh } = useFeed()
  const [isCreating, setIsCreating] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})

  const handleCreatePost = async (content: string, images: string[]) => {
    try {
      setIsCreating(true)
      await createPost(content, images)
    } catch (err) {
      console.error('Failed to create post:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleLike = async (postId: string, liked: boolean) => {
    await likePost(postId, liked)
  }

  const handleComment = (postId: string) => {
    setSelectedPostId(selectedPostId === postId ? null : postId)
    if (!comments[postId]) {
      loadComments(postId)
    }
  }

  const handleShare = (postId: string) => {
    console.log('Share post:', postId)
  }

  const loadComments = async (postId: string) => {
    try {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }))
      const data = await feedApi.getComments(postId)
      setComments((prev) => ({ ...prev, [postId]: data }))
    } catch (err) {
      console.error('Failed to load comments:', err)
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }))
    }
  }

  const handleAddComment = async (postId: string, content: string) => {
    try {
      const newComment = await feedApi.addComment(postId, content)
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }))
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <CreatePostForm onSubmit={handleCreatePost} isLoading={isCreating} />

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-red-800 dark:text-red-400">
                {error instanceof Error ? error.message : 'Đã có lỗi xảy ra'}
              </p>
              <Button variant="outline" size="sm" onClick={refresh}>
                Thử lại
              </Button>
            </div>
          </div>
        )}

        <FeedList
          posts={posts}
          isLoading={isLoading}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
        />

        {selectedPostId && (
          <div className="bg-white dark:bg-[#0A2737] rounded-2xl shadow-lg p-6 mt-6">
            <CommentSection
              comments={comments[selectedPostId] || []}
              isLoading={loadingComments[selectedPostId]}
              onAddComment={(content) => handleAddComment(selectedPostId, content)}
            />
          </div>
        )}
      </div>
    </MainLayout>
  )
}
