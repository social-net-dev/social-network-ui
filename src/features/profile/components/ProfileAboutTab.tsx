import { useProfile } from '../hooks/useProfile';
import type { User, Project } from '@/lib/api/generated/model';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit2, School, PlusCircle, BookOpen, Heart, Terminal, Wrench } from 'lucide-react';
import {
  EditAcademicBackgroundDialog,
  EditInterestsDialog,
  EditProjectDialog,
} from './EditProfileDialogs';
import { SkillsSection } from './SkillsSection';

interface ProfileAboutTabProps {
  profile: User;
  isCurrentUser: boolean;
}

export function ProfileAboutTab({ profile, isCurrentUser }: ProfileAboutTabProps) {
  const { updateProfile } = useProfile();

  const projects = profile?.personalInfo?.projects ?? [];

  const saveToBackend = async (updates: Record<string, unknown>) => {
    try {
      await updateProfile({
        displayName: profile?.displayName || '',
        bio: profile?.bio,
        personal_info: {
          ...(profile?.personalInfo || {}),
          ...updates,
        },
      });
    } catch (error) {
      console.error('Failed to sync profile:', error);
    }
  };

  const handleUpdateAcademicBackground = (newData: Record<string, unknown>) => saveToBackend(newData);
  const handleUpdateAcademicInterests = (newInterests: Array<{ label: string }>) =>
    saveToBackend({ favoriteSubjects: newInterests.map((i) => i.label) });
  const handleUpdatePersonalInterests = (newInterests: Array<{ label: string }>) =>
    saveToBackend({ hobbies: newInterests.map((i) => i.label) });

  const handleUpdateProject = (updatedProject: Project) => {
    const newProjects = [...projects];
    const index = newProjects.findIndex((p) => p.id === updatedProject.id);
    if (index >= 0) newProjects[index] = updatedProject;
    else newProjects.push(updatedProject);
    saveToBackend({ projects: newProjects });
  };

  const academicInterests = (profile.personalInfo?.favoriteSubjects || []).map((s) => ({
    label: s,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  }));

  const personalInterests = (profile.personalInfo?.hobbies || []).map((h) => ({
    label: h,
    icon: Heart,
  }));

  return (
    <div className="space-y-6">
      {/* Academic + Interests row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Education */}
        <Card className="rounded-xl border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-etechs-primary/15 rounded-lg">
                <School className="w-4 h-4 text-etechs-primary" />
              </div>
              <CardTitle className="text-sm font-semibold">Học vấn</CardTitle>
            </div>
            {isCurrentUser && (
              <EditAcademicBackgroundDialog
                data={{
                  educationLevel: profile.personalInfo?.educationLevel || '',
                  school: profile.personalInfo?.school || '',
                  major: profile.personalInfo?.major || '',
                  class: profile.personalInfo?.class || '',
                  academicYear: profile.personalInfo?.academicYear || '',
                  schoolYear: profile.personalInfo?.schoolYear || '',
                }}
                onSave={handleUpdateAcademicBackground}
                trigger={
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                }
              />
            )}
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {profile.personalInfo?.school ? (
              <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg border-l-4 border-etechs-primary">
                <div className="h-10 w-10 bg-card rounded-lg flex items-center justify-center shadow-sm shrink-0">
                  <img
                    alt="School"
                    className="w-full h-full object-contain rounded-lg p-1"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.personalInfo.school)}&background=random`}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-etechs-primary uppercase tracking-wide">
                    {profile.personalInfo.educationLevel === 'university'
                      ? 'Đại học / Cao đẳng'
                      : profile.personalInfo.educationLevel === 'high'
                      ? 'Trung học phổ thông'
                      : 'Học sinh / Sinh viên'}
                  </p>
                  <p className="text-sm font-semibold leading-snug">{profile.personalInfo.school}</p>
                  {(profile.personalInfo.major || profile.personalInfo.class) && (
                    <p className="text-xs text-muted-foreground">
                      {[profile.personalInfo.major, profile.personalInfo.class].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 italic">Chưa có thông tin học vấn</p>
            )}
          </CardContent>
        </Card>

        {/* Personal interests */}
        <Card className="rounded-xl border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-pink-500/10 rounded-lg">
                <Heart className="w-4 h-4 text-pink-500" />
              </div>
              <CardTitle className="text-sm font-semibold">Sở thích</CardTitle>
            </div>
            {isCurrentUser && (
              <EditInterestsDialog
                title="Sở thích cá nhân"
                interests={personalInterests}
                onSave={handleUpdatePersonalInterests}
                trigger={
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-pink-500 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                }
              />
            )}
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex flex-wrap gap-2">
              {personalInterests.length > 0 ? (
                personalInterests.map((interest) => {
                  const Icon = interest.icon || Heart;
                  return (
                    <div
                      key={interest.label}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-transparent hover:border-pink-500/30 hover:bg-pink-500/5 transition-all"
                    >
                      <Icon className="w-3.5 h-3.5 text-pink-400" />
                      <span className="text-sm">{interest.label}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center w-full py-4 italic">Chưa thêm sở thích</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic fields */}
      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <CardTitle className="text-sm font-semibold">Lĩnh vực quan tâm</CardTitle>
          </div>
          {isCurrentUser && (
            <EditInterestsDialog
              title="Lĩnh vực quan tâm"
              interests={academicInterests}
              onSave={handleUpdateAcademicInterests}
              predefinedList
              trigger={
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-500 rounded-lg">
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              }
            />
          )}
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex flex-wrap gap-2">
            {academicInterests.length > 0 ? (
              academicInterests.map((tag) => (
                <Badge
                  key={tag.label}
                  variant="outline"
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border ${tag.color || 'bg-secondary/20'} transition-all hover:scale-105`}
                >
                  {tag.label}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">Chưa có thông tin lĩnh vực</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-etechs-primary rounded-full" />
            <h2 className="text-base font-bold tracking-tight">Dự án tiêu biểu</h2>
          </div>
          {isCurrentUser && (
            <EditProjectDialog
              mode="add"
              onSave={handleUpdateProject}
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5 rounded-lg border-dashed font-medium hover:bg-muted/50">
                  <PlusCircle className="w-4 h-4" />
                  Thêm dự án
                </Button>
              }
            />
          )}
        </div>

        {projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="rounded-xl border border-border shadow-sm overflow-hidden group/project hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row gap-0">
                    {project.imageUrl && (
                      <div className="sm:w-48 h-36 sm:h-auto shrink-0 overflow-hidden">
                        <img
                          src={project.imageUrl}
                          alt={project.title}
                          className="w-full h-full object-cover group-project:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                      <div>
                        {project.category && (
                          <p className="text-xs font-semibold text-etechs-primary uppercase tracking-wide mb-1">
                            {project.category}
                          </p>
                        )}
                        <h3 className="text-base font-bold leading-snug mb-1">{project.title}</h3>
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{project.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {project.sourceLink && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(project.sourceLink, '_blank')}
                            className="rounded-lg text-xs h-8"
                          >
                            Mã nguồn
                          </Button>
                        )}
                        {isCurrentUser && (
                          <EditProjectDialog
                            project={project}
                            onSave={handleUpdateProject}
                            trigger={
                              <Button variant="ghost" size="sm" className="rounded-lg text-xs h-8 opacity-0 group-hover/project:opacity-100 transition-opacity">
                                <Edit2 className="w-3.5 h-3.5 mr-1" />
                                Sửa
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-xl border-2 border-dashed border-border bg-muted/20">
            <CardContent className="p-10 text-center">
              <Terminal className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">Chưa có dự án nào</h3>
              <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto">
                Thêm các dự án nghiên cứu hoặc phần mềm tiêu biểu để xây dựng hồ sơ chuyên nghiệp.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Skills Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-purple-500 rounded-full" />
          <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
            <Wrench className="w-4 h-4 text-purple-500" />
            Kỹ năng
          </h2>
        </div>
        <SkillsSection />
      </div>
    </div>
  );
}
