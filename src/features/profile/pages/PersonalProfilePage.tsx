import { useProfile } from '../hooks/useProfile';
import type { User, Project } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, School, BookOpen, Heart } from 'lucide-react';
import { EditAcademicBackgroundDialog, EditInterestsDialog } from '../components/EditProfileDialogs';
import { StorageQuotaCard } from '../components/StorageQuotaCard';
import { Badge } from '@/components/ui/badge';
import { ProfileHeader } from '../components/personal-profile/ProfileHeader';
import { ProjectSection } from '../components/personal-profile/ProjectSection';

export function PersonalProfilePage() {
  const { profile: rawProfile, updateProfile, uploadAvatar, isUpdating, isLoading } = useProfile();
  const profile = rawProfile as User;

  const projects = profile?.personal_info?.projects ?? [];

  // --- Handlers for Backend Sync ---
  const saveToBackend = async (updates: any) => {
    try {
      await updateProfile({
        displayName: profile?.display_name || '',
        bio: profile?.bio || '',
        personal_info: {
          ...(profile?.personal_info || {}),
          ...updates,
        },
      });
    } catch (error) {
      console.error('Failed to sync profile:', error);
    }
  };

  const handleUpdateAcademicBackground = (newData: any) => {
    saveToBackend(newData);
  };

  const handleUpdateAcademicInterests = (newInterests: any) => {
    saveToBackend({ favorite_subjects: newInterests.map((i: any) => i.label) });
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

  const handleAvatarUpload = async (file: File) => {
    await uploadAvatar(file);
  };

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-etechs-primary"></div>
      </div>
    );
  }

  const academicInterests = (profile.personal_info?.favorite_subjects || []).map(s => ({
    label: s,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  }));

  const personalInterests = (profile.personal_info?.hobbies || []).map(h => ({
    label: h,
    icon: Heart,
  }));

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      <ProfileHeader profile={profile} isUpdating={isUpdating} onAvatarUpload={handleAvatarUpload} />

      {/* About Tab */}
          {/* About Tab */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Stats & Quota */}
        <div className="space-y-8">
          {profile.storage_quota_mb && <StorageQuotaCard quotaMb={profile.storage_quota_mb} />}
{/* 
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
          </Card> */}
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
                    education_level: profile.personal_info?.education_level || '',
                    school: profile.personal_info?.school || '',
                    major: profile.personal_info?.major || '',
                    class: profile.personal_info?.class || '',
                    academic_year: profile.personal_info?.academic_year || '',
                    school_year: profile.personal_info?.school_year || '',
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
                {profile.personal_info?.school ? (
                  <div className="flex items-center gap-4 bg-muted/30 p-5 rounded-2xl border-l-4 border-etechs-primary">
                    <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-inner shrink-0">
                      <img alt="School Logo" className="w-full h-full object-contain" src={`https://ui-avatars.com/api/?name=${profile.personal_info.school}&background=random`} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-etechs-primary uppercase tracking-tighter">
                        {profile.personal_info.education_level === 'university' ? 'Đại học/Cao đẳng' :
                         profile.personal_info.education_level === 'high' ? 'Trung học phổ thông' :
                         profile.personal_info.education_level === 'middle' ? 'Trung học cơ sở' :
                         profile.personal_info.education_level === 'elementary' ? 'Tiểu học' : 'Học sinh/Sinh viên'}
                      </p>
                      <p className="text-base font-bold leading-tight">{profile.personal_info.school}</p>
                      <p className="text-muted-foreground text-xs font-medium">
                        {profile.personal_info.education_level === 'university' ? (
                          `${profile.personal_info.major ? profile.personal_info.major + ' • ' : ''}${profile.personal_info.class ? profile.personal_info.class + ' • ' : ''}${profile.personal_info.academic_year || ''}`
                        ) : (
                          `${profile.personal_info.class ? profile.personal_info.class + ' • ' : ''}${profile.personal_info.school_year || ''}`
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground italic text-sm">Chưa có thông tin học vấn</div>
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

      <ProjectSection projects={projects} onSave={handleUpdateProject} />
    </div>
  );
}
