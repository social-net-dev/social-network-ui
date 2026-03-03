import { PostCard, usePostActions } from '@/features/posts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useProfilePosts } from '../hooks/useProfilePosts'

export type ProfilePostsTabProps = {
  mode: 'me' | 'other'
  subjectUserId: string | null
  currentUserId: string | null
  profileDisplayName: string
}

export function ProfilePostsTab({
  mode,
  subjectUserId,
  currentUserId,
  profileDisplayName,
}: ProfilePostsTabProps) {
  const { posts, query, queryKey } = useProfilePosts({ mode, subjectUserId })
  const { deletePost, updatePost, likePost } = usePostActions({ affectedQueryKeys: [queryKey] })
  const [openCommentPostIds, setOpenCommentPostIds] = useState<string[]>([])

  const handleComment = (postId: string) => {
    setOpenCommentPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId],
    )
  }

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return posts.length > 0 ? (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId ?? undefined}
          onLike={(id, liked) => likePost?.(id, liked)}
          onComment={handleComment}
          showComments={openCommentPostIds.includes(post.id)}
          onShare={() => {}}
          onDelete={(id) => deletePost?.(id)}
          onEdit={(id, content) => updatePost?.(id, content)}
        />
      ))}
      <Button
        variant="ghost"
        className="w-full rounded-xl py-5 border-2 border-dashed border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all-300 hover-lift"
      >
        Xem tất cả bài viết
      </Button>
    </div>
  ) : (
    <Card className="border-border/50 shadow-sm bg-card rounded-xl overflow-hidden animate-fadeIn">
      <CardContent className="p-12 text-center">
        <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Chưa có bài viết nào</h3>
        <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
          Khi {profileDisplayName} chia sẻ bài viết, chúng sẽ xuất hiện ở đây.
        </p>
      </CardContent>
    </Card>
  )
}
