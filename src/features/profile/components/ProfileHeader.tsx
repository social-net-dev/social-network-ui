import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Link as LinkIcon, Edit2, Share2, MoreHorizontal, Camera, Shield, Crown } from "lucide-react"
import type { ProfileData } from "../types/profile.types"

interface ProfileHeaderProps {
  profile: ProfileData
  isCurrentUser?: boolean
  onEdit?: () => void
}

export function ProfileHeader({ profile, isCurrentUser = false, onEdit }: ProfileHeaderProps) {
  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`

  return (
    <div className="bg-white dark:bg-card rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-2xl">
      {/* Cover Image Area */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-etechs-secondary via-teal-700 to-blue-800 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-etechs-secondary/90 via-etechs-secondary/50 to-transparent" />
        
        {isCurrentUser && (
          <Button 
            size="icon" 
            variant="ghost"
            className="absolute top-4 right-4 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
          >
            <Camera className="w-4 h-4" />
          </Button>
        )}

        <div className="absolute top-4 right-16 flex gap-2">
            <Button size="icon" variant="ghost" className="rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300 hover:scale-110">
                <Share2 className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300 hover:scale-110">
                <MoreHorizontal className="w-4 h-4" />
            </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2">
            <Badge className="bg-etechs-primary text-etechs-secondary font-bold border-none px-4 py-1.5 text-sm">
              <Crown className="w-3.5 h-3.5 mr-1.5" />
              Pro Member
            </Badge>
            {isCurrentUser && (
              <Badge variant="outline" className="bg-white/10 backdrop-blur-sm text-white border-white/20 px-3 py-1.5 text-sm hover:bg-white/20 transition-colors">
                <Shield className="w-3.5 h-3.5 mr-1" />
                Đã xác minh
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 pb-8">
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:space-x-8 -mt-16 sm:-mt-20">
          <div className="relative group">
            <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-white dark:border-card shadow-2xl transition-transform duration-300 group-hover:scale-[1.02] ring-4 ring-etechs-primary/20">
              <AvatarImage src={profile.avatar} alt={`${profile.firstName} ${profile.lastName}`} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-etechs-secondary to-etechs-primary text-white text-3xl font-bold">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            {isCurrentUser && (
                <div className="absolute bottom-2 right-2 p-2 bg-etechs-primary text-etechs-secondary rounded-full shadow-lg cursor-pointer hover:bg-white transition-colors border-2 border-white dark:border-card hover:scale-110 transition-all duration-300">
                    <Edit2 className="w-4 h-4" />
                </div>
            )}
          </div>

          <div className="mt-6 sm:mt-0 sm:mb-2 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                {profile.firstName} {profile.lastName}
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">{profile.email}</p>
          </div>

          <div className="mt-6 sm:mt-0 flex gap-3">
            {isCurrentUser ? (
              <Button onClick={onEdit} className="rounded-xl bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90 font-bold px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Edit2 className="w-4 h-4 mr-2" />
                Chỉnh sửa hồ sơ
              </Button>
            ) : (
              <Button className="rounded-xl bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90 font-bold px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                Theo dõi
              </Button>
            )}
          </div>
        </div>

        {profile.bio && (
          <div className="mt-8 max-w-2xl">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg border-l-4 border-etechs-primary pl-4 italic">
              "{profile.bio}"
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2 group cursor-default hover:bg-gray-50 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 group-hover:bg-etechs-primary/10 transition-colors">
              <MapPin className="w-4 h-4 text-etechs-secondary dark:text-etechs-primary group-hover:scale-110 transition-transform" />
            </div>
            <span className="group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              {profile.location || "Việt Nam"}
            </span>
          </div>
          <div className="flex items-center gap-2 group cursor-default hover:bg-gray-50 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 group-hover:bg-etechs-primary/10 transition-colors">
              <Calendar className="w-4 h-4 text-etechs-secondary dark:text-etechs-primary group-hover:scale-110 transition-transform" />
            </div>
            <span className="group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              Tham gia {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : "tháng 1/2024"}
            </span>
          </div>
          {profile.website && (
            <div className="flex items-center gap-2 group hover:bg-gray-50 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
              <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 group-hover:bg-etechs-primary/10 transition-colors">
                <LinkIcon className="w-4 h-4 text-etechs-secondary dark:text-etechs-primary group-hover:scale-110 transition-transform" />
              </div>
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-etechs-secondary dark:hover:text-etechs-primary transition-colors font-medium group-hover:underline">
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
