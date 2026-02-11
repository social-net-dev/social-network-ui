import { useState, useRef, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useUserPosts } from '../hooks/useUserPosts';
import { usePostActions } from '@/features/home/hooks/usePostActions';
import { useAuthStore } from '@/stores/authStore';
import type { Author, Project } from '@/features/home/types/feed.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit2, Share2, MapPin, BadgeCheck, School, PlusCircle, BookOpen, Heart, Terminal, Globe, Trash2, FileText, User, Loader2 } from 'lucide-react';
import { EditBasicInfoDialog, EditAcademicBackgroundDialog, EditInterestsDialog, EditProjectDialog } from '../components/EditProfileDialogs';
import { StorageQuotaCard } from '../components/StorageQuotaCard';
import { PostCard } from '@/features/home/components/PostCard';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { queryKeys } from '@/lib/query-keys';

export function PersonalProfilePage() {
  const { profile: rawProfile, updateProfile, isLoading } = useProfile();
  const profile = rawProfile as Author;
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'about' | 'posts'>('about');

  // Personal feed
  const { posts, total, isLoading: postsLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useUserPosts('me');
  const { deletePost, updatePost, likePost } = usePostActions(queryKeys.feed.userPosts('me') as unknown as readonly unknown[]);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const entry = useIntersectionObserver(loadMoreRef, { threshold: 0.1 });
  const isVisible = !!entry?.isIntersecting;

  useEffect(() => {
    if (isVisible && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isVisible, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Derived projects list
  const projects = profile?.personalInfo?.projects || [];

  // --- Handlers for Backend Sync ---
  const saveToBackend = async (updates: any) => {
    try {
      const currentPersonalInfo = profile?.personalInfo || {};
      const bioPayload = JSON.stringify({
        bioText: profile?.bio || '',
        ...currentPersonalInfo,
        ...updates,
      });

      await updateProfile({
        displayName: profile?.displayName || '',
        bio: bioPayload,
      });
    } catch (error) {
      console.error('Failed to sync profile:', error);
    }
  };

  const handleUpdateUserInfo = async (newData: any) => {
    try {
      // Basic info update (includes birthDate and location which might be outside JSON)
      // For simplicity, we store location in bio JSON too
      const bioPayload = JSON.stringify({
        ...(profile?.personalInfo || {}),
        bioText: newData.bio,
        location: newData.location,
      });

      await updateProfile({
        displayName: newData.displayName,
        username: newData.username,
        birthDate: newData.birthDate,
        bio: bioPayload,
      });
    } catch (error) {
      console.error('Failed to update basic info:', error);
    }
  };

  const handleUpdateAcademicBackground = (newData: any) => {
    saveToBackend(newData);
  };

  const handleUpdateAcademicInterests = (newInterests: any) => {
    saveToBackend({ favoriteSubjects: newInterests.map((i: any) => i.label) });
  };

  const handleUpdatePersonalInterests = (newInterests: any) => {
    saveToBackend({ hobbies: newInterests.map((i: any) => i.label) });
  };

  const handleUpdateProject = (updatedProject: Project) => {
    let newProjects = [...projects];
    const index = newProjects.findIndex(p => p.id === updatedProject.id);
    if (index >= 0) {
      newProjects[index] = updatedProject;
    } else {
      newProjects.push(updatedProject);
    }
    saveToBackend({ projects: newProjects });
  };

  const handleDeleteProject = (projectId: string) => {
    if (!confirm('Xóa dự án này?')) return;
    const newProjects = projects.filter(p => p.id !== projectId);
    saveToBackend({ projects: newProjects });
  };

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-etechs-primary"></div>
      </div>
    );
  }

  const academicInterests = (profile.personalInfo?.favoriteSubjects || []).map(s => ({
    label: s,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  }));

  const personalInterests = (profile.personalInfo?.hobbies || []).map(h => ({
    label: h,
    icon: Heart,
  }));

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header Section */}
      <section className="bg-white dark:bg-card rounded-3xl p-8 border border-border shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-etechs-primary/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all duration-500 group-hover:bg-etechs-primary/10" />

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-between relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
            <div className="relative">
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-3xl border-4 border-white dark:border-background shadow-2xl overflow-hidden transform transition-transform duration-500 hover:scale-105">
                <img src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-etechs-primary text-etechs-secondary p-2 rounded-2xl border-4 border-white dark:border-background shadow-lg">
                <BadgeCheck className="w-6 h-6 fill-current" />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-foreground">{profile.displayName}</h1>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                  <p className="text-etechs-primary font-bold px-3 py-1 bg-etechs-primary/10 rounded-full text-xs uppercase tracking-widest">{profile.role || 'Member'}</p>
                  {profile.username && <span className="text-muted-foreground text-sm font-medium">@{profile.username}</span>}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-xl">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{(profile.personalInfo as any)?.location || 'Vietnam'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-xl">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span>Công khai</span>
                </div>
              </div>
              {profile.bio && <p className="text-sm text-muted-foreground max-w-md leading-relaxed">{profile.bio}</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <EditBasicInfoDialog
              initialData={{
                displayName: profile.displayName,
                username: profile.username || '',
                birthDate: profile.birthDate || '',
                bio: profile.bio || '',
                location: (profile.personalInfo as any)?.location || '',
              }}
              onSave={handleUpdateUserInfo}
              trigger={
                <Button className="bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90 rounded-2xl h-12 px-8 font-black shadow-lg shadow-etechs-primary/20 transition-all hover-lift">
                  <Edit2 className="w-4 h-4 mr-2" />
                  CHỈNH SỬA
                </Button>
              }
            />
            <Button variant="outline" className="rounded-2xl h-12 w-12 p-0 bg-secondary/50 border-0 hover:bg-secondary transition-all hover-lift">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-0">
        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all border-b-2 -mb-[1px] ${
            activeTab === 'about'
              ? 'border-etechs-primary text-etechs-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <User className="w-4 h-4" />
          Giới thiệu
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all border-b-2 -mb-[1px] ${
            activeTab === 'posts'
              ? 'border-etechs-primary text-etechs-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <FileText className="w-4 h-4" />
          Bài viết {total > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] font-bold">{total}</Badge>}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'about' ? (
        <>
          {/* About Tab */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Stats & Quota */}
        <div className="space-y-8">
          {profile.storageQuotaMb && <StorageQuotaCard quotaMb={profile.storageQuotaMb} />}

          <Card className="rounded-3xl border border-border shadow-xl overflow-hidden bg-gradient-to-br from-etechs-primary/10 to-transparent">
            <CardContent className="p-8 flex flex-col justify-center text-center">
              <h3 className="font-black text-lg mb-2">ĐỘ HOÀN THIỆN</h3>
              <div className="relative h-32 w-32 mx-auto my-4">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path className="text-muted/20 stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-etechs-primary stroke-current" strokeWidth="3" strokeDasharray="85, 100" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black">85%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Hồ sơ của bạn sắp hoàn thành. Thêm dự án để tăng uy tín!</p>
              <Button variant="outline" className="rounded-2xl font-bold border-etechs-primary/30 hover:bg-etechs-primary/10">
                Cập nhật ngay
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Academic & Interests */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-3xl border border-border shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-etechs-primary/20 rounded-xl">
                    <School className="w-5 h-5 text-etechs-primary" />
                  </div>
                  <CardTitle className="text-lg font-black">HỌC VẤN</CardTitle>
                </div>
                <EditAcademicBackgroundDialog
                  data={{
                    school: profile.personalInfo?.school || '',
                    degree: profile.personalInfo?.degree || '',
                    major: profile.personalInfo?.major || '',
                    graduationYear: profile.personalInfo?.graduationYear || '',
                  }}
                  onSave={handleUpdateAcademicBackground}
                  trigger={
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-xl">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {profile.personalInfo?.school ? (
                  <div className="flex items-center gap-4 bg-muted/30 p-5 rounded-2xl border-l-4 border-etechs-primary">
                    <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-inner shrink-0">
                      <img alt="University Logo" className="w-full h-full object-contain" src={`https://ui-avatars.com/api/?name=${profile.personalInfo.school}&background=random`} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-etechs-primary uppercase tracking-tighter">{profile.personalInfo.degree || 'Sinh viên'}</p>
                      <p className="text-base font-bold leading-tight">{profile.personalInfo.school}</p>
                      <p className="text-muted-foreground text-xs font-medium">
                        {profile.personalInfo.major} • {profile.personalInfo.graduationYear}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground italic text-sm">Chưa có thông tin trường học</div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500/10 rounded-xl">
                    <Heart className="w-5 h-5 text-pink-500" />
                  </div>
                  <CardTitle className="text-lg font-black">SỞ THÍCH</CardTitle>
                </div>
                <EditInterestsDialog
                  title="Sở thích cá nhân"
                  interests={personalInterests}
                  onSave={handleUpdatePersonalInterests}
                  trigger={
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-pink-500 rounded-xl">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  {personalInterests.length > 0 ? (
                    personalInterests.map(interest => {
                      const Icon = interest.icon || Heart;
                      return (
                        <div key={interest.label} className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-2xl border border-transparent hover:border-pink-500/30 hover:bg-pink-500/5 transition-all group">
                          <Icon className="w-4 h-4 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                          <span className="text-sm font-bold">{interest.label}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center w-full py-2 text-muted-foreground italic text-sm">Chưa thêm sở thích</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border border-border shadow-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gray-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                </div>
                <CardTitle className="text-lg font-black">LĨNH VỰC QUAN TÂM</CardTitle>
              </div>
              <EditInterestsDialog
                title="Lĩnh vực quan tâm"
                interests={academicInterests}
                onSave={handleUpdateAcademicInterests}
                predefinedList
                trigger={
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-blue-500 rounded-xl">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                {academicInterests.length > 0 ? (
                  academicInterests.map(tag => (
                    <Badge key={tag.label} variant="outline" className={`px-5 py-2 rounded-2xl text-sm font-black border-2 ${tag.color || 'bg-secondary/20'} transition-all hover:scale-105`}>
                      {tag.label}
                    </Badge>
                  ))
                ) : (
                  <div className="text-muted-foreground italic text-sm">Chưa có thông tin lĩnh vực</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Projects Section */}
      <section className="mt-12 space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="h-12 w-1.5 bg-etechs-primary rounded-full" />
            <h2 className="text-3xl font-black tracking-tighter uppercase">Dự án tiêu biểu</h2>
          </div>
          <EditProjectDialog
            mode="add"
            onSave={handleUpdateProject}
            trigger={
              <Button variant="outline" className="gap-2 rounded-2xl border-2 border-dashed h-11 px-6 font-bold hover:bg-muted/50 transition-all">
                <PlusCircle className="w-5 h-5" /> Thêm dự án
              </Button>
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-8">
          {projects.length > 0 ? (
            projects.map(project => (
              <div key={project.id} className="flex flex-col md:flex-row items-stretch justify-between gap-8 bg-white dark:bg-card rounded-[2.5rem] p-8 border border-border shadow-2xl hover:shadow- ete-primary/10 transition-all duration-500 group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <EditProjectDialog
                    project={project}
                    onSave={handleUpdateProject}
                    trigger={
                      <Button size="icon" variant="secondary" className="rounded-xl h-10 w-10 shadow-lg">
                        <Edit2 className="w-5 h-5" />
                      </Button>
                    }
                  />
                  <Button size="icon" variant="destructive" onClick={() => handleDeleteProject(project.id)} className="rounded-xl h-10 w-10 shadow-lg">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex flex-[3_3_0px] flex-col gap-6 justify-between relative z-10">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-etechs-primary text-xs font-black uppercase tracking-[0.2em]">{project.category}</p>
                      <h3 className="text-3xl font-black leading-tight group-hover:text-etechs-primary transition-colors">{project.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed line-clamp-3">{project.description}</p>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button className="bg-etechs-primary text-etechs-secondary font-black rounded-2xl h-12 px-8 shadow-lg shadow-etechs-primary/20 hover-lift">
                      <Terminal className="w-5 h-5 mr-2" /> XEM CHI TIẾT
                    </Button>
                    {project.sourceLink && (
                      <Button variant="ghost" onClick={() => window.open(project.sourceLink, '_blank')} className="font-bold rounded-2xl h-12 px-6 hover:bg-muted/50">
                        Mã nguồn
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-[250px] md:max-w-[400px] rounded-[2rem] shadow-2xl border-8 border-white dark:border-white/5 overflow-hidden group-hover:scale-[1.02] transition-transform duration-700">
                  <img src={project.imageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'} alt="Project" className="w-full h-full object-cover" />
                </div>
              </div>
            ))
          ) : (
            <div className="bg-muted/20 border-2 border-dashed border-border rounded-[3rem] p-20 text-center space-y-4 animate-pulse">
              <Terminal className="w-16 h-16 mx-auto text-muted-foreground/30" />
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-muted-foreground">BẮT ĐẦU CHIA SẺ DỰ ÁN</h3>
                <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">Thêm các dự án nghiên cứu hoặc phần mềm tiêu biểu của bạn để xây dựng hồ sơ chuyên nghiệp.</p>
              </div>
              <Button onClick={() => document.getElementById('add-project-btn')?.click()} variant="outline" className="rounded-2xl font-bold">
                Thêm ngay
              </Button>
            </div>
          )}
        </div>
      </section>
        </>
      ) : (
        /* Posts Tab */
        <div className="max-w-2xl mx-auto space-y-4">
          {postsLoading && posts.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl shadow-lg p-6 animate-pulse border border-border">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-card rounded-2xl shadow-lg p-12 text-center border border-border">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-xl font-bold text-muted-foreground mb-2">Chưa có bài viết nào</h3>
              <p className="text-sm text-muted-foreground/60">Hãy tạo bài viết đầu tiên từ trang chủ!</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={(postId, liked) => likePost(postId, liked)}
                  onComment={(postId) => setSelectedPostId(selectedPostId === postId ? null : postId)}
                  onShare={() => {}}
                  onDelete={(postId) => deletePost(postId)}
                  onEdit={(postId, content) => updatePost(postId, content)}
                  currentUserId={currentUser?.id || currentUser?.user_id}
                  showComments={selectedPostId === post.id}
                />
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={loadMoreRef} className="flex justify-center pt-4 pb-8 min-h-16">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Đang tải thêm...</span>
                  </div>
                )}
                {!hasNextPage && posts.length > 0 && (
                  <p className="text-muted-foreground text-sm">Đã xem hết bài viết</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
