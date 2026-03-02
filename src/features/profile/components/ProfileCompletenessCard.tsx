import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import type { User } from '@/lib/api/generated/model';

interface ProfileCompletenessCardProps {
  profile: User | null | undefined;
  onEdit?: () => void;
}

interface CompletenessItem {
  label: string;
  done: boolean;
}

function getCompletenessItems(profile: User | null | undefined): CompletenessItem[] {
  if (!profile) return [];
  return [
    { label: 'Ảnh đại diện', done: !!profile.avatar },
    { label: 'Tên hiển thị', done: !!profile.display_name },
    { label: 'Giới thiệu bản thân', done: !!profile.bio },
    { label: 'Trường học', done: !!profile.personal_info?.school },
    { label: 'Vị trí', done: !!profile.personal_info?.location },
    { label: 'Lĩnh vực quan tâm', done: (profile.personal_info?.favorite_subjects?.length ?? 0) > 0 },
    { label: 'Sở thích', done: (profile.personal_info?.hobbies?.length ?? 0) > 0 },
    { label: 'Ảnh bìa', done: !!profile.background },
  ];
}

export function ProfileCompletenessCard({ profile, onEdit }: ProfileCompletenessCardProps) {
  const items = getCompletenessItems(profile);
  const doneCount = items.filter((i) => i.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  if (percent === 100) return null;

  const pendingItems = items.filter((i) => !i.done).slice(0, 3);

  return (
    <Card className="rounded-xl border-border shadow-sm bg-card overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-5 flex flex-row items-center gap-2">
        <Sparkles className="w-4 h-4 text-etechs-primary" />
        <CardTitle className="text-sm font-semibold">Hoàn thiện hồ sơ</CardTitle>
        <Badge
          variant="secondary"
          className="ml-auto text-xs font-bold bg-etechs-primary/10 text-etechs-secondary dark:text-etechs-primary border-0"
        >
          {percent}%
        </Badge>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-3">
        <Progress value={percent} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {doneCount}/{items.length} mục đã hoàn thành
        </p>
        <div className="space-y-2">
          {pendingItems.map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-2.5 w-full text-left group hover:text-primary transition-colors"
              onClick={onEdit}
            >
              <Circle className="w-4 h-4 text-muted-foreground/50 shrink-0 group-hover:text-primary transition-colors" />
              <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                Thêm {item.label.toLowerCase()}
              </span>
            </button>
          ))}
          {items.filter((i) => i.done).slice(0, 2).map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs text-muted-foreground line-through">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
