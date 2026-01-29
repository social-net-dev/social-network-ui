import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { ProfileHeader } from '../components/ProfileHeader'
import { ProfileStats } from '../components/ProfileStats'
import { MainLayout } from '@/features/shared/layouts/MainLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { FileText, Image as ImageIcon, Video, Info, Users } from 'lucide-react'

function ProfilePage() {
  const navigate = useNavigate()
  const { profile, isLoading, error } = useProfile()
  const { user, isAuthenticated } = useAuthStore()

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-etechs-primary"></div>
        </div>
      </MainLayout>
    )
  }

  if (error || !profile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center bg-white dark:bg-card p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Oops!</h2>
            <p className="text-gray-500 dark:text-gray-400">
              {error instanceof Error ? error.message : 'Không tìm thấy hồ sơ'}
            </p>
            <Button onClick={() => window.location.reload()} className="mt-6 bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90">
              Thử lại
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const isCurrentUser = isAuthenticated && user?.id === profile.id
  const stats = {
    posts: profile.postsCount,
    followers: profile.followers || 0,
    following: profile.following || 0,
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <ProfileHeader
            profile={profile}
            isCurrentUser={isCurrentUser}
            onEdit={() => isCurrentUser && navigate('/settings')}
        />
        
        <ProfileStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="bg-white dark:bg-card p-1 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 w-full justify-start overflow-x-auto no-scrollbar">
                <TabsTrigger value="posts" className="rounded-xl data-[state=active]:bg-etechs-primary data-[state=active]:text-etechs-secondary px-6 py-2.5">
                    <FileText className="w-4 h-4 mr-2" />
                    Bài viết
                </TabsTrigger>
                <TabsTrigger value="photos" className="rounded-xl data-[state=active]:bg-etechs-primary data-[state=active]:text-etechs-secondary px-6 py-2.5">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Ảnh
                </TabsTrigger>
                <TabsTrigger value="videos" className="rounded-xl data-[state=active]:bg-etechs-primary data-[state=active]:text-etechs-secondary px-6 py-2.5">
                    <Video className="w-4 h-4 mr-2" />
                    Video
                </TabsTrigger>
                </TabsList>
                
                <TabsContent value="posts" className="mt-6 space-y-6 outline-none">
                <Card className="border-none shadow-lg bg-white dark:bg-card rounded-3xl overflow-hidden">
                    <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chưa có bài viết nào</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        Khi {profile.firstName} chia sẻ bài viết, chúng sẽ xuất hiện ở đây.
                    </p>
                    </CardContent>
                </Card>
                </TabsContent>

                <TabsContent value="photos" className="mt-6 outline-none">
                <Card className="border-none shadow-lg bg-white dark:bg-card rounded-3xl p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="aspect-square rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
                        ))}
                    </div>
                </Card>
                </TabsContent>

                <TabsContent value="videos" className="mt-6 outline-none">
                <Card className="border-none shadow-lg bg-white dark:bg-card rounded-3xl p-12 text-center">
                    <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có video nào</p>
                </Card>
                </TabsContent>
            </Tabs>
            </div>

            {/* Sidebar Area */}
            <div className="space-y-6">
            <Card className="border-none shadow-lg bg-white dark:bg-card rounded-3xl overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                        <Info className="w-5 h-5 mr-2 text-etechs-primary" />
                        Giới thiệu
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Chuyên gia AI và Khoa học dữ liệu tại ETECHS. Đam mê xây dựng các hệ sinh thái số thông minh.
                    </p>
                    <div className="space-y-3">
                        <div className="flex items-center text-sm">
                            <Users className="w-4 h-4 mr-3 text-gray-400" />
                            <span>24 bạn chung</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white dark:bg-card rounded-3xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg flex items-center">
                        <Users className="w-5 h-5 mr-2 text-etechs-primary" />
                        Bạn bè
                    </CardTitle>
                    <Button variant="link" className="text-etechs-secondary dark:text-etechs-primary font-bold text-xs p-0 h-auto">
                        Xem tất cả
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="space-y-1">
                                <div className="aspect-square rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/5" />
                                <div className="h-2 w-full bg-gray-50 dark:bg-white/5 rounded-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            </div>
        </div>
      </div>
    </MainLayout>
  )
}

export { ProfilePage }
