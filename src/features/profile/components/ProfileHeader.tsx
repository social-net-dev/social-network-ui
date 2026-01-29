import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Link as LinkIcon, Edit2, Share2, MoreHorizontal, Camera, CheckCircle2 } from "lucide-react"
import type { ProfileData } from "../types/profile.types"

interface ProfileHeaderProps {
  profile: ProfileData
  isCurrentUser?: boolean
  onEdit?: () => void
}

export function ProfileHeader({ profile, isCurrentUser = false, onEdit }: ProfileHeaderProps) {
  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden group">
      {/* Compact Cover Image */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-r from-etechs-secondary/80 to-etechs-primary/80">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        
        {isCurrentUser && (
          <Button 
            size="sm" 
            variant="secondary"
            className="absolute top-4 right-4 h-8 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
          >
            <Camera className="w-4 h-4 mr-2" />
            Cập nhật ảnh bìa
          </Button>
        )}
      </div>

      <div className="px-6 pb-6">
        <div className="relative flex flex-col sm:flex-row items-start sm:items-end -mt-12 sm:-mt-16 gap-4 sm:gap-6">
          {/* Avatar Section */}
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-card shadow-sm ring-1 ring-border/10">
              <AvatarImage src={profile.avatar} alt={`${profile.firstName} ${profile.lastName}`} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            {isCurrentUser && (
              <div className="absolute bottom-0 right-0 p-1.5 bg-etechs-primary text-etechs-secondary rounded-full shadow-sm cursor-pointer border-2 border-card hover:scale-110 transition-transform">
                <Edit2 className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1 min-w-0 pt-2 sm:pb-1 w-full text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground truncate">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  {isCurrentUser && <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/10" />}
                  <Badge variant="secondary" className="bg-etechs-primary/10 text-etechs-secondary dark:text-etechs-primary hover:bg-etechs-primary/20 border-0 h-5 px-2 text-[10px] uppercase font-bold tracking-wider">
                    PRO
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm font-medium">@{profile.email?.split('@')[0]}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-2">
                {isCurrentUser ? (
                  <Button onClick={onEdit} className="bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90 h-9 px-4 rounded-lg font-medium text-sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                ) : (
                  <Button className="bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90 h-9 px-6 rounded-lg font-medium text-sm">
                    Theo dõi
                  </Button>
                )}
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border bg-background hover:bg-muted">
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bio & Details - Indented on Desktop to align with Name */}
        <div className="mt-6 sm:ml-[152px]">
          {profile.bio && (
            <p className="text-foreground/80 leading-relaxed mb-4 text-sm max-w-2xl text-center sm:text-left">
              {profile.bio}
            </p>
          )}
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{profile.location || "Việt Nam"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 shrink-0" />
              <a href={profile.website || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-etechs-primary hover:underline transition-colors">
                {profile.website?.replace(/^https?:\/\//, '') || "etechs.vn"}
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Tham gia {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : "tháng 1/2024"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
