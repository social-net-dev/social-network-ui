import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Edit2, MapPin, Loader2 } from 'lucide-react';
import type { User } from '@/lib/api/types';

interface ProfileHeaderProps {
  profile: User;
  isUpdating: boolean;
  onAvatarUpload: (file: File) => void;
}

export function ProfileHeader({ profile, isUpdating, onAvatarUpload }: ProfileHeaderProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        onAvatarUpload(file);
      } catch {
        alert('Không thể tải lên ảnh đại diện');
      }
    }
  };

  return (
    <section className="bg-white dark:bg-card rounded-3xl p-8 border border-border shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-etechs-primary/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all duration-500 group-hover:bg-etechs-primary/10" />

      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-between relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <div
              className="h-32 w-32 md:h-40 md:w-40 rounded-3xl border-4 border-white dark:border-background shadow-2xl overflow-hidden transform transition-transform duration-500 hover:scale-105 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUpdating ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <img
                  src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {!isUpdating && (
              <div
                className="absolute bottom-2 right-2 p-1.5 bg-etechs-primary text-etechs-secondary rounded-full shadow-sm cursor-pointer border-2 border-white dark:border-background hover:scale-110 transition-transform"
                onClick={() => fileInputRef.current?.click()}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">{profile.display_name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                <p className="text-etechs-primary font-bold px-3 py-1 bg-etechs-primary/10 rounded-full text-xs uppercase tracking-widest">
                  {profile.role || 'Member'}
                </p>
                {profile.username && <span className="text-muted-foreground text-sm font-medium">@{profile.username}</span>}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-xl">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{profile.personal_info?.location || 'Vietnam'}</span>
              </div>
            </div>
            {profile.bio && <p className="text-sm text-muted-foreground max-w-md leading-relaxed">{profile.bio}</p>}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/settings')}
            className="bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90 rounded-2xl h-12 px-8 font-black shadow-lg shadow-etechs-primary/20 transition-all hover-lift"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            CHỈNH SỬA
          </Button>
        </div>
      </div>
    </section>
  );
}
