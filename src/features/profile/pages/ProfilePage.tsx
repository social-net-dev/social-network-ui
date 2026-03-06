import { useState, lazy, Suspense } from 'react';
import { useProfilePageModel } from '../hooks/useProfilePageModel';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileIntroCard } from '../components/ProfileIntroCard';
import { ProfileCompletenessCard } from '../components/ProfileCompletenessCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Info, Users, Images } from 'lucide-react';
import { StorageQuotaCard } from '../components/StorageQuotaCard';
import { ProfilePostsTab } from '../components/ProfilePostsTab';
import { ProfileAboutTab } from '../components/ProfileAboutTab';
import { ProfileFriendsTab } from '../components/ProfileFriendsTab';
import { ProfilePhotosTab } from '../components/ProfilePhotosTab';
import { EditProfileSheet } from '../components/EditProfileSheet';
import { PostComposerCard } from '@/features/posts/components/PostComposerCard';
import { CreatePostFAB } from '@/features/posts/components/CreatePostFAB';
import { usePostsCreatePost, getPostsGetMyPostsQueryKey } from '@/lib/api/generated';
import { uploadMediaAsset } from '@/features/posts/lib/uploadMediaAsset';
import { useQueryClient } from '@tanstack/react-query';
import type { PostType } from '@/lib/api/types';
import type { User } from '@/lib/api/types';

const CreatePostModal = lazy(() =>
  import('@/features/posts/components/CreatePostModal').then(module => ({
    default: module.CreatePostModal,
  }))
);

function ProfilePage() {
  const { mode, profile, isLoading: isProfileLoading, error, canEdit, subjectUserId, currentUserId } = useProfilePageModel();
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [initialPostType, setInitialPostType] = useState("SOCIAL");
  const createPostMutation = usePostsCreatePost();
  const queryClient = useQueryClient();

  const handleCreatePost = async (content: string, files: File[], _hashtags: string[], postType?: string, fieldId?: string) => {
    try {
      setIsCreating(true);
      const media_asset_ids = files?.length
        ? await Promise.all(files.map((f) => uploadMediaAsset(f, 'post')))
        : undefined;
      await createPostMutation.mutateAsync({
        data: {
          content_text: content,
          post_type: (postType as PostType) || 'SOCIAL',
          field_id: fieldId || undefined,
          media_asset_ids: media_asset_ids?.length ? media_asset_ids : undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: getPostsGetMyPostsQueryKey(undefined) });
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsCreating(false);
    }
  };

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
                value="photos"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-3 gap-2 font-medium"
              >
                <Images className="w-4 h-4" />
                Ảnh
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
              {canEdit && (
                <div className="mb-6">
                  <PostComposerCard
                    onOpen={(type) => {
                      setInitialPostType(type ?? "SOCIAL");
                      setShowCreateModal(true);
                    }}
                  />
                </div>
              )}
              <ProfilePostsTab
                mode={mode}
                subjectUserId={subjectUserId}
                currentUserId={currentUserId}
                profileDisplayName={profile.display_name}
              />
            </TabsContent>

            <TabsContent value="photos" className="outline-none">
              <ProfilePhotosTab mode={mode} subjectUserId={subjectUserId} />
            </TabsContent>

            <TabsContent value="about" className="outline-none">
              <ProfileAboutTab profile={profile as User} isCurrentUser={canEdit} />
            </TabsContent>

            <TabsContent value="friends" className="outline-none">
              <ProfileFriendsTab userId={subjectUserId} isCurrentUser={canEdit} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 xl:w-80 space-y-5 shrink-0">
          {mode === 'me' && profile.storage_quota_mb && (
            <StorageQuotaCard quotaMb={profile.storage_quota_mb} />
          )}
          {canEdit && (
            <ProfileCompletenessCard
              profile={profile as User}
              onEdit={() => setEditSheetOpen(true)}
            />
          )}
          <ProfileIntroCard profile={profile as User} isCurrentUser={canEdit} />
        </div>
      </div>

      {canEdit && (
        <EditProfileSheet open={editSheetOpen} onOpenChange={setEditSheetOpen} />
      )}

      {canEdit && (
        <CreatePostFAB onClick={() => setShowCreateModal(true)} scrollThreshold={100} />
      )}

      <Suspense fallback={null}>
        {showCreateModal && (
          <CreatePostModal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            onSubmit={handleCreatePost}
            isLoading={isCreating}
            initialPostType={initialPostType}
          />
        )}
      </Suspense>
    </div>
  );
}

export { ProfilePage };
