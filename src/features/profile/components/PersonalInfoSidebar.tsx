import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { School, Heart, MapPin, Calendar } from 'lucide-react';
import type { User } from '@/lib/api/generated/model';

interface PersonalInfoSidebarProps {
  profile?: User | null;
}

export function PersonalInfoSidebar({ profile }: PersonalInfoSidebarProps) {

  const personalInfo = profile?.personal_info;
  const hasContent =
    personalInfo?.school ||
    personalInfo?.class ||
    personalInfo?.location ||
    personalInfo?.favorite_subjects?.length ||
    personalInfo?.hobbies?.length ||
    profile?.created_at;

  return (
    <Card className="rounded-xl border-border shadow-sm bg-card">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-sm font-semibold">Thông tin cá nhân</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="px-5 py-5">
        {hasContent ? (
          <div className="space-y-4">
            {personalInfo?.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Vị trí</p>
                  <p className="text-sm font-medium">{personalInfo.location}</p>
                </div>
              </div>
            )}

            {personalInfo?.school && (
              <div className="flex items-start gap-3">
                <School className="w-4 h-4 text-etechs-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Trường học</p>
                  <p className="text-sm font-medium">{personalInfo.school}</p>
                  {personalInfo.class && (
                    <p className="text-xs text-muted-foreground">{personalInfo.class}</p>
                  )}
                </div>
              </div>
            )}

            {profile?.created_at && (
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Thành viên từ</p>
                  <p className="text-sm font-medium">
                    {new Date(profile.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )}

            {personalInfo?.favorite_subjects && personalInfo.favorite_subjects.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-pink-500" />
                  <p className="text-xs text-muted-foreground">Lĩnh vực quan tâm</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {personalInfo.favorite_subjects.slice(0, 5).map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                  {personalInfo.favorite_subjects.length > 5 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{personalInfo.favorite_subjects.length - 5}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {personalInfo?.hobbies && personalInfo.hobbies.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Sở thích</p>
                <div className="flex flex-wrap gap-1.5">
                  {personalInfo.hobbies.slice(0, 5).map((h, i) => (
                    <Badge key={i} className="bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-400 border-0 text-xs">
                      {h}
                    </Badge>
                  ))}
                  {personalInfo.hobbies.length > 5 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{personalInfo.hobbies.length - 5}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-center text-muted-foreground py-4">Chưa có thông tin cá nhân</p>
        )}
      </CardContent>
    </Card>
  );
}
