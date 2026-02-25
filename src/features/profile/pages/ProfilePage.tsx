import { useState } from 'react';
import { useProfilePageModel } from '../hooks/useProfilePageModel';
import { ProfileHeader } from '../components/ProfileHeader';
import { PersonalInfoSidebar } from '../components/PersonalInfoSidebar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Info, Users } from 'lucide-react';
import { StorageQuotaCard } from '../components/StorageQuotaCard';
import { ProfilePostsTab } from '../components/ProfilePostsTab';
import { ProfileAboutTab } from '../components/ProfileAboutTab';
import { ProfileFriendsTab } from '../components/ProfileFriendsTab';
import { EditProfileSheet } from '../components/EditProfileSheet';

function ProfilePage() {
  const { mode, profile, isLoading: isProfileLoading, error, canEdit, subjectUserId, currentUserId } = useProfilePageModel();
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
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

  return (
    <div className="space-y-5">
      <ProfileHeader
        profile={profile}
        isCurrentUser={canEdit}
        onEdit={() => setEditSheetOpen(true)}
      />

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="h-auto bg-transparent border-b border-border w-full justify-start mb-6 p-0 rounded-none overflow-x-auto no-scrollbar">
              <TabsTrigger
                value="posts"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-3 gap-2 font-medium"
              >
                <FileText className="w-4 h-4" />
                Bài viết
              </TabsTrigger>
              <TabsTrigger
                value="about"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-3 gap-2 font-medium"
              >
                <Info className="w-4 h-4" />
                Giới thiệu
              </TabsTrigger>
              <TabsTrigger
                value="friends"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-3 gap-2 font-medium"
              >
                <Users className="w-4 h-4" />
                Bạn bè
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="outline-none">
              <ProfilePostsTab
                mode={mode}
                subjectUserId={subjectUserId}
                currentUserId={currentUserId}
                profileDisplayName={profile.displayName}
              />
            </TabsContent>

            <TabsContent value="about" className="outline-none">
              <ProfileAboutTab profile={profile} isCurrentUser={canEdit} />
            </TabsContent>

            <TabsContent value="friends" className="outline-none">
              <ProfileFriendsTab userId={subjectUserId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 xl:w-80 space-y-5 shrink-0">
          {mode === 'me' && profile.storageQuotaMb && (
            <StorageQuotaCard quotaMb={profile.storageQuotaMb} />
          )}
          <PersonalInfoSidebar />
        </div>
      </div>

      {canEdit && (
        <EditProfileSheet open={editSheetOpen} onOpenChange={setEditSheetOpen} />
      )}
    </div>
  );
}

export { ProfilePage };
