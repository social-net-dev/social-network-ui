import { useNavigate, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useProfile } from '../hooks/useProfile';
import type { Author, FeedPost } from '@/features/home/types/feed.types';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileStats } from '../components/ProfileStats';
import { PersonalInfoSidebar } from '../components/PersonalInfoSidebar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { FileText, Loader2 } from 'lucide-react';
import { ActivityFeed } from '../components/ActivityFeed';
import { StorageQuotaCard } from '../components/StorageQuotaCard';
import { PostsV2API, PostsAPI, Models } from '@/lib/api/generated';
import { getGetMyPostsV2PostsMeListGetQueryKey } from '@/lib/api/generated/posts-v2/posts-v2';
import { getProfilePostsProfilesUsernamePostsGetQueryKey } from '@/lib/api/generated/posts/posts';
import { transformPost } from '@/lib/api/transforms';
import { PostCard } from '@/features/home/components/PostCard';
import { usePostActions } from '@/features/home/hooks/usePostActions';

function ProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { profile: rawProfile, isLoading: isProfileLoading, error, isMe } = useProfile();
  const profile = rawProfile as Author;
  const { user: currentUser, isAuthenticated } = useAuthStore();

  const myPostsParams = { page: 1, page_size: 10 };
  const publicPostsIdentifier = (profile?.username || userId || '') as string;

  const currentQueryKey = isMe ? getGetMyPostsV2PostsMeListGetQueryKey(myPostsParams) : getProfilePostsProfilesUsernamePostsGetQueryKey(publicPostsIdentifier);

  const { deletePost, updatePost, likePost } = usePostActions(currentQueryKey as unknown as readonly unknown[]);

  // Fetch actual posts for the current user if it's "me"
  const { data: myPostsResponse, isLoading: isMyPostsLoading } = PostsV2API.useGetMyPostsV2PostsMeListGet(myPostsParams, {
    query: {
      enabled: !!isMe && isAuthenticated,
      select: (data: Models.PostOut[]) => data.map(transformPost),
    },
  });

  // Fetch posts for other users
  const { data: publicPostsResponse, isLoading: isPublicPostsLoading } = PostsAPI.useProfilePostsProfilesUsernamePostsGet(publicPostsIdentifier, {
    query: {
      enabled: !isMe && !!publicPostsIdentifier,
      select: (data: Models.PostOut[]) => data.map(transformPost),
    },
  });

  const posts = useMemo<FeedPost[]>(() => {
    if (isMe) return myPostsResponse || [];
    return publicPostsResponse || [];
  }, [isMe, myPostsResponse, publicPostsResponse]);

  const isPostsLoading = isMe ? isMyPostsLoading : isPublicPostsLoading;

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

  const isCurrentUser = isAuthenticated && currentUser?.id === profile.id;
  const stats = {
    posts: profile.postsCount || posts.length || 0,
    followers: profile.followers || 0,
    following: profile.following || 0,
  };

  const profileData = {
    ...profile,
    isOwner: isCurrentUser,
    isFriend: false,
    avatar: profile.avatar,
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: profile.updatedAt || new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <ProfileHeader profile={profileData} isCurrentUser={isCurrentUser} onEdit={() => isCurrentUser && navigate('/settings')} />

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
              {isPostsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} currentUserId={currentUser?.id} onLike={(id, liked) => likePost?.(id, liked)} onComment={() => {}} onShare={() => {}} onDelete={id => deletePost?.(id)} onEdit={(id, content) => updatePost?.(id, content)} />
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
                    <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">Khi {profile.displayName} chia sẻ bài viết, chúng sẽ xuất hiện ở đây.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-full lg:w-80 space-y-6 shrink-0">
          {isMe && profile.storageQuotaMb && <StorageQuotaCard quotaMb={profile.storageQuotaMb} />}
          <PersonalInfoSidebar />
          <ActivityFeed limit={5} />
        </div>
      </div>
    </div>
  );
}

export { ProfilePage };
