import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Link as LinkIcon, Edit2, Share2, MoreHorizontal } from "lucide-react"
import type { ProfileData } from "../types/profile.types"

interface ProfileHeaderProps {
  profile: ProfileData
  isCurrentUser?: boolean
  onEdit?: () => void
}

export function ProfileHeader({ profile, isCurrentUser = false, onEdit }: ProfileHeaderProps) {
  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`

  return (
    <div className="bg-white dark:bg-card rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300">
      {/* Cover Image Area */}
      <div className="relative h-48 sm:h-64 bg-etechs-secondary overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-etechs-secondary/80 to-transparent" />
        
        {/* Abstract design elements */}
        <div className="absolute top-4 right-4 flex gap-2">
            <Button size="icon" variant="ghost" className="rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20">
                <Share2 className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20">
                <MoreHorizontal className="w-4 h-4" />
            </Button>
        </div>
      </div>

      <div className="px-6 sm:px-8 pb-8">
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:space-x-8 -mt-16 sm:-mt-20">
          <div className="relative group">
            <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-white dark:border-card shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]">
              <AvatarImage src={profile.avatar} alt={`${profile.firstName} ${profile.lastName}`} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-etechs-secondary to-etechs-primary text-white text-3xl font-bold">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            {isCurrentUser && (
                <div className="absolute bottom-2 right-2 p-2 bg-etechs-primary text-etechs-secondary rounded-full shadow-lg cursor-pointer hover:bg-white transition-colors border-2 border-white dark:border-card">
                    <Edit2 className="w-4 h-4" />
                </div>
            )}
          </div>

          <div className="mt-6 sm:mt-0 sm:mb-2 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {profile.firstName} {profile.lastName}
              </h1>
              <Badge variant="secondary" className="bg-etechs-primary/10 text-etechs-secondary dark:text-etechs-primary hover:bg-etechs-primary/20 border-none px-3 py-1">
                Pro Member
              </Badge>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">{profile.email}</p>
          </div>

          <div className="mt-6 sm:mt-0 flex gap-3">
            {isCurrentUser ? (
              <Button onClick={onEdit} className="rounded-xl bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90 font-bold px-6">
                <Edit2 className="w-4 h-4 mr-2" />
                Chỉnh sửa hồ sơ
              </Button>
            ) : (
              <Button className="rounded-xl bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90 font-bold px-6">
                Theo dõi
              </Button>
            )}
          </div>
        </div>

        {profile.bio && (
          <div className="mt-8 max-w-2xl">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
              "{profile.bio}"
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 group-hover:bg-etechs-primary/10 transition-colors">
              <MapPin className="w-4 h-4 text-etechs-secondary dark:text-etechs-primary" />
            </div>
            <span>Hồ Chí Minh, Việt Nam</span>
          </div>
          <div className="flex items-center gap-2 group cursor-default">
            <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 group-hover:bg-etechs-primary/10 transition-colors">
              <Calendar className="w-4 h-4 text-etechs-secondary dark:text-etechs-primary" />
            </div>
            <span>Tham gia tháng 1/2024</span>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 group-hover:bg-etechs-primary/10 transition-colors">
              <LinkIcon className="w-4 h-4 text-etechs-secondary dark:text-etechs-primary" />
            </div>
            <a href="#" className="hover:text-etechs-secondary dark:hover:text-etechs-primary transition-colors font-medium">
              etechs.vn
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
