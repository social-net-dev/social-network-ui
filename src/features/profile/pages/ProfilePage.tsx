import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useProfile } from '../hooks/useProfile'
import type { Author } from '@/features/home/types/feed.types'
import { ProfileHeader } from '../components/ProfileHeader'
import { ProfileStats } from '../components/ProfileStats'
import { PersonalInfoSidebar } from '../components/PersonalInfoSidebar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { FileText, Heart, MessageSquare, Share2, Clock } from 'lucide-react'
import { ActivityFeed } from '../components/ActivityFeed'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

function ProfilePage() {
  const navigate = useNavigate()
  const { profile: rawProfile, isLoading, error } = useProfile()
  const profile = rawProfile as Author;
  const { user, isAuthenticated } = useAuthStore()

  const mockPosts = useMemo(() => {
    if (!profile || profile.postsCount === 0) return []

    return Array.from({ length: 3 }, (_, i) => ({
      id: i.toString(),
      content: `Bài viết thứ ${i + 1} của tôi về công nghệ AI và phát triển phần mềm. Hy vọng mọi người thích nó! #AI #ETECHS #SoftwareDevelopment`,
      likes: 124 + i * 10,
      comments: 12 + i,
      shares: 5 + i,
      createdAt: `2024-01-${(10 + i).toString().padStart(2, '0')}T00:00:00.000Z`,
    }))
  }, [profile?.postsCount])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-white dark:bg-card p-8 rounded-3xl shadow-xl border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">Oops!</h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'Không tìm thấy hồ sơ'}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  const isCurrentUser = isAuthenticated && user?.id === profile.id
  const stats = {
    posts: profile.postsCount || 0,
    followers: profile.followers || 0,
    following: profile.following || 0,
  }

  const profileData = {
    ...profile,
    isOwner: isCurrentUser,
    isFriend: false, 
    avatar: profile.avatar || undefined,
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: profile.updatedAt || new Date().toISOString(),
  }

  return (
    <div className="space-y-6">
      <ProfileHeader
        profile={profileData as any}
        isCurrentUser={isCurrentUser}
        onEdit={() => isCurrentUser && navigate('/settings')}
      />

      <ProfileStats stats={stats} />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="bg-card p-1.5 rounded-xl shadow-sm border border-border/50 w-full justify-start overflow-x-auto no-scrollbar">
              <TabsTrigger value="posts" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 py-2.5 transition-all-300">
                <FileText className="w-4 h-4 mr-2" />
                Bài viết
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-6 space-y-6 outline-none animate-fadeInUp">
              {mockPosts.length > 0 ? (
                <div className="space-y-6">
                  {mockPosts.map((post, index) => (
                    <Card key={post.id} className="border-border/50 shadow-sm bg-card rounded-xl overflow-hidden transition-all-300 hover:shadow-md hover-lift" style={{ animationDelay: `${index * 50}ms` }}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="w-11 h-11 border border-border ring-2 ring-transparent hover:ring-primary/20 transition-all-300">
                            <AvatarImage src={profile.avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{profile.displayName?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate hover:text-primary transition-colors-300 cursor-pointer">
                              {profile.displayName}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        <p className="text-foreground/90 mb-5 leading-relaxed text-sm">
                          {post.content}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-border/30">
                          <div className="flex gap-4">
                            <button className="flex items-center gap-2 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 transition-colors-300 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30">
                              <Heart className="w-5 h-5" />
                              <span className="text-sm font-medium">{post.likes}</span>
                            </button>
                            <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 dark:hover:text-blue-400 transition-colors-300 px-2 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30">
                              <MessageSquare className="w-5 h-5" />
                              <span className="text-sm font-medium">{post.comments}</span>
                            </button>
                            <button className="flex items-center gap-2 text-muted-foreground hover:text-green-500 dark:hover:text-green-400 transition-colors-300 px-2 py-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/30">
                              <Share2 className="w-5 h-5" />
                              <span className="text-sm font-medium">{post.shares}</span>
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="ghost" className="w-full rounded-xl py-5 border-2 border-dashed border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all-300 hover-lift">
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
                      Khi {profile.displayName} chia sẻ bài viết, chúng sẽ xuất hiện ở đây.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-full lg:w-80 space-y-6 shrink-0">
          <PersonalInfoSidebar />
          <ActivityFeed limit={5} />
        </div>
      </div>
    </div>
  )
}

export { ProfilePage }
