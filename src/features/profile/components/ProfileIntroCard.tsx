import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, School, Heart, MessageCircle, Share2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { User, UserPublic } from '@/lib/api/generated/model';

interface ProfileIntroCardProps {
  profile: User | UserPublic | null | undefined;
  isCurrentUser?: boolean;
}

export function ProfileIntroCard({ profile, isCurrentUser = false }: ProfileIntroCardProps) {
  const navigate = useNavigate();
  const personalInfo = profile?.personalInfo;

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Đã sao chép liên kết hồ sơ!');
    }).catch(() => {
      toast.error('Không thể sao chép liên kết');
    });
  };

  if (!profile) return null;

  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    : null;

  const hasInfo =
    profile.bio ||
    personalInfo?.location ||
    personalInfo?.school ||
    personalInfo?.favoriteSubjects?.length ||
    personalInfo?.hobbies?.length ||
    joinDate;

  return (
    <Card className="rounded-xl border-border shadow-sm bg-card">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-sm font-semibold">Giới thiệu</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="px-5 py-5 space-y-4">
        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4">{profile.bio}</p>
        )}

        {hasInfo ? (
          <div className="space-y-3">
            {personalInfo?.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-foreground/90">{personalInfo.location}</span>
              </div>
            )}

            {personalInfo?.school && (
              <div className="flex items-start gap-3 text-sm">
                <School className="w-4 h-4 text-etechs-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-foreground/90 font-medium">{personalInfo.school}</span>
                  {personalInfo.major && (
                    <p className="text-xs text-muted-foreground">{personalInfo.major}</p>
                  )}
                  {personalInfo.class && (
                    <p className="text-xs text-muted-foreground">{personalInfo.class}</p>
                  )}
                </div>
              </div>
            )}

            {joinDate && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Tham gia {joinDate}</span>
              </div>
            )}

            {personalInfo?.favoriteSubjects && personalInfo.favoriteSubjects.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-xs font-medium text-muted-foreground">Lĩnh vực quan tâm</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {personalInfo.favoriteSubjects.slice(0, 4).map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                      {s}
                    </Badge>
                  ))}
                  {personalInfo.favoriteSubjects.length > 4 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{personalInfo.favoriteSubjects.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {personalInfo?.hobbies && personalInfo.hobbies.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-pink-500" />
                  <p className="text-xs font-medium text-muted-foreground">Sở thích</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {personalInfo.hobbies.slice(0, 4).map((h, i) => (
                    <Badge key={i} className="text-xs bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400 border-0">
                      {h}
                    </Badge>
                  ))}
                  {personalInfo.hobbies.length > 4 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{personalInfo.hobbies.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          !isCurrentUser && (
            <p className="text-sm text-center text-muted-foreground py-2 italic">Chưa có thông tin giới thiệu</p>
          )
        )}

        {/* Action buttons for other users */}
        {!isCurrentUser && profile.id && (
          <>
            {hasInfo && <Separator />}
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-9 text-sm gap-1.5"
                onClick={() => navigate(`/messages/${profile.id}`)}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Nhắn tin
              </Button>
              <Button variant="outline" className="w-full rounded-lg h-9 text-sm gap-1.5" onClick={handleShare}>
                <Share2 className="w-3.5 h-3.5" />
                Chia sẻ
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
