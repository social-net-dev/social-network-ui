import { useNavigate } from 'react-router-dom';
import { useProfilePageModel } from '../hooks/useProfilePageModel';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileStats } from '../components/ProfileStats';
import { PersonalInfoSidebar } from '../components/PersonalInfoSidebar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText } from 'lucide-react';
import { ActivityFeed } from '../components/ActivityFeed';
import { StorageQuotaCard } from '../components/StorageQuotaCard';
import { ProfilePostsTab } from '../components/ProfilePostsTab';

function ProfilePage() {
  const navigate = useNavigate();
  const { mode, profile, isLoading: isProfileLoading, error, canEdit, subjectUserId, currentUserId } = useProfilePageModel();

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-white dark:bg-card p-8 rounded-3xl shadow-xl border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">Oops!</h2>
          <p className="text-muted-foreground">{error instanceof Error ? error.message : 'Không tìm thấy hồ sơ'}</p>
          <Button onClick={() => window.location.reload()} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  const stats = {
    posts: profile.postsCount || 0,
    followers: profile.followers || 0,
    following: profile.following || 0,
  };

  return (
    <div className="space-y-6">
      <ProfileHeader 
        profile={profile} 
        isCurrentUser={canEdit} 
        onEdit={() => canEdit && navigate('/settings')} 
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
              <ProfilePostsTab
                mode={mode}
                subjectUserId={subjectUserId}
                currentUserId={currentUserId}
                profileDisplayName={profile.displayName}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-full lg:w-80 space-y-6 shrink-0">
          {mode === 'me' && profile.storageQuotaMb && <StorageQuotaCard quotaMb={profile.storageQuotaMb} />}
          <PersonalInfoSidebar />
          <ActivityFeed limit={5} />
        </div>
      </div>
    </div>
  );
}

export { ProfilePage };
